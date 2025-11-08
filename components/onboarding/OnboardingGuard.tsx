"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { OnboardingService } from '@/lib/services/onboarding-service'
import { SmartAuthService } from '@/lib/services/smart-auth-service'
import { OnboardingModal } from './OnboardingModal'

/**
 * OnboardingGuard Component
 * 
 * Automatically checks if authenticated users need to complete onboarding
 * and shows the OnboardingModal if needed.
 * 
 * Behavior:
 * - Only activates when user is authenticated AND email verified
 * - Uses cached profile data (fast, no DB call)
 * - Shows modal if onboarding_completed === false
 * - Handles edge cases (profile not loaded yet, etc.)
 * - Non-blocking: User can close modal and continue browsing
 * 
 * Integration:
 * - Add to SmartAuthProvider to catch all cases globally
 * - Works after page reloads (AuthModal → reload → guard catches it)
 * - Works after verify page redirects
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isEmailVerified, isLoading } = useAuth()
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    // Only check when:
    // 1. Auth is ready (not loading)
    // 2. User is authenticated
    // 3. Email is verified
    if (isLoading || !user || !isEmailVerified || isChecking) {
      return
    }

    const checkOnboardingStatus = async () => {
      setIsChecking(true)

      try {
        // Fast path: Check cached profile first (no DB call)
        const cachedStatus = OnboardingService.getCachedOnboardingStatus()
        
        if (cachedStatus) {
          // Cache hit - instant check
          if (cachedStatus.needsOnboarding) {
            setShowOnboardingModal(true)
          }
          setIsChecking(false)
          return
        }

        // Cache miss - profile might not be loaded yet
        // Wait a bit for SmartAuthService to finish initializing
        // This handles the case where user just verified email
        await new Promise(resolve => setTimeout(resolve, 500))

        // Try cached check again
        const retryCachedStatus = OnboardingService.getCachedOnboardingStatus()
        if (retryCachedStatus) {
          if (retryCachedStatus.needsOnboarding) {
            setShowOnboardingModal(true)
          }
          setIsChecking(false)
          return
        }

        // Still no cache - fetch from database (fallback)
        const needsOnboarding = await OnboardingService.checkNeedsOnboarding(user.id)
        if (needsOnboarding) {
          setShowOnboardingModal(true)
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error)
        // Fail-safe: Don't show modal if check fails (user can continue)
      } finally {
        setIsChecking(false)
      }
    }

    checkOnboardingStatus()
  }, [user, isEmailVerified, isLoading])

  const handleOnboardingComplete = () => {
    setShowOnboardingModal(false)
    // Profile cache will be updated by OnboardingService
    // No need to reload or redirect - user stays on current page
  }

  const handleOnboardingClose = () => {
    setShowOnboardingModal(false)
    // User can close modal and continue browsing
    // Modal will show again on next page load if still needed
  }

  return (
    <>
      {children}
      {user && isEmailVerified && (
        <OnboardingModal
          isOpen={showOnboardingModal}
          onClose={handleOnboardingClose}
          onComplete={handleOnboardingComplete}
        />
      )}
    </>
  )
}

