import { useState, useMemo, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { XpAnimation } from "./XpAnimation"
import { playSuccessSound } from "./Flashcard"
import { VocabularyService } from "@/lib/services/vocabulary-service"
import { shuffle } from "@/lib/utils"

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
  vocabularyId?: string; // Optional: for tracking vocabulary performance
  onVocabTrack?: (vocabularyId: string, wordText: string, isCorrect: boolean, timeSpentMs?: number) => void; // Track vocabulary performance
  label?: string; // Optional custom label (e.g., "PRACTICE AGAIN" for remediation)
  subtitle?: string; // Optional custom subtitle
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
  subtitle = "Test what you've learned"
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

  // Randomize options ONCE when content changes
  const shuffledOptions = useMemo(() => {
    // Convert string[] to QuizOption[] if needed
    const formattedOptions: QuizOption[] = Array.isArray(options) && typeof options[0] === 'string'
      ? (options as string[]).map((opt, i) => ({ text: opt, correct: i === correct }))
      : options as QuizOption[];

    // Fisher-Yates shuffle for proper randomization
    return shuffle(formattedOptions);
  }, [optionsHash]); // Only re-shuffle if content actually changes

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
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-primary/5 via-primary/2 to-white">
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