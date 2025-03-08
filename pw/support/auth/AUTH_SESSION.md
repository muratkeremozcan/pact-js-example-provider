# Playwright Auth Session Library

Playwright is unopinionated by design, providing developers with powerful tools and flexible patterns while leaving the implementation details and developer experience up to you.

This library builds on Playwright's authentication capabilities to create a more structured, efficient developer experience. It implements a session-based storage pattern for authentication that works seamlessly with both API and UI testing, allowing you to fetch an authentication token once and reuse it across multiple tests and test runs.

## Table of Contents

- [Playwright Auth Session Library](#playwright-auth-session-library)
  - [Table of Contents](#table-of-contents)
  - [What is this and why does it exist?](#what-is-this-and-why-does-it-exist)
    - [Playwright's Built-in Authentication](#playwrights-built-in-authentication)
      - [Approach 1: Setup Project with Dependencies (Recommended by Playwright)](#approach-1-setup-project-with-dependencies-recommended-by-playwright)
      - [Approach 2: Global Setup Function](#approach-2-global-setup-function)
      - [3. Write tests that use the authenticated state](#3-write-tests-that-use-the-authenticated-state)
    - [Limitations of Playwright's Approach](#limitations-of-playwrights-approach)
    - [What This Library Adds](#what-this-library-adds)
  - [Quick Start Guide](#quick-start-guide)
  - [Token Management Utilities](#token-management-utilities)
  - [Basic Usage](#basic-usage)
    - [Using Authentication in API Tests](#using-authentication-in-api-tests)
    - [Clearing Tokens When Needed](#clearing-tokens-when-needed)
  - [Advanced Usage](#advanced-usage)
    - [Multi-Environment Support](#multi-environment-support)
    - [Multi-Role Support](#multi-role-support)
    - [UI Testing with Browser Context](#ui-testing-with-browser-context)
    - [Custom Authentication Provider](#custom-authentication-provider)
      - [OAuth2 Example](#oauth2-example)
      - [Token Pre-fetching](#token-pre-fetching)
    - [Testing Multiple Roles in a Single Test](#testing-multiple-roles-in-a-single-test)
    - [Parallel Testing with Worker-Specific Accounts](#parallel-testing-with-worker-specific-accounts)
    - [Session Storage Support](#session-storage-support)
    - [Resetting Authentication State](#resetting-authentication-state)
  - [Implementation Details](#implementation-details)
    - [Storage Structure](#storage-structure)

## What is this and why does it exist?

### Playwright's Built-in Authentication

Playwright provides a mechanism for saving and reusing authentication state through the [`storageState`](https://playwright.dev/docs/auth) feature. The official documentation outlines two alternative approaches:

#### Approach 1: Setup Project with Dependencies (Recommended by Playwright)

This approach uses a dedicated setup project that runs before your test projects:

<details><summary><strong>(Expand for details)</strong></summary>

1. Create an authentication setup file:

```typescript
// tests/auth.setup.ts - Authentication setup file
import { test as setup } from '@playwright/test'

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  // Navigate to login page and authenticate via UI
  await page.goto('https://example.com/login')
  await page.getByLabel('Username').fill('user')
  await page.getByLabel('Password').fill('password')
  await page.getByRole('button', { name: 'Sign in' }).click()

  // Wait until the page receives the cookies
  await page.waitForURL('https://example.com/dashboard')

  // Save storage state to a file
  await page.context().storageState({ path: authFile })
})
```

2. Configure your tests to use this authentication state:

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  projects: [
    // Setup project that runs first
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    // Test projects that use the authenticated state
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use prepared auth state
        storageState: 'playwright/.auth/user.json'
      },
      dependencies: ['setup'] // This project depends on setup project
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/user.json'
      },
      dependencies: ['setup']
    }
  ]
})
```

</details>

#### Approach 2: Global Setup Function

Alternatively, you can use a global setup function that runs once before all tests:

<details><summary><strong>(Expand for details)</strong></summary>

1. Create a global setup file:

```typescript
// global-setup.ts
import { chromium, FullConfig } from '@playwright/test'
import path from 'path'

async function globalSetup(config: FullConfig) {
  // Create browser, context, and page
  const browser = await chromium.launch()
  const page = await browser.newPage()

  // Navigate to login page and authenticate
  await page.goto('https://example.com/login')
  await page.getByLabel('Username').fill('user')
  await page.getByLabel('Password').fill('password')
  await page.getByRole('button', { name: 'Sign in' }).click()

  // Wait for login to complete
  await page.waitForURL('https://example.com/dashboard')

  // Save storage state to a file for reuse
  await page.context().storageState({
    path: path.join(process.cwd(), 'playwright/.auth/user.json')
  })

  await browser.close()
}

export default globalSetup
```

2. Reference the global setup in your configuration:

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  // Reference the global setup file
  globalSetup: './global-setup.ts',

  use: {
    // Use the saved state for all tests
    storageState: 'playwright/.auth/user.json'
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } }
  ]
})
```

</details>

#### 3. Write tests that use the authenticated state

<details><summary><strong>(Expand for details)</strong></summary>

```typescript
// tests/dashboard.spec.**ts**
import { test, expect } from '@playwright/test'

// This test automatically uses the authenticated state
test('access dashboard page', async ({ page }) => {
  // Navigate directly to a protected page without login
  await page.goto('/dashboard')

  // The page should be accessible because we're authenticated
  await expect(page.locator('h1')).toHaveText('Dashboard')
})
```

</details>

### Limitations of Playwright's Approach

While useful, Playwright's built-in approach has several limitations:

1. **Complex setup** - Requires configuration across multiple files and understanding of projects/dependencies
2. **Manual token management** - No built-in handling of token expiration or refreshing
3. **No multi-environment support** - No straightforward way to handle different environments (dev/staging/prod)
4. **No multi-role support** - No built-in system for managing different user roles (admin/user/guest)
5. **Limited programmatic control** - No simple API for clearing or refreshing tokens during test execution
6. **Separate implementations** - Different approaches needed for API vs UI authentication
7. **Performance bottleneck** - Relies solely on file storage, requiring disk I/O and JSON parsing for every test run, causing slowdowns in test execution
8. **UI Mode limitations** - UI mode doesn't run setup projects by default, requiring manual intervention to re-authenticate when tokens expire (enabling filters, running auth.setup.ts, disabling filters again)
9. **Between-run API calls** - Authentication request is made at the start of each test run session, even when a previously acquired token is still valid
10. **Manual parallel worker setup** - Requires custom fixtures and significant boilerplate code to implement worker-specific authentication for parallel testing
11. **No session storage support** - Playwright explicitly does not provide APIs to persist session storage, requiring custom scripts for apps that use this storage method

### What This Library Adds

This library directly addresses the limitations of Playwright's built-in authentication:

1. **Simplified setup** - Single configuration approach with built-in token expiration checking and programmatic refresh capabilities
2. **Structured token storage** - Organized acquisition and persistence of tokens with optional validation
3. **Multi-environment support** - First-class support for different environments (dev/staging/prod)
4. **Role-based testing** - Built-in system for managing different user roles (admin/user/guest)
5. **Rich programmatic control** - Clear APIs for managing tokens during test execution
6. **Unified implementation** - Same approach works for both API and browser testing
7. **Performance optimization** - In-memory caching eliminates repeated file reads and JSON parsing operations that slow down Playwright's approach (which reads from disk on every test)
8. **Seamless UI Mode integration** - Works with Playwright UI Mode without manual intervention; no need to enable filters, run setup projects, or re-authenticate when tokens expire
9. **Reduced API calls** - Token is fetched only once and reused across all tests, significantly reducing authentication overhead
10. **Automatic parallel worker support** - Handles worker-specific authentication without custom fixtures or boilerplate, automatically managing unique accounts per worker
11. **Complete storage support** - Automatically handles all storage types including cookies, localStorage, IndexedDB and sessionStorage without manual scripts

Additional benefits:

1. **Provider architecture** - Extensible design for custom authentication flows
2. **Single source of truth** - Auth provider centralizes environment and role configuration
3. **Isolated storage** - Tokens are stored by environment and user role, preventing cross-contamination

<details><summary><strong>More on UI mode integration:</strong></summary>

> ### More on UI mode integration:
>
> In Playwright's authentication approach, they use separate "setup projects" that run before your tests to handle authentication. The problem is that UI Mode intentionally skips these setup projects for speed. This forces you to manually authenticate by:
>
> 1. Finding and enabling the setup filter
> 2. Clicking a button to manually run the auth setup
> 3. Disabling the filter again
> 4. Repeating whenever tokens expire
>
> #### How Our Approach Is Different
>
> Our solution bakes authentication directly into the normal test flow instead of using separate setup projects:
>
> 1. **Smarter Token Management**: We store tokens in a central location that works for both normal tests and UI Mode tests.
> 2. **On-Demand Authentication**: Instead of requiring a separate setup step, each test automatically checks if it needs a token:
>    - If a valid token exists, it uses it (fast path)
>    - If no token exists or it's expired, it fetches a new one (transparent to you)
> 3. **Integrated with Test Fixtures**: Authentication is provided through fixtures that UI Mode automatically uses, so there's no separate step to enable or disable.
> 4. **Unified Storage State**: We properly configure Playwright's `storageState` so UI Mode tests automatically get the authentication state without any manual steps.
>
> Essentially, our solution treats authentication as a seamless part of the test execution instead of a separate setup step. Since it's integrated with the normal test fixtures and flow, UI Mode "just works" without any special handling.

</details>

<details><summary><strong>More on parallel worker authentication:</strong></summary>

> ### Playwright's Parallel Worker Authentication
>
> When tests run in parallel, Playwright recommends using **one unique account per worker** if your tests modify server-side data. This prevents tests from interfering with each other.
>
> #### What It Does In Simple Terms
>
> 1. **One Login Per Worker**: Instead of logging in for every test, each worker (parallel process) logs in once
> 2. **Worker-Specific Storage**: Each worker gets its own storage file to save cookies/tokens
> 3. **Unique Accounts**: Each worker uses a different account (like user1@example.com, user2@example.com, etc.)
> 4. **Persistent Worker State**: All tests running in the same worker share the same logged-in session
>
> **However, implementing this approach manually requires:**
>
> 1. **Custom fixture code**: Creating and maintaining specialized test fixtures
> 2. **File management**: Setting up the storage state directory structure
> 3. **Storage persistence**: Manually handling the storage state files
> 4. **Code duplication**: Reimplementing this pattern across projects
>
> **Our authentication library provides this worker-specific functionality automatically:**
>
> 1. We use the worker ID to generate unique storage paths
> 2. We handle the token storage and retrieval without custom fixtures
> 3. Our solution works for both browser tests and API tests with the same code
> 4. We add in-memory caching for better performance
>
> This is a key advantage of our approach - **getting the same benefits with significantly less code and complexity**.

</details>

<details><summary><strong>More on performance and simplicity benefits:</strong></summary>

> ### More on performance and simplicity benefits:
>
> Our authentication system provides significant advantages in several areas:
>
> 1. **Reduced API Calls**: Token is fetched only once and persists between separate test runs. This means:
>    - No authentication API calls when starting a new test session if token is still valid
>    - Less load on your authentication servers across development cycles
>    - Faster test execution overall, especially for multiple test runs
>    - No rate limiting issues from your auth provider
> 2. **Speed Optimization**: Tests run substantially faster by:
>    - Avoiding repeated authentication requests
>    - Utilizing in-memory caching to eliminate disk I/O
>    - Removing JSON parsing overhead for each test
> 3. **Persistence**: Token persists between test runs, enabling:
>    - Faster CI/CD pipelines
>    - Quicker local development cycles
>    - Reduced authentication server load
> 4. **Simplicity**: The API design allows tests to focus on business logic:
>    - Clean test code without authentication boilerplate
>    - Simple fixture-based access to tokens
>    - Consistent patterns across your test suite
>    - Same code works for both API and UI authentication (no separate implementations)
>    - No need for different setup approaches based on authentication method
>
> The system is designed to be compatible with Playwright's recommended patterns for authentication in both API testing and UI testing contexts while solving the performance and usability limitations of the built-in approach.

</details>

---

## Quick Start Guide

⚠️ **IMPORTANT**: The authentication system requires explicit configuration before use. You MUST set up authentication in your global setup file with **both** `configureAuthSession` AND `setAuthProvider`.

1. Add this to your global setup file:

```typescript
// pw/support/global-setup.ts
import {
  authStorageInit,
  setAuthProvider,
  configureAuthSession,
  authGlobalInit
} from './auth'

import myCustomProvider from './custom-auth-provider'

async function globalSetup() {
  // Step 1: Ensure storage directories exist
  authStorageInit()

  // Step 2: Configure minimal auth settings (REQUIRED)
  // This sets up storage paths and debug settings (ALL PARAMETERS OPTIONAL)
  configureAuthSession({
    debug: true
  })

  // Step 3: Set up your custom auth provider (REQUIRED)
  // This defines HOW authentication tokens are acquired and used
  setAuthProvider(myCustomProvider)

  // Optional: pre-fetch all tokens in the beginning for better performance
  await authGlobalInit()
}
```

2. Update your Playwright config file to use the storage state:

```typescript
// playwright.config.ts or pw/config/base.config.ts
import { defineConfig, devices } from '@playwright/test'
import { getStorageStatePath } from './support/auth'

export default defineConfig({
  // Other config options...

  // Required: enable global setup to initialize auth configuration
  globalSetup: './support/global-setup.ts',

  use: {
    // This is REQUIRED for tests to use the authenticated state
    storageState: getStorageStatePath()
  }

  // Other config options...
})
```

3. Create a custom auth provider file (required):

```typescript
// pw/support/custom-auth-provider.ts
import { type AuthProvider } from './auth'
import * as fs from 'fs'
import * as path from 'path'

// Create a custom provider implementation
const myCustomProvider: AuthProvider = {
  /**
   * Get the current environment to use
   * This is the single source of truth for environment determination
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
   * This is the single source of truth for role determination
   */
  getUserRole(options = {}) {
    // Role priority:
    // 1. Options passed directly to this method
    // 2. Environment-specific defaults
    const environment = this.getEnvironment(options)

    // You could implement environment-specific default roles
    let defaultRole = 'default'
    if (environment === 'staging') defaultRole = 'tester'
    if (environment === 'production') defaultRole = 'readonly'

    return options.userRole || process.env.TEST_USER_ROLE || defaultRole
  },

  /**
   * Get authentication token using your implementation
   * This is the main customization point of the auth provider
   */
  async getToken(request, options = {}) {
    // Always use the provider's own methods to ensure consistency
    const environment = this.getEnvironment(options)
    const userRole = this.getUserRole(options)

    // Store tokens in the standard directory structure
    const storageDir = path.resolve(
      process.cwd(),
      'pw',
      '.auth-sessions',
      environment,
      userRole
    )
    const tokenPath = path.join(storageDir, 'auth-token.json')

    // Check if we already have a valid token
    if (fs.existsSync(tokenPath)) {
      const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf8'))

      // Optional: Add token expiration checks
      // if (tokenData.expiresAt && new Date(tokenData.expiresAt) < new Date()) {
      //   console.log('Token expired, will fetch a new one')
      // } else {
      //   return tokenData.token
      // }

      return tokenData.token
    }

    // Implement your token acquisition logic here
    // This is the main part you'll customize based on your auth system
    console.log(`Fetching new token for ${environment}/${userRole}`)

    // Example: Username/password authentication
    const response = await request.post('/auth/token', {
      data: {
        username: process.env.AUTH_USERNAME || 'test@example.com',
        password: process.env.AUTH_PASSWORD || 'password123'
      }
    })

    // Extract token from response based on your API format
    const data = await response.json()
    const token = data.access_token || data.token || data.accessToken

    // Ensure the storage directory exists
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true })
    }

    // Save token with metadata
    fs.writeFileSync(
      tokenPath,
      JSON.stringify(
        {
          token,
          timestamp: new Date().toISOString()
          // Optional: Add expiration if known
          // expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
        },
        null,
        2
      )
    )

    return token
  },

  /**
   * Apply token to browser context for UI testing
   * This method bridges API tokens to browser-based tests
   */
  async applyToBrowserContext(context, token, options = {}) {
    // Get environment for domain configuration
    const environment = this.getEnvironment(options)

    // Set domain based on environment
    const domain =
      environment === 'local' ? 'localhost' : `${environment}.example.com`

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

    // Example: Set localStorage as an alternative authentication method
    await context.addInitScript(`
      localStorage.setItem('token', '${token}');
      console.log('Set token in localStorage');
    `)

    // Additional options you could implement:
    // - Set session storage values
    // - Set default headers for fetch requests
    // - Run authentication-related scripts
  },

  /**
   * Clear token when needed
   * Used for re-authentication scenarios or cleanup
   */
  clearToken(options = {}) {
    // Always use provider methods for consistency
    const environment = this.getEnvironment(options)
    const userRole = this.getUserRole(options)

    // Use the same path structure as in getToken
    const storageDir = path.resolve(
      process.cwd(),
      'pw',
      '.auth-sessions',
      environment,
      userRole
    )
    const tokenPath = path.join(storageDir, 'auth-token.json')

    // Remove the token file if it exists
    if (fs.existsSync(tokenPath)) {
      console.log(`Clearing token at ${tokenPath}`)
      fs.unlinkSync(tokenPath)
    }
  }
}

export default myCustomProvider
```

3. Create a fixture for your tests:

```typescript
// fixtures/auth-fixture.ts

import { test as base } from '@playwright/test'
import {
  createAuthFixtures,
  type AuthOptions,
  type AuthFixtures
} from '../auth'

// Default auth options - empty object as environment and userRole
// are now handled by the auth provider
const defaultAuthOptions: AuthOptions = {}

// Get the fixtures from the factory function
const fixtures = createAuthFixtures()

// Export the test object with auth fixtures
export const test = base.extend<AuthFixtures>({
  // For authOptions, we need to define it directly using the Playwright array format
  authOptions: [defaultAuthOptions, { option: true }],

  // Use the other fixtures directly
  authToken: fixtures.authToken,
  context: fixtures.context,
  page: fixtures.page
})
```

3. Use the token in your tests:

```typescript
// Example test
import { test } from '../fixtures/auth-fixture'

test('authenticated request', async ({ authToken, request }) => {
  const response = await request.get('/api/protected', {
    headers: { Authorization: `Bearer ${authToken}` }
  })

  expect(response.status()).toBe(200)
})
```

## Token Management Utilities

The auth library provides utility functions for handling token storage and retrieval. These functions are available through the core API and can simplify custom auth provider implementations:

```typescript
import {
  loadTokenFromStorage,
  saveTokenToStorage,
  getTokenFilePath
} from './auth/core'

// Load a token from storage
const token = loadTokenFromStorage('/path/to/token.json', true) // Second parameter enables debug logging

// Save a token with metadata
saveTokenToStorage(
  '/path/to/token.json',
  'your-token-string',
  { environment: 'staging', userRole: 'admin' }, // Optional metadata
  true // Enable debug logging
)

// Get standardized token file path
const tokenPath = getTokenFilePath({
  environment: 'staging',
  userRole: 'admin',
  tokenFileName: 'custom-token.json' // Optional custom filename
})
```

These utilities follow the TypeScript best practices of functional programming and DRY principles, helping to reduce duplication in custom auth provider implementations.

## Basic Usage

### Using Authentication in API Tests

Once you've configured the auth session and created the fixture, using the token in your tests is straightforward:

```typescript
test('fetch protected data', async ({ authToken, request }) => {
  // Use the token in an API request
  const response = await request.get('/api/protected-data', {
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  })

  expect(response.status()).toBe(200)
})
```

The `authToken` is automatically retrieved from storage or fetched from your API if needed.

### Clearing Tokens When Needed

In some scenarios, you may want to force a new token to be fetched:

```typescript
import { clearAuthToken } from '../support/auth'

test('after clearing token', async ({ request }) => {
  // Clear the token to force a new fetch
  clearAuthToken()

  // Next request will fetch a new token
  // ...
})
```

## Advanced Usage

### Multi-Environment Support

The auth system supports different testing environments through appropriate provider configuration:

```typescript
// global-setup.ts
import { authStorageInit, configureAuthSession, setAuthProvider } from './auth'
import { createMultiEnvAuthProvider } from './auth-provider-factory'

async function globalSetup() {
  // Step 1: Set up storage paths
  authStorageInit()

  // Step 2: Configure minimal auth settings (ALL PARAMETERS OPTIONAL)
  // Note: Environment and userRole are now managed by the auth provider
  // configureAuthSession is only used for debug settings
  configureAuthSession({
    debug: true
  })

  // Step 3: Create environment-aware provider (THIS IS WHERE ENV LOGIC BELONGS)
  // The environment-specific behavior should be defined in the provider
  const authProvider = createMultiEnvAuthProvider({
    // The current environment can be determined at runtime
    currentEnvironment: process.env.TEST_ENV || 'local',

    // Define configuration for each environment
    environments: {
      local: {
        baseUrl: 'http://localhost:3000',
        tokenEndpoint: '/auth/token'
      },
      staging: {
        baseUrl: 'https://staging-api.example.com',
        tokenEndpoint: '/api/auth/login'
      },
      production: {
        baseUrl: 'https://api.example.com',
        tokenEndpoint: '/api/v2/auth/token'
      }
    }
  })

  // Step 4: Set the auth provider (REQUIRED)
  setAuthProvider(authProvider)
}
```

A simple implementation of the multi-environment auth provider factory:

```typescript
// auth-provider-factory.ts
import * as path from 'path'
import * as fs from 'fs'
import { AuthProvider } from './auth'

export function createMultiEnvAuthProvider(config: {
  environments: Record<string, { baseUrl: string; tokenEndpoint: string }>
  defaultEnvironment?: string
}): AuthProvider {
  return {
    // Get the current environment - single source of truth
    getEnvironment(options = {}) {
      return (
        options.environment ||
        config.defaultEnvironment ||
        process.env.TEST_ENV ||
        'local'
      )
    },

    // Get the current user role - single source of truth
    getUserRole(options = {}) {
      return options.userRole || 'default'
    },

    async getToken(request, options = {}) {
      // Use the provider's own methods instead of direct options access
      const environment = this.getEnvironment(options)
      const userRole = this.getUserRole(options)

      // Get environment-specific config
      const envConfig =
        config.environments[environment] || config.environments.local

      // Store tokens in environment-specific directories
      const storageDir = path.resolve(
        process.cwd(),
        'pw',
        '.auth-sessions',
        environment,
        userRole
      )
      const tokenPath = path.join(storageDir, 'auth-token.json')

      // Check for existing token in environment-specific path
      if (fs.existsSync(tokenPath)) {
        const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf8'))
        // TODO: Add token validation/expiration check here if needed
        return tokenData.token
      }

      // Get token from environment-specific endpoint
      const response = await request.get(
        `${envConfig.baseUrl}${envConfig.tokenEndpoint}`,
        {
          headers: { 'Content-Type': 'application/json' }
        }
      )
      const data = await response.json()

      // Save token with environment info
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true })
      }

      fs.writeFileSync(
        tokenPath,
        JSON.stringify({
          token: data.token || data.access_token,
          environment,
          timestamp: new Date().toISOString()
        })
      )

      return data.token || data.access_token
    },

    // Other required methods
    async applyToBrowserContext(context, token, options) {
      // Use the provider's own methods for consistency
      const environment = this.getEnvironment(options)

      // Set cookies or localStorage based on environment
      await context.addCookies([
        {
          name: 'auth-token',
          value: token,
          domain: environment === 'local' ? 'localhost' : `.example.com`,
          path: '/',
          httpOnly: true,
          secure: environment !== 'local',
          sameSite: 'Lax'
        }
      ])
    },

    clearToken(options) {
      const environment = options.environment || 'local'
      const userRole = options.userRole || 'default'
      const tokenPath = path.resolve(
        process.cwd(),
        'pw',
        '.auth-sessions',
        environment,
        userRole,
        'auth-token.json'
      )
      if (fs.existsSync(tokenPath)) {
        fs.unlinkSync(tokenPath)
      }
    }
  }
}
```

Usage in tests:

```typescript
// Environment-specific test
test('staging-specific test', async ({ request }) => {
  // Pass environment override to getAuthToken
  const token = await getAuthToken(request, { environment: 'staging' })

  // Use the token with staging environment APIs
  const response = await request.get('https://staging-api.example.com/data', {
    headers: { Authorization: `Bearer ${token}` }
  })

  expect(response.ok()).toBeTruthy()
})
```

### Multi-Role Support

Supporting different user roles is simple with our architecture by implementing the right auth provider:

```typescript
// global-setup.ts
import { authStorageInit, configureAuthSession, setAuthProvider } from './auth'
import { createMultiRoleAuthProvider } from './auth-provider-factory'

async function globalSetup() {
  // Step 1: Initialize storage
  authStorageInit()

  // Step 2: Configure minimal auth settings (ALL PARAMETERS OPTIONAL)
  // Note: userRole in configureAuthSession is only used for storage path organization
  // and defaults to 'default' if not specified
  configureAuthSession({
    debug: true
    // The userRole parameter here only affects storage paths and is NOT used for
    // determining which credentials to use - that's handled by the provider
  })

  // Step 3: Create role-based auth provider (THIS IS WHERE ROLE LOGIC BELONGS)
  // The role-specific authentication behavior should be defined in the provider
  const authProvider = createMultiRoleAuthProvider({
    // Default role to use if not specified in getAuthToken options
    defaultRole: 'user',

    // Define configuration for each role
    roles: {
      admin: {
        credentials: {
          username: process.env.ADMIN_USERNAME || 'admin',
          password: process.env.ADMIN_PASSWORD || 'admin-password'
        },
        endpoint: '/auth/admin-token'
      },
      user: {
        credentials: {
          username: process.env.USER_USERNAME || 'user',
          password: process.env.USER_PASSWORD || 'user-password'
        },
        endpoint: '/auth/token'
      },
      guest: {
        credentials: {
          username: 'guest',
          password: 'guest-password'
        },
        endpoint: '/auth/guest-token'
      }
    }
  })

  // Step 4: Set the auth provider (REQUIRED)
  setAuthProvider(authProvider)
}
```

A simple implementation of the multi-role auth provider factory:

```typescript
// auth-provider-factory.ts
import * as path from 'path'
import * as fs from 'fs'
import { AuthProvider } from './auth'

export function createMultiRoleAuthProvider(config: {
  roles: Record<
    string,
    {
      credentials: Record<string, string>
      endpoint: string
    }
  >
  defaultRole?: string
}): AuthProvider {
  return {
    // Get the current environment - single source of truth
    getEnvironment(options = {}) {
      return options.environment || process.env.TEST_ENV || 'local'
    },

    // Get the current user role - single source of truth
    getUserRole(options = {}) {
      return options.userRole || config.defaultRole || 'default'
    },

    async getToken(request, options = {}) {
      // Use the provider's own methods instead of direct options access
      const environment = this.getEnvironment(options)
      const userRole = this.getUserRole(options)

      // Get role-specific config
      const roleConfig =
        config.roles[userRole] || config.roles.user || config.roles.default

      // Store tokens in role-specific directories
      const storageDir = path.resolve(
        process.cwd(),
        'pw',
        '.auth-sessions',
        environment,
        userRole
      )
      const tokenPath = path.join(storageDir, 'auth-token.json')

      // Check for existing token for this role
      if (fs.existsSync(tokenPath)) {
        const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf8'))
        // TODO: Add token validation/expiration check here if needed
        return tokenData.token
      }

      // Get token with role-specific credentials and endpoint
      const baseUrl = `http://localhost:${process.env.PORT || 3000}`
      const response = await request.post(`${baseUrl}${roleConfig.endpoint}`, {
        data: roleConfig.credentials,
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      // Save token with role info
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true })
      }

      fs.writeFileSync(
        tokenPath,
        JSON.stringify({
          token: data.token || data.access_token,
          userRole,
          timestamp: new Date().toISOString()
        })
      )

      return data.token || data.access_token
    },

    // Implement other required methods...
    async applyToBrowserContext(context, token, options) {
      await context.addCookies([
        {
          name: 'auth-token',
          value: token,
          domain: 'localhost',
          path: '/',
          httpOnly: true
        }
      ])
    },

    clearToken(options) {
      const environment = options.environment || 'local'
      const userRole = options.userRole || 'default'
      const tokenPath = path.resolve(
        process.cwd(),
        'pw',
        '.auth-sessions',
        environment,
        userRole,
        'auth-token.json'
      )
      if (fs.existsSync(tokenPath)) {
        fs.unlinkSync(tokenPath)
      }
    }
  }
}
```

Create role-specific test fixtures:

```typescript
// fixtures/role-fixtures.ts
import { test as base } from '@playwright/test'
import { getAuthToken } from '../auth'

// Admin fixture
export const adminTest = base.extend({
  authToken: async ({ request }, use) => {
    const token = await getAuthToken(request, { userRole: 'admin' })
    await use(token)
  }
})

// Regular user fixture
export const userTest = base.extend({
  authToken: async ({ request }, use) => {
    const token = await getAuthToken(request, { userRole: 'user' })
    await use(token)
  }
})

// Guest fixture
export const guestTest = base.extend({
  authToken: async ({ request }, use) => {
    const token = await getAuthToken(request, { userRole: 'guest' })
    await use(token)
  }
})
```

Usage in tests:

```typescript
// Use admin fixture for admin-only tests
import { adminTest } from '../fixtures/role-fixtures'

adminTest('admin can access settings', async ({ authToken, request }) => {
  // This uses the admin token
  const response = await request.get('/api/admin/settings', {
    headers: { Authorization: `Bearer ${authToken}` }
  })

  expect(response.ok()).toBeTruthy()
})

// Use user fixture for user-only tests
import { userTest } from '../fixtures/role-fixtures'

userTest('regular user profile access', async ({ authToken, request }) => {
  // This uses the user token
  const response = await request.get('/api/profile', {
    headers: { Authorization: `Bearer ${authToken}` }
  })

  expect(response.ok()).toBeTruthy()
})
```

### UI Testing with Browser Context

Apply the auth token to browser contexts for UI testing by leveraging the auth provider's `applyToBrowserContext` method:

```typescript
// ui-auth-fixture.ts
import { test as base } from '@playwright/test'
import { getAuthToken, applyAuthToBrowserContext } from '../support/auth'

export const test = base.extend({
  // Setup authenticated context
  context: async ({ browser, request }, use) => {
    // Get a token from the configured auth provider
    const token = await getAuthToken(request)

    // Create a new context
    const context = await browser.newContext()

    // Apply the token to the context using the configured auth provider
    await applyAuthToBrowserContext(context, token)

    // Use the authenticated context
    await use(context)

    // Clean up
    await context.close()
  }
})
```

This works seamlessly because the `applyAuthToBrowserContext` function uses the same auth provider configured in your global setup.

### Custom Authentication Provider

To customize authentication, you need to create a custom auth provider and configure it using `setAuthProvider`. Here's how to create a custom provider for different authentication schemes:

#### OAuth2 Example

```typescript
// oauth-auth-provider.ts
import * as fs from 'fs'
import * as path from 'path'
import { AuthProvider } from './auth/internal/auth-provider'

export function createOAuth2Provider(config: {
  clientId: string
  clientSecret: string
  tokenUrl: string
  scope?: string
  defaultEnvironment?: string
}): AuthProvider {
  return {
    // Get the current environment - single source of truth
    getEnvironment(options = {}) {
      return (
        options.environment ||
        config.defaultEnvironment ||
        process.env.TEST_ENV ||
        'local'
      )
    },

    // Get the current user role - single source of truth
    getUserRole(options = {}) {
      return options.userRole || 'default'
    },

    async getToken(request, options = {}) {
      // Use the provider's own methods instead of direct options access
      const environment = this.getEnvironment(options)
      const userRole = this.getUserRole(options)

      // Determine storage path
      const storageDir = path.resolve(
        process.cwd(),
        'pw',
        '.auth-sessions',
        environment,
        userRole
      )
      const tokenPath = path.join(storageDir, 'oauth-token.json')

      // Check for existing valid token
      if (fs.existsSync(tokenPath)) {
        const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf8'))
        if (tokenData.expiresAt && tokenData.expiresAt > Date.now()) {
          return tokenData.accessToken
        }
      }

      // Request a new token
      const response = await request.post(config.tokenUrl, {
        form: {
          grant_type: 'client_credentials',
          client_id: config.clientId,
          client_secret: config.clientSecret,
          scope: config.scope || ''
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      const data = await response.json()

      // Calculate expiration
      const expiresAt = Date.now() + (data.expires_in * 1000 || 3600000) // Default to 1 hour

      // Save token
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true })
      }

      fs.writeFileSync(
        tokenPath,
        JSON.stringify({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          tokenType: data.token_type || 'Bearer',
          expiresAt,
          scope: data.scope,
          environment,
          userRole,
          timestamp: new Date().toISOString()
        })
      )

      return data.access_token
    },

    async applyToBrowserContext(context, token, options = {}) {
      // Add token as an authorization header cookie
      await context.addCookies([
        {
          name: 'authorization',
          value: `Bearer ${token}`,
          domain:
            options.environment === 'local' ? 'localhost' : '.example.com',
          path: '/',
          httpOnly: true,
          secure: options.environment !== 'local',
          sameSite: 'Lax'
        }
      ])

      // Alternative: Store token in localStorage
      await context.addInitScript((token) => {
        window.localStorage.setItem('oauth_token', token)
      }, token)
    },

    clearToken(options = {}) {
      const environment = options.environment || 'local'
      const userRole = options.userRole || 'default'
      const tokenPath = path.resolve(
        process.cwd(),
        'pw',
        '.auth-sessions',
        environment,
        userRole,
        'oauth-token.json'
      )
      if (fs.existsSync(tokenPath)) {
        fs.unlinkSync(tokenPath)
      }
    }
  }
}
```

Configuring your OAuth2 provider:

```typescript
// global-setup.ts
import {
  authStorageInit,
  configureAuthSession,
  setAuthProvider,
  authGlobalInit
} from './auth'
import { createOAuth2Provider } from './oauth-auth-provider'

async function globalSetup() {
  // Step 1: Initialize storage (REQUIRED)
  authStorageInit()

  // Step 2: Configure minimal auth settings (ALL PARAMETERS OPTIONAL)
  configureAuthSession({
    // Only debug is needed here - everything else has defaults
    debug: true
  })

  // Step 3: Create OAuth2 provider with all necessary config (REQUIRED)
  const authProvider = createOAuth2Provider({
    // All OAuth2 specific configuration goes in the provider
    clientId: process.env.OAUTH_CLIENT_ID || 'client-id',
    clientSecret: process.env.OAUTH_CLIENT_SECRET || 'client-secret',
    tokenUrl:
      process.env.OAUTH_TOKEN_URL || 'http://localhost:3000/oauth/token',
    scope: 'read write'
  })

  // Step 4: Set the auth provider (REQUIRED)
  setAuthProvider(authProvider)

  // Optional: Pre-fetch tokens
  await authGlobalInit()
}

export default globalSetup
```

#### Token Pre-fetching

For improved test performance, pre-fetch tokens during global setup:

```typescript
// global-setup.ts
import {
  authStorageInit,
  configureAuthSession,
  setAuthProvider,
  authGlobalInit
} from './auth'
import myCustomProvider from './custom-auth-provider'

async function globalSetup() {
  // Initialize storage
  authStorageInit()

  // Configure basic settings
  configureAuthSession({
    environment: process.env.TEST_ENV || 'local',
    userRole: 'default',
    debug: true
  })

  // Set the auth provider
  setAuthProvider(myCustomProvider)

  // Pre-fetch tokens for all configured environments and roles
  // This happens once before all tests run
  await authGlobalInit()
}

export default globalSetup
```

### Testing Multiple Roles in a Single Test

Sometimes you need to test how different user roles interact with each other. Our authentication library makes this easy by allowing you to explicitly request tokens for different roles within the same test:

```typescript
// example of testing multiple roles in a single test
import { test, expect } from '../support/fixtures'
import { chromium } from '@playwright/test'

test('admin and regular user interaction', async ({ page, request }) => {
  // Get tokens for different roles
  const adminToken = await test.step('Get admin token', async () => {
    return getAuthToken(request, { userRole: 'admin' })
  })

  const userToken = await test.step('Get user token', async () => {
    return getAuthToken(request, { userRole: 'user' })
  })

  // Use tokens for API requests
  const adminResponse = await request.get('/api/admin-only-resource', {
    headers: { Authorization: `Bearer ${adminToken}` }
  })
  expect(adminResponse.ok()).toBeTruthy()

  const userResponse = await request.get('/api/user-resource', {
    headers: { Authorization: `Bearer ${userToken}` }
  })
  expect(userResponse.ok()).toBeTruthy()

  // For browser testing, you can create multiple contexts
  const browser = await chromium.launch()

  // Admin browser context
  const adminContext = await browser.newContext()
  await applyAuthToContext(adminContext, { userRole: 'admin' })
  const adminPage = await adminContext.newPage()

  // User browser context
  const userContext = await browser.newContext()
  await applyAuthToContext(userContext, { userRole: 'user' })
  const userPage = await userContext.newPage()

  // Now you can interact with both contexts
  await adminPage.goto('/admin-dashboard')
  await userPage.goto('/user-profile')

  // Test interactions between the two roles
  // ...

  // Clean up
  await adminContext.close()
  await userContext.close()
  await browser.close()
})
```

This approach is much simpler than Playwright's built-in solution because:

1. **No manual storage state files** - Our library manages token storage automatically
2. **Consistent API** - Same approach works for both API and UI testing
3. **Type safety** - All functions have proper TypeScript types
4. **Explicit role naming** - Uses semantic role names instead of file paths

You can easily extend this pattern to create Page Object Models with role-specific authentication already applied.

### Parallel Testing with Worker-Specific Accounts

Playwright recommends using one account per parallel worker for tests that modify server-side state. Our authentication system naturally supports this pattern through its environment and role isolation:

```typescript
// pw/support/custom-auth-provider.ts with worker-specific accounts
import { test } from '@playwright/test'

const myCustomProvider = {
  // Use parallelIndex to determine the user role
  getUserRole(options = {}) {
    // If a specific role is requested, use it; otherwise, use the worker index
    if (options.userRole) {
      return options.userRole
    }

    // Get the worker's parallel index (or default to 0 if not available)
    const workerIndex = test.info().parallelIndex ?? 0
    return `worker-${workerIndex}`
  },

  // Get token based on the worker-specific role
  async getToken(request, options = {}) {
    const userRole = this.getUserRole(options)

    // This will automatically use a separate token file for each worker
    // The rest of the implementation remains the same

    // When fetching a token, you can use different credentials per worker:
    const accounts = [
      { username: 'worker0@example.com', password: 'pass0' },
      { username: 'worker1@example.com', password: 'pass1' }
      // Add more accounts as needed for your parallel workers
    ]

    // Extract the worker number from the role
    const workerNumber = parseInt(userRole.replace('worker-', '')) || 0
    const account = accounts[workerNumber % accounts.length]

    // Use the worker-specific account for authentication
    const response = await request.post('/auth/token', {
      data: {
        username: account.username,
        password: account.password
      }
    })

    // Process and return the token...
  }
}
```

With this approach:

1. Each worker automatically gets its own storage file based on the worker index
2. No special fixtures or config changes are needed - it's handled by our provider architecture
3. Tests in the same worker reuse the authentication state
4. Different workers use different accounts

This implementation is more elegant than Playwright's approach because:

- No need to create separate per-worker fixtures
- No manual management of storage state files
- The provider architecture handles all the complexity
- The same approach works in both UI Mode and normal test mode

### Session Storage Support

Playwright explicitly does not provide APIs to persist session storage, requiring custom scripts for applications that use this storage method. From the Playwright documentation:

> "Session storage is specific to a particular domain and is not persisted across page loads. Playwright does not provide API to persist session storage. However, you can use an init script to implement a custom mechanism to persist session storage."

Our authentication library handles session storage automatically through the `AuthSessionManager`. When a browser context is authenticated, we apply both the standard storage state (which includes cookies, localStorage, and IndexedDB) and also initialize session storage with saved values using an initialization script.

```typescript
// How we handle session storage in applyAuthToContext
async applyAuthToContext(context, options) {
  // First, apply the standard storage state (cookies, localStorage, IndexedDB)
  await context.storageState({ path: this.getStorageStatePath(options) });

  // Then, if we have session storage data, apply it via an initialization script
  const sessionStoragePath = this.getSessionStoragePath(options);
  if (fs.existsSync(sessionStoragePath)) {
    try {
      const sessionStorage = JSON.parse(fs.readFileSync(sessionStoragePath, 'utf-8'));

      // Add initialization script to set session storage
      await context.addInitScript(storage => {
        for (const [key, value] of Object.entries(storage)) {
          window.sessionStorage.setItem(key, value);
        }
      }, sessionStorage);

    } catch (error) {
      console.error('Error applying session storage:', error);
    }
  }
}

// We also capture session storage during token acquisition
async getToken(page) {
  // ... normal authentication logic ...

  // Capture and store session storage
  const sessionStorage = await page.evaluate(() => {
    const data = {};
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i);
      data[key] = window.sessionStorage.getItem(key);
    }
    return data;
  });

  fs.writeFileSync(
    this.getSessionStoragePath(options),
    JSON.stringify(sessionStorage),
    'utf-8'
  );
}
```

This approach ensures that all web storage mechanisms are properly persisted and restored, not just the ones that Playwright handles natively.

### Resetting Authentication State

Playwright's documentation shows this approach for avoiding authentication:

```typescript
// Playwright's approach - Reset storage state for specific tests

// Method 1: Use empty storage state for a specific test
test('not signed in test', async ({ browser }) => {
  // Create a new context with no storage state (i.e., no authentication)
  const context = await browser.newContext()
  const page = await context.newPage()
  // Test runs without any authentication state
  await context.close()
})

// Method 2: Use empty storage state for a group of tests
test.describe('unauthenticated tests', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('not signed in test', async ({ page }) => {
    // Test runs without any authentication state
  })
})
```

Our library offers more flexibility and control:

```typescript
// Our approach - Option 1: Clear specific token
test('test with cleared token', async ({ request }) => {
  // Clear just the token for the current environment/role
  clearAuthToken()

  // OR clear for specific environment/role
  clearAuthToken({ environment: 'staging', userRole: 'admin' })

  // Now make unauthenticated requests
  const response = await request.get('/api/public-resource')
})

// Our approach - Option 2: For browser tests, test-level config
test.describe('unauthenticated browser tests', () => {
  // Skip the auth fixture for this group
  test.useOptions({ auth: false })

  test('unauthenticated test', async ({ page }) => {
    // Page will load without authentication
  })
})
```

**Advantages over Playwright's approach:**

1. **Granular control** - Clear specific tokens instead of all storage state
2. **Environment/role awareness** - Target specific test configurations
3. **API + UI flexibility** - Works for both API and browser tests
4. **Runtime control** - Clear tokens during test execution, not just at setup
5. **Multiple modes** - Test both authenticated and unauthenticated states in the same file

This makes it much easier to test complex authentication scenarios like authenticated session timeouts, partial authentication, or mixed authenticated/unauthenticated user journeys.

## Implementation Details

The authentication system uses a modular design pattern consisting of several key components:

1. **Storage Management**: Tokens are stored in JSON files in the `.auth-sessions` directory, organized by environment and user role.

2. **Auth Provider Interface**: Defines a contract for authentication providers with methods for token acquisition, browser context application, and token clearing.

3. **Session Management**: Implements token storage, retrieval, and application to API requests and browser contexts.

4. **Configuration**: Manages global authentication settings.

### Storage Structure

Tokens are stored in a structured hierarchy:

```
pw/.auth-sessions/               # Base storage directory (gitignored)
├── local/                       # Environment name
│   ├── default/                 # User role
│   │   ├── auth-token.json     # Token data file
│   │   └── storage-state.json  # Browser storage state
│   ├── admin/                  # Another role
│   │   ├── auth-token.json
│   │   └── storage-state.json
│   └── user/                   # Another role
│       ├── auth-token.json
│       └── storage-state.json
└── staging/                    # Another environment
    └── ...
```

This structure enables isolated storage for different environments and user roles.
