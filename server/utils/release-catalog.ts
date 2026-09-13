// Keep one cache declaration: Nitro hashes function source for integrity, so separate declarations
// under the same key invalidate each other and repeat upstream requests.
// A constant key shares the upstream request budget across all visitors.

import { DEVICE_CODENAMES } from '#shared/data/devices'
import type { ReleaseCatalog } from '#shared/types/releases'
import type { ReleaseFetcher } from './release-fetch'
import { createReleaseFetcher } from './release-fetch'
import { isReleaseCatalog } from './release-resolve'

// Keep the fetcher across revalidations to retain backoff state; read runtime config only at request time.
let fetcher: ReleaseFetcher | undefined

/** Throw failures so Nitro retains the last good catalog during stale revalidation. */
export const getReleaseCatalog = defineCachedFunction(
  async (): Promise<ReleaseCatalog> => {
    const config = useRuntimeConfig()
    fetcher ??= createReleaseFetcher({
      baseUrl: config.githubApiBase,
      token: config.githubToken || undefined,
      codenames: DEVICE_CODENAMES,
    })
    return fetcher()
  },
  {
    name: 'releases',
    getKey: () => 'all',
    maxAge: 1800,
    swr: true,
    // Leave integrity source-derived so incompatible persisted values cannot survive a deployment.
    validate: entry => isReleaseCatalog(entry.value),
  },
)
