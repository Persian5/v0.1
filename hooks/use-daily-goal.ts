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
  const loadDailyGoal = useCallback(async () => {
    if (authLoading) {
      return // Wait for auth to finish
    }

    setIsLoading(true)
    setError(null)

    try {
      if (user && isEmailVerified) {
        // Fetch daily goal data
        const goalData = await DailyGoalService.getDailyGoalData(user.id)
        setGoal(goalData.goal)
        setProgress(goalData.progress)
      } else {
        // Unauthenticated user - default values
        setGoal(50)
        setProgress({
          earned: 0,
          goal: 50,
          percentage: 0,
          remaining: 50,
          isMet: false
        })
      }
    } catch (err) {
      console.error('Failed to load daily goal:', err)
      setError(err instanceof Error ? err : new Error('Failed to load daily goal'))
      setGoal(50)
      setProgress({
        earned: 0,
        goal: 50,
        percentage: 0,
        remaining: 50,
        isMet: false
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, isEmailVerified, authLoading])

  // Initial load
  useEffect(() => {
    loadDailyGoal()
  }, [loadDailyGoal])

  // Refresh progress manually
  const refreshProgress = useCallback(async () => {
    await loadDailyGoal()
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
        await loadDailyGoal()
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

  // Auto-refresh on window focus (to catch XP updates)
  useEffect(() => {
    const handleFocus = () => {
      if (user && isEmailVerified) {
        refreshProgress()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user, isEmailVerified, refreshProgress])

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

