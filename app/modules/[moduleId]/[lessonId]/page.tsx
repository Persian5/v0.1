"use client"

import Link from "next/link"
import { ChevronLeft, Star } from "lucide-react"
import { useParams } from "next/navigation"
import { getLessonSteps, getLesson, getModule } from "@/lib/config/curriculum"
import { LessonRunner } from "@/app/components/LessonRunner"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import "./styles.css"
import { useState, useEffect } from "react"
import CompletionPage from "./completion/page"
import SummaryPage from "./summary/page"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Sparkles } from "lucide-react"
import { useXp } from "@/hooks/use-xp"
import { XpService } from "@/lib/services/xp-service"

export default function LessonPage() {
  const params = useParams();
  
  // Validate route parameters
  const moduleId = typeof params.moduleId === 'string' ? params.moduleId : '';
  const lessonId = typeof params.lessonId === 'string' ? params.lessonId : '';
  
  // Use the new XP hook with persistence - Global XP across all lessons
  const { xp, addXp, setXp, isLoading: xpLoading } = useXp({
    storageKey: 'global-user-xp', // Global XP that persists across all lessons
  });
  
  const [progress, setProgress] = useState(0);
  const [currentView, setCurrentView] = useState('welcome');
  const [previousStates, setPreviousStates] = useState<any[]>([]);
  
  // Waitlist states
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isWaitlistPopupOpen, setIsWaitlistPopupOpen] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    const storedValue = localStorage.getItem('isSubscribed');
    setIsSubscribed(storedValue === 'true');
  }, []);
  
  // Waitlist popup functions
  const openWaitlistPopup = () => {
    setIsWaitlistPopupOpen(true);
  };
  
  const closeWaitlistPopup = () => {
    setIsWaitlistPopupOpen(false);
  };
  
  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      // Check if the response is JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to subscribe');
        }
        setIsSubscribed(true);
        localStorage.setItem('isSubscribed', 'true');
        setShowConfetti(true);
        setEmail("");

        // Hide confetti after 3 seconds
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        // If not JSON, get the text and throw an error
        const text = await response.text();
        throw new Error('Server error: ' + text);
      }
    } catch (err) {
      console.error('Waitlist submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to subscribe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
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
              <span className="text-sm font-medium">{XpService.formatXp(xp)}</span>
            </div>
            <Button 
              size="sm" 
              className="bg-accent hover:bg-accent/90 text-white"
              onClick={openWaitlistPopup}
            >
              Get Full Access
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
                addXp={addXp}
                progress={progress}
                onProgressChange={setProgress}
                currentView={currentView}
                onViewChange={setCurrentView}
                onSaveState={(state) => setPreviousStates(prev => [...prev, state])}
              />
            )}
          </div>
          
          {/* XP is now persistent - no disclaimer needed */}
          
          {/* Removed the old Back Button container from here */}
        </div>
      </main>

      {/* Waitlist Popup */}
      <AnimatePresence>
        {isWaitlistPopupOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto p-4"
            onClick={closeWaitlistPopup}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-xl max-w-xl w-full mx-auto relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/10 via-accent/20 to-primary/10"></div>
              
              <div className="p-6 sm:p-8">
                {showConfetti && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 pointer-events-none"
                  >
                    <div className="absolute inset-0 bg-primary/5" />
                    <Sparkles className="absolute top-0 left-1/2 -translate-x-1/2 text-primary" size={48} />
                  </motion.div>
                )}
                
                <div id="waitlist" className="relative">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center justify-center"
                  >
                    {isSubscribed ? (
                      <div className="text-center">
                        <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-primary text-center">
                          You're on the list! 🎉
                        </h3>
                        <p className="text-lg sm:text-xl text-center text-gray-600 mb-6">
                          You're officially part of the early access crew! We'll let you know the moment the full platform is ready.
                        </p>
                        <Button 
                          onClick={closeWaitlistPopup}
                          className="w-full bg-primary hover:bg-primary/90 text-white text-lg"
                        >
                          Close
                        </Button>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-primary text-center">
                          Join Our Free Beta Waitlist + Instant Access to Module 1 Today
                        </h3>
                        <p className="text-lg sm:text-xl text-center text-gray-600 mb-6">
                          Be the first to explore the platform and get early access before anyone else
                        </p>
                        <form onSubmit={handleWaitlistSubmit} className="w-full max-w-md mx-auto">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Input
                              type="email"
                              placeholder="Enter your email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className="flex-1 text-lg"
                              disabled={isLoading}
                              aria-label="Email address"
                              aria-describedby="email-error"
                            />
                            <Button 
                              type="submit" 
                              className="bg-primary hover:bg-primary/90 text-white text-lg"
                              disabled={isLoading}
                              aria-label="Join waitlist"
                            >
                              {isLoading ? 'Joining...' : 'Join Waitlist'}
                            </Button>
                          </div>
                          {error && (
                            <p id="email-error" className="text-red-500 mt-2 text-sm text-center" role="alert">
                              {error}
                            </p>
                          )}
                        </form>
                      </>
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
} 