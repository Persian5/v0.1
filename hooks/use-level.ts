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
  const loadLevel = useCallback(async (isMounted: () => boolean) => {
    if (authLoading) {
      return // Wait for auth to finish
    }

    if (isMounted()) {
      setIsLoading(true)
      setError(null)
    }

    try {
      if (user && isEmailVerified) {
        // Get total XP from cache first (faster)
        let cachedXp: number | null = null
        try {
          cachedXp = SmartAuthService.getUserXp()
        } catch (error) {
          // Cache access failed - continue to API call
          console.warn('Cache access failed, fetching from API:', error)
        }
        
        let levelProgress
        if (cachedXp !== null && (cachedXp > 0 || cachedXp === 0)) {
          // Cache hit - calculate level from cached XP
          levelProgress = await LevelService.getLevelProgress(cachedXp)
        } else {
          // Cache miss - fetch from database
          levelProgress = await LevelService.getUserLevelProgress(user.id)
        }
        
        if (!isMounted()) return // Component unmounted, don't update state
        
        setLevel(levelProgress.level)
        setProgress(levelProgress)
      } else {
        // Unauthenticated user - default level
        if (isMounted()) {
          setLevel(1)
          setProgress({
            level: 1,
            currentXp: 0,
            nextLevelXp: 100,
            remainingXp: 100,
            progress: 0
          })
        }
      }
    } catch (err) {
      console.error('Failed to load level:', err)
      if (isMounted()) {
        setError(err instanceof Error ? err : new Error('Failed to load level'))
        setLevel(1)
        setProgress(null)
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
    
    loadLevel(checkMounted)
    
    return () => {
      isMounted = false
    }
  }, [loadLevel])

  // Refresh level manually
  const refreshLevel = useCallback(async () => {
    let isMounted = true
    await loadLevel(() => isMounted)
  }, [loadLevel])

  // Auto-refresh when XP updates (listen to SmartAuthService events)
  useEffect(() => {
    if (!user || !isEmailVerified) return

    let isMounted = true

    const unsubscribe = SmartAuthService.addEventListener((eventType, data) => {
      if (!isMounted) return // Guard against calls after unmount
      
      if (eventType === 'xp-updated') {
        // XP changed - recalculate level
        const newXp = data.newXp || 0
        LevelService.getLevelProgress(newXp).then(levelProgress => {
          if (isMounted) {
            setLevel(levelProgress.level)
            setProgress(levelProgress)
          }
        }).catch((error) => {
          if (isMounted) {
            console.error('Failed to refresh level:', error)
          }
        })
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
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

