import type { Device } from '#shared/data/devices'
import { DEVICES } from '#shared/data/devices'
import type { DeviceActivity, ReleaseSummary } from '#shared/types/releases'

export interface ListedDevice {
  readonly device: Device
  readonly activity: DeviceActivity
}

/** The devices with builds in the release record, in the order of the device list. */
export const listedDevicesOf = (summary: ReleaseSummary | null): readonly ListedDevice[] =>
  DEVICES.flatMap((device) => {
    const activity = summary?.devices[device.codename]
    return activity === undefined ? [] : [{ device, activity }]
  })
