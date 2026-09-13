import { describe, expect, it, vi } from 'vitest'

import { placeOf } from '../app/utils/places'
import { HALOGENS, PERIODS } from '../app/utils/elements'
import { FEATURED_KINDS, kindLabelKey } from '../app/utils/builds'
import { DEVICES, devicePath } from '../shared/data/devices'
import locale from '../i18n/locales/en.json'

const crumbs = (path: string) => placeOf(path)?.trail.map(crumb => [
  crumb.to, 'key' in crumb ? crumb.key : crumb.text,
])

const element = (path: string) => {
  const mark = placeOf(path)?.mark
  return mark !== undefined && 'element' in mark ? mark.element.symbol : null
}

describe('the place an address stands in', () => {
  it('resolves every listed device and build kind from the page data', () => {
    for (const device of DEVICES) {
      const path = devicePath(device)
      expect(placeOf(path)?.trail.at(-1)).toEqual({ to: path, text: device.name })
      for (const kind of FEATURED_KINDS) {
        expect(placeOf(`${path}/${kind}`)?.trail.at(-1)).toEqual({
          to: `${path}/${kind}`, key: kindLabelKey(kind),
        })
        expect(element(`${path}/${kind}`)).toBe('Br')
      }
      expect(placeOf(`${path}/builds`)?.trail.at(-1)).toEqual({
        to: `${path}/builds`, key: 'device.allBuilds',
      })
    }
  })

  it('shares element records and preserves writer-supplied lowercase chemical names', () => {
    const names = HALOGENS.map((halogen, index) => {
      expect(halogen).toBe(PERIODS[index]?.element)
      const key = halogen.nameKey.replace('element.', '') as keyof typeof locale.element
      expect(halogen.nameKey).toMatch(/^element\./)
      return locale.element[key]
    })
    expect(names).toEqual(['fluorine', 'chlorine', 'bromine', 'iodine'])
    expect(HALOGENS.map(halogen => halogen.symbol)).toEqual(['F', 'Cl', 'Br', 'I'])
    for (const halogen of HALOGENS.filter(item => item.to.startsWith('/'))) {
      const mark = placeOf(halogen.to)?.mark
      expect(mark && 'element' in mark ? mark.element : null).toBe(halogen)
    }
  })

  it('resolves Devices children only when its section data carries the children field', async () => {
    expect(placeOf('/devices/pong')?.trail.at(-1)).toEqual({
      to: '/devices/pong', text: 'Nothing Phone (2)',
    })
    vi.resetModules()
    vi.doMock('../app/utils/elements', () => ({
      HALOGENS: HALOGENS.map((halogen) => {
        const withoutChildren = { ...halogen }
        delete withoutChildren.children
        return withoutChildren
      }),
    }))
    try {
      const { placeOf: mapped } = await import('../app/utils/places')
      expect(mapped('/devices')?.trail).toEqual(placeOf('/devices')?.trail)
      expect(mapped('/devices/pong')).toBeNull()
      expect(mapped('/devices/unknown')).toBeNull()
      expect(mapped('/features/pong')).toBeNull()
    }
    finally {
      vi.doUnmock('../app/utils/elements')
      vi.resetModules()
    }
  })

  it('lights the depth\'s own element and every device page under Devices', () => {
    expect(element('/features')).toBe('F')
    expect(element('/community')).toBe('Cl')
    expect(element('/devices')).toBe('Br')
    expect(element('/devices/pong')).toBe('Br')
    expect(element('/devices/pong/stable')).toBe('Br')
    expect(element('/devices/pong/builds')).toBe('Br')
  })

  it('lights nothing on the legal pages and hands them their initials', () => {
    expect(placeOf('/privacy')?.mark).toEqual({ initialsKey: 'privacy.initials' })
    expect(placeOf('/imprint')?.mark).toEqual({ initialsKey: 'imprint.initials' })
  })

  it('runs the trail from Home down to the page, one crumb per level', () => {
    expect(crumbs('/features')).toEqual([['/', 'trail.home'], ['/features', 'nav.features']])
    expect(crumbs('/community')).toEqual([['/', 'trail.home'], ['/community', 'nav.community']])
    expect(crumbs('/devices')).toEqual([['/', 'trail.home'], ['/devices', 'nav.devices']])
    expect(crumbs('/devices/pong')).toEqual([
      ['/', 'trail.home'], ['/devices', 'nav.devices'], ['/devices/pong', 'Nothing Phone (2)'],
    ])
    expect(crumbs('/devices/pong/stable')).toEqual([
      ['/', 'trail.home'], ['/devices', 'nav.devices'], ['/devices/pong', 'Nothing Phone (2)'],
      ['/devices/pong/stable', 'device.kind.stable'],
    ])
    expect(crumbs('/devices/pong/builds')).toEqual([
      ['/', 'trail.home'], ['/devices', 'nav.devices'], ['/devices/pong', 'Nothing Phone (2)'],
      ['/devices/pong/builds', 'device.allBuilds'],
    ])
    expect(crumbs('/privacy')).toEqual([['/', 'trail.home'], ['/privacy', 'privacy.title']])
    expect(crumbs('/imprint')).toEqual([['/', 'trail.home'], ['/imprint', 'imprint.title']])
  })

  it.each(['/Features', '/COMMUNITY', '/Devices', '/Privacy', '/IMPRINT', '/Devices/Pong/stable'])(
    'maps accepted section spelling %s to canonical destinations', (path) => {
      expect(placeOf(path)).toEqual(placeOf(path.toLowerCase()))
      expect(placeOf(path)).not.toBeNull()
    })

  it('resolves a codename in any casing to the one canonical address', () => {
    expect(crumbs('/devices/Pong/')).toEqual(crumbs('/devices/pong'))
  })

  it('gives the arrival and every address the site lacks no place at all', () => {
    expect(placeOf('/')).toBeNull()
    expect(placeOf('/nowhere')).toBeNull()
    expect(placeOf('/devices/nothing')).toBeNull()
    expect(placeOf('/devices/pong/nightly')).toBeNull()
    expect(placeOf('/devices/pong/stable/more')).toBeNull()
    expect(placeOf('/features/deeper')).toBeNull()
  })
})
