import { supabase } from './client'
import { createClient } from './server'
import type { User } from '@supabase/supabase-js'
import { withAuthRetry } from '../utils/with-auth-retry'
import { generateDefaultDisplayName } from '../utils/display-name'

// Types for our database tables
export interface UserProfile {
  id: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  email: string | null
  total_xp: number
  onboarding_completed: boolean
  learning_goal: string | null // 'heritage' | 'travel' | 'family' | 'academic' | 'fun'
  current_level: string | null // 'beginner' | 'few_words' | 'basic_conversation' | 'intermediate'
  primary_focus: string | null // 'speaking' | 'reading' | 'writing' | 'all'
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
  // CRITICAL: Once onboarding_completed=true, NEVER overwrite display_name, learning_goal, current_level, or primary_focus
  static async getOrCreateUserProfile(user: User): Promise<UserProfile> {
    return await withAuthRetry(async () => {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        // Generate display_name if not provided in user_metadata
        const metadataDisplayName = user.user_metadata?.display_name || null
        const generatedDisplayName = generateDefaultDisplayName(
          user.user_metadata?.first_name,
          user.user_metadata?.last_name
        )
        const displayName = metadataDisplayName || generatedDisplayName || null

        const newProfile = {
          id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || null,
          last_name: user.user_metadata?.last_name || null,
          display_name: displayName,
          total_xp: 0,
          onboarding_completed: false
        }

        const { data: createdProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert(newProfile)
          .select()
          .single()

        if (createError) {
          // Handle foreign key constraint violation (user doesn't exist in auth.users yet)
          if (createError.code === '23503' || createError.message.includes('foreign key constraint')) {
            console.warn('User profile creation failed - user may not exist in auth.users yet:', createError.message)
            // Return a minimal profile object to prevent crashes
            return {
              id: user.id,
              email: user.email,
              first_name: user.user_metadata?.first_name || null,
              last_name: user.user_metadata?.last_name || null,
              display_name: displayName,
              total_xp: 0,
              onboarding_completed: false,
              learning_goal: null,
              current_level: null,
              primary_focus: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as UserProfile
          }
          throw new Error(`Failed to create user profile: ${createError.message}`)
        }

        return createdProfile
      }

      if (error) {
        throw new Error(`Failed to fetch user profile: ${error.message}`)
      }

      // CRITICAL: If onboarding is complete, NEVER modify display_name or onboarding fields
      // These are set during onboarding and should never be overwritten
      if (profile.onboarding_completed) {
        // Onboarding complete - return profile as-is, never modify display_name or onboarding fields
        return profile
      }

      // Only modify display_name if onboarding is NOT complete
      // This handles existing users who might have null display_name before onboarding
      if (!profile.display_name) {
        const generatedDisplayName = generateDefaultDisplayName(
          profile.first_name,
          profile.last_name
        )
        
        if (generatedDisplayName) {
          // Update profile with generated display_name (only if onboarding not complete)
          const updatedProfile = await this.updateUserProfile(profile.id, {
            display_name: generatedDisplayName
          })
          return updatedProfile
        }
      }

      return profile
    }, 'getOrCreateUserProfile')
  }

  // Get user profile by ID
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Profile doesn't exist
      }
      throw new Error(`Failed to fetch user profile: ${error.message}`)
    }

    return data
  }

  // Update user profile
  // CRITICAL: If onboarding_completed=true, this should NEVER be called to modify display_name, learning_goal, etc.
  // Those fields are set during onboarding and should only be updated through OnboardingService
  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    console.log('DatabaseService.updateUserProfile called with:', { userId, updates })
    
    // Fetch current profile to check onboarding status
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .single()
    
    // CRITICAL: If onboarding is complete AND we're NOT completing onboarding now, prevent overwriting onboarding fields
    // Allow updates if onboarding_completed is being set to true (completing onboarding now)
    const isCompletingOnboarding = updates.onboarding_completed === true
    const wasAlreadyCompleted = currentProfile?.onboarding_completed === true
    
    if (wasAlreadyCompleted && !isCompletingOnboarding) {
      // Onboarding was already complete - prevent modifying onboarding fields
      const protectedFields = ['display_name', 'learning_goal', 'current_level', 'primary_focus']
      const hasProtectedFields = protectedFields.some(field => updates[field as keyof UserProfile] !== undefined)
      
      if (hasProtectedFields) {
        console.warn('Attempted to modify protected onboarding fields after completion. Filtering out:', protectedFields.filter(f => updates[f as keyof UserProfile] !== undefined))
        // Remove protected fields from updates
        const safeUpdates = { ...updates }
        protectedFields.forEach(field => {
          delete safeUpdates[field as keyof UserProfile]
        })
        updates = safeUpdates
      }
    }
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('DatabaseService.updateUserProfile error:', error)
      throw new Error(`Failed to update user profile: ${error.message}`)
    }

    console.log('DatabaseService.updateUserProfile success:', data)
    return data
  }

  // Get user's total XP
  static async getUserTotalXp(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('total_xp')
      .eq('id', userId)
      .maybeSingle() // Use maybeSingle() instead of single() to handle missing profiles gracefully

    if (error) {
      // If profile doesn't exist, return 0 (new user)
      if (error.code === 'PGRST116') {
        return 0
      }
      throw new Error(`Failed to fetch user XP: ${error.message}`)
    }

    // If no data found, return 0 (profile doesn't exist yet)
    return data?.total_xp ?? 0
  }

  // Recalculate total XP from all transactions (fixes stale database XP)
  static async recalculateUserXpFromTransactions(userId: string): Promise<number> {
    return await withAuthRetry(async () => {
      // Sum all XP transactions for this user
      const { data: transactions, error: sumError } = await supabase
        .from('user_xp_transactions')
        .select('amount')
        .eq('user_id', userId)

      if (sumError) {
        throw new Error(`Failed to fetch XP transactions: ${sumError.message}`)
      }

      // Calculate total XP from all transactions
      const calculatedXp = (transactions || []).reduce((sum, t) => sum + (t.amount || 0), 0)

      // Update user profile with recalculated XP
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          total_xp: calculatedXp,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        throw new Error(`Failed to update user XP: ${updateError.message}`)
      }

      console.log(`✅ Recalculated XP for user ${userId}: ${calculatedXp} (from ${transactions?.length || 0} transactions)`)
      return calculatedXp
    }, 'recalculateUserXpFromTransactions')
  }

  // Batch update user XP with transactions
  static async batchUpdateUserXp(userId: string, transactions: Omit<UserXpTransaction, 'id' | 'user_id' | 'created_at'>[]): Promise<void> {
    return await withAuthRetry(async () => {
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
    }, 'batchUpdateUserXp')
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
    return await withAuthRetry(async () => {
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
    }, `updateLessonProgress:${moduleId}/${lessonId}`)
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