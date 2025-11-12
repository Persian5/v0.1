import { useState, useEffect, useCallback } from 'react'
import { LevelService } from '@/lib/services/level-service'
import { SmartAuthService } from '@/lib/services/smart-auth-service'
import { useAuth } from '@/components/auth/AuthProvider'
import type { LevelProgress } from '@/lib/services/level-service'

export interface UseLevelReturn {
  level: number
  progress: LevelProgress | null
  isLoading: boolean
  error: Error | null
  refreshLevel: () => Promise<void>
  formattedLevel: string
  formattedProgress: string
}

/**
 * Custom hook for managing user level
 * Tracks level, XP progress, and remaining XP to next level
 */
export function useLevel(): UseLevelReturn {
  const { user, isEmailVerified, isLoading: authLoading } = useAuth()
  
  const [level, setLevel] = useState<number>(1)
  const [progress, setProgress] = useState<LevelProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Load level data
  const loadLevel = useCallback(async () => {
    if (authLoading) {
      return // Wait for auth to finish
    }

    setIsLoading(true)
    setError(null)

    try {
      if (user && isEmailVerified) {
        // Get total XP from cache first (faster)
        const cachedXp = SmartAuthService.getUserXp()
        
        if (cachedXp > 0 || cachedXp === 0) {
          // Cache hit - calculate level from cached XP
          const levelProgress = await LevelService.getLevelProgress(cachedXp)
          setLevel(levelProgress.level)
          setProgress(levelProgress)
        } else {
          // Cache miss - fetch from database
          const levelProgress = await LevelService.getUserLevelProgress(user.id)
          setLevel(levelProgress.level)
          setProgress(levelProgress)
        }
      } else {
        // Unauthenticated user - default level
        setLevel(1)
        setProgress({
          level: 1,
          currentXp: 0,
          nextLevelXp: 100,
          remainingXp: 100,
          progress: 0
        })
      }
    } catch (err) {
      console.error('Failed to load level:', err)
      setError(err instanceof Error ? err : new Error('Failed to load level'))
      setLevel(1)
      setProgress(null)
    } finally {
      setIsLoading(false)
    }
  }, [user, isEmailVerified, authLoading])

  // Initial load
  useEffect(() => {
    loadLevel()
  }, [loadLevel])

  // Refresh level manually
  const refreshLevel = useCallback(async () => {
    await loadLevel()
  }, [loadLevel])

  // Auto-refresh when XP updates (listen to SmartAuthService events)
  useEffect(() => {
    if (!user || !isEmailVerified) return

    const unsubscribe = SmartAuthService.addEventListener((eventType, data) => {
      if (eventType === 'xp-updated') {
        // XP changed - recalculate level
        const newXp = data.newXp || 0
        LevelService.getLevelProgress(newXp).then(levelProgress => {
          setLevel(levelProgress.level)
          setProgress(levelProgress)
        }).catch(console.error)
      }
    })

    return unsubscribe
  }, [user, isEmailVerified])

  // Format helpers
  const formattedLevel = progress ? LevelService.formatLevel(progress.level) : 'Level 1'
  const formattedProgress = progress ? LevelService.formatProgress(progress) : '0/100 XP to Level 2'

  return {
    level,
    progress,
    isLoading,
    error,
    refreshLevel,
    formattedLevel,
    formattedProgress
  }
}

