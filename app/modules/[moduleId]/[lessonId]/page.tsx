"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Star, ChevronLeft } from "lucide-react"
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
import { AuthGuard } from "@/components/auth/AuthGuard"
import { useAuth } from "@/components/auth/AuthProvider"
import { AccountNavButton } from "@/app/components/AccountNavButton"

function LessonPageContent() {
  const params = useParams()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const searchParamsNav = useSearchParams()
  
  // Validate route parameters
  const moduleId = typeof params.moduleId === 'string' ? params.moduleId : '';
  const lessonId = typeof params.lessonId === 'string' ? params.lessonId : '';
  
  const { xp, addXp, setXp } = useXp();
  const initialViewParam = searchParamsNav.get('view');
  
  const [progress, setProgress] = useState(0);
  const [currentView, setCurrentView] = useState(initialViewParam === 'module-completion' ? 'module-completion' : 'welcome');
  const [previousStates, setPreviousStates] = useState<any[]>([]);
  const [isAccessible, setIsAccessible] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get data from config
  const lesson = getLesson(moduleId, lessonId);
  const module = getModule(moduleId);
  
  // Check lesson accessibility
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkAccessibility = async () => {
      try {
        const accessible = await LessonProgressService.isLessonAccessible(moduleId, lessonId);
        setIsAccessible(accessible);
      } catch (error) {
        console.error('Failed to check lesson accessibility:', error);
        setIsAccessible(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (moduleId && lessonId) {
      checkAccessibility();

      // Safety timeout: force stop loading after 3 s
      timeoutId = setTimeout(() => {
        setIsLoading(false);
      }, 3000);
    } else {
      setIsLoading(false);
    }

    return () => clearTimeout(timeoutId);
  }, [moduleId, lessonId]);
  
  // If lesson or module isn't found, handle gracefully
  if (!lesson || !module) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-muted-foreground">Lesson not found</p>
      </div>
    );
  }
  
  // Show loading while checking accessibility
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading lesson...</p>
        </div>
      </div>
    );
  }
  
  // If lesson isn't accessible (previous lesson not completed), redirect to modules
  if (isAccessible === false) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">You need to complete the previous lesson first!</p>
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

  // Reset lesson to start over
  const resetLesson = () => {
    setProgress(0);
    setCurrentView('welcome');
    setPreviousStates([]);
    setXp(0);
    // Reset to first step
    const lessonRunnerState = document.getElementById('lesson-runner-state');
    if (lessonRunnerState) {
      lessonRunnerState.dispatchEvent(new CustomEvent('go-back', { 
        detail: { stepIndex: 0 } 
      }));
    }
  };

  // Handle viewing summary
  const handleViewSummary = () => {
    setCurrentView('summary');
  };

  // Navigate to modules page
  const navigateToModules = () => {
    router.push('/modules');
  };

  // Get the list of words learned in this lesson
  const getLearnedWords = () => {
    // Use vocabulary service to get words from this specific lesson
    return VocabularyService.getLearnedWordsFromLesson(moduleId, lessonId);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <Link href={`/modules/${moduleId}`} className="font-bold text-lg text-primary">
            <span className="hidden sm:inline">Module 1</span>
            <span className="sm:hidden">Module 1</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
              <span className="text-sm font-medium">{XpService.formatXp(xp)}</span>
            </div>
            <AccountNavButton />
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      {currentView !== 'welcome' && currentView !== 'completion' && currentView !== 'summary' && (
        <div className="w-full bg-primary/10">
          <Progress value={progress} className="h-2" />
        </div>
      )}

      <main className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8 pt-4 pb-4 w-full overflow-hidden">
        {/* Main content area with Back button */}
        <div className="w-full max-w-6xl mx-auto flex flex-col flex-1 min-h-0">
          
          {/* Back Button – render container only when needed */}
          {currentView !== 'welcome' && currentView !== 'completion' && currentView !== 'summary' && previousStates.length > 0 && (
            <div className="h-6 flex items-center">
              <Button variant="ghost" onClick={handleBack} className="text-sm flex items-center self-start pl-0 hover:bg-transparent hover:text-current">
                <ChevronLeft className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Go Back</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </div>
          )}

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

export default function LessonPage() {
  return (
    <AuthGuard
      requireAuth={true}
      requireEmailVerification={true}
    >
      <LessonPageContent />
    </AuthGuard>
  );
} 