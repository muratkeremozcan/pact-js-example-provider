/**
 * Storage utilities for Playwright testing
 * Simple, explicit functions for managing test storage files
 *
 * Uses Playwright's storage state for auth sessions:
 * @see https://playwright.dev/docs/api-testing#reusing-authentication-state
 * @see https://playwright.dev/docs/api/class-apirequestcontext#api-request-context-storage-state
 * @see https://playwright.dev/docs/api/class-browsercontext#browser-context-storage-state
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
import fs from 'node:fs'
import path from 'node:path'

/**
 * Default environment when none is specified
 */
const DEFAULT_ENVIRONMENT = 'local'

/**
 * Default user role when none is specified
 */
const DEFAULT_USER_ROLE = 'default'

/**
 * Get environment from the auth provider or fallback to environment variables
 * @param options Optional overrides
 */
export function getCurrentEnvironment(options?: {
  environment?: string
}): string {
  try {
    // Try to get from provider first
    const { getAuthProvider } = require('./auth-provider')
    const provider = getAuthProvider()
    return provider.getEnvironment(options)
  } catch (error) {
    // Fallback to environment variables
    return options?.environment || process.env.TEST_ENV || DEFAULT_ENVIRONMENT
  }
}

/**
 * Get current user role from the auth provider or fallback to default
 * @param options Optional overrides
 */
export function getCurrentUserRole(options?: { userRole?: string }): string {
  try {
    // Try to get from provider first
    const { getAuthProvider } = require('./auth-provider')
    const provider = getAuthProvider()
    return provider.getUserRole(options)
  } catch (error) {
    // Fallback to default or provided value
    return options?.userRole || DEFAULT_USER_ROLE
  }
}

/**
 * Get the storage directory path based on environment and user role
 *
 * @param options Configuration options
 * @param options.environment Test environment (e.g., 'local', 'dev', 'staging')
 * @param options.userRole User role for storage separation
 * @returns Path to the auth storage directory
 */
export function getStorageDir(options?: {
  environment?: string
  userRole?: string
}): string {
  const environment = getCurrentEnvironment(options)
  const userRole = getCurrentUserRole(options)

  return path.join(process.cwd(), 'pw', '.auth-sessions', environment, userRole)
}

/**
 * Get the storage state path for a specific environment and user role
 *
 * @param options Configuration options
 * @param options.environment Test environment (e.g., 'local', 'dev', 'staging')
 * @param options.userRole User role for storage separation
 * @returns Path to the storage state file
 */
export function getStorageStatePath(options?: {
  environment?: string
  userRole?: string
}): string {
  return path.join(getStorageDir(options), 'storage-state.json')
}

/**
 * Get the token file path for a specific environment and user role
 *
 * @param options Configuration options
 * @param options.environment Test environment (e.g., 'local', 'dev', 'staging')
 * @param options.userRole User role for storage separation
 * @param options.tokenFileName Custom token filename
 * @returns Path to the token file
 */
export function getTokenFilePath(options?: {
  environment?: string
  userRole?: string
  tokenFileName?: string
}): string {
  const tokenFileName = options?.tokenFileName || 'auth-token.json'
  return path.join(getStorageDir(options), tokenFileName)
}

// Default paths using the current environment
export const storageDir = getStorageDir()

/**
 * Initialize storage for auth sessions
 * This ensures the directory structure is ready for auth session storage
 *
 * Creates an empty storage state compatible with Playwright's storageState option:
 * @see https://playwright.dev/docs/api/class-browsercontext#browser-context-storage-state
 *
 * @param options Configuration options
 * @param options.environment Test environment (e.g., 'local', 'dev', 'staging')
 * @param options.userRole User role for storage separation
 * @returns Object containing the created storage paths
 */
export function authStorageInit(options?: {
  environment?: string
  userRole?: string
}): { storageDir: string; storageStatePath: string } {
  const dir = getStorageDir(options)
  const statePath = getStorageStatePath(options)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`Created auth session directory at ${dir}`)
  }

  if (!fs.existsSync(statePath)) {
    fs.writeFileSync(
      statePath,
      // Create empty storage state in Playwright's expected format
      // See: https://playwright.dev/docs/api/class-browsercontext#browser-context-storage-state
      JSON.stringify({ cookies: [], origins: [] })
    )
    console.log(`Created empty storage state at ${statePath}`)
  }

  return { storageDir: dir, storageStatePath: statePath }
}
