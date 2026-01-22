import { InvalidPatternError } from '../src/errors'
import { normalizeWildcardHostname, parseRoutes, splitUrlInput } from '../src/parser'

describe('splitUrlInput', () => {
  it('returns null when protocol is missing', () => {
    expect(splitUrlInput('example.com/path')).toBeNull()
  })

  it('returns null when protocol contains invalid characters', () => {
    expect(splitUrlInput('ht^tp://example.com')).toBeNull()
  })

  it('returns parts when there is a path', () => {
    const result = splitUrlInput('https://example.com/path?query=1')

    expect(result).toEqual({
      protocolPrefix: 'https://',
      hostname: 'example.com',
      rest: '/path?query=1',
    })
  })

  it('returns parts when there is no path', () => {
    const result = splitUrlInput('https://example.com')

    expect(result).toEqual({
      protocolPrefix: 'https://',
      hostname: 'example.com',
      rest: '',
    })
  })

  it('keeps wildcard hostnames intact', () => {
    const result = splitUrlInput('https://*.example.com/path')

    expect(result).toEqual({
      protocolPrefix: 'https://',
      hostname: '*.example.com',
      rest: '/path',
    })
  })

  it('preserves protocol casing when present', () => {
    const result = splitUrlInput('HTTPS://example.com/path')

    expect(result).toEqual({
      protocolPrefix: 'HTTPS://',
      hostname: 'example.com',
      rest: '/path',
    })
  })
})

describe('normalizeWildcardHostname', () => {
  it('replaces wildcard with placeholder in hostname', () => {
    const urlInput = 'https://*.example.com/path'
    const urlParts = splitUrlInput(urlInput)

    const result = normalizeWildcardHostname(urlInput, urlParts)

    expect(result).toBe('https://wildcard.example.com/path')
  })

  it('returns input unchanged when hostname does not start with wildcard', () => {
    const urlInput = 'https://example.com/path'
    const urlParts = splitUrlInput(urlInput)

    const result = normalizeWildcardHostname(urlInput, urlParts)

    expect(result).toBe(urlInput)
  })
})

describe('parseRoutes', () => {
  it('parses wildcard hostname prefix and strips the leading "*"', () => {
    const [route] = parseRoutes(['*.example.com/path'])

    expect(route.wildcardHostnamePrefix).toBe(true)
    expect(route.hostname).toBe('.example.com')
    expect(route.path).toBe('/path')
    expect(route.wildcardPathSuffix).toBe(false)
  })

  it('parses wildcard path suffix and strips trailing "*"', () => {
    const [route] = parseRoutes(['example.com/path/*'])

    expect(route.wildcardPathSuffix).toBe(true)
    expect(route.path).toBe('/path/')
  })

  it('parses wildcard hostname with port', () => {
    const [route] = parseRoutes(['*.example.com:8080/path'])

    expect(route.hostname).toBe('.example.com')
    expect(route.wildcardHostnamePrefix).toBe(true)
    expect(route.path).toBe('/path')
  })

  it('parses pattern with both wildcard hostname prefix and path suffix', () => {
    const [route] = parseRoutes(['*.example.com/api/*'])

    expect(route.wildcardHostnamePrefix).toBe(true)
    expect(route.hostname).toBe('.example.com')
    expect(route.wildcardPathSuffix).toBe(true)
    expect(route.path).toBe('/api/')
  })

  it('throws for hostname infix wildcard', () => {
    expect(() => parseRoutes(['ex*ample.com'])).toThrow(
      new InvalidPatternError(
        'Route "ex*ample.com" contains an infix wildcard. This is not allowed.',
        'ERR_INFIX_WILDCARD'
      )
    )
  })

  it('throws for path infix wildcard', () => {
    expect(() => parseRoutes(['example.com/pa*th'])).toThrow(
      new InvalidPatternError(
        'Route "example.com/pa*th" contains an infix wildcard. This is not allowed.',
        'ERR_INFIX_WILDCARD'
      )
    )
  })

  it('throws for query string in routes', () => {
    expect(() => parseRoutes(['example.com/path?query=1'])).toThrow(
      new InvalidPatternError(
        'Route "example.com/path?query=1" contains a query string. This is not allowed.',
        'ERR_QUERY_STRING'
      )
    )
  })
})
