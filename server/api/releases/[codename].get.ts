import { deviceByCodename } from '#shared/data/devices'
import { getReleaseCatalog } from '../../utils/release-catalog'
import { releasesUnavailable } from '../../utils/release-unavailable'

export default defineEventHandler(async (event) => {
  const device = deviceByCodename(getRouterParam(event, 'codename') ?? '')
  // Keep the 404 outside the try so it is not reported as an upstream failure.
  if (!device) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  try {
    const catalog = await getReleaseCatalog()
    // A known device without builds is not missing; its list is empty.
    return { builds: catalog.devices[device.codename] ?? [] }
  }
  catch (error) {
    return releasesUnavailable(event, error)
  }
})
