import { getReleaseCatalog } from '../utils/release-catalog'
import { summariseCatalog } from '../utils/release-resolve'
import { releasesUnavailable } from '../utils/release-unavailable'

export default defineEventHandler(async (event) => {
  try {
    return summariseCatalog(await getReleaseCatalog())
  }
  catch (error) {
    return releasesUnavailable(event, error)
  }
})
