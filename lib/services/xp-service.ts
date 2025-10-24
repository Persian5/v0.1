// XP Service - Centralized business logic for XP management
// This service provides utility functions and configurations for XP

import { SyncService } from './sync-service'
import { AuthService } from './auth-service'
import { DatabaseService } from '@/lib/supabase/database'
import { LessonStep } from '../types'
import { supabase } from '@/lib/supabase/client'
import { makeStepKey } from '@/lib/utils/step-uid'

export interface XpReward {
  amount: number
  source: string
  description: string
}

// XP reward configurations - easily adjustable for game balancing
export const XP_REWARDS = {
  FLASHCARD_VIEW: { amount: 1, source: 'flashcard_view', description: 'Viewed flashcard' },
  FLASHCARD_FLIP: { amount: 1, source: 'flashcard_flip', description: 'Flipped flashcard' },
  QUIZ_CORRECT: { amount: 2, source: 'quiz_correct', description: 'Answered quiz correctly' },
  QUIZ_WRONG: { amount: 0, source: 'quiz_wrong', description: 'Answered quiz incorrectly' },
  INPUT_CORRECT: { amount: 2, source: 'input_correct', description: 'Completed input exercise' },
  INPUT_WRONG: { amount: 0, source: 'input_wrong', description: 'Failed input exercise' },
  MATCHING_COMPLETE: { amount: 3, source: 'matching_complete', description: 'Completed matching game' },
  TEXT_SEQUENCE_COMPLETE: { amount: 3, source: 'text_sequence_complete', description: 'Completed text sequence challenge' },
  FINAL_CHALLENGE: { amount: 4, source: 'final_challenge', description: 'Completed final challenge' },
  AUDIO_MEANING_CORRECT: { amount: 2, source: 'audio_meaning_correct', description: 'Correctly identified audio meaning' },
  AUDIO_SEQUENCE_COMPLETE: { amount: 3, source: 'audio_sequence_complete', description: 'Completed audio sequence challenge' },
  GRAMMAR_CONCEPT: { amount: 2, source: 'grammar_concept', description: 'Completed grammar concept' },
  STORY_CONVERSATION: { amount: 1, source: 'story_conversation', description: 'Story conversation choice' },
} as const

// XP utility functions
export class XpService {
  // Note: No longer using localStorage for XP - authenticated users get XP from Supabase only

  /**
   * UNIFIED XP CALCULATION: Get XP reward for a lesson step
   * Uses curriculum step.points as primary source, with intelligent fallbacks
   * 
   * @param step - The lesson step from curriculum.ts
   * @returns XpReward with amount, source, and description
   */
  static getStepXp(step: LessonStep): XpReward {
    // Use curriculum points as primary source
    const curriculumPoints = step.points
    
    // Get activity type reward for source and fallback
    const activityReward = this.getActivityTypeReward(step.type)
    
    // Validation: warn if curriculum points don't match expected activity XP
    if (process.env.NODE_ENV === 'development' && curriculumPoints !== activityReward.amount) {
      console.warn(
        `XP Mismatch: ${step.type} curriculum=${curriculumPoints}, expected=${activityReward.amount}`,
        { step }
      )
    }
    
    return {
      amount: curriculumPoints ?? activityReward.amount, // Use curriculum first, fallback to activity type
      source: activityReward.source,
      description: `Completed ${step.type} (${curriculumPoints ?? activityReward.amount} XP)`
    }
  }

  /**
   * ACTIVITY TYPE MAPPING: Map step types to XP_REWARDS
   * Provides fallback values and source mapping for step types
   */
  private static getActivityTypeReward(stepType: LessonStep['type']): XpReward {
    switch (stepType) {
      case 'flashcard':
        return XP_REWARDS.FLASHCARD_FLIP
      case 'quiz':
      case 'reverse-quiz':
        return XP_REWARDS.QUIZ_CORRECT
      case 'input':
        return XP_REWARDS.INPUT_CORRECT
      case 'matching':
        return XP_REWARDS.MATCHING_COMPLETE
      case 'audio-meaning':
        return XP_REWARDS.AUDIO_MEANING_CORRECT
      case 'audio-sequence':
        return XP_REWARDS.AUDIO_SEQUENCE_COMPLETE
      case 'text-sequence':
        return XP_REWARDS.TEXT_SEQUENCE_COMPLETE
      case 'grammar-concept':
        return XP_REWARDS.GRAMMAR_CONCEPT
      case 'final':
        return XP_REWARDS.FINAL_CHALLENGE
      case 'story-conversation':
        return XP_REWARDS.STORY_CONVERSATION
      case 'welcome':
      default:
        // Welcome steps and unknown types get 0 XP
        return { amount: 0, source: 'welcome', description: 'Welcome step' }
    }
  }

  /**
   * Get XP reward for a specific activity (LEGACY - maintained for backward compatibility)
   */
  static getReward(activityType: keyof typeof XP_REWARDS): XpReward {
    return XP_REWARDS[activityType]
  }

  /**
   * Calculate XP multiplier based on difficulty or other factors
   */
  static getMultiplier(factors: {
    difficulty?: 'easy' | 'medium' | 'hard'
    streak?: number
    timeBonus?: boolean
  }): number {
    let multiplier = 1

    // Difficulty multiplier
    if (factors.difficulty === 'hard') multiplier *= 1.5
    if (factors.difficulty === 'medium') multiplier *= 1.2
    
    // Streak multiplier (max 2x)
    if (factors.streak && factors.streak > 1) {
      multiplier *= Math.min(1 + (factors.streak - 1) * 0.1, 2)
    }
    
    // Time bonus (completed quickly)
    if (factors.timeBonus) multiplier *= 1.1

    return multiplier
  }

  /**
   * Calculate total XP for a lesson step with all bonuses
   */
  static calculateStepXp(
    basePoints: number,
    activityType: keyof typeof XP_REWARDS,
    factors: Parameters<typeof XpService.getMultiplier>[0] = {}
  ): number {
    const multiplier = this.getMultiplier(factors)
    return Math.round(basePoints * multiplier)
  }

  /**
   * Get XP level based on total XP (for future level system)
   */
  static getLevel(totalXp: number): number {
    // Simple level calculation - can be made more sophisticated
    return Math.floor(totalXp / 100) + 1
  }

  /**
   * Get XP needed for next level
   */
  static getXpForNextLevel(totalXp: number): number {
    const currentLevel = this.getLevel(totalXp)
    const xpNeededForCurrentLevel = (currentLevel - 1) * 100
    const xpNeededForNextLevel = currentLevel * 100
    return xpNeededForNextLevel - totalXp
  }

  /**
   * Get progress percentage to next level
   */
  static getLevelProgress(totalXp: number): number {
    const currentLevel = this.getLevel(totalXp)
    const xpForCurrentLevel = (currentLevel - 1) * 100
    const xpForNextLevel = currentLevel * 100
    const progressXp = totalXp - xpForCurrentLevel
    const levelXpRange = xpForNextLevel - xpForCurrentLevel
    
    return Math.round((progressXp / levelXpRange) * 100)
  }

  /**
   * Validate XP transaction (for security/anti-cheat)
   */
  static validateTransaction(transaction: {
    amount: number
    source: string
    timestamp: number
  }): boolean {
    // Basic validation rules
    if (transaction.amount < 0) return false
    if (transaction.amount > 100) return false // Max XP per action
    if (!transaction.source) return false
    if (Math.abs(Date.now() - transaction.timestamp) > 60000) return false // Within 1 minute
    
    return true
  }

  /**
   * Get formatted XP display string (always full number with thousands separator)
   */
  static formatXp(xp: number): string {
    return `${xp.toLocaleString()} XP`
  }

  /**
   * Get achievement status for XP milestones
   */
  static getAchievements(totalXp: number): string[] {
    const achievements = []
    
    if (totalXp >= 10) achievements.push('First Steps')
    if (totalXp >= 50) achievements.push('Getting Started')
    if (totalXp >= 100) achievements.push('Dedicated Learner')
    if (totalXp >= 500) achievements.push('Persian Explorer')
    if (totalXp >= 1000) achievements.push('Language Master')
    if (totalXp >= 5000) achievements.push('XP Champion')
    
    return achievements
  }

  // ===== SIMPLIFIED AUTHENTICATION-AWARE METHODS =====

  /**
   * Get user's total XP - authenticated users from Supabase only
   */
  static async getUserXp(): Promise<number> {
    const currentUser = await AuthService.getCurrentUser()
    
    if (currentUser && await AuthService.isEmailVerified(currentUser)) {
      // Authenticated user - get from Supabase only
      try {
        return await DatabaseService.getUserTotalXp(currentUser.id)
      } catch (error) {
        console.error('Failed to fetch user XP from database:', error)
        return 0 // Return 0 on error instead of localStorage fallback
      }
    } else {
      // Unauthenticated user - no XP tracking (they start fresh when they sign up)
      return 0
    }
  }

  /**
   * Add XP for authenticated users only
   */
  static async addUserXp(
    amount: number, 
    source: string, 
    metadata?: {
      lessonId?: string
      moduleId?: string
      activityType?: string
    }
  ): Promise<void> {
    const currentUser = await AuthService.getCurrentUser()
    
    if (currentUser && await AuthService.isEmailVerified(currentUser)) {
      // Authenticated user - queue for Supabase sync
      SyncService.queueXpTransaction({
        amount,
        source,
        lesson_id: metadata?.lessonId,
        metadata: {
          moduleId: metadata?.moduleId,
          activityType: metadata?.activityType
        }
      })
    }
    
    // No localStorage XP updates - purely Supabase dependent
  }

  /**
   * Initialize sync service (call this when app starts)
   */
  static initializeSyncService(): void {
    // Load any pending transactions from localStorage
    SyncService.loadPendingTransactionsFromStorage()
    
    // Start the sync service
    SyncService.startSync()
  }

  /**
   * Stop sync service (call this when app unmounts)
   */
  static stopSyncService(): void {
    SyncService.stopSync()
  }

  // ===== DEBUGGING/ADMIN METHODS =====

  /**
   * Get sync status (for debugging)
   */
  static getSyncStatus() {
    return SyncService.getQueueStatus()
  }

  /**
   * Force sync now (for testing)
   */
  static async forceSyncNow(): Promise<boolean> {
    return await SyncService.forceSyncNow()
  }

  // ===== IDEMPOTENT XP AWARDS (BACK BUTTON SAFE) =====

  /**
   * Award XP for a step using idempotency key.
   * Ensures users can only earn XP once per step, even with back button navigation.
   * 
   * Uses database-enforced uniqueness - race-proof and multi-tab safe.
   * LocalStorage cache for instant "already earned" checks (UX optimization).
   * 
   * @param userId - User ID
   * @param moduleId - Module ID (e.g., "module1")
   * @param lessonId - Lesson ID (e.g., "lesson2")
   * @param stepUid - Stable step identifier (e.g., "flashcard-salam")
   * @param amount - XP amount to award
   * @param source - XP source (e.g., "flashcard_flip")
   * @param metadata - Additional metadata to store
   * @returns Object with granted (boolean) and reason (string)
   */
  static async awardXpOnce({
    userId,
    moduleId,
    lessonId,
    stepUid,
    amount,
    source,
    metadata = {}
  }: {
    userId: string,
    moduleId: string,
    lessonId: string,
    stepUid: string,
    amount: number,
    source: string,
    metadata?: any
  }): Promise<{ granted: boolean, reason?: string, error?: any }> {
    // Build idempotency key (stable across app restarts)
    const idempotencyKey = makeStepKey(moduleId, lessonId, stepUid)
    
    // Optional: Check localStorage cache first for instant feedback
    // This prevents unnecessary network calls for steps user already completed
    const cacheKey = `xp-${userId}-${idempotencyKey}`
    if (typeof window !== 'undefined' && localStorage.getItem(cacheKey)) {
      console.log(`⏭️ XP already earned (cached): ${idempotencyKey}`)
      return { granted: false, reason: 'cached' }
    }
    
    try {
      // Call RPC function - single write, zero reads, race-proof
      const { data, error } = await supabase.rpc('award_step_xp_idem', {
        p_user_id: userId,
        p_idempotency_key: idempotencyKey,
        p_amount: amount,
        p_source: source,
        p_lesson_id: `${moduleId}/${lessonId}`,
        p_metadata: {
          moduleId,
          lessonId,
          stepUid,
          ...metadata
        }
      })
      
      if (error) {
        console.error('❌ Error awarding XP:', error)
        return { granted: false, reason: 'error', error }
      }
      
      const granted = data === true
      
      if (granted) {
        // XP awarded successfully - cache locally for instant future checks
        if (typeof window !== 'undefined') {
          localStorage.setItem(cacheKey, '1')
        }
        console.log(`✅ XP awarded: ${amount} (${source}) - ${idempotencyKey}`)
      } else {
        // XP already awarded previously - cache to prevent future calls
        if (typeof window !== 'undefined') {
          localStorage.setItem(cacheKey, '1')
        }
        console.log(`⏭️ XP already earned: ${idempotencyKey}`)
      }
      
      return { granted, reason: granted ? 'success' : 'already_awarded' }
      
    } catch (error) {
      console.error('❌ Exception awarding XP:', error)
      return { granted: false, reason: 'exception', error }
    }
  }

  /**
   * Clear XP cache (useful on logout or testing)
   */
  static clearXpCache(): void {
    if (typeof window === 'undefined') return
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('xp-')) {
        localStorage.removeItem(key)
      }
    })
    
    console.log('🧹 XP cache cleared')
  }
} 