#!/usr/bin/env bash
#
# Exercises a served deployment of this site.
#
#   scripts/smoke.sh https://example.org [/route ...]
#
# Needs bash 4 or newer, curl, node, and a deployment already serving at that URL.
#
# `set -e` is absent on purpose: several checks read the exit code of a command that
# legitimately returns nonzero, and every such code is read where it is produced.

# Associative arrays, mapfile and case conversion need bash 4; under bash 3 they fail one by
# one mid-run. Everything above this exit stays bash 2 syntax, or the message never prints.
if [ -z "${BASH_VERSINFO+set}" ] || [ "${BASH_VERSINFO[0]}" -lt 4 ]; then
  printf 'this script needs bash 4 or newer; %s is bash %s\n' \
    "${BASH:-bash}" "${BASH_VERSION:-unknown}" >&2
  exit 2
fi

set -u

# The address the policy page publishes; a policy page without it is broken.
readonly PRIVACY_CONTACT='mailto:privacy@halogenos.org'
readonly PRIVACY_ROUTE='/privacy'

# A path no route maps to, requested to prove the 404 and that an error response sets no
# cookie either.
readonly MISSING_PATH='/no-such-page-smoke-check'

readonly TIMEOUT=20

# One quoted attribute value, in either quote style; both scrapers below match with it.
readonly QUOTED_VALUE="(\"[^\"]*\"|'[^']*')"

if (( $# < 1 )); then
  printf 'usage: %s <deployment-base-url> [/route ...]\n' "${0##*/}" >&2
  exit 2
fi

for tool in curl node; do
  if ! command -v "$tool" > /dev/null 2>&1; then
    printf '%s is required and was not found\n' "$tool" >&2
    exit 2
  fi
done

# A trailing slash would turn every request into a double-slash path, which some servers
# answer differently.
base=$1
while [[ $base == */ ]]; do base=${base%/}; done

if [[ ! $base =~ ^([a-zA-Z][a-zA-Z0-9+.-]*)://([^/]+)(/.*)?$ ]]; then
  printf 'not a base URL: %s\n' "$1" >&2
  exit 2
fi
scheme=${BASH_REMATCH[1]}
authority=${BASH_REMATCH[2]}

# Credentials in the authority would be printed by every line naming a URL, so the URL is
# refused and the message repeats none of it.
if [[ $authority == *@* ]]; then
  printf 'the base URL carries credentials before the host; pass one without user:pass@\n' >&2
  exit 2
fi
origin="$scheme://$authority"

# A malformed extra route ends the run here, before any request goes out.
shift
extra_routes=()
for arg in "$@"; do
  # Anchored at the start: a genuine path may carry a URL inside its query string.
  if [[ $arg =~ ^[a-zA-Z][a-zA-Z0-9+.-]*:// ]]; then
    printf 'not a route path: %s (extra routes are paths starting with /, not URLs)\n' "$arg" >&2
    exit 2
  fi
  if [[ $arg != /* ]]; then
    printf 'not a route path: %s (extra routes are paths starting with /)\n' "$arg" >&2
    exit 2
  fi
  # Whitespace would split the printed route list, break the duplicate check and reach curl
  # unencoded; a space in a path is written %20.
  if [[ $arg =~ [[:space:]] ]]; then
    printf 'not a route path: %s (a route argument is one token; write a space as %%20)\n' "$arg" >&2
    exit 2
  fi
  route=$arg
  # Same reason as the base: a trailing slash would double the slash of the joined URL.
  while [[ $route == */ ]]; do route=${route%/}; done
  # The root strips down to nothing by that rule; it becomes / again and the merge below
  # reports it as already checked.
  route=${route:-/}
  extra_routes+=("$route")
done

if ! scratch=$(mktemp -d); then
  printf 'could not create a temporary directory for the response bodies\n' >&2
  exit 2
fi
trap 'rm -rf "$scratch"' EXIT
hdr="$scratch/headers"
body="$scratch/body"
err="$scratch/curl-error"
asset="$scratch/asset.mjs"

checks=0
failures=0
responses=0
cookie_sources=()
declare -A code_verdict=()

pass() {
  checks=$((checks + 1))
  printf 'pass  %s\n' "$*"
}

fail() {
  checks=$((checks + 1))
  failures=$((failures + 1))
  printf 'FAIL  %s\n' "$*"
}

# Not a check: something the run decided not to look at, said out loud.
note() {
  printf 'skip  %s\n' "$*"
}

http_code=000
http_error=''

# Fetches a URL into the shared header and body files. Returns nonzero when the request never
# completed, leaving the reason in http_error. Every response is scanned for cookies here,
# so no fetch can escape that check.
fetch() {
  local url=$1 out rc
  http_code=000
  http_error=''
  : > "$hdr"
  : > "$body"
  out=$(curl --silent --show-error --max-time "$TIMEOUT" --dump-header "$hdr" \
    --output "$body" --write-out '%{http_code}' -- "$url" 2> "$err")
  rc=$?
  if (( rc != 0 )); then
    # curl's message is folded onto one line; the trailing space that leaves is trimmed.
    http_error=$(tr '\n' ' ' < "$err")
    while [[ $http_error == *' ' ]]; do http_error=${http_error% }; done
    http_error=${http_error:-"curl exited $rc"}
    return 1
  fi
  http_code=$out
  responses=$((responses + 1))
  if grep -q -i '^set-cookie:' "$hdr"; then
    cookie_sources+=("$url")
  fi
  return 0
}

header_value() {
  # Header names are case-insensitive on the wire, so the match is too.
  grep -i -m1 "^$1:" "$hdr" | tr -d '\r'
}

# Resolves one reference against the URL of the page that carried it, the way a browser
# does: a reference with no leading slash is relative to the page's directory, not to the
# deployment base. The caller checks the result against the origin.
resolve_url() {
  local page=$1 ref=$2
  case $ref in
    //*) printf '%s' "$scheme:$ref" ;;
    /*) printf '%s' "$origin$ref" ;;
    *://*) printf '%s' "$ref" ;;
    *) printf '%s' "${page%/*}/$ref" ;;
  esac
}

# Strips name="value" or name='value' down to the value.
attr_value() {
  sed -E 's/.*=["'"'"']//; s/["'"'"']$//'
}

# Prints `kind reference` per line for every code file the body names: external script src
# first, then modulepreload href. Only quoted attribute values are read and no entity
# decoding happens: an unquoted or entity-escaped URL shows up as a missing reference, never
# as a silent pass.
code_refs() {
  local flat
  flat=$(tr '\n' ' ' < "$body")
  printf '%s\n' "$flat" \
    | grep -o -i -E "<script[^>]*[[:space:]]src=$QUOTED_VALUE" \
    | attr_value \
    | sed 's/^/script /'
  printf '%s\n' "$flat" \
    | grep -o -i -E '<link[^>]*>' \
    | grep -i -E "[[:space:]]rel=[\"']modulepreload[\"']" \
    | grep -o -i -E "[[:space:]]href=$QUOTED_VALUE" \
    | attr_value \
    | sed 's/^/module /'
}

# Fetches one code file and parses it, leaving the verdict in code_status. The copy is named
# .mjs so node parses it as an ES module. Each URL is fetched once; the verdict is reused per
# reference, and code_seen says when a line is that reuse. Call it plainly, never in a
# command substitution, or the response count and cookie scan of its fetch are lost.
code_status=''
code_seen=''
check_code() {
  local url=$1 detail
  code_seen=''
  if [[ -n ${code_verdict[$url]+set} ]]; then
    code_status=${code_verdict[$url]}
    code_seen=' (verdict reused, fetched once earlier in this run)'
    return 0
  fi
  if ! fetch "$url"; then
    code_verdict[$url]="is unreachable: $http_error"
  elif [[ $http_code != 200 ]]; then
    code_verdict[$url]="answered HTTP $http_code"
  elif [[ ! -s $body ]]; then
    code_verdict[$url]='was served with an empty body'
  else
    cp -- "$body" "$asset"
    if detail=$(node --check "$asset" 2>&1); then
      code_verdict[$url]=ok
    else
      detail=$(printf '%s\n' "$detail" | grep -m1 -i 'error' | tr -d '\r')
      code_verdict[$url]="does not parse: ${detail:-syntax check failed}"
    fi
  fi
  code_status=${code_verdict[$url]}
}

# The routes are derived from the pages directory, so it stays the only place the route
# list is recorded.
here=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P) || exit 2
pages="$here/../app/pages"
if [[ ! -d $pages ]]; then
  printf 'no pages directory at %s; run this script from inside the repository\n' "$pages" >&2
  exit 2
fi

routes=()

# Walks the pages directory the way the router reads it: pages/foo/bar.vue is /foo/bar and
# pages/foo/index.vue is /foo. A dynamic segment or a non-page file is reported as present
# and unchecked, never as absent.
derive_routes() {
  local dir=$1 prefix=$2 entry name rel
  for entry in "$dir"/*; do
    [[ -e $entry ]] || continue
    name=${entry##*/}
    rel=${entry#"$pages"/}
    if [[ -d $entry ]]; then
      if [[ $name =~ ^[A-Za-z0-9][A-Za-z0-9-]*$ ]]; then
        derive_routes "$entry" "$prefix/$name"
      else
        note "pages/$rel/ exists but is not checked: a dynamic segment needs a value this run does not have;" \
          "name the routes it builds as extra arguments to check them"
      fi
      continue
    fi
    if [[ $name != *.vue ]]; then
      note "pages/$rel exists but is not checked: it is not a page component"
      continue
    fi
    name=${name%.vue}
    if [[ $name == index ]]; then
      routes+=("${prefix:-/}")
    elif [[ $name =~ ^[A-Za-z0-9][A-Za-z0-9-]*$ ]]; then
      routes+=("$prefix/$name")
    else
      note "pages/$rel exists but is not checked: a dynamic segment needs a value this run does not have;" \
        "name the routes it builds as extra arguments to check them"
    fi
  done
}

derive_routes "$pages" ''

# The root route is moved to the front so the report reads from the top of the site down.
ordered=()
for route in "${routes[@]:+${routes[@]}}"; do
  if [[ $route == / ]]; then ordered+=("$route"); fi
done
for route in "${routes[@]:+${routes[@]}}"; do
  if [[ $route != / ]]; then ordered+=("$route"); fi
done
routes=("${ordered[@]:+${ordered[@]}}")

# Extra routes join the derived ones; a route already on the list is dropped so it is not
# counted twice in the report.
for route in "${extra_routes[@]:+${extra_routes[@]}}"; do
  if [[ " ${routes[*]} " == *" $route "* ]]; then
    note "$route is already among the routes this run checks, so it is not checked a second time"
  else
    routes+=("$route")
  fi
done

# Counted after the merge, so a pages directory that yields nothing still runs when the
# arguments name routes.
if (( ${#routes[@]} == 0 )); then
  printf 'no routes to check: none derived from %s and none named as arguments\n' "$pages" >&2
  exit 2
fi

printf 'checking %s\nroutes: %s\n\n' "$base" "${routes[*]}"

# The contact check runs on one route only, so a renamed policy page would take the check
# with it and leave a green run behind; the route's presence is a check of its own.
if [[ " ${routes[*]} " == *" $PRIVACY_ROUTE "* ]]; then
  pass "$PRIVACY_ROUTE is among the routes this run checks"
else
  fail "$PRIVACY_ROUTE is not among the routes this run checks, so $PRIVACY_CONTACT went unchecked"
fi

for route in "${routes[@]}"; do
  url="$base$route"
  if ! fetch "$url"; then
    fail "GET $route is unreachable: $http_error"
    continue
  fi
  if [[ $http_code != 200 ]]; then
    # The remaining checks describe a page that was not served, so they are not run.
    fail "GET $route answered $http_code, expected 200"
    continue
  fi
  pass "GET $route answered 200"

  content_type=$(header_value content-type)
  if [[ ${content_type,,} == *text/html* ]]; then
    pass "GET $route is HTML"
  else
    fail "GET $route is not HTML: ${content_type:-no content-type header}"
  fi

  if [[ -s $body ]]; then
    pass "GET $route has a body"
  else
    fail "GET $route has an empty body"
  fi

  if [[ $route == "$PRIVACY_ROUTE" ]]; then
    if grep -q -F "$PRIVACY_CONTACT" "$body"; then
      pass "GET $route publishes $PRIVACY_CONTACT"
    else
      fail "GET $route does not publish $PRIVACY_CONTACT"
    fi
  fi

  # The references are read before any of them is fetched, because fetching reuses the
  # body file.
  mapfile -t refs < <(code_refs)
  if (( ${#refs[@]} == 0 )); then
    # A page of this site that names no code file is one whose interactive half never
    # reaches the browser.
    fail "$route names no script and no preloaded module"
  fi
  for ref in "${refs[@]:+${refs[@]}}"; do
    read -r kind src <<< "$ref"
    if [[ $kind == module ]]; then label='preloaded module'; else label=script; fi
    target=$(resolve_url "$url" "$src")
    if [[ $target != "$origin"/* && $target != "$origin" ]]; then
      fail "$route loads $label $src from another origin, not fetched"
      continue
    fi
    check_code "$target"
    if [[ $code_status == ok ]]; then
      pass "$route $label ${target#"$origin"} is served and parses$code_seen"
    else
      fail "$route $label ${target#"$origin"} $code_status$code_seen"
    fi
  done
done

if ! fetch "$base$MISSING_PATH"; then
  fail "GET $MISSING_PATH is unreachable: $http_error"
elif [[ $http_code == 404 ]]; then
  pass "GET $MISSING_PATH answered 404"
else
  fail "GET $MISSING_PATH answered $http_code, expected 404"
fi

if (( responses == 0 )); then
  note 'no response arrived, so there was nothing to check for cookies'
elif (( ${#cookie_sources[@]} == 0 )); then
  pass "no set-cookie header on any of the $responses responses"
else
  fail "set-cookie header on ${#cookie_sources[@]} of the $responses responses: ${cookie_sources[*]}"
fi

printf '\n%d checks, %d failed\n' "$checks" "$failures"

if (( failures > 0 )); then
  exit 1
fi
exit 0
