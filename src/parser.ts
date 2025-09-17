import { Route } from './types'
import { SUPPORTED_PROTOCOLS } from './const'
import { InvalidProtocolError } from './errors'
import { stripEnd } from './utils'

/**
 * Parses a list of route strings into an array of Route objects that contain detailed route information.
 *
 * @param {string[]} allRoutes - An array of route strings to be parsed. Each route string can contain protocols, hostnames, and paths.
 * @return {Route[]} An array of parsed Route objects with details such as hostname, path, and protocol.
 * @throws {Error} If a route contains a query string or infix wildcard which is not allowed.
 */
export function parseRoutes(allRoutes: string[]): Route[] {
  const routes: Route[] = []

  for (const route of allRoutes) {
    const hasProtocol = /^[a-z0-9+\-.]+:\/\//i.test(route)

    let urlInput = route
    // If route is missing a protocol, give it one so it parses
    if (!hasProtocol) {
      urlInput = `https://${urlInput}`
    }
    const url = new URL(urlInput)

    const protocol = hasProtocol ? url.protocol : undefined
    if (protocol && !SUPPORTED_PROTOCOLS.includes(protocol)) {
      throw new InvalidProtocolError(stripEnd(protocol))
    }

    const allowHostnamePrefix = url.hostname.startsWith('*')
    const anyHostname = url.hostname === '*'
    if (allowHostnamePrefix && !anyHostname) {
      // Remove leading "*"
      url.hostname = url.hostname.substring(1)
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
      protocol,
      wildcardHostnamePrefix: allowHostnamePrefix,
      hostname: anyHostname ? '' : url.hostname,
      path: url.pathname,
      wildcardPathSuffix: allowPathSuffix,
    })
  }

  return routes
}
