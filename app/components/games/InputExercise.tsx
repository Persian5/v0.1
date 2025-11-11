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

  // Handle input changes with max length enforcement
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Prevent typing more than target length - strict limit
    if (normalizeAnswer(newValue).length > normalizedTarget.length) {
      return; // Don't update if exceeds target length
    }
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
        className="w-full px-4 py-4 text-base sm:text-lg bg-white rounded-xl shadow-sm border-2 border-primary/20 focus-within:border-primary focus-within:shadow-md transition-all min-h-[56px] flex items-center cursor-text hover:border-primary/40"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex flex-wrap gap-1.5 w-full justify-center">
          {/* Show target letters with validation colors */}
          {normalizedTarget.split('').map((targetChar, index) => {
            const status = validateCharacter(targetChar, index);
            const userChar = index < normalizedInput.length ? normalizedInput[index] : '';
            
            return (
              <span
                key={index}
                className={`
                  inline-flex items-center justify-center min-w-[28px] h-[36px] rounded-lg text-base font-semibold transition-all duration-200
                  ${status === 'correct' 
                    ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                    : status === 'incorrect'
                    ? 'bg-red-100 text-red-700 border-2 border-red-300'
                    : 'bg-gray-50 text-gray-400 border-2 border-gray-200'
                  }
                `}
              >
                {status === 'pending' ? (
                  <span className="text-gray-300 font-normal">_</span>
                ) : (
                  userChar.toUpperCase()
                )}
              </span>
            );
          })}
          
          {/* Show extra characters (beyond target length) in red */}
          {normalizedInput.length > normalizedTarget.length && (
            normalizedInput.slice(normalizedTarget.length).split('').map((char, index) => (
              <span
                key={`extra-${index}`}
                className="inline-flex items-center justify-center min-w-[28px] h-[36px] rounded-lg text-base font-semibold bg-red-100 text-red-700 border-2 border-red-300"
              >
                {char.toUpperCase()}
              </span>
            ))
          )}
          
          {/* Typing cursor */}
          {!disabled && (
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex items-center justify-center w-[3px] h-[36px] bg-primary rounded-full ml-0.5"
            />
          )}
        </div>
      </div>
      
      {/* Progress indicator - more subtle */}
      <div className="mt-2 flex items-center justify-center gap-2">
        <div className="flex items-center gap-1">
          {Array.from({ length: normalizedTarget.length }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i < normalizedInput.length 
                  ? validateCharacter('', i) === 'correct'
                    ? 'bg-green-500'
                    : 'bg-red-500'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-500 font-medium">
          {Math.min(normalizedInput.length, normalizedTarget.length)}/{normalizedTarget.length}
        </span>
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
  const [isSubmitting, setIsSubmitting] = useState(false) // Prevent double-submit
  
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
    // CRITICAL: Prevent duplicate submissions
    if (hasTracked || isSubmitting) {
      console.log(`⏭️ [INPUT] Skipping duplicate handleSubmit for vocabularyId: ${vocabularyId}`);
      return;
    }
    
    setIsSubmitting(true); // Lock submission
    
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
      setIsSubmitting(false); // Unlock for next step
    } else {
      // If incorrect, show feedback briefly and allow retry
      setTimeout(() => {
        setShowFeedback(false);
        setHasTracked(false); // Reset for retry (only after timeout completes)
        setIsSubmitting(false); // Unlock for retry
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
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-primary/5 via-primary/2 to-white">
      {/* XP Animation - self-positioning */}
        <XpAnimation 
          amount={points} 
          show={showXp}
          isAlreadyCompleted={isAlreadyCompleted}
          onStart={undefined}
          onComplete={() => {
            setShowXp(false)
            onComplete(isCorrect)
          }}
        />
        
      {/* Main Content - Centered and scrollable */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-8 overflow-y-auto">
        <div className="w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl flex flex-col">
          {/* Header */}
          <div className="text-center mb-3 sm:mb-4">
            <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold mb-1 text-primary">
              TYPE THE ANSWER
            </h2>
            <p className="text-sm xs:text-base text-muted-foreground mb-4">
              Type in Finglish
            </p>
          </div>

          {/* Question */}
          <div className="text-center mb-4">
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 px-4">
              {question}
            </p>
          </div>

          {/* Input Area - Enhanced as hero element */}
        <motion.div
          initial={false}
          animate={showFeedback && !isCorrect ? { x: [0, -5, 5, -5, 5, 0] } : {}}
          transition={{ duration: 0.5 }}
            className="w-full mb-4"
        >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border-2 border-primary/10">
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
              
              {/* Helper Text - Inside input zone */}
              <p className="text-center text-xs sm:text-sm text-gray-500 mt-3">
                {hasHyphen ? "Each part turns green when correct" : "Watch letters turn green as you type!"}
              </p>
            </div>
        </motion.div>

          {/* Hint Display - When shown */}
          {showHint && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3"
              >
                <div className="bg-blue-50 border-2 border-blue-200 border-l-4 border-l-blue-500 rounded-xl p-4 text-center">
                  <p className="text-blue-900 font-medium text-sm sm:text-base">
                    Starts with: <span className="font-bold text-blue-700">{generateHint(answer)}</span>
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Action Buttons - Mobile: positioned below content, Desktop: in flow */}
          <div className="sm:mt-4 lg:mt-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
              <Button
                onClick={handleSubmit}
                className="w-full sm:w-auto sm:min-w-[280px] lg:min-w-[320px] text-base sm:text-lg py-6 sm:py-7 font-bold shadow-lg hover:shadow-xl transition-all order-2 sm:order-1"
                disabled={showFeedback && isCorrect || isSubmitting}
              >
                {isSubmitting ? 'Checking...' : showFeedback && isCorrect ? 'Correct!' : 'Check Answer'}
              </Button>
              
          <button 
            type="button"
            onClick={toggleHint}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 bg-transparent hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-xl transition-all text-sm font-medium border border-gray-300 hover:border-gray-400 order-1 sm:order-2 whitespace-nowrap"
          >
            <span>{showHint ? 'Hide hint' : 'Need a hint?'}</span>
            {showHint ? 
              <ChevronUp className="h-4 w-4" /> : 
              <ChevronDown className="h-4 w-4" />
            }
          </button>
        </div>
              </div>
              </div>
      </div>
    </div>
  )
}
