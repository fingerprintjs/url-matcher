export type Protocol = 'http:' | 'https:'

export type Route<Metadata extends RouteMetadata = RouteMetadata> = {
  /**
   * The original route string that was parsed to create this Route object.
   * Contains the full route pattern as originally provided, including any protocols, wildcards, hostnames, and paths.
   * Used for reference and sorting when routes have equal specificity.
   */

  route: string

  /**
   * Extracted metadata if `RouteWithMetadata` was provided.
   *
   * @example
   * ```typescript
   *
   * // Routes with type "identification"
   * const identificationPages = ["..."].map((page) => ({ url: page, metadata: { type: "identification" } }))
   * // Routes with type "protection"
   * const pagesToProtect = ["..."].map((page) => ({ url: page, metadata: { type: "protection"} }))
   *
   * const parsedRoutes = parseRoutes([...identificationPages, ...pagesToProtect], true)
   * const matchedRoute = findMatchingRoute(new URL('<PAGE_URL>'), parsedRoutes)
   *
   * // "type" can be either "identification" or "protection"
   * switch (matchedRoute?.metadata?.type) {
   *     case "identification":
   *        // Handle identification
   *
   *     case "protection":
   *        // Handle protection
   * }
   * ```
   * */
  metadata?: Metadata

  /**
   * The protocol part of the route. Can be either `https:` or `http`.
   * If undefined, the route matches any protocol.
   */
  protocol?: Protocol

  /**
   * Whether the hostname allows wildcard prefix matching.
   * When true, the route matches any hostname that ends with the specified hostname.
   * For example, if hostname is "example.com" and this is true, it matches "sub.example.com".
   */
  wildcardHostnamePrefix: boolean

  /**
   * A numeric value representing how specific this route is for matching purposes.
   * Higher values indicate more specific routes. Calculated as (hostScore * 26 + pathScore)
   * where hostScore is the number of hostname parts (subdomains) and pathScore is the number of path segments.
   * Wildcard prefixes in hostname and wildcard suffixes in path reduce their respective scores by 2.
   * Used for sorting routes so more specific routes are matched first.
   */
  specificity?: number

  /**
   * The hostname part of the route to match against.
   * Can be an empty string when matching any hostname (wildcard '*'). In that instance, the matcher can leverage the fact that `.endsWith()` returns `true` for empty strings.
   */
  hostname: string

  /**
   * The path part of the route to match against, including the pathname but excluding query strings.
   */
  path: string

  /**
   * Whether the path allows wildcard suffix matching.
   * When true, the route matches any path that starts with the specified path.
   * For example, if path is "/api" and this is true, it matches "/api/users".
   */
  wildcardPathSuffix: boolean
}

export type RouteMetadata<Type = any> = {
  type: Type
}

export type RouteWithMetadata<Metadata extends RouteMetadata = RouteMetadata> = {
  url: string
  metadata?: Metadata
}

export type RouteParam<Metadata extends RouteMetadata = RouteMetadata> = RouteWithMetadata<Metadata> | string

export type ParseRoutesOptions = {
  /**
   * Whether to sort the parsed routes by specificity.
   * If true, the routes will be sorted by specificity, with the highest specificity first.
   *
   */
  sortBySpecificity?: boolean
}
