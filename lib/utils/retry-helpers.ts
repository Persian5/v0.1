/**
 * Retry Helpers with Exponential Backoff
 * 
 * Centralized retry logic for handling transient failures.
 * Uses exponential backoff to avoid overwhelming services during issues.
 * 
 * @module retry-helpers
 */

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number
  /** Base delay in milliseconds (default: 1000ms) */
  baseDelay?: number
  /** Maximum delay in milliseconds to prevent excessive waiting (default: 10000ms) */
  maxDelay?: number
  /** Callback for logging retry attempts */
  onRetry?: (attempt: number, error: Error) => void
}

/**
 * Execute a function with exponential backoff retry logic.
 * 
 * Delays between retries:
 * - Attempt 1: baseDelay * 2^0 = 1000ms
 * - Attempt 2: baseDelay * 2^1 = 2000ms
 * - Attempt 3: baseDelay * 2^2 = 4000ms
 * 
 * @template T - Return type of the function
 * @param fn - Async function to execute
 * @param config - Retry configuration
 * @returns Promise resolving to function result
 * @throws Error from the last failed attempt if all retries exhausted
 * 
 * @example
 * ```typescript
 * const result = await withBackoff(
 *   async () => await DatabaseService.markLessonCompleted(userId, moduleId, lessonId),
 *   {
 *     maxRetries: 3,
 *     baseDelay: 1000,
 *     onRetry: (attempt, error) => console.log(`Retry ${attempt}:`, error.message)
 *   }
 * )
 * ```
 */
export async function withBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry
  } = config

  let lastError: Error

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Attempt to execute the function
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw lastError
      }
      
      // Calculate delay with exponential backoff: baseDelay * 2^attempt
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
      
      // Call retry callback if provided
      if (onRetry) {
        try {
          onRetry(attempt + 1, lastError)
        } catch (callbackError) {
          // Don't let callback errors break retry logic
          console.error('Retry callback error:', callbackError)
        }
      }
      
      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // TypeScript needs this for exhaustiveness checking
  throw lastError!
}

/**
 * Execute a function with simple retry logic (constant delay, no backoff).
 * Useful for quick retries where backoff isn't needed.
 * 
 * @template T - Return type of the function
 * @param fn - Async function to execute
 * @param retries - Number of retry attempts (default: 3)
 * @param delay - Delay between retries in milliseconds (default: 500ms)
 * @returns Promise resolving to function result
 * @throws Error from the last failed attempt if all retries exhausted
 * 
 * @example
 * ```typescript
 * const result = await withSimpleRetry(
 *   async () => await fetch('/api/endpoint'),
 *   2,
 *   500
 * )
 * ```
 */
export async function withSimpleRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 500
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt === retries - 1) {
        throw lastError
      }
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

