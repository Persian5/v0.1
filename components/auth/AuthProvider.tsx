"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthService } from '@/lib/services/auth-service'
import { XpService } from '@/lib/services/xp-service'
import { LessonProgressService } from '@/lib/services/lesson-progress-service'
import type { User } from '@supabase/supabase-js'
import { XpContext, ProgressContext } from "./XpContext"
import { UserLessonProgress } from '@/lib/supabase/database'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isEmailVerified: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  resendVerification: (email: string) => Promise<{ error: string | null }>
  changePassword: (email: string, currentPassword: string, newPassword: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [hasInitializedSync, setHasInitializedSync] = useState(false)
  const [xpTotal, setXpTotal] = useState<number>(0)
  const [isXpLoading, setIsXpLoading] = useState(true)
  const [progressData, setProgressData] = useState<UserLessonProgress[]>([])
  const [isProgressLoading, setIsProgressLoading] = useState(true)

  // Initialize auth state and set up listener
  useEffect(() => {
    // Get initial user
    const initializeAuth = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser()
        setUser(currentUser)
        
        if (currentUser) {
          const verified = await AuthService.isEmailVerified(currentUser)
          setIsEmailVerified(verified)
          
          // Initialize sync service for authenticated users
          if (verified && !hasInitializedSync) {
            XpService.initializeSyncService()
            setHasInitializedSync(true)
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Set up auth state listener
    const { data: { subscription } } = AuthService.onAuthStateChange(async (newUser) => {
      setUser(newUser)
      
      if (newUser) {
        try {
          const verified = await AuthService.isEmailVerified(newUser)
          setIsEmailVerified(verified)
          
          // Initialize sync service for newly authenticated users
          if (verified && !hasInitializedSync) {
            XpService.initializeSyncService()
            setHasInitializedSync(true)
          }
        } catch (error) {
          console.error('Failed to check email verification:', error)
          setIsEmailVerified(false)
        }
      } else {
        setIsEmailVerified(false)
        
        // Stop sync service when user signs out
        if (hasInitializedSync) {
          XpService.stopSyncService()
          setHasInitializedSync(false)
        }
      }
      
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [hasInitializedSync])

  // Cleanup sync service on unmount
  useEffect(() => {
    return () => {
      if (hasInitializedSync) {
        XpService.stopSyncService()
      }
    }
  }, [hasInitializedSync])

  // Load total XP when user auth state is established
  useEffect(() => {
    const fetchXp = async () => {
      if (user && isEmailVerified) {
        try {
          const total = await XpService.getUserXp()
          setXpTotal(total)
        } catch (err) {
          console.error('Failed to fetch user XP:', err)
          setXpTotal(0)
        }
      } else {
        setXpTotal(0)
      }
      setIsXpLoading(false)
    }

    fetchXp()
  }, [user, isEmailVerified])

  // Load lesson progress when user auth state is established
  useEffect(() => {
    const fetchProgress = async () => {
      if (user && isEmailVerified) {
        try {
          const progress = await LessonProgressService.getUserLessonProgress()
          setProgressData(progress)
          
          // Set up progress cache updater
          LessonProgressService.setProgressCacheUpdater(setProgressData)
        } catch (err) {
          console.error('Failed to fetch user progress:', err)
          setProgressData([])
        }
      } else {
        setProgressData([])
        // Clear progress cache updater when not authenticated
        LessonProgressService.clearProgressCacheUpdater()
      }
      setIsProgressLoading(false)
    }

    fetchProgress()
  }, [user, isEmailVerified])

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    setIsLoading(true)
    try {
      const { user: signedInUser, error } = await AuthService.signIn({ email, password })
      
      if (error) {
        return { error: error.message }
      }

      // User state will be updated via the auth state change listener
      return { error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string, firstName: string, lastName: string): Promise<{ error: string | null }> => {
    setIsLoading(true)
    try {
      const { user: newUser, error } = await AuthService.signUp({ email, password, firstName, lastName })
      
      if (error) {
        return { error: error.message }
      }

      // User state will be updated via the auth state change listener
      return { error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async (): Promise<void> => {
    setIsLoading(true)
    try {
      await AuthService.signOut()
      // User state will be updated via the auth state change listener
    } catch (error) {
      console.error('Failed to sign out:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resendVerification = async (email: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await AuthService.resendEmailVerification(email)
      
      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      return { error: 'Failed to resend verification email' }
    }
  }

  const changePassword = async (email: string, currentPassword: string, newPassword: string): Promise<{ error: string | null }> => {
    const { error } = await AuthService.changePassword({ email, currentPassword, newPassword });
    return { error: error ? error.message : null };
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isEmailVerified,
    signIn,
    signUp,
    signOut,
    resendVerification,
    changePassword
  }

  return (
    <AuthContext.Provider value={value}>
      <XpContext.Provider value={{ xp: xpTotal, isXpLoading, setXp: setXpTotal }}>
        <ProgressContext.Provider value={{ progressData, isProgressLoading, setProgressData }}>
          {children}
        </ProgressContext.Provider>
      </XpContext.Provider>
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 