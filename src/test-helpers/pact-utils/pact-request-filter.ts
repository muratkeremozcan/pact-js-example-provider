import type { ProxyOptions } from '@pact-foundation/pact/src/dsl/verifier/proxy/types'

/* 
why? read https://dev.to/muratkeremozcan/building-custom-request-filters-for-pactjs-verifications-in-express-and-non-express-environments-4b5e
TL,DR;
This setup allows Pact tests to handle authorization tokens flexibly,
ensuring they’re present in HTTP requests for both Express and non-Express environments. 

The higher-order function pattern and handleExpressEnv function provide compatibility with Pact's request expectations,
letting the same code seamlessly support Express-style middleware (next() function) and other environments, 
like Lambda, where middleware may not be used. 

This design also permits custom token generation, a feature for tests needing dynamic tokens w
without persisting them in Pact files.
*/

// generic HttpRequest structure to accommodate both Express and non-Express environments
type HttpRequest = {
  headers: Record<string, string | string[] | undefined>
  body?: unknown
}

type NextFunction = () => void | undefined

// allows customization of token generation logic
type RequestFilterOptions = {
  tokenGenerator?: () => string
}

/**
 * Handles environments with and without Express-like `next()` middleware.
 * If `next()` is present, it will call it; otherwise, it returns the modified request.
 * @param {HttpRequest} req - The incoming HTTP request object.
 * @param {NextFunction} next - The Express-style `next()` function, if available.
 * @returns {HttpRequest | undefined} - The modified request or undefined if `next()` was called. */
const handleExpressEnv = (
  req: HttpRequest,
  next: NextFunction
): HttpRequest | undefined => {
  // If this is an Express environment, call next()
  if (next && typeof next === 'function') {
    next()
  } else {
    // In a non-Express environment, return the modified request
    return req
  }
}

/**
 * Creates a request filter function that adds an Authorization header if not present.
 * The function is designed as a higher-order function to allow for customization of token generation
 * and also to fulfill Pact's express-like type requirements of handling three arguments : `req`, `res`, and `next`.
 *
 * @param {RequestFilterOptions} [options] - Options to customize the token generation logic.
 * @returns {ProxyOptions['requestFilter']} - A request filter that adds Authorization header. */
const createRequestFilter =
  (options?: RequestFilterOptions): ProxyOptions['requestFilter'] =>
  (req, _, next) => {
    const defaultTokenGenerator = () => new Date().toISOString()
    const tokenGenerator = options?.tokenGenerator || defaultTokenGenerator

    // add an authorization header if not present
    if (!req.headers['Authorization']) {
      req.headers['Authorization'] = `Bearer ${tokenGenerator()}`
    }

    return handleExpressEnv(req, next)
  }

// if you have a token generator, pass it as an option
// createRequestFilter({ tokenGenerator: myCustomTokenGenerator })
export const requestFilter = createRequestFilter()

export const noOpRequestFilter: ProxyOptions['requestFilter'] = (
  req,
  _,
  next
) => handleExpressEnv(req, next)
