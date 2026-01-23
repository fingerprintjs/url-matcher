import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '__tests__/playwright',
  timeout: 30_000,
  use: {
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
      },
    },
  ],
})
