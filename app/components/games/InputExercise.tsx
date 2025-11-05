import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { XpAnimation } from "./XpAnimation"
import { playSuccessSound } from "./Flashcard"
import { VocabularyService } from "@/lib/services/vocabulary-service"

export interface InputExerciseProps {
  question: string
  answer: string
  points?: number
  onComplete: (correct: boolean) => void
  onXpStart?: () => Promise<boolean> // Returns true if XP granted, false if already completed
  vocabularyId?: string; // Optional: for tracking vocabulary performance
  onVocabTrack?: (vocabularyId: string, wordText: string, isCorrect: boolean, timeSpentMs?: number) => void; // Track vocabulary performance
}

// Enhanced input component for grammar lessons with hyphen support
function GrammarHyphenInput({ 
  value, 
  targetAnswer, 
  onChange, 
  onSubmit,
  placeholder,
  disabled,
  className 
}: {
  value: string;
  targetAnswer: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  disabled: boolean;
  className?: string;
}) {
  const firstInputRef = useRef<HTMLInputElement>(null);
  const secondInputRef = useRef<HTMLInputElement>(null);
  
  // Split the target answer by hyphen
  const [beforeHyphen, afterHyphen] = targetAnswer.split('-');
  const [firstPart, setFirstPart] = useState('');
  const [secondPart, setSecondPart] = useState('');
  
  // Update parent component with combined value
  useEffect(() => {
    const combinedValue = `${firstPart}${secondPart ? '-' + secondPart : ''}`;
    onChange(combinedValue);
  }, [firstPart, secondPart, onChange]);
  
  // Parse incoming value for controlled behavior
  useEffect(() => {
    if (value.includes('-')) {
      const [first, second] = value.split('-');
      setFirstPart(first || '');
      setSecondPart(second || '');
    } else {
      setFirstPart(value);
      setSecondPart('');
    }
  }, [value]);

  const handleFirstPartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFirstPart(e.target.value);
  };

  const handleSecondPartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecondPart(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent, isSecondInput: boolean = false) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    } else if (e.key === 'Tab' && !isSecondInput) {
      e.preventDefault();
      secondInputRef.current?.focus();
    }
  };

  const normalizeForComparison = (text: string): string => {
    return text.toLowerCase().trim();
  };

  const getValidationStatus = (inputValue: string, targetValue: string): 'correct' | 'incorrect' | 'pending' => {
    if (!inputValue) return 'pending';
    const normalized = normalizeForComparison(inputValue);
    const normalizedTarget = normalizeForComparison(targetValue);
    return normalized === normalizedTarget ? 'correct' : 'incorrect';
  };

  const firstStatus = getValidationStatus(firstPart, beforeHyphen);
  const secondStatus = getValidationStatus(secondPart, afterHyphen);

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <div className="relative flex-1 max-w-[120px]">
        <Input
          ref={firstInputRef}
          type="text"
          value={firstPart}
          onChange={handleFirstPartChange}
          onKeyDown={(e) => handleKeyDown(e, false)}
          className={`text-center text-lg border-2 transition-all ${
            firstStatus === 'correct' 
              ? 'border-green-500 bg-green-50' 
              : firstStatus === 'incorrect'
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300'
          }`}
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          placeholder={disabled ? beforeHyphen : ''}
        />
      </div>
      
      {/* Fixed hyphen */}
      <div className="text-2xl font-bold text-primary px-1">-</div>
      
      <div className="relative flex-1 max-w-[120px]">
        <Input
          ref={secondInputRef}
          type="text"
          value={secondPart}
          onChange={handleSecondPartChange}
          onKeyDown={(e) => handleKeyDown(e, true)}
          className={`text-center text-lg border-2 transition-all ${
            secondStatus === 'correct' 
              ? 'border-green-500 bg-green-50' 
              : secondStatus === 'incorrect'
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300'
          }`}
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          placeholder={disabled ? afterHyphen : ''}
        />
      </div>
    </div>
  );
}

// Letter validation component for regular input (non-hyphen)
function ValidatedLetterInput({ 
  value, 
  targetAnswer, 
  onChange, 
  onSubmit,
  placeholder,
  disabled,
  className 
}: {
  value: string;
  targetAnswer: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  disabled: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Normalize answers for comparison (handle multiple valid formats)
  const normalizeAnswer = (text: string): string => {
    return text.toLowerCase().trim().replace(/[^a-z]/g, ''); // Remove spaces, hyphens, etc.
  };

  const normalizedTarget = normalizeAnswer(targetAnswer);
  const normalizedInput = normalizeAnswer(value);

  // Validate each character
  const validateCharacter = (char: string, index: number): 'correct' | 'incorrect' | 'pending' => {
    if (index >= normalizedInput.length) return 'pending';
    if (index >= normalizedTarget.length) return 'incorrect';
    return normalizedInput[index] === normalizedTarget[index] ? 'correct' : 'incorrect';
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Remove auto-submit - let user click "Check Answer" button instead
  };

  // Handle key presses
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Hidden input for actual text entry */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="absolute inset-0 opacity-0 w-full h-full z-10 cursor-text"
        disabled={disabled}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />
      
      {/* Visual letter display */}
      <div 
        className="w-full px-4 py-3 text-base sm:text-lg bg-gray-100 rounded-full shadow-sm border-2 border-transparent focus-within:border-primary/50 transition-all min-h-[48px] flex items-center cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex flex-wrap gap-1 w-full justify-center">
          {/* Show target letters with validation colors */}
          {normalizedTarget.split('').map((targetChar, index) => {
            const status = validateCharacter(targetChar, index);
            const userChar = index < normalizedInput.length ? normalizedInput[index] : '';
            
            return (
              <motion.span
                key={index}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`
                  inline-flex items-center justify-center min-w-[24px] h-[28px] rounded text-sm font-medium transition-all duration-200
                  ${status === 'correct' 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : status === 'incorrect'
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-gray-50 text-gray-400 border border-gray-200'
                  }
                `}
              >
                {status === 'pending' ? (
                  <span className="text-gray-300">_</span>
                ) : status === 'correct' ? (
                  userChar
                ) : (
                  userChar
                )}
              </motion.span>
            );
          })}
          
          {/* Show extra characters (beyond target length) in red */}
          {normalizedInput.length > normalizedTarget.length && (
            normalizedInput.slice(normalizedTarget.length).split('').map((char, index) => (
              <motion.span
                key={`extra-${index}`}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center justify-center min-w-[24px] h-[28px] rounded text-sm font-medium bg-red-100 text-red-700 border border-red-300"
              >
                {char}
              </motion.span>
            ))
          )}
          
          {/* Typing cursor */}
          {!disabled && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="inline-flex items-center justify-center w-[2px] h-[28px] bg-primary ml-1"
            />
          )}
        </div>
      </div>
      
      {/* Placeholder text - centered below character boxes, disappears when typing starts */}
      {value.length === 0 && (
        <div className="text-center mt-2">
          <span className="text-sm text-gray-400">
            {placeholder}
          </span>
        </div>
      )}
      
      {/* Progress indicator */}
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>{Math.min(normalizedInput.length, normalizedTarget.length)}/{normalizedTarget.length} letters</span>
      </div>
    </div>
  );
}

export function InputExercise({ 
  question = "Type 'How are you?' in Persian (Finglish)",
  answer = "Chetori",
  points = 2,
  onComplete,
  onXpStart,
  vocabularyId,
  onVocabTrack
}: InputExerciseProps) {
  const [input, setInput] = useState("")
  const [showFeedback, setShowFeedback] = useState(false)
  const [showXp, setShowXp] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false) // Track if step was already completed (local state)
  const [hasTracked, setHasTracked] = useState(false) // CRITICAL: Prevent duplicate onVocabTrack calls
  
  // Time tracking for analytics
  const startTime = useRef(Date.now())
  
  // Reset timer when question changes
  useEffect(() => {
    startTime.current = Date.now()
    setHasTracked(false); // Reset tracking flag for new question
  }, [question, answer])

  // Check if this is a grammar lesson (contains hyphen)
  const hasHyphen = answer.includes('-');

  const handleInputChange = (value: string) => {
    setInput(value)
    if (showFeedback && !isCorrect) {
      setShowFeedback(false)
    }
  }

  const handleSubmit = async () => {
    // CRITICAL: Prevent duplicate submissions - check BEFORE any state updates
    if (hasTracked) {
      console.log(`⏭️ [INPUT] Skipping duplicate handleSubmit for vocabularyId: ${vocabularyId}`);
      return;
    }
    
    // Normalize both input and answer for comparison
    const normalizeForComparison = (text: string): string => {
      return text.toLowerCase().trim().replace(/[^a-z]/g, '');
    };
    
    const normalizedInput = normalizeForComparison(input);
    const normalizedAnswer = normalizeForComparison(answer);
    const isAnswerCorrect = normalizedInput === normalizedAnswer;
    
    setIsCorrect(isAnswerCorrect)
    setShowFeedback(true)
    setHasTracked(true); // Mark as tracked IMMEDIATELY to prevent duplicate calls

    // Calculate time spent on this input
    const timeSpentMs = Date.now() - startTime.current;

    // Track vocabulary performance to Supabase - hasTracked already set above
    if (vocabularyId && onVocabTrack) {
      onVocabTrack(vocabularyId, question, isAnswerCorrect, timeSpentMs);
    }
    
    // NOTE: Remediation is handled automatically by onVocabTrack
    // Do NOT call onRemediationNeeded - it causes double counting

    if (isAnswerCorrect) {
      // Play success sound for correct answers
      playSuccessSound();
      
      // Award XP and check if step was already completed
      if (onXpStart) {
        const wasGranted = await onXpStart(); // Await the Promise to get result
        setIsAlreadyCompleted(!wasGranted); // If not granted, it was already completed
      }
      
      // Trigger XP animation for visual feedback
      setShowXp(true)
    } else {
      // If incorrect, show feedback briefly and allow retry
      setTimeout(() => {
        setShowFeedback(false);
        setHasTracked(false); // Reset for retry (only after timeout completes)
        // Don't clear input - let user see their mistakes and correct them
      }, 1500); // Reset feedback after 1.5 seconds
    }
  }

  const toggleHint = () => {
    setShowHint(prev => !prev);
  }

  // Generate dynamic hint based on the answer
  const generateHint = (answer: string): string => {
    const cleanAnswer = answer.toLowerCase().trim();
    if (cleanAnswer.length <= 2) {
      return cleanAnswer; // For very short answers, show the whole thing
    } else if (cleanAnswer.length <= 4) {
      return cleanAnswer.substring(0, 2) + "..."; // Show first 2 characters
    } else {
      return cleanAnswer.substring(0, 3) + "..."; // Show first 3 characters
    }
  };

  return (
    <div className="w-full max-w-[90vw] sm:max-w-[80vw] mx-auto py-4">
      <div className="text-center mb-4">
        <h2 className="text-2xl sm:text-3xl font-bold mb-1 text-primary">Practice</h2>
        <p className="text-muted-foreground">
          {hasHyphen ? "Fill in both parts with the hyphen connecting them!" : "Type the correct word - watch the letters turn green!"}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 relative">
        <XpAnimation 
          amount={points} 
          show={showXp}
          isAlreadyCompleted={isAlreadyCompleted}
          onStart={undefined}
          onComplete={() => {
            setShowXp(false)  // reset for next use
            onComplete(isCorrect)
          }}
        />
        
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-lg sm:text-xl">
              {question}
            </p>
          </div>

          <div className="space-y-4">
            <motion.div
              initial={false}
              animate={showFeedback && !isCorrect ? { x: [0, -5, 5, -5, 5, 0] } : {}}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              {hasHyphen ? (
                <GrammarHyphenInput
                  value={input}
                  targetAnswer={answer}
                  onChange={handleInputChange}
                  onSubmit={handleSubmit}
                  placeholder="Start typing..."
                  disabled={showFeedback && isCorrect}
                  className="w-full"
                />
              ) : (
                <ValidatedLetterInput
                  value={input}
                  targetAnswer={answer}
                  onChange={handleInputChange}
                  onSubmit={handleSubmit}
                  placeholder="Start typing..."
                  disabled={showFeedback && isCorrect}
                  className="w-full"
                />
              )}
            </motion.div>

            {/* Hint Toggle (Collapsible Pill) */}
            <div className="mt-3 mb-4 sm:mb-6">
              <div className="bg-gray-100 rounded-full">
                <button 
                  type="button"
                  onClick={toggleHint}
                  className="w-full flex items-center justify-center p-2 text-sm text-gray-600 hover:bg-gray-200 transition-colors duration-200"
                >
                  <span className="mr-1">🔍</span>
                  <span>Need a hint?</span>
                  {showHint ? 
                    <ChevronUp className="ml-1 h-4 w-4" /> : 
                    <ChevronDown className="ml-1 h-4 w-4" />
                  }
                </button>
                
                {showHint && (
                  <div className="px-4 pb-3 pt-1">
                    <p className="text-center text-green-700 font-medium">
                      <span className="mr-1">📣</span> Starts with: {generateHint(answer)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showFeedback && !isCorrect && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center text-red-500 mt-3 text-sm"
              >
                Not quite right. Try again!
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Motivation Bubble */}
      <div className="mt-5 mb-4 sm:mt-6 sm:mb-5">
        <div className="bg-primary/5 p-3 rounded-xl text-center">
          <p className="text-sm text-gray-600 font-normal">
            {hasHyphen ? "💡 Each part turns green when correct!" : "💡 Green letters are correct, red letters need fixing!"}
          </p>
        </div>
      </div>
      
      {/* Submit button */}
      <Button
        onClick={handleSubmit}
        className="w-full text-base sm:text-lg py-3 mt-2"
        disabled={showFeedback && isCorrect}
      >
        Check Answer
      </Button>
    </div>
  )
}
