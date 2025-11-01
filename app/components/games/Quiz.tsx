import { useState, useMemo, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { XpAnimation } from "./XpAnimation"
import { playSuccessSound } from "./Flashcard"
import { VocabularyService } from "@/lib/services/vocabulary-service"

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
  onRemediationNeeded?: (vocabularyId: string | undefined) => void; // Callback for when remediation is needed
  onVocabTrack?: (vocabularyId: string, wordText: string, isCorrect: boolean, timeSpentMs?: number) => void; // Track vocabulary performance
}

export function Quiz({ 
  prompt,
  options,
  correct = 0,
  points = 2,
  onComplete,
  onXpStart,
  vocabularyId,
  onRemediationNeeded,
  onVocabTrack
}: QuizProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [quizState, setQuizState] = useState<'selecting' | 'showing-result' | 'completed'>('selecting')
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false) // Track if step was already completed (local state)
  
  // Time tracking for analytics
  const startTime = useRef(Date.now())
  
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

  // Randomize options ONCE on mount - more efficient than useEffect
  // If options are already QuizOption[] with correct flags, don't shuffle if already shuffled
  const shuffledOptions = useMemo(() => {
    // Convert string[] to QuizOption[] if needed
    const formattedOptions: QuizOption[] = Array.isArray(options) && typeof options[0] === 'string'
      ? (options as string[]).map((opt, i) => ({ text: opt, correct: i === correct }))
      : options as QuizOption[];

    // Check if options are already shuffled (all have correct flag set correctly)
    const hasCorrectFlags = formattedOptions.some(opt => opt.correct === true);
    const isAlreadyShuffled = hasCorrectFlags && formattedOptions.length > 0;
    
    // If options are already shuffled (from remediation with deterministic shuffle), don't shuffle again
    if (isAlreadyShuffled && formattedOptions.length === 4) {
      // Options are already in correct order with correct flags - use as-is
      return formattedOptions;
    }

    // Shuffle the options once using stable seed
    return [...formattedOptions].sort(() => Math.random() - 0.5);
  }, [optionsHash]); // Only re-shuffle if content actually changes

  const handleSelect = async (index: number) => {
    // Prevent multiple selections
    if (quizState !== 'selecting') return;
    
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
        onComplete(true);
      }, 800); // Reduced from 1200ms to prevent component transition glitches
    } else {
      // Calculate time spent on incorrect attempt
      const timeSpentMs = Date.now() - startTime.current
      
      // For incorrect answers, track immediately since we're not advancing
      if (vocabularyId && onVocabTrack) {
        onVocabTrack(vocabularyId, prompt, false, timeSpentMs);
      }
      
      // Trigger remediation if callback provided
      if (vocabularyId && onRemediationNeeded) {
        onRemediationNeeded(vocabularyId);
      }
      
      // Reset after showing feedback
      setTimeout(() => {
        setSelectedOption(null);
        setQuizState('selecting');
        // Don't call onComplete for incorrect answers - let user try again
      }, 1000);
    }
  }

  // Determine button styling based on state
  const getButtonStyle = (option: QuizOption, index: number) => {
    const isSelected = selectedOption === index;
    const isShowingResult = quizState === 'showing-result';
    
    if (isSelected && isShowingResult) {
      // Selected option during result phase
      if (option.correct) {
        return "bg-green-100 text-green-700 ring-4 ring-green-300/50 border-green-300";
      } else {
        return "bg-red-100 text-red-700 ring-4 ring-red-300/50 border-red-300";
      }
    } else if (isSelected && !isShowingResult) {
      // Selected but not showing result yet
      return "bg-primary/20 text-primary border-primary/40";
    } else {
      // Default unselected state
      return "bg-white border-2 border-primary/20 text-gray-800 sm:hover:bg-primary/10 sm:hover:scale-[1.02]";
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
    <div className="flex flex-col items-center w-full flex-1 px-2 sm:px-4 md:px-6 min-h-0">
      <div className="text-center mb-2 sm:mb-3">
        <h2 className="text-2xl sm:text-3xl font-bold mb-1 text-primary">Quick Quiz</h2>
        <p className="text-muted-foreground">Test what you've learned!</p>
      </div>

      <div
        className="w-full max-w-full sm:max-w-[85vw] mx-auto px-2 py-2 sm:px-4 sm:py-4 sm:flex-grow flex flex-col sm:justify-between relative min-h-0 pb-[calc(env(safe-area-inset-bottom,_0px)+8px)]"
      >
        {/* XP Animation - only show for correct answers */}
        {quizState === 'showing-result' && isCorrectAnswer && (
        <XpAnimation 
          amount={points} 
          show={true}
          isAlreadyCompleted={isAlreadyCompleted}
          onStart={undefined}
          onComplete={() => {}} // Handle completion in handleSelect instead
        />
        )}
        
        <h3 className="text-lg sm:text-xl font-semibold mb-2 text-center">
          {prompt}
        </h3>

        <div className="grid grid-cols-2 gap-2 sm:gap-4 min-w-0 sm:flex-grow">
          {shuffledOptions.map((option, index) => (
            <motion.div
              key={`option-${index}-${option.text}-${instanceId}`} // Stable key based on content and instance ID
              initial={false}
              animate={getAnimation(option, index)}
              transition={{
                x: { duration: 0.4, ease: "easeInOut" },
                scale: { duration: 0.3, ease: "easeInOut" },
                boxShadow: { duration: 0.2 }
              }}
              className="relative rounded-lg overflow-hidden h-auto flex min-h-[14rem] sm:min-h-[8rem]"
            >
              <button
                className={`w-full h-full rounded-lg whitespace-normal break-words text-lg font-semibold px-2 sm:px-3 py-4 
                  ${getButtonStyle(option, index)}
                  active:scale-95 shadow-sm sm:hover:shadow-md flex items-center justify-center transition-colors duration-200`}
                onClick={() => handleSelect(index)}
                disabled={quizState !== 'selecting'}
              >
                <span className="px-2 py-1 text-center text-base sm:text-lg lg:text-xl">{option.text}</span>
                
                <AnimatePresence>
                  {quizState === 'showing-result' && selectedOption === index && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-1 right-1 sm:top-2 sm:right-2"
                    >
                      {option.correct ? (
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {quizState === 'showing-result' && !isCorrectAnswer && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-center text-red-600 mt-3 font-medium"
            >
              Try again!
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 