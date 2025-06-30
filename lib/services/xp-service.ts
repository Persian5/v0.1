// XP Service - Centralized business logic for XP management
// This service provides utility functions and configurations for XP

import { SyncService } from './sync-service'
import { AuthService } from './auth-service'
import { DatabaseService } from '@/lib/supabase/database'

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
  FINAL_CHALLENGE: { amount: 4, source: 'final_challenge', description: 'Completed final challenge' },
  LESSON_COMPLETE: { amount: 20, source: 'lesson_complete', description: 'Completed entire lesson' },
  STREAK_BONUS: { amount: 5, source: 'streak_bonus', description: 'Daily streak bonus' },
  PERFECT_LESSON: { amount: 15, source: 'perfect_lesson', description: 'Completed lesson without mistakes' },
} as const

// XP utility functions
export class XpService {
  // Note: No longer using localStorage for XP - authenticated users get XP from Supabase only

  /**
   * Get XP reward for a specific activity
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
   * Get formatted XP display string
   */
  static formatXp(xp: number): string {
    if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M XP`
    if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K XP`
    return `${xp} XP`
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
} 