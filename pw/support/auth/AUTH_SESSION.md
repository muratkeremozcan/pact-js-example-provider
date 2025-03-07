# Playwright Auth Session Library

## What is this and why does it exist?

### Playwright's Built-in Authentication

Playwright provides a mechanism for saving and reusing authentication state through the [`storageState`](https://playwright.dev/docs/auth) feature. The official approach requires multiple configuration files:

#### 1a. Option A: UI Authentication in Global Setup

```typescript
// global-setup.ts
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Create browser, context, and page
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navigate to login page and authenticate
  await page.goto('https://example.com/login');
  await page.fill('#username', 'user');
  await page.fill('#password', 'pass');
  await page.click('#login-button');
  
  // Wait for login to complete
  await page.waitForURL('https://example.com/dashboard');
  
  // Save storage state to a file for reuse
  // This saves cookies, localStorage, etc.
  await page.context().storageState({ path: './playwright/.auth/user.json' });
  
  await browser.close();
}

export default globalSetup;
```

#### 1b. Option B: API Authentication in Setup File

```typescript
// tests/auth.setup.ts
import { test as setup } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ request }) => {
  // Send authentication request
  await request.post('https://example.com/api/login', {
    data: {
      username: 'user',
      password: 'password'
    }
  });
  
  // Save storage state (cookies, etc.) to a file
  await request.storageState({ path: authFile });
});
```

#### 2. Configure your Playwright tests to use the stored state

```typescript
// playwright.config.ts
import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  // For UI authentication global setup
  globalSetup: require.resolve('./global-setup'),
  projects: [
    // For API authentication
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/
    },
    {
      name: 'authenticated tests',
      // Tests depend on the setup project running first
      dependencies: ['setup'],
      use: {
        // Use the saved authentication state for all tests
        storageState: './playwright/.auth/user.json',
      },
    }
  ]
};

export default config;
```

#### 3. Write tests that use the authenticated state

```typescript
// tests/dashboard.spec.ts
import { test, expect } from '@playwright/test';

// This test automatically uses the authenticated state
test('access dashboard page', async ({ page }) => {
  // Navigate directly to a protected page without login
  await page.goto('/dashboard');
  
  // The page should be accessible because we're authenticated
  await expect(page.locator('h1')).toHaveText('Dashboard');
});
```

### Limitations of Playwright's Approach

While useful, Playwright's built-in approach has several limitations:

1. **Complex setup** - Requires configuration across multiple files and understanding of projects/dependencies
2. **Manual token management** - No built-in handling of token expiration or refreshing
3. **No multi-environment support** - No straightforward way to handle different environments (dev/staging/prod)
4. **No multi-role support** - No built-in system for managing different user roles (admin/user/guest)
5. **Limited programmatic control** - No simple API for clearing or refreshing tokens during test execution
6. **Separate implementations** - Different approaches needed for API vs UI authentication
7. **Performance bottleneck** - Relies solely on file storage, requiring disk I/O and JSON parsing for every test run, causing slowdowns in test execution

### What This Library Adds

This library directly addresses the limitations of Playwright's built-in authentication:

1. **Simplified setup** - Single configuration approach with built-in token expiration checking and programmatic refresh capabilities
2. **Structured token storage** - Organized acquisition and persistence of tokens with optional validation
3. **Multi-environment support** - First-class support for different environments (dev/staging/prod)
4. **Role-based testing** - Built-in system for managing different user roles (admin/user/guest)
5. **Rich programmatic control** - Clear APIs for managing tokens during test execution
6. **Unified implementation** - Same approach works for both API and browser testing
7. **Performance optimization** - In-memory caching eliminates repeated file reads and JSON parsing operations that slow down Playwright's approach (which reads from disk on every test)

Additional benefits:

1. **Provider architecture** - Extensible design for custom authentication flows
2. **Single source of truth** - Auth provider centralizes environment and role configuration
3. **Isolated storage** - Tokens are stored by environment and user role, preventing cross-contamination

__________

This library implements Playwright's session storage pattern for authentication, working seamlessly with both API and UI testing. It allows you to fetch an authentication token once and reuse it across multiple tests and test runs.

⚠️ **IMPORTANT**: The authentication system requires explicit configuration before use. You MUST set up authentication in your global setup file with **both** `configureAuthSession` AND `setAuthProvider`.

## Table of Contents

- [Playwright Auth Session Library](#playwright-auth-session-library)
  - [Table of Contents](#table-of-contents)
  - [Quick Start Guide](#quick-start-guide)
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
  - [Implementation Details](#implementation-details)
    - [Storage Structure](#storage-structure)
    - [CI/CD Integration](#cicd-integration)
    - [Benefits Over Manual Token Management](#benefits-over-manual-token-management)

## Quick Start Guide

1. Create a custom auth provider file (required):

```typescript
// pw/support/custom-auth-provider.ts
import { type AuthProvider } from './auth'
import * as fs from 'fs'
import * as path from 'path'

// Create a custom provider implementation
const myCustomProvider: AuthProvider = {
  // Get the current environment - single source of truth
  getEnvironment(options = {}) {
    return options.environment || process.env.TEST_ENV || 'local'
  },
  
  // Get the current user role - single source of truth
  getUserRole(options = {}) {
    return options.userRole || 'default'
  },
  
  // Get authentication token
  async getToken(request, options = {}) {
    // Use the provider's own methods for consistency
    const environment = this.getEnvironment(options)
    const userRole = this.getUserRole(options)
    
    // Basic token storage path
    const storageDir = path.resolve(
      process.cwd(),
      'pw',
      '.auth-sessions',
      environment,
      userRole
    )
    const tokenPath = path.join(storageDir, 'auth-token.json')
    
    // Check for existing token
    if (fs.existsSync(tokenPath)) {
      const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf8'))
      return tokenData.token
    }
    
    // Implement your token acquisition logic here
    // For example:
    const response = await request.post('/auth/token', {
      data: {
        username: process.env.AUTH_USERNAME,
        password: process.env.AUTH_PASSWORD
      }
    })
    
    const data = await response.json()
    const token = data.token || data.access_token
    
    // Save token to file
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true })
    }
    
    fs.writeFileSync(
      tokenPath,
      JSON.stringify({
        token,
        timestamp: new Date().toISOString()
      })
    )
    
    return token
  },
  
  // Apply token to browser context for UI tests
  async applyToBrowserContext(context, token, options = {}) {
    // Add token to browser context (cookies or localStorage)
    await context.addCookies([{
      name: 'auth-token',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true
    }])
  },
  
  // Clear token when needed
  clearToken(options = {}) {
    const environment = this.getEnvironment(options)
    const userRole = this.getUserRole(options)
    
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

export default myCustomProvider
```

2. Add this to your global setup file:

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

  // Step 2: Configure minimal auth settings (ALL PARAMETERS OPTIONAL)
  // This only sets up storage paths and debug settings
  configureAuthSession({
    // Optional: debug mode to see detailed logs
    debug: true
  })

  // Step 3: Set up your custom auth provider (REQUIRED)
  // This defines HOW authentication tokens are acquired and used
  setAuthProvider(myCustomProvider)

  // Optional: pre-fetch all tokens in the beginning
  await authGlobalInit()
}
```

3. Update your Playwright config file to use the storage state:

```typescript
// playwright.config.ts or pw/config/base.config.ts
import { defineConfig, devices } from '@playwright/test'
import { getStorageStatePath } from './support/auth'

export default defineConfig({
  // Other config options...
  
  // Required: enable global setup to initialize auth configuration
  globalSetup: './support/global-setup.ts',
  
  use: {
    // This is REQUIRED for browser-based tests to use the authenticated state
    storageState: getStorageStatePath()
  },
  
  // Other config options...
})
```

4. Create a fixture for your tests:

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
      return options.environment || config.defaultEnvironment || process.env.TEST_ENV || 'local'
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
      return options.environment || config.defaultEnvironment || process.env.TEST_ENV || 'local'
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

### CI/CD Integration

When using this authentication system in CI/CD pipelines:

1. Ensure `.auth-sessions` is **not** cached between pipeline runs unless you want to reuse tokens
2. Include `authStorageInit()` in your global setup to create required directories
3. Set environment variables for your test environment and authentication details
4. Pre-fetch tokens during global setup with `authGlobalInit()` for best performance

```yaml
# Example GitHub Actions workflow step
steps:
  - name: Run tests
    run: npm test
    env:
      TEST_ENV: ci
      AUTH_USER: ${{ secrets.CI_AUTH_USER }}
      AUTH_PASSWORD: ${{ secrets.CI_AUTH_PASSWORD }}
```

### Benefits Over Manual Token Management

1. **Reduced API Calls**: Token is fetched only once, not for every test
2. **Speed**: Tests run faster by avoiding repeated authentication requests
3. **Persistence**: Token persists between test runs
4. **Simplicity**: Tests can focus on business logic, not auth handling
5. **Works with Both API and UI Tests**: Same authentication mechanism works for both

The system is designed to be compatible with Playwright's recommended patterns for authentication in both API testing and UI testing contexts.
