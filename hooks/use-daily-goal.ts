import { useState, useEffect, useCallback } from 'react'
import { DailyGoalService } from '@/lib/services/daily-goal-service'
import { SmartAuthService } from '@/lib/services/smart-auth-service'
import { useAuth } from '@/components/auth/AuthProvider'
import type { DailyGoalProgress, DailyGoalData } from '@/lib/services/daily-goal-service'

export interface UseDailyGoalReturn {
  goal: number
  progress: DailyGoalProgress
  isLoading: boolean
  error: Error | null
  refreshProgress: () => Promise<void>
  updateGoal: (newGoal: number) => Promise<{ success: boolean; error?: string }>
  formattedProgress: string
  formattedPercentage: string
}

/**
 * Custom hook for managing daily XP goal
 * Tracks progress against user-defined daily goal
 */
export function useDailyGoal(): UseDailyGoalReturn {
  const { user, isEmailVerified, isLoading: authLoading } = useAuth()
  
  const [goal, setGoal] = useState<number>(50)
  const [progress, setProgress] = useState<DailyGoalProgress>({
    earned: 0,
    goal: 50,
    percentage: 0,
    remaining: 50,
    isMet: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Load daily goal data
  const loadDailyGoal = useCallback(async (isMounted: () => boolean) => {
    if (authLoading) {
      return // Wait for auth to finish
    }

    if (isMounted()) {
      setIsLoading(true)
      setError(null)
    }

    try {
      if (user && isEmailVerified) {
        // Fetch daily goal data
        const goalData = await DailyGoalService.getDailyGoalData(user.id)
        
        if (!isMounted()) return // Component unmounted, don't update state
        
        setGoal(goalData.goal)
        setProgress(goalData.progress)
      } else {
        // Unauthenticated user - default values
        if (isMounted()) {
          setGoal(50)
          setProgress({
            earned: 0,
            goal: 50,
            percentage: 0,
            remaining: 50,
            isMet: false
          })
        }
      }
    } catch (err) {
      console.error('Failed to load daily goal:', err)
      if (isMounted()) {
        setError(err instanceof Error ? err : new Error('Failed to load daily goal'))
        setGoal(50)
        setProgress({
          earned: 0,
          goal: 50,
          percentage: 0,
          remaining: 50,
          isMet: false
        })
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
    
    loadDailyGoal(checkMounted)
    
    return () => {
      isMounted = false
    }
  }, [loadDailyGoal])

  // Refresh progress manually
  const refreshProgress = useCallback(async () => {
    let isMounted = true
    await loadDailyGoal(() => isMounted)
  }, [loadDailyGoal])

  // Update daily goal
  const updateGoal = useCallback(async (
    newGoal: number
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user || !isEmailVerified) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    setError(null)

    try {
      const result = await DailyGoalService.setDailyGoal(newGoal, user.id)
      
      if (result.success) {
        // Reload data to get updated progress
        let isMounted = true
        await loadDailyGoal(() => isMounted)
      }
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update daily goal'
      setError(new Error(errorMessage))
      return {
        success: false,
        error: errorMessage
      }
    }
  }, [user, isEmailVerified, loadDailyGoal])

  // Auto-refresh on XP updates (daily goal progress changes)
  // OPTIMIZED: Only refresh if daily XP actually changed (not just total XP)
  useEffect(() => {
    if (!user || !isEmailVerified) return

    let isMounted = true
    let lastDailyXp = progress.earned

    const unsubscribe = SmartAuthService.addEventListener((eventType, data) => {
      if (!isMounted) return // Guard against calls after unmount
      
      if (eventType === 'xp-updated') {
        // Check if this XP update affects today's daily XP
        // Only refresh if we're not sure (let DailyGoalService check)
        // This prevents unnecessary refreshes when XP changes don't affect daily goal
        refreshProgress().then(() => {
          if (isMounted && progress.earned !== lastDailyXp) {
            lastDailyXp = progress.earned
          }
        }).catch((error) => {
          if (isMounted) {
            console.error('Failed to refresh daily goal progress:', error)
          }
        })
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [user, isEmailVerified, refreshProgress, progress.earned])

  // Format helpers
  const formattedProgress = DailyGoalService.formatProgress(progress)
  const formattedPercentage = DailyGoalService.formatPercentage(progress)

  return {
    goal,
    progress,
    isLoading,
    error,
    refreshProgress,
    updateGoal,
    formattedProgress,
    formattedPercentage
  }
}

