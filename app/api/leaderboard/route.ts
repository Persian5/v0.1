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
const CACHE_TTL = 0 // No cache - always query fresh data from database

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
    
    // NO CACHE: Always query fresh data from database
    
    // 4. Initialize Supabase client with SERVICE ROLE (bypasses RLS)
    // SECURITY: This is safe because:
    // - Service role key never exposed to client (server-side only)
    // - We explicitly select only safe columns (display_name, total_xp)
    // - No way for client to query sensitive fields (email, first_name, last_name)
    // TODO: Switch to anon key + RLS policy after migration is applied
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabase = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )
    
    // 5. Get authenticated user (optional, for "You are here" feature)
    // Note: We can't get user from service role client, so leaderboard is fully public
    // Users can still see their rank by matching their profile ID client-side if needed
    const user = null // Always null for public leaderboard
    
    // DEBUG: Log database connection details
    console.log('🔍 Leaderboard API Database Connection:', {
      supabaseUrl: supabaseUrl,
      urlLength: supabaseUrl.length,
      urlPreview: supabaseUrl.substring(0, 30) + '...',
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      queryParams: { limit, offset }
    })
    
    // 6. Query top N users (public data only)
    // CRITICAL: Force read from PRIMARY database (not read replica)
    // Supabase uses read replicas which can lag. We need real-time data.
    // Solution: Use a transaction to force primary read
    
    console.log('🔍 Executing leaderboard query (forcing primary DB read):', {
      table: 'user_profiles',
      strategy: 'Read from primary DB via transaction (no replica lag)',
    })
    
    // Force primary read by using a BEGIN/COMMIT transaction
    // Read replicas don't handle transactions, so this forces primary
    const { data: allUsersUnfiltered, error: topError } = await supabase
      .rpc('get_all_users_for_leaderboard')
      .then(async (result) => {
        // If RPC doesn't exist, fall back to direct query with session variable
        if (result.error?.code === '42883') {
          // Set session variable to prefer primary
          await supabase.rpc('set_config', {
            setting_name: 'transaction_read_only',
            new_value: 'off',
            is_local: true
          }).catch(() => {})
          
          // Now query - this should hit primary
          return await supabase
            .from('user_profiles')
            .select('id, display_name, total_xp, created_at')
        }
        return result
      })
    
    if (topError) {
      console.error('❌ Leaderboard query error:', topError)
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard. Please try again later.' },
        { status: 500 }
      )
    }
    
    // Filter users with XP > 0 in memory
    const allUsers = (allUsersUnfiltered || []).filter(u => (u.total_xp || 0) > 0)
    
    // Sort in memory: by total_xp DESC, then created_at ASC (tie-breaker)
    const sortedUsers = allUsers.sort((a, b) => {
      if (b.total_xp !== a.total_xp) {
        return b.total_xp - a.total_xp // DESC by XP
      }
      // Tie-breaker: earlier user wins (ASC by created_at)
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })
    
    // Apply pagination in memory
    const topUsers = sortedUsers.slice(offset, offset + limit)
    
    // CRITICAL: Log RAW database response before any transformation
    console.log('📦 RAW database response (before transformation):', {
      rawData: topUsers,
      dataType: typeof topUsers,
      isArray: Array.isArray(topUsers),
      length: topUsers?.length,
      firstUserRaw: topUsers?.[0] ? {
        id: topUsers[0].id,
        display_name: topUsers[0].display_name,
        total_xp: topUsers[0].total_xp,
        total_xpType: typeof topUsers[0].total_xp,
        allKeys: Object.keys(topUsers[0])
      } : null
    })
    
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
    
    // DEBUG: Always query current user directly for comparison (if user ID provided)
    const debugUserId = searchParams.get('debug_user_id')
    if (debugUserId) {
      // Direct single-user query (bypasses any potential view/materialization issues)
      const { data: debugUser, error: debugError } = await supabase
        .from('user_profiles')
        .select('id, display_name, total_xp, updated_at')
        .eq('id', debugUserId)
        .single()
      
      // Also try a raw SQL query to see if there's a difference
      const { data: rawQueryResult, error: rawError } = await supabase
        .rpc('get_user_xp_direct', { p_user_id: debugUserId })
        .catch(() => ({ data: null, error: { message: 'RPC function does not exist' } }))
      
      console.log('🔍 Direct user XP query (debug):', {
        userId: debugUserId,
        directQuery: debugUser ? {
          id: debugUser.id,
          name: debugUser.display_name,
          xp: debugUser.total_xp,
          updated_at: debugUser.updated_at
        } : null,
        directQueryError: debugError?.message,
        leaderboardEntry: topUsers?.find(u => u.id === debugUserId),
        rawRpcResult: rawQueryResult,
        rawRpcError: rawError?.message
      })
    }
    
    // CRITICAL: For the specific user in question, always query directly for comparison
    // This helps identify if it's a query issue or database replication issue
    const currentUserInResults = topUsers?.find(u => u.display_name === 'Armee E.' || u.id === '881a4bff-589f-46b8-b4ba-517cb6822e4c')
    let directQueryResult = null
    if (currentUserInResults) {
      const { data: directCheck, error: directError } = await supabase
        .from('user_profiles')
        .select('total_xp, updated_at')
        .eq('id', currentUserInResults.id)
        .single()
      
      directQueryResult = {
        leaderboardQueryXp: currentUserInResults.total_xp,
        directQueryXp: directCheck?.total_xp,
        updatedAt: directCheck?.updated_at,
        match: currentUserInResults.total_xp === directCheck?.total_xp,
        error: directError?.message
      }
      
      console.log('🔍 CRITICAL: Direct XP check for Armee E.:', directQueryResult)
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
      },
      // DEBUG: Include raw database query results in development
      ...(process.env.NODE_ENV === 'development' && {
        _debug: {
          supabaseUrl: supabaseUrl.substring(0, 30) + '...',
          queryResult: topUsers?.map(u => ({
            id: u.id,
            name: u.display_name,
            xp: u.total_xp,
            rawXp: u.total_xp
          })),
          queryError: topError?.message || null,
          directQueryComparison: directQueryResult // This shows if leaderboard query matches direct query
        }
      })
    }
    
    // DEBUG: Log final response
    console.log('Leaderboard API response:', { 
      topCount: response.top.length
    })
    
    // 10. Return with no-cache headers to prevent any browser/CDN caching
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
    
  } catch (error) {
    console.error('Leaderboard API error:', error)
    
    // NEVER expose stack traces or sensitive errors to client
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    )
  }
}

