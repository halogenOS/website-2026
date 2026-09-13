import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { Window } from 'happy-dom'
import { afterAll, describe, expect, it } from 'vitest'
import { withCleanup } from '../scripts/probe-connection.mjs'
import { cleanupDeviceFixture } from './fixtures/device-cleanup'

// The upstream is a local mock serving the committed fixture and counting every call.
// It takes an ephemeral port and the server keeps its release cache in a directory
// created for this run: shared with a parallel run of this file, either one lets the
// budget assertion at the end read another run's traffic.

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const PAGE_ONE: unknown = JSON.parse(readFileSync(join(ROOT, 'test/fixtures/releases-page.json'), 'utf8'))

const upstreamCalls: string[] = []

// Started before the app is built so the built server finds it on its first render.
const upstream = createServer((request, response) => {
  upstreamCalls.push(request.url ?? '')
  const page = new URL(request.url ?? '/', 'http://mock.invalid').searchParams.get('page')
  response.writeHead(200, { 'content-type': 'application/json' })
  response.end(JSON.stringify(page === '1' ? PAGE_ONE : []))
})
let cacheDir: string
const priorApiBase = process.env.NUXT_GITHUB_API_BASE
const cleanup = () => cleanupDeviceFixture(upstream, cacheDir, priorApiBase)
// Register before acquiring resources: failed setup hooks still need teardown.
afterAll(cleanup)
try {
  await new Promise<void>((resolve, reject) => {
    upstream.once('error', reject)
    upstream.listen(0, '127.0.0.1', resolve)
  })
  const mockPort = (upstream.address() as AddressInfo).port
  // Real filesystem-cache coverage, isolated from production storage and other runs.
  mkdirSync(join(ROOT, '.cache'), { recursive: true })
  cacheDir = mkdtempSync(join(ROOT, '.cache/test-cache-'))
  process.env.NUXT_GITHUB_API_BASE = `http://127.0.0.1:${mockPort}`
  await setup({
    rootDir: ROOT,
    server: true,
    build: true,
    nuxtConfig: { nitro: { storage: { cache: { driver: 'fs', base: cacheDir } } } },
  })
}
catch (error) {
  await withCleanup(() => {
    throw error
  }, cleanup)
}

const bodyOf = async (path: string): Promise<string> => {
  const response = await fetch(path)
  expect(response.status, `GET ${path}`).toBe(200)
  return response.text()
}

// Parse SSR only: scripts and resource loading must never run in the comparison.
const parser = new Window({ settings: {
  disableJavaScriptEvaluation: true, disableJavaScriptFileLoading: true,
  disableCSSFileLoading: true, enableFileSystemHttpRequests: false,
} })
afterAll(() => parser.happyDOM.close())
const navigationOf = (html: string, attribute: string) => {
  const document = new parser.DOMParser().parseFromString(html, 'text/html')
  const nav = document.querySelector(`nav[${attribute}]`)
  expect(nav, attribute).not.toBeNull()
  if (attribute === 'data-sheet') {
    expect(nav!.querySelector('[popovertargetaction="hide"]')).not.toBeNull()
    expect([...nav!.querySelectorAll('ul a')].map(link => link.getAttribute('href')))
      .toEqual(['/features', '/community', '/devices', 'https://git.halogenos.org'])
  }
  return nav!.outerHTML
}

describe('server-rendered navigation', () => {
  it.each(['/features', '/community', '/devices', '/devices/pong', '/devices/pong/stable',
    '/devices/pong/builds', '/privacy', '/imprint'])('renders native menu controls on %s', async (path) => {
    const html = await bodyOf(path)
    expect(html).toMatch(/<nav\b[^>]*data-rail/)
    expect(html).toMatch(/<nav\b[^>]*data-trail/)
    expect(html).toMatch(/<button\b[^>]*popovertarget="site-menu"[^>]*data-menu/)
    expect(html).toMatch(/<nav\b[^>]*popover="auto"[^>]*desk:hidden[^>]*desk:backdrop:hidden/)
    expect(html).toMatch(/<button\b[^>]*autofocus[^>]*popovertargetaction="hide"/)
    expect(html).toContain('desk:self-start')
    expect(html).not.toContain('desk:self-center')
    const trail = html.match(/<nav\b[^>]*data-trail[^>]*>([\s\S]*?)<\/nav>/)?.[1]
    expect(trail).toBeDefined()
    expect(trail).toMatch(/<span\b[^>]*aria-current="page"/)
    expect(trail).not.toMatch(/<a\b[^>]*aria-current="page"/)
  })

  it.each(['/Features', '/COMMUNITY', '/Devices', '/Privacy', '/IMPRINT'])(
    'preserves canonical SSR navigation on accepted spelling %s', async (path) => {
      const html = await bodyOf(path)
      const canonical = await bodyOf(path.toLowerCase())
      for (const attribute of ['data-rail', 'data-trail', 'data-sheet']) {
        expect(navigationOf(html, attribute)).toEqual(navigationOf(canonical, attribute))
      }
    })

  it('rejects close-action and tile-destination mutations after the nested trail', async () => {
    const html = await bodyOf('/privacy')
    const sheet = navigationOf(html, 'data-sheet')
    for (const [before, after] of [
      ['popovertargetaction="hide"', 'popovertargetaction="show"'],
      ['href="/features"', 'href="/wrong-destination"'],
    ]) {
      const mutated = sheet.replace(before!, after!)
      expect(mutated).not.toEqual(sheet)
      expect(() => navigationOf(mutated, 'data-sheet')).toThrow()
    }
  })

  it.each([['/privacy', 'Pp'], ['/imprint', 'Ln']])('renders neutral initials on %s', async (path, initials) => {
    const html = await bodyOf(path!)
    const button = html.match(/<button\b[^>]*data-menu[^>]*>([\s\S]*?)<\/button>/)?.[0]
    expect(button).toBeDefined()
    expect(button).toContain(initials)
    expect(button).toContain('border-border')
    expect(button).not.toContain('--element')
    expect(button).not.toContain('cell-tube')
  })

  it('keeps the arrival free of sub-page navigation and renders translated element names', async () => {
    const html = await bodyOf('/')
    for (const attribute of ['data-rail', 'data-trail', 'data-menu', 'data-sheet']) {
      expect(html).not.toContain(attribute)
    }
    for (const name of ['fluorine', 'chlorine', 'bromine', 'iodine']) {
      expect(html.includes(`>${name} · `), `${name} precedes its atomic mass`).toBe(true)
      expect(html.includes(`>element.${name} · `), 'an unresolved locale key is not element text').toBe(false)
    }
  })
})

const countOf = (html: string, needle: string): number => html.split(needle).length - 1

// Cards split at their headings, so a class is counted per card: a page total cannot
// tell one lead with three described rows from three cards with one each.
const cardsOf = (html: string): string[] => html.split('id="featured-').slice(1)

// The lead-or-follower class sits on the opening tag, outside the slice `cardsOf` cuts.
const cardTagsOf = (html: string): string[] => html.match(/<section\b[^>]*aria-labelledby="featured-[^>]*>/g) ?? []

// The class a follower card carries and the lead never does.
const A_FOLLOWER = '--card-room-set:1rem'

// The description span's classes in full, because the size alone is also a series
// heading's; an undescribed row has no span at all.
const DESCRIBED_ROW = 'text-[0.92rem] font-semibold leading-[1.35]'

// Both presentations of the list are in every document, so only these classes say which
// one is shown.
const CARD_BOX_AT_DESK_PLACED_ON_THE_WIDE_STAGE = 'hidden gap-launcher-gap'
  + ' stage-wide:col-span-2 stage-wide:row-start-2 desk:flex'
const ROW_BELOW_DESK = '<li class="desk:hidden">'

describe('a device launcher on the wire', () => {
  it('renders the device, an entry per kind, the all-builds entry and no history', async () => {
    const html = await bodyOf('/devices/pong')
    expect(html).toContain('Nothing Phone (2)')
    expect(html).toContain('Pong')
    expect(html).toContain('Latest builds')
    expect(html).toContain('Stable release')
    expect(html).toContain('Release candidate')
    expect(html).toContain('Test build')
    expect(html).toContain('Newest stable build')
    expect(html).toContain('Newest release candidate')
    expect(html).toContain('Newest test build')
    expect(html, 'the cards appear only at desk width').toContain(CARD_BOX_AT_DESK_PLACED_ON_THE_WIDE_STAGE)
    expect(countOf(html, ROW_BELOW_DESK), 'one compact row per kind, hidden at desk').toBe(3)
    expect(html, 'the all-builds row shows at both widths').toContain(
      '<li><a href="/devices/pong/builds"')
    expect(html).toContain('All builds')
    for (const path of ['/devices/pong/stable', '/devices/pong/candidate',
      '/devices/pong/test', '/devices/pong/builds']) {
      expect(html, `the launcher links ${path}`).toContain(`href="${path}"`)
    }
    expect(html).not.toContain('Full build history')
    expect(html).not.toContain(
      'https://github.com/halogenOS/builds/releases/download/20240610.1805.88-tb/')
    expect(html).toContain('Flashable OS zip')
    expect(html).toContain('Boot image')
    expect(html).toContain('Vendor boot image')
    expect(html).toContain('Recovery image')
    expect(html).toContain('--element:var(--element-candidate)')
    expect(html).toContain('--element:var(--element-test)')
    expect(cardTagsOf(html).map(tag => countOf(tag, A_FOLLOWER))).toEqual([0, 1, 1])
    expect(cardsOf(html).map(card => countOf(card, DESCRIBED_ROW))).toEqual([3, 0, 0])
    expect(html).toContain(
      'https://github.com/halogenOS/builds/releases/download/20260703.2234.33-rb/'
      + 'halogenOS_Pong-16.2-20260703-213704-OFFICIAL.zip')
    expect(html).toContain('https://github.com/halogenOS/builds/releases/tag/20260703.2234.33-rb')
  })

  it('serves the other two listed devices, including a build that shipped no files', async () => {
    const spacewar = await bodyOf('/devices/spacewar')
    expect(spacewar).toContain('Nothing Phone (1)')
    expect(spacewar).toContain('This release carries no files, so it offers nothing to download.')
    expect(spacewar).toContain('Newest stable build')
    expect(spacewar).toContain('Newest test build')
    expect(spacewar).not.toContain('Newest release candidate')
    expect(spacewar).not.toContain('href="/devices/spacewar/candidate"')
    expect(cardTagsOf(spacewar).map(tag => countOf(tag, A_FOLLOWER))).toEqual([0, 1])
    expect(countOf(spacewar, ROW_BELOW_DESK)).toBe(2)
    expect(spacewar).toContain(CARD_BOX_AT_DESK_PLACED_ON_THE_WIDE_STAGE)

    const guacamole = await bodyOf('/devices/guacamole')
    expect(guacamole).toContain('OnePlus 7 Pro')
    // The two firmware zips are files the description table does not name.
    expect(cardTagsOf(guacamole).map(tag => countOf(tag, A_FOLLOWER))).toEqual([0, 1])
    expect(guacamole).toContain('op7pro_fw.zip')
    expect(guacamole).toContain('op7pro_fw_old_do_not_use.zip')
    expect(cardsOf(guacamole).map(card => countOf(card, DESCRIBED_ROW))).toEqual([1, 0])
  })

  it('301s every other spelling of an address to the one it resolves to', async () => {
    // vue-router matches a static segment case-insensitively and a trailing slash matches
    // the same route, while a kind page resolves its own value exactly: a redirect that
    // rewrote only the codename would send the reader to a 404.
    const cases: readonly { readonly from: string, readonly to: string, readonly holds: string }[] = [
      { from: '/devices/Pong', to: '/devices/pong', holds: 'Nothing Phone (2)' },
      { from: '/devices/pong/', to: '/devices/pong', holds: 'Latest builds' },
      { from: '/devices/Pong/stable', to: '/devices/pong/stable', holds: 'Newest stable build' },
      { from: '/devices/Pong/Stable', to: '/devices/pong/stable', holds: 'Newest stable build' },
      { from: '/devices/pong/stable/', to: '/devices/pong/stable', holds: 'Newest stable build' },
      { from: '/devices/SPACEWAR/builds', to: '/devices/spacewar/builds', holds: 'Full build history' },
      { from: '/devices/pong/BUILDS', to: '/devices/pong/builds', holds: 'Full build history' },
      {
        from: '/devices/Pong/builds?from=list&page=2',
        to: '/devices/pong/builds?from=list&page=2',
        holds: 'Full build history',
      },
    ]
    for (const { from, to, holds } of cases) {
      const redirected = await fetch(from, { redirect: 'manual' })
      expect(redirected.status, `GET ${from}`).toBe(301)
      expect(redirected.headers.get('location'), `GET ${from}`).toBe(to)
      const followed = await fetch(to)
      expect(followed.status, `GET ${to}`).toBe(200)
      expect(await followed.text(), `GET ${to}`).toContain(holds)
    }
  })

  it('404s an unlisted codename onto the site own error page', async () => {
    // `Accept: text/html` makes nitro render the error page instead of the JSON error
    // body it keeps for API clients.
    const response = await fetch('/devices/nosuchdevice', { headers: { accept: 'text/html' } })
    expect(response.status).toBe(404)
    const html = await response.text()
    expect(html).toContain('halogenOS')
    expect(html).toContain('The address you are visiting matches no page on this halogenOS site.')
    expect(html).toContain('Back to halogenOS')
    expect(html).not.toContain('Nuxt Error Page')
  })
})

describe('the section pages under one device', () => {
  it('renders exactly the asked-for kind card, and nothing of the others', async () => {
    const stable = await bodyOf('/devices/pong/stable')
    expect(stable).toContain('Nothing Phone (2)')
    expect(stable).toContain('Newest stable build')
    expect(stable).not.toContain('Newest release candidate')
    expect(stable).not.toContain('Newest test build')
    expect(stable).not.toContain('Full build history')
    expect(stable).toContain(
      'https://github.com/halogenOS/builds/releases/download/20260703.2234.33-rb/'
      + 'halogenOS_Pong-16.2-20260703-213704-OFFICIAL.zip')

    const test = await bodyOf('/devices/pong/test')
    expect(test).toContain('Newest test build')
    expect(test).not.toContain('Newest stable build')
    expect(test).toContain('--element:var(--element-test)')
  })

  it('answers a kind the device has no build of with the state, not a 404', async () => {
    const response = await fetch('/devices/spacewar/candidate')
    expect(response.status).toBe(200)
    const html = await response.text()
    expect(html).toContain('Nothing Phone (1)')
    expect(html).toContain(
      'This device has no build of this kind yet, so the full build history shows what it does have.')
    expect(html).toContain('href="/devices/spacewar/builds"')
    expect(html).not.toContain('Newest release candidate')
  })

  it('404s a kind this site does not have', async () => {
    const response = await fetch('/devices/pong/nosuchkind', { headers: { accept: 'text/html' } })
    expect(response.status).toBe(404)
    const html = await response.text()
    expect(html).toContain('The address you are visiting matches no page on this halogenOS site.')
    expect(html).not.toContain('Nuxt Error Page')
  })

  it('renders the whole history on the builds page, newest first', async () => {
    const html = await bodyOf('/devices/pong/builds')
    expect(html).toContain('Nothing Phone (2)')
    expect(html).toContain('Full build history')
    expect(html).toContain(
      'https://github.com/halogenOS/builds/releases/download/20260602.0800.30-rcb/'
      + 'halogenOS_Pong-16.2-20260602-065959-OFFICIAL.zip')
    expect(html).toContain('Stable release')
    expect(html).not.toContain('Newest stable build')
    expect(html).not.toContain('Latest builds')

    const spacewar = await bodyOf('/devices/spacewar/builds')
    expect(spacewar).toContain('halogenOS_Spacewar-15.0-20241024-053834-OFFICIAL.zip.sha256sum')
    expect(spacewar).toContain('This release carries no files, so it offers nothing to download.')
  })
})

describe('the release routes', () => {
  it('keeps the summary response shape byte-compatible with its consumers', async () => {
    const response = await fetch('/api/releases')
    expect(response.status).toBe(200)
    const summary = await response.json() as {
      fetchedAt: string
      devices: Record<string, { lastBuild: string, buildCount: number }>
    }
    expect(typeof summary.fetchedAt).toBe('string')
    expect(Object.keys(summary.devices)).toEqual(['Pong', 'Spacewar', 'guacamole'])
    expect(summary.devices.Pong).toEqual({ lastBuild: '2026-07-28', buildCount: 3 })
    expect(summary.devices.Spacewar).toEqual({ lastBuild: '2026-07-07', buildCount: 3 })
    expect(summary.devices.guacamole).toEqual({ lastBuild: '2026-07-03', buildCount: 2 })
  })

  it('serves one device builds at any casing, and 404s an unlisted codename', async () => {
    const response = await fetch('/api/releases/PONG')
    expect(response.status).toBe(200)
    const body = await response.json() as { builds: { publishedAt: string, kind: string }[] }
    expect(body.builds).toHaveLength(3)
    expect(body.builds[0]!.publishedAt).toBe('2026-07-28T06:50:51Z')
    expect(body.builds.map(build => build.kind)).toEqual(['test', 'stable', 'candidate'])
    expect((await fetch('/api/releases/pong')).status).toBe(200)
    expect((await fetch('/api/releases/nosuchdevice')).status).toBe(404)
  })
})

describe('the devices index', () => {
  it('still renders, with its cells linking to the device routes', async () => {
    const html = await bodyOf('/devices')
    expect(html).toContain('Devices with current builds')
    for (const path of ['/devices/pong', '/devices/spacewar', '/devices/guacamole']) {
      expect(html).toContain(`href="${path}"`)
    }
    expect(html).toContain('2026-07-28')
  })
})

describe('the upstream budget', () => {
  it('spends exactly one shared walk for every route in this file', () => {
    // The fixture is shorter than a full page, so the walk ends after one request; a
    // second cached function or a per-request fetch would show up here as a multiple.
    expect(upstreamCalls).toEqual(['/repos/halogenOS/builds/releases?per_page=100&page=1'])
  })
})

// Last in the file: it takes the upstream away for good, so anything after it would read
// a server with no way back to a catalog.
describe('an empty cache with the upstream unreachable', () => {
  it('answers both release routes 503 with the unavailable body', async () => {
    // close() leaves established sockets alive, and the server's fetch pool holds one.
    upstream.close()
    upstream.closeAllConnections()
    // An empty store is the state on the first request after a deployment.
    rmSync(cacheDir, { recursive: true, force: true })

    for (const path of ['/api/releases/pong', '/api/releases']) {
      const response = await fetch(path)
      expect(response.status, `GET ${path}`).toBe(503)
      expect(await response.json(), `GET ${path}`).toEqual({ unavailable: true })
    }
  })
})
