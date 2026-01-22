import { test, expect, Page } from '@playwright/test'
import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'

test('matches wildcard subdomain with full path in browser context', async ({ page }) => {
  await runMatcherTest(page, {
    url: 'https://specific-subdomain.example.test/path',
    patterns: ['*.example.test/path'],
    expected: true,
  })
})

test('matches wildcard subdomain AND wildcard suffix in path in browser context', async ({ page }) => {
  await runMatcherTest(page, {
    url: 'https://sub.example.test/api/users/123',
    patterns: ['*.example.test/api/users/*'],
    expected: true,
  })
})

test('matches PARTIAL wildcard subdomain AND wildcard suffix in path in browser context', async ({ page }) => {
  await runMatcherTest(page, {
    url: 'https://some-subdomain.example.test/api/users/123',
    patterns: ['*-subdomain.example.test/api/users/*'],
    expected: true,
  })
})

test('does not match when path differs in browser context', async ({ page }) => {
  await runMatcherTest(page, {
    url: 'https://subdomain.example.test/different-path',
    patterns: ['*.example.test/some-path'],
    expected: false,
  })
})

const modulePath = resolve(__dirname, '../../dist/index.esm.js')

declare global {
  interface Window {
    __result?: boolean
    __error?: string
  }
}

interface MatcherTestCase {
  url: string
  patterns: string[]
  expected: boolean
}

async function runMatcherTest(page: Page, { url, patterns, expected }: MatcherTestCase): Promise<void> {
  const moduleCode = await readFile(modulePath, 'utf8')
  const appUrl = 'http://url-matcher.test'
  const moduleUrl = `${appUrl}/index.esm.js`

  const patternsJson = JSON.stringify(patterns)

  await page.route(`${appUrl}/`, async (route) => {
    const html = `<!doctype html>
      <meta charset="utf-8">
      <script type="module">
        import { matchesPatterns } from '${moduleUrl}';
        try {
          window.__result = matchesPatterns(
            new URL('${url}'),
            ${patternsJson}
          );
        } catch (error) {
          window.__error = String(error);
        }
      </script>`
    await route.fulfill({ status: 200, contentType: 'text/html', body: html })
  })

  await page.route(moduleUrl, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/javascript', body: moduleCode })
  })

  await page.goto(appUrl)
  await page.waitForFunction(() => window.__result !== undefined || window.__error !== undefined)

  const error = await page.evaluate(() => window.__error ?? null)
  expect(error).toBeNull()

  const result = await page.evaluate(() => window.__result)
  expect(result).toBe(expected)
}
