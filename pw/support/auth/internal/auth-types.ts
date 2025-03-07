/**
 * Type definitions for the authentication session manager
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Options for token fetching
 */
export interface TokenFetchOptions {
  /**
   * URL path to fetch the token from (relative to baseUrl)
   */
  url: string

  /**
   * Base URL for the request (default: baseUrl from playwright config)
   */
  baseUrl?: string

  /**
   * HTTP method for the token fetch (default: POST)
   */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'

  /**
   * Request body for the token fetch (default: null)
   */
  body?: any

  /**
   * Headers for the token fetch (default: content-type: application/json)
   */
  headers?: Record<string, string>

  /**
   * How to extract the token from the response (default: direct string or json.token)
   */
  tokenExtractor?: (response: any) => string
}

/**
 * Options for the auth session
 */
export interface AuthSessionOptions {
  /**
   * Root directory for auth session storage (default: pw/.auth-sessions)
   * Note: The environment and user role will be appended to this path by the provider
   */
  storageDir?: string

  /**
   * Token filename (default: auth-token.json)
   */
  tokenFileName?: string

  /**
   * Storage state filename (default: storage-state.json)
   */
  storageStateFileName?: string

  /**
   * Function to extract the token from a response
   * @default (data) => data.token
   */
  tokenExtractor?: (data: any) => string

  /**
   * Custom token data formatter to control how tokens are saved
   * This function generates the structure of saved token data
   * @default defaultTokenFormatter
   */
  tokenDataFormatter?: TokenDataFormatter

  /**
   * Token fetch configuration
   */
  tokenFetch?: TokenFetchOptions

  /**
   * Debug mode (default: false)
   */
  debug?: boolean
}

/**
 * Auth token storage format
 *
 * Extensible to support different authentication systems and token formats.
 * Only 'token' and 'createdAt' are required, all other fields are optional.
 */
export interface AuthTokenData {
  /**
   * The token value (required)
   */
  token: string

  /**
   * When the token was created (ISO date string, required)
   */
  createdAt: string

  /**
   * When the token expires (ISO date string or null if not set)
   */
  expiresAt?: string | null

  /**
   * Optional refresh token for OAuth2 or similar flows
   */
  refreshToken?: string

  /**
   * Optional token type (e.g., "Bearer", "JWT")
   */
  tokenType?: string

  /**
   * Allow any additional properties needed by specific authentication systems
   */
  [key: string]: unknown
}

/**
 * Function type for customizing how token data is formatted before storage
 * This allows for complete customization of the token storage format
 */
export type TokenDataFormatter = (token: string) => AuthTokenData

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
 * For usage in test fixtures
 */
export type AuthFixtures = {
  authOptions: AuthOptions
  authToken: string
  // context and page are already part of the base Playwright test
}
