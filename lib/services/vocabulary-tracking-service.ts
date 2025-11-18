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
import { StreakService } from './streak-service'

// ============================================================================
// TYPES
// ============================================================================

export interface VocabularyPerformance {
  id: string
  user_id: string
  vocabulary_id: string  // "khoob|am" or "salam"
  word_text: string
  total_attempts: number
  total_correct: number
  total_incorrect: number
  consecutive_correct: number
  mastery_level: number  // 0-5
  last_seen_at: string | null
  last_correct_at: string | null  // Added for decay system
  next_review_at: string | null
  created_at: string
  updated_at: string
  
  // NEW: Grammar form fields (added 2025-01-18)
  base_vocab_id?: string | null       // "khoob" (for "khoob|am")
  suffix_id?: string | null            // "am" (for "khoob|am")
  is_grammar_form: boolean             // true for grammar forms, false for base vocab
  prefix_id?: string | null            // For future use (Module 5+)
  suffix_ids?: string[] | null         // For future compound suffixes
  grammar_metadata?: any | null        // For future grammar types
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
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse grammar form ID to extract components
 * 
 * Format: "base|suffix" (e.g., "khoob|am")
 * 
 * @param vocabularyId - Vocabulary ID (e.g., "khoob|am" or "salam")
 * @returns Parsed grammar form components
 * 
 * @example
 * parseGrammarFormId("khoob|am")
 * // Returns: { baseVocabId: "khoob", suffixId: "am", isGrammarForm: true }
 * 
 * parseGrammarFormId("salam")
 * // Returns: { baseVocabId: null, suffixId: null, isGrammarForm: false }
 */
function parseGrammarFormId(vocabularyId: string): {
  baseVocabId: string | null
  suffixId: string | null
  isGrammarForm: boolean
} {
  // Check if this is a grammar form (contains delimiter)
  if (vocabularyId.includes('|')) {
    const parts = vocabularyId.split('|')
    
    if (parts.length === 2) {
      return {
        baseVocabId: parts[0],   // e.g., "khoob"
        suffixId: parts[1],       // e.g., "am"
        isGrammarForm: true
      }
    }
    
    // Future: Handle complex forms like "prefix|base|suffix"
    // For now, treat as invalid and return as base vocab
    console.warn(`⚠️ Invalid grammar form ID format: ${vocabularyId}`)
  }
  
  // Base vocabulary (no grammar)
  return {
    baseVocabId: null,
    suffixId: null,
    isGrammarForm: false
  }
}

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

      // Parse grammar form (if applicable)
      const { baseVocabId, suffixId, isGrammarForm } = parseGrammarFormId(vocabularyId)

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
          context_data: {
            // Grammar form metadata (for analytics)
            base_vocab_id: baseVocabId,
            suffix_id: suffixId,
            is_grammar_form: isGrammarForm,
            ...contextData
          }
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
        isCorrect,
        baseVocabId,
        suffixId,
        isGrammarForm
      )

      if (!updated) {
        console.error('❌ Failed to update vocabulary performance')
        return false
      }

      // 3. Update last_activity_date (tracks learning engagement)
      // Non-blocking - don't fail if this errors
      StreakService.updateActivityDate(userId).catch(err => {
        console.warn('Failed to update activity date (non-critical):', err)
      })

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
   * - Grammar form metadata
   */
  private static async updatePerformance(
    userId: string,
    vocabularyId: string,
    wordText: string,
    isCorrect: boolean,
    baseVocabId: string | null,
    suffixId: string | null,
    isGrammarForm: boolean
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

        const insertData: any = {
          user_id: userId,
          vocabulary_id: vocabularyId,
          word_text: wordText,
          total_attempts: 1,
          total_correct: isCorrect ? 1 : 0,
          total_incorrect: isCorrect ? 0 : 1,
          consecutive_correct: isCorrect ? 1 : 0,
          mastery_level: newMasteryLevel,
          last_seen_at: now,
          next_review_at: nextReviewAt,
          // Grammar form fields
          base_vocab_id: baseVocabId,
          suffix_id: suffixId,
          is_grammar_form: isGrammarForm,
          // Future fields (null for now)
          prefix_id: null,
          suffix_ids: null,
          grammar_metadata: null
        }
        
        // Set last_correct_at if first attempt is correct
        if (isCorrect) {
          insertData.last_correct_at = now
        }

        const { error: insertError } = await supabase
          .from('vocabulary_performance')
          .insert(insertData)

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

      // Update last_correct_at if this is a correct answer
      const updateData: any = {
        word_text: wordText, // Keep label fresh
        total_attempts: current.total_attempts + 1,
        total_correct: current.total_correct + (isCorrect ? 1 : 0),
        total_incorrect: current.total_incorrect + (isCorrect ? 0 : 1),
        consecutive_correct: newConsecutive,
        mastery_level: newMasteryLevel,
        last_seen_at: now,
        next_review_at: nextReviewAt,
        // Grammar form fields (update in case they changed)
        base_vocab_id: baseVocabId,
        suffix_id: suffixId,
        is_grammar_form: isGrammarForm
      }
      
      // Set last_correct_at if answer is correct (for decay system)
      if (isCorrect) {
        updateData.last_correct_at = now
      }

      const { error: updateError } = await supabase
        .from('vocabulary_performance')
        .update(updateData)
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
   * Get all learned words (any word with total_attempts > 0)
   * Used for "All Learned Words" filter in review mode
   */
  static async getAllLearnedWords(userId: string, limit?: number): Promise<WeakWord[]> {
    try {
      let query = supabase
        .from('vocabulary_performance')
        .select('*')
        .eq('user_id', userId)
        .gt('total_attempts', 0)
        .order('last_seen_at', { ascending: false })

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching all learned words:', error)
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
      console.error('Exception in getAllLearnedWords:', error)
      return []
    }
  }

  /**
   * Get hard words (matches dashboard logic)
   * Returns words with:
   * - total_attempts >= 2 (minimum attempts for meaningful error rate)
   * - Sorted by error rate DESC (highest error rate first)
   * - Limited to top N words (default 10, but can be overridden for review mode)
   * 
   * Used for "Words to Review" filter in review mode
   */
  static async getHardWords(userId: string, limit: number = 10): Promise<WeakWord[]> {
    try {
      const { data, error } = await supabase
        .from('vocabulary_performance')
        .select('*')
        .eq('user_id', userId)
        .gte('total_attempts', 2) // Minimum 2 attempts

      if (error) {
        console.error('Error fetching hard words:', error)
        return []
      }

      // Calculate error rate and sort by highest error rate first
      const hardWordsWithErrorRate = (data || [])
        .map(d => ({
          vocabulary_id: d.vocabulary_id,
          word_text: d.word_text,
          consecutive_correct: d.consecutive_correct,
          total_attempts: d.total_attempts,
          total_correct: d.total_correct,
          total_incorrect: d.total_incorrect,
          accuracy: d.total_attempts > 0 ? (d.total_correct / d.total_attempts) * 100 : 0,
          errorRate: d.total_attempts > 0 ? (d.total_incorrect / d.total_attempts) : 0,
          last_seen_at: d.last_seen_at
        }))
        .sort((a, b) => b.errorRate - a.errorRate) // Highest error rate first
        .slice(0, limit) // Top N hardest words
        .map(({ errorRate, ...rest }) => rest) // Remove errorRate from output

      return hardWordsWithErrorRate

    } catch (error) {
      console.error('Exception in getHardWords:', error)
      return []
    }
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
   * Uses SQL view (user_word_mastery) for single source of truth
   * Returns words learned count, mastered count, hard words, and unclassified count
   */
  static async getDashboardStats(userId: string): Promise<{
    wordsLearned: number
    masteredWords: number
    hardWords: WeakWord[]
    unclassifiedWords: number
    wordsToReview: WeakWord[]
  }> {
    try {
      // Query the SQL view (single source of truth for mastery logic)
      // Optimized: Only select fields we need (reduces data transfer)
      const { data, error } = await supabase
        .from('user_word_mastery')
        .select(`
          vocabulary_id,
          word_text,
          total_attempts,
          total_correct,
          total_incorrect,
          consecutive_correct,
          status,
          accuracy,
          error_rate,
          last_seen_at,
          next_review_at
        `)
        .eq('user_id', userId)

      if (error) {
        console.error('Error fetching dashboard stats from view:', error)
        // Fallback to old method if view doesn't exist yet
        return await this.getDashboardStatsFallback(userId)
      }

      const words = data || []

      // Words Learned: Any word with total_attempts > 0
      const wordsLearned = words.filter(w => w.total_attempts > 0).length

      // Mastered Words: status = 'mastered'
      const masteredWords = words.filter(w => w.status === 'mastered').length

      // Hard Words: status = 'hard', sorted by error_rate DESC
      const hardWords = words
        .filter(w => w.status === 'hard')
        .sort((a, b) => (b.error_rate || 0) - (a.error_rate || 0))
        .slice(0, 10) // Top 10 hardest words
        .map(w => ({
          vocabulary_id: w.vocabulary_id,
          word_text: w.word_text,
          consecutive_correct: w.consecutive_correct,
          total_attempts: w.total_attempts,
          total_correct: w.total_correct,
          total_incorrect: w.total_incorrect,
          accuracy: w.accuracy || 0,
          last_seen_at: w.last_seen_at
        }))

      // Unclassified Words: status = 'unclassified'
      const unclassifiedWords = words.filter(w => w.status === 'unclassified').length

      // Words to Review: SRS schedule (next_review_at <= NOW())
      const wordsToReview = words
        .filter(w => w.next_review_at && new Date(w.next_review_at) <= new Date())
        .sort((a, b) => {
          const aDate = a.next_review_at ? new Date(a.next_review_at).getTime() : 0
          const bDate = b.next_review_at ? new Date(b.next_review_at).getTime() : 0
          return aDate - bDate // Oldest review dates first
        })
        .slice(0, 10) // Top 10 words due for review
        .map(w => ({
          vocabulary_id: w.vocabulary_id,
          word_text: w.word_text,
          consecutive_correct: w.consecutive_correct,
          total_attempts: w.total_attempts,
          total_correct: w.total_correct,
          total_incorrect: w.total_incorrect,
          accuracy: w.accuracy || 0,
          last_seen_at: w.last_seen_at
        }))

      return {
        wordsLearned,
        masteredWords,
        hardWords,
        unclassifiedWords,
        wordsToReview
      }

    } catch (error) {
      console.error('Exception in getDashboardStats:', error)
      // Fallback to old method on error
      return await this.getDashboardStatsFallback(userId)
    }
  }

  /**
   * Fallback method using old logic (if view doesn't exist yet)
   * @private
   */
  private static async getDashboardStatsFallback(userId: string): Promise<{
    wordsLearned: number
    masteredWords: number
    hardWords: WeakWord[]
    unclassifiedWords: number
    wordsToReview: WeakWord[]
  }> {
    try {
      const { data, error } = await supabase
        .from('vocabulary_performance')
        .select('*')
        .eq('user_id', userId)

      if (error) {
        console.error('Error fetching dashboard stats (fallback):', error)
        return {
          wordsLearned: 0,
          masteredWords: 0,
          hardWords: [],
          unclassifiedWords: 0,
          wordsToReview: []
        }
      }

      const performances = data || []

      // Words Learned: Any word with total_attempts > 0
      const wordsLearned = performances.filter(p => p.total_attempts > 0).length

      // Mastered Words: NEW CRITERIA - consecutive_correct >= 5 AND accuracy >= 90% AND total_attempts >= 3
      const masteredWords = performances.filter(p => {
        if (p.total_attempts < 3) return false
        const accuracy = p.total_attempts > 0 ? (p.total_correct / p.total_attempts) * 100 : 0
        return p.consecutive_correct >= 5 && accuracy >= 90
      }).length

      // Hard Words: NEW CRITERIA - (accuracy < 70% OR consecutive_correct < 2) AND total_attempts >= 2 AND NOT mastered
      const masteredVocabIds = new Set(
        performances
          .filter(p => {
            if (p.total_attempts < 3) return false
            const accuracy = p.total_attempts > 0 ? (p.total_correct / p.total_attempts) * 100 : 0
            return p.consecutive_correct >= 5 && accuracy >= 90
          })
          .map(p => p.vocabulary_id)
      )

      const hardWords = performances
        .filter(p => {
          if (p.total_attempts < 2) return false
          if (masteredVocabIds.has(p.vocabulary_id)) return false // Mutual exclusivity
          const accuracy = p.total_attempts > 0 ? (p.total_correct / p.total_attempts) * 100 : 0
          return accuracy < 70 || p.consecutive_correct < 2
        })
        .map(p => ({
          vocabulary_id: p.vocabulary_id,
          word_text: p.word_text,
          consecutive_correct: p.consecutive_correct,
          total_attempts: p.total_attempts,
          total_correct: p.total_correct,
          total_incorrect: p.total_incorrect,
          accuracy: p.total_attempts > 0 ? (p.total_correct / p.total_attempts) * 100 : 0,
          last_seen_at: p.last_seen_at
        }))
        .sort((a, b) => {
          const aErrorRate = a.total_attempts > 0 ? (a.total_incorrect / a.total_attempts) : 0
          const bErrorRate = b.total_attempts > 0 ? (b.total_incorrect / b.total_attempts) : 0
          return bErrorRate - aErrorRate
        })
        .slice(0, 10)

      // Unclassified Words: total_attempts < 3
      const unclassifiedWords = performances.filter(p => p.total_attempts > 0 && p.total_attempts < 3).length

      // Words to Review: SRS schedule
      const wordsToReview = performances
        .filter(p => p.next_review_at && new Date(p.next_review_at) <= new Date())
        .sort((a, b) => {
          const aDate = a.next_review_at ? new Date(a.next_review_at).getTime() : 0
          const bDate = b.next_review_at ? new Date(b.next_review_at).getTime() : 0
          return aDate - bDate
        })
        .slice(0, 10)
        .map(p => ({
          vocabulary_id: p.vocabulary_id,
          word_text: p.word_text,
          consecutive_correct: p.consecutive_correct,
          total_attempts: p.total_attempts,
          total_correct: p.total_correct,
          total_incorrect: p.total_incorrect,
          accuracy: p.total_attempts > 0 ? (p.total_correct / p.total_attempts) * 100 : 0,
          last_seen_at: p.last_seen_at
        }))

      return {
        wordsLearned,
        masteredWords,
        hardWords,
        unclassifiedWords,
        wordsToReview
      }
    } catch (error) {
      console.error('Exception in getDashboardStatsFallback:', error)
      return {
        wordsLearned: 0,
        masteredWords: 0,
        hardWords: [],
        unclassifiedWords: 0,
        wordsToReview: []
      }
    }
  }
}
