/**
 * Auth session setup for the current project
 * Manages global authentication configuration
 */
import { config as dotenvConfig } from 'dotenv'
import path from 'node:path'
import { storageDir } from './auth-storage-utils'
import type { AuthSessionOptions } from './auth-types'
import fs from 'node:fs'
// eslint-disable-next-line import/named
import { v4 as uuidv4 } from 'uuid'

// Load environment variables
dotenvConfig({
  path: path.resolve(__dirname, '../../.env')
})

// File path for storing configuration
const CONFIG_FILE_PATH = path.join(storageDir, 'auth-config.json')

// Create the storage directory if it doesn't exist
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true })
}

/**
 * Configure minimal auth storage settings required by custom auth providers
 *
 * This function only sets up storage paths and debugging options.
 * It does NOT handle token acquisition or environment/role management (that should be done by the auth provider).
 */
export function configureAuthSession(
  options: Partial<AuthSessionOptions> = {}
): void {
  // Extract only the core options needed for storage and debugging
  const coreConfig = {
    // Storage directory configuration
    storageDir: options.storageDir || storageDir,

    // Debug mode (used by all providers)
    debug: options.debug || false,

    // Add tracking metadata
    configId: uuidv4(),
    timestamp: new Date().toISOString()
  }

  // Write minimal configuration to file storage
  fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(coreConfig, null, 2))
  console.log(`Auth storage configuration saved to ${CONFIG_FILE_PATH}`)
}

/**
 * Get the current global auth session options
 * @returns The global auth options or null if not configured
 */
export function getGlobalAuthOptions(): AuthSessionOptions | null {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const configData = fs.readFileSync(CONFIG_FILE_PATH, 'utf8')
      return JSON.parse(configData)
    }
  } catch (error) {
    console.error('Error reading auth configuration:', error)
  }
  return null
}

/**
 * Initialize auth configuration with project defaults
 * * Makes auth configuration available
 * * Tests will fetch their own tokens as needed
 * * First auth call in tests will be slower (needs to fetch a token)
 * @returns The configuration options that were applied
 */
export function initializeDefaultConfiguration(): AuthSessionOptions {
  // Default configuration options
  const defaultOptions: AuthSessionOptions = {
    // Storage configuration
    storageDir,

    // Token fetch configuration - uses fallbacks in configureAuthSession
    tokenFetch: {
      url: process.env.AUTH_TOKEN_ENDPOINT || '/auth/token', // Required by TokenFetchOptions
      method: 'GET',
      body: null
    },

    // Enable debug logging for troubleshooting
    debug: true
  }

  // Apply the configuration
  configureAuthSession(defaultOptions)

  // Return the applied options (immutable copy)
  return { ...defaultOptions }
}

// NO LONGER auto-initializes when imported
// Instead, core.ts will handle initialization on demand
