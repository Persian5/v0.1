/**
 * Vocabulary Tracking Service
 * 
 * Tracks user performance on vocabulary words for:
 * - Spaced Repetition System (SRS)
 * - Review Mode
 * - Adaptive Learning
 * - Analytics
 * 
 * Key Features:
 * - Records every vocabulary attempt
 * - Calculates mastery level (0-5)
 * - Determines next review date (SRS)
 * - Identifies weak vs mastered words
 * - Tracks consecutive correct streak (for "5 in a row" mastery)
 */

import { supabase } from '@/lib/supabase/client'

// ============================================================================
// TYPES
// ============================================================================

export interface VocabularyPerformance {
  id: string
  user_id: string
  vocabulary_id: string
  word_text: string
  total_attempts: number
  total_correct: number
  total_incorrect: number
  consecutive_correct: number
  mastery_level: number  // 0-5
  last_seen_at: string | null
  next_review_at: string | null
  created_at: string
  updated_at: string
}

export interface VocabularyAttempt {
  id?: string
  user_id: string
  vocabulary_id: string
  game_type: string
  module_id?: string
  lesson_id?: string
  step_uid?: string
  is_correct: boolean
  time_spent_ms?: number
  context_data?: any
  created_at?: string
}

export interface StoreAttemptParams {
  userId: string
  vocabularyId: string
  wordText: string
  gameType: string
  isCorrect: boolean
  timeSpentMs?: number
  moduleId?: string
  lessonId?: string
  stepUid?: string
  contextData?: any
}

export interface WeakWord {
  vocabulary_id: string
  word_text: string
  consecutive_correct: number
  total_attempts: number
  total_correct: number
  total_incorrect: number
  accuracy: number
  last_seen_at: string | null
}

// ============================================================================
// SPACED REPETITION SCHEDULE
// ============================================================================

const SRS_SCHEDULE = {
  0: 1 * 60 * 60 * 1000,          // 1 hour (new word)
  1: 8 * 60 * 60 * 1000,          // 8 hours (learning)
  2: 24 * 60 * 60 * 1000,         // 1 day (familiar)
  3: 3 * 24 * 60 * 60 * 1000,     // 3 days (known)
  4: 7 * 24 * 60 * 60 * 1000,     // 1 week (strong)
  5: 14 * 24 * 60 * 60 * 1000     // 2 weeks (mastered)
} as const

// ============================================================================
// SERVICE
// ============================================================================

export class VocabularyTrackingService {
  
  /**
   * Store a vocabulary attempt and update performance
   * 
   * This is the MAIN function to call from game components.
   * It handles both logging the attempt and updating aggregate stats.
   */
  static async storeAttempt(params: StoreAttemptParams): Promise<boolean> {
    try {
      const {
        userId,
        vocabularyId,
        wordText,
        gameType,
        isCorrect,
        timeSpentMs,
        moduleId,
        lessonId,
        stepUid,
        contextData
      } = params

      // 1. Log the detailed attempt
      const { error: attemptError } = await supabase
        .from('vocabulary_attempts')
        .insert({
          user_id: userId,
          vocabulary_id: vocabularyId,
          game_type: gameType,
          is_correct: isCorrect,
          time_spent_ms: timeSpentMs,
          module_id: moduleId,
          lesson_id: lessonId,
          step_uid: stepUid,
          context_data: contextData
        })

      if (attemptError) {
        console.error('❌ Failed to log vocabulary attempt:', attemptError)
        return false
      }

      // 2. Update or create performance record
      const updated = await this.updatePerformance(
        userId,
        vocabularyId,
        wordText,
        isCorrect
      )

      if (!updated) {
        console.error('❌ Failed to update vocabulary performance')
        return false
      }

      console.log(`✅ Tracked ${vocabularyId}: ${isCorrect ? 'correct' : 'incorrect'}`)
      return true

    } catch (error) {
      console.error('❌ Exception in storeAttempt:', error)
      return false
    }
  }

  /**
   * Update performance record (upsert logic)
   * 
   * Handles:
   * - Incrementing counters
   * - Updating consecutive streak
   * - Calculating mastery level
   * - Setting next review date (SRS)
   */
  private static async updatePerformance(
    userId: string,
    vocabularyId: string,
    wordText: string,
    isCorrect: boolean
  ): Promise<boolean> {
    try {
      // Fetch current performance
      const { data: current, error: fetchError } = await supabase
        .from('vocabulary_performance')
        .select('*')
        .eq('user_id', userId)
        .eq('vocabulary_id', vocabularyId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error fetching performance:', fetchError)
        return false
      }

      const now = new Date().toISOString()

      if (!current) {
        // First attempt - INSERT
        const newMasteryLevel = isCorrect ? 1 : 0
        const nextReviewAt = this.calculateNextReview(newMasteryLevel)

        const { error: insertError } = await supabase
          .from('vocabulary_performance')
          .insert({
            user_id: userId,
            vocabulary_id: vocabularyId,
            word_text: wordText,
            total_attempts: 1,
            total_correct: isCorrect ? 1 : 0,
            total_incorrect: isCorrect ? 0 : 1,
            consecutive_correct: isCorrect ? 1 : 0,
            mastery_level: newMasteryLevel,
            last_seen_at: now,
            next_review_at: nextReviewAt
          })

        if (insertError) {
          console.error('Error inserting performance:', insertError)
          return false
        }

        return true
      }

      // Existing record - UPDATE
      // Soft reset: incorrect answers drop consecutive by 2 (minimum 0), not full reset
      const newConsecutive = isCorrect 
        ? current.consecutive_correct + 1 
        : Math.max(0, current.consecutive_correct - 2)
      const newMasteryLevel = this.calculateMasteryLevel(
        current.mastery_level,
        newConsecutive,
        current.total_correct + (isCorrect ? 1 : 0)
      )
      const nextReviewAt = this.calculateNextReview(newMasteryLevel)

      const { error: updateError } = await supabase
        .from('vocabulary_performance')
        .update({
          word_text: wordText, // Keep label fresh
          total_attempts: current.total_attempts + 1,
          total_correct: current.total_correct + (isCorrect ? 1 : 0),
          total_incorrect: current.total_incorrect + (isCorrect ? 0 : 1),
          consecutive_correct: newConsecutive,
          mastery_level: newMasteryLevel,
          last_seen_at: now,
          next_review_at: nextReviewAt
        })
        .eq('user_id', userId)
        .eq('vocabulary_id', vocabularyId)

      if (updateError) {
        console.error('Error updating performance:', updateError)
        return false
      }

      return true

    } catch (error) {
      console.error('Exception in updatePerformance:', error)
      return false
    }
  }

  /**
   * Calculate mastery level based on performance
   * 
   * Rules:
   * - 5+ consecutive correct → mastery level 3+
   * - 3+ consecutive correct → mastery level 2+
   * - Total correct matters as backstop
   * - Never decrease below current level (only increases)
   */
  private static calculateMasteryLevel(
    currentLevel: number,
    consecutiveCorrect: number,
    totalCorrect: number
  ): number {
    let newLevel = currentLevel

    // Consecutive streak (fast path to mastery)
    if (consecutiveCorrect >= 5) {
      newLevel = Math.max(newLevel, 5) // MASTERED!
    } else if (consecutiveCorrect >= 3) {
      newLevel = Math.max(newLevel, 3)
    } else if (consecutiveCorrect >= 2) {
      newLevel = Math.max(newLevel, 2)
    }

    // Total correct (backstop for consistency)
    if (totalCorrect >= 10) {
      newLevel = Math.max(newLevel, 4)
    } else if (totalCorrect >= 5) {
      newLevel = Math.max(newLevel, 3)
    }

    // Never exceed max level
    return Math.min(newLevel, 5)
  }

  /**
   * Calculate next review date based on mastery level (SRS)
   */
  private static calculateNextReview(masteryLevel: number): string {
    const delayMs = SRS_SCHEDULE[masteryLevel as keyof typeof SRS_SCHEDULE] || SRS_SCHEDULE[0]
    const nextReview = new Date(Date.now() + delayMs)
    return nextReview.toISOString()
  }

  /**
   * Get weak words needing review
   * 
   * Returns words that:
   * - Have low consecutive streak (< 2)
   * - Are due for review (next_review_at <= now)
   * - Have been seen but not mastered
   */
  static async getWeakWords(userId: string, limit: number = 20): Promise<WeakWord[]> {
    try {
      const { data, error } = await supabase
        .from('vocabulary_performance')
        .select('*')
        .eq('user_id', userId)
        .or('consecutive_correct.lt.2,next_review_at.lte.' + new Date().toISOString())
        .order('consecutive_correct', { ascending: true })
        .order('total_attempts', { ascending: true })
        .limit(limit)

      if (error) {
        console.error('Error fetching weak words:', error)
        return []
      }

      return (data || []).map(d => ({
        vocabulary_id: d.vocabulary_id,
        word_text: d.word_text,
        consecutive_correct: d.consecutive_correct,
        total_attempts: d.total_attempts,
        total_correct: d.total_correct,
        total_incorrect: d.total_incorrect,
        accuracy: d.total_attempts > 0 ? (d.total_correct / d.total_attempts) * 100 : 0,
        last_seen_at: d.last_seen_at
      }))

    } catch (error) {
      console.error('Exception in getWeakWords:', error)
      return []
    }
  }

  /**
   * Get mastered words (5 consecutive correct OR mastery_level = 5)
   */
  static async getMasteredWords(userId: string): Promise<WeakWord[]> {
    try {
      const { data, error } = await supabase
        .from('vocabulary_performance')
        .select('*')
        .eq('user_id', userId)
        .or('consecutive_correct.gte.5,mastery_level.eq.5')
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching mastered words:', error)
        return []
      }

      return (data || []).map(d => ({
        vocabulary_id: d.vocabulary_id,
        word_text: d.word_text,
        consecutive_correct: d.consecutive_correct,
        total_attempts: d.total_attempts,
        total_correct: d.total_correct,
        total_incorrect: d.total_incorrect,
        accuracy: d.total_attempts > 0 ? (d.total_correct / d.total_attempts) * 100 : 0,
        last_seen_at: d.last_seen_at
      }))

    } catch (error) {
      console.error('Exception in getMasteredWords:', error)
      return []
    }
  }

  /**
   * Get words due for review (SRS)
   */
  static async getWordsForReview(userId: string, limit: number = 10): Promise<WeakWord[]> {
    try {
      const { data, error } = await supabase
        .from('vocabulary_performance')
        .select('*')
        .eq('user_id', userId)
        .lte('next_review_at', new Date().toISOString())
        .order('next_review_at', { ascending: true })
        .limit(limit)

      if (error) {
        console.error('Error fetching review words:', error)
        return []
      }

      return (data || []).map(d => ({
        vocabulary_id: d.vocabulary_id,
        word_text: d.word_text,
        consecutive_correct: d.consecutive_correct,
        total_attempts: d.total_attempts,
        total_correct: d.total_correct,
        total_incorrect: d.total_incorrect,
        accuracy: d.total_attempts > 0 ? (d.total_correct / d.total_attempts) * 100 : 0,
        last_seen_at: d.last_seen_at
      }))

    } catch (error) {
      console.error('Exception in getWordsForReview:', error)
      return []
    }
  }

  /**
   * Get performance stats for a specific word
   */
  static async getWordStats(
    userId: string,
    vocabularyId: string
  ): Promise<VocabularyPerformance | null> {
    try {
      const { data, error } = await supabase
        .from('vocabulary_performance')
        .select('*')
        .eq('user_id', userId)
        .eq('vocabulary_id', vocabularyId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        console.error('Error fetching word stats:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Exception in getWordStats:', error)
      return null
    }
  }

  /**
   * Get dashboard statistics for user
   * Returns words learned count, mastered count, and hard words
   */
  static async getDashboardStats(userId: string): Promise<{
    wordsLearned: number
    masteredWords: number
    hardWords: WeakWord[]
  }> {
    try {
      // Get all performance records for this user
      const { data, error } = await supabase
        .from('vocabulary_performance')
        .select('*')
        .eq('user_id', userId)

      if (error) {
        console.error('Error fetching dashboard stats:', error)
        return {
          wordsLearned: 0,
          masteredWords: 0,
          hardWords: []
        }
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

      return {
        wordsLearned,
        masteredWords,
        hardWords: hardWordsWithErrorRate
      }

    } catch (error) {
      console.error('Exception in getDashboardStats:', error)
      return {
        wordsLearned: 0,
        masteredWords: 0,
        hardWords: []
      }
    }
  }
}
