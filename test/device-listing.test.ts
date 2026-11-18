import { describe, expect, it } from 'vitest'

import { listedDevicesOf } from '../app/utils/device-listing'

describe('the devices on the devices page', () => {
  it('are the devices with builds in the release record, in the order of the device list', () => {
    const listed = listedDevicesOf({
      fetchedAt: '2026-11-18T19:00:00Z',
      devices: {
        guacamole: { lastBuild: '2026-11-01', buildCount: 1 },
        Spacewar: { lastBuild: '2026-11-18', buildCount: 2 },
      },
    })
    expect(listed.map(entry => [entry.device.codename, entry.activity.buildCount])).toEqual([
      ['Spacewar', 2],
      ['guacamole', 1],
    ])
  })

  it('are none when the release data cannot be served', () => {
    expect(listedDevicesOf(null)).toEqual([])
  })
})
