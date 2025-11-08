import { DatabaseService, UserProfile } from '@/lib/supabase/database'
import { SmartAuthService } from './smart-auth-service'
import { validateDisplayName } from '@/lib/utils/display-name'
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
          return { profile: null, error: validation.error || 'Invalid display name' }
        }
      }

      // Validate learning_goal if provided
      if (data.learning_goal !== undefined) {
        const validGoals: OnboardingData['learning_goal'][] = ['heritage', 'travel', 'family', 'academic', 'fun']
        if (!validGoals.includes(data.learning_goal)) {
          return { profile: null, error: 'Invalid learning goal' }
        }
      }

      // Validate current_level if provided
      if (data.current_level !== undefined && data.current_level !== null) {
        const validLevels: NonNullable<OnboardingData['current_level']>[] = ['beginner', 'few_words', 'basic_conversation', 'intermediate']
        if (!validLevels.includes(data.current_level)) {
          return { profile: null, error: 'Invalid current level' }
        }
      }

      // Validate primary_focus if provided
      if (data.primary_focus !== undefined && data.primary_focus !== null) {
        const validFocuses: NonNullable<OnboardingData['primary_focus']>[] = ['speaking', 'reading', 'writing', 'all']
        if (!validFocuses.includes(data.primary_focus)) {
          return { profile: null, error: 'Invalid primary focus' }
        }
      }

      // Prepare update object (only include defined fields)
      const updates: Partial<UserProfile> = {}
      if (data.display_name !== undefined) updates.display_name = data.display_name
      if (data.learning_goal !== undefined) updates.learning_goal = data.learning_goal
      if (data.current_level !== undefined) updates.current_level = data.current_level
      if (data.primary_focus !== undefined) updates.primary_focus = data.primary_focus

      // Update profile in database
      const updatedProfile = await DatabaseService.updateUserProfile(userId, updates)

      // Update SmartAuthService cache for instant UI updates
      SmartAuthService.updateUserData({ profile: updatedProfile })

      return { profile: updatedProfile, error: null }
    } catch (error) {
      console.error('Failed to save onboarding data:', error)
      return {
        profile: null,
        error: error instanceof Error ? error.message : 'Failed to save onboarding data'
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
        return { profile: null, error: 'Learning goal is required' }
      }

      // Validate display_name if provided
      if (data.display_name !== undefined && data.display_name !== null) {
        const validation = validateDisplayName(data.display_name)
        if (!validation.valid) {
          return { profile: null, error: validation.error || 'Invalid display name' }
        }
      }

      // Prepare update object
      const updates: Partial<UserProfile> = {
        learning_goal: data.learning_goal,
        onboarding_completed: true // Mark as completed
      }

      // Add optional fields if provided
      if (data.display_name !== undefined) {
        updates.display_name = data.display_name
      }
      if (data.current_level !== undefined) {
        updates.current_level = data.current_level
      }
      if (data.primary_focus !== undefined) {
        updates.primary_focus = data.primary_focus
      }

      // Update profile in database
      const updatedProfile = await DatabaseService.updateUserProfile(userId, updates)

      // Update SmartAuthService cache for instant UI updates
      SmartAuthService.updateUserData({ profile: updatedProfile })

      return { profile: updatedProfile, error: null }
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      return {
        profile: null,
        error: error instanceof Error ? error.message : 'Failed to complete onboarding'
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

