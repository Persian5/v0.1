import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { StreakService } from '@/lib/services/streak-service'

/**
 * GET /api/streak
 * Returns current streak for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get streak data
    const streakData = await StreakService.getStreakData()
    
    return NextResponse.json({
      streak: streakData.streakCount,
      lastActivityDate: streakData.lastActivityDate,
      lastStreakDate: streakData.lastStreakDate
    })
  } catch (error) {
    console.error('Error fetching streak:', error)
    return NextResponse.json(
      { error: 'Failed to fetch streak' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/streak
 * Manual streak refresh (for testing/debugging)
 * Note: Streak updates are automatic via trigger, but this can force a refresh
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get fresh streak data from database
    const streakData = await StreakService.getStreakData()
    
    return NextResponse.json({
      streak: streakData.streakCount,
      lastActivityDate: streakData.lastActivityDate,
      lastStreakDate: streakData.lastStreakDate,
      refreshed: true
    })
  } catch (error) {
    console.error('Error refreshing streak:', error)
    return NextResponse.json(
      { error: 'Failed to refresh streak' },
      { status: 500 }
    )
  }
}

