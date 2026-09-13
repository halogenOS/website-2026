// Failures must throw: returning a degraded value would replace the last good cached catalog.

import type { ReleaseCatalog } from '#shared/types/releases'
import { buildReleaseCatalog, parseRawReleases } from './release-resolve'

export interface ReleaseFetcherOptions {
  readonly baseUrl: string
  /** A token raises the upstream rate limit but is not required. */
  readonly token?: string
  readonly codenames: readonly string[]
  readonly timeoutMs?: number
  readonly deadlineMs?: number
  readonly fetchImpl?: typeof fetch
  readonly now?: () => number
}

export type ReleaseFetcher = () => Promise<ReleaseCatalog>

const RELEASES_PATH = '/repos/halogenOS/builds/releases'
const PER_PAGE = 100
const DEFAULT_TIMEOUT_MS = 10_000

// Bound the entire refresh because a request without cached data waits for all pages.
const DEFAULT_DEADLINE_MS = 30_000

// Bound pagination even if the upstream keeps adding pages; 30 leaves room beyond the seven-page catalog.
const MAX_PAGES = 30

// Clamp untrusted delay headers so excessive values cannot prolong fallback indefinitely
// and expired reset times cannot cause repeated requests.
const MIN_BACKOFF_MS = 60_000
const MAX_BACKOFF_MS = 3_600_000

// A failed multi-page request consumes the shared 60-request/hour unauthenticated budget.
const DEFAULT_BACKOFF_MS = 900_000

const secondsIn = (headers: Headers, name: string): number | undefined => {
  const value = Number(headers.get(name))
  return Number.isFinite(value) && value > 0 ? value : undefined
}

/** `x-ratelimit-reset` is epoch seconds; `retry-after` is a delay in seconds. */
const nextAttemptFrom = (headers: Headers, now: number): number => {
  const reset = secondsIn(headers, 'x-ratelimit-reset')
  const retryAfter = secondsIn(headers, 'retry-after')
  const announced = [
    ...(reset === undefined ? [] : [reset * 1000 - now]),
    ...(retryAfter === undefined ? [] : [retryAfter * 1000]),
  ]
  const delay = announced.length > 0 ? Math.max(...announced) : DEFAULT_BACKOFF_MS
  return now + Math.min(Math.max(delay, MIN_BACKOFF_MS), MAX_BACKOFF_MS)
}

export const createReleaseFetcher = (options: ReleaseFetcherOptions): ReleaseFetcher => {
  const fetchImpl = options.fetchImpl ?? fetch
  const now = options.now ?? Date.now
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const deadlineMs = options.deadlineMs ?? DEFAULT_DEADLINE_MS
  const baseUrl = options.baseUrl.replace(/\/+$/, '')
  let nextAttemptAt = 0

  const fetchPage = async (page: number, startedAt: number): Promise<unknown[]> => {
    const remainingMs = deadlineMs - (now() - startedAt)
    if (remainingMs <= 0) {
      throw new Error(`release fetch exceeded its ${deadlineMs} ms refresh deadline`)
    }
    const url = `${baseUrl}${RELEASES_PATH}?per_page=${PER_PAGE}&page=${page}`
    const response = await fetchImpl(url, {
      headers: {
        // Explicit media type and API version prevent upstream defaults from changing the response shape.
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      signal: AbortSignal.timeout(Math.min(timeoutMs, remainingMs)),
    })
    if (!response.ok) {
      nextAttemptAt = nextAttemptFrom(response.headers, now())
      throw new Error(`release fetch got HTTP ${response.status} from upstream page ${page}`)
    }
    const body: unknown = await response.json()
    if (!Array.isArray(body)) {
      throw new Error(`release fetch got a non-array body from upstream page ${page}`)
    }
    return body
  }

  return async (): Promise<ReleaseCatalog> => {
    const startedAt = now()
    if (startedAt < nextAttemptAt) {
      throw new Error(`release fetch backed off until ${new Date(nextAttemptAt).toISOString()}`)
    }
    // Record backoff before fetching so timeouts, connection failures and DNS failures also delay retries.
    nextAttemptAt = startedAt + DEFAULT_BACKOFF_MS

    const raw: unknown[] = []
    let page = 1
    for (;;) {
      const body = await fetchPage(page, startedAt)
      raw.push(...body)
      // Do not follow absolute Link URLs: they can escape the configured API base and send the token elsewhere.
      // Short-page termination costs an extra request when the total is a multiple of the page size.
      if (body.length < PER_PAGE) break
      if (page === MAX_PAGES) {
        // At the default delay, repeated 30-page failures would exceed the 60-request/hour budget.
        // The maximum delay limits this failure to 30 requests/hour.
        nextAttemptAt = now() + MAX_BACKOFF_MS
        throw new Error(`release fetch hit its ${MAX_PAGES}-page ceiling with more upstream pages left`)
      }
      page += 1
    }

    // Cache only complete results; a partial catalog would publish incorrect counts.
    const catalog = buildReleaseCatalog(
      parseRawReleases(raw), options.codenames, new Date(now()).toISOString())
    nextAttemptAt = 0
    return catalog
  }
}
