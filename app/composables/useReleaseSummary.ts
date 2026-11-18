import type { ReleaseSummary } from '#shared/types/releases'

/**
 * Await this unconditionally in page setup and pass data down as props; children must not fetch independently.
 * Null means the release data cannot be served.
 */
export const useReleaseSummary = async (): Promise<ReleaseSummary | null> => {
  const { data } = await useFetch<ReleaseSummary>('/api/releases', {
    key: 'release-summary',
    // ofetch retries GET failures including 503 by default, repeating the server wait and upstream requests.
    retry: false,
  })
  return data.value ?? null
}
