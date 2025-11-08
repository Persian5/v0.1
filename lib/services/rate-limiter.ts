/**
 * Rate Limiter Service
 * Implements sliding window rate limiting with in-memory storage
 * 
 * Features:
 * - Per-user rate limiting
 * - Per-IP rate limiting (for unauthenticated requests)
 * - Configurable time windows and limits
 * - Automatic cleanup of expired entries
 * - Production-ready (upgradeable to Redis)
 */

interface RateLimitEntry {
  timestamps: number[]  // Array of request timestamps (sliding window)
  createdAt: number     // For cleanup of old entries
}

interface RateLimitConfig {
  maxRequests: number   // Max requests allowed
  windowMs: number      // Time window in milliseconds
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout | null = null
  private readonly CLEANUP_INTERVAL_MS = 60000 // Clean up every 1 minute

  constructor() {
    // Start periodic cleanup of expired entries
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL_MS)
    }
  }

  /**
   * Check if request is allowed under rate limit
   * @returns { allowed: boolean, remaining: number, resetAt: number }
   */
  check(key: string, config: RateLimitConfig): {
    allowed: boolean
    remaining: number
    resetAt: number
    limit: number
  } {
    const now = Date.now()
    const windowStart = now - config.windowMs

    // Get or create entry for this key
    let entry = this.store.get(key)
    if (!entry) {
      entry = { timestamps: [], createdAt: now }
      this.store.set(key, entry)
    }

    // Remove timestamps outside the current window (sliding window)
    entry.timestamps = entry.timestamps.filter(ts => ts > windowStart)

    // Check if limit exceeded
    const allowed = entry.timestamps.length < config.maxRequests
    
    // If allowed, add current timestamp
    if (allowed) {
      entry.timestamps.push(now)
    }

    // Calculate remaining requests
    const remaining = Math.max(0, config.maxRequests - entry.timestamps.length)

    // Calculate when the oldest request will expire (reset time)
    const oldestTimestamp = entry.timestamps[0] || now
    const resetAt = oldestTimestamp + config.windowMs

    return {
      allowed,
      remaining,
      resetAt,
      limit: config.maxRequests
    }
  }

  /**
   * Clean up expired entries to prevent memory leaks
   */
  private cleanup(): void {
    const now = Date.now()
    const maxAge = 3600000 // 1 hour - remove entries older than this

    for (const [key, entry] of this.store.entries()) {
      // Remove if no recent requests and entry is old
      if (entry.timestamps.length === 0 && (now - entry.createdAt) > maxAge) {
        this.store.delete(key)
      }
    }
  }

  /**
   * Get current store size (for monitoring/debugging)
   */
  getSize(): number {
    return this.store.size
  }

  /**
   * Clear all entries (for testing)
   */
  clear(): void {
    this.store.clear()
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
  }
}

// Singleton instance
const rateLimiter = new RateLimiter()

// Export singleton
export { rateLimiter, type RateLimitConfig }

/**
 * Common rate limit configurations
 */
export const RATE_LIMITS = {
  CHECKOUT: { maxRequests: 3, windowMs: 5 * 60 * 1000 },        // 3 req per 5 minutes
  MODULE_ACCESS: { maxRequests: 30, windowMs: 60 * 1000 },      // 30 req per minute
  USER_STATS: { maxRequests: 10, windowMs: 60 * 1000 },         // 10 req per minute
  CHECK_PREMIUM: { maxRequests: 20, windowMs: 60 * 1000 },      // 20 req per minute
} as const

