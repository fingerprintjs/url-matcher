import { ParseRoutesOptions, Protocol, Route, RouteParam } from './types'
import { validateProtocol } from './validation'
import { InvalidPatternError } from './errors'

function routeSpecificity(url: URL) {
  // Adapted from internal config service routing table implementation
  const hostParts = url.host.split('.')
  let hostScore = hostParts.length
  if (hostParts[0] === '*') {
    hostScore -= 2
  }

  const pathParts = url.pathname.split('/')
  let pathScore = pathParts.length
  if (pathParts[pathParts.length - 1] === '*') {
    pathScore -= 2
  }

  // The magic 26 comes directly from the cloudflare algorithm from workers-sdk
  return hostScore * 26 + pathScore
}

function parsePatternUrl(pattern: string): URL {
  try {
    return new URL(pattern)
  } catch {
    throw new InvalidPatternError(`Pattern ${pattern} is not a valid URL`, 'ERR_INVALID_URL')
  }
}

/**
 * Parses a list of route strings into an array of Route objects that contain detailed route information.
 *
 * @param {RouteParam[]} allRoutes - An array of route strings to be parsed. Each route string can contain protocols, hostnames, and paths.
 * @param {ParseRoutesOptions} options - Optional options.
 * @return {Route[]} An array of parsed Route objects with details such as hostname, path, and protocol.
 *
 * @throws {InvalidProtocolError} If provided URL protocol in one of the routes is not `http:` or `https:`.
 * @throws {InvalidPatternError} If a route contains a query string or infix wildcard which is not allowed.
 */
export function parseRoutes<Metadata>(
  allRoutes: RouteParam<Metadata>[],
  { sortBySpecificity = false }: ParseRoutesOptions = {}
): Route<Metadata>[] {
  const routes: Route<Metadata>[] = []

  for (const rawRoute of allRoutes) {
    const route = typeof rawRoute === 'string' ? rawRoute : rawRoute.url
    const metadata = typeof rawRoute === 'string' ? undefined : rawRoute.metadata
    const hasProtocol = /^[a-z0-9+\-.]+:\/\//i.test(route)

    let urlInput = route
    // If route is missing a protocol, give it one so it parses
    if (!hasProtocol) {
      urlInput = `https://${urlInput}`
    }
    const url = parsePatternUrl(urlInput)

    let protocol: Protocol | undefined
    if (hasProtocol) {
      validateProtocol(url.protocol)
      protocol = url.protocol
    }

    const specificity = sortBySpecificity ? routeSpecificity(url) : undefined

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
      route,
      metadata,
      specificity,
      protocol,
      wildcardHostnamePrefix: allowHostnamePrefix,
      hostname: anyHostname ? '' : url.hostname,
      path: url.pathname,
      wildcardPathSuffix: allowPathSuffix,
    })
  }

  if (sortBySpecificity) {
    // Sort with the highest specificity first
    routes.sort((a, b) => {
      if (a.specificity === b.specificity) {
        // If routes are equally specific, sort by the longest route first
        return b.route.length - a.route.length
      } else {
        return b.specificity! - a.specificity!
      }
    })
  }

  return routes
}
