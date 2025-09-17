import * as testCases from './testCases.json'
import { cloudflareMatchUrl } from './cloudflare'
import { InvalidProtocolError, matchPatterns } from '../src'

describe('Matcher', () => {
  // Based on miniflare behaviour
  it('should throw for an infix wildcard', () => {
    expect(() =>
      matchPatterns(['fingerprint.com/blog/*/post-*'], new URL('https://example.com/blog/2025/post-1'))
    ).toThrow('Route "fingerprint.com/blog/*/post-*" contains an infix wildcard. This is not allowed.')
  })

  it.each(['ws', 'ftp'])('should throw for invalid protocol: %s', (protocol) => {
    expect(() => matchPatterns([`${protocol}://example.com`], new URL('https://example.com'))).toThrow(
      new InvalidProtocolError(protocol)
    )
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
