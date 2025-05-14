"use client"

import Link from "next/link"
import { ChevronLeft, Star } from "lucide-react"
import { useParams } from "next/navigation"
import { getLessonSteps, getLesson, getModule } from "@/lib/config/curriculum"
import { LessonRunner } from "@/app/components/LessonRunner"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import "./styles.css"
import { useState } from "react"
import CompletionPage from "./completion/page"
import SummaryPage from "./summary/page"

export default function LessonPage() {
  const params = useParams();
  
  // Validate route parameters
  const moduleId = typeof params.moduleId === 'string' ? params.moduleId : '';
  const lessonId = typeof params.lessonId === 'string' ? params.lessonId : '';
  
  const [xp, setXp] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentView, setCurrentView] = useState('welcome');
  const [previousStates, setPreviousStates] = useState<any[]>([]);
  
  // Get data from config
  const lesson = getLesson(moduleId, lessonId);
  const module = getModule(moduleId);
  
  // If lesson or module isn't found, handle gracefully
  if (!lesson || !module) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-muted-foreground">Lesson not found</p>
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

  // Get the list of words learned in this lesson
  const getLearnedWords = () => {
    const steps = getLessonSteps(moduleId, lessonId);
    const words: string[] = [];
    
    steps.forEach(step => {
      if (step.type === 'flashcard' && step.data?.back) {
        const back = step.data.back;
        // Remove emoji if present
        const cleaned = typeof back === 'string' ? back.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim() : '';
        words.push(cleaned);
      }
    });
    
    return words;
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-3 sm:px-4">
          <Link href={`/modules/${moduleId}`} className="font-bold text-base sm:text-lg text-primary">
            <span className="hidden sm:inline">Module 1</span>
            <span className="sm:hidden">Module 1</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 overflow-x-auto">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium">{xp} XP</span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      {currentView !== 'welcome' && currentView !== 'completion' && currentView !== 'summary' && (
        <div className="w-full bg-primary/10">
          <Progress value={progress} className="h-2" />
        </div>
      )}

      <main className="flex-1 flex flex-col px-4 pt-4 pb-4 w-full overflow-hidden">
        {/* Main content area with Back button */}
        <div className="w-full max-w-4xl mx-auto flex flex-col flex-1 min-h-0">
          
          {/* Back Button container - Moved above main content but below progress */}
          <div className="h-8 flex items-center"> {/* Fixed height container */}
            {currentView !== 'welcome' && currentView !== 'completion' && currentView !== 'summary' && previousStates.length > 0 && (
              <Button variant="ghost" onClick={handleBack} className="text-sm flex items-center self-start pl-0 hover:bg-transparent">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Go Back
              </Button>
            )}
          </div>

          {/* Content Area - takes remaining space */}
          <div className="flex-1 flex flex-col items-center justify-start min-h-0">
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
                xp={xp}
                onXpChange={setXp}
                progress={progress}
                onProgressChange={setProgress}
                currentView={currentView}
                onViewChange={setCurrentView}
                onSaveState={(state) => setPreviousStates(prev => [...prev, state])}
              />
            )}
          </div>
          
          {/* XP Disclaimer - Only visible when not on welcome/intro screen */}
          {currentView !== 'welcome' && (
            <div className="w-full text-center mt-3 mb-1">
              <p className="text-xs text-muted-foreground opacity-70">
                Heads up: XP resets on refresh — full tracking and leaderboards coming at official launch!
              </p>
            </div>
          )}
          
          {/* Removed the old Back Button container from here */}
        </div>
      </main>
    </div>
  );
} 