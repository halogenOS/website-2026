// The resolver supplies builds newest first; the first match is the newest without sorting again.

import type { BuildFile, BuildKind, DeviceBuild } from '#shared/types/releases'

/**
 * Device-named archives identify the system package; guacamole vendor firmware archives can be larger.
 * Size alone cannot distinguish them.
 */
export const packageOf = (build: DeviceBuild, codename: string): BuildFile | undefined => {
  const named = `_${codename.toLowerCase()}-`
  return build.files.find((file) => {
    const name = file.name.toLowerCase()
    return name.endsWith('.zip') && name.includes(named)
  })
}

export const piecesOf = (build: DeviceBuild, codename: string): readonly BuildFile[] => {
  const packaged = packageOf(build, codename)
  return packaged === undefined ? build.files : build.files.filter(file => file !== packaged)
}

/** Builds can share a publication second, so page identity uses position in the server-ordered list. */
export interface PlacedBuild {
  readonly index: number
  readonly build: DeviceBuild
}

/**
 * Positions shift when newer builds arrive; these anchors are page-local.
 * Do not store them or link to them externally.
 */
export const buildAnchor = (index: number): string => `build-${index}`

const FEATURED_PLACE: Record<BuildKind, { readonly order: number }> = {
  stable: { order: 0 },
  candidate: { order: 1 },
  test: { order: 2 },
}

export const FEATURED_KINDS: readonly BuildKind[] = (Object.keys(FEATURED_PLACE) as BuildKind[])
  .sort((left, right) => FEATURED_PLACE[left].order - FEATURED_PLACE[right].order)

export const buildKindOf = (value: string): BuildKind | undefined =>
  FEATURED_KINDS.find(kind => kind === value)

export const kindLabelKey = (kind: BuildKind): string => `device.kind.${kind}`

/**
 * Set --element on the object so its descendants inherit the correct value.
 * An empty stable step preserves the depth's element and must not be treated as an absent step.
 */
const KIND_ELEMENT_STEP: Record<BuildKind, { readonly always: string, readonly atDesk: string }> = {
  stable: { always: '', atDesk: '' },
  candidate: {
    always: '[--element:var(--element-candidate)]',
    atDesk: 'desk:[--element:var(--element-candidate)]',
  },
  test: {
    always: '[--element:var(--element-test)]',
    atDesk: 'desk:[--element:var(--element-test)]',
  },
}

export const kindElementStep = (kind: BuildKind): string => KIND_ELEMENT_STEP[kind].always

/** Tailwind needs literal variant classes; a desk: prefix cannot be added at runtime. */
export const kindElementStepAtDesk = (kind: BuildKind): string => KIND_ELEMENT_STEP[kind].atDesk

/** Rail lengths distinguish kinds when their colours are too similar in the light scheme. */
const KIND_RAIL: Record<BuildKind, string> = {
  stable: 'h-full bg-[var(--element)]',
  candidate: 'h-[62%] bg-[var(--element)]',
  test: 'h-[38%] bg-[var(--element)]',
}

export const kindRail = (kind: BuildKind): string => KIND_RAIL[kind]

/** An outline distinguishes test cards across their whole area when colour alone is insufficient. */
const KIND_CARD_BACKING: Record<BuildKind, 'solid' | 'outline'> = {
  stable: 'solid',
  candidate: 'solid',
  test: 'outline',
}

export const kindCardBacking = (kind: BuildKind): 'solid' | 'outline' => KIND_CARD_BACKING[kind]

export interface FeaturedBuild {
  readonly kind: BuildKind
  readonly build: DeviceBuild
}

export const featuredBuildsOf = (builds: readonly DeviceBuild[]): FeaturedBuild[] =>
  FEATURED_KINDS.flatMap((kind) => {
    const build = builds.find(candidate => candidate.kind === kind)
    return build === undefined ? [] : [{ kind, build }]
  })

type FeaturedTier = 'artifact' | 'support'

interface FilePlacement {
  readonly tier: FeaturedTier
  readonly description?: string
}

/** Named artifacts follow flashing order; unknown files follow them in the release record's order. */
const FILE_TIERS: ReadonlyMap<string, FilePlacement> = new Map<string, FilePlacement>([
  ['boot.img', { tier: 'artifact', description: 'device.artifactBoot' }],
  ['vendor_boot.img', { tier: 'artifact', description: 'device.artifactVendorBoot' }],
  ['recovery.img', { tier: 'artifact', description: 'device.artifactRecovery' }],
  ['pkmd.bin', { tier: 'support' }],
  ['super_empty.img', { tier: 'support' }],
])

const CHECKSUM_SUFFIX = '.sha256sum'
const CHECKSUM_PLACEMENT: FilePlacement = { tier: 'support' }
const UNNAMED_PLACEMENT: FilePlacement = { tier: 'artifact' }

const placementOf = (name: string): FilePlacement =>
  FILE_TIERS.get(name)
  ?? (name.endsWith(CHECKSUM_SUFFIX) ? CHECKSUM_PLACEMENT : UNNAMED_PLACEMENT)

const ARTIFACT_ORDER: readonly string[] = [...FILE_TIERS]
  .filter(([, placement]) => placement.tier === 'artifact')
  .map(([name]) => name)

const artifactRank = (name: string): number => {
  const at = ARTIFACT_ORDER.indexOf(name)
  return at === -1 ? ARTIFACT_ORDER.length : at
}

export interface FeaturedArtifact {
  readonly file: BuildFile
  /** The description's i18n key, or undefined for an unnamed file. */
  readonly description: string | undefined
}

export interface FeaturedFiles {
  readonly rom: BuildFile | undefined
  readonly artifacts: readonly FeaturedArtifact[]
  readonly support: readonly BuildFile[]
}

export const featuredFilesOf = (build: DeviceBuild, codename: string): FeaturedFiles => {
  const rom = packageOf(build, codename)
  const prominent: { readonly rank: number, readonly artifact: FeaturedArtifact }[] = []
  const support: BuildFile[] = []
  for (const file of build.files) {
    if (file === rom) continue
    const name = file.name.toLowerCase()
    const placement = placementOf(name)
    if (placement.tier === 'support') support.push(file)
    else prominent.push({ rank: artifactRank(name), artifact: { file, description: placement.description } })
  }
  return {
    rom,
    // Equal ranks must preserve the release record's order.
    artifacts: prominent.sort((left, right) => left.rank - right.rank).map(entry => entry.artifact),
    support,
  }
}

/** XOS is the build system's product name, not translatable copy. */
export const seriesLabel = (series: string): string => `XOS ${series}`

export interface SeriesGroup {
  readonly series: string | null
  readonly builds: readonly PlacedBuild[]
}

/** Group consecutive runs to preserve chronology when a series resumes after another series. */
export const seriesGroupsOf = (builds: readonly DeviceBuild[]): SeriesGroup[] => {
  const groups: { series: string | null, builds: PlacedBuild[] }[] = []
  for (const [index, build] of builds.entries()) {
    const open = groups.at(-1)
    if (open && open.series === build.series) open.builds.push({ index, build })
    else groups.push({ series: build.series, builds: [{ index, build }] })
  }
  return groups
}
