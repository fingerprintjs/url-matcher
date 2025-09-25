import * as testCases from './testCases.json'
import { cloudflareMatchUrl } from './cloudflare'
import { findMatchingRoute, InvalidPatternError, InvalidProtocolError, matchesPatterns, parseRoutes } from '../src'

describe('Matcher', () => {
  // Based on miniflare behaviour
  it('should throw for an infix wildcard', () => {
    expect(() =>
      matchesPatterns(new URL('https://example.com/blog/2025/post-1'), ['fingerprint.com/blog/*/post-*'])
    ).toThrow(
      new InvalidPatternError(
        'Route "fingerprint.com/blog/*/post-*" contains an infix wildcard. This is not allowed.',
        'ERR_INFIX_WILDCARD'
      )
    )
  })

  it('should throw if pattern contains query string', () => {
    expect(() =>
      matchesPatterns(new URL('https://example.com/blog/2025/post-1'), ['fingerprint.com/blog/post123?q=test'])
    ).toThrow(
      new InvalidPatternError(
        'Route "fingerprint.com/blog/post123?q=test" contains a query string. This is not allowed.',
        'ERR_QUERY_STRING'
      )
    )
  })

  it.each(['ws', 'ftp'])('should throw for invalid protocol passed in patterns: %s', (protocol) => {
    expect(() => matchesPatterns(new URL('https://example.com'), [`${protocol}://example.com`])).toThrow(
      new InvalidProtocolError(protocol)
    )
  })

  it.each(['ws', 'ftp'])('should throw for invalid protocol passed in URL: %s', (protocol) => {
    expect(() => matchesPatterns(new URL(`${protocol}://example.com`), [`https://example.com`])).toThrow(
      new InvalidProtocolError(protocol)
    )
  })

  it('should throw for invalid url in patterns', () => {
    expect(() => matchesPatterns(new URL('https://example.com'), ['https://ex ample.com'])).toThrow(
      new InvalidPatternError('Pattern https://ex ample.com is not a valid URL', 'ERR_INVALID_URL')
    )
  })

  it('should return metadata of the matched route if it was set', () => {
    const routes = parseRoutes([
      {
        url: 'https://example.com/blog/*',
        metadata: {
          type: 'blog',
        },
      },
      {
        url: 'https://fingerprint.com',
        metadata: {
          type: 'fingerprint',
        },
      },
      'https://google.com',
    ] as const)

    const matchedRoute = findMatchingRoute(new URL('https://example.com/blog/post123'), routes)
    expect(matchedRoute?.metadata?.type).toBe('blog')
  })

  it('should return metadata of the matched route if it was set respecting specificity', () => {
    const routes = parseRoutes(
      [
        {
          url: 'https://example.com/blog/*',
          metadata: {
            type: 'blog',
          },
        },
        'https://google.com',
        {
          url: 'https://example.com/blog/post123',
          metadata: {
            type: 'specific-blog',
          },
        },
      ] as const,
      { sortBySpecificity: true }
    )

    const matchedRoute = findMatchingRoute(new URL('https://example.com/blog/post123'), routes)

    expect(matchedRoute?.metadata?.type).toBe('specific-blog')
  })

  testCases.forEach((testCase, index) => {
    // Add "only: true" to a specific test case to isolate it
    const test = testCase.only ? it.only : it

    describe(`#${index + 1} Match for ${testCase.url} with ${testCase.patterns.join(',')}`, () => {
      test(`should be ${testCase.expected ? 'matched' : 'not matched'}`, () => {
        expect(matchesPatterns(new URL(testCase.url), testCase.patterns)).toBe(testCase.expected)
      })

      test('should match Cloudflare implementation', () => {
        const ourMatchResult = matchesPatterns(new URL(testCase.url), testCase.patterns)
        const cloudflareMatchResult = cloudflareMatchUrl(testCase.url, testCase.patterns)

        expect(ourMatchResult).toBe(cloudflareMatchResult)
      })
    })
  })
})
