"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Star, Loader2 } from "lucide-react"
import { useXp } from "@/hooks/use-xp"
import { VocabularyService } from "@/lib/services/vocabulary-service"
import { getLesson, getModule, getLessonSteps, getLessonVocabulary } from "@/lib/config/curriculum"
import { LessonPreviewContent } from "@/components/previews/LessonPreviewContent"
import { BlurredPreviewContainer } from "@/components/previews/BlurredPreviewContainer"
import { NotFound } from "@/components/NotFound"
import { LessonRunner } from "@/app/components/LessonRunner"
import CompletionView from "@/components/lesson/CompletionView"
import SummaryView from "@/components/lesson/SummaryView"
import { ModuleCompletion } from "@/app/components/ModuleCompletion"
import { ModuleProgressService } from "@/lib/services/module-progress-service"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { LessonProgressService } from "@/lib/services/lesson-progress-service"
import { useAuth } from "@/components/auth/AuthProvider"
import { SmartAuthService } from "@/lib/services/smart-auth-service"
import { AuthModal } from "@/components/auth/AuthModal"
import { PremiumLockModal } from "@/components/PremiumLockModal"
import { LockScreen } from "@/components/LockScreen"
import PageErrorBoundary from "@/components/errors/PageErrorBoundary"
import { getCachedModuleAccess, setCachedModuleAccess } from "@/lib/utils/module-access-cache"
import { ModuleAccessService } from "@/lib/services/module-access-service"
import { safeTelemetry } from "@/lib/utils/telemetry-safe"

// Cache staleness threshold (60 seconds - lesson accessibility rarely changes mid-session)
const CACHE_STALENESS_THRESHOLD = 60_000 // 60 seconds

function LessonPageContent() {
  const params = useParams()
  const router = useRouter()
  const searchParamsNav = useSearchParams()
  
  // Validate route parameters
  const moduleId = typeof params.moduleId === 'string' ? params.moduleId : '';
  const lessonId = typeof params.lessonId === 'string' ? params.lessonId : '';
  
  const { xp, addXp, setXp } = useXp();
  const initialViewParam = searchParamsNav.get('view');
  
  const [progress, setProgress] = useState(0);
  const [currentView, setCurrentView] = useState(initialViewParam === 'module-completion' ? 'module-completion' : 'welcome');
  const [previousStates, setPreviousStates] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0); // NEW: Track current step number
  const [totalSteps, setTotalSteps] = useState(0); // NEW: Track total steps
  
  // Unified state for auth + accessibility + premium + locks
  const [appState, setAppState] = useState<{
    isLoading: boolean
    isAuthenticated: boolean
    isAccessible: boolean | null
    showAuthModal: boolean
    showPremiumModal: boolean
    showLockScreen: boolean
    lockType: 'sequential' | 'prerequisites' | null
    lockMessage: string
    missingPrerequisites: string[]
    error: string | null
  }>({
    isLoading: true,
    isAuthenticated: false, 
    isAccessible: null,
    showAuthModal: false,
    showPremiumModal: false,
    showLockScreen: false,
    lockType: null,
    lockMessage: '',
    missingPrerequisites: [],
    error: null
  })
  
  // Get data from config
  const lesson = getLesson(moduleId, lessonId)
  const module = getModule(moduleId);
  
  // UNIFIED AUTH + ACCESSIBILITY CHECK using SmartAuthService cached data
  useEffect(() => {
    const checkAuthAndAccessibility = async () => {
      // Early exit if lesson or module not found
      if (!lesson || !module) {
        return
      }
      
      try {
        setAppState(prev => ({ ...prev, isLoading: true, error: null }))
        
        // Wait for SmartAuthService to initialize (uses cached session)
        const { user, isEmailVerified, isReady } = await SmartAuthService.initializeSession()
        
        if (!isReady) {
          // Still initializing
          return
        }
        
        const isAuthenticated = !!(user && isEmailVerified)
        
        if (!isAuthenticated) {
          // All lessons require authentication (even free Module 1)
          setAppState({
            isLoading: false,
            isAuthenticated: false,
            isAccessible: false,
            showAuthModal: true,
            showPremiumModal: false,
            showLockScreen: false,
            lockType: null,
            lockMessage: '',
            missingPrerequisites: [],
            error: null
          })
          return
        }
        
        // STEP 1: Check premium access FIRST (CRITICAL - prevents free users accessing premium lessons)
        if (module?.requiresPremium) {
          try {
            // Check cache first (30-second cache to prevent duplicate API calls)
            const cachedAccess = getCachedModuleAccess(moduleId, user.id)
            let accessData
            
            if (cachedAccess) {
              accessData = cachedAccess
            } else {
              // Cache miss - fetch from API
              const accessResponse = await fetch(`/api/check-module-access?moduleId=${moduleId}`)
              if (accessResponse.ok) {
                accessData = await accessResponse.json()
                // Cache the result
                setCachedModuleAccess(moduleId, user.id, accessData)
              }
            }
            
            if (accessData && !accessData.canAccess && accessData.reason === 'no_premium') {
              // User doesn't have premium → show premium modal
              setAppState({
                isLoading: false,
                isAuthenticated: true,
                isAccessible: false,
                showAuthModal: false,
                showPremiumModal: true,
                showLockScreen: false,
                lockType: null,
                lockMessage: '',
                missingPrerequisites: [],
                error: null
              })
              return
            }
            
            // STEP 2: Check prerequisites (if premium check passed)
            if (accessData && !accessData.canAccess && accessData.reason === 'incomplete_prerequisites') {
              const missingModules = accessData.missingPrerequisites || []
              const firstMissingModule = missingModules[0] ? getModule(missingModules[0]) : null
              const message = firstMissingModule
                ? `Complete ${firstMissingModule.title} first to unlock this lesson.`
                : 'Complete previous modules first to unlock this lesson.'
              
              setAppState({
                isLoading: false,
                isAuthenticated: true,
                isAccessible: false,
                showAuthModal: false,
                showPremiumModal: false,
                showLockScreen: true,
                lockType: 'prerequisites',
                lockMessage: message,
                missingPrerequisites: missingModules,
                error: null
              })
              return
            }
          } catch (error) {
            console.error('Failed to check premium/prerequisites:', error)
            // On error, continue to sequential check (fail open for now)
          }
        }
        
        // STEP 3: Check sequential access (lesson-level) with staleness detection
        const accessibilityCheckStartTime = Date.now()
        const sessionState = SmartAuthService.getSessionState()
        let isAccessible = false
        let previousLesson: { moduleId: string; lessonId: string } | null = null
        
        if (sessionState.user && SmartAuthService.hasCachedProgress()) {
          // Check cache age to determine if we should trust fast check
          const cacheAge = SmartAuthService.getProgressCacheAge()
          const isCacheStale = cacheAge > CACHE_STALENESS_THRESHOLD
          
          safeTelemetry(() => {
            console.log(`📍 [LessonPage] Cache age: ${cacheAge}ms, stale: ${isCacheStale}`)
          })
          
          if (isCacheStale) {
            // Cache is stale - use DB check instead
            safeTelemetry(() => {
              console.warn(`⚠️ [LessonPage] Cache stale (${cacheAge}ms > ${CACHE_STALENESS_THRESHOLD}ms), using DB check`)
            })
            
            isAccessible = await LessonProgressService.isLessonAccessible(moduleId, lessonId)
          } else {
            // Cache is fresh - use fast check
            const progressData = SmartAuthService.getCachedProgress()
            const cacheResult = LessonProgressService.isLessonAccessibleFast(
              moduleId, 
              lessonId, 
              progressData,
              isAuthenticated
            )
            
            safeTelemetry(() => {
              console.log(`✅ [LessonPage] Using cache - accessible: ${cacheResult}`)
            })
            
            // If cache says not accessible but cache is somewhat old, double-check with DB
            if (!cacheResult && cacheAge > 2000) {
              safeTelemetry(() => {
                console.warn(`⚠️ [LessonPage] Cache says not accessible, double-checking with DB (cache age: ${cacheAge}ms)`)
              })
              
              const dbResult = await LessonProgressService.isLessonAccessible(moduleId, lessonId)
              
              if (dbResult !== cacheResult) {
                safeTelemetry(() => {
                  console.error(`❌ [LessonPage] CACHE MISMATCH: cache=${cacheResult}, DB=${dbResult} - using DB result`)
                })
                isAccessible = dbResult
              } else {
                isAccessible = cacheResult
              }
            } else {
              isAccessible = cacheResult
            }
          }
          
          const accessibilityCheckDuration = Date.now() - accessibilityCheckStartTime
          safeTelemetry(() => {
            console.log(`⏱️ [LessonPage] Accessibility check took ${accessibilityCheckDuration}ms`)
          })
          
          // If not accessible, find previous lesson for lock message
          if (!isAccessible) {
            // Find previous lesson in sequence
            const { getModules } = await import('@/lib/config/curriculum')
            const modules = getModules()
            let foundCurrent = false
            
            for (const mod of modules) {
              if (!mod.available) continue
              for (const les of mod.lessons) {
                if (les.locked) continue
                
                if (foundCurrent) {
                  previousLesson = { moduleId: mod.id, lessonId: les.id }
                  break
                }
                
                if (mod.id === moduleId && les.id === lessonId) {
                  foundCurrent = true
                }
              }
              if (previousLesson) break
            }
          }
        } else {
          // Fallback to regular accessibility check if cache not available
          safeTelemetry(() => {
            console.warn(`⚠️ [LessonPage] No cached progress, using DB check`)
          })
          isAccessible = await LessonProgressService.isLessonAccessible(moduleId, lessonId)
        }
        
        // If not accessible, show sequential lock screen
        if (!isAccessible) {
          const prevLesson = previousLesson ? getLesson(previousLesson.moduleId, previousLesson.lessonId) : null
          const message = prevLesson
            ? `Complete "${prevLesson.title}" first to unlock this lesson.`
            : 'Complete the previous lesson first to unlock this lesson.'
          
          setAppState({
            isLoading: false,
            isAuthenticated: true,
            isAccessible: false,
            showAuthModal: false,
            showPremiumModal: false,
            showLockScreen: true,
            lockType: 'sequential',
            lockMessage: message,
            missingPrerequisites: [],
            error: null
          })
          return
        }
        
        // All checks passed - lesson is accessible
        setAppState({
          isLoading: false,
          isAuthenticated: true,
          isAccessible: true,
          showAuthModal: false,
          showPremiumModal: false,
          showLockScreen: false,
          lockType: null,
          lockMessage: '',
          missingPrerequisites: [],
          error: null
        })
        
      } catch (error) {
        console.error('Failed to check auth and accessibility:', error)
        setAppState({
          isLoading: false,
          isAuthenticated: false,
          isAccessible: false,
          showAuthModal: false,
            showPremiumModal: false,
            showLockScreen: false,
            lockType: null,
            lockMessage: '',
            missingPrerequisites: [],
          error: 'Failed to load lesson. Please try again.'
        })
      }
    }

    if (moduleId && lessonId) {
      checkAuthAndAccessibility()
    } else {
      setAppState({
        isLoading: false,
        isAuthenticated: false,
        isAccessible: false,
        showAuthModal: false,
        showPremiumModal: false,
        showLockScreen: false,
        lockType: null,
        lockMessage: '',
        missingPrerequisites: [],
        error: 'Invalid lesson URL'
      })
    }
  }, [moduleId, lessonId])
  
  // Handle auth success
  const handleAuthSuccess = async () => {
    setAppState(prev => ({ ...prev, showAuthModal: false }))
    
    // After auth success, check premium access FIRST
    if (module?.requiresPremium) {
      try {
        // Check cache first
        const { user } = SmartAuthService.getSessionState()
        if (user) {
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
            setAppState(prev => ({
              ...prev,
              showAuthModal: false,
              showPremiumModal: true,
              isLoading: false
            }))
            return
          }
        }
      } catch (error) {
        console.error('Failed to check premium after auth:', error)
      }
    }
    
    // Re-run auth check
    const checkAuthAndAccessibility = async () => {
      const { user, isEmailVerified } = SmartAuthService.getSessionState()
      const isAuthenticated = !!(user && isEmailVerified)
      
      if (isAuthenticated) {
        const progressData = SmartAuthService.getCachedProgress()
        const isAccessible = LessonProgressService.isLessonAccessibleFast(
          moduleId, 
          lessonId, 
          progressData,
          isAuthenticated
        )
        
        setAppState(prev => ({
          ...prev,
          isAuthenticated: true,
          isAccessible,
          showAuthModal: false,
          showPremiumModal: false
        }))
      }
    }
    checkAuthAndAccessibility()
  }
  
  // Show single loading state for everything
  if (appState.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading lesson...</p>
        </div>
      </div>
    )
  }
  
  // Show error state
  if (appState.error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Error</h2>
          <p className="text-muted-foreground">{appState.error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }
  
  // Show premium modal if needed (authenticated users without premium) - Enhanced Preview
  if (appState.showPremiumModal) {
    // If lesson/module not found, show simple modal
    if (!lesson || !module) {
      return (
        <>
          <PremiumLockModal
            isOpen={true}
            onClose={() => {
              router.push('/modules')
            }}
            moduleTitle={undefined}
          />
        </>
      )
    }
    
    return (
      <>
        <BlurredPreviewContainer>
          <main className="flex flex-col items-center justify-start p-8 max-w-4xl mx-auto w-full overflow-y-auto">
            <LessonPreviewContent
              moduleId={moduleId}
              lessonId={lessonId}
              lesson={lesson}
              module={module}
            />
          </main>
        </BlurredPreviewContainer>
        <PremiumLockModal
          isOpen={true}
          onClose={() => {
            router.push(`/modules/${moduleId}`)
          }}
          moduleTitle={module?.title}
        />
      </>
    )
  }

  // Show lock screen if needed (sequential or prerequisites)
  if (appState.showLockScreen && appState.lockType) {
    // If lesson/module not found, show simple lock screen
    if (!lesson || !module) {
      return (
        <>
          <LockScreen
            isOpen={true}
            type={appState.lockType}
            message={appState.lockMessage}
            currentModuleId={moduleId}
            currentLessonId={lessonId}
            missingPrerequisites={appState.missingPrerequisites}
          />
        </>
      )
    }
    
    return (
      <>
        <BlurredPreviewContainer>
          <main className="flex flex-col items-center justify-start p-8 max-w-4xl mx-auto w-full">
            <LessonPreviewContent
              moduleId={moduleId}
              lessonId={lessonId}
              lesson={lesson}
              module={module}
            />
          </main>
        </BlurredPreviewContainer>
        <LockScreen
          isOpen={true}
          type={appState.lockType}
          message={appState.lockMessage}
          currentModuleId={moduleId}
          currentLessonId={lessonId}
          missingPrerequisites={appState.missingPrerequisites}
        />
      </>
    )
  }
  
  // Show auth modal if needed (non-auth users)
  if (appState.showAuthModal) {
    // If lesson/module not found, show simple auth modal
    if (!lesson || !module) {
      return (
        <>
          <AuthModal
            isOpen={true}
            onClose={() => {
              router.push('/modules')
            }}
            title="Sign up to continue learning Persian"
            description="Join thousands learning to reconnect with their roots"
          />
        </>
      )
    }
    
    return (
      <>
        <BlurredPreviewContainer>
          <main className="flex flex-col items-center justify-start p-8 max-w-4xl mx-auto w-full overflow-y-auto">
            <LessonPreviewContent
              moduleId={moduleId}
              lessonId={lessonId}
              lesson={lesson}
              module={module}
            />
          </main>
        </BlurredPreviewContainer>
        <AuthModal
          isOpen={true}
          onClose={() => {
            router.push('/modules')
          }}
          onSuccess={handleAuthSuccess}
          title="Sign up to continue learning Persian"
          description="Join thousands learning to reconnect with their roots"
        />
      </>
    )
  }

  // Handle going back to the previous step
  const handleBack = () => {
    if (previousStates.length > 0) {
      const previousState = previousStates.pop()!;
      setProgress(previousState.progress);
      // Tell LessonRunner to go back to the previous step
      const lessonRunnerState = document.getElementById('lesson-runner-state');
      if (lessonRunnerState) {
        lessonRunnerState.dispatchEvent(new CustomEvent('go-back', { 
          detail: { stepIndex: previousState.currentStep } 
        }));
      }
      setPreviousStates([...previousStates]);
    }
  };

  const resetLesson = () => {
    setProgress(0);
    setCurrentView('welcome');
    setPreviousStates([]);
  };

  const handleViewSummary = () => {
    setCurrentView('summary');
  };

  const getLearnedWords = () => {
    // SummaryPage doesn't use this prop - it gets vocabulary directly from lesson config
    // Return empty array to satisfy the interface
    return []
  }

  return (
    <PageErrorBoundary>
    {/* Early check: If lesson or module isn't found, show NotFound */}
    {!lesson || !module ? (
      <NotFound type="lesson" moduleId={moduleId} lessonId={lessonId} />
    ) : (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main content area */}
      <main className="flex-1 flex flex-col">
        {/* Progress bar with step count overlay - Sticky */}
        {currentView !== 'completion' && currentView !== 'module-completion' && currentView !== 'summary' && currentView !== 'welcome' && (
          <div className="w-full bg-background border-b relative sticky top-16 z-40">
            {/* Progress bar */}
            <Progress value={progress} className="w-full h-6" />
            {/* Step counter overlayed on progress bar */}
            {totalSteps > 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-xs uppercase tracking-wide text-black font-semibold">
                  Question {currentStep} of {totalSteps}
                </p>
              </div>
            )}
          </div>
        )}
        <div className="flex-1 flex flex-col w-full">
          {/* Content Area - takes remaining space */}
          <div className="flex-1 flex flex-col items-center justify-start min-h-0 w-full">
            {/* Render the appropriate content based on currentView */}
            {currentView === 'completion' ? (
              <CompletionView 
                moduleId={moduleId}
                lessonId={lessonId}
                xpGained={xp}
                resetLesson={resetLesson}
                handleViewSummary={handleViewSummary}
              />
            ) : currentView === 'module-completion' ? (
              <ModuleCompletion 
                moduleId={moduleId}
                totalXpEarned={ModuleProgressService.getModuleCompletion(moduleId)?.totalXpEarned || 0}
              />
            ) : currentView === 'summary' ? (
              <SummaryView 
                moduleId={moduleId}
                lessonId={lessonId}
                resetLesson={resetLesson}
              />
            ) : (
              /* Always drive from config */
              <LessonRunner 
                steps={getLessonSteps(moduleId, lessonId)} 
                moduleId={moduleId}
                lessonId={lessonId}
                lessonData={lesson}
                xp={xp}
                addXp={addXp}
                progress={progress}
                onProgressChange={setProgress}
                currentView={currentView}
                onViewChange={setCurrentView}
                onSaveState={(state) => setPreviousStates(prev => [...prev, state])}
                onStepChange={(current, total) => {
                  setCurrentStep(current);
                  setTotalSteps(total);
                }}
              />
            )}
          </div>
        </div>
      </main>
    </div>
    )}
    </PageErrorBoundary>
  );
}

// NO MORE AUTHGUARD WRAPPER - Direct export
export default LessonPageContent 