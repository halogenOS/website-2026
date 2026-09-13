#!/usr/bin/env bash
# Set FONTCONFIG_FILE when fonts need a custom fontconfig configuration.

set -u

if (( $# != 4 )); then
  printf 'usage: %s <width> <dark|light> <outfile.png> <url>\n' "${0##*/}" >&2
  exit 2
fi

width=$1
scheme=$2
outfile=$3
url=$4

if [[ ! $width =~ ^[0-9]+$ ]] || (( width < 1 )); then
  printf 'the width must be a positive whole number of pixels: %s\n' "$width" >&2
  exit 2
fi

# Read the layout breakpoint from the theme to keep viewport proportions in sync.
here=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd) || exit 2
stylesheet=$here/../app/assets/css/main.css
desk=$(sed -n 's/^[[:space:]]*--breakpoint-desk:[[:space:]]*\([0-9][0-9]*\)px;.*$/\1/p' "$stylesheet")
if [[ ! $desk =~ ^[0-9]+$ ]]; then
  printf 'no single --breakpoint-desk pixel value in %s, so no stage to judge on\n' \
    "$stylesheet" >&2
  exit 2
fi

# Phone shots use a 9:16 stage and desk shots 16:9; the image captures the stage, not the document.
if (( width < desk )); then
  height=$(( width * 16 / 9 ))
else
  height=$(( width * 9 / 16 ))
fi

# Blink's preferredColorScheme enum uses 0 for dark and 1 for light.
case $scheme in
  dark) preferred=0 ;;
  light) preferred=1 ;;
  *)
    printf 'the colour scheme must be dark or light: %s\n' "$scheme" >&2
    exit 2
    ;;
esac

chromium=${CHROMIUM:-}
if [[ -z $chromium ]]; then
  chromium=$(command -v chromium) || {
    printf 'no chromium: set $CHROMIUM or put one on the path\n' >&2
    exit 2
  }
fi

# Separate profiles prevent concurrent Chromium processes from sharing a profile lock.
if ! profile=$(mktemp -d); then
  printf 'could not create a profile directory for this run\n' >&2
  exit 2
fi
trap 'rm -rf "$profile"' EXIT

# A stale image would let a run that wrote nothing pass the output check.
rm -f -- "$outfile"

# The virtual time budget lets fonts, hydration and the entry animation finish before the image.
"$chromium" \
  --headless \
  --disable-gpu \
  --no-sandbox \
  --hide-scrollbars \
  --force-device-scale-factor=1 \
  --virtual-time-budget=5000 \
  --window-size="$width,$height" \
  --blink-settings=preferredColorScheme="$preferred" \
  --user-data-dir="$profile" \
  --screenshot="$outfile" \
  "$url" > /dev/null 2>&1
status=$?

# Chromium can exit successfully without writing an image; check both status and output.
if (( status != 0 )); then
  printf 'chromium exited %d shooting %s\n' "$status" "$url" >&2
  exit 1
fi
if [[ ! -s $outfile ]]; then
  printf 'no screenshot was written to %s\n' "$outfile" >&2
  exit 1
fi

printf '%s %dx%d %s\n' "$outfile" "$width" "$height" "$scheme"
