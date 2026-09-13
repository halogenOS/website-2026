/**
 * UTC prevents server/browser date differences and matches the release summary.
 * Localize month names but preserve day-month-year order across locales.
 */
export const useBuildFormat = () => {
  const { locale } = useI18n()

  const partsOf = (instant: string, month: 'long' | 'short') =>
    new Intl.DateTimeFormat(locale.value, {
      day: 'numeric',
      month,
      year: 'numeric',
      timeZone: 'UTC',
    }).formatToParts(new Date(instant))

  const piece = (parts: readonly Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value ?? ''

  const longDate = (instant: string): string => {
    const parts = partsOf(instant, 'long')
    return `${piece(parts, 'day')} ${piece(parts, 'month')} ${piece(parts, 'year')}`
  }

  const shortDate = (instant: string): string => {
    const parts = partsOf(instant, 'short')
    return `${piece(parts, 'day')} ${piece(parts, 'month')} ${piece(parts, 'year')}`
  }

  const monthAndYear = (instant: string): string => {
    const parts = partsOf(instant, 'short')
    return `${piece(parts, 'month')} ${piece(parts, 'year')}`
  }

  return { longDate, shortDate, monthAndYear, fileSize }
}

// Precision is per binary unit so package sizes retain detail without decimals on whole MiB.
const UNITS: readonly { readonly suffix: string, readonly decimals: number }[] = [
  { suffix: 'B', decimals: 0 },
  { suffix: 'KiB', decimals: 1 },
  { suffix: 'MiB', decimals: 0 },
  { suffix: 'GiB', decimals: 2 },
  { suffix: 'TiB', decimals: 2 },
]

/** Binary sizes use standard suffixes and locale-independent decimal formatting. */
const fileSize = (bytes: number): string => {
  let value = Math.max(0, bytes)
  let step = 0
  while (value >= 1024 && step < UNITS.length - 1) {
    value /= 1024
    step += 1
  }
  const unit = UNITS[step]!
  return `${value.toFixed(unit.decimals)} ${unit.suffix}`
}
