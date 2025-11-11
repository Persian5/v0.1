/**
 * Safe Telemetry Wrapper
 * 
 * Prevents telemetry/logging failures from blocking user experience.
 * All telemetry calls are wrapped in try/catch to ensure they never throw.
 * 
 * @module telemetry-safe
 */

/**
 * Telemetry event data
 */
export interface TelemetryEvent {
  /** Event name/category */
  name: string
  /** Event data/properties */
  data?: Record<string, any>
  /** Timestamp when event occurred */
  timestamp?: number
  /** Event level (log, warn, error) */
  level?: 'log' | 'warn' | 'error'
}

/**
 * Safely execute a telemetry/logging function without blocking user experience.
 * 
 * If the telemetry function throws an error, it will be caught and logged
 * to console.error, but will not propagate to the calling code.
 * 
 * This ensures that telemetry failures never impact user experience.
 * 
 * @param fn - Telemetry function to execute safely
 * @param event - Optional event data for logging context
 * @returns void - Always returns successfully, even if fn throws
 * 
 * @example
 * ```typescript
 * // Safe logging that won't break app if it fails
 * safeTelemetry(() => {
 *   console.log('Cache updated:', { moduleId, lessonId })
 *   analytics.track('cache_updated', { moduleId, lessonId })
 * })
 * 
 * // With event data for better error context
 * safeTelemetry(
 *   () => trackMetric('cache_hit_rate', 0.95),
 *   { name: 'cache_metrics', data: { hit_rate: 0.95 } }
 * )
 * ```
 */
export function safeTelemetry(
  fn: () => void,
  event?: TelemetryEvent
): void {
  try {
    fn()
  } catch (error) {
    // Log telemetry failure but don't propagate error
    // This ensures telemetry never blocks user experience
    if (process.env.NODE_ENV === 'development') {
      console.error(
        '⚠️ Telemetry function failed (non-critical):',
        event?.name || 'unknown event',
        error
      )
    }
    // In production, silently fail to avoid console noise
    // Consider sending to error monitoring service here
  }
}

/**
 * Safely execute an async telemetry function without blocking user experience.
 * 
 * Similar to safeTelemetry() but for async operations.
 * Errors are caught and logged but never propagated.
 * 
 * @param fn - Async telemetry function to execute safely
 * @param event - Optional event data for logging context
 * @returns Promise<void> - Always resolves successfully
 * 
 * @example
 * ```typescript
 * // Safe async logging
 * await safeTelemetryAsync(async () => {
 *   await analytics.track('lesson_completed', { lessonId })
 * })
 * ```
 */
export async function safeTelemetryAsync(
  fn: () => Promise<void>,
  event?: TelemetryEvent
): Promise<void> {
  try {
    await fn()
  } catch (error) {
    // Log telemetry failure but don't propagate error
    if (process.env.NODE_ENV === 'development') {
      console.error(
        '⚠️ Async telemetry function failed (non-critical):',
        event?.name || 'unknown event',
        error
      )
    }
    // In production, silently fail
  }
}

/**
 * Create a safe logger that wraps console methods.
 * 
 * All logging is wrapped in safeTelemetry to prevent blocking.
 * Useful for creating logger instances that can never throw.
 * 
 * @param context - Context string to prepend to all logs
 * @returns Safe logger object with log/warn/error methods
 * 
 * @example
 * ```typescript
 * const logger = createSafeLogger('LessonProgress')
 * 
 * logger.log('Marking lesson complete')  // Never throws
 * logger.error('Cache update failed')    // Never throws
 * ```
 */
export function createSafeLogger(context: string) {
  return {
    log: (...args: any[]) => {
      safeTelemetry(() => console.log(`[${context}]`, ...args))
    },
    warn: (...args: any[]) => {
      safeTelemetry(() => console.warn(`[${context}]`, ...args))
    },
    error: (...args: any[]) => {
      safeTelemetry(() => console.error(`[${context}]`, ...args))
    }
  }
}

