import { useState, useEffect } from 'react'
import { SmartAuthService } from '@/lib/services/smart-auth-service'
import { useAuth } from '@/components/auth/AuthProvider'

/**
 * Custom hook for accessing cached premium subscription status
 * 
 * Benefits:
 * - Single API call on app load (cached in SmartAuthService)
 * - Reactive updates when premium status changes
 * - No flash of incorrect UI (Upgrade button won't flicker)
 * - Consistent across all components
 * 
 * Usage:
 * ```tsx
 * const { hasPremium, isLoading } = usePremium()
 * 
 * if (isLoading) return <Skeleton />
 * if (hasPremium) return <PremiumFeature />
 * return <UpgradePrompt />
 * ```
 */
export function usePremium() {
  const { user, isEmailVerified, isLoading: authLoading } = useAuth()
  // Start with null to distinguish "not loaded yet" from "loaded and false"
  const [hasPremium, setHasPremium] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      setIsLoading(true)
      return
    }

    // No user = not premium (can render immediately)
    if (!user || !isEmailVerified) {
      setHasPremium(false)
      setIsLoading(false)
      return
    }

    // User exists - read from cache (already initialized by SmartAuthProvider)
    setIsLoading(true)
    
    // Read directly from cache - SmartAuthProvider already initialized it
    const cachedStatus = SmartAuthService.getHasPremium()
    setHasPremium(cachedStatus)
    setIsLoading(false)

    // Listen for premium status changes (e.g., user upgrades mid-session)
    const unsubscribe = SmartAuthService.addEventListener((eventType, data) => {
      if (eventType === 'premium-updated') {
        setHasPremium(data.hasPremium)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [user, isEmailVerified, authLoading])

  return {
    hasPremium: hasPremium ?? false, // Default to false if null
    isLoading,
  }
}

