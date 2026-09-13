import { describe, expect, it } from 'vitest'

import type { RawRelease } from '../server/utils/release-resolve'
import {
  buildReleaseCatalog,
  isReleaseCatalog,
  parseRawReleases,
  summariseCatalog,
} from '../server/utils/release-resolve'
import type { ReleaseCatalog } from '../shared/types/releases'
import fixture from './fixtures/releases-page.json'

// The fixture is a trimmed real capture of `halogenOS/builds` releases in the record's own
// order, every value verbatim; `tag_name` is a label for the reader and is consulted by
// nothing. Why each of the ten entries is present:
//
//  1. `20260728.0745.38-tb`: Pong's newest release, a test build newer than its stable.
//  2. `20260707.2230.36-rb`: Spacewar's newest release, a stable one.
//  3. `20260703.2349.34-rb`: guacamole's newest release, at 23:04:57Z, late enough that a
//     host-local date would name the following day.
//  4. `20260703.2234.33-rb`: Pong's newest stable build.
//  5. `20260602.0800.30-rcb`: a Pong release candidate, `prerelease: true` like a test
//     build, told apart only by the `[release candidate build]` marker.
//  6. `20250422.2044.4-tb`: a Spacewar test build with zero assets.
//  7. `20241024.0537.3-tb`: a Spacewar test build with a system image and its checksum only.
//  8. + 9. Tag numbers descend but entry 8 (guacamole) is published 48 minutes before
//     entry 9 (cheeseburger), so record position is not `published_at` order.
// 10. `v20190825.1931.000-tb`: a legacy date-after-codename name (`... for cheeseburger
//     2019/08/25`) the tail rule does not match.

const RAW = parseRawReleases(fixture)
const LISTED = ['Pong', 'Spacewar', 'guacamole']
const FETCHED_AT = '2026-08-30T12:00:00.000Z'

const catalogOf = (raw: readonly RawRelease[], codenames: readonly string[] = LISTED) =>
  buildReleaseCatalog(raw, codenames, FETCHED_AT)

const summaryOf = (raw: readonly RawRelease[], codenames: readonly string[] = LISTED) =>
  summariseCatalog(catalogOf(raw, codenames))

/** A minimal release the parser accepts, so a test can vary exactly one field. */
const release = (over: Record<string, unknown> = {}): unknown => ({
  name: '[test build] XOS-16.2 01/01/2026 for Pong',
  published_at: '2026-01-01T00:00:00Z',
  prerelease: true,
  html_url: 'https://github.com/halogenOS/builds/releases/tag/x',
  assets: [],
  ...over,
})

describe('the fixture', () => {
  it('carries the whole manifest', () => {
    expect(RAW, 'every captured element passes the guard').toHaveLength(fixture.length)
    expect(fixture).toHaveLength(10)
  })

  it('really is in an order that is not published_at order', () => {
    // A recapture that sorted the fixture would let the ordering test pass without proof.
    const instants = fixture.map(entry => entry.published_at)
    const inverted = instants.some((instant, index) =>
      index > 0 && instants[index - 1]! < instant)
    expect(inverted, 'the captured inverted legacy pair is gone from the fixture').toBe(true)
  })
})

describe('the catalog', () => {
  it('buckets by the for-codename tail and tolerates a name that matches none', () => {
    const devices = catalogOf(RAW).devices
    expect(Object.keys(devices)).toEqual(['Pong', 'Spacewar', 'guacamole'])
    expect(devices.Pong).toHaveLength(3)
    expect(devices.Spacewar).toHaveLength(3)
    expect(devices.guacamole).toHaveLength(2)
    expect(catalogOf(RAW, [...LISTED, 'cheeseburger']).devices.cheeseburger).toHaveLength(1)
  })

  it('sorts newest first, whatever order the record delivered', () => {
    const dates = (raw: readonly RawRelease[]) =>
      catalogOf(raw).devices.Pong!.map(build => build.publishedAt)
    const forward = dates(RAW)
    expect(forward).toEqual([
      '2026-07-28T06:50:51Z',
      '2026-07-03T21:40:04Z',
      '2026-06-02T07:02:57Z',
    ])
    expect(dates([...RAW].reverse())).toEqual(forward)
    expect(catalogOf(RAW).devices.guacamole![0]!.publishedAt).toBe('2026-07-03T23:04:57Z')
  })

  it('breaks a tie on the release name, descending', () => {
    // Published in the same second, so only the name can decide; the notes URL carries
    // the letter back out.
    const tied = (letters: readonly string[]): RawRelease[] => parseRawReleases(letters.map(letter =>
      release({
        name: `[test build] XOS-16.2 ${letter} for Pong`,
        published_at: '2026-02-02T02:02:02Z',
        html_url: `https://example.invalid/${letter}`,
      })))
    const order = (letters: readonly string[]) =>
      catalogOf(tied(letters)).devices.Pong!.map(build => build.notesUrl)

    expect(order(['A', 'C', 'B'])).toEqual([
      'https://example.invalid/C',
      'https://example.invalid/B',
      'https://example.invalid/A',
    ])
    expect(order(['B', 'A', 'C'])).toEqual(order(['C', 'B', 'A']))
  })

  it('derives the kind from the flag and the name marker', () => {
    const kinds = (codename: string) =>
      catalogOf(RAW).devices[codename]!.map(build => build.kind)
    expect(kinds('Pong')).toEqual(['test', 'stable', 'candidate'])
    expect(kinds('Spacewar')).toEqual(['stable', 'test', 'test'])
    const candidate = catalogOf(RAW).devices.Pong![2]!
    expect(candidate.notesUrl).toBe('https://github.com/halogenOS/builds/releases/tag/20260602.0800.30-rcb')
    expect(catalogOf(parseRawReleases([release()])).devices.Pong![0]!.kind).toBe('test')
    expect(catalogOf(parseRawReleases([release({ prerelease: false })])).devices.Pong![0]!.kind)
      .toBe('stable')
  })

  it('carries the series a name names, and null when it names none', () => {
    expect(catalogOf(RAW).devices.Pong!.map(build => build.series)).toEqual(['16.2', '16.2', '16.2'])
    expect(catalogOf(RAW).devices.Spacewar!.map(build => build.series))
      .toEqual(['16.2', '15.2', '15.0'])
    expect(catalogOf(RAW).devices.guacamole!.map(build => build.series)).toEqual(['16.2', '12.1'])
    const unnamed = parseRawReleases([release({ name: 'a build for Pong' })])
    expect(catalogOf(unnamed).devices.Pong![0]!.series).toBeNull()
  })

  it('lists exactly the files an assets array names, however many that is', () => {
    const zeroAsset = catalogOf(RAW).devices.Spacewar![1]!
    expect(zeroAsset.publishedAt).toBe('2025-04-22T20:50:58Z')
    expect(zeroAsset.files).toEqual([])

    const partial = catalogOf(RAW).devices.Spacewar![2]!
    expect(partial.files.map(file => file.name)).toEqual([
      'halogenOS_Spacewar-15.0-20241024-053834-OFFICIAL.zip',
      'halogenOS_Spacewar-15.0-20241024-053834-OFFICIAL.zip.sha256sum',
    ])
    expect(partial.files[1]).toEqual({
      name: 'halogenOS_Spacewar-15.0-20241024-053834-OFFICIAL.zip.sha256sum',
      size: 119,
      url: 'https://github.com/halogenOS/builds/releases/download/20241024.0537.3-tb/halogenOS_Spacewar-15.0-20241024-053834-OFFICIAL.zip.sha256sum',
    })

    const newestPong = catalogOf(RAW).devices.Pong![0]!
    expect(newestPong.files).toHaveLength(6)
    expect(newestPong.files[1]).toEqual({
      name: 'halogenOS_Pong-16.2-20260728-064754-OFFICIAL.zip',
      size: 1146521759,
      url: 'https://github.com/halogenOS/builds/releases/download/20260728.0745.38-tb/halogenOS_Pong-16.2-20260728-064754-OFFICIAL.zip',
    })
  })

  it('carries the fetch instant through untouched', () => {
    expect(catalogOf(RAW).fetchedAt).toBe(FETCHED_AT)
  })

  it('omits a listed device whose bucket is empty', () => {
    const devices = catalogOf(RAW, [...LISTED, 'rosemary']).devices
    expect('rosemary' in devices).toBe(false)
    expect(Object.keys(devices)).toHaveLength(3)
  })

  it('throws when the record resolves no listed device at all', () => {
    expect(() => catalogOf(RAW, ['rosemary'])).toThrow(/no listed device/)
    expect(() => catalogOf([], LISTED)).toThrow(/no listed device/)
  })
})

describe('the widened guard', () => {
  it('drops an entry missing any of the four required fields', () => {
    const missing: unknown[] = [
      { ...(release() as object), name: undefined },
      { ...(release() as object), published_at: undefined },
      { ...(release() as object), prerelease: undefined },
      { ...(release() as object), html_url: undefined },
      release({ prerelease: 'true' }),
      release({ html_url: 42 }),
      release({ name: 12 }),
      release({ published_at: null }),
      null,
      42,
    ]
    expect(parseRawReleases([...missing, ...fixture])).toHaveLength(fixture.length)
  })

  it('drops a release the record dates with a string no clock can read', () => {
    // The comparator sorts by string order, which only the fixed-width Z shape keeps.
    const wrongShapes = [
      release({ published_at: 'soon' }),
      release({ published_at: '2026-07-28T06:50:51+05:30' }),
      release({ published_at: 'July 28, 2026' }),
      release({ published_at: '2026-13-45T99:99:99Z' }),
    ]
    expect(parseRawReleases([...wrongShapes, ...fixture])).toHaveLength(fixture.length)
  })

  it('keeps a dated release the record does not NAME', () => {
    expect(parseRawReleases([release({ name: null })])).toHaveLength(1)
    expect(() => catalogOf(parseRawReleases([release({ name: null })]))).toThrow(/no listed device/)
  })

  it('tolerates a missing or malformed assets array as no files', () => {
    for (const assets of [undefined, null, 'nope', 42, {}]) {
      const raw = parseRawReleases([release({ assets })])
      expect(raw).toHaveLength(1)
      expect(catalogOf(raw).devices.Pong![0]!.files).toEqual([])
    }
  })

  it('drops a malformed asset from the files list, never the release', () => {
    const good = {
      name: 'halogenOS_Pong-16.2.zip',
      size: 10,
      browser_download_url: 'https://example.invalid/a.zip',
    }
    const raw = parseRawReleases([release({
      assets: [
        null,
        'nope',
        { size: 1, browser_download_url: 'https://example.invalid/b' },
        { name: 'b', browser_download_url: 'https://example.invalid/b' },
        { name: 'c', size: 1 },
        { name: 'd', size: 'big', browser_download_url: 'https://example.invalid/d' },
        { name: 'e', size: Number.NaN, browser_download_url: 'https://example.invalid/e' },
        good,
      ],
    })])
    const build = catalogOf(raw).devices.Pong![0]!
    expect(build.files).toEqual([{ name: good.name, size: good.size, url: good.browser_download_url }])
  })

  it('drops an asset whose URL is on any scheme but https', () => {
    // The URL reaches an `href`, so a `javascript:` value would run on click.
    const rejected = [
      'javascript:alert(1)',
      'JavaScript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'http://example.invalid/a.zip',
      'vbscript:msgbox(1)',
      '//example.invalid/a.zip',
      '/a.zip',
      ' https://example.invalid/a.zip',
      '',
    ]
    for (const url of rejected) {
      const raw = parseRawReleases([release({
        assets: [{ name: 'a.zip', size: 1, browser_download_url: url }],
      })])
      expect(raw, url).toHaveLength(1)
      expect(catalogOf(raw).devices.Pong![0]!.files, url).toEqual([])
    }
    const upper = parseRawReleases([release({
      assets: [{ name: 'a.zip', size: 1, browser_download_url: 'HTTPS://example.invalid/a.zip' }],
    })])
    expect(catalogOf(upper).devices.Pong![0]!.files).toHaveLength(1)
  })
})

describe('the summary derived from the catalog', () => {
  it('counts and dates exactly what the catalog lists, per device', () => {
    const devices = summaryOf(RAW).devices
    expect(devices.Pong).toEqual({ lastBuild: '2026-07-28', buildCount: 3 })
    expect(devices.Spacewar).toEqual({ lastBuild: '2026-07-07', buildCount: 3 })
    // 23:04:57Z is the next day east of UTC; the date is taken in UTC.
    expect(devices.guacamole).toEqual({ lastBuild: '2026-07-03', buildCount: 2 })
  })

  it('is a reduction over the catalog, not a second bucketing', () => {
    const catalog = catalogOf(RAW)
    const summary = summariseCatalog(catalog)
    for (const [codename, builds] of Object.entries(catalog.devices)) {
      expect(summary.devices[codename]!.buildCount).toBe(builds.length)
      expect(summary.devices[codename]!.lastBuild).toBe(builds[0]!.publishedAt.slice(0, 10))
    }
  })

  it('keeps the key order of the catalog and its fetch instant', () => {
    const catalog = catalogOf(RAW)
    const summary = summariseCatalog(catalog)
    expect(Object.keys(summary.devices)).toEqual(Object.keys(catalog.devices))
    expect(summary.fetchedAt).toBe(catalog.fetchedAt)
  })

  it('omits a listed device whose bucket is empty, exactly as the catalog does', () => {
    const devices = summaryOf(RAW, [...LISTED, 'rosemary']).devices
    expect('rosemary' in devices).toBe(false)
    expect(Object.keys(devices)).toHaveLength(3)
  })
})

describe('the cache validator', () => {
  it('accepts a catalog', () => {
    expect(isReleaseCatalog(catalogOf(RAW))).toBe(true)
    expect(isReleaseCatalog({ fetchedAt: FETCHED_AT, devices: {} })).toBe(true)
  })

  it('rejects an entry written by the OLD summary shape', () => {
    // The cache name and key are shared with the summary shape.
    expect(isReleaseCatalog(summaryOf(RAW))).toBe(false)
    expect(isReleaseCatalog({
      fetchedAt: FETCHED_AT,
      devices: { Pong: { lastBuild: '2026-07-28', buildCount: 3 } },
    })).toBe(false)
  })

  it('rejects a devices record whose buckets are not builds', () => {
    // A bucket the summary cannot reduce would 503 both release routes for the whole
    // cache window; rejecting it here costs one upstream fetch instead.
    for (const devices of [
      { Pong: [42] },
      { Pong: ['2026-07-28T06:50:51Z'] },
      { Pong: [null] },
      { Pong: [{ kind: 'stable', files: [] }] },
      { Pong: [] },
      { Pong: [{ publishedAt: '2026-07-28T06:50:51Z' }], Spacewar: [7] },
    ]) {
      const entry = { fetchedAt: FETCHED_AT, devices }
      expect(isReleaseCatalog(entry), `${JSON.stringify(entry)} passed the validator`).toBe(false)
      expect(() => summariseCatalog(entry as unknown as ReleaseCatalog)).toThrow()
    }
  })

  it('rejects anything that is not a catalog at all', () => {
    for (const value of [null, undefined, 42, 'catalog', [], {}, { devices: {} },
      { fetchedAt: FETCHED_AT }, { fetchedAt: 1, devices: {} }, { fetchedAt: FETCHED_AT, devices: null }]) {
      expect(isReleaseCatalog(value), `${JSON.stringify(value)} passed the validator`).toBe(false)
    }
  })
})
