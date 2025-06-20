"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
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
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { LessonProgressService } from "@/lib/services/lesson-progress-service"

export default function LessonPage() {
  const params = useParams()
  const router = useRouter()
  
  // Validate route parameters
  const moduleId = typeof params.moduleId === 'string' ? params.moduleId : '';
  const lessonId = typeof params.lessonId === 'string' ? params.lessonId : '';
  
  const { xp, addXp, setXp } = useXp({
    storageKey: 'global-user-xp'
  });
  
  const [progress, setProgress] = useState(0);
  const [currentView, setCurrentView] = useState('welcome');
  const [previousStates, setPreviousStates] = useState<any[]>([]);
  
  // Get data from config
  const lesson = getLesson(moduleId, lessonId);
  const module = getModule(moduleId);
  
  // Check if lesson is accessible
  const isAccessible = LessonProgressService.isLessonAccessible(moduleId, lessonId);
  
  // If lesson or module isn't found, handle gracefully
  if (!lesson || !module) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-muted-foreground">Lesson not found</p>
      </div>
    );
  }
  
  // If lesson isn't accessible (previous lesson not completed), redirect to modules
  if (!isAccessible) {
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
            <Button 
              size="sm" 
              className="bg-accent hover:bg-accent/90 text-white"
              onClick={() => router.push('/account')}
            >
              Account
            </Button>
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
          
          {/* Back Button container - Moved above main content but below progress */}
          <div className="h-8 flex items-center"> {/* Fixed height container */}
            {currentView !== 'welcome' && currentView !== 'completion' && currentView !== 'summary' && previousStates.length > 0 && (
              <Button variant="ghost" onClick={handleBack} className="text-sm flex items-center self-start pl-0 hover:bg-transparent">
                <ChevronLeft className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Go Back</span>
                <span className="sm:hidden">Back</span>
              </Button>
            )}
          </div>

          {/* Content Area - takes remaining space */}
          <div className="flex-1 flex flex-col items-center justify-start min-h-0 w-full">
            {/* Render the appropriate content based on currentView */}
            {currentView === 'completion' ? (
              <CompletionPage 
                xp={xp} 
                resetLesson={resetLesson}
                handleViewSummary={handleViewSummary}
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