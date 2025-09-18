import { Route } from './types'
import { parseRoutes } from './parser'
import { validateProtocol } from './validation'

/**
 * Matches a list of routes against a given URL to determine if a match is found.
 *
 * @param {Route[]} routes - Array of route objects that define the matching criteria such as protocol, hostname, and path.
 * @param {URL} url - The URL to be matched against the provided routes.
 * @return {Route | undefined} Returns matched route, or undefined if no match is found.
 */
export function matchRoutes<Target extends string = string>(
  routes: Route<Target>[],
  url: URL
): Route<Target> | undefined {
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
 * @param {string[]} patterns - An array of string patterns that define the routes to match against.
 * @param {URL} url - The URL object that needs to be tested against the patterns.
 *
 * @throws {InvalidProtocolError} If provided URL protocol is not `http:` or `https:`.
 * @throws {InvalidPatternError} If one of the provided patterns contains a query string or infix wildcard.
 * @return {boolean} Returns true if the URL matches any of the given patterns; otherwise, returns false.
 */
export function matchPatterns(patterns: string[], url: URL): boolean {
  validateProtocol(url.protocol)
  const parsedRoutes = parseRoutes(patterns)

  return Boolean(matchRoutes(parsedRoutes, url))
}
