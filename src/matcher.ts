import { Route } from './types'
import { parseRoutes } from './parser'

/**
 * Matches a list of routes against a given URL to determine if a match is found.
 *
 * @param {Route[]} routes - Array of route objects that define the matching criteria such as protocol, hostname, and path.
 * @param {URL} url - The URL to be matched against the provided routes.
 * @return {boolean} Returns true if a route matches the given URL, otherwise returns false.
 */
export function matchRoutes(routes: Route[], url: URL): boolean {
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

    return true
  }

  return false
}

/**
 * Matches a given URL against a list of string patterns to determine if it adheres to any specified pattern.
 *
 * @param {string[]} patterns - An array of string patterns that define the routes to match against.
 * @param {URL} url - The URL object that needs to be tested against the patterns.
 * @return {boolean} Returns true if the URL matches any of the given patterns; otherwise, returns false.
 */
export function matchPatterns(patterns: string[], url: URL): boolean {
  const parsedRoutes = parseRoutes(patterns)

  return matchRoutes(parsedRoutes, url)
}
