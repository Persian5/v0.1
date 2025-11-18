import { useState, useEffect, useRef, useTransition, useMemo, useCallback } from 'react'
import { Flashcard } from '@/app/components/games/Flashcard'
import { Quiz } from '@/app/components/games/Quiz'
import { InputExercise } from '@/app/components/games/InputExercise'
import { MatchingGame } from '@/app/components/games/MatchingGame'
import { FinalChallenge } from '@/app/components/games/FinalChallenge'
import { LessonIntro } from '@/app/components/games/WelcomeIntro'
import { GrammarIntro } from '@/app/components/games/GrammarIntro'
import { GrammarFillBlank } from '@/app/components/games/GrammarFillBlank'
import { AudioMeaning } from '@/app/components/games/AudioMeaning'
import { AudioSequence } from '@/app/components/games/AudioSequence'
import { StoryConversation } from '@/app/components/games/StoryConversation'
import { TextSequence } from './games/TextSequence'
import { LessonStep, WelcomeStep, FlashcardStep, QuizStep, ReverseQuizStep, InputStep, MatchingStep, FinalStep, GrammarIntroStep, GrammarFillBlankStep, AudioMeaningStep, AudioSequenceStep, TextSequenceStep, StoryConversationStep, VocabularyItem, Lesson } from '@/lib/types'
import { XpService } from '@/lib/services/xp-service'
import { LessonProgressService } from '@/lib/services/lesson-progress-service'
import { VocabularyService } from '@/lib/services/vocabulary-service'
import { VocabularyTrackingService } from '@/lib/services/vocabulary-tracking-service'
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
import { verifyLessonCompletionInCache } from '@/lib/utils/cache-verification'
import { safeTelemetry } from '@/lib/utils/telemetry-safe'
import { getCurriculumLexicon, buildLearnedCache, type LearnedCache } from '@/lib/utils/curriculum-lexicon'
import { FLAGS } from '@/lib/flags'

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
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 3: CACHING LAYER (ELIMINATES REPEATED CURRICULUM SCANS)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  // Build global curriculum lexicon ONCE (module-scoped cache)
  const curriculumLexicon = useMemo(() => getCurriculumLexicon(), []);
  
  // Build learned cache ONCE per lesson (pre-computed learned-so-far per step)
  const learnedCache: LearnedCache = useMemo(() => {
    return buildLearnedCache(moduleId, lessonId, steps, curriculumLexicon);
  }, [moduleId, lessonId, steps, curriculumLexicon]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EXISTING VOCAB LOGIC (PHASE PERFORMANCE-ONLY: Optimized with learnedCache)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  // ✅ PERFORMANCE: Get vocabulary taught up to current step using pre-built cache
  // Replaces step-rescanning with O(1) lookup + O(n) map
  const getVocabTaughtUpToStep = useCallback((stepIndex: number): VocabularyItem[] => {
    // Get vocab IDs from pre-computed cache
    const learnedVocabIds = learnedCache[stepIndex]?.vocabIds || [];
    
    // Map IDs back to VocabularyItems using global lexicon
    const vocabItems: VocabularyItem[] = [];
    for (const vocabId of learnedVocabIds) {
      const vocabItem = curriculumLexicon.allVocabMap.get(vocabId);
      if (vocabItem) {
        vocabItems.push(vocabItem);
      }
    }
    
    return vocabItems;
  }, [learnedCache, curriculumLexicon.allVocabMap]);
  
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

  // Learned vocabulary logging (only when step index changes)
  useEffect(() => {
    if (FLAGS.LOG_LEARNED_VOCAB) {
      const learned = learnedCache[idx]?.vocabIds || [];
      console.log("%c[LEARNED VOCAB]", "color:#4CAF50;font-weight:bold;", {
        moduleId,
        lessonId,
        stepIndex: idx,
        learned,
      });
    }
  }, [idx]);

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
        const completionStartTime = Date.now()
        
        safeTelemetry(() => {
          console.log(`🎯 [LessonRunner] Lesson completion triggered: ${moduleId}/${lessonId}`)
        })

        // Check if this is a story lesson using the lesson data
        const isStoryLesson = lessonData?.isStoryLesson || false;
        
        // Track lesson completion for analytics
        console.log(`Lesson completed: ${moduleId}/${lessonId}`);

        // PHASE 1: Mark lesson as completed (with retry logic built-in)
        // Returns structured result with db and cache verification flags
        const completionResult = await LessonProgressService.markLessonCompleted(moduleId, lessonId);
        
        safeTelemetry(() => {
          console.log(`📊 [LessonRunner] Completion result:`, completionResult)
        })

        // CRITICAL: Check if DB write failed
        if (!completionResult.success || !completionResult.dbUpdated) {
          console.error('❌ [LessonRunner] DB write failed:', completionResult.error)
          alert('Failed to save your progress. Please check your internet connection and try completing the lesson again.');
          return; // Don't navigate - let user retry
        }

        // PHASE 2: Navigation Guard - Verify cache consistency before navigating
        if (!completionResult.cacheUpdated) {
          safeTelemetry(() => {
            console.warn(`⚠️ [LessonRunner] Cache not updated, attempting verification...`)
          })
          
          // Try to verify cache manually
          if (user) {
            const verification = verifyLessonCompletionInCache(user.id, moduleId, lessonId)
            
            if (!verification.isVerified) {
              safeTelemetry(() => {
                console.warn(`⚠️ [LessonRunner] Cache verification failed, refreshing from DB...`)
              })
              
              // Force refresh progress from database
              const refreshSuccess = await SmartAuthService.refreshProgressFromDb()
              
              safeTelemetry(() => {
                if (refreshSuccess) {
                  console.log(`✅ [LessonRunner] Cache refreshed from DB successfully`)
                } else {
                  console.error(`❌ [LessonRunner] Cache refresh failed`)
                }
              })
            }
          }
        }

        // PHASE 3: Flush XP (non-critical, don't block on failure)
        try {
          await SyncService.forceSyncNow();
          safeTelemetry(() => {
            console.log(`✅ [LessonRunner] XP sync completed`)
          })
        } catch (err) {
          safeTelemetry(() => {
            console.warn('⚠️ [LessonRunner] XP force sync failed (continuing anyway):', err)
          })
          // Non-critical - lesson is already saved, XP will sync on next opportunity
        }

        // PHASE 4: Navigate to completion page
        const completionDuration = Date.now() - completionStartTime
        safeTelemetry(() => {
          console.log(`🚀 [LessonRunner] Navigating to completion page (took ${completionDuration}ms)`)
        })
        
        // Only navigate if lesson was successfully marked complete
        startTransition(() => {
          router.push(`/modules/${moduleId}/${lessonId}/completion?xp=${xp}`);
        });
      })();
    }
  }, [idx, steps.length, isInRemediation, storyCompleted, lessonData, moduleId, lessonId, router, xp, user]);

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
      const stepUid = deriveStepUid(currentStep, idx, moduleId, lessonId);
      
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
        const stepUid = deriveStepUid(currentStep, idx, moduleId, lessonId);
        
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
      const stepUid = deriveStepUid(currentStep, idx, moduleId, lessonId);
      
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
      
      // LocalStorage tracking removed (Phase 1 Cleanup)
    };
  }, [idx, steps, user?.id, moduleId, lessonId, isInRemediation, incorrectAttempts]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Get current step BEFORE hooks (needed for useMemo hooks)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  // CRITICAL: Define step BEFORE useMemo hooks that reference it
  // Guard against idx >= steps.length to prevent undefined access
  const step = idx < steps.length ? steps[idx] : null;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CRITICAL: All hooks MUST be before early returns
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // PHASE 8 FIX: Memoize matching step resolution to prevent constant re-shuffling
  // MUST be called before any early returns to satisfy React hooks rules
  const matchingStepData = useMemo(() => {
    if (!step || step.type !== 'matching') return null;
    const matchingStep = step as MatchingStep;
    const { GrammarService } = require('@/lib/services/grammar-service');
    
    if (matchingStep.data.lexemeRefs) {
      return {
        words: matchingStep.data.lexemeRefs.map((ref, index) => {
          const resolved = GrammarService.resolve(ref);
          return {
            id: resolved.id,  // Use actual vocabulary ID (e.g., "bad|am")
            text: resolved.finglish,
            slotId: `slot${index + 1}`,
            vocabularyId: resolved.id,  // Store for tracking
            wordText: resolved.en  // Store for tracking
          };
        }),
        slots: matchingStep.data.lexemeRefs.map((ref, index) => {
          const resolved = GrammarService.resolve(ref);
          return {
            id: `slot${index + 1}`,
            text: resolved.en
          };
        })
      };
    }
    return {
      words: matchingStep.data.words,
      slots: matchingStep.data.slots
    };
  }, [idx, step?.type, (step as MatchingStep)?.data?.lexemeRefs, (step as MatchingStep)?.data?.words]);

  // PHASE 8 FIX: Memoize final step resolution to show actual words instead of IDs
  const finalStepData = useMemo(() => {
    if (!step || step.type !== 'final') return null;
    const finalStep = step as FinalStep;
    const { GrammarService } = require('@/lib/services/grammar-service');
    
    if (finalStep.data.lexemeRefs) {
      const resolved = finalStep.data.lexemeRefs.map(ref => GrammarService.resolve(ref));
      return {
        words: resolved.map((lexeme, index) => ({
          id: lexeme.id,
          text: lexeme.finglish,
          translation: lexeme.en
        })),
        targetWords: resolved.map(lexeme => lexeme.id),
        persianSequence: resolved.map(lexeme => lexeme.id)
      };
    }
    return {
      words: finalStep.data.words,
      targetWords: finalStep.data.targetWords,
      persianSequence: finalStep.data.conversationFlow?.persianSequence || []
    };
  }, [idx, step?.type, (step as FinalStep)?.data?.lexemeRefs, (step as FinalStep)?.data?.words]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Early returns (after all hooks)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Inline completion UI is no longer used — dedicated routed pages handle completion.
  if (idx >= steps.length && !isInRemediation && !storyCompleted) {
    return null;
  }
  
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

  // Render remediation content (AFTER hooks to satisfy React rules)
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
      
      {/* Positioned wrapper for step content + back button - matches step background */}
      <div className="relative w-full flex-1 min-h-[calc(100vh-64px)] sm:min-h-0 bg-gradient-to-b from-primary/5 via-primary/2 to-white">
        {/* STEP BACK BUTTON - Text-only, matches step background, distinct from AppHeader "Back" */}
        {idx > 0 && (
          <button
            onClick={handleBackButton}
            disabled={isNavigating || showXp || isPending}
            className="absolute left-4 top-2 sm:top-4 z-[100] flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            aria-label="Go back to previous step"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Previous</span>
          </button>
        )}
        
        {/* Render current step based on type - Mobile padding only, no desktop padding */}
        <div className="pt-9 sm:pt-0">
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
          vocabularyId={(step as FlashcardStep).data.vocabularyId} // PHASE 8 FIX: Pass ID for runtime lookup fallback
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
          learnedSoFar={learnedCache[idx]} // PHASE 4A: Pass learned vocabulary state
          vocabularyBank={allCurriculumVocab} // PHASE 4A: Pass vocabulary bank for lookup
          quizType={(step as QuizStep).data.quizType} // NEW: Pass quizType from step data
          vocabularyId={(step as QuizStep).data.vocabularyId || extractVocabularyFromFailedQuiz(step)} // NEW: Prefer step.data.vocabularyId, fallback to extraction
          lexemeRef={(step as QuizStep).data.lexemeRef} // NEW: Pass lexemeRef for grammar forms
          moduleId={moduleId} // For tiered fallback
          lessonId={lessonId} // For tiered fallback
          onComplete={(wasCorrect) => handleItemComplete(wasCorrect)}
          onXpStart={createStepXpHandler()}
          onVocabTrack={createVocabularyTracker()}
        />
      ) : step.type === 'reverse-quiz' ? (
        <Quiz
          key={generateQuizKey(step as ReverseQuizStep, quizAttemptCounter)}
          prompt={(step as ReverseQuizStep).data.prompt}
          options={(step as ReverseQuizStep).data.options}
          correct={(step as ReverseQuizStep).data.correct}
          points={step.points}
          learnedSoFar={learnedCache[idx]} // PHASE 4A: Pass learned vocabulary state
          vocabularyBank={allCurriculumVocab} // PHASE 4A: Pass vocabulary bank for lookup
          quizType={(step as ReverseQuizStep).data.quizType} // NEW: Pass quizType from step data
          vocabularyId={(step as ReverseQuizStep).data.vocabularyId || extractVocabularyFromFailedQuiz(step)} // NEW: Prefer step.data.vocabularyId, fallback to extraction
          lexemeRef={(step as ReverseQuizStep).data.lexemeRef} // NEW: Pass lexemeRef for grammar forms
          moduleId={moduleId} // For tiered fallback
          lessonId={lessonId} // For tiered fallback
          onComplete={(wasCorrect) => handleItemComplete(wasCorrect)}
          onXpStart={createStepXpHandler()}
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
          lexemeRef={(step as InputStep).data.lexemeRef} // NEW: Pass lexemeRef for grammar forms
          onVocabTrack={createVocabularyTracker()}
        />
      ) : step.type === 'matching' && matchingStepData ? (
        <MatchingGame
          key={`matching-${idx}`}
          words={matchingStepData.words}
          slots={matchingStepData.slots}
          points={step.points}
          vocabularyBank={allCurriculumVocab}
          onComplete={handleItemComplete}
          onXpStart={createStepXpHandler()}
          onVocabTrack={createVocabularyTracker()}
        />
      ) : step.type === 'final' && finalStepData ? (
        <FinalChallenge
          key={`final-${idx}`}
          words={finalStepData.words}
          targetWords={finalStepData.targetWords}
          title={(step as FinalStep).title}
          description={(step as FinalStep).description}
          successMessage={(step as FinalStep).successMessage}
          incorrectMessage={(step as FinalStep).incorrectMessage}
          conversationFlow={{
            ...(step as FinalStep).data.conversationFlow,
            persianSequence: finalStepData.persianSequence
          }}
          points={step.points}
          learnedSoFar={learnedCache[idx]} // PHASE 4A: Pass learned vocabulary state
          vocabularyBank={allCurriculumVocab} // PHASE 4A: Pass vocabulary bank for filtering
          onComplete={handleItemComplete}
          onXpStart={createStepXpHandler()}
        />
      ) : step.type === 'grammar-intro' ? (
        /**
         * ============================================================================
         * GRAMMAR STEP RENDERING
         * ============================================================================
         * 
         * TO ADD A NEW GRAMMAR STEP TYPE (e.g., "grammar-multiple-choice"):
         * 
         * 1. Import component at top (line 8-9):
         *    import { GrammarMultipleChoice } from '@/app/components/games/GrammarMultipleChoice'
         * 
         * 2. Import type in types import (line 14):
         *    import { ..., GrammarMultipleChoiceStep } from '@/lib/types'
         * 
         * 3. Add rendering case here (after grammar-fill-blank):
         *    ) : step.type === 'grammar-multiple-choice' ? (
         *      <GrammarMultipleChoice
         *        key={`grammar-multiple-choice-${idx}`}
         *        question={(step as GrammarMultipleChoiceStep).data.question}
         *        options={(step as GrammarMultipleChoiceStep).data.options}
         *        conceptId={(step as GrammarMultipleChoiceStep).data.conceptId}
         *        moduleId={moduleId}           // ← REQUIRED for tracking
         *        lessonId={lessonId}           // ← REQUIRED for tracking
         *        stepIndex={idx}                // ← REQUIRED for tracking
         *        learnedSoFar={learnedCache[idx]}  // ← REQUIRED: Pass learned cache
         *        points={step.points}
         *        onComplete={handleItemComplete}
         *        onXpStart={createStepXpHandler()}
         *      />
         * 
         * 4. Update lib/types.ts with new step interface
         * 5. Update lib/utils/step-uid.ts with new step type case
         * 
         * See lib/utils/GRAMMAR_ARCHITECTURE.md for full guide.
         * ============================================================================
         */
        <GrammarIntro
          key={`grammar-intro-${idx}`}
          title={(step as GrammarIntroStep).data.title}
          description={(step as GrammarIntroStep).data.description}
          rule={(step as GrammarIntroStep).data.rule}
          visualType={(step as GrammarIntroStep).data.visualType}
          visualData={(step as GrammarIntroStep).data.visualData}
          points={step.points}
          onComplete={handleItemComplete}
          onXpStart={createStepXpHandler()}
        />
      ) : step.type === 'grammar-fill-blank' ? (
        <GrammarFillBlank
          key={`grammar-fill-blank-${idx}`}
          exercises={(step as GrammarFillBlankStep).data.exercises}
          conceptId={(step as GrammarFillBlankStep).data.conceptId}
          moduleId={moduleId}           // ← REQUIRED: For grammar tracking
          lessonId={lessonId}           // ← REQUIRED: For grammar tracking
          stepIndex={idx}                // ← REQUIRED: For grammar tracking
          label={(step as GrammarFillBlankStep).data.label}
          subtitle={(step as GrammarFillBlankStep).data.subtitle}
          points={step.points}
          onComplete={handleItemComplete}
          onXpStart={createStepXpHandler()}
          learnedSoFar={learnedCache[idx]}  // ← REQUIRED: Pre-computed learned vocab/suffixes/connectors
        />
      ) : step.type === 'audio-meaning' ? (
        <AudioMeaning
          key={`audio-meaning-${idx}`}
          vocabularyId={(step as AudioMeaningStep).data.vocabularyId}
          lexemeRef={(step as AudioMeaningStep).data.lexemeRef} // NEW: Pass LexemeRef for grammar forms
          distractors={(step as AudioMeaningStep).data.distractors}
          vocabularyBank={allCurriculumVocab}
          points={step.points}
          autoPlay={(step as AudioMeaningStep).data.autoPlay}
          learnedSoFar={learnedCache[idx]} // PHASE 5: Pass learned vocabulary state
          moduleId={moduleId} // For tiered fallback
          lessonId={lessonId} // For tiered fallback
          onContinue={() => handleItemComplete(true)}
          onXpStart={createStepXpHandler()}
          onVocabTrack={createVocabularyTracker()}
        />
      ) : step.type === 'audio-sequence' ? (
        <AudioSequence
          key={`audio-sequence-${idx}`}
          sequence={(step as AudioSequenceStep).data.sequence}
          lexemeSequence={(step as AudioSequenceStep).data.lexemeSequence} // NEW: Pass LexemeRef[] for grammar forms
          vocabularyBank={allVocab}
          points={step.points}
          autoPlay={(step as AudioSequenceStep).data.autoPlay}
          expectedTranslation={(step as AudioSequenceStep).data.expectedTranslation}
          targetWordCount={(step as AudioSequenceStep).data.targetWordCount}
          maxWordBankSize={(step as AudioSequenceStep).data.maxWordBankSize}
          learnedSoFar={learnedCache[idx]} // PHASE 4: Pass learned vocabulary state
          moduleId={moduleId} // For tiered fallback
          lessonId={lessonId} // For tiered fallback
          onContinue={() => handleItemComplete(true)}
          onXpStart={createStepXpHandler()}
          onVocabTrack={createVocabularyTracker()}
        />
      ) : step.type === 'text-sequence' ? (
        <TextSequence
          key={idx}
          finglishText={(step as TextSequenceStep).data.finglishText}
          expectedTranslation={(step as TextSequenceStep).data.expectedTranslation}
          lexemeSequence={(step as TextSequenceStep).data.lexemeSequence} // GRAMMAR FORMS: Pass lexemeSequence (same as AudioSequence)
          vocabularyBank={allVocab}
          points={step.points}
          learnedSoFar={learnedCache[idx]} // PHASE 4: Pass learned vocabulary state
          moduleId={moduleId} // For tiered fallback
          lessonId={lessonId} // For tiered fallback
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
      </div>
    </>
  );
} 