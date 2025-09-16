import { Route } from './types'
import { parseRoutes } from './parser'

export function matchRoutes(routes: Route[], url: URL): boolean {
  for (const route of routes) {
    if (route.protocol && route.protocol !== url.protocol) continue

    if (route.allowHostnamePrefix) {
      if (!url.hostname.endsWith(route.hostname)) continue
    } else {
      if (url.hostname !== route.hostname) continue
    }

    const path = url.pathname + url.search
    if (route.allowPathSuffix) {
      if (!path.startsWith(route.path)) continue
    } else {
      if (path !== route.path) continue
    }

    return true
  }

  return false
}

export function matchPatterns(patterns: string[], url: URL): boolean {
  const parsedRoutes = parseRoutes(patterns)

  return matchRoutes(parsedRoutes, url)
}
