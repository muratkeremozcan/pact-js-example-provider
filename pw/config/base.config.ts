import { defineConfig, devices } from '@playwright/test'
import { getStorageStatePath } from '../support/auth'

export const baseConfig = defineConfig({
  testDir: '../e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 2,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? 'html'
    : process.env.PW_HTML_REPORT
      ? [['list'], ['html']]
      : 'list',
  globalSetup: '../support/global-setup.ts',
  use: {
    trace: 'retain-on-first-failure',
    // Set the storage state path for all tests
    storageState: getStorageStatePath()
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
})
