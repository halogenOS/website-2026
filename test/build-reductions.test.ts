import { describe, expect, it } from 'vitest'

import {
  buildAnchor,
  featuredBuildsOf,
  featuredFilesOf,
  seriesGroupsOf,
} from '../app/utils/builds'
import type { BuildFile, BuildKind, DeviceBuild } from '../shared/types/releases'

// Builds can share a publication second, so timestamps cannot uniquely identify page anchors.

const buildAt = (publishedAt: string, kind: BuildKind, series: string | null): DeviceBuild => ({
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

// Named artifacts follow the device flashing order.

describe('the files of a featured build', () => {
  const fileNamed = (name: string) => ({ name, size: 1, url: `https://example.invalid/${name}` })
  const shipped: DeviceBuild = {
    ...buildAt('2026-07-28T06:50:51Z', 'stable', '16.2'),
    files: [
      fileNamed('boot.img'),
      fileNamed('halogenOS_Pong-16.2-20260728-064754-OFFICIAL.zip'),
      fileNamed('pkmd.bin'),
      fileNamed('recovery.img'),
      fileNamed('super_empty.img'),
      fileNamed('vendor_boot.img'),
    ],
  }

  it('sorts them into package, described artifacts and quiet chips', () => {
    const files = featuredFilesOf(shipped, 'Pong')
    expect(files.rom?.name).toBe('halogenOS_Pong-16.2-20260728-064754-OFFICIAL.zip')
    expect(files.artifacts.map(artifact => [artifact.file.name, artifact.description])).toEqual([
      ['boot.img', 'device.artifactBoot'],
      ['vendor_boot.img', 'device.artifactVendorBoot'],
      ['recovery.img', 'device.artifactRecovery'],
    ])
    expect(files.support.map(file => file.name)).toEqual(['pkmd.bin', 'super_empty.img'])
  })

  it('gives a file the mapping does not name a row without a description', () => {
    const legacy: DeviceBuild = {
      ...shipped,
      files: [
        fileNamed('halogenOS_guacamole-12.1-20220815-1947-rolling-OFFICIAL.zip'),
        fileNamed('boot.img'),
        fileNamed('op7pro_fw.zip'),
        fileNamed('halogenOS_guacamole-12.1-20220815-1947-rolling-OFFICIAL.zip.sha256sum'),
      ],
    }
    const files = featuredFilesOf(legacy, 'guacamole')
    expect(files.artifacts.map(artifact => [artifact.file.name, artifact.description])).toEqual([
      ['boot.img', 'device.artifactBoot'],
      ['op7pro_fw.zip', undefined],
    ])
    expect(files.support.map(file => file.name)).toEqual([
      'halogenOS_guacamole-12.1-20220815-1947-rolling-OFFICIAL.zip.sha256sum',
    ])
  })

  it('reads the tier off the name in lower case, suffix rule included', () => {
    const shouted: DeviceBuild = {
      ...shipped,
      files: [
        fileNamed('BOOT.IMG'),
        fileNamed('PKMD.BIN'),
        fileNamed('boot.img.SHA256SUM'),
      ],
    }
    const files = featuredFilesOf(shouted, 'Pong')
    expect(files.artifacts.map(artifact => [artifact.file.name, artifact.description])).toEqual([
      ['BOOT.IMG', 'device.artifactBoot'],
    ])
    expect(files.support.map(file => file.name)).toEqual(['PKMD.BIN', 'boot.img.SHA256SUM'])
  })

  // Set comparison would hide duplicate files.
  it('hides nothing and doubles nothing: the tiers partition the build\'s files', () => {
    const byName = (left: BuildFile, right: BuildFile) => left.name.localeCompare(right.name)
    const builds = [
      shipped,
      buildAt('2025-04-22T20:50:58Z', 'test', null),
      { ...shipped, files: [fileNamed('boot.img'), fileNamed('pkmd.bin')] },
    ]
    for (const build of builds) {
      const files = featuredFilesOf(build, 'Pong')
      const shown = [
        ...(files.rom === undefined ? [] : [files.rom]),
        ...files.artifacts.map(artifact => artifact.file),
        ...files.support,
      ]
      expect([...shown].sort(byName)).toEqual([...build.files].sort(byName))
    }
  })
})
