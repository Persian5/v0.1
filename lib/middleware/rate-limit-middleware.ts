/**
 * Rate Limit Middleware for Next.js API Routes
 * 
 * Usage:
 * import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
 * 
 * export async function GET(req: NextRequest) {
 *   const rateLimitResult = await withRateLimit(req, {
 *     config: RATE_LIMITS.CHECKOUT,
 *     keyPrefix: 'checkout'
 *   })
 * 
 *   if (!rateLimitResult.allowed) {
 *     return rateLimitResult.response
 *   }
 * 
 *   // Your handler logic...
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter, type RateLimitConfig } from '@/lib/services/rate-limiter'
import { createClient } from '@/lib/supabase/server'

interface RateLimitOptions {
  config: RateLimitConfig
  keyPrefix: string
  useIpFallback?: boolean  // Use IP as fallback if not authenticated
}

interface RateLimitResult {
  allowed: boolean
  response?: NextResponse  // Pre-built 429 response if not allowed
  headers: Record<string, string>
}

/**
 * Apply rate limiting to a Next.js API route
 * Returns result with allowed status and pre-built response if denied
 */
export async function withRateLimit(
  req: NextRequest,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { config, keyPrefix, useIpFallback = true } = options

  // Try to get user ID from session
  let identifier: string | null = null
  
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user?.id) {
      identifier = `${keyPrefix}:user:${user.id}`
    }
  } catch (error) {
    console.error('Rate limit auth check error:', error)
  }

  // Fallback to IP address if not authenticated
  if (!identifier && useIpFallback) {
    const ip = getClientIp(req)
    if (ip) {
      identifier = `${keyPrefix}:ip:${ip}`
    }
  }

  // If we still don't have an identifier, allow the request
  // (This shouldn't happen, but we fail open rather than closed)
  if (!identifier) {
    console.warn('Rate limiter: No identifier found, allowing request')
    return {
      allowed: true,
      headers: {}
    }
  }

  // Check rate limit
  const result = rateLimiter.check(identifier, config)

  // Build response headers
  const headers = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
  }

  // If not allowed, return 429 response
  if (!result.allowed) {
    const retryAfterSeconds = Math.ceil((result.resetAt - Date.now()) / 1000)
    
    return {
      allowed: false,
      headers,
      response: NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again in ${retryAfterSeconds} seconds.`,
          retryAfter: retryAfterSeconds
        },
        {
          status: 429,
          headers: {
            ...headers,
            'Retry-After': String(retryAfterSeconds)
          }
        }
      )
    }
  }

  // Allowed - return headers to add to successful response
  return {
    allowed: true,
    headers
  }
}

/**
 * Extract client IP from request
 * Checks common headers in order of reliability
 */
function getClientIp(req: NextRequest): string | null {
  // Check Vercel-specific headers first
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim()
  }

  // Check real IP header
  const realIp = req.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to Vercel's IP header
  const vercelIp = req.headers.get('x-vercel-forwarded-for')
  if (vercelIp) {
    return vercelIp
  }

  return null
}

/**
 * Helper to add rate limit headers to any response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  headers: Record<string, string>
): NextResponse {
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

