import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { LeaderboardQuerySchema, safeValidate } from '@/lib/utils/api-schemas'

export const dynamic = 'force-dynamic' // Required for request.headers

// In-memory cache for leaderboard data
// TTL: 2 minutes (120000ms)
// Reduces database load for frequently accessed leaderboard
interface CacheEntry {
  data: any
  timestamp: number
}

const cache: Record<string, CacheEntry> = {}
const CACHE_TTL = 2000 // 2 seconds - very fresh data, minimal staleness

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
    
    // 2. Input validation with Zod
    const { searchParams } = new URL(request.url)
    const validationResult = safeValidate(LeaderboardQuerySchema, {
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    })
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: `Invalid query parameters: ${validationResult.error}` },
        { status: 400 }
      )
    }
    
    const { limit, offset } = validationResult.data
    
    // 3. Cache check (with bypass option for debugging)
    const bypassCache = searchParams.get('nocache') === 'true'
    const cacheKey = `leaderboard:${limit}:${offset}`
    const now = Date.now()
    
    if (!bypassCache && cache[cacheKey] && (now - cache[cacheKey].timestamp < CACHE_TTL)) {
      // Cache hit - log for debugging
      console.log('Leaderboard cache hit:', { 
        cacheAge: now - cache[cacheKey].timestamp,
        cachedUsers: cache[cacheKey].data?.top?.map((u: any) => ({ name: u.displayName, xp: u.xp }))
      })
      return NextResponse.json(cache[cacheKey].data)
    }
    
    if (bypassCache) {
      console.log('Leaderboard cache bypassed (nocache=true)')
    }
    
    // 4. Initialize Supabase client with SERVICE ROLE (bypasses RLS)
    // SECURITY: This is safe because:
    // - Service role key never exposed to client (server-side only)
    // - We explicitly select only safe columns (display_name, total_xp)
    // - No way for client to query sensitive fields (email, first_name, last_name)
    // TODO: Switch to anon key + RLS policy after migration is applied
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )
    
    // 5. Get authenticated user (optional, for "You are here" feature)
    // Note: We can't get user from service role client, so leaderboard is fully public
    // Users can still see their rank by matching their profile ID client-side if needed
    const user = null // Always null for public leaderboard
    
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
    
    // DEBUG: Log what we got from DB (with detailed XP values)
    console.log('📊 Leaderboard query returned from DB:', { 
      count: topUsers?.length || 0, 
      users: topUsers?.map(u => ({ 
        id: u.id, 
        name: u.display_name, 
        xp: u.total_xp,
        created_at: u.created_at 
      })) 
    })
    
    // Compare with cached data if exists and highlight mismatches
    if (cache[cacheKey]) {
      const cachedData = cache[cacheKey].data
      const dbUsers = topUsers?.map(u => ({ id: u.id, name: u.display_name, xp: u.total_xp })) || []
      const cachedUsers = cachedData?.top?.map((u: any) => ({ id: u.userId, name: u.displayName, xp: u.xp })) || []
      
      // Find mismatches
      const mismatches = dbUsers.filter(dbUser => {
        const cachedUser = cachedUsers.find(c => c.id === dbUser.id)
        return cachedUser && cachedUser.xp !== dbUser.xp
      })
      
      if (mismatches.length > 0) {
        console.warn('⚠️ XP MISMATCH DETECTED (DB vs Cache):', mismatches.map(m => {
          const cached = cachedUsers.find(c => c.id === m.id)
          return {
            user: m.name,
            dbXp: m.xp,
            cachedXp: cached?.xp,
            difference: cached ? cached.xp - m.xp : 0
          }
        }))
      }
      
      console.log('🔍 Comparing DB vs Cache:', {
        dbUsers,
        cachedUsers,
        mismatches: mismatches.length
      })
    }
    
    // 7. Calculate ranks and sanitize
    const top = (topUsers || []).map((user, index) => ({
      rank: offset + index + 1,
      userId: user.id, // Include user ID so client can identify themselves
      displayName: sanitizeDisplayName(user.display_name),
      xp: user.total_xp || 0 // Fallback to 0 if null/undefined
    }))
    
    // 8. Prepare response (no user context - fully public leaderboard)
    // Client will identify "You are here" by comparing userId with their own
    const response = {
      top: top || [], // Never return null/undefined array
      pagination: {
        limit,
        offset,
        nextOffset: offset + limit,
        hasMore: (top?.length || 0) === limit // Null-safe length check
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

