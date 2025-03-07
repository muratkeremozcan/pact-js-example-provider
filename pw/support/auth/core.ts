/**
 * Core authentication functionality for the auth session library
 * This file consolidates and re-exports the public API from implementation files
 */
import type { APIRequestContext, BrowserContext } from '@playwright/test'
import type { AuthSessionOptions } from './internal/auth-types'
import { AuthSessionManager } from './internal/auth-session'
import {
  configureAuthSession as configureAuth,
  getGlobalAuthOptions
} from './internal/auth-configure'
import { getStorageStatePath } from './internal/auth-storage-utils'

// Re-export the default token formatter
export { defaultTokenFormatter } from './internal/auth-session'

/**
 * Configure the authentication session with the provided options
 * This is the main entry point for setting up the auth system
 */
export function configureAuthSession(options: AuthSessionOptions): void {
  configureAuth(options)
}

/**
 * Get an authentication token, fetching a new one if needed
 * @param request The Playwright APIRequestContext
 * @param options Optional environment and user role overrides
 * @returns A promise that resolves to the authentication token
 */
export async function getAuthToken(
  request: APIRequestContext,
  options?: { environment?: string; userRole?: string }
): Promise<string> {
  // Get global auth options
  const globalOptions = getGlobalAuthOptions()
  if (!globalOptions) {
    throw new Error(
      'Auth session not configured. Call configureAuthSession first.'
    )
  }

  // Create a full options object by combining global options with the provided options
  const fullOptions: AuthSessionOptions = {
    ...globalOptions,
    ...options
  }

  // Get the auth manager with combined options and fetch token
  const authManager = AuthSessionManager.getInstance(fullOptions)
  return authManager.getToken(request)
}

/**
 * Clear the authentication token from storage
 * @param options Optional environment and user role overrides
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

  // Create full options with correct environment/role
  const fullOptions: AuthSessionOptions = {
    ...globalOptions,
    ...options
  }

  // Get the auth manager with the right options
  const authManager = AuthSessionManager.getInstance(fullOptions)
  authManager.clearToken()
}

/**
 * Apply the authentication token to a browser context for UI testing
 * @param context The Playwright BrowserContext
 * @param token The authentication token to apply
 * @param options Optional environment and user role overrides
 * @returns A promise that resolves when the token has been applied
 */
export function applyAuthToBrowserContext(
  context: BrowserContext,
  token: string,
  options?: { environment?: string; userRole?: string }
): Promise<void> {
  // Get global auth options
  const globalOptions = getGlobalAuthOptions()
  if (!globalOptions) {
    throw new Error(
      'Auth session not configured. Call configureAuthSession first.'
    )
  }

  // Get storage state path based on environment and role from options
  // Extract just the environment and userRole properties that getStorageStatePath expects
  const storageOptions = options || {}
  const statePath = getStorageStatePath(storageOptions)

  // Save the current state
  return context.storageState({ path: statePath }).then(() => {
    // Add the auth token to localStorage
    return context.addInitScript((token) => {
      // Store token in localStorage
      window.localStorage.setItem('authToken', token)
    }, token)
  })
}
