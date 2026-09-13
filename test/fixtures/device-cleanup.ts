import { rmSync } from 'node:fs'
import { withCleanup } from '../../scripts/probe-connection.mjs'

// Both failed setup and normal teardown release the same fixture resources.
export const cleanupDeviceFixture = (
  upstream: {
    listening: boolean
    close: (callback: (error?: Error) => void) => unknown
    closeAllConnections: () => void
  },
  cacheDir: string | undefined,
  priorApiBase: string | undefined,
  env = process.env,
  remove = rmSync,
) => withCleanup(async () => {
  if (upstream.listening) {
    await new Promise<void>((resolve, reject) => {
      upstream.close(error => error ? reject(error) : resolve())
      upstream.closeAllConnections()
    })
  }
}, () => {
  if (priorApiBase === undefined) delete env.NUXT_GITHUB_API_BASE
  else env.NUXT_GITHUB_API_BASE = priorApiBase
  if (cacheDir !== undefined) remove(cacheDir, { recursive: true, force: true })
})
