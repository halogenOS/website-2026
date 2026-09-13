// Only pages under /devices/<codename> may register this middleware; the path split depends on that shape.
// vue-router matches case variants and trailing slashes, which must redirect to one canonical address.

import { devicePath } from '#shared/data/devices'

export default defineNuxtRouteMiddleware((to) => {
  const device = routeDevice(to.params)
  const [, , , ...section] = to.path.split('/')
  const canonical = [
    devicePath(device),
    ...section.filter(segment => segment !== '').map(segment => segment.toLowerCase()),
  ].join('/')
  if (to.path !== canonical) return navigateTo({ path: canonical, query: to.query }, { redirectCode: 301 })
})
