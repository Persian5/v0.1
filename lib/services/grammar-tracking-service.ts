/**
 * Grammar Tracking Service
 * 
 * Tracks user performance on grammar concepts for analytics.
 * 
 * Key Features:
 * - Records every grammar attempt
 * - Aggregates performance stats (correct/incorrect counts)
 * - NO XP modification
 * - NO progress modification
 * - NO streak modification
 * - Analytics/logging only
 */

import { supabase } from '@/lib/supabase/client'

// ============================================================================
// TYPES
// ============================================================================

export interface GrammarPerformance {
  id: string
  user_id: string
  concept_id: string
  total_attempts: number
  total_correct: number
  total_incorrect: number
  last_seen_at: string | null
  last_correct_at: string | null
  created_at: string
  updated_at: string
}

export interface GrammarAttempt {
  id?: string
  user_id: string
  concept_id: string
  step_type: string  // 'grammar-intro', 'grammar-fill-blank'
  module_id?: string
  lesson_id?: string
  step_uid?: string
  is_correct: boolean
  time_spent_ms?: number
  context_data?: any
  created_at?: string
}

export interface LogGrammarAttemptParams {
  userId: string
  conceptId: string
  stepType: 'grammar-intro' | 'grammar-fill-blank'
  isCorrect: boolean
  timeSpentMs?: number
  moduleId?: string
  lessonId?: string
  stepUid?: string
  contextData?: any
}

// ============================================================================
// SERVICE
// ============================================================================

export class GrammarTrackingService {
  
  /**
   * Log a grammar attempt and update performance
   * 
   * This is the MAIN function to call from grammar components.
   * It handles both logging the attempt and updating aggregate stats.
   * 
   * IMPORTANT: This does NOT affect XP, streaks, or progress.
   */
  static async logGrammarAttempt(params: LogGrammarAttemptParams): Promise<boolean> {
    try {
      const {
        userId,
        conceptId,
        stepType,
        isCorrect,
        timeSpentMs,
        moduleId,
        lessonId,
        stepUid,
        contextData
      } = params

      // 1. Log the detailed attempt
      const { error: attemptError } = await supabase
        .from('grammar_attempts')
        .insert({
          user_id: userId,
          concept_id: conceptId,
          step_type: stepType,
          is_correct: isCorrect,
          time_spent_ms: timeSpentMs,
          module_id: moduleId,
          lesson_id: lessonId,
          step_uid: stepUid,
          context_data: contextData
        })

      if (attemptError) {
        console.error('❌ Failed to log grammar attempt:', attemptError)
        return false
      }

      // 2. Update or create performance record
      const updated = await this.updatePerformance(
        userId,
        conceptId,
        isCorrect
      )

      if (!updated) {
        console.error('❌ Failed to update grammar performance')
        return false
      }

      console.log(`✅ Tracked grammar ${conceptId}: ${isCorrect ? 'correct' : 'incorrect'}`)
      return true

    } catch (error) {
      console.error('❌ Exception in logGrammarAttempt:', error)
      return false
    }
  }

  /**
   * Update performance record (upsert logic)
   * 
   * Handles:
   * - Incrementing counters
   * - Updating timestamps
   * - NO mastery levels (simpler than vocabulary)
   */
  private static async updatePerformance(
    userId: string,
    conceptId: string,
    isCorrect: boolean
  ): Promise<boolean> {
    try {
      const now = new Date().toISOString()

      // Fetch current performance
      const { data: current, error: fetchError } = await supabase
        .from('grammar_performance')
        .select('*')
        .eq('user_id', userId)
        .eq('concept_id', conceptId)
        .maybeSingle()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error fetching grammar performance:', fetchError)
        return false
      }

      if (!current) {
        // First attempt - INSERT
        const { error: insertError } = await supabase
          .from('grammar_performance')
          .insert({
            user_id: userId,
            concept_id: conceptId,
            total_attempts: 1,
            total_correct: isCorrect ? 1 : 0,
            total_incorrect: isCorrect ? 0 : 1,
            last_seen_at: now,
            last_correct_at: isCorrect ? now : null
          })

        if (insertError) {
          console.error('❌ Failed to insert grammar performance:', insertError)
          return false
        }
      } else {
        // Update existing record
        const { error: updateError } = await supabase
          .from('grammar_performance')
          .update({
            total_attempts: current.total_attempts + 1,
            total_correct: current.total_correct + (isCorrect ? 1 : 0),
            total_incorrect: current.total_incorrect + (isCorrect ? 0 : 1),
            last_seen_at: now,
            last_correct_at: isCorrect ? now : current.last_correct_at,
            updated_at: now
          })
          .eq('id', current.id)

        if (updateError) {
          console.error('❌ Failed to update grammar performance:', updateError)
          return false
        }
      }

      return true
    } catch (error) {
      console.error('❌ Exception in updatePerformance:', error)
      return false
    }
  }

  /**
   * Get grammar performance for a user
   * (For future analytics dashboard - not needed now)
   */
  static async getUserGrammarPerformance(userId: string): Promise<GrammarPerformance[]> {
    try {
      const { data, error } = await supabase
        .from('grammar_performance')
        .select('*')
        .eq('user_id', userId)
        .order('last_seen_at', { ascending: false })

      if (error) {
        console.error('❌ Failed to fetch grammar performance:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('❌ Exception in getUserGrammarPerformance:', error)
      return []
    }
  }
}

