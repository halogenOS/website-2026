import { afterEach, describe, expect, it, vi } from 'vitest'

const readPage = vi.hoisted(() => vi.fn(async (options: { scripts: boolean }) => ({
  drawings: [], scripts: options.scripts, scriptsExecuted: options.scripts, hydrated: options.scripts,
})))
vi.mock('../scripts/probe-page.mjs', async original => ({
  ...await original<typeof import('../scripts/probe-page.mjs')>(), readPage,
}))

const priorArgv = process.argv
afterEach(() => {
  process.argv = priorArgv
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  readPage.mockClear()
})

describe('shared probe conditions', () => {
  it.each(['scroll'])('%s forwards every supported condition', async (name) => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    for (const scripts of [true, false]) {
      vi.resetModules()
      const argv = ['bun', 'probe', '9222', 'http://page.invalid/privacy', '390', '844', 'reduce', 'light',
        ...scripts ? [] : ['noscript']]
      process.argv = argv
      await import(`../scripts/${name}-probe.mjs`)
      expect(readPage).toHaveBeenLastCalledWith(expect.objectContaining({
        port: '9222', url: 'http://page.invalid/privacy', width: 390, height: 844,
        reduce: true, scheme: 'light', scripts, mobile: true,
      }))
    }
  })
})
