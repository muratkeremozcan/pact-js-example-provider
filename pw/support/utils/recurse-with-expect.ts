/**
 * Retries an asynchronous function with specified options until it succeeds or the retries/timeout are exhausted.
 *
 * This function attempts to execute the provided asynchronous function `fn`. If `fn` throws an error, it will retry
 * executing `fn` after waiting for a specified interval. The function continues to retry until either:
 * - The function succeeds (`fn` resolves), or
 * - The number of retries is exhausted, or
 * - The total timeout duration is exceeded.
 *
 * After exhausting all retries and before the timeout is reached, a final attempt is made to execute `fn`.
 *
 * @async
 * @function recurseWithExpect
 *
 * @param {() => Promise<void>} fn - The asynchronous function to be executed and potentially retried.
 *
 * @param {Object} [options] - Configuration options for retry behavior.
 * @param {number} [options.retries=10] - The maximum number of retry attempts. Defaults to 10.
 * @param {number} [options.interval=500] - The delay between retries in milliseconds. Defaults to 500ms.
 * @param {number} [options.timeout=10000] - The maximum total time to keep retrying in milliseconds. Defaults to 10,000ms (10 seconds).
 *
 * @returns {Promise<void>} - Resolves when `fn` executes successfully. Rejects if all attempts fail.
 *
 * @throws {Error} - Throws the last encountered error if all retry attempts fail.
 *
 * @example
 * ```typescript
 * async function fetchData() {
 *   // Some asynchronous operation, e.g., fetching data from an API
 * }
 *
 * try {
 *   await recurseWithExpect(fetchData, { retries: 5, interval: 1000, timeout: 5000 });
 *   console.log("Operation succeeded.");
 * } catch (error) {
 *   console.error("All retry attempts failed:", error);
 * }
 * ```
 */
export async function recurseWithExpect(
  fn: () => Promise<void>,
  options?: {
    retries?: number
    interval?: number
    timeout?: number
  }
): Promise<void> {
  const retries = options?.retries ?? 10
  const interval = options?.interval ?? 500 // milliseconds
  const timeout = options?.timeout ?? 10000 // milliseconds

  const endTime = Date.now() + timeout
  let attempt = 0

  while (attempt < retries && Date.now() < endTime) {
    try {
      await fn()
      return // All assertions passed
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.warn(
          `Attempt ${attempt + 1} failed: ${error.message}. Retrying in ${interval}ms...`
        )
      } else {
        console.error(
          `Attempt ${attempt + 1} failed: An unknown error occurred. Retrying in ${interval}ms...`,
          error
        )
        throw error
      }
    }

    attempt++
    await new Promise((res) => setTimeout(res, interval))
  }

  // Final attempt
  await fn()
}
