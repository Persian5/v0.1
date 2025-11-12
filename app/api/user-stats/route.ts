import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic' // Required for cookies/auth

/**
 * GET /api/user-stats
 * Returns dashboard statistics for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get Supabase client with server-side auth
    const supabaseServer = createClient()

    // Get user from session
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use VocabularyTrackingService (which uses the SQL view)
    // This ensures single source of truth
    const { VocabularyTrackingService } = await import('@/lib/services/vocabulary-tracking-service')
    const stats = await VocabularyTrackingService.getDashboardStats(user.id)

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


