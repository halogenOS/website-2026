import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

import { FEATURED_KINDS, kindLabelKey } from '../app/utils/builds'

// Every i18n keypath the app names has to exist in the locale file. A missing key prints
// its own keypath, and the legal pages list their keypaths as plain strings where neither
// the linter nor the typechecker looks.
//
// Five readers: three read keypaths spelled out under app/, two cover the places that
// compose a keypath in a template literal (`${depth}.title` in useDepthHead and
// `device.kind.${kind}` in kindLabelKey). Neither composed set is re-listed here, because
// a second list goes stale: the kinds come from FEATURED_KINDS through kindLabelKey, and
// the depth names are read off the `<SiteDepthPage>` call sites, with only the `.title`
// suffix mirrored.
//
// Not covered: a new composition site until it gets a reader; a typo in the first
// segment of a listed key, which the namespace filter no longer recognises; a bound
// `:keypath="key"`; a namespace renamed in the locale file, which makes the listed keys
// stop looking like keypaths instead of reporting them missing (the filter is what keeps
// route names and data fields from being demanded as messages); a keypath named outside
// app/. Existence only: an unreferenced key is not checked.

/** One source file under app/, read once and offered to every reader. */
interface Source {
  readonly path: string
  readonly text: string
}

/** A keypath the app names, and the place that named it, for the failure report. */
interface Reference {
  readonly keypath: string
  readonly where: string
}

/** One shape a keypath is named in, and everything of that shape in the tree. */
interface Reader {
  readonly what: string
  readonly read: (sources: readonly Source[], namespaces: ReadonlySet<string>) => Reference[]
}

const sourcesUnder = (dir: string): string[] => {
  const found: string[] = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) found.push(...sourcesUnder(path))
    else if (name.endsWith('.vue') || name.endsWith('.ts')) found.push(path)
  }
  return found
}

const TRANSLATE_CALL = /(?<![\w$])\$?t\(\s*(['"])([^'"\n]+)\1/g
const KEYPATH_LITERAL = /'([A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+)'/g

// An i18n-t whose `keypath` is a plain attribute; the bound form, `:keypath="key"`, is
// an expression whose value only the running app knows.
const KEYPATH_ATTRIBUTE = /(?:^|\s)keypath=(['"])([A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+)\1/g

// useDepthHead turns the page's `depth` name into `<depth>.title` unless the page hands a
// title of its own (a device page does, so no `device.title` exists). Both halves are
// mirrored here. Attributes are matched a quoted value at a time, not up to the next `>`,
// because a Tailwind variant such as `[&>a]:underline` carries one.
const DEPTH_PAGE = /<SiteDepthPage\b((?:[^>"']|"[^"]*"|'[^']*')*)>/g
const DEPTH_NAME = /(?:^|\s)depth="([A-Za-z0-9_]+)"/
const OWN_TITLE = /(?:^|\s):?title="/

/** A source path as the repository spells it, so a failure names a file a reader can open. */
const at = (path: string): string => relative(process.cwd(), path)

const READERS: readonly Reader[] = [
  {
    what: 'a translate call taking a string literal',
    read: sources => sources.flatMap(({ path, text }) =>
      [...text.matchAll(TRANSLATE_CALL)].map(match => ({ keypath: match[2]!, where: at(path) })),
    ),
  },
  {
    // Single quotes only: a dotted string in double quotes inside a template is a bound
    // expression such as `:key="device.codename"`, and the lint keeps script literals
    // single-quoted. Double-quoted attribute keypaths are the next reader's.
    what: 'a single-quoted string shaped like a keypath, which is how a page lists its keys',
    read: (sources, namespaces) => sources.flatMap(({ path, text }) =>
      [...text.matchAll(KEYPATH_LITERAL)]
        .map(match => match[1]!)
        .filter(keypath => namespaces.has(keypath.split('.')[0]!))
        .map(keypath => ({ keypath, where: at(path) })),
    ),
  },
  {
    what: 'a keypath written as a plain attribute, which is how a template names one directly',
    read: sources => sources.flatMap(({ path, text }) =>
      [...text.matchAll(KEYPATH_ATTRIBUTE)].map(match => ({ keypath: match[2]!, where: at(path) })),
    ),
  },
  {
    what: 'a depth page\'s own title, composed by useDepthHead from the name the page states',
    read: sources => sources.flatMap(({ path, text }) =>
      [...text.matchAll(DEPTH_PAGE)].flatMap(([, attributes]) => {
        const named = DEPTH_NAME.exec(attributes!)
        return named === null || OWN_TITLE.test(attributes!)
          ? []
          : [{ keypath: `${named[1]!}.title`, where: at(path) }]
      }),
    ),
  },
  {
    what: 'a build kind\'s label, composed by kindLabelKey over the whole BuildKind union',
    read: () => FEATURED_KINDS.map(kind => ({
      keypath: kindLabelKey(kind),
      where: 'app/utils/builds.ts, kindLabelKey over FEATURED_KINDS',
    })),
  },
]

/** The message a keypath names, or undefined where the path runs out of locale file. */
const messageAt = (messages: Record<string, unknown>, keypath: string): unknown =>
  keypath.split('.').reduce<unknown>(
    (node, segment) =>
      node !== null && typeof node === 'object'
        ? (node as Record<string, unknown>)[segment]
        : undefined,
    messages,
  )

describe('the keys the app names', () => {
  it('finds every referenced keypath in the locale file', () => {
    const localeFile = join(process.cwd(), 'i18n/locales/en.json')
    const messages = JSON.parse(readFileSync(localeFile, 'utf8')) as Record<string, unknown>
    const namespaces = new Set(Object.keys(messages))
    const sources = sourcesUnder(join(process.cwd(), 'app'))
      .map(path => ({ path, text: readFileSync(path, 'utf8') }))

    const missing = new Set<string>()
    for (const reader of READERS) {
      const found = reader.read(sources, namespaces)

      // Per reader, never pooled: a reader that matches nothing passes on every tree.
      expect(found.length, `nothing was recognised as: ${reader.what}`).toBeGreaterThan(0)

      for (const { keypath, where } of found) {
        if (typeof messageAt(messages, keypath) !== 'string') missing.add(`${keypath} (${where})`)
      }
    }

    expect([...missing].sort(), 'a keypath the app names is not in the locale file').toEqual([])
  })
})
