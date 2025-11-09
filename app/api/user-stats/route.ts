import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Fetch dashboard stats using server-side Supabase
    // We need to replicate the logic here since VocabularyTrackingService uses client-side Supabase
    const { data, error } = await supabaseServer
      .from('vocabulary_performance')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching dashboard stats:', error)
      return NextResponse.json(
        {
          wordsLearned: 0,
          masteredWords: 0,
          hardWords: []
        }
      )
    }

    const performances = data || []

    // Words Learned: Any word with total_attempts > 0
    const wordsLearned = performances.filter(p => p.total_attempts > 0).length

    // Mastered Words: consecutive_correct >= 5 OR mastery_level >= 5
    const masteredWords = performances.filter(
      p => p.consecutive_correct >= 5 || p.mastery_level >= 5
    ).length

    // Hard Words: Calculate error rate, filter by total_attempts >= 2, sort by error rate DESC
    const hardWordsWithErrorRate = performances
      .filter(p => p.total_attempts >= 2) // Minimum 2 attempts
      .map(p => ({
        vocabulary_id: p.vocabulary_id,
        word_text: p.word_text,
        consecutive_correct: p.consecutive_correct,
        total_attempts: p.total_attempts,
        total_correct: p.total_correct,
        total_incorrect: p.total_incorrect,
        accuracy: p.total_attempts > 0 ? (p.total_correct / p.total_attempts) * 100 : 0,
        errorRate: p.total_attempts > 0 ? (p.total_incorrect / p.total_attempts) : 0,
        last_seen_at: p.last_seen_at
      }))
      .sort((a, b) => b.errorRate - a.errorRate) // Highest error rate first
      .slice(0, 10) // Top 10 hardest words
      .map(({ errorRate, ...rest }) => rest) // Remove errorRate from output

    const stats = {
      wordsLearned,
      masteredWords,
      hardWords: hardWordsWithErrorRate
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


