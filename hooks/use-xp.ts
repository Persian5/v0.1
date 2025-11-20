import { useState, useEffect, useCallback, useContext } from 'react'
import { XpService } from '@/lib/services/xp-service'
import { useAuth } from '@/components/auth/AuthProvider'
import { XpContext } from '@/components/auth/XpContext'
import { SmartAuthService } from '@/lib/services/smart-auth-service'

// XP Configuration - simplified for authentication-aware system
export interface XpConfig {
  defaultValue: number
  maxValue?: number
  minValue?: number
}

// Default XP configuration
const DEFAULT_XP_CONFIG: XpConfig = {
  defaultValue: 0,
  maxValue: 999999,
  minValue: 0,
}

// XP transaction types for analytics/history
export interface XpTransaction {
  amount: number
  source: string
  timestamp: number
  lessonId?: string
  moduleId?: string
  activityType?: 'flashcard' | 'quiz' | 'input' | 'matching' | 'final' | 'bonus'
}

// Hook return interface
export interface UseXpReturn {
  xp: number
  addXp: (amount: number, source: string, metadata?: Partial<XpTransaction>) => void
  setXp: (value: number) => void
  resetXp: () => void
  isLoading: boolean
  lastTransaction: XpTransaction | null
  syncStatus?: {
    pendingCount: number
    isSyncing: boolean
    isOnline: boolean
  }
}

/**
 * Custom hook for managing user XP with authentication-aware persistence
 * Authenticated users: Pure Supabase XP (no localStorage)
 * Unauthenticated users: No XP tracking (start fresh when they sign up)
 */
export function useXp(config: Partial<XpConfig> = {}): UseXpReturn {
  const xpConfig = { ...DEFAULT_XP_CONFIG, ...config }
  const { user, isEmailVerified, isLoading: authLoading } = useAuth()
  const xpCtx = useContext(XpContext)
  
  // Use global context if available, else local state
  const [localXp, setLocalXp] = useState<number>(xpConfig.defaultValue)
  const xp = xpCtx ? xpCtx.xp : localXp
  const setXpState = xpCtx ? xpCtx.setXp : setLocalXp
  
  // Derive loading state - if context exists, use its loading state
  const [isLoading, setIsLoading] = useState(xpCtx ? false : !authLoading)
  const [lastTransaction, setLastTransaction] = useState<XpTransaction | null>(null)
  const [syncStatus, setSyncStatus] = useState<{
    pendingCount: number
    isSyncing: boolean
    isOnline: boolean
  }>({ pendingCount: 0, isSyncing: false, isOnline: true })

  // Deprecation warning
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.warn("useXp is deprecated — use useSmartXp instead")
    }
  }, [])

  // Load XP from Supabase for authenticated users
  useEffect(() => {
    if (xpCtx) {
      // Context handles loading; just mark not loading
      setIsLoading(false)
      return
    }

    // Don't load XP if auth is still loading
    if (authLoading) {
      setIsLoading(true)
      return
    }

    const loadXp = async () => {
      setIsLoading(true)
      
      try {
        if (user && isEmailVerified) {
          // Authenticated user - get from Supabase
          const userXp = await XpService.getUserXp()
          setXpState(Math.max(xpConfig.minValue!, Math.min(xpConfig.maxValue!, userXp)))
        } else {
          // Unauthenticated user - no XP tracking
          setXpState(0)
        }
      } catch (error) {
        console.warn('Failed to load XP:', error)
        setXpState(0)
      } finally {
        setIsLoading(false)
      }
    }

    loadXp()
  }, [user, isEmailVerified, authLoading, xpConfig.minValue, xpConfig.maxValue, xpCtx])

  // Update sync status periodically only in development
  const SHOW_SYNC_STATUS = process.env.NODE_ENV === 'development'

  useEffect(() => {
    if (SHOW_SYNC_STATUS && user && isEmailVerified) {
      const updateSyncStatus = () => {
        const status = XpService.getSyncStatus()
        setSyncStatus(status)
      }

      updateSyncStatus()

      const interval = setInterval(updateSyncStatus, 2000)

      return () => clearInterval(interval)
    }
  }, [user, isEmailVerified, SHOW_SYNC_STATUS])

  // Keep local loading state in sync with global context
  useEffect(() => {
    if (xpCtx) {
      setIsLoading(false)
    }
  }, [xpCtx?.isXpLoading])

  // Add XP with authentication-aware handling
  const addXp = useCallback(async (
    amount: number, 
    source: string, 
    metadata: Partial<XpTransaction> = {}
  ) => {
    // PHASE 4.2 FIX: Deprecate and disable addXp to prevent double counting
    // XP is now handled via XpService.awardXpOnce (unified pipeline)
    console.warn('useXp.addXp is deprecated and disabled. Use XpService.awardXpOnce instead.')
  }, [])

  // Set XP directly (for authenticated users only)
  const setXp = useCallback((value: number) => {
    if (isLoading || !user || !isEmailVerified) return

    const newXp = Math.max(
      xpConfig.minValue!,
      Math.min(xpConfig.maxValue!, value)
    )
    if (xpCtx) {
      xpCtx.setXp(newXp)
    } else {
      setXpState(newXp)
    }
  }, [isLoading, user, isEmailVerified, xpConfig.minValue, xpConfig.maxValue, xpCtx])

  // Reset XP (for authenticated users only)
  const resetXp = useCallback(() => {
    if (!user || !isEmailVerified) return
    
    if (xpCtx) {
      xpCtx.setXp(xpConfig.defaultValue)
    } else {
      setXpState(xpConfig.defaultValue)
    }
    setLastTransaction(null)
  }, [user, isEmailVerified, xpConfig.defaultValue, xpCtx])

  return {
    xp,
    addXp,
    setXp,
    resetXp,
    isLoading,
    lastTransaction,
    syncStatus: user && isEmailVerified ? syncStatus : undefined,
  }
} 