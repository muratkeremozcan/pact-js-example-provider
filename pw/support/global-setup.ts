/**
 * Global setup script for Playwright testing
 *
 * This script handles initial setup tasks before tests run:
 * 1. Ensures storage directories exist for auth sessions
 * 2. Explicitly configures authentication using one of two approaches:
 *    - Default approach: configureAuthSession with token fetch options
 *    - Custom approach: Register a custom auth provider implementation
 *
 * To use this, add to your playwright config:
 * ```
 * globalSetup: '../support/global-setup.ts'
 * ```
 */

import {
  authStorageInit,
  setAuthProvider,
  configureAuthSession
  // authGlobalInit
} from './auth'

// Uncomment to use the custom auth provider
import myCustomProvider from './custom-auth-provider'

/**
 * Global setup function that runs before tests
 */
async function globalSetup() {
  console.log('Running global setup')

  // Ensure storage directories exist (required for both auth approaches)
  authStorageInit()

  // ========================================================================
  // STEP 1: Configure minimal auth storage settings
  // ========================================================================
  // This just sets up where tokens will be stored and debug options
  configureAuthSession({
    debug: true
  })

  // ========================================================================
  // STEP 2: Set up custom auth provider
  // ========================================================================
  // This defines HOW authentication tokens are acquired and used

  setAuthProvider(myCustomProvider)

  // Optional: pre-fetch all tokens in the beginning
  // await authGlobalInit()
}

export default globalSetup
