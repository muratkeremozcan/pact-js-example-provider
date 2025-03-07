/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Playwright Auth Session Test Fixtures
 * Provides factory functions to create test fixtures for authentication
 */

import {
  type BrowserContext,
  type Page,
  type APIRequestContext
} from '@playwright/test'
import { getAuthProvider } from './internal/auth-provider'
import { getStorageStatePath } from './internal/auth-storage-utils'

/**
 * Options for authentication fixtures
 */
export interface AuthOptions {
  /**
   * Environment to use for authentication
   * @default process.env.TEST_ENV || 'local'
   */
  environment?: string

  /**
   * User role to authenticate as
   * @default 'default'
   */
  userRole?: string
}

/**
 * Creates auth fixtures that can be used to extend Playwright's test object
 * @returns An object with fixtures that can be used with test.extend()
 */
export function createAuthFixtures() {
  /**
   * Default auth options using the current environment
   */
  const defaultAuthOptions: AuthOptions = {
    environment: process.env.TEST_ENV || 'local',
    userRole: 'default'
  }

  // Get the configured auth provider
  const authProvider = getAuthProvider()

  return {
    /**
     * Auth options to configure environment and user role
     * @default { environment: process.env.TEST_ENV || 'local', userRole: 'default' }
     */
    authOptions: [defaultAuthOptions, { option: true }],

    /**
     * Authentication token fixture that reuses tokens across tests
     * @example
     * ```ts
     * test('use auth token', async ({ authToken }) => {
     *   // Use the token in API calls
     *   const response = await fetch('/api/data', {
     *     headers: { Authorization: authToken }
     *   })
     * })
     * ```
     */
    authToken: async (
      {
        request,
        authOptions
      }: { request: APIRequestContext; authOptions: AuthOptions },
      use: (token: string) => Promise<void>
    ) => {
      // Get token using the auth provider
      const token = await authProvider.getToken(request, authOptions)
      await use(token)
    },

    /**
     * Browser context with authentication applied
     * @example
     * ```ts
     * test('use authenticated context', async ({ context }) => {
     *   const page = await context.newPage()
     *   await page.goto('/protected-page')
     *   // Auth is already set up!
     * })
     * ```
     */
    context: async (
      {
        browser,
        request,
        authOptions
      }: { browser: any; request: APIRequestContext; authOptions: AuthOptions },
      use: (context: BrowserContext) => Promise<void>
    ) => {
      // Get token using the auth provider
      const token = await authProvider.getToken(request, authOptions)

      // Create and configure browser context
      const context = await browser.newContext({
        baseURL:
          process.env.BASE_URL ||
          `http://localhost:${process.env.PORT || 8080}`,
        storageState: getStorageStatePath(authOptions)
      })

      // Apply auth token to browser context
      await authProvider.applyToBrowserContext(context, token, authOptions)

      // Use and clean up
      await use(context)
      await context.close()
    },

    /**
     * Page with authentication applied
     * @example
     * ```ts
     * test('use authenticated page', async ({ page }) => {
     *   await page.goto('/protected-page')
     *   // Auth is already set up!
     * })
     * ```
     */
    page: async (
      { context }: { context: BrowserContext },
      use: (page: Page) => Promise<void>
    ) => {
      const page = await context.newPage()
      await use(page)
    }
  }
}

/**
 * Creates role-specific test fixtures
 * @param testBase The base test object to extend
 * @param role The user role to authenticate as
 * @returns A test object configured for the specified role
 */
export function createRoleSpecificTest(testBase: any, role: string) {
  return testBase.extend({
    authOptions: { userRole: role }
  })
}
