import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { LevelService } from '@/lib/services/level-service'
import { DatabaseService } from '@/lib/supabase/database'

export const dynamic = 'force-dynamic' // Required for cookies/auth

/**
 * GET /api/level
 * Returns current level and progress for authenticated user
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
    
    // Get user's total XP
    const totalXp = await DatabaseService.getUserTotalXp(user.id)
    
    // Get level progress
    const progress = await LevelService.getLevelProgress(totalXp)
    
    return NextResponse.json({
      level: progress.level,
      currentXp: progress.currentXp,
      nextLevelXp: progress.nextLevelXp,
      remainingXp: progress.remainingXp,
      progress: progress.progress,
      totalXp
    })
  } catch (error) {
    console.error('Error fetching level:', error)
    return NextResponse.json(
      { error: 'Failed to fetch level' },
      { status: 500 }
    )
  }
}

