import * as testCases from './testCases.json'
import { cloudflareMatchUrl } from './cloudflare'
import { InvalidPatternError, InvalidProtocolError, matchPatterns, parseRoutes, matchRoutes } from '../src'

describe('Matcher', () => {
  // Based on miniflare behaviour
  it('should throw for an infix wildcard', () => {
    expect(() =>
      matchPatterns(['fingerprint.com/blog/*/post-*'], new URL('https://example.com/blog/2025/post-1'))
    ).toThrow(
      new InvalidPatternError(
        'Route "fingerprint.com/blog/*/post-*" contains an infix wildcard. This is not allowed.',
        'ERR_INFIX_WILDCARD'
      )
    )
  })

  it('should throw if pattern contains query string', () => {
    expect(() =>
      matchPatterns(['fingerprint.com/blog/post123?q=test'], new URL('https://example.com/blog/2025/post-1'))
    ).toThrow(
      new InvalidPatternError(
        'Route "fingerprint.com/blog/post123?q=test" contains a query string. This is not allowed.',
        'ERR_QUERY_STRING'
      )
    )
  })

  it.each(['ws', 'ftp'])('should throw for invalid protocol passed in patterns: %s', (protocol) => {
    expect(() => matchPatterns([`${protocol}://example.com`], new URL('https://example.com'))).toThrow(
      new InvalidProtocolError(protocol)
    )
  })

  it.each(['ws', 'ftp'])('should throw for invalid protocol passed in URL: %s', (protocol) => {
    expect(() => matchPatterns([`https://example.com`], new URL(`${protocol}://example.com`))).toThrow(
      new InvalidProtocolError(protocol)
    )
  })

  it('should return target to matched route if it was set', () => {
    const routes = parseRoutes([
      {
        url: 'https://example.com/blog/*',
        target: 'blog',
      },
      {
        url: 'https://fingerprint.com',
        target: 'fingerprint',
      },
      'https://google.com',
    ])

    const matchedRoute = matchRoutes(routes, new URL('https://example.com/blog/post123'))

    expect(matchedRoute?.target).toBe('blog')
  })

  it('should return target to matched route if it was set respecting specificity', () => {
    const routes = parseRoutes(
      [
        {
          url: 'https://example.com/blog/*',
          target: 'blog',
        },
        'https://google.com',
        {
          url: 'https://example.com/blog/post123',
          target: 'specific-blog',
        },
      ] as const,
      { sortBySpecificity: true }
    )

    const matchedRoute = matchRoutes(routes, new URL('https://example.com/blog/post123'))

    expect(matchedRoute?.target).toBe('specific-blog')
  })

  testCases.forEach((testCase, index) => {
    // Add "only: true" to a specific test case to isolate it
    const test = testCase.only ? it.only : it

    describe(`#${index + 1} Match for ${testCase.url} with ${testCase.patterns.join(',')}`, () => {
      test(`should be ${testCase.expected ? 'matched' : 'not matched'}`, () => {
        expect(matchPatterns(testCase.patterns, new URL(testCase.url))).toBe(testCase.expected)
      })

      test('should match Cloudflare implementation', () => {
        const ourMatchResult = matchPatterns(testCase.patterns, new URL(testCase.url))
        const cloudflareMatchResult = cloudflareMatchUrl(testCase.url, testCase.patterns)

        expect(ourMatchResult).toBe(cloudflareMatchResult)
      })
    })
  })
})
