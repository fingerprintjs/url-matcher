import { Route, RouteMetadata } from './types'
import { parseRoutes } from './parser'
import { validateProtocol } from './validation'

/**
 * Matches a list of routes against a given URL to determine if a match is found.
 *
 * @param {URL} url - The URL to be matched against the provided routes.
 * @param {Route[]} routes - Array of route objects that define the matching criteria such as protocol, hostname, and path.
 *
 * @return {Route | undefined} Returns matched route, or undefined if no match is found.
 */
export function findMatchingRoute<Metadata extends RouteMetadata = RouteMetadata>(
  url: URL,
  routes: Route<Metadata>[]
): Route<Metadata> | undefined {
  for (const route of routes) {
    if (route.protocol && route.protocol !== url.protocol) {
      continue
    }

    if (route.wildcardHostnamePrefix) {
      if (!url.hostname.endsWith(route.hostname)) {
        continue
      }
    } else {
      if (url.hostname !== route.hostname) {
        continue
      }
    }

    const pathWithQuery = url.pathname + url.search
    if (route.wildcardPathSuffix) {
      if (!pathWithQuery.startsWith(route.path)) {
        continue
      }
    } else {
      if (pathWithQuery !== route.path) {
        continue
      }
    }

    return route
  }

  return undefined
}

/**
 * Matches a given URL against a list of string patterns to determine if it adheres to any specified pattern.
 *
 * @param {URL} url - The URL object that needs to be tested against the patterns.
 * @param {string[]} patterns - An array of string patterns that define the routes to match against.
 *
 * @throws {InvalidProtocolError} If provided URL protocol is not `http:` or `https:`.
 * @throws {InvalidPatternError} If one of the provided patterns contains a query string or infix wildcard.
 * @return {boolean} Returns true if the URL matches any of the given patterns; otherwise, returns false.
 */
export function matchesPatterns(url: URL, patterns: string[]): boolean {
  validateProtocol(url.protocol)
  const parsedRoutes = parseRoutes(patterns)

  return Boolean(findMatchingRoute(url, parsedRoutes))
}
