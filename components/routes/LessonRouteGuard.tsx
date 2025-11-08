"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { SmartAuthService } from '@/lib/services/smart-auth-service'
import { LessonProgressService } from '@/lib/services/lesson-progress-service'
import { getLesson, getModule } from '@/lib/config/curriculum'
import { PremiumLockModal } from '@/components/PremiumLockModal'
import { AuthModal } from '@/components/auth/AuthModal'
import { getCachedModuleAccess, setCachedModuleAccess } from '@/lib/utils/module-access-cache'

interface LessonRouteGuardProps {
  children: React.ReactNode
  requireCompleted?: boolean  // For completion route - must have completed lesson
  requireAccess?: boolean      // For summary route - must have module access
  /**
   * If true, this is embedded context (props passed from parent)
   * If false, this is standalone route access
   */
  isEmbedded?: boolean
  /**
   * Custom redirect handler - called when unauthorized
   */
  onUnauthorized?: (reason: 'not_completed' | 'no_access' | 'not_authenticated' | 'not_found' | 'error') => void
}

/**
 * LessonRouteGuard - Protects completion and summary routes
 * 
 * Handles:
 * - Authentication check
 * - Lesson completion check (for completion route)
 * - Module access check (for summary route)
 * - Premium paywall (for summary route)
 * - Error states
 * - Loading states
 */
export function LessonRouteGuard({
  children,
  requireCompleted = false,
  requireAccess = false,
  isEmbedded = false,
  onUnauthorized
}: LessonRouteGuardProps) {
  const params = useParams()
  const router = useRouter()
  
  const moduleId = typeof params.moduleId === 'string' ? params.moduleId : ''
  const lessonId = typeof params.lessonId === 'string' ? params.lessonId : ''
  
  const [guardState, setGuardState] = useState<{
    isLoading: boolean
    isAuthorized: boolean | null
    showPremiumModal: boolean
    showAuthModal: boolean
    error: string | null
  }>({
    isLoading: true,
    isAuthorized: null,
    showPremiumModal: false,
    showAuthModal: false,
    error: null
  })

  // Check if lesson exists
  const lesson = getLesson(moduleId, lessonId)
  const module = getModule(moduleId)

  useEffect(() => {
    const checkAccess = async () => {
      // If embedded, skip guard checks - parent handles authorization
      if (isEmbedded) {
        setGuardState({
          isLoading: false,
          isAuthorized: true,
          showPremiumModal: false,
          showAuthModal: false,
          error: null
        })
        return
      }

      // Reset state
      setGuardState({
        isLoading: true,
        isAuthorized: null,
        showPremiumModal: false,
        showAuthModal: false,
        error: null
      })

      try {
        // STEP 1: Validate lesson exists
        if (!lesson || !module) {
          setGuardState({
            isLoading: false,
            isAuthorized: false,
            showPremiumModal: false,
            showAuthModal: false,
            error: 'Lesson not found'
          })
          onUnauthorized?.('not_found')
          if (!isEmbedded) {
            router.push('/modules')
          }
          return
        }

        // STEP 2: Check authentication
        const { user, isEmailVerified, isReady } = await SmartAuthService.initializeSession()
        
        if (!isReady) {
          // Still initializing
          return
        }

        const isAuthenticated = !!(user && isEmailVerified)

        if (!isAuthenticated) {
          setGuardState({
            isLoading: false,
            isAuthorized: false,
            showPremiumModal: false,
            showAuthModal: true,
            error: null
          })
          onUnauthorized?.('not_authenticated')
          return
        }

        // STEP 3: Check premium access FIRST (CRITICAL - prevents redirecting to premium content)
        // This applies to BOTH completion and summary routes
        if (module.requiresPremium) {
          try {
            // Check cache first (30-second cache to prevent duplicate API calls)
            const cachedAccess = getCachedModuleAccess(moduleId, user.id)
            let accessData
            
            if (cachedAccess) {
              accessData = cachedAccess
            } else {
              // Cache miss - fetch from API
              const accessResponse = await fetch(`/api/check-module-access?moduleId=${moduleId}`)
              
              if (!accessResponse.ok) {
                throw new Error('Failed to check module access')
              }

              accessData = await accessResponse.json()
              
              // Cache the result
              setCachedModuleAccess(moduleId, user.id, accessData)
            }
            
            // If module requires premium and user doesn't have it, show premium modal
            if (!accessData.canAccess && accessData.reason === 'no_premium') {
              setGuardState({
                isLoading: false,
                isAuthorized: false,
                showPremiumModal: true,
                showAuthModal: false,
                error: null
              })
              onUnauthorized?.('no_access')
              return
            }
          } catch (error) {
            console.error('Failed to check premium access:', error)
            setGuardState({
              isLoading: false,
              isAuthorized: false,
              showPremiumModal: false,
              showAuthModal: false,
              error: 'Failed to verify access'
            })
            onUnauthorized?.('error')
            return
          }
        }

        // STEP 4: Check completion (if required for completion route)
        // Only runs if premium check passed (or module doesn't require premium)
        if (requireCompleted) {
          try {
            const isCompleted = await LessonProgressService.isLessonCompleted(moduleId, lessonId)
            
            if (!isCompleted) {
              // User has premium but hasn't completed lesson → redirect to lesson
              setGuardState({
                isLoading: false,
                isAuthorized: false,
                showPremiumModal: false,
                showAuthModal: false,
                error: 'Lesson not completed'
              })
              onUnauthorized?.('not_completed')
              if (!isEmbedded) {
                router.push(`/modules/${moduleId}/${lessonId}`)
              }
              return
            }
          } catch (error) {
            console.error('Failed to check lesson completion:', error)
            setGuardState({
              isLoading: false,
              isAuthorized: false,
              showPremiumModal: false,
              showAuthModal: false,
              error: 'Failed to verify lesson completion'
            })
            onUnauthorized?.('error')
            return
          }
        }

        // STEP 5: Check module access (if required for summary route)
        // Only runs if premium check passed (or module doesn't require premium)
        if (requireAccess) {
          try {
            // Check cache first
            const cachedAccess = getCachedModuleAccess(moduleId, user.id)
            let accessData
            
            if (cachedAccess) {
              accessData = cachedAccess
            } else {
              const accessResponse = await fetch(`/api/check-module-access?moduleId=${moduleId}`)
              
              if (!accessResponse.ok) {
                throw new Error('Failed to check module access')
              }

              accessData = await accessResponse.json()
              setCachedModuleAccess(moduleId, user.id, accessData)
            }
            
            if (!accessData.canAccess) {
              // Premium already checked above, so this is likely prerequisites
              if (accessData.reason === 'incomplete_prerequisites') {
                setGuardState({
                  isLoading: false,
                  isAuthorized: false,
                  showPremiumModal: false,
                  showAuthModal: false,
                  error: 'You must complete previous modules first'
                })
                onUnauthorized?.('no_access')
                if (!isEmbedded) {
                  router.push('/modules')
                }
                return
              } else {
                // Fallback for other access issues
                setGuardState({
                  isLoading: false,
                  isAuthorized: false,
                  showPremiumModal: false,
                  showAuthModal: false,
                  error: 'Access denied'
                })
                onUnauthorized?.('no_access')
                if (!isEmbedded) {
                  router.push('/modules')
                }
                return
              }
            }
          } catch (error) {
            console.error('Failed to check module access:', error)
            setGuardState({
              isLoading: false,
              isAuthorized: false,
              showPremiumModal: false,
              showAuthModal: false,
              error: 'Failed to verify access'
            })
            onUnauthorized?.('error')
            return
          }
        }

        // All checks passed
        setGuardState({
          isLoading: false,
          isAuthorized: true,
          showPremiumModal: false,
          showAuthModal: false,
          error: null
        })

      } catch (error) {
        console.error('Route guard error:', error)
        setGuardState({
          isLoading: false,
          isAuthorized: false,
          showPremiumModal: false,
          showAuthModal: false,
          error: 'An unexpected error occurred'
        })
        onUnauthorized?.('error')
      }
    }

    if (moduleId && lessonId) {
      checkAccess()
    } else {
      setGuardState({
        isLoading: false,
        isAuthorized: false,
        showPremiumModal: false,
        showAuthModal: false,
        error: 'Invalid route parameters'
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId, lessonId, requireCompleted, requireAccess, isEmbedded])
  // Note: lesson and module are derived from moduleId/lessonId, so not needed in deps
  // router is stable, onUnauthorized is optional callback

  // Loading state
  if (guardState.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (guardState.error && guardState.isAuthorized === false) {
    // If embedded, let parent handle (don't show error UI)
    if (isEmbedded) {
      return null
    }

    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Error</h2>
          <p className="text-muted-foreground">{guardState.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Auth modal
  if (guardState.showAuthModal) {
    // Determine context-specific messaging
    const authTitle = requireCompleted 
      ? "Sign in to view completion"
      : requireAccess
      ? "Sign in to view summary"
      : "Sign in"
    
    const authDescription = requireCompleted
      ? "Sign in to see your lesson completion and track your progress"
      : requireAccess
      ? "Sign in to view your lesson summary and achievements"
      : "Sign in to continue learning Persian"

    return (
      <>
        <AuthModal
          isOpen={true}
          onClose={() => {
            setGuardState(prev => ({ ...prev, showAuthModal: false }))
            if (!isEmbedded) {
              router.push('/modules')
            }
          }}
          onSuccess={async () => {
            // After auth success, immediately check premium access BEFORE allowing access
            // This prevents free users from accessing premium content after sign-in
            if (!isEmbedded && module?.requiresPremium) {
              try {
                const cachedAccess = getCachedModuleAccess(moduleId, user.id)
                let accessData
                
                if (cachedAccess) {
                  accessData = cachedAccess
                } else {
                  const accessResponse = await fetch(`/api/check-module-access?moduleId=${moduleId}`)
                  if (accessResponse.ok) {
                    accessData = await accessResponse.json()
                    setCachedModuleAccess(moduleId, user.id, accessData)
                  }
                }
                
                if (accessData && !accessData.canAccess && accessData.reason === 'no_premium') {
                  // User signed in but doesn't have premium → show premium modal
                  setGuardState(prev => ({ 
                    ...prev, 
                    showAuthModal: false, 
                    showPremiumModal: true,
                    isLoading: false
                  }))
                  return
                }
              } catch (error) {
                console.error('Failed to check premium after auth:', error)
                // On error, redirect to modules for safety
                router.push('/modules')
                return
              }
            }
            
            // Re-check access after auth success
            setGuardState(prev => ({ ...prev, showAuthModal: false, isLoading: true }))
            // Trigger re-check by reloading - this ensures fresh session state
            if (!isEmbedded) {
              window.location.reload()
            }
          }}
          title={authTitle}
          description={authDescription}
        />
      </>
    )
  }

  // Premium modal
  if (guardState.showPremiumModal) {
    return (
      <>
        <PremiumLockModal
          isOpen={true}
          onClose={() => {
            setGuardState(prev => ({ ...prev, showPremiumModal: false }))
            if (!isEmbedded) {
              router.push('/modules')
            }
          }}
          moduleTitle={module?.title}
        />
      </>
    )
  }

  // Not authorized (but no error/modal) - show message
  if (guardState.isAuthorized === false && !guardState.error && !guardState.showAuthModal && !guardState.showPremiumModal) {
    // If embedded, let parent handle
    if (isEmbedded) {
      return null
    }

    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">
            {requireCompleted 
              ? 'You must complete this lesson first.'
              : 'You do not have access to this content.'}
          </p>
          <button
            onClick={() => router.push('/modules')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Back to Modules
          </button>
        </div>
      </div>
    )
  }

  // Authorized - render children
  if (guardState.isAuthorized === true) {
    return <>{children}</>
  }

  // Fallback (shouldn't reach here)
  return null
}

