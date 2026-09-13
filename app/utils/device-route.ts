import type { RouteParams } from 'vue-router'
import type { Device } from '#shared/data/devices'
import { deviceByCodename, devicePath } from '#shared/data/devices'

export const deviceAddressUnknown = () =>
  createError({ statusCode: 404, statusMessage: 'Not Found', fatal: true })

/** Pages repeat the middleware lookup so the throw narrows the type without an assertion. */
export const routeDevice = (params: RouteParams): Device => {
  const device = deviceByCodename(String(params.codename ?? ''))
  if (!device) throw deviceAddressUnknown()
  return device
}

/** Section names must match the page file names. */
export const deviceSectionPath = (device: Device, section: string): string =>
  `${devicePath(device)}/${section}`

export const BUILD_HISTORY_SECTION = 'builds'
