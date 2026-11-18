import { describe, expect, it } from 'vitest'

import {
  buildAnchor,
  featuredBuildsOf,
  installUrlOf,
  recoveryFilesOf,
  seriesGroupsOf,
} from '../app/utils/builds'
import type { BuildKind, DeviceBuild } from '../shared/types/releases'

// Builds can share a publication second, so timestamps cannot uniquely identify page anchors.

const buildAt = (publishedAt: string, kind: BuildKind, series: string | null): DeviceBuild => ({
  tag: `${publishedAt}-${kind}`,
  publishedAt,
  kind,
  series,
  notesUrl: `https://example.invalid/${publishedAt}`,
  files: [],
})

// The resolver supplies history newest first.
const HISTORY: readonly DeviceBuild[] = [
  buildAt('2026-07-28T06:50:51Z', 'test', '16.2'),
  buildAt('2026-07-28T06:50:51Z', 'test', '16.2'),
  buildAt('2026-07-03T22:34:33Z', 'stable', '16.2'),
  buildAt('2026-06-02T08:00:30Z', 'candidate', '15.0'),
]

describe('a build address on the page', () => {
  it('is distinct for two builds published in the same second', () => {
    const anchors = HISTORY.map((_, index) => buildAnchor(index))
    expect(anchors).toEqual(['build-0', 'build-1', 'build-2', 'build-3'])
    expect(new Set(anchors).size).toBe(HISTORY.length)
  })

  it('survives the series grouping, which carries every position through', () => {
    const groups = seriesGroupsOf(HISTORY)
    expect(groups.map(group => group.series)).toEqual(['16.2', '15.0'])
    expect(groups.flatMap(group => group.builds.map(placed => placed.index))).toEqual([0, 1, 2, 3])
    for (const group of groups) {
      for (const placed of group.builds) expect(placed.build).toBe(HISTORY[placed.index])
    }
  })
})

describe('the featured builds', () => {
  it('takes the newest build of each kind, stable leading', () => {
    const featured = featuredBuildsOf(HISTORY)
    expect(featured.map(card => card.kind)).toEqual(['stable', 'candidate', 'test'])
    expect(featured.map(card => card.build)).toEqual([HISTORY[2], HISTORY[3], HISTORY[0]])
  })

  it('leaves out a kind the record holds no build of', () => {
    const withoutCandidate = HISTORY.filter(build => build.kind !== 'candidate')
    expect(featuredBuildsOf(withoutCandidate).map(card => card.kind)).toEqual(['stable', 'test'])
    expect(featuredBuildsOf([])).toEqual([])
  })

  // The launcher takes its leading kind from this list's order.
  it('puts the leading kind first, whichever kinds the record holds', () => {
    expect(featuredBuildsOf(HISTORY)[0]?.kind).toBe('stable')

    const withoutCandidate = HISTORY.filter(build => build.kind !== 'candidate')
    expect(featuredBuildsOf(withoutCandidate).map(card => card.kind)).toEqual(['stable', 'test'])

    const preReleaseOnly = HISTORY.filter(build => build.kind !== 'stable')
    expect(featuredBuildsOf(preReleaseOnly).map(card => card.kind)).toEqual(['candidate', 'test'])
  })
})

describe('the files a build offers', () => {
  const fileNamed = (name: string) => ({ name, size: 1, url: `https://example.invalid/${name}` })
  const released: DeviceBuild = {
    ...buildAt('2026-11-18T13:58:07Z', 'test', '17.0'),
    files: [
      'boot.img', 'delta-1549.json', 'dtbo.img', 'free-bytes-system.img', 'manifest.json', 'pkmd.bin',
      'super_empty.img', 'vbmeta.img', 'vbmeta_system.img', 'vendor_boot.img', 'vendor_dlkm.img',
    ].map(fileNamed),
  }

  it('lists only the recovery images, in the order the installer writes them, with descriptions', () => {
    expect(recoveryFilesOf(released).map(recovery => [recovery.file.name, recovery.description])).toEqual([
      ['boot.img', 'device.artifactBoot'],
      ['dtbo.img', undefined],
      ['vendor_boot.img', 'device.artifactVendorBoot'],
      ['vbmeta.img', undefined],
      ['vbmeta_system.img', undefined],
    ])
  })

  it('lists the recovery image of a release that has one, and no zip', () => {
    const legacy: DeviceBuild = {
      ...released,
      files: ['halogenOS_Pong-16.2-20260728-064754-OFFICIAL.zip', 'recovery.img', 'BOOT.IMG'].map(fileNamed),
    }
    expect(recoveryFilesOf(legacy).map(recovery => recovery.file.name)).toEqual(['BOOT.IMG', 'recovery.img'])
  })

  it('links the installer to the tag of a build with an install manifest', () => {
    const tagged: DeviceBuild = { ...released, tag: '20261118.1447.7-tb' }
    expect(installUrlOf(tagged)).toBe('https://install.halogenos.org/?release=20261118.1447.7-tb')
  })

  it('offers no install for a build without an install manifest', () => {
    const unlisted: DeviceBuild = {
      ...released,
      files: released.files.filter(file => file.name !== 'manifest.json'),
    }
    expect(installUrlOf(unlisted)).toBeUndefined()
  })
})
