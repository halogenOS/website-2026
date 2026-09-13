import type {
  BuildFile,
  BuildKind,
  DeviceBuild,
  ReleaseCatalog,
  ReleaseSummary,
} from '#shared/types/releases'

/**
 * `created_at` reflects bulk imports, not publication; build kind comes from prerelease and name, not tags.
 * Validate assets separately so one malformed file does not discard its build.
 */
export interface RawRelease {
  readonly name: string | null
  readonly published_at: string
  readonly prerelease: boolean
  readonly html_url: string
  readonly assets?: unknown
}

// Fixed-width UTC timestamps make string order match instant order; parseable offset dates do not.
const UTC_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/

const carriesAnInstant = (value: unknown): value is string =>
  typeof value === 'string' && UTC_INSTANT.test(value) && !Number.isNaN(Date.parse(value))

// Require the prerelease flag: a missing value must not classify a stable build as a test build.
const isRawRelease = (value: unknown): value is RawRelease => {
  const release = value as Partial<RawRelease> | null
  return typeof release === 'object' && release !== null
    && (typeof release.name === 'string' || release.name === null)
    && carriesAnInstant(release.published_at)
    && typeof release.prerelease === 'boolean'
    && typeof release.html_url === 'string'
}

export const parseRawReleases = (page: readonly unknown[]): RawRelease[] =>
  page.filter(isRawRelease)

// Legacy names with dates after the codename, GSI builds and emulator targets do not use this suffix.
const codenameOf = (release: RawRelease): string | undefined =>
  release.name === null ? undefined : /for (\w+)\s*$/.exec(release.name)?.[1]

const seriesOf = (release: RawRelease): string | null =>
  (release.name === null ? null : /XOS[-\s]v?(\d+(?:\.\d+)*)/.exec(release.name)?.[1] ?? null)

const kindOf = (release: RawRelease): BuildKind => {
  if (release.prerelease === false) return 'stable'
  return release.name?.startsWith('[release candidate') ? 'candidate' : 'test'
}

// These untrusted URLs reach download links; reject schemes that can execute script.
const HTTPS_URL = /^https:\/\//i

// Asset sets can be empty or partial; do not infer missing files or discard a build for a malformed asset.
const filesOf = (release: RawRelease): BuildFile[] => {
  if (!Array.isArray(release.assets)) return []
  const files: BuildFile[] = []
  for (const value of release.assets as readonly unknown[]) {
    const asset = value as Partial<{ name: unknown, size: unknown, browser_download_url: unknown }> | null
    if (typeof asset !== 'object' || asset === null) continue
    if (typeof asset.name !== 'string') continue
    if (typeof asset.size !== 'number' || !Number.isFinite(asset.size)) continue
    if (typeof asset.browser_download_url !== 'string') continue
    if (!HTTPS_URL.test(asset.browser_download_url)) continue
    files.push({ name: asset.name, size: asset.size, url: asset.browser_download_url })
  }
  return files
}

// Use UTC so host timezone differences cannot shift a build to another calendar day.
const utcDateOf = (instant: string): string => new Date(instant).toISOString().slice(0, 10)

// Upstream order is not publication order; break timestamp ties by name for deterministic output.
const newestFirst = (a: RawRelease, b: RawRelease): number => {
  if (a.published_at !== b.published_at) return a.published_at < b.published_at ? 1 : -1
  const left = a.name ?? ''
  const right = b.name ?? ''
  if (left === right) return 0
  return left < right ? 1 : -1
}

/**
 * Count all build kinds, including releases without files; omitted devices use their baseline.
 * Throw when no listed device resolves so a broken record cannot replace the last good cache entry.
 */
export const buildReleaseCatalog = (
  raw: readonly RawRelease[],
  codenames: readonly string[],
  fetchedAt: string,
): ReleaseCatalog => {
  const listed = new Set(codenames)
  const buckets = new Map<string, RawRelease[]>()
  for (const release of raw) {
    const codename = codenameOf(release)
    if (codename === undefined || !listed.has(codename)) continue
    const bucket = buckets.get(codename)
    if (bucket) bucket.push(release)
    else buckets.set(codename, [release])
  }

  const devices: Record<string, readonly DeviceBuild[]> = {}
  for (const codename of codenames) {
    const bucket = buckets.get(codename)
    if (!bucket || bucket.length === 0) continue
    devices[codename] = [...bucket].sort(newestFirst).map(release => ({
      publishedAt: release.published_at,
      kind: kindOf(release),
      series: seriesOf(release),
      notesUrl: release.html_url,
      files: filesOf(release),
    }))
  }

  if (Object.keys(devices).length === 0) {
    throw new Error('release resolution found no listed device in the upstream record')
  }
  return { fetchedAt, devices }
}

// Summary consumers read the first build and truncate its date; empty or undated buckets would throw.
// Validate only that contract here, without repeating full asset validation on every cache read.
const carriesBuilds = (bucket: unknown): boolean =>
  Array.isArray(bucket) && bucket.length > 0 && bucket.every(
    build => typeof build === 'object' && build !== null
      && typeof (build as Partial<DeviceBuild>).publishedAt === 'string',
  )

// Stale revalidation can serve persisted values before refreshing; reject incompatible shapes first.
export const isReleaseCatalog = (value: unknown): value is ReleaseCatalog => {
  const catalog = value as Partial<ReleaseCatalog> | null
  if (typeof catalog !== 'object' || catalog === null) return false
  if (typeof catalog.fetchedAt !== 'string') return false
  const devices: unknown = catalog.devices
  if (typeof devices !== 'object' || devices === null) return false
  return Object.values(devices).every(carriesBuilds)
}

export const summariseCatalog = (catalog: ReleaseCatalog): ReleaseSummary => {
  const devices: ReleaseSummary['devices'] = Object.fromEntries(
    Object.entries(catalog.devices).map(([codename, builds]) => [codename, {
      lastBuild: utcDateOf(builds[0]!.publishedAt),
      buildCount: builds.length,
    }]),
  )
  return { fetchedAt: catalog.fetchedAt, devices }
}
