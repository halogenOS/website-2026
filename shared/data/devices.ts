// The devices the site lists. The two numbers beside each are a baseline, shown only
// when `/api/releases` has no live summary; they are data, not copy, and the ISO date is
// shown as stored. The list lives in the shared layer because the page prints it and
// the release route derives its codename list from it; a server route cannot import
// from an SFC. Codename case is decided in `deviceByCodename` alone: the record's
// spelling is the display and summary key, the lowercase form exists only in URLs and
// lookups.

/** One listed device: its identity, plus the numbers to print with no live summary. */
export interface Device {
  /** The build system's name for the device, spelled as the release record spells it. */
  readonly codename: string
  /** The device's marketing name, the way its maker writes it. */
  readonly name: string
  /** Baseline: the day the newest build was published, as an ISO calendar date. */
  readonly lastBuild: string
  /** Baseline: how many builds this device has had. */
  readonly buildCount: number
}

export const DEVICES: readonly Device[] = [
  { codename: 'Pong', name: 'Nothing Phone (2)', lastBuild: '2026-07-28', buildCount: 45 },
  { codename: 'Spacewar', name: 'Nothing Phone (1)', lastBuild: '2026-07-07', buildCount: 49 },
  { codename: 'guacamole', name: 'OnePlus 7 Pro', lastBuild: '2026-07-03', buildCount: 138 },
]

/** The codenames a catalog resolves for, in the listed order. */
export const DEVICE_CODENAMES: readonly string[] = DEVICES.map(device => device.codename)

/** The one case-insensitive index of the list; lookup lowercasing happens here only. */
const BY_LOWERCASE_CODENAME: ReadonlyMap<string, Device> = new Map(
  DEVICES.map(device => [device.codename.toLowerCase(), device]),
)

/**
 * The listed device a codename names, in any casing, or `undefined` when the site lists
 * no such device. Every case decision goes through here so an address, an API parameter
 * and a link agree on what `Pong` and `pong` mean.
 */
export const deviceByCodename = (codename: string): Device | undefined =>
  BY_LOWERCASE_CODENAME.get(codename.toLowerCase())

/** The canonical address of a device's page: its codename, lowercased, under /devices. */
export const devicePath = (device: Device): string =>
  `/devices/${device.codename.toLowerCase()}`

/** Where every build the project has published lives; recorded once for every surface that links it. */
export const EVERY_BUILD_URL = 'https://github.com/halogenOS/builds/releases'
