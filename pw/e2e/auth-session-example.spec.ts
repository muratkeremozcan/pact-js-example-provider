import { clearAuthToken } from '../support/auth'
import { test, expect } from '../support/fixtures'

/**
 * This test demonstrates how auth sessions work:
 * - The first test gets a token using the authToken fixture
 * - The second test reuses the same token without making another request
 * - The session is preserved across test runs as well
 */
test.describe('Auth Session Example', () => {
  // This test just demonstrates that we get a token
  test('should have auth token available', async ({ authToken }) => {
    // Token is already obtained via the fixture
    expect(authToken).toBeDefined()
    expect(typeof authToken).toBe('string')
    expect(authToken.length).toBeGreaterThan(0)

    console.log('Token is available in first test without explicit fetching')
  })

  // This test will reuse the same token without making another request
  test('should reuse the same auth token', async ({
    authToken,
    apiRequest
  }) => {
    // The token is already available without making a new request
    expect(authToken).toBeDefined()
    expect(typeof authToken).toBe('string')

    // We can use the token for API requests
    const { status } = await apiRequest({
      method: 'GET',
      url: '/movies',
      headers: {
        Authorization: authToken // Use the token directly as the CRUD helpers do
      }
    })

    expect(status).toBe(200)
    console.log('Second test reuses the same token without fetching it again')
  })

  // This test demonstrates how to manually clear the token
  test('can manually clear the token if needed', async () => {
    // Clear the token - this will cause the next test to fetch a new one
    clearAuthToken()
    console.log('Token cleared - next test will fetch a new one')
  })
})
