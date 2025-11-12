import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DailyGoalService } from '@/lib/services/daily-goal-service'

export const dynamic = 'force-dynamic' // Required for cookies/auth

/**
 * GET /api/daily-goal
 * Returns current daily goal and progress for authenticated user
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
    
    // Get daily goal data
    const goalData = await DailyGoalService.getDailyGoalData(user.id)
    
    return NextResponse.json({
      goal: goalData.goal,
      progress: goalData.progress,
      timezone: goalData.timezone
    })
  } catch (error) {
    console.error('Error fetching daily goal:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily goal' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/daily-goal
 * Updates user's daily goal XP
 * Body: { goal: number } (1-1000)
 */
export async function PUT(request: NextRequest) {
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
    
    // Parse request body
    const body = await request.json()
    const { goal } = body
    
    // Validate input
    if (!Number.isInteger(goal) || goal < 1 || goal > 1000) {
      return NextResponse.json(
        { error: 'Daily goal must be between 1 and 1000 XP' },
        { status: 400 }
      )
    }
    
    // Update daily goal
    const result = await DailyGoalService.setDailyGoal(goal, user.id)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update daily goal' },
        { status: 400 }
      )
    }
    
    // Return updated goal data
    const goalData = await DailyGoalService.getDailyGoalData(user.id)
    
    return NextResponse.json({
      goal: goalData.goal,
      progress: goalData.progress,
      timezone: goalData.timezone,
      updated: true
    })
  } catch (error) {
    console.error('Error updating daily goal:', error)
    return NextResponse.json(
      { error: 'Failed to update daily goal' },
      { status: 500 }
    )
  }
}

