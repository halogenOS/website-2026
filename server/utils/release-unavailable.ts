import type { H3Event } from 'h3'

/**
 * Exclude upstream bodies and request query strings from logs because both contain untrusted input.
 * Nitro handles stale revalidation failures itself; they do not reach this response helper.
 */
export const releasesUnavailable = (event: H3Event, error: unknown): { unavailable: true } => {
  const pathname = event.path.split('?')[0]
  console.error(`${pathname} is serving the fallback state:`, error instanceof Error
    ? `${error.name}: ${error.message}`
    : String(error))
  setResponseStatus(event, 503)
  return { unavailable: true }
}
