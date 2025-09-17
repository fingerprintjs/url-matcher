import { Route } from './types'
import { validateProtocol } from './validation'
import { InvalidPatternError } from './errors'

/**
 * Parses a list of route strings into an array of Route objects that contain detailed route information.
 *
 * @param {string[]} allRoutes - An array of route strings to be parsed. Each route string can contain protocols, hostnames, and paths.
 * @return {Route[]} An array of parsed Route objects with details such as hostname, path, and protocol.
 *
 * @throws {InvalidProtocolError} If provided URL protocol in one of the routes is not `http:` or `https:`.
 * @throws {InvalidPatternError} If a route contains a query string or infix wildcard which is not allowed.
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
    if (protocol) {
      validateProtocol(protocol)
    }

    const allowHostnamePrefix = url.hostname.startsWith('*')
    const anyHostname = url.hostname === '*'
    if (allowHostnamePrefix && !anyHostname) {
      // Remove leading "*"
      url.hostname = url.hostname.substring(1)
    }

    const allowPathSuffix = url.pathname.endsWith('*')
    if (allowPathSuffix) {
      // Remove trailing "*"
      url.pathname = url.pathname.substring(0, url.pathname.length - 1)
    }

    if (url.search) {
      throw new InvalidPatternError(
        `Route "${route}" contains a query string. This is not allowed.`,
        'ERR_QUERY_STRING'
      )
    }
    if (url.toString().includes('*') && !anyHostname) {
      throw new InvalidPatternError(
        `Route "${route}" contains an infix wildcard. This is not allowed.`,
        'ERR_INFIX_WILDCARD'
      )
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
