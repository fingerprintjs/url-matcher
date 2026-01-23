import { ParseRoutesOptions, Protocol, Route, RouteParam } from './types'
import { validateProtocol } from './validation'
import { InvalidPatternError } from './errors'

const WILDCARD_HOSTNAME_PLACEHOLDER = 'wildcard'
const PROTOCOL_SEPARATOR = '://'
const PROTOCOL_PATTERN = /^[a-z0-9+\-.]+$/i

export type UrlParts = {
  protocolPrefix: string
  hostname: string
  rest: string
}

/**
 * The reason we require manually parsing URLs instead of just passing it to URL()
 * is that URL() constructor in the browser cannot handle parsing wildcards like `*.example.com`.
 * Which is not obvious, since new URL('*.example.com') works in Node.
 */
export function splitUrlInput(urlInput: string): UrlParts | null {
  const protocolIndex = urlInput.indexOf(PROTOCOL_SEPARATOR)
  if (protocolIndex <= 0) {
    // Fully qualified URLs (including protocol) are expected
    return null
  }

  const protocol = urlInput.slice(0, protocolIndex)
  if (!PROTOCOL_PATTERN.test(protocol)) {
    return null
  }

  const hostnameStart = protocolIndex + PROTOCOL_SEPARATOR.length
  const pathStart = urlInput.indexOf('/', hostnameStart)
  const hostnameEnd = pathStart === -1 ? urlInput.length : pathStart

  return {
    protocolPrefix: urlInput.slice(0, hostnameStart),
    hostname: urlInput.slice(hostnameStart, hostnameEnd),
    rest: urlInput.slice(hostnameEnd),
  }
}

/**
 * We need this to replace `*` with a placeholder in the hostname so that the URL can be parsed by the URL() constructor.
 */
export function normalizeWildcardHostname(urlInput: string, urlParts: UrlParts | null): string {
  if (!urlParts?.hostname.startsWith('*')) {
    return urlInput
  }
  const wildcardHostname = `${WILDCARD_HOSTNAME_PLACEHOLDER}${urlParts.hostname.slice(1)}`
  return `${urlParts.protocolPrefix}${wildcardHostname}${urlParts.rest}`
}

function routeSpecificity(hostname: string, pathname: string) {
  // Adapted from internal config service routing table implementation
  const hostParts = hostname.split('.')
  let hostScore = hostParts.length
  if (hostParts[0] === '*') {
    hostScore -= 2
  }

  const pathParts = pathname.split('/')
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
    const hasProtocol = route.indexOf(PROTOCOL_SEPARATOR) > 0

    let urlInput = route
    // If route is missing a protocol, give it one so it parses
    if (!hasProtocol) {
      urlInput = `https://${urlInput}`
    }
    const urlParts = splitUrlInput(urlInput)
    const rawHostname = urlParts?.hostname ?? ''
    const urlInputForParse = normalizeWildcardHostname(urlInput, urlParts)
    const url = parsePatternUrl(urlInputForParse)

    if (!urlParts?.hostname) {
      throw new InvalidPatternError(`Route "${route}" is missing a hostname. This is not allowed.`, 'ERR_INVALID_URL')
    }
    let protocol: Protocol | undefined
    if (hasProtocol) {
      validateProtocol(url.protocol)
      protocol = url.protocol
    }

    const allowHostnamePrefix = rawHostname.startsWith('*')
    const anyHostname = rawHostname === '*'
    const allowPathSuffix = url.pathname.endsWith('*')
    const specificity = sortBySpecificity ? routeSpecificity(rawHostname, url.pathname) : undefined

    let hostname = url.hostname
    if (allowHostnamePrefix && !anyHostname) {
      hostname = hostname.substring(WILDCARD_HOSTNAME_PLACEHOLDER.length)
    }

    const pathContainsWildcard = url.pathname.includes('*')
    const hostnameHasInfixWildcard = allowHostnamePrefix
      ? rawHostname.slice(1).includes('*')
      : rawHostname.includes('*')
    const pathHasInfixWildcard = pathContainsWildcard && (!allowPathSuffix || url.pathname.slice(0, -1).includes('*'))

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
    if (hostnameHasInfixWildcard || pathHasInfixWildcard) {
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
      hostname: anyHostname ? '' : hostname,
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
