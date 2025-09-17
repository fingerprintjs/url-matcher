export type Route = {
  /**
   * The protocol part of the route (e.g., 'https:', 'http:').
   * If undefined, the route matches any protocol.
   */
  protocol?: string

  /**
   * Whether the hostname allows wildcard prefix matching.
   * When true, the route matches any hostname that ends with the specified hostname.
   * For example, if hostname is "example.com" and this is true, it matches "sub.example.com".
   */
  wildcardHostnamePrefix: boolean

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
