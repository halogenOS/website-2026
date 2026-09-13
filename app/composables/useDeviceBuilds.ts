import type { DeviceBuild } from '#shared/types/releases'

/**
 * Null means unavailable; an empty list is incomplete because listed devices have baseline builds.
 * The caller must show device identity and the external listing, not an empty history.
 */
export const useDeviceBuilds = async (codename: string): Promise<readonly DeviceBuild[] | null> => {
  const { data } = await useFetch<{ builds: DeviceBuild[] }>(
    `/api/releases/${encodeURIComponent(codename)}`,
    {
      key: `device-builds-${codename}`,
      // ofetch retries GET failures including 503 by default, repeating the server wait and upstream requests.
      retry: false,
    },
  )
  const builds = data.value?.builds
  return Array.isArray(builds) && builds.length > 0 ? builds : null
}
