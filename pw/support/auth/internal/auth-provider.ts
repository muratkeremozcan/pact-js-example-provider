/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Auth Provider Interface
 * Defines the contract for authentication providers
 */
import type { APIRequestContext, BrowserContext } from '@playwright/test'
import type { AuthOptions } from './auth-types'

/**
 * AuthProvider interface defines the contract for custom authentication providers
 * Applications can implement this interface to provide their own authentication logic
 */
export interface AuthProvider {
  /**
   * Get the current environment (e.g., 'local', 'staging', 'production')
   * @param options Optional options that might override the default environment
   * @returns The current environment to use
   */
  getEnvironment(options?: Partial<AuthOptions>): string

  /**
   * Get the current user role (e.g., 'admin', 'user', 'guest')
   * @param options Optional options that might override the default role
   * @returns The current user role to use
   */
  getUserRole(options?: Partial<AuthOptions>): string

  /**
   * Get authentication token for API requests
   * @param request Playwright APIRequestContext for making HTTP requests
   * @param options Optional auth options that might override defaults
   * @returns Promise resolving to the authentication token
   */
  getToken(
    request: APIRequestContext,
    options?: Partial<AuthOptions>
  ): Promise<string>

  /**
   * Apply authentication to a browser context for UI testing
   * @param context Playwright BrowserContext to apply authentication to
   * @param token Authentication token
   * @param options Optional auth options that might override defaults
   */
  applyToBrowserContext(
    context: BrowserContext,
    token: string,
    options?: Partial<AuthOptions>
  ): Promise<void>

  /**
   * Clear authentication token
   * @param options Optional auth options that might override defaults
   */
  clearToken(options?: Partial<AuthOptions>): void
}

/**
 * Default auth provider factory.
 * Creates a default implementation of AuthProvider that uses the built-in session manager.
 */
function createDefaultAuthProvider(
  customConfig: {
    tokenUrl?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tokenExtractor?: (data: any) => string
    storageBaseDir?: string
    defaultEnvironment?: string
    defaultUserRole?: string
  } = {}
): AuthProvider {
  // Import implementation details here, not in consumer code
  // Use dynamic import to avoid circular dependencies
  const authSession = require('./auth-session')
  const { clearAuthToken, applyAuthToBrowserContext } = authSession

  return {
    // New methods to make provider the source of truth
    getEnvironment: (options = {}) => {
      // Env provided in options takes precedence over default
      return (
        options.environment ||
        customConfig.defaultEnvironment ||
        process.env.TEST_ENV ||
        'local'
      )
    },

    getUserRole: (options = {}) => {
      // Role provided in options takes precedence over default
      return options.userRole || customConfig.defaultUserRole || 'default'
    },

    getToken: async (request, options = {}) => {
      // Get environment and role from provider methods
      const environment =
        options.environment ||
        customConfig.defaultEnvironment ||
        process.env.TEST_ENV ||
        'local'
      const userRole =
        options.userRole || customConfig.defaultUserRole || 'default'

      // Create a direct instance of the auth manager instead of using getAuthToken
      // to avoid circular dependency
      const storageBase = customConfig.storageBaseDir || undefined
      const storagePath = storageBase
        ? `${storageBase}/${environment}/${userRole}`
        : undefined

      // Configure the options with AuthSessionManager.getInstance()
      const authOptions = {
        storageDir: storagePath,
        tokenFetch: customConfig.tokenUrl
          ? { url: customConfig.tokenUrl }
          : undefined,
        tokenExtractor: customConfig.tokenExtractor,
        debug: false // Set debug off by default
      }

      // Get token directly from the manager using the authSession module
      const token =
        await authSession.AuthSessionManager.getInstance(authOptions).getToken(
          request
        )

      // Ensure we're returning a string
      return typeof token === 'string'
        ? token
        : token.token || JSON.stringify(token)
    },

    applyToBrowserContext: async (context, token, options = {}) => {
      // Use provider methods to get environment and role
      const finalOptions = {
        environment:
          options.environment ||
          customConfig.defaultEnvironment ||
          process.env.TEST_ENV ||
          'local',
        userRole: options.userRole || customConfig.defaultUserRole || 'default',
        ...options
      }
      return applyAuthToBrowserContext(context, token, finalOptions)
    },

    clearToken: (options = {}) => {
      // Use provider methods to get environment and role
      const finalOptions = {
        environment:
          options.environment ||
          customConfig.defaultEnvironment ||
          process.env.TEST_ENV ||
          'local',
        userRole: options.userRole || customConfig.defaultUserRole || 'default',
        ...options
      }
      clearAuthToken(finalOptions)
    }
  }
}

// Global provider instance that can be configured
let globalAuthProvider: AuthProvider | null = null

/**
 * Set the global auth provider
 * @param provider Custom auth provider implementation
 */
export function setAuthProvider(provider: AuthProvider): void {
  globalAuthProvider = provider
}

/**
 * Get the configured auth provider or create a default one
 * Requires that configuration has been set up before use
 */
export function getAuthProvider(): AuthProvider {
  // Create default provider if none exists
  if (!globalAuthProvider) {
    globalAuthProvider = createDefaultAuthProvider()
  }
  return globalAuthProvider
}
