// Daily Goal Service - Handles daily XP goal tracking and progress
// Calculates daily XP from user_xp_transactions (timezone-aware)
// Compares against daily_goal_xp from user_profiles

import { supabase } from '@/lib/supabase/client'
import { DatabaseService } from '@/lib/supabase/database'
import { AuthService } from './auth-service'

export interface DailyGoalProgress {
  earned: number // XP earned today (in user timezone)
  goal: number // Daily goal XP (from user_profiles.daily_goal_xp)
  percentage: number // Percentage of goal achieved (0-100)
  remaining: number // XP remaining to reach goal
  isMet: boolean // Whether goal has been met
}

export interface DailyGoalData {
  goal: number // Daily goal XP
  progress: DailyGoalProgress
  timezone: string // User's timezone
}

/**
 * Daily Goal Service - Tracks daily XP progress against user-defined goals
 * 
 * IMPORTANT: Daily XP is calculated from user_xp_transactions table
 * Filtered by today's date in user's timezone. No separate tracking needed.
 */
export class DailyGoalService {
  
  /**
   * Get user's daily goal XP
   * Returns the goal from user_profiles.daily_goal_xp (default: 50)
   * 
   * @param userId - User ID (optional, uses current user if not provided)
   * @returns Promise<number> - Daily goal XP (1-1000)
   */
  static async getDailyGoal(userId?: string): Promise<number> {
    const targetUserId = userId || (await AuthService.getCurrentUser())?.id
    
    if (!targetUserId) {
      return 50 // Default goal for unauthenticated users
    }
    
    try {
      const profile = await DatabaseService.getUserProfile(targetUserId)
      return profile?.daily_goal_xp ?? 50
    } catch (error) {
      console.error('Failed to fetch daily goal:', error)
      return 50 // Default on error
    }
  }
  
  /**
   * Set user's daily goal XP
   * Updates user_profiles.daily_goal_xp with validation
   * 
   * @param goalXp - New daily goal (1-1000 XP)
   * @param userId - User ID (optional, uses current user if not provided)
   * @returns Promise<{ success: boolean; error?: string }>
   */
  static async setDailyGoal(
    goalXp: number,
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    // Validation: goal must be between 1 and 1000
    if (!Number.isInteger(goalXp) || goalXp < 1 || goalXp > 1000) {
      return {
        success: false,
        error: 'Daily goal must be between 1 and 1000 XP'
      }
    }
    
    const targetUserId = userId || (await AuthService.getCurrentUser())?.id
    
    if (!targetUserId) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }
    
    try {
      await DatabaseService.updateUserProfile(targetUserId, {
        daily_goal_xp: goalXp
      })
      
      return { success: true }
    } catch (error) {
      console.error('Failed to update daily goal:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update daily goal'
      }
    }
  }
  
  /**
   * Get current date in user's timezone
   * Returns date string in YYYY-MM-DD format
   * Matches database function logic exactly (uses Intl.DateTimeFormat)
   * 
   * @param timezone - IANA timezone string (e.g., "America/Los_Angeles")
   * @returns string - Date string in YYYY-MM-DD format
   */
  private static getTodayInTimezone(timezone: string): string {
    try {
      // Use Intl.DateTimeFormat to match database function logic exactly
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      return formatter.format(new Date())
    } catch (error) {
      // Fallback to UTC if timezone is invalid
      console.warn(`Invalid timezone "${timezone}", using UTC`, error)
      return new Date().toISOString().split('T')[0]
    }
  }
  
  /**
   * Calculate XP earned today (in user's timezone)
   * Uses optimized database function for server-side filtering
   * 
   * OPTIMIZATION: Uses PostgreSQL function get_xp_earned_today() for efficient
   * timezone-aware filtering. Falls back to client-side calculation if function unavailable.
   * 
   * @param userId - User ID
   * @param timezone - User's timezone (IANA format)
   * @returns Promise<number> - Total XP earned today
   */
  static async getXpEarnedToday(userId: string, timezone: string): Promise<number> {
    try {
      // Try to use database function first (most efficient)
      const { data: functionResult, error: functionError } = await supabase
        .rpc('get_xp_earned_today', {
          p_user_id: userId,
          p_timezone: timezone
        })
      
      if (!functionError && functionResult !== null) {
        return functionResult as number
      }
      
      // Fallback: Client-side calculation (if function doesn't exist yet)
      // This handles migration period where function might not be deployed
      console.warn('Database function get_xp_earned_today not available, using fallback:', functionError)
      
      const todayDateStr = this.getTodayInTimezone(timezone)
      
      // Get transactions from last 25 hours (safety margin for timezone edge cases)
      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000)
      
      const { data: transactions, error } = await supabase
        .from('user_xp_transactions')
        .select('amount, created_at')
        .eq('user_id', userId)
        .gte('created_at', twentyFiveHoursAgo.toISOString())
      
      if (error) {
        console.error('Error fetching XP transactions:', error)
        return 0
      }
      
      if (!transactions || transactions.length === 0) {
        return 0
      }
      
      // Filter transactions that occurred today in user's timezone
      // Use Intl.DateTimeFormat to match database function logic exactly
      let totalXpToday = 0
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      
      for (const transaction of transactions) {
        const transactionDate = new Date(transaction.created_at)
        const transactionDateStr = formatter.format(transactionDate)
        
        if (transactionDateStr === todayDateStr) {
          totalXpToday += transaction.amount || 0
        }
      }
      
      return totalXpToday
    } catch (error) {
      console.error('Error calculating XP earned today:', error)
      return 0
    }
  }
  
  /**
   * Get daily goal progress
   * Returns earned XP, goal, percentage, and remaining XP
   * 
   * @param userId - User ID (optional, uses current user if not provided)
   * @returns Promise<DailyGoalProgress>
   */
  static async getDailyGoalProgress(userId?: string): Promise<DailyGoalProgress> {
    const targetUserId = userId || (await AuthService.getCurrentUser())?.id
    
    if (!targetUserId) {
      return {
        earned: 0,
        goal: 50,
        percentage: 0,
        remaining: 50,
        isMet: false
      }
    }
    
    try {
      const profile = await DatabaseService.getUserProfile(targetUserId)
      
      if (!profile) {
        return {
          earned: 0,
          goal: 50,
          percentage: 0,
          remaining: 50,
          isMet: false
        }
      }
      
      const goal = profile.daily_goal_xp ?? 50
      const timezone = profile.timezone || 'America/Los_Angeles'
      
      // Calculate XP earned today
      const earned = await this.getXpEarnedToday(targetUserId, timezone)
      
      // Calculate progress
      const percentage = goal > 0 ? Math.min(100, Math.round((earned / goal) * 100)) : 0
      const remaining = Math.max(0, goal - earned)
      const isMet = earned >= goal
      
      return {
        earned,
        goal,
        percentage,
        remaining,
        isMet
      }
    } catch (error) {
      console.error('Error calculating daily goal progress:', error)
      return {
        earned: 0,
        goal: 50,
        percentage: 0,
        remaining: 50,
        isMet: false
      }
    }
  }
  
  /**
   * Check if daily goal has been met
   * 
   * @param userId - User ID (optional, uses current user if not provided)
   * @returns Promise<boolean> - True if goal is met
   */
  static async isDailyGoalMet(userId?: string): Promise<boolean> {
    const progress = await this.getDailyGoalProgress(userId)
    return progress.isMet
  }
  
  /**
   * Get full daily goal data (goal + progress)
   * 
   * @param userId - User ID (optional, uses current user if not provided)
   * @returns Promise<DailyGoalData>
   */
  static async getDailyGoalData(userId?: string): Promise<DailyGoalData> {
    const targetUserId = userId || (await AuthService.getCurrentUser())?.id
    
    if (!targetUserId) {
      return {
        goal: 50,
        progress: {
          earned: 0,
          goal: 50,
          percentage: 0,
          remaining: 50,
          isMet: false
        },
        timezone: 'America/Los_Angeles'
      }
    }
    
    try {
      const profile = await DatabaseService.getUserProfile(targetUserId)
      
      if (!profile) {
        return {
          goal: 50,
          progress: {
            earned: 0,
            goal: 50,
            percentage: 0,
            remaining: 50,
            isMet: false
          },
          timezone: 'America/Los_Angeles'
        }
      }
      
      const goal = profile.daily_goal_xp ?? 50
      const timezone = profile.timezone || 'America/Los_Angeles'
      const progress = await this.getDailyGoalProgress(targetUserId)
      
      return {
        goal,
        progress,
        timezone
      }
    } catch (error) {
      console.error('Error fetching daily goal data:', error)
      return {
        goal: 50,
        progress: {
          earned: 0,
          goal: 50,
          percentage: 0,
          remaining: 50,
          isMet: false
        },
        timezone: 'America/Los_Angeles'
      }
    }
  }
  
  /**
   * Format daily goal progress for display
   * 
   * @param progress - DailyGoalProgress object
   * @returns string - Formatted string (e.g., "45/50 XP")
   */
  static formatProgress(progress: DailyGoalProgress): string {
    return `${progress.earned}/${progress.goal} XP`
  }
  
  /**
   * Format daily goal progress percentage for display
   * 
   * @param progress - DailyGoalProgress object
   * @returns string - Formatted percentage (e.g., "90%")
   */
  static formatPercentage(progress: DailyGoalProgress): string {
    return `${progress.percentage}%`
  }
}

