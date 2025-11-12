// Level Service - Handles level calculation and progress tracking
// Uses database functions for accurate, consistent level calculations

import { supabase } from '@/lib/supabase/client'
import { DatabaseService } from '@/lib/supabase/database'
import { AuthService } from './auth-service'

export interface LevelProgress {
  level: number
  currentXp: number // XP at start of current level
  nextLevelXp: number // XP needed for next level
  remainingXp: number // XP remaining to reach next level
  progress: number // Percentage progress to next level (0-100)
}

export interface LevelUpResult {
  leveledUp: boolean
  oldLevel: number
  newLevel: number | null
}

/**
 * Level Service - Handles level calculations using database functions
 * 
 * IMPORTANT: Uses PostgreSQL functions for consistency and performance
 * - calculate_level() - Calculates level from XP
 * - xp_to_next_level() - Calculates XP needed for next level
 */
export class LevelService {
  
  /**
   * Calculate level from total XP
   * Uses database function for consistency
   * 
   * @param totalXp - User's total XP
   * @returns Promise<number> - Current level (1+)
   */
  static async calculateLevel(totalXp: number): Promise<number> {
    try {
      // Use database function for accurate calculation
      const { data, error } = await supabase.rpc('calculate_level', {
        p_total_xp: totalXp
      })
      
      if (error) {
        console.error('Error calculating level:', error)
        // Fallback to client-side calculation if function unavailable
        return this.calculateLevelClientSide(totalXp)
      }
      
      return data as number
    } catch (error) {
      console.error('Exception calculating level:', error)
      return this.calculateLevelClientSide(totalXp)
    }
  }
  
  /**
   * Client-side fallback level calculation
   * Matches database function logic exactly
   * 
   * @param totalXp - User's total XP
   * @returns number - Current level
   */
  private static calculateLevelClientSide(totalXp: number): number {
    if (totalXp < 100) {
      return 1
    } else if (totalXp < 250) {
      return 2
    } else if (totalXp < 500) {
      return 3
    } else if (totalXp < 1000) {
      return 4
    } else {
      // Level 5+: 1000 + (n-4) * 500
      // Formula: level = 4 + CEIL((xp - 1000) / 500.0)
      return 4 + Math.ceil((totalXp - 1000) / 500)
    }
  }
  
  /**
   * Get XP needed for next level
   * Uses database function for consistency
   * 
   * @param totalXp - User's total XP
   * @returns Promise<number> - XP remaining to reach next level
   */
  static async getXpToNextLevel(totalXp: number): Promise<number> {
    try {
      // Use database function
      const { data, error } = await supabase.rpc('xp_to_next_level', {
        p_total_xp: totalXp
      })
      
      if (error) {
        console.error('Error calculating XP to next level:', error)
        // Fallback to client-side calculation
        return this.getXpToNextLevelClientSide(totalXp)
      }
      
      return data as number
    } catch (error) {
      console.error('Exception calculating XP to next level:', error)
      return this.getXpToNextLevelClientSide(totalXp)
    }
  }
  
  /**
   * Client-side fallback for XP to next level
   * 
   * @param totalXp - User's total XP
   * @returns number - XP remaining to next level
   */
  private static getXpToNextLevelClientSide(totalXp: number): number {
    const currentLevel = this.calculateLevelClientSide(totalXp)
    
    // Calculate XP threshold for next level
    let nextLevelXp: number
    if (currentLevel === 1) {
      nextLevelXp = 100
    } else if (currentLevel === 2) {
      nextLevelXp = 250
    } else if (currentLevel === 3) {
      nextLevelXp = 500
    } else if (currentLevel === 4) {
      nextLevelXp = 1000
    } else {
      // Level 5+: 1000 + (level - 4) * 500
      nextLevelXp = 1000 + (currentLevel - 4) * 500
    }
    
    const remaining = Math.max(1, nextLevelXp - totalXp)
    return remaining
  }
  
  /**
   * Get full level progress information
   * Returns level, XP thresholds, remaining XP, and progress percentage
   * 
   * @param totalXp - User's total XP
   * @returns Promise<LevelProgress>
   */
  static async getLevelProgress(totalXp: number): Promise<LevelProgress> {
    const level = await this.calculateLevel(totalXp)
    const remainingXp = await this.getXpToNextLevel(totalXp)
    
    // Calculate XP thresholds
    let currentXp: number
    let nextLevelXp: number
    
    if (level === 1) {
      currentXp = 0
      nextLevelXp = 100
    } else if (level === 2) {
      currentXp = 100
      nextLevelXp = 250
    } else if (level === 3) {
      currentXp = 250
      nextLevelXp = 500
    } else if (level === 4) {
      currentXp = 500
      nextLevelXp = 1000
    } else {
      // Level 5+
      const prevLevelXp = 1000 + (level - 5) * 500
      currentXp = prevLevelXp
      nextLevelXp = 1000 + (level - 4) * 500
    }
    
    // Calculate progress percentage
    const levelRange = nextLevelXp - currentXp
    const progressInLevel = totalXp - currentXp
    const progress = levelRange > 0 ? Math.min(100, Math.round((progressInLevel / levelRange) * 100)) : 0
    
    return {
      level,
      currentXp,
      nextLevelXp,
      remainingXp,
      progress
    }
  }
  
  /**
   * Check if user leveled up
   * Compares old XP and new XP to detect level increase
   * 
   * @param oldXp - Previous total XP
   * @param newXp - New total XP
   * @returns Promise<LevelUpResult>
   */
  static async checkLevelUp(oldXp: number, newXp: number): Promise<LevelUpResult> {
    const oldLevel = await this.calculateLevel(oldXp)
    const newLevel = await this.calculateLevel(newXp)
    
    return {
      leveledUp: newLevel > oldLevel,
      oldLevel,
      newLevel: newLevel > oldLevel ? newLevel : null
    }
  }
  
  /**
   * Get level for authenticated user
   * Fetches total XP and calculates level
   * 
   * @param userId - User ID (optional, uses current user if not provided)
   * @returns Promise<number> - Current level
   */
  static async getUserLevel(userId?: string): Promise<number> {
    const targetUserId = userId || (await AuthService.getCurrentUser())?.id
    
    if (!targetUserId) {
      return 1 // Default level for unauthenticated users
    }
    
    try {
      const totalXp = await DatabaseService.getUserTotalXp(targetUserId)
      return await this.calculateLevel(totalXp)
    } catch (error) {
      console.error('Error fetching user level:', error)
      return 1
    }
  }
  
  /**
   * Get full level progress for authenticated user
   * 
   * @param userId - User ID (optional, uses current user if not provided)
   * @returns Promise<LevelProgress>
   */
  static async getUserLevelProgress(userId?: string): Promise<LevelProgress> {
    const targetUserId = userId || (await AuthService.getCurrentUser())?.id
    
    if (!targetUserId) {
      return {
        level: 1,
        currentXp: 0,
        nextLevelXp: 100,
        remainingXp: 100,
        progress: 0
      }
    }
    
    try {
      const totalXp = await DatabaseService.getUserTotalXp(targetUserId)
      return await this.getLevelProgress(totalXp)
    } catch (error) {
      console.error('Error fetching user level progress:', error)
      return {
        level: 1,
        currentXp: 0,
        nextLevelXp: 100,
        remainingXp: 100,
        progress: 0
      }
    }
  }
  
  /**
   * Format level for display
   * 
   * @param level - Level number
   * @returns string - Formatted level (e.g., "Level 5")
   */
  static formatLevel(level: number): string {
    return `Level ${level}`
  }
  
  /**
   * Format level progress for display
   * 
   * @param progress - LevelProgress object
   * @returns string - Formatted progress (e.g., "45/100 XP to Level 2")
   */
  static formatProgress(progress: LevelProgress): string {
    const earnedInLevel = progress.nextLevelXp - progress.remainingXp - progress.currentXp
    const neededInLevel = progress.nextLevelXp - progress.currentXp
    return `${earnedInLevel}/${neededInLevel} XP to ${this.formatLevel(progress.level + 1)}`
  }
}

