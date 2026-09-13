import { describe, expect, it } from 'vitest'

import { createReleaseFetcher } from '../server/utils/release-fetch'

const LISTED = ['Pong']
const PER_PAGE = 100

const releasePage = (count: number, from = 0): unknown[] =>
  Array.from({ length: count }, (_, index) => ({
    tag_name: `2026010${index}.0000.1-tb`,
    name: '[test build] XOS-16.2 for Pong',
    // GitHub timestamps use second precision, which the resolver requires.
    published_at: new Date(Date.UTC(2026, 0, 1) + (from + index) * 60_000)
      .toISOString().replace(/\.\d{3}Z$/, 'Z'),
    prerelease: true,
    html_url: `https://example.invalid/tag/${from + index}`,
    assets: [],
  }))

interface MockCall {
  readonly url: string
  readonly headers: Headers
}

const countingFetch = (pageOf: (page: number) => unknown[], calls: MockCall[]): typeof fetch =>
  (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    calls.push({ url, headers: new Headers(init?.headers) })
    const page = Number(new URL(url).searchParams.get('page'))
    return new Response(JSON.stringify(pageOf(page)), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }) as unknown as typeof fetch

const stubClock = (start = Date.UTC(2026, 7, 30)) => {
  let current = start
  const advance = (ms: number): void => {
    current += ms
  }
  return { now: () => current, advance }
}

const pagesFor = (total: number) => (page: number): unknown[] => {
  const offset = (page - 1) * PER_PAGE
  return releasePage(Math.max(0, Math.min(PER_PAGE, total - offset)), offset)
}

describe('the release fetcher walk', () => {
  it('asks for the next page only after a full one and stops on a short one', async () => {
    const calls: MockCall[] = []
    const fetcher = createReleaseFetcher({
      baseUrl: 'https://mock.invalid',
      codenames: LISTED,
      fetchImpl: countingFetch(pagesFor(150), calls),
    })
    const catalog = await fetcher()

    expect(calls.map(call => call.url)).toEqual([
      'https://mock.invalid/repos/halogenOS/builds/releases?per_page=100&page=1',
      'https://mock.invalid/repos/halogenOS/builds/releases?per_page=100&page=2',
    ])
    expect(catalog.devices.Pong).toHaveLength(150)
  })

  it('spends one request per started hundred, and one more at an exact multiple', async () => {
    const requestsFor = async (total: number): Promise<number> => {
      const calls: MockCall[] = []
      const fetcher = createReleaseFetcher({
        baseUrl: 'https://mock.invalid',
        codenames: LISTED,
        fetchImpl: countingFetch(pagesFor(total), calls),
      })
      await fetcher()
      return calls.length
    }
    expect(await requestsFor(1)).toBe(1)
    expect(await requestsFor(99)).toBe(1)
    expect(await requestsFor(100)).toBe(2)
    expect(await requestsFor(101)).toBe(2)
    expect(await requestsFor(667)).toBe(7)
  })

  it('strips a trailing slash from the configured base', async () => {
    const calls: MockCall[] = []
    const fetcher = createReleaseFetcher({
      baseUrl: 'https://mock.invalid//',
      codenames: LISTED,
      fetchImpl: countingFetch(pagesFor(1), calls),
    })
    await fetcher()
    expect(calls[0]!.url).toBe('https://mock.invalid/repos/halogenOS/builds/releases?per_page=100&page=1')
  })

  it('throws at the page ceiling instead of walking a self-extending upstream', async () => {
    const calls: MockCall[] = []
    const fetcher = createReleaseFetcher({
      baseUrl: 'https://mock.invalid',
      codenames: LISTED,
      fetchImpl: countingFetch(() => releasePage(PER_PAGE), calls),
    })
    await expect(fetcher()).rejects.toThrow(/30-page ceiling/)
    expect(calls).toHaveLength(30)
  })

  it('throws at the overall deadline rather than stacking per-request timeouts', async () => {
    const clock = stubClock()
    const calls: MockCall[] = []
    const slowFetch: typeof fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ url: String(input), headers: new Headers(init?.headers) })
      clock.advance(11_000)
      return new Response(JSON.stringify(releasePage(PER_PAGE)), { status: 200 })
    }) as unknown as typeof fetch

    const fetcher = createReleaseFetcher({
      baseUrl: 'https://mock.invalid',
      codenames: LISTED,
      fetchImpl: slowFetch,
      now: clock.now,
    })
    await expect(fetcher()).rejects.toThrow(/refresh deadline/)
    expect(calls).toHaveLength(3)
  })

  it('fails the whole refresh when any page fails, and caches no partial catalog', async () => {
    const calls: MockCall[] = []
    const failingSecond: typeof fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      calls.push({ url, headers: new Headers(init?.headers) })
      if (new URL(url).searchParams.get('page') === '2') {
        return new Response('upstream is unwell', { status: 500 })
      }
      return new Response(JSON.stringify(releasePage(PER_PAGE)), { status: 200 })
    }) as unknown as typeof fetch

    const fetcher = createReleaseFetcher({
      baseUrl: 'https://mock.invalid',
      codenames: LISTED,
      fetchImpl: failingSecond,
    })
    await expect(fetcher()).rejects.toThrow(/HTTP 500 from upstream page 2/)
    expect(calls).toHaveLength(2)
  })

  it('throws on a body that is not a page of releases', async () => {
    const fetcher = createReleaseFetcher({
      baseUrl: 'https://mock.invalid',
      codenames: LISTED,
      fetchImpl: (async () => new Response('{"message":"Not Found"}', { status: 200 })) as unknown as typeof fetch,
    })
    await expect(fetcher()).rejects.toThrow(/non-array body/)
  })
})

describe('the release fetcher headers', () => {
  it('pins the media type and API version, and sends no Authorization without a token', async () => {
    const calls: MockCall[] = []
    const fetcher = createReleaseFetcher({
      baseUrl: 'https://mock.invalid',
      codenames: LISTED,
      fetchImpl: countingFetch(pagesFor(1), calls),
    })
    await fetcher()
    expect(calls[0]!.headers.get('accept')).toBe('application/vnd.github+json')
    expect(calls[0]!.headers.get('x-github-api-version')).toBe('2022-11-28')
    expect(calls[0]!.headers.has('authorization')).toBe(false)
  })

  it('sends the token as a bearer when one is configured', async () => {
    const calls: MockCall[] = []
    const fetcher = createReleaseFetcher({
      baseUrl: 'https://mock.invalid',
      codenames: LISTED,
      token: 'a-token',
      fetchImpl: countingFetch(pagesFor(1), calls),
    })
    await fetcher()
    expect(calls[0]!.headers.get('authorization')).toBe('Bearer a-token')
  })
})

describe('the release fetcher backoff', () => {
  const MINUTE = 60_000

  it('records the pause BEFORE the walk, so a refused connection backs off too', async () => {
    const clock = stubClock()
    let attempts = 0
    const fetcher = createReleaseFetcher({
      baseUrl: 'https://mock.invalid',
      codenames: LISTED,
      now: clock.now,
      fetchImpl: (async () => {
        attempts += 1
        throw new TypeError('fetch failed')
      }) as unknown as typeof fetch,
    })

    await expect(fetcher()).rejects.toThrow(/fetch failed/)
    clock.advance(MINUTE)
    await expect(fetcher()).rejects.toThrow(/backed off until/)
    expect(attempts).toBe(1)
  })

  it('defaults the pause to 900 seconds', async () => {
    const clock = stubClock()
    let attempts = 0
    const fetcher = createReleaseFetcher({
      baseUrl: 'https://mock.invalid',
      codenames: LISTED,
      now: clock.now,
      fetchImpl: (async () => {
        attempts += 1
        if (attempts === 1) return new Response('nope', { status: 500 })
        return new Response(JSON.stringify(releasePage(1)), { status: 200 })
      }) as unknown as typeof fetch,
    })

    await expect(fetcher()).rejects.toThrow(/HTTP 500/)
    clock.advance(899_000)
    await expect(fetcher()).rejects.toThrow(/backed off until/)
    expect(attempts).toBe(1)
    clock.advance(2_000)
    const catalog = await fetcher()
    expect(catalog.devices.Pong).toHaveLength(1)
    expect(attempts).toBe(2)
  })

  it('refines the pause from x-ratelimit-reset and retry-after, taking the later', async () => {
    const pauseFor = async (headers: Record<string, string>): Promise<number> => {
      const clock = stubClock()
      const fetcher = createReleaseFetcher({
        baseUrl: 'https://mock.invalid',
        codenames: LISTED,
        now: clock.now,
        fetchImpl: (async () => new Response('nope', { status: 429, headers })) as unknown as typeof fetch,
      })
      await expect(fetcher()).rejects.toThrow(/HTTP 429/)
      for (let elapsed = MINUTE; elapsed <= 4 * 3_600_000; elapsed += MINUTE) {
        clock.advance(MINUTE)
        const error = await fetcher().then(() => undefined, (thrown: Error) => thrown)
        if (!/backed off until/.test(error?.message ?? '')) return elapsed
      }
      throw new Error('the fetcher never resumed')
    }
    const resetAt = (seconds: number) => String(Math.floor(Date.UTC(2026, 7, 30) / 1000) + seconds)

    expect(await pauseFor({ 'retry-after': '600' })).toBe(600_000)
    expect(await pauseFor({ 'x-ratelimit-reset': resetAt(1_200) })).toBe(1_200_000)
    expect(await pauseFor({ 'retry-after': '300', 'x-ratelimit-reset': resetAt(1_800) })).toBe(1_800_000)
    expect(await pauseFor({ 'x-ratelimit-reset': resetAt(300), 'retry-after': '1800' })).toBe(1_800_000)
    expect(await pauseFor({ 'retry-after': '5' })).toBe(MINUTE)
    expect(await pauseFor({ 'retry-after': '86400' })).toBe(3_600_000)
    expect(await pauseFor({ 'retry-after': 'later' })).toBe(900_000)
  })

  it('pauses for the MAXIMUM window after the page ceiling, not the default', async () => {
    const clock = stubClock()
    const calls: MockCall[] = []
    const fetcher = createReleaseFetcher({
      baseUrl: 'https://mock.invalid',
      codenames: LISTED,
      now: clock.now,
      fetchImpl: countingFetch(() => releasePage(PER_PAGE), calls),
    })

    await expect(fetcher()).rejects.toThrow(/30-page ceiling/)
    expect(calls).toHaveLength(30)
    // Retrying 30-page failures every 900 seconds would exceed GitHub's 60-request hourly allowance.
    clock.advance(3_600_000 - MINUTE)
    await expect(fetcher()).rejects.toThrow(/backed off until/)
    expect(calls).toHaveLength(30)
    clock.advance(MINUTE)
    await expect(fetcher()).rejects.toThrow(/30-page ceiling/)
    expect(calls).toHaveLength(60)
  })

  it('clears the pause after a successful walk', async () => {
    const clock = stubClock()
    let attempts = 0
    const fetcher = createReleaseFetcher({
      baseUrl: 'https://mock.invalid',
      codenames: LISTED,
      now: clock.now,
      fetchImpl: (async () => {
        attempts += 1
        return new Response(JSON.stringify(releasePage(1)), { status: 200 })
      }) as unknown as typeof fetch,
    })
    await fetcher()
    await fetcher()
    expect(attempts).toBe(2)
  })
})
