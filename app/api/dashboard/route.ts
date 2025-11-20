import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getModules } from '@/lib/config/curriculum'
import { UserLessonProgress } from '@/lib/supabase/database'

export const dynamic = 'force-dynamic' // Required for cookies/auth

/**
 * GET /api/dashboard
 * Returns all dashboard data in a single unified response
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

    // Fetch all data in parallel
    const [
      progress,
      stats,
      profile
    ] = await Promise.all([
      // 1. Get lesson progress (use server-side Supabase client with auth)
      (async () => {
        // Query directly with server-side authenticated client
        // NOTE: DatabaseService uses browser client (no auth), so we query directly here
        const { data, error } = await supabaseServer
          .from('user_lesson_progress')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
        
        if (error) {
          console.error('Error fetching lesson progress:', error)
          return []
        }
        
        return (data || []) as UserLessonProgress[]
      })(),
      
      // 2. Get vocabulary stats
      (async () => {
        const { VocabularyTrackingService } = await import('@/lib/services/vocabulary-tracking-service')
        return await VocabularyTrackingService.getDashboardStats(user.id)
      })(),
      
      // 3. Get user profile
      (async () => {
        const { DatabaseService } = await import('@/lib/supabase/database')
        return await DatabaseService.getUserProfile(user.id)
      })()
    ])

    // Calculate next lesson
    const curriculum = getModules()
    const { LessonProgressService } = await import('@/lib/services/lesson-progress-service')
    const nextLesson = LessonProgressService.getNextLesson(progress, curriculum)

    // Calculate lessons completed today (timezone-aware)
    const timezone = profile?.timezone || 'America/Los_Angeles'
    
    // Get today's start in user's timezone
    const now = new Date()
    const todayStart = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
    todayStart.setHours(0, 0, 0, 0)
    const todayStartISO = todayStart.toISOString()
    
    const lessonsCompletedToday = progress.filter(p => {
      if (!p.completed_at) return false
      const completedDate = new Date(p.completed_at)
      return completedDate >= todayStart
    }).length

    // Fetch XP transactions for today
    const { data: xpTransactionsData, error: xpError } = await supabaseServer
      .from('user_xp_transactions')
      .select('amount')
      .eq('user_id', user.id)
      .gte('created_at', todayStartISO)
    
    if (xpError) {
      console.error('Error fetching XP transactions:', xpError)
    }

    // Calculate XP earned today
    const xpEarnedToday = (xpTransactionsData || []).reduce((sum, tx) => sum + (tx.amount || 0), 0)

    // Calculate level (simple: level = floor(total_xp / 100))
    const level = Math.floor((profile?.total_xp || 0) / 100)

    // Calculate daily goal progress
    const dailyGoalXp = profile?.daily_goal_xp || 50
    const dailyGoalProgress = dailyGoalXp > 0 ? xpEarnedToday / dailyGoalXp : 0

    // Return unified response
    return NextResponse.json({
      progress,
      nextLesson,
      stats,
      xp: profile?.total_xp || 0,
      level,
      streakCount: profile?.streak_count || 0,
      dailyGoalXp,
      dailyGoalProgress: Math.min(dailyGoalProgress, 1), // Cap at 100%
      lessonsCompletedToday,
      xpEarnedToday
    })

  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

