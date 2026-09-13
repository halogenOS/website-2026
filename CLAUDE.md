# halogenOS website

This repository holds the website for halogenOS, an Android ROM
(github.com/halogenOS). The site is a Nuxt application with SSR, served by Nitro,
managed with bun.

## Working rules

- Committed space carries code and its immediate technical documentation only. Design
  material and working state stay untracked; an agent that finds such material on a
  machine reads it first. Commit messages stay technical.
- The repo stays publishable: no secrets, no machine or hosting internals, no personal
  quotes in commits or committed files. The legal notice is the one exception: German
  disclosure law requires the operator's name and postal address to be published, so
  those stand in `i18n/locales/` and are tracked. The exception covers that page's
  required disclosures and nothing else.
- User-facing copy is written deliberately, not improvised.
- A claim about scrolling is proven by `scripts/scroll-probe.mjs`, never by a render.
  The shell is fixed to the viewport, so a region that fills its space and a region that
  overflows it and hands the scrolling outwards look the same; only the numbers in the
  running page tell them apart. `scripts/render-shot.sh` proves what a page looks like
  and nothing else.

## Styling and component rules

- No raw CSS unless absolutely necessary: styling lives in Tailwind classes and the
  `@theme` tokens in the stylesheet (`app/assets/css/`, entry `main.css`, which
  imports its siblings; every file stays under the 500-line rule). `@keyframes` is
  sanctioned only for motion Tailwind cannot express, lives beside the animation tokens,
  and only after the utility route was tried (the `@property` registration such a
  keyframe needs is covered by the same sanction, and nothing else is). A runtime-varying
  value may set a CSS variable, with the declarations staying in classes that
  reference it; binding whole declarations inline is forbidden.
- No component libraries: UI primitives are hand-built in `app/components/ui/`,
  prefixed `Ui` (UiButton, UiCard, ...), and every component is built reusable.
- No `dark:` prefixes in templates; dark mode is CSS variable overrides under
  `@media (prefers-color-scheme: dark)` in the theme.
- Vue transitions use Tailwind class props on `<Transition>`, never raw transition
  CSS.
- Size limits, lint-enforced: lines under 120 characters, except JSON locale message
  values; a file under 500 lines (refactor past that), a Vue template block under 250
  lines.
- Fonts are reached through the theme tokens (`font-display`, `font-body`), never
  named directly. Monospace appears nowhere unless deliberately placed.
- Colours are reached through the semantic tokens (`bg`, `surface`, `on-surface`,
  `accent`, `border`, `hover-on-*`, `bg-next`, status colours), never a private
  scale step, never a raw colour in a template. The scales and tokens live in
  the stylesheet's entry file.
- Prefer VueUse composables over hand-rolling browser or reactivity plumbing; write
  a custom composable only where VueUse has no fit.

## Motion rules

- Every animation requires the site's motion condition, never the media query alone:
  `motion-ok:` is ambient motion (the app is alive and the reader has not asked for
  less); `motion-entered:` adds the `.in-view` arrival an entry animation needs.
  Tailwind's plain `motion-safe:` is for a hover transition only. An animation
  behind the media query alone is a bug. The two custom variants are declared with the theme.
- Elements are authored settled: the finished, opaque state is the base, and the hidden
  state exists only while that condition holds. A page with no JavaScript, a page whose
  app died, and a reader who asked for less motion all get a finished page.
- A hover converted from raw CSS is written `[&:hover]:`, not `hover:`; the short
  form sits behind `@media (hover: hover)` and silently drops the effect on a
  touch screen where the raw rule fired. New hover styling may use `hover:`
  deliberately.
- A static `style` attribute may set only custom properties; `:style` bindings feed
  custom-property values for what varies per instance (a stagger index, a measured
  offset), with the declaration staying in a class that references the variable and a
  class-side default keeping the element finished without it. Enforced by
  `test/styling-law.test.ts`.
- Two Tailwind mechanics: arbitrary properties emit after named utilities (which is
  what lets `[animation-delay:…]` land on top of the `animation` shorthand), but among
  themselves their order is not fixed, so two overlapping arbitrary properties (a
  shorthand and one of its longhands) must be written as one declaration. And two
  `tracking-*` or `leading-*` utilities on one element decide by source order: a call
  site that sets its own writes only its own.

## Copy and i18n

- Every user-visible string is an i18n key (`i18n/locales/`, English only today), no
  literal strings in templates, and the intent behind each key is recorded in a
  comment at its reference site. Future locales translate that intent; the English
  wording is not their specification.
- Third-party marks are never redrawn or restyled.

## The stylesheet's boundary

The stylesheet (`app/assets/css/`, entry `main.css` plus the siblings it imports)
holds tokens, and beyond them only entries on its sanctioned-exceptions list. Each entry
records why it cannot be a template class (`@keyframes` beside the `--animate-*` token,
variant configuration, `@layer base` element defaults, value-not-declaration custom
properties like data-uris or gradient stacks). Nothing joins the list without a
reason written next to it.

## Commands

- `bun install --frozen-lockfile` installs (runs `nuxt prepare`; lifecycle scripts are
  restricted, see README)
- `bun run dev` / `bun run build` / `bun run preview`
- `bun run check` runs lint, typecheck and test in order, stopping at the first failure;
  it passes before any change merges. Nothing runs it automatically, so run it yourself.

## Current state

The site serves an arrival page, three depths (devices, features, community), two
legal pages (the privacy policy and the legal notice) and a footer that links to
both. Each listed device has a page of its own, a launcher linking to sub-pages: one
per build kind, each carrying that kind's newest build, plus one carrying the full
build history. The devices page reads live release data through one cached server
route with a committed baseline as fallback.
