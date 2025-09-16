import { domainToUnicode, URL } from 'url'
import { Route } from './types'

export function parseRoutes(allRoutes: string[]): Route[] {
  const routes: Route[] = []

  for (const route of allRoutes) {
    const hasProtocol = /^[a-z0-9+\-.]+:\/\//i.test(route)

    let urlInput = route
    // If route is missing a protocol, give it one so it parses
    if (!hasProtocol) urlInput = `https://${urlInput}`
    const url = new URL(urlInput)

    const protocol = hasProtocol ? url.protocol : undefined

    const internationalisedAllowHostnamePrefix = url.hostname.startsWith('xn--*')
    const allowHostnamePrefix = url.hostname.startsWith('*') || internationalisedAllowHostnamePrefix
    const anyHostname = url.hostname === '*'
    if (allowHostnamePrefix && !anyHostname) {
      let hostname = url.hostname
      // If hostname is internationalised (e.g. `xn--gld-tna.se`), decode it
      if (internationalisedAllowHostnamePrefix) {
        hostname = domainToUnicode(hostname)
      }
      // Remove leading "*"
      url.hostname = hostname.substring(1)
    }

    const allowPathSuffix = url.pathname.endsWith('*')
    if (allowPathSuffix) {
      url.pathname = url.pathname.substring(0, url.pathname.length - 1)
    }

    if (url.search) {
      throw new Error(`Route "${route}" contains a query string. This is not allowed.`)
    }
    if (url.toString().includes('*') && !anyHostname) {
      throw new Error(`Route "${route}" contains an infix wildcard. This is not allowed.`)
    }

    routes.push({
      route,

      protocol,
      allowHostnamePrefix,
      hostname: anyHostname ? '' : url.hostname,
      path: url.pathname,
      allowPathSuffix,
    })
  }

  return routes
}
