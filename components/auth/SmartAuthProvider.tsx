"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { SmartAuthService } from '@/lib/services/smart-auth-service'
import { AuthService } from '@/lib/services/auth-service'
import type { User } from '@supabase/supabase-js'
import { XpContext, ProgressContext } from "./XpContext"
import { UserLessonProgress } from '@/lib/supabase/database'
import { OnboardingGuard } from '@/components/onboarding/OnboardingGuard'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isEmailVerified: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  resendVerification: (email: string) => Promise<{ error: string | null }>
  sendPasswordReset: (email: string) => Promise<{ error: string | null }> // Added sendPasswordReset
  changePassword: (email: string, currentPassword: string, newPassword: string) => Promise<{ error: string | null }>
}

interface AuthProviderProps {
  children: React.ReactNode
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function SmartAuthProvider({ children }: AuthProviderProps) {
  // Single loading state - replaces multiple loading states
  const [isReady, setIsReady] = useState(false)
  const [sessionState, setSessionState] = useState<{
    user: User | null
    isEmailVerified: boolean
  }>({
    user: null,
    isEmailVerified: false
  })

  // Reactive state for XP and Progress - updated via events
  const [xpState, setXpState] = useState<number>(0)
  const [progressState, setProgressState] = useState<UserLessonProgress[]>([])

  // Initialize session on mount
  useEffect(() => {
    initializeSession()
  }, [])

  // Set up event listeners for reactive updates
  useEffect(() => {
    const unsubscribe = SmartAuthService.addEventListener((eventType, data) => {
      switch (eventType) {
        case 'xp-updated':
          setXpState(data.newXp)
          break
        case 'progress-updated':
          setProgressState(data.progress)
          break
        case 'session-changed':
          // Handle session changes if needed
          break
      }
    })

    // Cleanup on unmount
    return unsubscribe
  }, [])

  const initializeSession = async () => {
    try {
      const state = await SmartAuthService.initializeSession()
      setSessionState({
        user: state.user,
        isEmailVerified: state.isEmailVerified
      })
      
      // Initialize reactive state from cached data
      if (state.user && state.isEmailVerified) {
        setXpState(SmartAuthService.getUserXp())
        setProgressState(SmartAuthService.getUserProgress())
      } else {
        setXpState(0)
        setProgressState([])
      }
      
      setIsReady(state.isReady)
    } catch (error) {
      console.error('Failed to initialize session:', error)
      setIsReady(true)
    }
  }

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const result = await SmartAuthService.signIn(email, password)
      
      if (result.error) {
        return { error: result.error.message }
      }

      // Update session state
      const newState = SmartAuthService.getSessionState()
      setSessionState({
        user: newState.user,
        isEmailVerified: newState.isEmailVerified
      })

      // Update reactive state after successful sign in
      if (newState.user && newState.isEmailVerified) {
        setXpState(SmartAuthService.getUserXp())
        setProgressState(SmartAuthService.getUserProgress())
      }

      return { error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  }

  const signUp = async (email: string, password: string, firstName: string, lastName: string): Promise<{ error: string | null }> => {
    try {
      // Use existing AuthService for sign up (no need to optimize this flow)
      const { user: newUser, error } = await AuthService.signUp({ email, password, firstName, lastName })
      
      if (error) {
        return { error: error.message }
      }

      // Update session state if successful
      if (newUser) {
        await initializeSession()
      }

      return { error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      await SmartAuthService.signOut()
      
      // Clear session state and reactive data
      setSessionState({
        user: null,
        isEmailVerified: false
      })
      setXpState(0)
      setProgressState([])
    } catch (error) {
      console.error('Failed to sign out:', error)
    }
  }

  const resendVerification = async (email: string): Promise<{ error: string | null }> => {
    try {
      // Use existing AuthService for email operations
      const { error } = await AuthService.resendEmailVerification(email)
      
      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      return { error: 'Failed to resend verification email' }
    }
  }

  const sendPasswordReset = async (email: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await AuthService.sendPasswordReset(email)
      if (error) {
        return { error: error.message }
      }
      return { error: null }
    } catch (error) {
      return { error: 'Failed to send password reset email' }
    }
  }

  const changePassword = async (email: string, currentPassword: string, newPassword: string): Promise<{ error: string | null }> => {
    // Use existing AuthService for password operations
    const { error } = await AuthService.changePassword({ email, currentPassword, newPassword })
    return { error: error ? error.message : null }
  }

  const value: AuthContextType = {
    user: sessionState.user,
    isLoading: !isReady, // Single loading state
    isEmailVerified: sessionState.isEmailVerified,
    signIn,
    signUp,
    signOut,
    resendVerification,
    sendPasswordReset,
    changePassword
  }

  return (
    <AuthContext.Provider value={value}>
      <XpContext.Provider value={{ 
        xp: xpState, // Now reactive to SmartAuthService events!
        isXpLoading: !isReady, // Single loading state for XP too
        setXp: (value: React.SetStateAction<number>) => {
          // Handle both direct values and function updates
          const newXp = typeof value === 'function' ? value(xpState) : value
          SmartAuthService.updateUserData({ totalXp: newXp })
          // Note: setXpState will be called via event listener, no need to call it here
        }
      }}>
        <ProgressContext.Provider value={{ 
          progressData: progressState, // Now reactive to SmartAuthService events!
          isProgressLoading: !isReady, // Single loading state for progress
          setProgressData: (value: React.SetStateAction<UserLessonProgress[]>) => {
            // Handle both direct values and function updates
            const newProgress = typeof value === 'function' ? value(progressState) : value
            SmartAuthService.updateUserData({ progress: newProgress })
            // Note: setProgressState will be called via event listener, no need to call it here
          }
        }}>
          <OnboardingGuard>
            {children}
          </OnboardingGuard>
        </ProgressContext.Provider>
      </XpContext.Provider>
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context - exact same interface
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 