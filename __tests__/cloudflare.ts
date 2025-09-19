import { matchRoutes, parseRoutes } from 'miniflare'

export function cloudflareMatchUrl(urlString: string, patterns: string[]) {
  try {
    const routesMap = new Map<string, string[]>()
    routesMap.set('test-worker', patterns)
    const routes = parseRoutes(routesMap)

    const url = new URL(urlString)
    const match = matchRoutes(routes, url)
    return match === 'test-worker'
  } catch (error) {
    console.error('Cloudflare matcher error:', error)
    throw error
  }
}
