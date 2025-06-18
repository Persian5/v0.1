import { useState, useEffect, useRef } from 'react'
import { Flashcard } from '@/app/components/games/Flashcard'
import { Quiz } from '@/app/components/games/Quiz'
import { InputExercise } from '@/app/components/games/InputExercise'
import { MatchingGame } from '@/app/components/games/MatchingGame'
import { FinalChallenge } from '@/app/components/games/FinalChallenge'
import { LessonIntro } from '@/app/components/games/WelcomeIntro'
import { LessonStep, WelcomeStep, FlashcardStep, QuizStep, InputStep, MatchingStep, FinalStep, VocabularyItem } from '@/lib/types'
import { XpService } from '@/lib/services/xp-service'
import { LessonProgressService } from '@/lib/services/lesson-progress-service'
import { VocabularyService } from '@/lib/services/vocabulary-service'
import { getLessonVocabulary } from '@/lib/config/curriculum'

interface LessonRunnerProps {
  steps: LessonStep[];
  moduleId: string;
  lessonId: string;
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
  const [quizAttemptCounter, setQuizAttemptCounter] = useState(0) // Track quiz attempts for unique keys
  const stateRef = useRef<HTMLDivElement>(null);

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

  // If we've gone through all steps, show completion
  if (idx >= steps.length && !isInRemediation) {
    // Mark lesson as completed when all steps are finished
    LessonProgressService.markLessonCompleted(moduleId, lessonId);
    
    if (onProgressChange) {
      onProgressChange(100);
    }
    if (onViewChange) {
      onViewChange('completion');
    }
    
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Lesson Complete!</h2>
        <p>You earned {XpService.formatXp(xp)}</p>
      </div>
    );
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
    
    setIdx(i => i + 1);
  }

  // Handle remediation when a word is answered incorrectly - queue it for after current step completion
  const handleRemediationNeeded = (dataOrId?: any) => {
    if (!dataOrId) return; // Nothing provided

    // Determine if we received a direct vocabulary ID (string) or full quiz step data (object)
    let vocabularyId: string | undefined;

    if (typeof dataOrId === 'string') {
      // Direct vocabulary ID provided (e.g., from InputExercise)
      vocabularyId = dataOrId;
    } else {
      // Assume object representing quiz step data – extract vocabulary intelligently
      vocabularyId = VocabularyService.extractVocabularyFromQuiz(dataOrId, allVocabForExtraction);
    }

    if (!vocabularyId) return; // Skip if we can't identify the vocabulary
    
    // Add to pending remediation queue if not already there
    if (!pendingRemediation.includes(vocabularyId)) {
      setPendingRemediation(prev => [...prev, vocabularyId]);
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
      const currentWord = remediationQueue[0];
      setRemediationQueue(prev => prev.slice(1));
      
      if (remediationQueue.length <= 1) {
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
  const generateQuizKey = (step: QuizStep, attemptCounter: number) => {
    const promptHash = (step.data.prompt || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return `quiz-${idx}-${promptHash}-${attemptCounter}`;
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
  const generateRemediationQuiz = (vocabularyId: string): { prompt: string, options: { text: string, correct: boolean }[] } | null => {
    const targetVocab = findVocabularyById(vocabularyId);
    if (!targetVocab) return null;

    const prompt = VocabularyService.generateQuizPrompt(targetVocab);
    const options = VocabularyService.generateQuizOptions(targetVocab, allVocabForExtraction);

    return { prompt, options };
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
  const createXpHandler = (activityType: 'flashcard' | 'quiz' | 'input' | 'matching' | 'final') => {
    return () => {
      const xpReward = XpService.getReward(
        activityType === 'flashcard' ? 'FLASHCARD_FLIP' :
        activityType === 'quiz' ? 'QUIZ_CORRECT' :
        activityType === 'input' ? 'INPUT_CORRECT' :
        activityType === 'matching' ? 'MATCHING_COMPLETE' :
        'FINAL_CHALLENGE'
      );
      
      // Directly add XP amount instead of doing math with current total
      addXp(xpReward.amount, xpReward.source, {
        activityType,
        stepIndex: idx,
        isRemediation: isInRemediation
      });
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
            onXpStart={createXpHandler('flashcard')}
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
            onXpStart={createXpHandler('quiz')}
            vocabularyId={currentWord}
            onRemediationNeeded={handleRemediationNeeded}
          />
        </>
      );
    }
  }

  return (
    <>
      <div id="lesson-runner-state" ref={stateRef} style={{ display: 'none' }} />
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
          foregroundImage="/icons/ali.png"
          foregroundImageAlt="Ali with a speech bubble"
          missionTitle={(step as WelcomeStep).title === "Basic Greetings" ? "Let's Help Ali!" : "Help Ali Be Polite!"}
          missionDescription={(step as WelcomeStep).title === "Basic Greetings" ? 
            "Ali just landed in Tehran and wants to greet people the right way. You'll meet him again at the end of this lesson — let's make sure you're ready to help him when the time comes." : 
            "Now that Ali can greet people, he needs to learn how to respond politely in conversations. Help him master these essential responses!"
          }
          missionInstructions={(step as WelcomeStep).title === "Basic Greetings" ? "Your mission is to get Ali ready. Help him:" : "Help Ali learn to:"}
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
          onXpStart={createXpHandler('flashcard')}
        />
      ) : step.type === 'quiz' ? (
        <Quiz
          key={generateQuizKey(step as QuizStep, quizAttemptCounter)}
          prompt={(step as QuizStep).data.prompt}
          options={(step as QuizStep).data.options}
          correct={(step as QuizStep).data.correct}
          points={step.points}
          onComplete={(wasCorrect) => handleItemComplete(wasCorrect)}
          onXpStart={createXpHandler('quiz')}
          vocabularyId={extractVocabularyFromFailedQuiz(step)}
          onRemediationNeeded={(_ignored) => handleRemediationNeeded((step as QuizStep).data)}
        />
      ) : step.type === 'input' ? (
        <InputExercise
          key={`input-${idx}`}
          question={(step as InputStep).data.question}
          answer={(step as InputStep).data.answer}
          points={step.points}
          onComplete={(wasCorrect) => handleItemComplete(wasCorrect)}
          onXpStart={createXpHandler('input')}
          vocabularyId={getStepVocabularyId(step)}
          onRemediationNeeded={handleRemediationNeeded}
        />
      ) : step.type === 'matching' ? (
        <MatchingGame
          key={`matching-${idx}`}
          words={(step as MatchingStep).data.words}
          slots={(step as MatchingStep).data.slots}
          points={step.points}
          onComplete={handleItemComplete}
          onXpStart={createXpHandler('matching')}
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
          points={step.points}
          onComplete={handleItemComplete}
          onXpStart={createXpHandler('final')}
        />
      ) : null}
    </>
  );
} 