import { useState, useMemo, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { XpAnimation } from "./XpAnimation"
import { playSuccessSound } from "./Flashcard"
import { VocabularyService } from "@/lib/services/vocabulary-service"
import { shuffle } from "@/lib/utils"
import { FLAGS } from "@/lib/flags"
import { WordBankService } from "@/lib/services/word-bank-service"
import { type LearnedSoFar } from "@/lib/utils/curriculum-lexicon"
import { type VocabularyItem } from "@/lib/types"

type QuizOption = {
  text: string;
  correct: boolean;
};

export interface QuizProps {
  prompt: string;
  options: string[] | QuizOption[];
  correct: number;
  points?: number;
  onComplete: (correct: boolean) => void;
  onXpStart?: () => Promise<boolean>; // Returns true if XP granted, false if already completed
  vocabularyId?: string; // Optional: for tracking vocabulary performance OR from step.data.vocabularyId
  onVocabTrack?: (vocabularyId: string, wordText: string, isCorrect: boolean, timeSpentMs?: number) => void; // Track vocabulary performance
  label?: string; // Optional custom label (e.g., "PRACTICE AGAIN" for remediation)
  subtitle?: string; // Optional custom subtitle
  learnedSoFar?: LearnedSoFar; // PHASE 4A: Learned vocabulary state for filtering
  vocabularyBank?: VocabularyItem[]; // PHASE 4A: All vocabulary for WordBankService lookup
  quizType?: 'vocab-normal' | 'vocab-reverse' | 'phrase' | 'grammar'; // NEW: Quiz type from step.data.quizType
  moduleId?: string; // For tiered fallback in WordBankService
  lessonId?: string; // For tiered fallback in WordBankService
}

export function Quiz({ 
  prompt,
  options,
  correct = 0,
  points = 2,
  onComplete,
  onXpStart,
  vocabularyId,
  onVocabTrack,
  label = "QUICK QUIZ",
  subtitle = "Test what you've learned",
  learnedSoFar, // PHASE 4A: Learned vocabulary state
  vocabularyBank, // PHASE 4A: Vocabulary bank for lookup
  quizType, // NEW: Quiz type to determine distractor generation strategy
  moduleId, // For tiered fallback
  lessonId // For tiered fallback
}: QuizProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [quizState, setQuizState] = useState<'selecting' | 'showing-result' | 'completed'>('selecting')
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false) // Track if step was already completed (local state)
  const [isSubmitting, setIsSubmitting] = useState(false) // Prevent double-click
  
  // Time tracking for analytics
  const startTime = useRef(Date.now())
  
  // Reset tracking flag when vocabulary changes (new step)
  useEffect(() => {
    startTime.current = Date.now();
  }, [vocabularyId, prompt]);
  
  // Generate unique instance ID for this quiz component
  const instanceId = useMemo(() => Math.random().toString(36).substr(2, 9), []);

  // Create stable hash of options to prevent unnecessary re-shuffling
  const optionsHash = useMemo(() => {
    const optionsStr = Array.isArray(options) 
      ? options.map(opt => typeof opt === 'string' ? opt : `${opt.text}-${opt.correct}`).join('|')
      : '';
    return `${optionsStr}-${correct}`;
  }, [options, correct]);
  
  // Reset timer when quiz content changes (new question)
  useEffect(() => {
    startTime.current = Date.now()
  }, [prompt, optionsHash])

  // PHASE 4A: Stable signatures for useMemo dependencies (prevents infinite re-renders)
  const learnedSignature = learnedSoFar
    ? learnedSoFar.vocabIds.join(",")
    : "";
  const vocabBankSignature = vocabularyBank
    ? vocabularyBank.map(v => v.id).join(",")
    : "";

  // PHASE 4A: Unified distractor generation OR old behavior (flag-gated + quizType-aware)
  const shuffledOptions = useMemo(() => {
    // Skip WordBankService for phrase/grammar quizzes (use curriculum options as-is)
    if (quizType === 'phrase' || quizType === 'grammar') {
      // Convert string[] to QuizOption[] if needed
      const formattedOptions: QuizOption[] = Array.isArray(options) && typeof options[0] === 'string'
        ? (options as string[]).map((opt, i) => ({ text: opt, correct: i === correct }))
        : options as QuizOption[];
      return shuffle(formattedOptions);
    }
    
    // PHASE 4A: Unified WordBankService path (flag ON + vocab quiz type)
    if (FLAGS.USE_LEARNED_VOCAB_IN_QUIZ && 
        (quizType === 'vocab-normal' || quizType === 'vocab-reverse') &&
        learnedSoFar && 
        vocabularyBank && 
        vocabularyBank.length > 0) {
      
      // Step 1: Get vocabulary ID (required for vocab quizzes)
      let correctVocabId = vocabularyId;
      
      if (!correctVocabId) {
        console.warn('[QUIZ] vocab-normal/vocab-reverse quiz missing vocabularyId, falling back to curriculum options');
        // Fall through to old behavior
      } else {
        // Step 2: Find the correct vocabulary item
        const correctVocab = vocabularyBank.find(v => v.id === correctVocabId);
        
        if (!correctVocab) {
          console.warn(`[QUIZ] Vocabulary ID "${correctVocabId}" not found in vocabulary bank, falling back to curriculum options`);
          // Fall through to old behavior
        } else {
          // Step 3: Generate unified options using WordBankService
          // Use default maxSize of 4 if options array is empty (from vocabQuiz helper)
          const maxSize = options.length > 0 ? options.length : 4;
          
          const wordBankResult = WordBankService.generateWordBank({
            expectedTranslation: undefined, // Quiz doesn't have translation context
            vocabularyBank,
            sequenceIds: [correctVocabId], // Correct answer
            maxSize, // Default to 4 if options array is empty
            distractorStrategy: 'semantic',
            learnedVocabIds: FLAGS.USE_LEARNED_VOCAB_IN_WORDBANK && learnedSoFar
              ? learnedSoFar.vocabIds
              : undefined,
            moduleId, // For tiered fallback
            lessonId, // For tiered fallback
          });
          
          // Step 4: Extract unified options based on quiz type
          const { correctWords, distractors: distractorWords } = wordBankResult;
          
          if (correctWords.length > 0 && distractorWords.length > 0) {
            let unifiedOptionsText: string[] = [];
            
            if (quizType === 'vocab-normal') {
              // vocab-normal: Persian prompt → English options
              // WordBankService returns English translations
              unifiedOptionsText = [
                correctWords[0], // Correct English translation
                ...distractorWords
              ].slice(0, maxSize);
            } else if (quizType === 'vocab-reverse') {
              // vocab-reverse: English prompt → Persian/Finglish options
              // Need to map English distractors back to Persian/Finglish
              const correctFinglish = correctVocab.finglish || correctVocab.id;
              
              // Find Persian/Finglish for distractors
              const distractorFinglish = distractorWords.map(englishText => {
                // Find vocab item with matching English translation
                const vocabItem = vocabularyBank.find(v => {
                  const normalizedVocabEn = WordBankService.normalizeVocabEnglish(v.en).toLowerCase();
                  const normalizedDistractorEn = WordBankService.normalizeVocabEnglish(englishText).toLowerCase();
                  return normalizedVocabEn === normalizedDistractorEn;
                });
                return vocabItem?.finglish || vocabItem?.id || englishText; // Fallback to English if not found
              });
              
              unifiedOptionsText = [
                correctFinglish, // Correct Persian/Finglish
                ...distractorFinglish
              ].slice(0, maxSize);
            }
            
            // Transform to QuizOption[] format
            const unifiedOptions: QuizOption[] = unifiedOptionsText.map((text, index) => ({
              text: text,
              correct: index === 0 // First option is always correct
            }));
            
            // Shuffle for display (preserve correct flag)
            const shuffledUnified = shuffle(unifiedOptions);
            
            // PHASE 4A: Debug logging
            if (FLAGS.LOG_WORDBANK) {
              console.log(
                "%c[QUIZ - UNIFIED WORDBANK]",
                "color: #9C27B0; font-weight: bold;",
                {
                  quizType,
                  vocabularyId: correctVocabId,
                  correctVocab: {
                    id: correctVocab.id,
                    en: correctVocab.en,
                    finglish: correctVocab.finglish
                  },
                  learnedVocabCount: learnedSoFar?.vocabIds?.length || 0,
                  vocabularyBankSize: vocabularyBank.length,
                  unifiedOptions: unifiedOptionsText,
                  usingUnifiedWordBank: true,
                }
              );
            }
            
            return shuffledUnified;
          } else {
            console.warn('[QUIZ] WordBankService returned empty options, falling back to curriculum options');
            // Fall through to old behavior
          }
        }
      }
    }
    
    // OLD BEHAVIOR: Flag OFF or fallback (curriculum options)
    // Convert string[] to QuizOption[] if needed
    const formattedOptions: QuizOption[] = Array.isArray(options) && typeof options[0] === 'string'
      ? (options as string[]).map((opt, i) => ({ text: opt, correct: i === correct }))
      : options as QuizOption[];
    
    // Safety check: If options are empty (from vocabQuiz helper) and flag is OFF,
    // we need to generate options manually as fallback
    if (formattedOptions.length === 0 && quizType && (quizType === 'vocab-normal' || quizType === 'vocab-reverse') && vocabularyId && vocabularyBank) {
      console.warn('[QUIZ] Empty options array with vocab quiz type - generating fallback options');
      const vocab = vocabularyBank.find(v => v.id === vocabularyId);
      if (vocab) {
        // Generate simple fallback: correct answer + 3 random distractors
        const distractors = vocabularyBank
          .filter(v => v.id !== vocabularyId)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        
        if (quizType === 'vocab-normal') {
          // English options
          const fallbackOptions: QuizOption[] = [
            { text: vocab.en, correct: true },
            ...distractors.map(v => ({ text: v.en, correct: false }))
          ];
          return shuffle(fallbackOptions);
        } else {
          // vocab-reverse: Persian/Finglish options
          const fallbackOptions: QuizOption[] = [
            { text: vocab.finglish || vocab.id, correct: true },
            ...distractors.map(v => ({ text: v.finglish || v.id, correct: false }))
          ];
          return shuffle(fallbackOptions);
        }
      }
    }

    // Fisher-Yates shuffle for proper randomization
    return shuffle(formattedOptions);
  }, [
    optionsHash,
    vocabularyId,
    learnedSignature,
    vocabBankSignature,
    quizType, // NEW: Include quizType in dependencies
    FLAGS.USE_LEARNED_VOCAB_IN_QUIZ
  ]); // Stable signatures prevent infinite re-renders

  const handleSelect = async (index: number) => {
    // Prevent multiple selections
    if (quizState !== 'selecting' || isSubmitting) return;
    
    setIsSubmitting(true);
    setSelectedOption(index);
    setQuizState('showing-result');
    
    const isCorrect = shuffledOptions[index].correct;
    setIsCorrectAnswer(isCorrect);
    
    if (isCorrect) {
      // Play success sound when the correct answer is selected
      playSuccessSound();
      
      // Award XP and check if step was already completed
      if (onXpStart) {
        const wasGranted = await onXpStart(); // Await the Promise to get result
        setIsAlreadyCompleted(!wasGranted); // If not granted, it was already completed
      }
      
      // Move to completed state after brief delay to show success - REDUCED timeout
      setTimeout(() => {
        // Calculate time spent on this question
        const timeSpentMs = Date.now() - startTime.current
        
        // Track vocabulary performance to Supabase
        if (vocabularyId && onVocabTrack) {
          onVocabTrack(vocabularyId, prompt, true, timeSpentMs);
        }
        
        setQuizState('completed');
        setIsSubmitting(false);
        onComplete(true);
      }, 800); // Reduced from 1200ms to prevent component transition glitches
    } else {
      // Calculate time spent on incorrect attempt
      const timeSpentMs = Date.now() - startTime.current
      
      // For incorrect answers, track immediately since we're not advancing
      if (vocabularyId && onVocabTrack) {
        onVocabTrack(vocabularyId, prompt, false, timeSpentMs);
      }
      
      // NOTE: Remediation is handled automatically by onVocabTrack
      // Do NOT call onRemediationNeeded - it causes double counting
      
      // Reset after showing feedback
      setTimeout(() => {
        setSelectedOption(null);
        setQuizState('selecting');
        setIsSubmitting(false);
        // Don't call onComplete for incorrect answers - let user try again
      }, 1000);
    }
  }

  // Determine button styling based on state
  const getButtonStyle = (option: QuizOption, index: number) => {
    const isSelected = selectedOption === index;
    const isShowingResult = quizState === 'showing-result';
    const isCorrectOption = option.correct;
    
    if (isShowingResult) {
      // Show selected wrong answer in red
      if (isSelected && !isCorrectOption) {
        return "bg-red-100 text-red-800 ring-2 ring-red-400/50 border-red-400";
      }
      // Show selected correct answer in green
      if (isSelected && isCorrectOption) {
        return "bg-green-100 text-green-800 ring-2 ring-green-400/50 border-green-400";
      }
      // Fade unselected options
      return "bg-gray-50 text-gray-400 border-gray-200 opacity-50";
    } else if (isSelected && !isShowingResult) {
      // Selected but not showing result yet
      return "bg-primary/20 text-primary border-primary/40";
    } else {
      // Default unselected state
      return "bg-white border-2 border-primary/20 text-gray-800 hover:bg-primary/5 hover:border-primary/30 active:scale-[0.98]";
    }
  };

  // Determine animation for specific option
  const getAnimation = (option: QuizOption, index: number) => {
    const isSelected = selectedOption === index;
    const isShowingResult = quizState === 'showing-result';
    
    // Only animate if we're showing results for the selected option
    if (isSelected && isShowingResult) {
      if (option.correct) {
        // Success animation - gentle scale
        return {
          scale: [1, 1.05, 1],
          boxShadow: "0 0 0 3px rgba(34, 197, 94, 0.3)"
        };
      } else {
        // Error animation - shake
        return {
          x: [0, -8, 8, -8, 8, 0],
          boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.3)"
        };
      }
    }
    
    return {
      scale: 1,
      x: 0,
      boxShadow: "none"
    };
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* XP Animation - self-positioning */}
        {quizState === 'showing-result' && isCorrectAnswer && (
        <XpAnimation 
          amount={points} 
          show={true}
          isAlreadyCompleted={isAlreadyCompleted}
          onStart={undefined}
          onComplete={() => {}} // Handle completion in handleSelect instead
        />
        )}
        
      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-8 overflow-y-auto">
        <div className="w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl flex flex-col">
          {/* Heading and Prompt */}
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 text-primary">
              {label}
            </h2>
            <p className="text-sm xs:text-base text-muted-foreground mb-6">
              {subtitle}
            </p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 px-4">
          {prompt}
            </p>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
          {shuffledOptions.map((option, index) => (
              <motion.button
                key={`option-${index}-${option.text}-${instanceId}`}
              initial={false}
              animate={getAnimation(option, index)}
              transition={{
                x: { duration: 0.4, ease: "easeInOut" },
                scale: { duration: 0.3, ease: "easeInOut" },
                boxShadow: { duration: 0.2 }
              }}
                className={`relative rounded-2xl min-h-[120px] sm:min-h-[140px] p-4 sm:p-6
                  ${getButtonStyle(option, index)}
                  shadow-sm hover:shadow-md transition-all duration-200
                  flex items-center justify-center text-center
                  disabled:cursor-not-allowed`}
                onClick={() => handleSelect(index)}
                disabled={quizState !== 'selecting' || isSubmitting}
              >
                <span className="text-base sm:text-lg font-semibold leading-tight">
                  {option.text}
                </span>
                
                {/* Checkmark/X icon */}
                <AnimatePresence>
                  {quizState === 'showing-result' && selectedOption === index && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-2 right-2 sm:top-3 sm:right-3"
                    >
                      {option.correct ? (
                        <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
          ))}
          </div>
        </div>
      </div>
    </div>
  )
} 