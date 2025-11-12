import { useState, useEffect, useCallback } from 'react'
import { StreakService } from '@/lib/services/streak-service'
import { SmartAuthService } from '@/lib/services/smart-auth-service'
import { useAuth } from '@/components/auth/AuthProvider'
import type { StreakData, StreakMilestone } from '@/lib/services/streak-service'

export interface UseStreakReturn {
  streak: number
  streakData: StreakData | null
  isLoading: boolean
  error: Error | null
  refreshStreak: () => Promise<void>
  milestones: StreakMilestone[]
  nextMilestone: StreakMilestone | null
  formattedStreak: string
}

/**
 * Custom hook for managing user streak
 * Streak updates are automatic via database trigger when XP is awarded
 * This hook provides read-only access to streak data
 */
export function useStreak(): UseStreakReturn {
  const { user, isEmailVerified, isLoading: authLoading } = useAuth()
  
  const [streak, setStreak] = useState<number>(0)
  const [streakData, setStreakData] = useState<StreakData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Load streak data
  const loadStreak = useCallback(async () => {
    if (authLoading) {
      return // Wait for auth to finish
    }

    setIsLoading(true)
    setError(null)

    try {
      if (user && isEmailVerified) {
        // Try cache first (faster)
        const cachedStreak = SmartAuthService.getUserStreak()
        
        if (cachedStreak > 0 || cachedStreak === 0) {
          // Cache hit - use cached value
          // Still fetch full data for lastActivityDate, etc.
          const data = await StreakService.getStreakData()
          setStreak(data.streakCount)
          setStreakData(data)
          
          // Update cache if it's stale
          if (cachedStreak !== data.streakCount) {
            SmartAuthService.updateUserData({ streakCount: data.streakCount })
          }
        } else {
          // Cache miss - fetch from database
          const data = await StreakService.getStreakData()
          setStreak(data.streakCount)
          setStreakData(data)
          
          // Update cache
          SmartAuthService.updateUserData({ streakCount: data.streakCount })
        }
      } else {
        // Unauthenticated user - no streak
        setStreak(0)
        setStreakData({
          streakCount: 0,
          lastActivityDate: null,
          lastStreakDate: null
        })
      }
    } catch (err) {
      console.error('Failed to load streak:', err)
      setError(err instanceof Error ? err : new Error('Failed to load streak'))
      setStreak(0)
      setStreakData(null)
    } finally {
      setIsLoading(false)
    }
  }, [user, isEmailVerified, authLoading])

  // Initial load
  useEffect(() => {
    loadStreak()
  }, [loadStreak])

  // Refresh streak manually
  const refreshStreak = useCallback(async () => {
    await loadStreak()
  }, [loadStreak])

  // Auto-refresh on window focus (to catch streak updates)
  useEffect(() => {
    const handleFocus = () => {
      if (user && isEmailVerified) {
        refreshStreak()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user, isEmailVerified, refreshStreak])

  // Calculate milestones
  const milestones = StreakService.getStreakMilestones(streak)
  const nextMilestone = StreakService.getNextMilestone(streak)
  const formattedStreak = StreakService.formatStreak(streak)

  return {
    streak,
    streakData,
    isLoading,
    error,
    refreshStreak,
    milestones,
    nextMilestone,
    formattedStreak
  }
}

