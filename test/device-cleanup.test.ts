import { describe, expect, it } from 'vitest'
import { withCleanup } from '../scripts/probe-connection.mjs'
import { cleanupDeviceFixture } from './fixtures/device-cleanup'

const leaves = (error: unknown): unknown[] => error instanceof AggregateError
  ? error.errors.flatMap(leaves)
  : [error]

describe('device route teardown', () => {
  it.each([1, 2, 3, 4, 5, 6, 7])('retains every failure in setup/close/removal combination %s', async (mask) => {
    const failures = [new Error('setup'), new Error('close'), new Error('removal')]
    const steps: string[] = []
    const env = { NUXT_GITHUB_API_BASE: 'fixture' }
    const upstream = {
      listening: true,
      close: (callback?: (error?: Error) => void) => {
        steps.push('close')
        callback?.(mask & 2 ? failures[1] : undefined)
        return upstream
      },
      closeAllConnections: () => steps.push('connections'),
    }
    const cleanup = () => cleanupDeviceFixture(upstream, 'cache', 'original', env, () => {
      steps.push('removal')
      if (mask & 4) throw failures[2]
    })
    const error = await withCleanup(() => {
      if (mask & 1) throw failures[0]
    }, cleanup).catch((failure: unknown) => failure)
    expect(leaves(error)).toEqual(failures.filter((_, index) => mask & (1 << index)))
    expect(steps).toEqual(['close', 'connections', 'removal'])
    expect(env.NUXT_GITHUB_API_BASE).toBe('original')
  })

  it('restores an absent environment value without acquiring resources', async () => {
    const env: NodeJS.ProcessEnv = { NUXT_GITHUB_API_BASE: 'fixture' }
    const upstream = {
      listening: false,
      close: () => { throw new Error('server is not listening') },
      closeAllConnections: () => { throw new Error('no connections') },
    }
    await cleanupDeviceFixture(upstream, undefined, undefined, env, () => {
      throw new Error('no cache')
    })
    expect(env).not.toHaveProperty('NUXT_GITHUB_API_BASE')
  })
})
