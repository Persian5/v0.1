import { supabase } from '@/lib/supabase/client'
import { DatabaseService } from '@/lib/supabase/database'
import type { User } from '@supabase/supabase-js'
import { generateDefaultDisplayName } from '@/lib/utils/display-name'

export interface AuthError {
  message: string
  code?: string
}

export interface SignUpData {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface SignInData {
  email: string
  password: string
}

export class AuthService {
  
  // Sign up a new user
  static async signUp({ email, password, firstName, lastName }: SignUpData): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const normalizedEmail = email.trim().toLowerCase()
      console.log('[AUTH] signup_start', { email: normalizedEmail })
      
      // Generate display name in correct format: "FirstName LastInitial."
      // If generation fails (no first name), use null (will be handled by getOrCreateUserProfile)
      const displayName = generateDefaultDisplayName(firstName, lastName) || null

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' 
            ? `${window.location.origin}/?verify=true`
            : undefined,
          data: {
            first_name: firstName,
            last_name: lastName,
            display_name: displayName
          }
        }
      })

      if (error) {
        console.log('[AUTH] signup_failed', { email: normalizedEmail, error: error.message })
        return { user: null, error: { message: error.message, code: error.message } }
      }

      // Note: User profile will be created when they first sign in after email verification
      if (data.user) {
        console.log('[AUTH] signup_success', { userId: data.user.id })
      }
      return { user: data.user, error: null }
    } catch (error: any) {
      console.log('[AUTH] signup_failed', { email: email.trim().toLowerCase(), error: error?.message || 'An unexpected error occurred during sign up' })
      return { 
        user: null, 
        error: { message: 'An unexpected error occurred during sign up' } 
      }
    }
  }

  // Sign in an existing user
  static async signIn({ email, password }: SignInData): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const normalizedEmail = email.trim().toLowerCase()
      console.log('[AUTH] signin_start', { email: normalizedEmail })
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      })

      if (error) {
        console.log('[AUTH] signin_failed', { email: normalizedEmail, error: error.message })
        return { user: null, error: { message: error.message, code: error.message } }
      }

      // Create or update user profile
      if (data.user) {
        try {
          await DatabaseService.getOrCreateUserProfile(data.user)
        } catch (profileError) {
          console.error('Failed to create/update user profile:', profileError)
          // Don't fail sign-in for profile issues
        }
        console.log('[AUTH] signin_success', { userId: data.user.id })
      }

      return { user: data.user, error: null }
    } catch (error: any) {
      console.log('[AUTH] signin_failed', { email: email.trim().toLowerCase(), error: error?.message || 'An unexpected error occurred during sign in' })
      return { 
        user: null, 
        error: { message: 'An unexpected error occurred during sign in' } 
      }
    }
  }

  // Sign out the current user
  static async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        return { error: { message: error.message, code: error.message } }
      }

      return { error: null }
    } catch (error) {
      return { error: { message: 'An unexpected error occurred during sign out' } }
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  // Check if user's email is verified
  static async isEmailVerified(user: User): Promise<boolean> {
    return DatabaseService.isEmailVerified(user)
  }

  // Cooldown tracking
  private static resendCooldowns = new Map<string, number>()

  // Resend email verification
  static async resendEmailVerification(email: string): Promise<{ error: AuthError | null }> {
    const normalizedEmail = email.trim().toLowerCase()
    console.log('[AUTH] resend_verification_start', { email: normalizedEmail })

    // CRITICAL: Check cooldown
    const lastSent = this.resendCooldowns.get(normalizedEmail)
    const now = Date.now()
    const COOLDOWN_MS = 5 * 60 * 1000 // 5 minutes
    
    if (lastSent && (now - lastSent) < COOLDOWN_MS) {
      const remainingMinutes = Math.ceil((COOLDOWN_MS - (now - lastSent)) / 1000 / 60)
      console.log('[AUTH] resend_verification_rate_limited', { email: normalizedEmail })
      return { 
        error: { 
          message: `Please wait ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''} before requesting another email`,
          code: 'rate_limited'
        } 
      }
    }

    try {
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/?verify=true`
        : undefined

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
        options: {
          emailRedirectTo: redirectTo
        }
      })

      if (error) {
        // Check if Supabase rate limited us
        if (error.message.toLowerCase().includes('rate limit') ||
            error.message.toLowerCase().includes('too many requests')) {
          // Set cooldown even on Supabase rate limit
          this.resendCooldowns.set(normalizedEmail, now)
          console.log('[AUTH] resend_verification_rate_limited', { email: normalizedEmail })
          return { 
            error: { 
              message: 'Too many requests. Please wait 5 minutes before trying again.',
              code: 'rate_limited'
            } 
          }
        }
        console.log('[AUTH] resend_verification_failed', { email: normalizedEmail, error: error.message })
        return { error: { message: error.message, code: error.message } }
      }

      // Success - set cooldown
      this.resendCooldowns.set(normalizedEmail, now)
      console.log('[AUTH] resend_verification_success', { email: normalizedEmail })
      return { error: null }
    } catch (error: any) {
      console.log('[AUTH] resend_verification_failed', { email: normalizedEmail, error: error?.message || 'Failed to resend verification email' })
      return { error: { message: 'Failed to resend verification email' } }
    }
  }

  // Send password reset email
  static async sendPasswordReset(email: string): Promise<{ error: AuthError | null }> {
    try {
      const normalizedEmail = email.trim().toLowerCase()
      console.log('[AUTH] password_reset_request_start', { email: normalizedEmail })
      
      const redirectTo = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/reset-password`
        : undefined

      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo
      })

      if (error) {
        console.log('[AUTH] password_reset_request_failed', { email: normalizedEmail, error: error.message })
        return { error: { message: error.message, code: error.message } }
      }

      console.log('[AUTH] password_reset_request_success', { email: normalizedEmail })
      return { error: null }
    } catch (error: any) {
      console.log('[AUTH] password_reset_request_failed', { email: email.trim().toLowerCase(), error: error?.message || 'Failed to send password reset email' })
      return { error: { message: 'Failed to send password reset email' } }
    }
  }

  /**
   * Change password for a logged-in user.
   * 1. Optionally verify the current password (recommended when user supplies it).
   * 2. Call supabase.auth.updateUser({ password: newPassword })
   */
  static async changePassword({
    currentPassword,
    newPassword,
    email,
  }: {
    email: string // needed for re-auth step
    currentPassword?: string
    newPassword: string
  }): Promise<{ error: AuthError | null }> {
    try {
      // If currentPassword provided, attempt re-auth to ensure identity
      if (currentPassword) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: currentPassword,
        })

        if (signInError) {
          return { error: { message: 'Current password is incorrect', code: signInError.message } }
        }
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword })

      if (error) {
        return { error: { message: error.message, code: error.code } }
      }

      return { error: null }
    } catch (err: any) {
      return { error: { message: 'Failed to change password' } }
    }
  }

  // Check if browser supports localStorage (for fallback logic)
  static isBrowserStorageAvailable(): boolean {
    if (typeof window === 'undefined') return false
    
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }
} 