import { useContext } from 'react'
import { SmartAuthService } from '@/lib/services/smart-auth-service'
import { useAuth } from '@/components/auth/SmartAuthProvider'
import { ProgressContext } from '@/components/auth/XpContext'
import { UserLessonProgress } from '@/lib/supabase/database'

interface UseProgressReturn {
  progressData: UserLessonProgress[]
  isProgressLoading: boolean
  setProgressData: (progress: UserLessonProgress[]) => void
  updateProgress: (moduleId: string, lessonId: string, updates: Partial<UserLessonProgress>) => Promise<void>
}

/**
 * Enhanced progress hook using SmartAuthService for cached data and optimistic updates
 * Maintains exact same interface as existing progress hooks
 */
export function useSmartProgress(): UseProgressReturn {
  const { user, isEmailVerified, isLoading: authLoading } = useAuth()
  const progressCtx = useContext(ProgressContext)

  // Get progress from context (cached session data)
  const progressData = progressCtx?.progressData || []
  const isProgressLoading = authLoading || (progressCtx?.isProgressLoading ?? true)

  const setProgressData = (progress: UserLessonProgress[]) => {
    // Update both context and SmartAuthService cache
    if (progressCtx?.setProgressData) {
      progressCtx.setProgressData(progress)
    }
    SmartAuthService.updateUserData({ progress })
  }

  const updateProgress = async (
    moduleId: string,
    lessonId: string,
    updates: Partial<UserLessonProgress>
  ): Promise<void> => {
    if (!user || !isEmailVerified) {
      console.warn('Cannot update progress: user not authenticated')
      return
    }

    // Use SmartAuthService for optimistic updates + background sync
    await SmartAuthService.updateLessonProgress(moduleId, lessonId, updates)

    // Context will be updated automatically by SmartAuthService
  }

  return {
    progressData,
    isProgressLoading,
    setProgressData,
    updateProgress
  }
} 