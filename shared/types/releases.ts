// The catalog the server resolves from the release records, and the summary derived from
// it. Both live in the shared layer because the server resolves and the pages print; a
// page importing a type from `server/` would tie the client to server-only code. The
// summary is a reduction over the catalog, never a second bucketing, so the counts on
// /devices cannot drift from the build lists on a device page.

/**
 * `stable` is a published release, `candidate` a release candidate, `test` an
 * experimental build. Derived once, in the resolver, from the record's `prerelease`
 * flag and the marker its name opens with.
 */
export type BuildKind = 'stable' | 'candidate' | 'test'

/** One downloadable file of a build, as the release record publishes it. */
export interface BuildFile {
  /** The file's own name, exactly as it is published. */
  readonly name: string
  /** Size in bytes; the page decides how a human reads it. */
  readonly size: number
  /** The direct download URL. Files come from the forge, never through this site. */
  readonly url: string
}

/**
 * One published build of one device. Nothing here assumes a particular file exists: a
 * build with no files or a partial set is an ordinary value, not an error.
 */
export interface DeviceBuild {
  /** The record's `published_at`, the fixed-width UTC instant, carried whole. */
  readonly publishedAt: string
  readonly kind: BuildKind
  /**
   * The OS series the build's name carries (`16.2`, `12.1`); `null` when a name carries
   * none, which older records do, never an error.
   */
  readonly series: string | null
  /** The build's own release notes on the forge (the record's `html_url`). */
  readonly notesUrl: string
  readonly files: readonly BuildFile[]
}

/**
 * Every listed device's builds, newest first. `devices` is keyed by the codename as the
 * shared device list spells it, and its keys are a subset of that list: a device with no
 * builds is omitted, so a consumer falls back to its baseline as it does with no catalog.
 */
export interface ReleaseCatalog {
  /** ISO instant of the successful refresh. */
  readonly fetchedAt: string
  readonly devices: Readonly<Record<string, readonly DeviceBuild[]>>
}

/** What one device's release record says, reduced to what the devices page prints. */
export interface DeviceActivity {
  /** UTC calendar date of the newest bucketed `published_at`. */
  readonly lastBuild: string
  /** Releases bucketed to the codename: any build type, assets or none. */
  readonly buildCount: number
}

/**
 * The API contract of `GET /api/releases`: a pure reduction over the catalog, with the
 * same keys, order and fetch instant.
 */
export interface ReleaseSummary {
  /** ISO instant of the successful refresh. */
  readonly fetchedAt: string
  readonly devices: Readonly<Record<string, DeviceActivity>>
}
