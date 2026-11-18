// The resolver supplies builds newest first; the first match is the newest without sorting again.

import { INSTALLER_URL } from '#shared/data/devices'
import type { BuildFile, BuildKind, DeviceBuild } from '#shared/types/releases'

interface RecoveryImage {
  readonly name: string
  /** The description's i18n key, or undefined for an image named by its file name alone. */
  readonly description?: string
}

// The images a recovery needs, in the order the installer writes them before it reboots into
// fastbootd. The installer builds every other partition from the release.
const RECOVERY_IMAGES: readonly RecoveryImage[] = [
  { name: 'boot.img', description: 'device.artifactBoot' },
  { name: 'dtbo.img' },
  { name: 'vendor_boot.img', description: 'device.artifactVendorBoot' },
  { name: 'vbmeta.img' },
  { name: 'vbmeta_system.img' },
  { name: 'recovery.img', description: 'device.artifactRecovery' },
]

export interface RecoveryFile {
  readonly file: BuildFile
  /** The description's i18n key, or undefined for an image named by its file name alone. */
  readonly description: string | undefined
}

/** The recovery images of a build, the only files the site offers for download. */
export const recoveryFilesOf = (build: DeviceBuild): readonly RecoveryFile[] =>
  RECOVERY_IMAGES.flatMap((image) => {
    const file = build.files.find(candidate => candidate.name.toLowerCase() === image.name)
    return file === undefined ? [] : [{ file, description: image.description }]
  })

// The installer reads this file of a release to install it.
const INSTALL_MANIFEST = 'manifest.json'

const INSTALLER_RELEASE_PARAMETER = 'release'

/** The installer address for this build, or undefined for a build the installer cannot install. */
export const installUrlOf = (build: DeviceBuild): string | undefined => {
  if (!build.files.some(file => file.name === INSTALL_MANIFEST)) return undefined
  const url = new URL(INSTALLER_URL)
  url.searchParams.set(INSTALLER_RELEASE_PARAMETER, build.tag)
  return url.href
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
