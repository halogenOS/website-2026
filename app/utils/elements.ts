// Intent: nav.devices names supported phones; nav.features names OS features;
// nav.community names the project's communities; nav.source names its source repositories.
// Intent: element.* names the chemical elements in lowercase; symbols and masses remain invariant.

export const HALOGEN_GROUP = 17

export interface Halogen {
  /** The destination's i18n key. */
  readonly key: string
  readonly to: string
  readonly number: number
  readonly symbol: HalogenSymbol
  readonly nameKey: string
  readonly mass: string
  readonly children?: 'device'
}

export interface Neighbour {
  readonly group: number
  readonly number: number
  readonly symbol: string
}

export interface Period {
  readonly period: number
  readonly element: Halogen
  readonly neighbours: readonly Neighbour[]
}

export type HalogenSymbol = 'F' | 'Cl' | 'Br' | 'I'

export const PERIODS: readonly Period[] = [
  {
    period: 2,
    element: {
      key: 'nav.features', to: '/features', number: 9, symbol: 'F', nameKey: 'element.fluorine', mass: '18.998',
    },
    neighbours: [
      { group: 15, number: 7, symbol: 'N' },
      { group: 16, number: 8, symbol: 'O' },
      { group: 18, number: 10, symbol: 'Ne' },
    ],
  },
  {
    period: 3,
    element: {
      key: 'nav.community', to: '/community', number: 17, symbol: 'Cl', nameKey: 'element.chlorine', mass: '35.45',
    },
    neighbours: [
      { group: 15, number: 15, symbol: 'P' },
      { group: 16, number: 16, symbol: 'S' },
      { group: 18, number: 18, symbol: 'Ar' },
    ],
  },
  {
    period: 4,
    element: {
      key: 'nav.devices', to: '/devices', number: 35, symbol: 'Br', nameKey: 'element.bromine', mass: '79.904',
      children: 'device',
    },
    neighbours: [
      { group: 15, number: 33, symbol: 'As' },
      { group: 16, number: 34, symbol: 'Se' },
      { group: 18, number: 36, symbol: 'Kr' },
    ],
  },
  {
    period: 5,
    element: {
      key: 'nav.source', to: 'https://git.halogenos.org', number: 53, symbol: 'I',
      nameKey: 'element.iodine', mass: '126.90',
    },
    neighbours: [
      { group: 15, number: 51, symbol: 'Sb' },
      { group: 16, number: 52, symbol: 'Te' },
      { group: 18, number: 54, symbol: 'Xe' },
    ],
  },
]

export const HALOGENS: readonly Halogen[] = PERIODS.map(period => period.element)

// Literal classes let Tailwind detect every colour; symbol keys keep colour roles independent of translated names.
export const ELEMENT_TONE: Readonly<Record<HalogenSymbol, string>> = {
  F: '[--element:var(--color-element-fluorine)]',
  Cl: '[--element:var(--color-element-chlorine)]',
  Br: '[--element:var(--color-element-bromine)]',
  I: '[--element:var(--color-element-iodine)]',
}
