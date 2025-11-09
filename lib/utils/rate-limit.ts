/**
 * Upstash Redis Rate Limiter
 * 
 * Distributed rate limiting for Vercel serverless functions
 * Uses Upstash Redis for persistence across instances
 */

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Initialize Redis client (uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from env)
const redis = Redis.fromEnv()

// Rate limiters for different endpoints
export const rateLimiters = {
  // Payment fraud prevention: 3 requests per 5 minutes
  checkout: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "5 m"),
    analytics: true,
    prefix: "ratelimit:checkout",
  }),
  
  // Leaderboard: 60 requests per minute
  leaderboard: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    analytics: true,
    prefix: "ratelimit:leaderboard",
  }),
  
  // Premium check: 20 requests per minute
  checkPremium: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    analytics: true,
    prefix: "ratelimit:premium",
  }),
  
  // User stats: 10 requests per minute
  userStats: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    analytics: true,
    prefix: "ratelimit:stats",
  }),
}

/**
 * Get client identifier (user ID or IP address)
 */
export function getClientIdentifier(request: Request, userId?: string): string {
  if (userId) return `user:${userId}`
  
  // Fallback to IP address for unauthenticated requests
  const ip = request.headers.get("x-forwarded-for")?.split(',')[0] || 
             request.headers.get("x-real-ip") || 
             "anonymous"
  return `ip:${ip}`
}

