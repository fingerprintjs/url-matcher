import * as testCases from './testCases.json'
import { matchUrl } from '../src'

describe('Matcher', () => {
  testCases.forEach((testCase) => {
    it(`Match for ${testCase.url} with ${testCase.pattern} should be ${testCase.expected ? 'matched' : 'not matched'}`, () => {
      expect(matchUrl(new URL(testCase.url), [testCase.pattern])).toBe(testCase.expected)
    })
  })
})
