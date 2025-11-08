"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Star, ChevronLeft, Loader2 } from "lucide-react"
import { useXp } from "@/hooks/use-xp"
import { XpService } from "@/lib/services/xp-service"
import { VocabularyService } from "@/lib/services/vocabulary-service"
import { getLesson, getModule, getLessonSteps, getLessonVocabulary } from "@/lib/config/curriculum"
import { LessonPreviewContent } from "@/components/previews/LessonPreviewContent"
import { BlurredPreviewContainer } from "@/components/previews/BlurredPreviewContainer"
import { LessonRunner } from "@/app/components/LessonRunner"
import CompletionPage from "./completion/page"
import SummaryPage from "./summary/page"
import { ModuleCompletion } from "@/app/components/ModuleCompletion"
import { ModuleProgressService } from "@/lib/services/module-progress-service"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { LessonProgressService } from "@/lib/services/lesson-progress-service"
import { useAuth } from "@/components/auth/AuthProvider"
import { AccountNavButton } from "@/app/components/AccountNavButton"
import { SmartAuthService } from "@/lib/services/smart-auth-service"
import { AuthModal } from "@/components/auth/AuthModal"
import { PremiumLockModal } from "@/components/PremiumLockModal"
import { LockScreen } from "@/components/LockScreen"
import PageErrorBoundary from "@/components/errors/PageErrorBoundary"
import { getCachedModuleAccess, setCachedModuleAccess } from "@/lib/utils/module-access-cache"
import { ModuleAccessService } from "@/lib/services/module-access-service"

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
        
        // STEP 3: Check sequential access (lesson-level)
        const sessionState = SmartAuthService.getSessionState()
        let isAccessible = false
        let previousLesson: { moduleId: string; lessonId: string } | null = null
        
        if (sessionState.user && SmartAuthService.hasCachedProgress()) {
          const progressData = SmartAuthService.getCachedProgress()
          isAccessible = LessonProgressService.isLessonAccessibleFast(
            moduleId, 
            lessonId, 
            progressData,
            isAuthenticated
          )
          
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
  
  // If lesson or module isn't found, handle gracefully
  if (!lesson || !module) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Lesson Not Found</h2>
          <p className="text-muted-foreground">The requested lesson could not be found.</p>
          <Button onClick={() => router.push('/modules')}>
            Back to Modules
          </Button>
        </div>
      </div>
    );
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
        <BlurredPreviewContainer
          header={
            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-14 items-center justify-between px-4">
                <div className="flex items-center gap-4">
                  <Link 
                    href={`/modules/${moduleId}`}
                    className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Module
                  </Link>
                </div>
                <div className="flex items-center gap-4">
                  <AccountNavButton />
                </div>
              </div>
            </header>
          }
        >
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
        <BlurredPreviewContainer
          header={
            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-14 items-center justify-between px-4">
                <div className="flex items-center gap-4">
                  <Link 
                    href={`/modules/${moduleId}`}
                    className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Module
                  </Link>
                </div>
                <div className="flex items-center gap-4">
                  <AccountNavButton />
                </div>
              </div>
            </header>
          }
        >
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
        <BlurredPreviewContainer
          header={
            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-14 items-center justify-between px-4">
                <div className="flex items-center gap-4">
                  <Link 
                    href={`/modules/${moduleId}`}
                    className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Module
                  </Link>
                </div>
                <div className="flex items-center gap-4">
                  <AccountNavButton />
                </div>
              </div>
            </header>
          }
        >
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <Link 
            href={`/modules/${moduleId}`} 
            className="flex items-center gap-1 sm:gap-2 font-bold text-sm sm:text-lg text-primary"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Module {moduleId.replace('module', '')}</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">{XpService.formatXp(xp)}</span>
            </div>
            <AccountNavButton />
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 flex flex-col">
        {/* Progress bar - only show if not on completion view */}
        {currentView !== 'completion' && currentView !== 'module-completion' && currentView !== 'summary' && (
          <Progress value={progress} className="w-full h-2 mb-4" />
        )}
        <div className="flex-1 flex flex-col w-full">
          {/* Content Area - takes remaining space */}
          <div className="flex-1 flex flex-col items-center justify-start min-h-0 w-full">
            {/* Render the appropriate content based on currentView */}
            {currentView === 'completion' ? (
              <CompletionPage 
                xp={xp} 
                resetLesson={resetLesson}
                handleViewSummary={handleViewSummary}
              />
            ) : currentView === 'module-completion' ? (
              <ModuleCompletion 
                moduleId={moduleId}
                totalXpEarned={ModuleProgressService.getModuleCompletion(moduleId)?.totalXpEarned || 0}
              />
            ) : currentView === 'summary' ? (
              <SummaryPage 
                xp={xp}
                resetLesson={resetLesson}
                learnedWords={getLearnedWords()}
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
              />
            )}
          </div>
        </div>
      </main>
    </div>
    </PageErrorBoundary>
  );
}

// NO MORE AUTHGUARD WRAPPER - Direct export
export default LessonPageContent 