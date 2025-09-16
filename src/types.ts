export type Route = {
  route: string

  protocol?: string
  allowHostnamePrefix: boolean
  hostname: string
  path: string
  allowPathSuffix: boolean
}
