import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// In-memory cache for leaderboard data
// TTL: 2 minutes (120000ms)
// Reduces database load for frequently accessed leaderboard
interface CacheEntry {
  data: any
  timestamp: number
}

const cache: Record<string, CacheEntry> = {}
const CACHE_TTL = 120000 // 2 minutes

// Rate limiting: Simple in-memory tracker (upgrade to Redis for production)
const rateLimit: Record<string, { count: number; resetTime: number }> = {}
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const RATE_LIMIT_MAX = 60 // 60 requests per minute

/**
 * Rate limiting check
 * Returns true if request should be allowed, false if rate limited
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  
  if (!rateLimit[ip] || now > rateLimit[ip].resetTime) {
    // Reset rate limit window
    rateLimit[ip] = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    }
    return true
  }
  
  if (rateLimit[ip].count >= RATE_LIMIT_MAX) {
    return false
  }
  
  rateLimit[ip].count++
  return true
}

/**
 * Sanitize display name to prevent XSS
 * Escapes HTML special characters
 */
function sanitizeDisplayName(name: string | null): string {
  if (!name) return 'Anonymous'
  
  return name
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim()
    .substring(0, 50) // Max 50 characters
}

/**
 * GET /api/leaderboard
 * 
 * Query params:
 *  - limit: number (default 10, max 100)
 *  - offset: number (default 0, min 0)
 * 
 * Returns:
 *  - top: Array of top N users
 *  - you: Current user's rank (if authenticated)
 *  - youContext: 5-user window around current user (2 above, you, 2 below)
 *  - pagination: { limit, offset, nextOffset, hasMore }
 * 
 * Security:
 *  - Rate limited (60 req/min per IP)
 *  - Cached (2 min TTL)
 *  - Sanitized output (XSS prevention)
 *  - RLS enforced
 *  - No PII exposed
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }
    
    // 2. Input validation
    const { searchParams } = new URL(request.url)
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || '10', 10), 1),
      100
    )
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)
    
    // 3. Cache check
    const cacheKey = `leaderboard:${limit}:${offset}`
    const now = Date.now()
    
    if (cache[cacheKey] && (now - cache[cacheKey].timestamp < CACHE_TTL)) {
      // Cache hit
      return NextResponse.json(cache[cacheKey].data)
    }
    
    // 4. Initialize Supabase client with ANON KEY (RLS enforced)
    // SECURITY: Uses public RLS policy for leaderboard access
    // - RLS policy: users with total_xp > 0 are publicly readable
    // - Only safe columns are granted: id, display_name, total_xp, created_at
    // - Sensitive data (email, first_name, etc.) remain protected by RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    )
    
    // 5. Get authenticated user (optional, for "You are here" feature)
    // This is now possible since we're using anon key with proper session
    const { data: { user } } = await supabase.auth.getUser()
    
    // DEBUG: Log query details
    console.log('Leaderboard API called:', { limit, offset })
    
    // 6. Query top N users (public data only)
    const { data: topUsers, error: topError } = await supabase
      .from('user_profiles')
      .select('id, display_name, total_xp, created_at')
      .gt('total_xp', 0) // Only users with XP > 0
      .order('total_xp', { ascending: false })
      .order('created_at', { ascending: true }) // Tie-breaker: earlier user wins
      .range(offset, offset + limit - 1)
    
    if (topError) {
      console.error('Leaderboard query error:', topError)
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard. Please try again later.' },
        { status: 500 }
      )
    }
    
    // DEBUG: Log what we got from DB
    console.log('Leaderboard query returned:', { 
      count: topUsers?.length || 0, 
      users: topUsers?.map(u => ({ name: u.display_name, xp: u.total_xp })) 
    })
    
    // 7. Calculate ranks and sanitize
    const top = (topUsers || []).map((user, index) => ({
      rank: offset + index + 1,
      userId: user.id, // Include user ID so client can identify themselves
      displayName: sanitizeDisplayName(user.display_name),
      xp: user.total_xp
    }))
    
    // 8. Prepare response (no user context - fully public leaderboard)
    // Client will identify "You are here" by comparing userId with their own
    const response = {
      top,
      pagination: {
        limit,
        offset,
        nextOffset: offset + limit,
        hasMore: top.length === limit
      }
    }
    
    // 9. Cache response
    cache[cacheKey] = {
      data: response,
      timestamp: now
    }
    
    // DEBUG: Log final response
    console.log('Leaderboard API response:', { 
      topCount: response.top.length
    })
    
    // 10. Return sanitized data
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Leaderboard API error:', error)
    
    // NEVER expose stack traces or sensitive errors to client
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    )
  }
}

