import { useState, useEffect, useRef, useTransition, useMemo, useCallback } from 'react'
import { Flashcard } from '@/app/components/games/Flashcard'
import { Quiz } from '@/app/components/games/Quiz'
import { InputExercise } from '@/app/components/games/InputExercise'
import { MatchingGame } from '@/app/components/games/MatchingGame'
import { FinalChallenge } from '@/app/components/games/FinalChallenge'
import { LessonIntro } from '@/app/components/games/WelcomeIntro'
import { GrammarConcept } from '@/app/components/games/GrammarConcept'
import { AudioMeaning } from '@/app/components/games/AudioMeaning'
import { AudioSequence } from '@/app/components/games/AudioSequence'
import { StoryConversation } from '@/app/components/games/StoryConversation'
import { TextSequence } from './games/TextSequence'
import { LessonStep, WelcomeStep, FlashcardStep, QuizStep, ReverseQuizStep, InputStep, MatchingStep, FinalStep, GrammarConceptStep, AudioMeaningStep, AudioSequenceStep, TextSequenceStep, StoryConversationStep, VocabularyItem, Lesson } from '@/lib/types'
import { XpService } from '@/lib/services/xp-service'
import { LessonProgressService } from '@/lib/services/lesson-progress-service'
import { VocabularyService } from '@/lib/services/vocabulary-service'
import { VocabularyTrackingService } from '@/lib/services/vocabulary-tracking-service'
import { PhraseTrackingService } from '@/lib/services/phrase-tracking-service'
import { getLessonVocabulary } from '@/lib/config/curriculum'
import { ModuleProgressService } from '@/lib/services/module-progress-service'
import { SyncService } from '@/lib/services/sync-service'
import { useRouter } from 'next/navigation'
import { deriveStepUid } from '@/lib/utils/step-uid'
import { useAuth } from '@/components/auth/AuthProvider'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WordBankService } from '@/lib/services/word-bank-service'
import { SmartAuthService } from '@/lib/services/smart-auth-service'

interface LessonRunnerProps {
  steps: LessonStep[];
  moduleId: string;
  lessonId: string;
  lessonData?: Lesson; // Add lesson data to detect story lessons
  xp: number;
  addXp: (amount: number, source: string, metadata?: any) => void;
  progress?: number;
  onProgressChange?: (progress: number) => void;
  currentView?: string;
  onViewChange?: (view: string) => void;
  onSaveState?: (state: { progress: number, currentStep: number }) => void;
  onStepChange?: (currentStep: number, totalSteps: number) => void; // NEW: Track current step
}

export function LessonRunner({ 
  steps, 
  moduleId, 
  lessonId, 
  lessonData,
  xp, 
  addXp, 
  progress, 
  onProgressChange,
  currentView,
  onViewChange,
  onSaveState,
  onStepChange // NEW: Callback for step changes
}: LessonRunnerProps) {
  const [idx, setIdx] = useState(0)
  const [remediationQueue, setRemediationQueue] = useState<string[]>([]) // Words needing remediation
  const [isInRemediation, setIsInRemediation] = useState(false) // Are we in remediation mode?
  const [remediationStep, setRemediationStep] = useState<'flashcard' | 'quiz'>('flashcard') // Current remediation step
  const [remediationStartIdx, setRemediationStartIdx] = useState<number | null>(null) // Track which step triggered remediation
  const [pendingRemediation, setPendingRemediation] = useState<string[]>([]) // Words that need remediation after current step
  const [incorrectAttempts, setIncorrectAttempts] = useState<Record<string, number>>({}) // Track incorrect attempts per vocabulary ID (2+ trigger threshold)
  const [quizAttemptCounter, setQuizAttemptCounter] = useState(0) // Track quiz attempts for unique keys
  const [storyCompleted, setStoryCompleted] = useState(false) // Track if story has completed to prevent lesson completion logic
  const [isNavigating, setIsNavigating] = useState(false) // Prevent rapid back button clicks
  const [showXp, setShowXp] = useState(false) // Track XP animation state
  const stateRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { user } = useAuth(); // Get user for idempotent XP
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SIMPLIFIED REMEDIATION SYSTEM (Launch Week Fix)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const remediationQueueRef = useRef<string[]>([]);
  const pendingRemediationRef = useRef<string[]>([]);
  const remediationTriggeredRef = useRef<Set<string>>(new Set()); // Prevent duplicate remediation triggers
  const currentStepTrackedRef = useRef<Set<string>>(new Set()); // Prevent retry counting on same step
  
  // Sync refs with state for re-render consistency
  useEffect(() => {
    remediationQueueRef.current = remediationQueue;
  }, [remediationQueue]);
  
  useEffect(() => {
    pendingRemediationRef.current = pendingRemediation;
  }, [pendingRemediation]);

  // Get all vocabulary for this lesson (including review vocabulary)
  const currentLessonVocab = getLessonVocabulary(moduleId, lessonId);
  const reviewVocab = VocabularyService.getReviewVocabulary(moduleId, lessonId);
  
  // SYSTEMATIC FIX: For vocabulary extraction, we need access to ALL curriculum vocabulary
  // This ensures that any vocabulary word mentioned in any quiz can be properly identified
  // and remediated, regardless of lesson boundaries (following DEVELOPMENT_RULES.md)
  const allCurriculumVocab = VocabularyService.getAllCurriculumVocabulary();
  
  // ✅ FIX: Get vocabulary taught up to current step (prevents future vocab in word banks)
  // This ensures word banks only show vocab the user has learned so far
  const getVocabTaughtUpToStep = useCallback((stepIndex: number): VocabularyItem[] => {
    const taughtVocabIds = new Set<string>();
    
    // Collect vocab IDs from all steps up to and including currentStepIndex
    for (let i = 0; i <= stepIndex && i < steps.length; i++) {
      const step = steps[i];
      
      // Extract vocab IDs introduced in this step
      if (step.type === 'flashcard' && step.data.vocabularyId) {
        taughtVocabIds.add(step.data.vocabularyId);
      } else if (step.type === 'audio-sequence' && step.data.sequence) {
        step.data.sequence.forEach((id: string) => taughtVocabIds.add(id));
      } else if (step.type === 'audio-meaning' && step.data.vocabularyId) {
        taughtVocabIds.add(step.data.vocabularyId);
      } else if (step.type === 'matching' && step.data.words) {
        step.data.words.forEach((word: any) => {
          if (word.id) taughtVocabIds.add(word.id);
        });
      }
      // Note: text-sequence, quiz, input, story don't introduce new vocab via IDs
      // Text-sequence relies on vocabularyBank matching, not explicit IDs
    }
    
    // Return vocab items for collected IDs
    return currentLessonVocab.filter(v => taughtVocabIds.has(v.id));
  }, [currentLessonVocab, steps]);
  
  // Get vocab taught up to current step + review vocab
  const vocabTaughtSoFar = getVocabTaughtUpToStep(idx);
  const allVocab = [...vocabTaughtSoFar, ...reviewVocab]; // For lesson content (word banks)
  const allVocabForExtraction = allCurriculumVocab; // For vocabulary extraction (quizzes)

  // CRITICAL: Generate remediation quiz with MEMOIZED options (stable order per vocabulary ID)
  // MUST be before any early returns to maintain consistent hook count
  // Each word always gets the same 4 distractors (deterministic shuffle)
  // Cache is cleared when vocabulary changes (new words introduced)
  const generateRemediationQuiz = useMemo(() => {
    // Create a cache to store quiz data per vocabulary ID
    const quizCache = new Map<string, { prompt: string, options: { text: string, correct: boolean }[] }>();
    
    return (vocabularyId: string): { prompt: string, options: { text: string, correct: boolean }[] } | null => {
      // Check cache first
      if (quizCache.has(vocabularyId)) {
        return quizCache.get(vocabularyId)!;
      }
      
      // Use VocabularyService directly since findVocabularyById is defined later
      const targetVocab = VocabularyService.findVocabularyById(vocabularyId);
      if (!targetVocab) return null;

      const prompt = VocabularyService.generateQuizPrompt(targetVocab);
      // Use deterministic=true for stable order (same 4 distractors per word)
      // Each vocabulary ID always gets the same distractors (e.g., "salam" always gets same 4)
      const options = VocabularyService.generateQuizOptions(targetVocab, allVocabForExtraction, true);

      const quizData = { prompt, options };
      quizCache.set(vocabularyId, quizData);
      return quizData;
    };
  }, [allVocabForExtraction]); // Only recreate cache when vocabulary changes (new words introduced)

  // Setup event listener for going back
  useEffect(() => {
    const handleGoBack = (e: any) => {
      const { stepIndex } = e.detail;
      setIdx(stepIndex);
      setIsInRemediation(false);
      setRemediationQueue([]);
      setPendingRemediation([]);
    };

    const stateEl = stateRef.current;
    if (stateEl) {
      stateEl.addEventListener('go-back', handleGoBack);
    }

    return () => {
      if (stateEl) {
        stateEl.removeEventListener('go-back', handleGoBack);
      }
    };
  }, []);

  // Update progress when step changes
  useEffect(() => {
    if (onProgressChange && !isInRemediation) {
      // Calculate progress based on current step index
      const progressValue = Math.min(100, Math.round((idx / steps.length) * 100));
      onProgressChange(progressValue);
    }
    
    // Update current view type
    if (onViewChange && idx < steps.length && !isInRemediation) {
      onViewChange(steps[idx].type);
    }
    
    // NEW: Notify parent of step change
    if (onStepChange && !isInRemediation) {
      // Cap display at total steps (don't show "21 of 20" on completion)
      const displayStep = Math.min(idx + 1, steps.length);
      onStepChange(displayStep, steps.length); // 1-indexed for display
    }
    
    // SIMPLIFIED: Clear currentStepTrackedRef when step changes (allows new tracking on new step)
    currentStepTrackedRef.current.clear();
  }, [idx, steps.length, onProgressChange, onViewChange, onStepChange, steps, isInRemediation]);

  // Handle lesson completion when reaching end of steps
  useEffect(() => {
    if (idx >= steps.length && !isInRemediation && !storyCompleted) {
      // Lesson is complete – run async logic in an IIFE to avoid lint false-positives
      ;(async () => {
        // Check if this is a story lesson using the lesson data
        const isStoryLesson = lessonData?.isStoryLesson || false;
        
        // Track lesson completion for analytics
        console.log(`Lesson completed: ${moduleId}/${lessonId}`);

        // CRITICAL: Mark lesson as completed - MUST succeed before navigation
        try {
          await LessonProgressService.markLessonCompleted(moduleId, lessonId);
          console.log('Lesson marked as completed successfully');
        } catch (error) {
          console.error('Failed to mark lesson as completed (first attempt):', error);
          
          // Retry once after 1 second
          try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await LessonProgressService.markLessonCompleted(moduleId, lessonId);
            console.log('Lesson marked as completed on retry');
          } catch (retryError) {
            console.error('Failed to mark lesson as completed (retry failed):', retryError);
            // Show user-friendly error
            alert('Failed to save your progress. Please check your internet connection and try completing the lesson again.');
            // Don't navigate - let user retry the lesson
            return;
          }
        }

        // Flush XP after successful save
        try {
          await SyncService.forceSyncNow();
        } catch (err) {
          console.warn('XP force sync failed (continuing anyway):', err);
          // Non-critical - lesson is already saved, XP will sync on next opportunity
        }

        // Only navigate if lesson was successfully marked complete
        startTransition(() => {
          router.push(`/modules/${moduleId}/${lessonId}/completion?xp=${xp}`);
        });
      })();
    }
  }, [idx, steps.length, isInRemediation, storyCompleted, lessonData, moduleId, lessonId, router, xp]);

  // Prefetch completion route when 80% done to avoid blank screen while chunk loads
  useEffect(() => {
    if (steps.length > 0 && idx / steps.length >= 0.8) {
      router.prefetch(`/modules/${moduleId}/${lessonId}/completion?xp=${xp}`);
    }
  }, [idx, steps.length, router, moduleId, lessonId, xp]);

  // Always scroll to top when moving to a new item (regular or remediation)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const scrollTop = () => {
        window.scrollTo(0, 0);
        // Fallback for some mobile browsers
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      };
      scrollTop();
      // Some mobile WebKit browsers ignore immediate scrollTo; retry next tick
      setTimeout(scrollTop, 0);
    }
  }, [idx, isInRemediation, remediationStep]);

  // SAFE CLEANUP: Skip remediation if vocabulary not found (via useEffect)
  // CRITICAL: This MUST be before any early returns to avoid hook count mismatch
  useEffect(() => {
    if (isInRemediation && remediationQueue.length > 0) {
      const currentWord = remediationQueue[0];
      const vocabItem = findVocabularyById(currentWord);
      
      if (!vocabItem) {
        console.warn(`Remediation vocabulary not found: ${currentWord}`);
        setIsInRemediation(false);
        setRemediationQueue([]);
      }
    }
  }, [isInRemediation, remediationQueue]);
  
  // SAFE CLEANUP: Skip quiz if generation fails (via useEffect)
  // CRITICAL: This MUST be before any early returns to avoid hook count mismatch
  useEffect(() => {
    if (isInRemediation && remediationQueue.length > 0 && remediationStep === 'quiz') {
      const currentWord = remediationQueue[0];
      const remediationQuizData = generateRemediationQuiz(currentWord);
      
      if (!remediationQuizData) {
        console.warn(`Failed to generate remediation quiz for: ${currentWord}`);
        completeRemediation();
      }
    }
  }, [isInRemediation, remediationQueue, remediationStep]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CRITICAL: All hooks MUST be before early returns
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  // IDEMPOTENT XP HANDLER: Award XP once per step (back button safe)
  // Returns Promise<boolean>: true if XP was granted, false if already completed
  const createStepXpHandler = () => {
    return async (): Promise<boolean> => {
      const currentStep = steps[idx];
      if (!currentStep || !user?.id) {
        console.warn('No current step or user available for XP', { idx, userId: user?.id });
        return false; // No XP granted
      }

      // Derive stable step UID
      const stepUid = deriveStepUid(currentStep, idx);
      
      // Get XP amount from curriculum
      const xpReward = XpService.getStepXp(currentStep);
      
      // Award XP idempotently (database enforces once-per-step)
      const result = await XpService.awardXpOnce({
        userId: user.id,
        moduleId,
        lessonId,
        stepUid,
        amount: xpReward.amount,
        source: xpReward.source,
        metadata: {
          activityType: currentStep.type,
          stepIndex: idx,
          isRemediation: isInRemediation
        }
      });
      
      // XP is already handled by awardXpOnce (optimistic update + RPC)
      // No need to call addXp here - would be a duplicate
      
      // Log if step was already completed
      if (!result.granted) {
        console.log(`Step already completed: ${stepUid} (reason: ${result.reason})`);
      }
      
      // Return whether XP was granted (true = new XP, false = already done)
      return result.granted;
    };
  };
  
  // VOCABULARY TRACKING HANDLER: Track word performance for review mode
  // Returns void (fire-and-forget for now, don't block UI)
  const createVocabularyTracker = useCallback(() => {
    return async (vocabularyId: string, wordText: string, isCorrect: boolean, timeSpentMs?: number) => {
      const currentStep = steps[idx];
      if (!currentStep || !user?.id) {
        console.warn('No current step or user available for vocabulary tracking');
        return;
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // SIMPLIFIED: Prevent retry counting on same step
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const stepKey = `${vocabularyId}-${idx}`;
      
      if (currentStepTrackedRef.current.has(stepKey)) {
        console.log(`🔄 [RETRY BLOCKED] "${vocabularyId}" on step ${idx} - retry doesn't count`);
        
        // Still track to database for analytics (every attempt matters)
        const vocabItem = safeFindVocabularyById(vocabularyId);
        const actualWordText = vocabItem?.en 
          ? WordBankService.normalizeVocabEnglish(vocabItem.en)
          : wordText;
        const stepUid = deriveStepUid(currentStep, idx);
        
        VocabularyTrackingService.storeAttempt({
          userId: user.id,
          vocabularyId,
          wordText: actualWordText,
          gameType: currentStep.type,
          isCorrect,
          timeSpentMs,
          moduleId,
          lessonId,
          stepUid,
          contextData: {
            stepIndex: idx,
            isRemediation: isInRemediation
          }
        }).catch((error) => {
          console.error('Failed to track vocabulary attempt:', error);
        });
        
        return; // Skip remediation logic for retries
      }

      // Mark step as tracked (prevents retry counting)
      currentStepTrackedRef.current.add(stepKey);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // Look up vocabulary item to get correct word text
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const vocabItem = safeFindVocabularyById(vocabularyId);
      const actualWordText = vocabItem?.en 
        ? WordBankService.normalizeVocabEnglish(vocabItem.en)
        : wordText;

      // Derive stable step UID
      const stepUid = deriveStepUid(currentStep, idx);
      
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ALWAYS track to database (for analytics/review mode)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      VocabularyTrackingService.storeAttempt({
        userId: user.id,
        vocabularyId,
        wordText: actualWordText,
        gameType: currentStep.type,
        isCorrect,
        timeSpentMs,
        moduleId,
        lessonId,
        stepUid,
        contextData: {
          stepIndex: idx,
          isRemediation: isInRemediation
        }
      }).catch((error) => {
        console.error('Failed to track vocabulary attempt:', error);
      });
      
      // Invalidate dashboard cache so stats update in real-time
      SmartAuthService.invalidateDashboardStats();
      
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // SIMPLIFIED REMEDIATION COUNTER LOGIC
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      
      // Skip remediation during remediation mode
      if (isInRemediation) {
        console.log(`🎓 [IN REMEDIATION] "${vocabularyId}" - resetting counter to 0`);
        // Reset counter after remediation (doesn't matter if correct or wrong)
        setIncorrectAttempts(prev => ({ ...prev, [vocabularyId]: 0 }));
        return;
      }
      
      // Handle incorrect answer
      if (!isCorrect) {
        const currentCount = incorrectAttempts[vocabularyId] || 0;
        const newCount = currentCount + 1;
        
        console.log(`❌ Wrong answer for "${vocabularyId}" - counter: ${newCount}/2`);
        
        // Update counter
        setIncorrectAttempts(prev => ({ ...prev, [vocabularyId]: newCount }));
        
        // Trigger remediation at 2+ (but only once per word)
        if (newCount >= 2 && !remediationTriggeredRef.current.has(vocabularyId)) {
          console.log(`🎯 Remediation triggered for "${vocabularyId}"`);
          
          // Mark as triggered (prevents duplicate remediation)
          remediationTriggeredRef.current.add(vocabularyId);
          
          // Add to pending queue (will be processed after current step)
          setPendingRemediation(prev => {
            if (prev.includes(vocabularyId)) {
              return prev; // Already in queue
            }
            return [...prev, vocabularyId];
          });
        }
      } else {
        console.log(`✅ Correct answer for "${vocabularyId}" - counter unchanged`);
      }
      
      // Keep localStorage tracking for backwards compatibility
      if (isCorrect) {
        VocabularyService.recordCorrectAnswer(vocabularyId);
      } else {
        VocabularyService.recordIncorrectAnswer(vocabularyId);
      }
    };
  }, [idx, steps, user?.id, moduleId, lessonId, isInRemediation, incorrectAttempts]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Early returns (after all hooks)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Inline completion UI is no longer used — dedicated routed pages handle completion.
  if (idx >= steps.length && !isInRemediation && !storyCompleted) {
    return null;
  }

  const step = steps[idx]
  
  // Guard: if step is undefined (edge case during navigation), return null
  if (!step) {
    console.warn('LessonRunner: step is undefined', { idx, stepsLength: steps.length });
    return null;
  }

  const next = () => {
    // Save current state before moving to next step
    if (onSaveState && !isInRemediation) {
      onSaveState({
        progress: progress || 0,
        currentStep: idx
      });
    }
    
    // Check if we have pending remediation to start AFTER user got current question right
    if (pendingRemediation.length > 0 && !isInRemediation) {
      setRemediationQueue([...pendingRemediation]);
      setPendingRemediation([]);
      setIsInRemediation(true);
      setRemediationStep('flashcard');
      setRemediationStartIdx(idx); // Track current step before starting remediation
      return; // Don't advance step, start remediation
    }
    
    window.scrollTo({ top: 0 });
    setIdx(i => i + 1);
  }

  // Handle remediation when a word is answered incorrectly - HYBRID phrase + vocabulary approach
  // NEW: Only trigger remediation after 2+ incorrect attempts (soft threshold)
  // DEPRECATED: This function is NO LONGER USED - remediation is handled by createVocabularyTracker
  // Keeping for backwards compatibility but it does nothing
  const handleRemediationNeeded = (dataOrId?: any) => {
    // DEPRECATED: Do nothing - remediation is now handled by createVocabularyTracker
    // This prevents any double-tracking if this function is accidentally called
    console.warn('handleRemediationNeeded is deprecated - remediation is handled by createVocabularyTracker');
    return;
  };

  // Complete current remediation and continue to next lesson step
  // Guard: prevent double completion (flashcard already advances, quiz already advances)
  const completeRemediation = () => {
    if (remediationStep === 'flashcard') {
      // Move to quiz step
      setRemediationStep('quiz');
    } else if (remediationStep === 'quiz') {
      // Quiz completed, remove from queue and continue
      // Use functional update to ensure we're working with latest state
      setRemediationQueue(prevQueue => {
        if (prevQueue.length === 0) {
          // Already empty, don't do anything (prevent double call)
          return prevQueue;
        }
        
        const remainingQueue = prevQueue.slice(1); // Get new queue state
        
        if (remainingQueue.length === 0) {
          // No more words to remediate, advance to next lesson step
          setIsInRemediation(false);
          setRemediationStep('flashcard');
          // Return to the step AFTER the one that triggered remediation
          // remediationStartIdx was saved when remediation started
          if (remediationStartIdx !== null) {
            setIdx(remediationStartIdx + 1);
            setRemediationStartIdx(null); // Reset
          } else {
            // Fallback: just increment (shouldn't happen in normal flow)
            setIdx(i => i + 1);
          }
        } else {
          // More words to remediate, start with next word
          setRemediationStep('flashcard');
        }
        
        return remainingQueue;
      });
    }
  };

  // Special handler for story completion - bypasses lesson completion and goes directly to module completion
  const handleStoryComplete = () => {
    // Prevent normal lesson‐completion logic from re-firing
    setStoryCompleted(true);

    // Update progress bar to 100 %
    if (onProgressChange) {
      onProgressChange(100);
    }

    // Persist lesson completion (fire-and-forget)
    LessonProgressService.markLessonCompleted(moduleId, lessonId)
      .catch((err) => console.error('Failed to mark lesson completed (story):', err));

    // Navigate to the dedicated completion route so the usual flow (and Next-Lesson logic) picks up
    router.push(`/modules/${moduleId}/${lessonId}/completion`);
  };

  // Find vocabulary item by ID across all available vocabulary
  const findVocabularyById = (vocabId: string): VocabularyItem | undefined => {
    return VocabularyService.findVocabularyById(vocabId);
  };

  // Safe vocabulary lookup that handles undefined
  const safeFindVocabularyById = (vocabId: string | undefined): VocabularyItem | undefined => {
    if (!vocabId) return undefined;
    return findVocabularyById(vocabId);
  };

  // Helper function to generate stable quiz keys
  const generateQuizKey = (step: QuizStep | ReverseQuizStep, attemptCounter: number) => {
    return `quiz-${idx}-${step.data.prompt.slice(0, 20)}-${attemptCounter}`;
  };

  // ENHANCED: Extract vocabulary ID from failed quiz step intelligently
  const extractVocabularyFromFailedQuiz = (step: LessonStep): string | undefined => {
    if (step.type === 'quiz') {
      const quizStep = step as QuizStep;
      return VocabularyService.extractVocabularyFromQuiz(quizStep.data, allVocabForExtraction);
    }
    
    // For other step types, use existing logic
    return getStepVocabularyId(step);
  };

  // Get vocabularyId for current step if applicable
  const getStepVocabularyId = (step: LessonStep): string | undefined => {
    if (step.type === 'flashcard') {
      return (step as FlashcardStep).data.vocabularyId;
    }
    
    // For quiz steps, try to extract vocabulary ID from prompt or content
    if (step.type === 'quiz') {
      const quizStep = step as QuizStep;
      const prompt = quizStep.data.prompt.toLowerCase();
      
      // Look for vocabulary words mentioned in the prompt
      for (const vocab of allVocab) {
        if (prompt.includes(vocab.finglish.toLowerCase()) || 
            prompt.includes(vocab.en.toLowerCase()) ||
            quizStep.data.options.some(opt => 
              typeof opt === 'string' && 
              (opt.toLowerCase().includes(vocab.finglish.toLowerCase()) || 
               opt.toLowerCase().includes(vocab.en.toLowerCase()))
            )) {
          return vocab.id;
        }
      }
    }
    
    // For input steps, match answer with vocabulary
    if (step.type === 'input') {
      const inputStep = step as InputStep;
      const answer = inputStep.data.answer.toLowerCase();
      
      for (const vocab of allVocab) {
        if (vocab.finglish.toLowerCase() === answer || vocab.en.toLowerCase() === answer) {
          return vocab.id;
        }
      }
    }
    
    return undefined;
  };

  // Create activity-specific XP handlers using the XP service
  const createXpHandler = (activityType: 'flashcard' | 'quiz' | 'input' | 'matching' | 'final' | 'audio-meaning' | 'audio-sequence' | 'text-sequence' | 'story-conversation') => {
    return () => {
      const xpReward = XpService.getReward(
        activityType === 'flashcard' ? 'FLASHCARD_FLIP' :
        activityType === 'quiz' ? 'QUIZ_CORRECT' :
        activityType === 'input' ? 'INPUT_CORRECT' :
        activityType === 'matching' ? 'MATCHING_COMPLETE' :
        activityType === 'audio-meaning' ? 'QUIZ_CORRECT' :
        activityType === 'audio-sequence' ? 'MATCHING_COMPLETE' :
        activityType === 'text-sequence' ? 'TEXT_SEQUENCE_COMPLETE' :
        activityType === 'story-conversation' ? 'QUIZ_CORRECT' :
        'FINAL_CHALLENGE'
      );
      
      // Directly add XP amount instead of doing math with current total
      addXp(xpReward.amount, xpReward.source, {
        lessonId,
        moduleId,
        activityType,
        stepIndex: idx,
        isRemediation: isInRemediation
      });
    };
  };
  
  // Generic handler for all components except Flashcard
  const handleItemComplete = (wasCorrect: boolean = true) => {
    if (isInRemediation) {
      // Only complete remediation if answer was correct (don't advance on wrong answers)
      if (wasCorrect) {
        completeRemediation();
      }
      // If wrong, don't call completeRemediation - let user retry
    } else {
      // Only advance if the answer was correct
      if (wasCorrect) {
        // Reset quiz attempt counter when advancing to next step
        setQuizAttemptCounter(0);
    next();
      } else {
        // Increment attempt counter to force new Quiz component instance
        // This ensures clean state for retry attempts
        setQuizAttemptCounter(prev => prev + 1);
      }
    }
  }

  // BACK BUTTON HANDLER
  const handleBackButton = () => {
    // Guard: prevent rapid clicks or navigation during animations
    if (isNavigating || showXp || isPending) {
      console.log('Back button disabled (navigating or showing XP)');
      return;
    }
    
    setIsNavigating(true);
    
    // Navigate to previous step (minimum 0)
    if (idx > 0) {
      setIdx(idx - 1);
      // Clear any pending remediation when going back
      setPendingRemediation([]);
    }
    
    // Reset navigation guard after 300ms
    setTimeout(() => setIsNavigating(false), 300);
  };

  // Render remediation content
  if (isInRemediation && remediationQueue.length > 0) {
    const currentWord = remediationQueue[0];
    const vocabItem = findVocabularyById(currentWord);
    
    // Don't setState here - the useEffect above will handle cleanup
    if (!vocabItem) {
      return null; // Temporary render while useEffect cleans up
    }

    if (remediationStep === 'flashcard') {
      return (
        <>
          <div id="lesson-runner-state" ref={stateRef} style={{ display: 'none' }} />
          <Flashcard
            vocabularyItem={vocabItem}
            points={1}
            onContinue={() => completeRemediation()}
            onXpStart={createStepXpHandler()}
            onVocabTrack={createVocabularyTracker()}
            label="QUICK REVIEW"
          />
        </>
      );
    } else {
      // DYNAMIC Quiz step for remediation - completely systemized
      const remediationQuizData = generateRemediationQuiz(currentWord);
      
      // Don't setState here - the useEffect above will handle cleanup
      if (!remediationQuizData) {
        return null; // Temporary render while useEffect cleans up
      }

      return (
        <>
          <div id="lesson-runner-state" ref={stateRef} style={{ display: 'none' }} />
          <Quiz
            key={`remediation-quiz-${currentWord}-${quizAttemptCounter}`}
            prompt={remediationQuizData.prompt}
            options={remediationQuizData.options}
            correct={0} // This will be ignored since we're passing QuizOption objects
            points={2}
            onComplete={(wasCorrect) => handleItemComplete(wasCorrect)}
            onXpStart={createStepXpHandler()}
            vocabularyId={currentWord}
            onVocabTrack={createVocabularyTracker()}
            label="PRACTICE AGAIN"
            subtitle="Review this word one more time"
          />
        </>
      );
    }
  }

  return (
    <>
      <div id="lesson-runner-state" ref={stateRef} style={{ display: 'none' }} />
      
      {/* Positioned wrapper for step content + back button */}
      <div className="relative w-full">
        {/* STEP BACK BUTTON - Top-left corner, visible from step 1 onwards */}
        {idx > 0 && (
          <button
            onClick={handleBackButton}
            disabled={isNavigating || showXp || isPending}
            className="absolute left-4 top-4 z-50 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            aria-label="Go back to previous step"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>
        )}
        
        {/* Render current step based on type */}
      {step.type === 'welcome' ? (
        <LessonIntro 
          title={(step as WelcomeStep).title} 
          description={(step as WelcomeStep).description} 
          objectives={(step as WelcomeStep).data?.objectives}
          useSimpleLayout={false}
          objectiveEmojis={(step as WelcomeStep).title === "Basic Greetings" ? ["👋", "🤔", "🙏", "👋"] : ["😊", "🙏", "✅", "❌"]}
          backgroundImage="/icons/tehranairport.png"
          backgroundImageAlt="Tehran Airport Background"
          foregroundImage="/icons/student.png"
          foregroundImageAlt="Student learning Persian"
          missionDescription={(step as WelcomeStep).title === "Basic Greetings" ? 
            "You're about to learn essential Persian greetings that will help you connect with people. By the end of this lesson, you'll be ready to start conversations confidently." : 
            "Now that you can greet people, you'll learn how to respond politely in conversations. Master these essential responses to sound natural!"
          }
          missionInstructions={(step as WelcomeStep).title === "Basic Greetings" ? "Your mission is to learn these skills. You'll:" : "You'll learn to:"}
          sectionTitle={(step as WelcomeStep).data?.sectionTitle}
          sectionDescription={(step as WelcomeStep).data?.sectionDescription}
          vocabularyItems={[]}
          buttonText="Let's Start!"
          onStart={next} 
        />
      ) : step.type === 'flashcard' ? (
        <Flashcard
          key={`flashcard-${idx}-${(step as FlashcardStep).data.vocabularyId}`}
          front={(step as FlashcardStep).data.front}
          back={(step as FlashcardStep).data.back}
          vocabularyItem={
            (step as FlashcardStep).data.vocabularyId 
              ? safeFindVocabularyById((step as FlashcardStep).data.vocabularyId)
              : undefined
          }
          points={step.points}
          onContinue={() => handleItemComplete(true)}
          onXpStart={createStepXpHandler()}
          onVocabTrack={createVocabularyTracker()}
        />
      ) : step.type === 'quiz' ? (
        <Quiz
          key={generateQuizKey(step as QuizStep, quizAttemptCounter)}
          prompt={(step as QuizStep).data.prompt}
          options={(step as QuizStep).data.options}
          correct={(step as QuizStep).data.correct}
          points={step.points}
          onComplete={(wasCorrect) => handleItemComplete(wasCorrect)}
          onXpStart={createStepXpHandler()}
          vocabularyId={extractVocabularyFromFailedQuiz(step)}
          onVocabTrack={createVocabularyTracker()}
        />
      ) : step.type === 'reverse-quiz' ? (
        <Quiz
          key={generateQuizKey(step as ReverseQuizStep, quizAttemptCounter)}
          prompt={(step as ReverseQuizStep).data.prompt}
          options={(step as ReverseQuizStep).data.options}
          correct={(step as ReverseQuizStep).data.correct}
          points={step.points}
          onComplete={(wasCorrect) => handleItemComplete(wasCorrect)}
          onXpStart={createStepXpHandler()}
          vocabularyId={extractVocabularyFromFailedQuiz(step)}
          onVocabTrack={createVocabularyTracker()}
        />
      ) : step.type === 'input' ? (
        <InputExercise
          key={`input-${idx}`}
          question={(step as InputStep).data.question}
          answer={(step as InputStep).data.answer}
          points={step.points}
          onComplete={(wasCorrect) => handleItemComplete(wasCorrect)}
          onXpStart={createStepXpHandler()}
          vocabularyId={getStepVocabularyId(step)}
          onVocabTrack={createVocabularyTracker()}
        />
      ) : step.type === 'matching' ? (
        <MatchingGame
          key={`matching-${idx}`}
          words={(step as MatchingStep).data.words}
          slots={(step as MatchingStep).data.slots}
          points={step.points}
          vocabularyBank={allCurriculumVocab}
          onComplete={handleItemComplete}
          onXpStart={createStepXpHandler()}
          onVocabTrack={createVocabularyTracker()}
        />
      ) : step.type === 'final' ? (
        <FinalChallenge
          key={`final-${idx}`}
          words={(step as FinalStep).data.words}
          targetWords={(step as FinalStep).data.targetWords}
          title={(step as FinalStep).data.title}
          description={(step as FinalStep).data.description}
          successMessage={(step as FinalStep).data.successMessage}
          incorrectMessage={(step as FinalStep).data.incorrectMessage}
          conversationFlow={(step as FinalStep).data.conversationFlow}
          points={step.points}
          onComplete={handleItemComplete}
          onXpStart={createStepXpHandler()}
        />
      ) : step.type === 'grammar-concept' ? (
        <GrammarConcept
          key={`grammar-concept-${idx}`}
          conceptId={(step as GrammarConceptStep).data.conceptId}
          points={step.points}
          onComplete={handleItemComplete}
          onXpStart={createStepXpHandler()}
        />
      ) : step.type === 'audio-meaning' ? (
        <AudioMeaning
          key={`audio-meaning-${idx}`}
          vocabularyId={(step as AudioMeaningStep).data.vocabularyId}
          distractors={(step as AudioMeaningStep).data.distractors}
          vocabularyBank={allCurriculumVocab}
          points={step.points}
          autoPlay={(step as AudioMeaningStep).data.autoPlay}
          onContinue={() => handleItemComplete(true)}
          onXpStart={createStepXpHandler()}
          onVocabTrack={createVocabularyTracker()}
        />
      ) : step.type === 'audio-sequence' ? (
        <AudioSequence
          key={`audio-sequence-${idx}`}
          sequence={(step as AudioSequenceStep).data.sequence}
          vocabularyBank={allVocab}
          points={step.points}
          autoPlay={(step as AudioSequenceStep).data.autoPlay}
          expectedTranslation={(step as AudioSequenceStep).data.expectedTranslation}
          targetWordCount={(step as AudioSequenceStep).data.targetWordCount}
          maxWordBankSize={(step as AudioSequenceStep).data.maxWordBankSize}
          onContinue={() => handleItemComplete(true)}
          onXpStart={createStepXpHandler()}
          onVocabTrack={createVocabularyTracker()}
        />
      ) : step.type === 'text-sequence' ? (
        <TextSequence
          key={idx}
          finglishText={(step as TextSequenceStep).data.finglishText}
          expectedTranslation={(step as TextSequenceStep).data.expectedTranslation}
          vocabularyBank={allVocab}
          points={step.points}
          onContinue={() => handleItemComplete(true)}
          onXpStart={createStepXpHandler()}
          maxWordBankSize={(step as TextSequenceStep).data.maxWordBankSize}
          onVocabTrack={createVocabularyTracker()}
        />
      ) : step.type === 'story-conversation' ? (
        <StoryConversation
          key={`story-conversation-${idx}-${(step as StoryConversationStep).data.storyId}`}
          step={step as StoryConversationStep}
          onComplete={handleStoryComplete}
          onXpStart={createStepXpHandler()}
          addXp={addXp}
        />
      ) : null}
      </div>
    </>
  );
} 