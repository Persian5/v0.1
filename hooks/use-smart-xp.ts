import { useContext, useCallback } from 'react'
import { SmartAuthService } from '@/lib/services/smart-auth-service'
import { useAuth } from '@/components/auth/SmartAuthProvider'
import { XpContext } from '@/components/auth/XpContext'

interface XpTransaction {
  amount: number
  source: string
  timestamp: number
  lessonId?: string
  moduleId?: string
  activityType?: string
  isRemediation?: boolean
}

interface UseXpReturn {
  xp: number
  isLoading: boolean
  addXp: (
    amount: number,
    source: string,
    metadata?: Partial<XpTransaction>
  ) => Promise<void>
  lastTransaction: XpTransaction | null
  syncStatus?: {
    pendingCount: number
    isSyncing: boolean
    isOnline: boolean
  }
}

/**
 * Enhanced XP hook using SmartAuthService for optimistic updates
 * Maintains exact same interface as existing useXp hook
 */
export function useSmartXp(): UseXpReturn {
  const { user, isEmailVerified, isLoading: authLoading } = useAuth()
  const xpCtx = useContext(XpContext)

  // Get XP from context (cached session data)
  const xp = xpCtx?.xp || 0
  const isLoading = authLoading || (xpCtx?.isXpLoading ?? true)

  // Add XP with optimistic updates
  const addXp = useCallback(async (
    amount: number,
    source: string,
    metadata: Partial<XpTransaction> = {}
  ) => {
    if (!user || !isEmailVerified) {
      console.warn('Cannot add XP: user not authenticated')
      return
    }

    // Use SmartAuthService for optimistic updates + background sync
    // PHASE 1 FIX: Remove direct call to addUserXp to prevent double counting
    // XpService.awardXpOnce is now the single source of truth for XP awards
    // await SmartAuthService.addUserXp(amount, source, {
    //   lessonId: metadata.lessonId,
    //   moduleId: metadata.moduleId,
    //   activityType: metadata.activityType,
    //   isRemediation: metadata.isRemediation
    // })

    // Update context immediately for instant UI feedback
    // PHASE 1 FIX: Keep context update for UI responsiveness if needed,
    // but relying on the event from XpService is better.
    // For now, we disable this too to ensure single source of truth.
    // if (xpCtx?.setXp) {
    //   xpCtx.setXp(prev => prev + amount)
    // }
    
    console.warn('useSmartXp.addXp is deprecated. Use XpService.awardXpOnce instead.')
  }, [user, isEmailVerified, xpCtx])

  return {
    xp,
    isLoading,
    addXp,
    lastTransaction: null, // Not needed with optimistic updates
    syncStatus: {
      pendingCount: 0,
      isSyncing: false, 
      isOnline: true
    }
  }
} 