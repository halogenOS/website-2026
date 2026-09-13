// Shared route mapping for the current element and breadcrumb trail.
// Intent: trail.home names the arrival in one word. privacy.initials and imprint.initials
// supply the legal pages' two-letter menu glyphs, first letter capital, not derived from titles.
// nav.* names destinations; device.kind.* names build kinds; device.allBuilds names the
// history. Legal crumbs use their pages' title keys; device names retain their source spelling.

import type { Device } from '#shared/data/devices'
import { deviceByCodename, devicePath } from '#shared/data/devices'
import { buildKindOf, kindLabelKey } from './builds'
import { BUILD_HISTORY_SECTION, deviceSectionPath } from './device-route'
import type { Halogen } from './elements'
import { HALOGENS } from './elements'

/** One crumb of the trail: where it goes, and its words as a copy key or as invariant data. */
export type Crumb
  = | { readonly to: string, readonly key: string }
    | { readonly to: string, readonly text: string }

/** What the rail lights and the phone's control shows: an element, or a page's initials. */
export type PlaceMark
  = | { readonly element: Halogen }
    | { readonly initialsKey: string }

/** A page's place: its mark and its trail, the last crumb being the page itself. */
export interface Place {
  readonly mark: PlaceMark
  readonly trail: readonly Crumb[]
}

/** A section of the site, keyed by the first segment of its addresses. */
interface Section {
  readonly mark: PlaceMark
  /** The section's own crumb key. */
  readonly key: string
  /** The crumbs of an address deeper than the section, or `null` for one the site lacks. */
  readonly deeper?: (segments: readonly string[]) => readonly Crumb[] | null
}

const HOME: Crumb = { to: '/', key: 'trail.home' }

/** The levels under one device: the device itself, then a kind or the whole history. */
const deviceCrumbs = (segments: readonly string[]): readonly Crumb[] | null => {
  const [codename, section, ...rest] = segments
  if (codename === undefined || rest.length > 0) return null
  const device: Device | undefined = deviceByCodename(codename)
  if (device === undefined) return null
  const own: Crumb = { to: devicePath(device), text: device.name }
  if (section === undefined) return [own]
  if (section === BUILD_HISTORY_SECTION) {
    return [own, { to: deviceSectionPath(device, section), key: 'device.allBuilds' }]
  }
  const kind = buildKindOf(section)
  if (kind === undefined) return null
  return [own, { to: deviceSectionPath(device, section), key: kindLabelKey(kind) }]
}

/** The depths the halogens open on this site, one section per local destination. */
const CHILD_CRUMBS = { device: deviceCrumbs }
const HALOGEN_SECTIONS: readonly (readonly [string, Section])[] = HALOGENS
  .filter(halogen => halogen.to.startsWith('/'))
  .map(halogen => [halogen.to.slice(1), {
    mark: { element: halogen },
    key: halogen.key,
    deeper: halogen.children === undefined ? undefined : CHILD_CRUMBS[halogen.children],
  }])

const SECTIONS: ReadonlyMap<string, Section> = new Map([
  ...HALOGEN_SECTIONS,
  ['privacy', { mark: { initialsKey: 'privacy.initials' }, key: 'privacy.title' }],
  ['imprint', { mark: { initialsKey: 'imprint.initials' }, key: 'imprint.title' }],
])

/**
 * The place an address stands in, or `null` for the arrival (which keeps its table as its
 * only navigation) and for any address this site has no page for.
 */
export const placeOf = (path: string): Place | null => {
  const [first, ...rest] = path.split('/').filter(segment => segment !== '')
  if (first === undefined) return null
  const canonical = first.toLowerCase()
  const section = SECTIONS.get(canonical)
  if (section === undefined) return null
  const trail: Crumb[] = [HOME, { to: `/${canonical}`, key: section.key }]
  if (rest.length === 0) return { mark: section.mark, trail }
  const deeper = section.deeper?.(rest)
  if (deeper === undefined || deeper === null) return null
  return { mark: section.mark, trail: [...trail, ...deeper] }
}
