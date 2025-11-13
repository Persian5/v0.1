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
  const loadStreak = useCallback(async (isMounted: () => boolean) => {
    if (authLoading) {
      return // Wait for auth to finish
    }

    if (isMounted()) {
      setIsLoading(true)
      setError(null)
    }

    try {
      if (user && isEmailVerified) {
        // Try cache first (faster)
        let cachedStreak: number | null = null
        try {
          cachedStreak = SmartAuthService.getUserStreak()
        } catch (error) {
          // Cache access failed - continue to API call
          console.warn('Cache access failed, fetching from API:', error)
        }
        
        const data = await StreakService.getStreakData()
        
        if (!isMounted()) return // Component unmounted, don't update state
        
        setStreak(data.streakCount)
        setStreakData(data)
        
        // Update cache if it's stale or missing
        if (cachedStreak === null || cachedStreak !== data.streakCount) {
          try {
            SmartAuthService.updateUserData({ streakCount: data.streakCount })
          } catch (error) {
            // Cache update failed - non-critical
            console.warn('Failed to update streak cache:', error)
          }
        }
      } else {
        // Unauthenticated user - no streak
        if (isMounted()) {
          setStreak(0)
          setStreakData({
            streakCount: 0,
            lastActivityDate: null,
            lastStreakDate: null
          })
        }
      }
    } catch (err) {
      console.error('Failed to load streak:', err)
      if (isMounted()) {
        setError(err instanceof Error ? err : new Error('Failed to load streak'))
        setStreak(0)
        setStreakData(null)
      }
    } finally {
      if (isMounted()) {
        setIsLoading(false)
      }
    }
  }, [user, isEmailVerified, authLoading])

  // Initial load with mount guard
  useEffect(() => {
    let isMounted = true
    
    const checkMounted = () => isMounted
    
    loadStreak(checkMounted)
    
    return () => {
      isMounted = false
    }
  }, [loadStreak])

  // Refresh streak manually
  const refreshStreak = useCallback(async () => {
    let isMounted = true
    await loadStreak(() => isMounted)
  }, [loadStreak])

  // Auto-refresh on XP updates (streak updates via database trigger)
  // OPTIMIZED: Only refresh if streak actually changed (not just XP)
  useEffect(() => {
    if (!user || !isEmailVerified) return

    let isMounted = true
    let lastStreak = streak

    const unsubscribe = SmartAuthService.addEventListener((eventType, data) => {
      if (!isMounted) return // Guard against calls after unmount
      
      if (eventType === 'xp-updated' || eventType === 'streak-updated') {
        // Only refresh if streak might have changed
        // Streak updates happen via trigger, so we need to check
        refreshStreak().then(() => {
          if (isMounted && streak !== lastStreak) {
            lastStreak = streak
          }
        }).catch((error) => {
          if (isMounted) {
            console.error('Failed to refresh streak:', error)
          }
        })
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [user, isEmailVerified, refreshStreak, streak])

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

