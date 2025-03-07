/**
 * Authentication session manager for use with playwright
 * Similar pattern to the cypress-data-session package
 *
 * @internal This file contains implementation details that should not be directly imported
 * Use the public API exported from index.ts instead
 */
import type { APIRequestContext, BrowserContext } from '@playwright/test'
import {
  getStorageDir,
  getStorageStatePath,
  getTokenFilePath
} from './auth-storage-utils'
import * as fs from 'fs'
import * as path from 'path'
import type {
  AuthSessionOptions,
  AuthTokenData,
  TokenDataFormatter
} from './auth-types'
import { getGlobalAuthOptions } from './auth-configure'
import { getAuthProvider } from './auth-provider'

/**
 * Default token data formatter that creates the basic token structure
 * Can be overridden by providing a custom formatter in AuthSessionOptions
 */
const defaultTokenFormatter: TokenDataFormatter = (
  token: string
): AuthTokenData => ({
  token,
  createdAt: new Date().toISOString(),
  expiresAt: null // Set this if you know when the token expires
})

/**
 * Re-export configureAuthSession from auth-configure
 */
export { configureAuthSession } from './auth-configure'

/**
 * Export the default token formatter for consumers to extend
 */
export { defaultTokenFormatter }

/**
 * Authentication session manager that saves and reuses auth tokens
 * to avoid making unnecessary token requests.
 *
 * Follows Playwright's authentication state reuse pattern:
 * @see https://playwright.dev/docs/api-testing#reusing-authentication-state
 */
/**
 * Internal authentication manager that handles token storage and retrieval
 * @internal
 */
export class AuthSessionManager {
  private static instance: AuthSessionManager
  private readonly storageDir: string
  private readonly storageFile: string
  private readonly options: AuthSessionOptions
  private hasToken: boolean = false
  private token: string | null = null

  private constructor(options: AuthSessionOptions) {
    // Get global options as fallback
    const mergedOptions = { ...getGlobalAuthOptions(), ...options }

    // First gather defaults and merge with options
    const defaultTokenFetch: AuthSessionOptions['tokenFetch'] =
      mergedOptions.tokenFetch
        ? {
            method: mergedOptions.tokenFetch.method || 'GET',
            body: mergedOptions.tokenFetch.body || null,
            url: mergedOptions.tokenFetch.url,
            baseUrl: mergedOptions.tokenFetch.baseUrl,
            headers: mergedOptions.tokenFetch.headers
          }
        : {
            method: 'GET',
            body: null,
            url: '/auth/fake-token',
            baseUrl: `http://localhost:${process.env.PORT || 3000}`
          }

    // Create the final options by removing tokenFetch to avoid duplicates
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tokenFetch: _, ...restOptions } = mergedOptions

    // Merge everything together with proper typing
    this.options = {
      debug: false,
      tokenFileName: 'auth-token.json',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tokenExtractor: (data: any) => data.token,
      tokenFetch: defaultTokenFetch,
      ...restOptions
    }

    // Get the auth provider for environment and role information
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getAuthProvider } = require('./auth-provider')
    const provider = getAuthProvider()

    // Get environment and user role from the provider
    const environment = provider.getEnvironment()
    const userRole = provider.getUserRole()

    // Get storage paths based on environment and user role from the provider
    this.storageDir =
      this.options.storageDir ||
      getStorageDir({
        environment,
        userRole
      })

    this.storageFile = this.options.storageDir
      ? path.join(this.storageDir, this.options.tokenFileName!)
      : getTokenFilePath({
          environment,
          userRole,
          tokenFileName: this.options.tokenFileName
        })

    // Create the storage directory if it doesn't exist
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true })
    }

    // Try to load existing token
    this.loadTokenFromStorage()

    if (this.options.debug) {
      console.log(
        `Auth session manager initialized with storage at: ${this.storageFile}`
      )
    }
  }

  /**
   * Get singleton instance with options
   */
  public static getInstance(options?: AuthSessionOptions): AuthSessionManager {
    // Use provided options, fallback to global options, or throw if neither exists
    const resolvedOptions = options || getGlobalAuthOptions()
    if (!resolvedOptions) {
      throw new Error(
        'Auth session options must be provided either directly or via configureAuthSession'
      )
    }

    if (!AuthSessionManager.instance) {
      AuthSessionManager.instance = new AuthSessionManager(resolvedOptions)
    } else if (options) {
      // If new options are provided, warn that they won't be used as instance already exists
      console.warn(
        'Auth session manager already initialized - new options ignored'
      )
    }

    return AuthSessionManager.instance
  }

  /**
   * Load token from storage if it exists
   */
  private loadTokenFromStorage(): void {
    try {
      if (fs.existsSync(this.storageFile)) {
        const data = fs.readFileSync(this.storageFile, 'utf8')
        const parsed = JSON.parse(data) as AuthTokenData

        // Check if token is expired
        if (
          parsed.expiresAt &&
          new Date(parsed.expiresAt).getTime() < Date.now()
        ) {
          if (this.options.debug) {
            console.log('Token expired, will fetch a new one')
          }
          return
        }

        this.token = parsed.token
        this.hasToken = true

        if (this.options.debug) {
          console.log('Token loaded from storage')
        }
      }
    } catch (error) {
      console.error('Error loading token from storage:', error)
    }
  }

  /**
   * Save token to storage
   */
  private saveTokenToStorage(token: string): void {
    try {
      // Use custom formatter if provided or default formatter
      const tokenFormatter =
        this.options.tokenDataFormatter || defaultTokenFormatter
      const data = tokenFormatter(token)

      fs.writeFileSync(this.storageFile, JSON.stringify(data, null, 2))

      if (this.options.debug) {
        console.log('Token saved to storage')
      }
    } catch (error) {
      console.error('Error saving token to storage:', error)
    }
  }

  /**
   * Clear the token from storage
   */
  public clearToken(): void {
    try {
      if (fs.existsSync(this.storageFile)) {
        fs.unlinkSync(this.storageFile)
      }
      this.token = null
      this.hasToken = false

      if (this.options.debug) {
        console.log('Token cleared from storage')
      }
    } catch (error) {
      console.error('Error clearing token from storage:', error)
    }
  }

  /**
   * Fetch a new token
   */
  private async fetchToken(request: APIRequestContext): Promise<string> {
    // Check if tokenFetch is available
    if (!this.options.tokenFetch) {
      throw new Error(
        'Token fetch configuration is not available. Use setAuthProvider with a custom provider instead.'
      )
    }

    // Now we know tokenFetch exists, we can safely destructure it
    const {
      url,
      baseUrl,
      method = 'GET',
      body,
      headers
    } = this.options.tokenFetch

    if (this.options.debug) {
      console.log(
        `Fetching token from ${baseUrl || 'baseURL'}${url} with method ${method}`
      )
    }

    // Construct the full URL if baseUrl is provided
    const fullUrl = baseUrl ? `${baseUrl}${url}` : url

    const requestMethod = method.toLowerCase() as 'get' | 'post'

    // Handle GET vs POST differently - GET requests shouldn't have a body
    let response
    if (requestMethod === 'get') {
      response = await request.get(fullUrl, {
        headers: headers || {}
      })
    } else {
      response = await request[requestMethod](fullUrl, {
        data: body,
        headers: headers || { 'Content-Type': 'application/json' }
      })
    }

    if (!response.ok()) {
      throw new Error(
        `Failed to fetch token: ${response.status()} ${await response.text()}`
      )
    }

    let responseData
    const contentType = response.headers()['content-type'] || ''

    if (contentType.includes('application/json')) {
      responseData = await response.json()
    } else {
      responseData = await response.text()
    }

    // Extract token using the token extractor or default to the response itself
    const token =
      typeof responseData === 'string'
        ? responseData
        : this.options.tokenExtractor?.(responseData) || responseData

    if (!token || token === '') {
      throw new Error(
        'Failed to extract token from response - token is empty or undefined'
      )
    }

    return token
  }

  /**
   * Get a token, fetching a new one if needed
   */
  public async getToken(request: APIRequestContext): Promise<string> {
    if (this.hasToken && this.token) {
      if (this.options.debug) {
        console.log('Using cached token')
      }
      return this.token
    }

    const token = await this.fetchToken(request)
    this.token = token
    this.hasToken = true
    this.saveTokenToStorage(token)

    return token
  }
}

/**
 * Get a token for authentication
 *
 * This function requires both:
 * 1. configureAuthSession() - For basic storage paths and configuration
 * 2. setAuthProvider() - For actual token implementation
 */
export async function getAuthToken(
  request: APIRequestContext,
  options?: { environment?: string; userRole?: string }
): Promise<string> {
  // Step 1: Check if basic configuration exists (from configureAuthSession)
  const globalOptions = getGlobalAuthOptions()
  if (!globalOptions) {
    throw new Error(
      'Basic auth configuration missing. You must call configureAuthSession() first to set up storage paths.'
    )
  }

  // Step 2: Check if a custom provider is configured (from setAuthProvider)
  const provider = getAuthProvider()
  if (!provider) {
    throw new Error(
      'No auth provider configured. You must call setAuthProvider() with your custom provider.'
    )
  }

  // Step 3: Use the custom provider with configuration from both sources
  return provider.getToken(request, {
    environment: options?.environment,
    userRole: options?.userRole
  })
}

/**
 * Clear the token from storage
 */
export function clearAuthToken(options?: {
  environment?: string
  userRole?: string
}): void {
  // Get global auth options
  const globalOptions = getGlobalAuthOptions()
  if (!globalOptions) {
    throw new Error(
      'Auth session not configured. Call configureAuthSession first.'
    )
  }

  // Create full options
  const fullOptions: AuthSessionOptions = {
    ...globalOptions,
    ...options
  }

  const authManager = AuthSessionManager.getInstance(fullOptions)
  authManager.clearToken()
}

/**
 * Apply auth token to a browser context for UI testing
 */
export async function applyAuthToBrowserContext(
  context: BrowserContext,
  token: string,
  options?: { environment?: string; userRole?: string }
): Promise<void> {
  // Get the storage state path
  const statePath = getStorageStatePath(options)

  // Save the current state
  await context.storageState({ path: statePath })

  // Add the auth token to localStorage
  await context.addInitScript((token) => {
    // Store token in localStorage
    window.localStorage.setItem('authToken', token)
  }, token)

  // Navigate to the app to ensure the init script runs
  const page = await context.newPage()
  await page.goto('/')
  await page.close()

  // Save the state with the token
  await context.storageState({ path: statePath })
}
