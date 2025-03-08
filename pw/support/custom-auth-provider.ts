/**
 * Example of a custom auth provider implementation
 *
 * This demonstrates how to create a fully custom authentication provider
 * that can handle specialized auth flows beyond the default implementation.
 *
 * The provider is now the source of truth for environment and role information.
 */

import { type AuthProvider } from './auth'
import * as fs from 'fs'
import {
  getTokenFilePath,
  authStorageInit
} from './auth/internal/auth-storage-utils'
import { loadTokenFromStorage, saveTokenToStorage } from './auth/core'

// Create a fully custom provider implementation
const myCustomProvider: AuthProvider = {
  /**
   * Get the current environment to use
   */
  getEnvironment(options = {}) {
    // Environment priority:
    // 1. Options passed directly to this method
    // 2. Environment variables
    // 3. Default environment
    return options.environment || process.env.TEST_ENV || 'local'
  },

  /**
   * Get the current user role to use
   */
  getUserRole(options = {}) {
    // Role priority:
    // 1. Options passed directly to this method
    // 2. Default role based on environment
    const environment = this.getEnvironment(options)

    // You could implement environment-specific default roles
    let defaultRole = 'default'
    if (environment === 'staging') defaultRole = 'tester'
    if (environment === 'production') defaultRole = 'readonly'

    return options.userRole || process.env.TEST_USER_ROLE || defaultRole
  },

  /**
   * Get authentication token using custom logic
   */
  async getToken(request, options = {}) {
    // Use our own methods to ensure consistency
    const environment = this.getEnvironment(options)
    const userRole = this.getUserRole(options)

    // Use the utility functions to get standardized paths
    const tokenPath = getTokenFilePath({
      environment,
      userRole,
      tokenFileName: 'custom-auth-token.json'
    })

    // Check if we already have a valid token using the core utility
    // Add custom logging for this provider implementation
    console.log(`[Custom Auth] Checking for existing token at ${tokenPath}`)
    const existingToken = loadTokenFromStorage(tokenPath, true)
    if (existingToken) {
      console.log(`[Custom Auth] Using existing token from ${tokenPath}`)
      return existingToken
    }

    // Initialize storage directories if needed
    authStorageInit({ environment, userRole })

    // Get a new token using our custom auth flow
    console.log(
      `[Custom Auth] Fetching new token for ${environment}/${userRole}`
    )

    // Custom authentication request - this could be any authentication flow:
    // OAuth, API key, etc.
    const baseUrl =
      process.env.AUTH_BASE_URL ||
      `http://localhost:${process.env.PORT || 3000}`
    const endpoint = process.env.AUTH_TOKEN_ENDPOINT || '/auth/fake-token'
    const response = await request.get(`${baseUrl}${endpoint}`)

    // Extract token from response - customize based on your API response format
    const data = await response.json()
    const token = data.access_token || data.token || data.accessToken

    // Use the core utility to save the token with metadata
    // We turn on debug mode to get logging
    console.log(`[Custom Auth] Saving token to ${tokenPath}`)
    saveTokenToStorage(
      tokenPath,
      token,
      {
        environment,
        userRole,
        source: 'custom-provider'
      },
      true
    )

    return token
  },

  /**
   * Apply the token to a browser context for UI testing
   */
  async applyToBrowserContext(context, token, options = {}) {
    // Get environment for domain configuration
    const environment = this.getEnvironment(options)

    // Set domain based on environment
    const domain =
      environment === 'local' ? 'localhost' : `${environment}.example.com`

    // Log what we're doing
    console.log(
      `[Custom Auth] Applying token to browser context for ${environment}`
    )

    // Example: Set authentication cookie
    await context.addCookies([
      {
        name: 'auth_token',
        value: token,
        domain,
        path: '/',
        httpOnly: true,
        secure: environment !== 'local',
        sameSite: 'Lax'
      }
    ])

    // Example: Set localStorage (alternative auth method)
    await context.addInitScript(`
      localStorage.setItem('token', '${token}');
      console.log('[Custom Auth] Set token in localStorage');
    `)

    // You could also:
    // - Set headers for all requests
    // - Modify the page before it loads
    // - Inject scripts
  },

  /**
   * Clear token when needed
   */
  clearToken(options = {}) {
    // Use our own methods to ensure consistency
    const environment = this.getEnvironment(options)
    const userRole = this.getUserRole(options)

    // Use the utility function to get the token path - same as in getToken
    const tokenPath = getTokenFilePath({
      environment,
      userRole,
      tokenFileName: 'custom-auth-token.json'
    })

    // Delete the token file if it exists
    if (fs.existsSync(tokenPath)) {
      console.log(`[Custom Auth] Clearing token at ${tokenPath}`)
      fs.unlinkSync(tokenPath)
    }
  }
}

// Export for using in global setup
export default myCustomProvider
