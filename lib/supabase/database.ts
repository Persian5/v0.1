import { supabase } from './client'
import { createClient } from './server'
import type { User } from '@supabase/supabase-js'

// Types for our database tables
export interface UserProfile {
  id: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  email: string | null
  total_xp: number
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface UserLessonProgress {
  id: string
  user_id: string
  module_id: string
  lesson_id: string
  status: 'locked' | 'available' | 'in_progress' | 'completed'
  progress_percent: number
  xp_earned: number
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface UserXpTransaction {
  id: string
  user_id: string
  amount: number
  source: string
  lesson_id: string | null
  metadata: Record<string, any> | null
  created_at: string
}

// User Profile Operations
export class DatabaseService {
  
  // Get or create user profile
  static async getOrCreateUserProfile(user: User): Promise<UserProfile> {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist, create it
      const newProfile = {
        id: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name || null,
        last_name: user.user_metadata?.last_name || null,
        display_name: user.user_metadata?.display_name || null,
        total_xp: 0,
        onboarding_completed: false
      }

      const { data: createdProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert(newProfile)
        .select()
        .single()

      if (createError) {
        throw new Error(`Failed to create user profile: ${createError.message}`)
      }

      return createdProfile
    }

    if (error) {
      throw new Error(`Failed to fetch user profile: ${error.message}`)
    }

    return profile
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update user profile: ${error.message}`)
    }

    return data
  }

  // Get user's total XP
  static async getUserTotalXp(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('total_xp')
      .eq('id', userId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch user XP: ${error.message}`)
    }

    return data.total_xp
  }

  // Batch update user XP with transactions
  static async batchUpdateUserXp(userId: string, transactions: Omit<UserXpTransaction, 'id' | 'user_id' | 'created_at'>[]): Promise<void> {
    // Calculate total XP to add
    const totalXpToAdd = transactions.reduce((sum, t) => sum + t.amount, 0)

    // First, get current XP
    const currentXp = await this.getUserTotalXp(userId)
    const newTotalXp = currentXp + totalXpToAdd

    // Update user's total XP
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ 
        total_xp: newTotalXp,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (profileError) {
      throw new Error(`Failed to update user XP: ${profileError.message}`)
    }

    // Insert XP transactions
    const transactionsWithUserId = transactions.map(t => ({
      ...t,
      user_id: userId
    }))

    const { error: transactionsError } = await supabase
      .from('user_xp_transactions')
      .insert(transactionsWithUserId)

    if (transactionsError) {
      throw new Error(`Failed to record XP transactions: ${transactionsError.message}`)
    }
  }

  // ===== LESSON PROGRESS OPERATIONS =====

  // Get user lesson progress
  static async getUserLessonProgress(userId: string, moduleId?: string): Promise<UserLessonProgress[]> {
    let query = supabase
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', userId)

    // If moduleId is provided, add it to the query filter
    if (moduleId) {
      query = query.eq('module_id', moduleId)
    }

    const { data, error } = await query.order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch lesson progress: ${error.message}`)
    }

    return data || []
  }

  // Get specific lesson progress
  static async getLessonProgress(userId: string, moduleId: string, lessonId: string): Promise<UserLessonProgress | null> {
    const { data, error } = await supabase
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .eq('lesson_id', lessonId)
      .single()

    if (error && error.code === 'PGRST116') {
      // No record found
      return null
    }

    if (error) {
      throw new Error(`Failed to fetch lesson progress: ${error.message}`)
    }

    return data
  }

  // Update or create lesson progress
  static async updateLessonProgress(
    userId: string, 
    moduleId: string, 
    lessonId: string, 
    updates: Partial<Omit<UserLessonProgress, 'id' | 'user_id' | 'module_id' | 'lesson_id' | 'created_at'>>
  ): Promise<UserLessonProgress> {
    const { data, error } = await supabase
      .from('user_lesson_progress')
      .upsert({
        user_id: userId,
        module_id: moduleId,
        lesson_id: lessonId,
        ...updates
      }, {
        onConflict: 'user_id,module_id,lesson_id'
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update lesson progress: ${error.message}`)
    }

    return data
  }

  // Mark lesson as completed
  static async markLessonCompleted(userId: string, moduleId: string, lessonId: string): Promise<UserLessonProgress> {
    const now = new Date().toISOString()
    
    return await this.updateLessonProgress(userId, moduleId, lessonId, {
      status: 'completed',
      progress_percent: 100,
      completed_at: now
    })
  }

  // Mark lesson as started
  static async markLessonStarted(userId: string, moduleId: string, lessonId: string): Promise<UserLessonProgress> {
    const now = new Date().toISOString()
    
    return await this.updateLessonProgress(userId, moduleId, lessonId, {
      status: 'in_progress',
      started_at: now
    })
  }

  // Reset all user progress (for reset button)
  static async resetUserProgress(userId: string): Promise<void> {
    // Start a transaction-like operation
    try {
      // Reset total XP to 0
      await supabase
        .from('user_profiles')
        .update({ 
          total_xp: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      // Delete all lesson progress
      await supabase
        .from('user_lesson_progress')
        .delete()
        .eq('user_id', userId)

      // Delete all XP transactions
      await supabase
        .from('user_xp_transactions')
        .delete()
        .eq('user_id', userId)

      // Note: We could also delete from other progress tables like:
      // - user_attempts (performance tracking)
      // - user_sessions (session data)
      // But keeping user_profiles intact (name, email, etc.)

      console.log(`Reset all progress for user ${userId}`)
    } catch (error) {
      throw new Error(`Failed to reset user progress: ${error}`)
    }
  }

  // Check if user's email is verified
  static async isEmailVerified(user: User): Promise<boolean> {
    return user.email_confirmed_at !== null
  }
} 