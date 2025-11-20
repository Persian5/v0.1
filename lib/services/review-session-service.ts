/**
 * Review Session Service
 * 
 * Handles review mode gameplay:
 * - Daily XP cap (1000 XP per 24-hour period, user timezone)
 * - Timezone detection and management
 * - Vocabulary fetching for filters
 * - Atomic XP updates with cap enforcement
 * 
 * Key Features:
 * - Timezone-aware daily reset (midnight user timezone)
 * - Browser timezone detection (defaults on first play)
 * - Atomic XP updates to prevent race conditions
 * - Cap enforcement (returns false if cap reached)
 */

import { supabase } from '@/lib/supabase/client'
import { VocabularyTrackingService, WeakWord } from './vocabulary-tracking-service'
import { GrammarService } from './grammar-service'
import { VocabularyItem } from '../types'

// ============================================================================
// TYPES
// ============================================================================

export type ReviewFilter = 'all-learned' | 'mastered' | 'hard-words'

export interface ReviewSessionConfig {
  filter: ReviewFilter
  limit?: number // Optional limit for vocabulary fetching
}

export interface ReviewXpStatus {
  canAward: boolean // Can user still earn XP?
  currentXp: number // Current XP earned today
  maxXp: number // Daily cap (1000)
  resetAt: string | null // When XP resets (ISO string, UTC)
}

// ============================================================================
// CONSTANTS
// ============================================================================

const REVIEW_XP_DAILY_CAP = 1000 // Max XP per day in review mode
const REVIEW_XP_PER_CORRECT = 1 // XP per correct answer in review games

// ============================================================================
// SERVICE
// ============================================================================

export class ReviewSessionService {
  
  /**
   * Detect browser timezone
   * Returns IANA timezone string (e.g., "America/Los_Angeles")
   * 
   * Uses sessionStorage cache to avoid repeated API calls within same session
   */
  static detectBrowserTimezone(): string {
    // Check sessionStorage cache first (per-session cache)
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('browser_timezone')
      if (cached) {
        return cached
      }
    }

    try {
      // Use Intl API to detect browser timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles'
      
      // Cache in sessionStorage for this browser session
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('browser_timezone', timezone)
      }
      
      return timezone
    } catch (error) {
      console.warn('Failed to detect browser timezone, using fallback:', error)
      const fallback = 'America/Los_Angeles'
      
      // Cache fallback too
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('browser_timezone', fallback)
      }
      
      return fallback
    }
  }

  /**
   * Calculate next midnight in user's timezone (as UTC timestamp)
   * 
   * Uses a simpler approach: calculate tomorrow's date in user timezone,
   * then convert to UTC timestamp for storage.
   * 
   * Note: This is approximate and may have edge cases around DST transitions.
   * For production, consider using a library like date-fns-tz.
   */
  static calculateNextMidnightUTC(timezone: string): string {
    try {
      // Get current time
      const now = new Date()
      
      // Format current time in user's timezone to get date components
      const formatter = new Intl.DateTimeFormat('en-CA', { // en-CA gives YYYY-MM-DD format
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      
      const todayStr = formatter.format(now)
      const [year, month, day] = todayStr.split('-').map(Number)
      
      // Create date object for tomorrow midnight in user's timezone
      // We'll create a date string that represents midnight in that timezone
      const tomorrowMidnightStr = `${year}-${String(month).padStart(2, '0')}-${String(day + 1).padStart(2, '0')}T00:00:00`
      
      // Parse as if it were in the user's timezone
      // JavaScript Date doesn't handle timezones well, so we'll use a workaround:
      // Create a date object and adjust for timezone offset
      
      // Get timezone offset for the user's timezone at that date
      const testDate = new Date(tomorrowMidnightStr + 'Z') // Start with UTC
      const offsetFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'longOffset'
      })
      
      // Simpler approach: just add 24 hours from now, rounded to next midnight
      // This is good enough for MVP
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      
      // Return UTC ISO string
      return tomorrow.toISOString()
      
    } catch (error) {
      console.error('Error calculating next midnight:', error)
      // Fallback: next midnight UTC
      const tomorrow = new Date()
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
      tomorrow.setUTCHours(0, 0, 0, 0)
      return tomorrow.toISOString()
    }
  }

  /**
   * Convert vocabulary_performance row to VocabularyItem
   * Handles BOTH base vocab AND grammar forms (e.g., "khoob|am")
   * 
   * Replaces duplicate resolution logic across review games.
   */
  static toVocabularyItem(word: { vocabulary_id: string }): VocabularyItem | null {
    try {
      // Uses enhanced GrammarService to handle "bad" and "bad|am" automatically
      const resolved = GrammarService.resolve(word.vocabulary_id)
      
      return {
        id: resolved.id,
        en: resolved.en,
        fa: resolved.fa,
        finglish: resolved.finglish,
        phonetic: resolved.phonetic || '',
        lessonId: resolved.lessonId || '',
        semanticGroup: resolved.semanticGroup
      }
    } catch (error) {
      console.warn(`[ReviewSessionService] Failed to resolve vocabulary: ${word.vocabulary_id}`, error)
      return null
    }
  }

  /**
   * Get vocabulary for a specific filter
   * Used by review games to fetch words based on user selection
   */
  static async getVocabularyForFilter(
    userId: string,
    filter: ReviewFilter,
    limit?: number
  ): Promise<WeakWord[]> {
    try {
      switch (filter) {
        case 'all-learned':
          return await VocabularyTrackingService.getAllLearnedWords(userId, limit)
        
        case 'mastered':
          return await VocabularyTrackingService.getMasteredWords(userId)
        
        case 'hard-words':
          return await VocabularyTrackingService.getHardWords(userId, limit || 50) // Default 50 for review
        
        default:
          console.warn(`Unknown filter: ${filter}, defaulting to all-learned`)
          return await VocabularyTrackingService.getAllLearnedWords(userId, limit)
      }
    } catch (error) {
      console.error('Error fetching vocabulary for filter:', error)
      return []
    }
  }

  /**
   * Check if user can still award review XP
   * Returns status including current XP, cap, and reset time
   */
  static async canAwardReviewXp(userId: string): Promise<ReviewXpStatus> {
    try {
      // First, ensure daily reset is handled if needed
      await this.resetDailyReviewXpIfNeeded(userId)

      // Fetch current user profile
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('review_xp_earned_today, review_xp_reset_at, timezone')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching review XP status:', error)
        return {
          canAward: false,
          currentXp: 0,
          maxXp: REVIEW_XP_DAILY_CAP,
          resetAt: null
        }
      }

      // PHASE 2 FIX: Query user_xp_transactions for truth
      // We use local browser midnight as the "start of day" since the user is active
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStart = today.toISOString()
      
      const { data: transactions, error: txError } = await supabase
        .from('user_xp_transactions')
        .select('amount')
        .eq('user_id', userId)
        .gte('created_at', todayStart)
        .like('source', 'review-%')
      
      const currentXp = transactions?.reduce((sum, row) => sum + row.amount, 0) || 0
      const canAward = currentXp < REVIEW_XP_DAILY_CAP

      return {
        canAward,
        currentXp,
        maxXp: REVIEW_XP_DAILY_CAP,
        resetAt: profile?.review_xp_reset_at || null
      }

    } catch (error) {
      console.error('Exception in canAwardReviewXp:', error)
      return {
        canAward: false,
        currentXp: 0,
        maxXp: REVIEW_XP_DAILY_CAP,
        resetAt: null
      }
    }
  }

  /**
   * Award review XP (atomic update with cap enforcement)
   * Uses unified XP service with idempotency.
   * 
   * @param userId User ID
   * @param amount XP amount
   * @param context Context for idempotency (game type, action ID)
   */
  static async awardReviewXp(
    userId: string,
    amount: number = REVIEW_XP_PER_CORRECT,
    context: {
      gameType: string,
      actionId: string,
      metadata?: any
    }
  ): Promise<{ awarded: boolean; newXp?: number; reason?: string }> {
    try {
      // First, ensure daily reset is handled if needed
      await this.resetDailyReviewXpIfNeeded(userId)

      // Check current status (daily cap)
      // PHASE 2: This query should eventually use user_xp_transactions sum
      // For now, we still rely on review_xp_earned_today which is kept in sync by the RPC
      const status = await this.canAwardReviewXp(userId)
      
      if (!status.canAward) {
        return {
          awarded: false,
          reason: 'Daily review XP cap reached'
        }
      }

      // Calculate how much XP we can actually award
      const remainingCap = REVIEW_XP_DAILY_CAP - status.currentXp
      const xpToAward = Math.min(amount, remainingCap)

      if (xpToAward <= 0) {
        return {
          awarded: false,
          reason: 'No XP remaining in daily cap'
        }
      }

      // Use Unified XP Service
      // We construct a unique stepUid based on the review action
      // format: review:[gameType]:[actionId]
      const stepUid = `review:${context.gameType}:${context.actionId}`
      
      const { XpService } = await import('./xp-service')
      
      const result = await XpService.awardXpOnce({
        userId,
        moduleId: 'review', // Virtual module
        lessonId: context.gameType, // Virtual lesson
        stepUid: context.actionId, // Specific action
        amount: xpToAward,
        source: `review-${context.gameType}`,
        metadata: {
          ...context.metadata,
          isReview: true,
          gameType: context.gameType
        }
      })

      if (!result.granted) {
         // If already awarded, we consider it "success" from the UI perspective (idempotent)
         // but return the reason for debugging
        return {
          awarded: false,
           reason: result.reason || 'already_awarded',
           newXp: result.newXp
        }
      }

      console.log(`✅ Review XP awarded: ${xpToAward} XP via unified service`)

      return {
        awarded: true,
        newXp: result.newXp
      }

    } catch (error) {
      console.error('Exception in awardReviewXp:', error)
      return {
        awarded: false,
        reason: 'Unexpected error'
      }
    }
  }

  /**
   * Reset daily review XP if needed (check if reset_at has passed)
   * 
   * This should be called before any XP operations to ensure
   * accurate daily tracking.
   */
  static async resetDailyReviewXpIfNeeded(userId: string): Promise<void> {
    try {
      // Fetch user profile
      const { data: profile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('review_xp_reset_at, timezone, review_xp_earned_today')
        .eq('id', userId)
        .single()

      if (fetchError) {
        console.error('Error fetching profile for reset check:', fetchError)
        return
      }

      const now = new Date()
      const resetAt = profile?.review_xp_reset_at

      // If no reset_at set, initialize it (first time playing review games)
      if (!resetAt) {
        const timezone = profile?.timezone || this.detectBrowserTimezone()
        const nextMidnight = this.calculateNextMidnightUTC(timezone)

        await supabase
          .from('user_profiles')
          .update({
            review_xp_reset_at: nextMidnight,
            timezone: timezone // Update timezone if not set
          })
          .eq('id', userId)

        return
      }

      // Check if reset time has passed
      const resetTime = new Date(resetAt)
      if (now >= resetTime) {
        // Reset needed - calculate next midnight
        const timezone = profile?.timezone || this.detectBrowserTimezone()
        const nextMidnight = this.calculateNextMidnightUTC(timezone)

        await supabase
          .from('user_profiles')
          .update({
            review_xp_earned_today: 0,
            review_xp_reset_at: nextMidnight,
            timezone: timezone // Update timezone if changed
          })
          .eq('id', userId)

        console.log(`✅ Reset review XP for user ${userId} - next reset: ${nextMidnight}`)
      }

    } catch (error) {
      console.error('Exception in resetDailyReviewXpIfNeeded:', error)
      // Don't throw - this is a background operation
    }
  }

  /**
   * Initialize user timezone (call on first review game play)
   * Updates user profile with browser timezone if not already set
   * 
   * Optimization: Checks profile FIRST before detecting browser timezone
   * to avoid unnecessary API calls when timezone already exists
   */
  static async initializeUserTimezone(userId: string): Promise<void> {
    try {
      // STEP 1: Check profile FIRST (no browser API call if timezone already set)
      // Use review_xp_reset_at as flag: if NULL, timezone hasn't been initialized yet
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('timezone, review_xp_reset_at')
        .eq('id', userId)
        .single()

      // STEP 2: Only initialize if review_xp_reset_at is NULL (hasn't been initialized yet)
      // This works even if user's actual timezone is 'America/Los_Angeles'
      const needsTimezone = !profile?.review_xp_reset_at
      
      if (needsTimezone) {
        // Only call detectBrowserTimezone() if we actually need to detect
        const browserTimezone = this.detectBrowserTimezone()
        const nextMidnight = this.calculateNextMidnightUTC(browserTimezone)

        await supabase
          .from('user_profiles')
          .update({
            timezone: browserTimezone,
            review_xp_reset_at: nextMidnight // Set flag that timezone was initialized
          })
          .eq('id', userId)

        console.log(`✅ Initialized timezone for user ${userId}: ${browserTimezone}`)
      }
      // If review_xp_reset_at exists, timezone was already initialized (fast path)

    } catch (error) {
      console.error('Exception in initializeUserTimezone:', error)
      // Don't throw - non-critical
    }
  }
}

