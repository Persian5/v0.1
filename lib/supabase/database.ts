import { supabase } from './client'
import { createClient } from './server'
import type { User } from '@supabase/supabase-js'

// Types for our database tables
export interface UserProfile {
  id: string
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
        display_name: user.user_metadata?.full_name || null,
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

  // Get user lesson progress
  static async getUserLessonProgress(userId: string): Promise<UserLessonProgress[]> {
    const { data, error } = await supabase
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to fetch lesson progress: ${error.message}`)
    }

    return data || []
  }

  // Update lesson progress
  static async updateLessonProgress(
    userId: string, 
    moduleId: string, 
    lessonId: string, 
    updates: Partial<UserLessonProgress>
  ): Promise<UserLessonProgress> {
    const { data, error } = await supabase
      .from('user_lesson_progress')
      .upsert({
        user_id: userId,
        module_id: moduleId,
        lesson_id: lessonId,
        ...updates
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update lesson progress: ${error.message}`)
    }

    return data
  }

  // Check if user's email is verified
  static async isEmailVerified(user: User): Promise<boolean> {
    return user.email_confirmed_at !== null
  }
} 