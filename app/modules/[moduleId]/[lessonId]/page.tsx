"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, Suspense } from "react"
import { useParams } from "next/navigation"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Star, ChevronLeft, Loader2 } from "lucide-react"
import { useXp } from "@/hooks/use-xp"
import { XpService } from "@/lib/services/xp-service"
import { VocabularyService } from "@/lib/services/vocabulary-service"
import { getLesson, getModule, getLessonSteps } from "@/lib/config/curriculum"
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
  
  // Unified state for auth + accessibility
  const [appState, setAppState] = useState<{
    isLoading: boolean
    isAuthenticated: boolean
    isAccessible: boolean | null
    showAuthModal: boolean
    error: string | null
  }>({
    isLoading: true,
    isAuthenticated: false, 
    isAccessible: null,
    showAuthModal: false,
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
          // Show auth modal for unauthenticated users (except Module 1 Lesson 1)
          const shouldShowModal = !(moduleId === 'module1' && lessonId === 'lesson1')
          setAppState({
            isLoading: false,
            isAuthenticated: false,
            isAccessible: moduleId === 'module1' && lessonId === 'lesson1',
            showAuthModal: shouldShowModal,
            error: null
          })
          return
        }
        
        // For authenticated users, check accessibility using cached progress data
        const sessionState = SmartAuthService.getSessionState()
        if (sessionState.user && SmartAuthService.hasCachedProgress()) {
          const progressData = SmartAuthService.getCachedProgress()
          const isAccessible = LessonProgressService.isLessonAccessibleFast(
            moduleId, 
            lessonId, 
            progressData,
            isAuthenticated
          )
          
          setAppState({
            isLoading: false,
            isAuthenticated: true,
            isAccessible,
            showAuthModal: false,
            error: null
          })
        } else {
          // Fallback to regular accessibility check if cache not available
          const isAccessible = await LessonProgressService.isLessonAccessible(moduleId, lessonId)
          setAppState({
            isLoading: false,
            isAuthenticated: true,
            isAccessible,
            showAuthModal: false,
            error: null
          })
        }
        
      } catch (error) {
        console.error('Failed to check auth and accessibility:', error)
        setAppState({
          isLoading: false,
          isAuthenticated: false,
          isAccessible: false,
          showAuthModal: false,
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
        error: 'Invalid lesson URL'
      })
    }
  }, [moduleId, lessonId])
  
  // Handle auth success
  const handleAuthSuccess = () => {
    setAppState(prev => ({ ...prev, showAuthModal: false }))
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
          showAuthModal: false
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
  
  // Show auth modal if needed
  if (appState.showAuthModal) {
    return (
      <>
        {/* Show lesson content behind modal with reduced opacity */}
        <div className="opacity-30 pointer-events-none">
          {/* Basic lesson header to show context */}
          <div className="min-h-screen bg-background flex flex-col">
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
            <main className="flex-1 flex flex-col items-center justify-center p-8">
              <h1 className="text-3xl font-bold mb-4">{lesson.title}</h1>
              <p className="text-muted-foreground">{lesson.description}</p>
            </main>
          </div>
        </div>
        <AuthModal
          isOpen={true}
          onClose={() => setAppState(prev => ({ ...prev, showAuthModal: false }))}
          onSuccess={handleAuthSuccess}
          title="Sign up to continue learning Persian"
          description="Join thousands learning to reconnect with their roots"
        />
      </>
    )
  }
  
  // If lesson isn't accessible, redirect to modules
  if (appState.isAccessible === false) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Lesson Locked</h2>
          <p className="text-muted-foreground">You need to complete the previous lesson first!</p>
          <Button onClick={() => router.push(`/modules/${moduleId}`)}>
            Back to Module
          </Button>
        </div>
      </div>
    );
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <Link 
            href={`/modules/${moduleId}`} 
            className="flex items-center gap-1 sm:gap-2 font-bold text-sm sm:text-lg text-primary"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Back to Module</span>
            <span className="sm:hidden">Back</span>
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
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
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
  );
}

// Wrap in Suspense to handle useSearchParams
export default function LessonPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading lesson...</p>
        </div>
      </div>
    }>
      <LessonPageContent />
    </Suspense>
  )
} 