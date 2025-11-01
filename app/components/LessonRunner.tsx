import { useState, useEffect, useRef, useTransition, useMemo } from 'react'
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
  onSaveState
}: LessonRunnerProps) {
  const [idx, setIdx] = useState(0)
  const [remediationQueue, setRemediationQueue] = useState<string[]>([]) // Words needing remediation
  const [isInRemediation, setIsInRemediation] = useState(false) // Are we in remediation mode?
  const [remediationStep, setRemediationStep] = useState<'flashcard' | 'quiz'>('flashcard') // Current remediation step
  const [pendingRemediation, setPendingRemediation] = useState<string[]>([]) // Words that need remediation after current step
  const [incorrectAttempts, setIncorrectAttempts] = useState<Record<string, number>>({}) // Track incorrect attempts per vocabulary ID (NEW: for 2+ trigger)
  const [stepsCountedForRemediation, setStepsCountedForRemediation] = useState<Set<string>>(new Set()) // Track which steps have been counted (FIX: first response only)
  const [quizAttemptCounter, setQuizAttemptCounter] = useState(0) // Track quiz attempts for unique keys
  const [storyCompleted, setStoryCompleted] = useState(false) // Track if story has completed to prevent lesson completion logic
  const [isNavigating, setIsNavigating] = useState(false) // Prevent rapid back button clicks
  const [showXp, setShowXp] = useState(false) // Track XP animation state
  const stateRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { user } = useAuth(); // Get user for idempotent XP

  // Get all vocabulary for this lesson (including review vocabulary)
  const currentLessonVocab = getLessonVocabulary(moduleId, lessonId);
  const reviewVocab = VocabularyService.getReviewVocabulary(moduleId, lessonId);
  
  // SYSTEMATIC FIX: For vocabulary extraction, we need access to ALL curriculum vocabulary
  // This ensures that any vocabulary word mentioned in any quiz can be properly identified
  // and remediated, regardless of lesson boundaries (following DEVELOPMENT_RULES.md)
  const allCurriculumVocab = VocabularyService.getAllCurriculumVocabulary();
  const allVocab = [...currentLessonVocab, ...reviewVocab]; // For lesson content
  const allVocabForExtraction = allCurriculumVocab; // For vocabulary extraction

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
  }, [idx, steps.length, onProgressChange, onViewChange, steps, isInRemediation]);

  // Handle lesson completion when reaching end of steps
  useEffect(() => {
    if (idx >= steps.length && !isInRemediation && !storyCompleted) {
      // Lesson is complete – run async logic in an IIFE to avoid lint false-positives
      ;(async () => {
        // Check if this is a story lesson using the lesson data
        const isStoryLesson = lessonData?.isStoryLesson || false;
        
        // Track lesson completion for analytics
        console.log(`Lesson completed: ${moduleId}/${lessonId}`);

        // Mark lesson as completed in the background (fire-and-forget)
        try {
          await LessonProgressService.markLessonCompleted(moduleId, lessonId);
        } catch (error) {
          console.error('Failed to mark lesson as completed:', error);
        } finally {
          // Update progress
          if (onProgressChange) {
            onProgressChange(100);
          }

          // Flush XP; failure here should not block navigation
          try {
            await SyncService.forceSyncNow();
          } catch (err) {
            console.warn('XP force sync failed (continuing anyway):', err);
          }

          startTransition(() => {
            router.push(`/modules/${moduleId}/${lessonId}/completion?xp=${xp}`);
          });
        }
      })();
    }
  }, [idx, steps.length, isInRemediation, storyCompleted, lessonData, moduleId, lessonId, onProgressChange, router, xp]);

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

  // Inline completion UI is no longer used — dedicated routed pages handle completion.
  if (idx >= steps.length && !isInRemediation && !storyCompleted) {
    return null;
  }

  const step = steps[idx]

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
      return; // Don't advance step, start remediation
    }
    
    window.scrollTo({ top: 0 });
    setIdx(i => i + 1);
  }

  // Handle remediation when a word is answered incorrectly - HYBRID phrase + vocabulary approach
  // NEW: Only trigger remediation after 2+ incorrect attempts (soft threshold)
  const handleRemediationNeeded = (dataOrId?: any) => {
    if (!dataOrId) return; // Nothing provided

    // Helper function to check and potentially queue a vocabulary ID
    const maybeQueueForRemediation = (vocabularyId: string) => {
      // FIX #3: Don't queue duplicate remediation if already pending or in remediation queue
      if (pendingRemediation.includes(vocabularyId)) {
        console.log(`⏭️ Skipping duplicate remediation for "${vocabularyId}" (already pending)`);
        return;
      }
      
      if (remediationQueue.includes(vocabularyId)) {
        console.log(`⏭️ Skipping duplicate remediation for "${vocabularyId}" (already in queue)`);
        return;
      }
      
      // Increment incorrect attempt counter
      const currentCount = incorrectAttempts[vocabularyId] || 0;
      const newCount = currentCount + 1;
      
      setIncorrectAttempts(prev => ({ ...prev, [vocabularyId]: newCount }));
      
      // Only trigger remediation on 2nd+ incorrect attempt
      if (newCount >= 2) {
        console.log(`🎯 Remediation triggered for "${vocabularyId}" (${newCount} incorrect attempts)`);
        setPendingRemediation(prev => [...prev, vocabularyId]);
      } else if (newCount === 1) {
        console.log(`⚠️ First incorrect attempt for "${vocabularyId}" (${newCount}/2 - no remediation yet)`);
      }
    };

    // Determine if we received a direct vocabulary ID (string) or full quiz step data (object)
    if (typeof dataOrId === 'string') {
      // Direct vocabulary ID provided (e.g., from InputExercise)
      maybeQueueForRemediation(dataOrId);
    } else {
      // Quiz step data - implement hybrid phrase + vocabulary logic
      const quizData = dataOrId;
      
      // STEP 1: Check if this is a phrase-based question
      const phraseId = VocabularyService.extractPhraseFromQuiz(quizData);
      
      if (phraseId) {
        // This is a phrase-based question - track phrase failure
        PhraseTrackingService.recordPhraseIncorrect(phraseId);
        
        // Get critical vocabulary for this phrase
        const criticalVocab = VocabularyService.getCriticalVocabularyForPhrase(phraseId);
        
        // Determine which critical vocabulary actually needs remediation
        const vocabForRemediation = VocabularyService.getVocabularyForRemediation(criticalVocab);
        
        // Add critical vocabulary that needs help to remediation queue (using 2+ threshold)
        for (const vocabId of vocabForRemediation) {
          maybeQueueForRemediation(vocabId);
        }
        
        console.log(`Phrase "${phraseId}" failed. Critical vocab being tracked:`, vocabForRemediation);
      } else {
        // Fallback to individual vocabulary word logic
        const vocabularyId = VocabularyService.extractVocabularyFromQuiz(quizData, allVocabForExtraction);
        
        if (vocabularyId) {
          maybeQueueForRemediation(vocabularyId);
        }
      }
    }
    
    // Don't start remediation now - wait until user gets current question correct
  };

  // Complete current remediation and continue to next lesson step
  const completeRemediation = () => {
    if (remediationStep === 'flashcard') {
      // Move to quiz step
      setRemediationStep('quiz');
    } else {
      // Quiz completed, remove from queue and continue
      const remainingQueue = remediationQueue.slice(1); // Get new queue state
      setRemediationQueue(remainingQueue);
      
      if (remainingQueue.length === 0) {
        // No more words to remediate, advance to next lesson step
        setIsInRemediation(false);
        setRemediationStep('flashcard');
        setIdx(i => i + 1);
      } else {
        // More words to remediate, start with next word
        setRemediationStep('flashcard');
      }
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

  // DYNAMIC: Generate remediation quiz using VocabularyService
  // Generate remediation quiz with MEMOIZED options (stable order per vocabulary ID)
  const generateRemediationQuiz = useMemo(() => {
    // Create a cache to store quiz data per vocabulary ID
    const quizCache = new Map<string, { prompt: string, options: { text: string, correct: boolean }[] }>();
    
    return (vocabularyId: string): { prompt: string, options: { text: string, correct: boolean }[] } | null => {
      // Check cache first
      if (quizCache.has(vocabularyId)) {
        return quizCache.get(vocabularyId)!;
      }
      
      const targetVocab = findVocabularyById(vocabularyId);
      if (!targetVocab) return null;

      const prompt = VocabularyService.generateQuizPrompt(targetVocab);
      // Use deterministic=true for stable order (no shuffling per render)
      const options = VocabularyService.generateQuizOptions(targetVocab, allVocabForExtraction, true);

      const quizData = { prompt, options };
      quizCache.set(vocabularyId, quizData);
      return quizData;
    };
  }, [allVocabForExtraction]); // Only recreate if vocabulary changes

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
  const createVocabularyTracker = () => {
    return async (vocabularyId: string, wordText: string, isCorrect: boolean, timeSpentMs?: number) => {
      const currentStep = steps[idx];
      if (!currentStep || !user?.id) {
        console.warn('No current step or user available for vocabulary tracking');
        return;
      }

      // CRITICAL FIX: Look up vocabulary item to get correct word text
      // Some components (Quiz, InputExercise) pass prompt/question instead of actual word text
      // Example: Quiz passes "What does 'Man' mean?" but we need "I" (the actual vocab word)
      const vocabItem = safeFindVocabularyById(vocabularyId);
      const actualWordText = vocabItem?.en 
        ? WordBankService.normalizeVocabEnglish(vocabItem.en) // Normalize for consistency ("I / Me" → "I")
        : wordText; // Fallback to passed wordText if vocab not found

      // Derive stable step UID
      const stepUid = deriveStepUid(currentStep, idx);
      
      // ALWAYS track to database (every attempt, for analytics)
      VocabularyTrackingService.storeAttempt({
        userId: user.id,
        vocabularyId,
        wordText: actualWordText, // Use normalized vocabulary word text, not prompt/question
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
      // REMEDIATION COUNTER LOGIC (Simple Rules)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      
      // Create unique key for this step + word combination
      const stepKey = `${idx}-${vocabularyId}`;
      
      // Check if this step has already been counted for remediation
      const alreadyCounted = stepsCountedForRemediation.has(stepKey);
      
      if (!alreadyCounted) {
        // ✅ RULE 1: First response on this step
        if (!isCorrect) {
          // First response was WRONG → increment counter
          setIncorrectAttempts(prev => {
            const currentCount = prev[vocabularyId] || 0;
            const newCount = currentCount + 1;
            
            console.log(`❌ First wrong for "${vocabularyId}" on step ${idx} - counter: ${newCount}/2`);
            
            // Check if we hit remediation threshold (2+) using functional state updates
            if (newCount >= 2) {
              // Check both queues atomically using functional updates
              setPendingRemediation(prevPending => {
                // If already pending, don't add again
                if (prevPending.includes(vocabularyId)) {
                  return prevPending;
                }
                
                // Check remediation queue (read-only check)
                setRemediationQueue(prevQueue => {
                  // If not in queue either, add to pending
                  if (!prevQueue.includes(vocabularyId)) {
                    console.log(`🎯 Remediation triggered for "${vocabularyId}" (${newCount} incorrect attempts)`);
                    return prevQueue; // Return unchanged (we'll update pending)
                  }
                  return prevQueue;
                });
                
                // Add to pending remediation
                return [...prevPending, vocabularyId];
              });
            }
            
            return { ...prev, [vocabularyId]: newCount };
          });
        } else {
          console.log(`✅ First correct for "${vocabularyId}" on step ${idx} - no counter change`);
        }
        
        // Mark this step as counted (whether right or wrong)
        setStepsCountedForRemediation(prev => new Set(prev).add(stepKey));
      } else {
        // ✅ RULE 2: Retry on same step → do nothing to counter
        console.log(`🔄 Retry for "${vocabularyId}" on step ${idx} - counter unchanged (${incorrectAttempts[vocabularyId] || 0}/2)`);
      }
      
      // ✅ RULE 3: Success during remediation → reset counter to 0
      // ONLY reset if this is actually a remediation step (vocabularyId matches currentWord in remediation queue)
      if (isInRemediation && remediationQueue.length > 0 && remediationQueue[0] === vocabularyId && isCorrect) {
        setIncorrectAttempts(prev => {
          if (prev[vocabularyId] > 0) {
            console.log(`🎉 Remediation success for "${vocabularyId}" - counter reset to 0/2`);
            return { ...prev, [vocabularyId]: 0 };
          }
          return prev;
        });
      }
      
      // ✅ RULE 4: Wrong during remediation → do nothing (already being remediated)
      // This is automatically handled by the alreadyCounted check above
      
      // NOTE: Remediation is ONLY triggered here in createVocabularyTracker
      // Components should NOT call onRemediationNeeded for vocabulary tracking - it's redundant
      // and causes double-triggering. Only call onVocabTrack.
      
      // Also keep localStorage tracking for backwards compatibility (for now)
      if (isCorrect) {
        VocabularyService.recordCorrectAnswer(vocabularyId);
      } else {
        VocabularyService.recordIncorrectAnswer(vocabularyId);
      }
    };
  };
  
  // Generic handler for all components except Flashcard
  const handleItemComplete = (wasCorrect: boolean = true) => {
    if (isInRemediation) {
      completeRemediation();
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
    
    if (!vocabItem) {
      // If vocabulary item not found, skip remediation
      setIsInRemediation(false);
      return null;
    }

    if (remediationStep === 'flashcard') {
      return (
        <>
          <div id="lesson-runner-state" ref={stateRef} style={{ display: 'none' }} />
          <div className="mb-4 text-center">
            <p className="text-sm text-orange-600 font-medium">📚 Quick Review</p>
          </div>
          <Flashcard
            vocabularyItem={vocabItem}
            points={1}
            onContinue={() => completeRemediation()}
            onXpStart={createStepXpHandler()}
            onVocabTrack={createVocabularyTracker()}
          />
        </>
      );
    } else {
      // DYNAMIC Quiz step for remediation - completely systemized
      const remediationQuizData = generateRemediationQuiz(currentWord);
      
      if (!remediationQuizData) {
        // If we can't generate a quiz, skip this remediation
        completeRemediation();
        return null;
      }

      return (
        <>
          <div id="lesson-runner-state" ref={stateRef} style={{ display: 'none' }} />
          <div className="mb-4 text-center">
            <p className="text-sm text-orange-600 font-medium">🎯 Practice Again</p>
          </div>
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