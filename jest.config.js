/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  projects: [
    {
      preset: 'ts-jest',
      testEnvironment: 'node',
      testRegex: '/__tests__/.+test.tsx?$',
      collectCoverageFrom: ['./src/**/**.{ts,tsx}'],
      setupFilesAfterEnv: ['./__tests__/setup.ts'],
      displayName: 'Node.js',
    },
    {
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testRegex: '/__tests__/.+test.tsx?$',
      collectCoverageFrom: ['./src/**/**.{ts,tsx}'],
      setupFilesAfterEnv: ['./__tests__/setup.ts'],
      displayName: 'Browser (JSDom)',
    },
  ],
  coverageReporters: ['lcov', 'json-summary', ['text', { file: 'coverage.txt', path: './' }]],
}
