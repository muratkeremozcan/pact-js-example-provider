/**
 * Playwright Auth Session Library
 * A reusable authentication session management system for Playwright
 */

// Public Types
export type {
  AuthTokenData,
  TokenDataFormatter,
  AuthSessionOptions,
  TokenFetchOptions,
  AuthOptions,
  AuthFixtures
} from './internal/auth-types'

// Core API functions
export {
  configureAuthSession,
  getAuthToken,
  clearAuthToken,
  applyAuthToBrowserContext,
  defaultTokenFormatter
} from './core'

// Global setup helper (optional)
export { initializeAuthForGlobalSetup } from './global-setup-helper'

// Storage utilities
export { getStorageStatePath } from './internal/auth-storage-utils'

// URL utilities
export { getBaseUrl, getAuthBaseUrl } from './internal/url-utils'

// Global initialization utilities
export { authStorageInit, authGlobalInit } from './internal/auth-global-setup'

// Auth Provider API
export {
  type AuthProvider,
  setAuthProvider,
  getAuthProvider
} from './internal/auth-provider'

// Test fixtures
export { createAuthFixtures, createRoleSpecificTest } from './test-fixtures'
