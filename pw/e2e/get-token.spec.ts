import { test, expect } from '../support/fixtures'

test.describe('token acquisition', () => {
  test('should get a token', async ({ request }) => {
    const tokenRes = await request.get('/auth/fake-token')
    const tokenResBody = await tokenRes.json()
    const tokenResStatus = await tokenRes.status()
    const token = tokenResBody.token

    expect(tokenResStatus).toBe(200)
    expect(token).toEqual(expect.any(String))
  })

  test('should get a token with helper', async ({ apiRequest }) => {
    const {
      body: { token },
      status
    } = await apiRequest<{ token: string }>({
      method: 'GET',
      url: '/auth/fake-token'
    })

    expect(status).toBe(200)
    expect(token).toEqual(expect.any(String))
  })
})
