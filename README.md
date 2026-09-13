# halogenOS website

The website for halogenOS, an Android ROM. The sources of the ROM itself live in the
halogenOS organisation on GitHub; this repository holds the site only.

The site is a Nuxt application with SSR, served by Nitro: an arrival page and three depths
(devices, features, community), with a page per listed device under the devices depth.

## Requirements

- bun 1.3.13, declared in the package manifest, for installing dependencies and running the
  scripts below.
- Node 22.19+, 24.11+ or 26+. The production build is a Node server, so the built site
  runs on Node even though bun handles installs and scripts.

Dependencies are installed under a minimum release age of seven days: a version published
less than a week ago is never resolved, which keeps a freshly published malicious release out
of the lockfile. The setting lives in the project's bun configuration file and applies only
while dependencies are resolved, so the lockfile has to be created with it in place.

Dependency install scripts are blocked unless the package is named in `trustedDependencies`.
The two packages listed there unpack a native binary during install and do not work
without it.

Install with the lockfile as committed:

```
bun install --frozen-lockfile
```

The install ends by running `nuxt prepare`, which writes the generated project files into
`.nuxt/`; the ESLint flat config and the TypeScript project references both import from
there, so a fresh checkout cannot lint or typecheck before an install has run.

## Running it

```
bun run dev      # development server with hot reload
bun run build    # production build, Node server output from Nitro
bun run preview  # serve the production build locally
```

Both `dev` and `preview` bind the server to the loopback address 127.0.0.1, so neither is
reachable from outside the machine running it. `dev` takes the address through `--host`, the
built Node server through the `NITRO_HOST` environment variable, which is why the scripts
differ. Pass `--port` to either one to choose a different port. Running
`node .output/server/index.mjs` directly binds all interfaces unless `NITRO_HOST` is set, so a
deployment must set it deliberately.

## Checks

```
bun run check      # lint, then typecheck, then test, stopping at the first failure
bun run lint       # eslint, correctness and formatting, warnings are errors
bun run lint:fix   # the same run, fixing what can be fixed automatically
bun run typecheck  # vue-tsc through Nuxt
bun run test       # vitest
```

Every change passes `bun run check` before it merges. `lint:fix` rewrites files, so it is a
repair tool, not a check. Tests run under vitest, not bun's own test runner, because the Nuxt
test environment is built for vitest.

A deployment is checked from the outside by the smoke script, invoked as
`scripts/smoke.sh https://example.org [/route ...]`: it derives the page routes from the pages
directory, requests each one, and fetches and parses every code file those pages name, the
entry script and every preloaded module alike. A route named as an argument after the base
URL is checked like a derived one; that is how the device pages are checked, since their
addresses hold a codename the pages directory cannot fill in. The run fails if any response
carries a cookie, if the policy page has lost its contact address, or if a page names no code
file at all. It needs bash 4, node for the parse step, and a deployment already serving at
the URL given, so it runs after a deploy and is not part of `bun run check`.

## Release data

The devices page shows each device's newest build date and total build count. Each device's
own page links to the newest build of each kind and to the full build history, which live on
the `stable`, `candidate`, `test` and `builds` segments under `/devices/<codename>` and carry
the build cards with direct download links.
All of it comes from the GitHub release record of `halogenOS/builds`, read at request time
and normalized into one structure: a catalog of every listed device's builds, newest first,
each with its kind, its release notes link and its files.

The catalog is fetched and cached in exactly one place (`server/utils/release-catalog.ts`),
for half an hour with stale-while-revalidate behind it, so visitor requests are served from
the cache and the upstream sees at most a couple of short request bursts per hour. Two routes read
it and neither adds upstream traffic: `/api/releases` reduces it to the per-device summary
the devices page prints, and `/api/releases/<codename>` returns one device's build list. A
codename is resolved case-insensitively; the canonical page address is the lowercase form and
any other casing redirects to it permanently.

Every failure on the way throws instead of caching anything degraded. An empty cache with
the upstream failing answers 503 `{ "unavailable": true }` on both routes; the devices page
then falls back per device to the baseline numbers committed beside the device list, and a
device page shows its identity with a link to the full releases listing on GitHub.

Two optional environment variables shape the route:

- `NUXT_GITHUB_TOKEN`: a GitHub token, sent as a bearer when set. The route works without
  it inside GitHub's unauthenticated rate limit; a token raises the ceiling. It is read from
  the environment at runtime and belongs in no file this repository tracks.
- `NUXT_GITHUB_API_BASE`: overrides the upstream base URL, which is how tests and smoke
  checks point the route at a mock or an unreachable port instead of the real API.

The cache is written to `.data/cache` relative to the server's working directory, so a
deployment that wants the cache to survive restarts must run the server from a fixed,
writable working directory. `.data/` is never tracked.

## Stack

Nuxt 4 with SSR, Nitro as the server, TypeScript throughout, Tailwind 4 for all styling with
the design tokens in the stylesheet's theme, `@nuxtjs/i18n` for every user-visible string,
VueUse for browser and reactivity plumbing, Lucide for icons, ESLint via the Nuxt ESLint
module with its stylistic rules switched on, and Vitest running plain node-environment
suites. There is no separate formatter: the lint command decides how the code looks. Fonts
are self-hosted through Fontsource and reached only through the theme's font tokens.

## License

MIT. See the license file.
