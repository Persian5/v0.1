import { DatabaseService, UserProfile } from '@/lib/supabase/database'
import { SmartAuthService } from './smart-auth-service'
import { validateDisplayName, generateUniqueDisplayName, generateDefaultDisplayName } from '@/lib/utils/display-name'
import { supabase } from '@/lib/supabase/client'

/**
 * Onboarding Data Types
 * 
 * Represents the data collected during the onboarding flow.
 * All fields except learning_goal are optional to support skipping steps.
 */
export interface OnboardingData {
  display_name?: string | null
  learning_goal: 'heritage' | 'travel' | 'family' | 'academic' | 'fun'
  current_level?: 'beginner' | 'few_words' | 'basic_conversation' | 'intermediate' | null
  primary_focus?: 'speaking' | 'reading' | 'writing' | 'all' | null
}

/**
 * Onboarding Service
 * 
 * Handles onboarding flow logic:
 * - Checking if user needs onboarding
 * - Saving onboarding data incrementally (as user progresses)
 * - Completing onboarding (marking as done)
 * - Validating onboarding data
 * 
 * Follows same patterns as other services:
 * - Static methods
 * - Error handling with structured returns
 * - Integration with DatabaseService
 * - Cache updates via SmartAuthService
 */
export class OnboardingService {
  
  /**
   * Check if user needs onboarding
   * 
   * @param userId - User ID to check
   * @returns true if user needs onboarding (onboarding_completed === false)
   */
  static async checkNeedsOnboarding(userId: string): Promise<boolean> {
    try {
      // Try cached profile first (fast path)
      const cached = this.getCachedOnboardingStatus()
      if (cached) {
        return cached.needsOnboarding
      }

      // Cache miss - fetch from database
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('id', userId)
        .single()

      if (error) {
        // If profile doesn't exist, user needs onboarding
        if (error.code === 'PGRST116') {
          return true
        }
        console.error('Failed to check onboarding status:', error)
        // Fail-safe: assume onboarding needed if check fails
        return true
      }

      return !profile.onboarding_completed
    } catch (error) {
      console.error('Failed to check onboarding status:', error)
      // Fail-safe: assume onboarding needed if check fails
      return true
    }
  }

  /**
   * Save onboarding data incrementally (as user progresses through steps)
   * 
   * This allows partial saves so user doesn't lose progress if they refresh.
   * Does NOT mark onboarding as completed.
   * 
   * @param userId - User ID
   * @param data - Partial onboarding data to save
   * @returns Updated profile or error
   */
  static async saveOnboardingData(
    userId: string,
    data: Partial<OnboardingData>
  ): Promise<{ profile: UserProfile | null; error: string | null }> {
    try {
      // Validate display_name if provided
      if (data.display_name !== undefined && data.display_name !== null) {
        const validation = validateDisplayName(data.display_name)
        if (!validation.valid) {
          return { profile: null, error: validation.error || 'Please enter a valid display name' }
        }
      }

      // Validate learning_goal if provided
      if (data.learning_goal !== undefined) {
        const validGoals: OnboardingData['learning_goal'][] = ['heritage', 'travel', 'family', 'academic', 'fun']
        if (!validGoals.includes(data.learning_goal)) {
          return { profile: null, error: 'Please select a valid learning goal' }
        }
      }

      // Validate current_level if provided
      if (data.current_level !== undefined && data.current_level !== null) {
        const validLevels: NonNullable<OnboardingData['current_level']>[] = ['beginner', 'few_words', 'basic_conversation', 'intermediate']
        if (!validLevels.includes(data.current_level)) {
          return { profile: null, error: 'Please select a valid level' }
        }
      }

      // Validate primary_focus if provided
      if (data.primary_focus !== undefined && data.primary_focus !== null) {
        const validFocuses: NonNullable<OnboardingData['primary_focus']>[] = ['speaking', 'reading', 'writing', 'all']
        if (!validFocuses.includes(data.primary_focus)) {
          return { profile: null, error: 'Please select a valid focus' }
        }
      }

      // Prepare update object (only include defined fields)
      const updates: Partial<UserProfile> = {}
      if (data.display_name !== undefined) updates.display_name = data.display_name
      if (data.learning_goal !== undefined) updates.learning_goal = data.learning_goal
      if (data.current_level !== undefined) updates.current_level = data.current_level
      if (data.primary_focus !== undefined) updates.primary_focus = data.primary_focus

      // Update profile in database
      let updatedProfile: UserProfile
      try {
        updatedProfile = await DatabaseService.updateUserProfile(userId, updates)
      } catch (err) {
        console.error('Failed to save onboarding data:', err)
        return { profile: null, error: 'Unable to save. Please try again.' }
      }

      // Update SmartAuthService cache for instant UI updates
      SmartAuthService.updateUserData({ profile: updatedProfile })

      return { profile: updatedProfile, error: null }
    } catch (error) {
      console.error('Failed to save onboarding data:', error)
      // NEVER expose technical error messages to users
      return {
        profile: null,
        error: 'Something went wrong. Please try again.'
      }
    }
  }

  /**
   * Complete onboarding (mark as done)
   * 
   * Validates that required fields are present, then marks onboarding_completed = true.
   * 
   * @param userId - User ID
   * @param data - Complete onboarding data (learning_goal required)
   * @returns Updated profile or error
   */
  static async completeOnboarding(
    userId: string,
    data: OnboardingData
  ): Promise<{ profile: UserProfile | null; error: string | null }> {
    try {
      // Validate required field
      if (!data.learning_goal) {
        return { profile: null, error: 'Please select a learning goal' }
      }

      // Get current profile from cache (fast) or fetch if needed
      // CRITICAL: Don't call getOrCreateUserProfile here - it might overwrite display_name!
      // Instead, fetch profile directly without any auto-generation logic
      let currentProfile = SmartAuthService.getCachedProfile()
      
      // If cache miss, fetch directly from database (don't use getOrCreateUserProfile)
      if (!currentProfile) {
        try {
          const { data: user } = await supabase.auth.getUser()
          if (user.user) {
            // Fetch profile directly - don't use getOrCreateUserProfile which might overwrite
            const { data: profile, error } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', user.user.id)
              .single()
            
            if (!error && profile) {
              currentProfile = profile
            }
          }
        } catch (err) {
          console.error('Failed to fetch user profile:', err)
          // Continue with null check below
        }
      }

      if (!currentProfile) {
        return { profile: null, error: 'Unable to load your profile. Please try again.' }
      }

      // Determine final display_name:
      // 1. If user entered something CUSTOM, use it (make it unique if needed)
      // 2. If user skipped/cleared, use default (first_name + last_initial) - NO uniqueness check (can have duplicates)
      // Display name should NEVER be null
      let finalDisplayName: string
      
      try {
        if (data.display_name && data.display_name.trim()) {
          // User entered a CUSTOM display name - validate and make unique
          const trimmed = data.display_name.trim()
          const validation = validateDisplayName(trimmed)
          if (!validation.valid) {
            return { profile: null, error: validation.error || 'Please enter a valid display name' }
          }
          
          // Make custom names unique (will append number if needed)
          // This prevents 1000 "Koobideh23"s but allows many "Sara A."s
          finalDisplayName = await generateUniqueDisplayName(trimmed, userId)
        } else {
          // User skipped/cleared - use default (first_name + last_initial)
          // Default names CAN be duplicated (many "Sara A."s is fine)
          const defaultName = generateDefaultDisplayName(
            currentProfile.first_name,
            currentProfile.last_name
          )
          
          if (!defaultName) {
            return { profile: null, error: 'Please provide your first name in your account settings' }
          }
          
          // Use default name as-is (no uniqueness check - duplicates allowed)
          finalDisplayName = defaultName
        }
      } catch (err) {
        console.error('Error generating display name:', err)
        return { profile: null, error: 'Unable to set display name. Please try again.' }
      }

      // Prepare update object - ALWAYS include display_name (never null)
      // CRITICAL: Update display_name FIRST, then set onboarding_completed
      // This prevents the protection logic from blocking the retry if display_name fails
      const updates: Partial<UserProfile> = {
        display_name: finalDisplayName, // Always set (never null) - UPDATE FIRST
        learning_goal: data.learning_goal,
        current_level: data.current_level || null,
        primary_focus: data.primary_focus || null
        // Don't set onboarding_completed yet - we'll do it in a second update
      }

      console.log('Updating user profile with:', updates)
      console.log('Current profile before update:', currentProfile)

      // Update profile in database - FIRST update: display_name and onboarding fields (but NOT onboarding_completed)
      let updatedProfile: UserProfile
      try {
        updatedProfile = await DatabaseService.updateUserProfile(userId, updates)
        console.log('Updated profile returned from database:', updatedProfile)
        
        // VERIFY the update actually saved display_name correctly
        if (updatedProfile.display_name !== finalDisplayName) {
          console.error('CRITICAL: display_name mismatch after first update!', {
            expected: finalDisplayName,
            actual: updatedProfile.display_name,
            updates
          })
          // Retry with just display_name (onboarding_completed still false, so protection won't block)
          const retryUpdate = await DatabaseService.updateUserProfile(userId, {
            display_name: finalDisplayName
          })
          console.log('Retry update result:', retryUpdate)
          updatedProfile = retryUpdate
        }
        
        // SECOND update: Mark onboarding as completed (now that display_name is saved)
        const completionUpdate = await DatabaseService.updateUserProfile(userId, {
          onboarding_completed: true
        })
        console.log('Completion update result:', completionUpdate)
        updatedProfile = completionUpdate
      } catch (err) {
        console.error('Failed to update profile:', err)
        return { profile: null, error: 'Unable to save your information. Please try again.' }
      }

      console.log('Final updated profile:', updatedProfile)

      // Note: Auth metadata (display_name, first_name, last_name) is automatically synced
      // from user_profiles to auth.users via the trg_sync_user_metadata trigger
      // No manual update needed here

      // Update SmartAuthService cache for instant UI updates
      SmartAuthService.updateUserData({ profile: updatedProfile })

      return { profile: updatedProfile, error: null }
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      // NEVER expose technical error messages to users
      return {
        profile: null,
        error: 'Something went wrong. Please try again or contact support if the problem persists.'
      }
    }
  }

  /**
   * Get current onboarding status from cached profile
   * 
   * Fast check using SmartAuthService cache (no DB call).
   * Returns null if cache not available.
   * 
   * @returns Onboarding status or null if cache unavailable
   */
  static getCachedOnboardingStatus(): {
    needsOnboarding: boolean
    profile: UserProfile | null
  } | null {
    const profile = SmartAuthService.getCachedProfile()
    if (!profile) return null

    return {
      needsOnboarding: !profile.onboarding_completed,
      profile
    }
  }
}

