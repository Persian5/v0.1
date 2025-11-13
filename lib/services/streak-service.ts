// Streak Service - Handles streak reading and display
// Note: Streak updates are automatic via database trigger (trg_update_streak)
// This service provides read-only access and helper functions

import { supabase } from '@/lib/supabase/client'
import { DatabaseService } from '@/lib/supabase/database'
import { AuthService } from './auth-service'

export interface StreakData {
  streakCount: number
  lastActivityDate: string | null // DATE format: YYYY-MM-DD
  lastStreakDate: string | null // DATE format: YYYY-MM-DD
}

export interface StreakMilestone {
  days: number
  message: string
  achieved: boolean
}

/**
 * Streak Service - Read-only service for streak data
 * 
 * IMPORTANT: Streak updates are handled automatically by database trigger
 * (trg_update_streak) whenever XP is awarded. This service only reads streak data.
 */
export class StreakService {
  
  /**
   * Update streak when learning activity occurs
   * Called when user attempts vocabulary questions (lesson/review)
   * Uses database function to update both last_activity_date and streak_count
   * 
   * OPTIMIZED: Client-side check prevents unnecessary RPC calls
   * - Checks cache first: if already updated today, skip RPC call
   * - Only calls RPC if we haven't updated today yet
   * - Updates cache after successful RPC call
   * 
   * @param userId - User ID
   * @returns Promise<void>
   */
  static async updateActivityDate(userId: string): Promise<void> {
    // Prevent concurrent calls for same user
    if (this.updateInProgress.has(userId)) {
      console.log(`⏳ Streak update already in progress for user ${userId}, skipping`)
      return
    }
    
    this.updateInProgress.add(userId)
    
    try {
      // Import SmartAuthService to check cache
      const { SmartAuthService } = await import('./smart-auth-service')
      
      // Check if cache needs invalidation (new day)
      SmartAuthService.shouldInvalidateCacheForNewDay()
      
      // Get user's timezone from profile (defaults to 'America/Los_Angeles')
      const userTimezone = SmartAuthService.getUserTimezone()
      
      // Get today's date in user's timezone (matches database function logic)
      // Format: YYYY-MM-DD
      const today = this.getTodayInTimezone(userTimezone)
      
      // Check cache: if we've already updated today (in user's timezone), skip RPC call
      const cachedLastActivity = SmartAuthService.getLastActivityDate()
      if (cachedLastActivity === today) {
        // Already updated today in user's timezone - no need to call RPC
        return
      }
      
      // Call the database function to update streak
      // This is the same function called by the XP trigger
      console.log(`🔄 Calling update_streak RPC for user: ${userId}`)
      const { data, error } = await supabase.rpc('update_streak', {
        p_user_id: userId
      })
      
      if (error) {
        console.error('❌ Failed to update streak via RPC:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        // Emit error event for UI visibility (non-blocking)
        SmartAuthService.emitEvent('streak-updated', { 
          success: false, 
          error: error.message 
        })
        // Non-critical - streak will update next time XP is awarded
      } else {
        console.log('✅ update_streak RPC called successfully')
        // Update cache to prevent duplicate calls today (in user's timezone)
        SmartAuthService.updateLastActivityDate(today)
        // Emit success event
        SmartAuthService.emitEvent('streak-updated', { 
          success: true,
          date: today
        })
      }
    } catch (error) {
      console.error('❌ Exception in updateActivityDate:', error)
      // Emit error event for UI visibility
      const { SmartAuthService } = await import('./smart-auth-service')
      SmartAuthService.emitEvent('streak-updated', { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      // Non-critical - don't throw
    } finally {
      // Always remove from in-progress set
      this.updateInProgress.delete(userId)
    }
  }
  
  /**
   * Get today's date string (YYYY-MM-DD) in user's timezone
   * Matches the logic used by the database function
   */
  private static getTodayInTimezone(timezone: string): string {
    try {
      // Use Intl.DateTimeFormat to get date in user's timezone
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      
      // Format returns YYYY-MM-DD directly
      return formatter.format(new Date())
    } catch (error) {
      // Fallback to UTC if timezone is invalid
      console.warn(`Invalid timezone "${timezone}", using UTC`, error)
      return new Date().toISOString().split('T')[0]
    }
  }

  /**
   * Get current streak for authenticated user
   * Returns streak count from user_profiles table
   * 
   * @returns Promise<number> - Current streak count (0 if no streak)
   */
  static async getCurrentStreak(): Promise<number> {
    const currentUser = await AuthService.getCurrentUser()
    
    if (!currentUser) {
      return 0 // No user = no streak
    }
    
    try {
      const profile = await DatabaseService.getUserProfile(currentUser.id)
      return profile?.streak_count ?? 0
    } catch (error) {
      console.error('Failed to fetch streak:', error)
      return 0
    }
  }
  
  /**
   * Get full streak data for authenticated user
   * Returns streak count and activity dates
   * 
   * @returns Promise<StreakData> - Streak data including count and dates
   */
  static async getStreakData(): Promise<StreakData> {
    const currentUser = await AuthService.getCurrentUser()
    
    if (!currentUser) {
      return {
        streakCount: 0,
        lastActivityDate: null,
        lastStreakDate: null
      }
    }
    
    try {
      const profile = await DatabaseService.getUserProfile(currentUser.id)
      
      if (!profile) {
        return {
          streakCount: 0,
          lastActivityDate: null,
          lastStreakDate: null
        }
      }
      
      return {
        streakCount: profile.streak_count ?? 0,
        lastActivityDate: profile.last_activity_date ?? null,
        lastStreakDate: profile.last_streak_date ?? null
      }
    } catch (error) {
      console.error('Failed to fetch streak data:', error)
      return {
        streakCount: 0,
        lastActivityDate: null,
        lastStreakDate: null
      }
    }
  }
  
  /**
   * Get streak for a specific user (by ID)
   * Used for leaderboards or admin views
   * 
   * @param userId - User ID to get streak for
   * @returns Promise<number> - Streak count for that user
   */
  static async getStreakForUser(userId: string): Promise<number> {
    try {
      const profile = await DatabaseService.getUserProfile(userId)
      return profile?.streak_count ?? 0
    } catch (error) {
      console.error(`Failed to fetch streak for user ${userId}:`, error)
      return 0
    }
  }
  
  /**
   * Check if user has achieved streak milestones
   * Returns array of milestones with achievement status
   * 
   * @param streakCount - Current streak count
   * @returns StreakMilestone[] - Array of milestones
   */
  static getStreakMilestones(streakCount: number): StreakMilestone[] {
    const milestones: StreakMilestone[] = [
      {
        days: 7,
        message: '7 Day Streak! 🔥',
        achieved: streakCount >= 7
      },
      {
        days: 30,
        message: '30 Day Streak! 🌟',
        achieved: streakCount >= 30
      },
      {
        days: 100,
        message: '100 Day Streak! 🏆',
        achieved: streakCount >= 100
      },
      {
        days: 365,
        message: '1 Year Streak! 👑',
        achieved: streakCount >= 365
      }
    ]
    
    return milestones
  }
  
  /**
   * Get next milestone to achieve
   * Returns the next unachieved milestone
   * 
   * @param streakCount - Current streak count
   * @returns StreakMilestone | null - Next milestone or null if all achieved
   */
  static getNextMilestone(streakCount: number): StreakMilestone | null {
    const milestones = this.getStreakMilestones(streakCount)
    return milestones.find(m => !m.achieved) ?? null
  }
  
  /**
   * Format streak count for display
   * Adds emoji and formatting
   * 
   * @param streakCount - Streak count to format
   * @returns string - Formatted streak string
   */
  static formatStreak(streakCount: number): string {
    if (streakCount === 0) {
      return 'No streak yet'
    }
    
    if (streakCount === 1) {
      return '1 day 🔥'
    }
    
    return `${streakCount} days 🔥`
  }
  
  /**
   * Check if streak is active (user earned XP today)
   * Note: This checks if last_activity_date is today in user's timezone
   * The trigger handles this automatically, but this can be used for display
   * 
   * @param lastActivityDate - Last activity date (DATE format: YYYY-MM-DD)
   * @param userTimezone - User's timezone (IANA format)
   * @returns boolean - True if streak is active today
   */
  static isStreakActiveToday(lastActivityDate: string | null, userTimezone: string): boolean {
    if (!lastActivityDate) {
      return false
    }
    
    // Get today's date in user's timezone
    const today = new Date()
    const todayInUserTz = new Date(today.toLocaleString('en-US', { timeZone: userTimezone }))
    const todayDateStr = todayInUserTz.toISOString().split('T')[0]
    
    return lastActivityDate === todayDateStr
  }
  
  /**
   * Get days until streak breaks
   * Returns 0 if streak is already broken, 1 if active today
   * 
   * @param lastActivityDate - Last activity date (DATE format: YYYY-MM-DD)
   * @param userTimezone - User's timezone (IANA format)
   * @returns number - Days until streak breaks (0 = broken, 1 = active today)
   */
  static getDaysUntilStreakBreaks(lastActivityDate: string | null, userTimezone: string): number {
    if (!lastActivityDate) {
      return 0 // No activity = streak broken
    }
    
    // Get today's date in user's timezone
    const today = new Date()
    const todayInUserTz = new Date(today.toLocaleString('en-US', { timeZone: userTimezone }))
    const todayDateStr = todayInUserTz.toISOString().split('T')[0]
    
    // Get yesterday's date
    const yesterday = new Date(todayInUserTz)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayDateStr = yesterday.toISOString().split('T')[0]
    
    if (lastActivityDate === todayDateStr) {
      return 1 // Active today - streak continues if they earn XP tomorrow
    } else if (lastActivityDate === yesterdayDateStr) {
      return 0 // Last activity was yesterday - streak broken if no XP today
    } else {
      return 0 // Last activity was more than 1 day ago - streak broken
    }
  }
}

