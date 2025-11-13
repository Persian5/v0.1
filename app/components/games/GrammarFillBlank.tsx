"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { XpAnimation } from "./XpAnimation"
import { playSuccessSound } from "./Flashcard"
import { GrammarFillBlankStep } from "@/lib/types"
import { shuffle } from "@/lib/utils"

export interface GrammarFillBlankProps {
  exercises: GrammarFillBlankStep['data']['exercises']
  conceptId?: string // Grammar concept ID (e.g., "connectors-placement")
  title?: string
  label?: string // Main title (like Quiz/Flashcard)
  subtitle?: string // Subtitle (like Quiz/Flashcard)
  points?: number
  onComplete: (correct: boolean) => void
  onXpStart?: () => Promise<boolean>
}

export function GrammarFillBlank({
  exercises,
  conceptId,
  title,
  label,
  subtitle,
  points = 1,
  onComplete,
  onXpStart
}: GrammarFillBlankProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [activeBlankIndex, setActiveBlankIndex] = useState<number>(0) // Which blank is currently being filled
  const [blankAnswers, setBlankAnswers] = useState<Record<number, string>>({}) // Store answers for each blank
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showXp, setShowXp] = useState(false)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const startTime = useRef(Date.now())
  const currentExercise = exercises[currentExerciseIndex]
  const isLastExercise = currentExerciseIndex === exercises.length - 1

  // Check if exercise has multiple blanks
  const hasMultipleBlanks = currentExercise.blanks && currentExercise.blanks.length > 0
  const blanks = hasMultipleBlanks ? currentExercise.blanks! : []

  // Reset state when exercise changes
  useEffect(() => {
    startTime.current = Date.now()
    setActiveBlankIndex(0)
    setBlankAnswers({})
    setShowFeedback(false)
    setIsSubmitting(false)
  }, [currentExerciseIndex])

  // Determine current blank info
  const currentBlank = hasMultipleBlanks ? blanks[activeBlankIndex] : null
  const isCurrentBlankSuffix = currentBlank?.type === 'suffix'
  const isCurrentBlankWord = currentBlank?.type === 'word'
  const isCurrentBlankConnector = currentBlank?.type === 'connector'

  // Determine options based on active blank type
  const isSuffixBased = (hasMultipleBlanks && isCurrentBlankSuffix) || 
                        (!hasMultipleBlanks && currentExercise.suffixOptions && currentExercise.suffixOptions.length > 0)
  const isConnectorBased = (hasMultipleBlanks && isCurrentBlankConnector) ||
                          (!hasMultipleBlanks && conceptId === 'connectors-placement')
  const isWordBased = (hasMultipleBlanks && isCurrentBlankWord && !isCurrentBlankConnector) || 
                      (!hasMultipleBlanks && currentExercise.wordOptions && currentExercise.wordOptions.length > 0 && !isConnectorBased)

  // Get options for current blank - ONLY show relevant options based on blank type
  const rawOptions: Array<{ id: string; text: string }> = useMemo(() => {
    if (isSuffixBased) {
      // Suffix blank: ONLY show suffix options
      return [
        ...(currentExercise.suffixOptions || []),
        ...(currentExercise.distractors?.filter(d => d.text.startsWith('-')) || [])
      ]
    } else if (isConnectorBased) {
      // Connector blank: ONLY show connector options (detected by ID prefix "conn-")
      return [
        ...(currentExercise.suffixOptions?.filter(opt => opt.id.startsWith('conn-')) || []),
        ...(currentExercise.wordOptions?.filter(opt => opt.id.startsWith('conn-')) || [])
      ]
    } else {
      // Word blank: ONLY show vocabulary options (exclude connectors by ID prefix)
      return [
        ...(currentExercise.wordOptions?.filter(opt => !opt.id.startsWith('conn-')) || []),
        ...(currentExercise.distractors?.filter(d => !d.text.startsWith('-') && !d.id.startsWith('conn-')) || [])
      ]
    }
  }, [isSuffixBased, isConnectorBased, currentExercise, activeBlankIndex])

  // Shuffle options for randomization (like Quiz component)
  const allOptions = useMemo(() => shuffle(rawOptions), [rawOptions])

  // Check if all blanks are filled correctly
  const checkAllBlanks = () => {
    if (hasMultipleBlanks) {
      return blanks.every(blank => {
        const answer = blankAnswers[blank.index]
        const correctAnswer = blank.correctAnswer
        return answer === correctAnswer
      })
    } else {
      // Single blank (backward compatibility)
      const answer = blankAnswers[0]
      const correctAnswer = currentExercise.correctAnswer || ''
      return answer === correctAnswer
    }
  }

  // Check if current blank is correct
  const checkCurrentBlank = (selectedText: string) => {
    if (hasMultipleBlanks && currentBlank) {
      return selectedText === currentBlank.correctAnswer
    } else {
      // Single blank (backward compatibility)
      return selectedText === (currentExercise.correctAnswer || '')
    }
  }

  const handleSelectOption = async (optionId: string) => {
    if (isSubmitting || showFeedback) return
    
    setIsSubmitting(true)
    
    const selectedOption = allOptions.find(opt => opt.id === optionId)
    if (!selectedOption) {
      setIsSubmitting(false)
      return
    }
    
    const selectedText = isSuffixBased 
      ? selectedOption.text.replace(/^-/, '')
      : selectedOption.text

    const isAnswerCorrect = checkCurrentBlank(selectedText)
    
    // Store answer for current blank
    const blankIndex = hasMultipleBlanks ? activeBlankIndex : 0
    setBlankAnswers(prev => ({ ...prev, [blankIndex]: selectedText }))
    
    setIsCorrect(isAnswerCorrect)
    setShowFeedback(true)

    if (isAnswerCorrect) {
      playSuccessSound()
      
      // Update blankAnswers state first
      const newBlankAnswers = { ...blankAnswers, [blankIndex]: selectedText }
      
      // Check if all blanks are filled
      if (hasMultipleBlanks) {
        const allBlanksFilled = blanks.every(blank => {
          if (blank.index === activeBlankIndex) {
            return true // Current blank just filled
          }
          return newBlankAnswers[blank.index] !== undefined
        })
        
        if (allBlanksFilled) {
          // Check if all are correct (use updated answers)
          const allCorrect = blanks.every(blank => {
            const answer = blank.index === activeBlankIndex ? selectedText : blankAnswers[blank.index]
            return answer === blank.correctAnswer
          })
          
          if (allCorrect) {
            // Award XP on first correct answer
            if (onXpStart && currentExerciseIndex === 0) {
              const wasGranted = await onXpStart()
              setIsAlreadyCompleted(!wasGranted)
            }
            
            // Move to next exercise or complete
            setTimeout(() => {
              if (isLastExercise) {
                setShowXp(true)
              } else {
                setCurrentExerciseIndex(prev => prev + 1)
              }
              setIsSubmitting(false)
            }, 1000)
          } else {
            // All blanks filled but some incorrect - show error
            setTimeout(() => {
              setShowFeedback(false)
              setIsSubmitting(false)
            }, 1500)
          }
        } else {
          // Move to next blank
          if (activeBlankIndex < blanks.length - 1) {
            setTimeout(() => {
              setActiveBlankIndex(prev => prev + 1)
              setShowFeedback(false)
              setIsSubmitting(false)
            }, 1000)
          }
        }
      } else {
        // Single blank - complete exercise
        // Award XP on first correct answer
        if (onXpStart && currentExerciseIndex === 0) {
          const wasGranted = await onXpStart()
          setIsAlreadyCompleted(!wasGranted)
        }
        
        // Move to next exercise or complete
        setTimeout(() => {
          if (isLastExercise) {
            setShowXp(true)
          } else {
            setCurrentExerciseIndex(prev => prev + 1)
          }
          setIsSubmitting(false)
        }, 1000)
      }
    } else {
      // Show error feedback and allow retry
      setTimeout(() => {
        setShowFeedback(false)
        setIsSubmitting(false)
      }, 1500)
    }
  }

  const handleXpComplete = () => {
    setShowXp(false)
    onComplete(true)
  }

  // Check if a specific blank is correct
  const isBlankCorrect = (blankIndex: number) => {
    if (hasMultipleBlanks) {
      const blank = blanks[blankIndex]
      const answer = blankAnswers[blankIndex]
      return answer === blank.correctAnswer
    } else {
      const answer = blankAnswers[0]
      return answer === (currentExercise.correctAnswer || '')
    }
  }

  // Render sentence with blanks
  const renderSentence = () => {
    const sentence = currentExercise.sentence
    const parts = sentence.split('___')
    
    if (hasMultipleBlanks) {
      // Multiple blanks - render with all blanks
      return (
        <div className="flex items-center justify-center gap-2 flex-wrap text-xl sm:text-2xl font-bold text-gray-900">
          {parts.map((part, index) => (
            <span key={index}>
              {part}
              {index < parts.length - 1 && (
                <motion.span
                  animate={showFeedback && blankAnswers[index] && isBlankCorrect(index) ? { scale: [1, 1.2, 1] } : {}}
                  className={`inline-block min-w-[80px] px-3 py-2 rounded-lg border-2 mx-1 ${
                    blankAnswers[index] && isBlankCorrect(index)
                      ? 'bg-green-100 border-green-500 text-green-700'
                      : blankAnswers[index] && !isBlankCorrect(index)
                      ? 'bg-red-100 border-red-500 text-red-700'
                      : index === activeBlankIndex
                      ? 'bg-primary/10 border-primary text-primary border-dashed'
                      : blankAnswers[index]
                      ? 'bg-gray-100 border-gray-300 text-gray-600'
                      : 'bg-gray-100 border-gray-300 text-gray-400 border-dashed'
                  }`}
                >
                  {blankAnswers[index] || '___'}
                </motion.span>
              )}
            </span>
          ))}
        </div>
      )
    } else {
      // Single blank (backward compatibility)
      const beforeBlank = parts[0]
      const afterBlank = parts[1] || ''
      const answer = blankAnswers[0]
      
      return (
        <div className="flex items-center justify-center gap-2 flex-wrap text-xl sm:text-2xl font-bold text-gray-900">
          <span>{beforeBlank}</span>
          <motion.span
            animate={showFeedback && isCorrect ? { scale: [1, 1.2, 1] } : {}}
            className={`inline-block min-w-[80px] px-3 py-2 rounded-lg border-2 ${
              showFeedback && isCorrect
                ? 'bg-green-100 border-green-500 text-green-700'
                : showFeedback && !isCorrect
                ? 'bg-red-100 border-red-500 text-red-700'
                : 'bg-gray-100 border-gray-300 text-gray-400 border-dashed'
            }`}
          >
            {answer || '___'}
          </motion.span>
          <span>{afterBlank}</span>
        </div>
      )
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* XP Animation */}
      <XpAnimation
        amount={points}
        show={showXp}
        isAlreadyCompleted={isAlreadyCompleted}
        onComplete={handleXpComplete}
      />

      {/* Content - Fits viewport, no scrolling */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-3 max-w-4xl mx-auto w-full overflow-hidden">
        {/* Header - Consistent with Quiz/Flashcard pattern */}
        <div className="text-center mb-4">
          {label && (
            <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 text-primary">
              {label}
            </h2>
          )}
          {subtitle && (
            <p className="text-sm xs:text-base text-muted-foreground mb-2">
              {subtitle}
            </p>
          )}
        </div>

        {/* Sentence with blank(s) - Compact, consistent with other games */}
        <div className="bg-white rounded-xl p-4 shadow-md border-2 border-primary/10 mb-3 w-full">
          <div className="text-center mb-3">
            {/* Translation - Subtle, like Quiz prompt */}
            <p className="text-sm text-muted-foreground mb-3">
              {currentExercise.translation}
            </p>
            
            {/* Sentence */}
            {renderSentence()}
            
            {/* Active blank indicator - only show if 2+ blanks */}
            {hasMultipleBlanks && blanks.length > 1 && (
              <p className="text-xs text-muted-foreground mt-2">
                Fill blank {activeBlankIndex + 1} of {blanks.length}
              </p>
            )}
          </div>

          {/* Feedback - Compact */}
          <AnimatePresence>
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-center gap-2"
              >
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-700 font-medium">Correct!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-700 font-medium">Try again</span>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Options - Different layouts for Step 2 vs Step 3 */}
        <div className={`w-full flex-1 flex flex-col justify-center min-h-0 ${hasMultipleBlanks ? 'items-center' : ''}`}>
          <p className="text-center text-xs text-muted-foreground mb-2">
            {isSuffixBased 
              ? 'Choose the correct suffix:' 
              : isConnectorBased 
              ? 'Choose the correct connector:' 
              : 'Choose the correct word:'}
          </p>
          {/* Step 2 (single blank): Horizontal grid, Step 3 (multiple blanks): Vertical list */}
          <div className={hasMultipleBlanks 
            ? "flex flex-col gap-2 w-full max-w-md" 
            : "grid grid-cols-2 sm:grid-cols-4 gap-2"
          }>
            {allOptions.map((option) => {
              const isSelected = blankAnswers[hasMultipleBlanks ? activeBlankIndex : 0] === 
                (isSuffixBased ? option.text.replace(/^-/, '') : option.text)
              const showResult = showFeedback && isSelected
              
              return (
                <motion.button
                  key={option.id}
                  onClick={() => handleSelectOption(option.id)}
                  disabled={isSubmitting || showFeedback}
                  className={`${hasMultipleBlanks ? 'w-full p-4' : 'p-3'} rounded-xl border-2 font-medium transition-all ${
                    showResult && isCorrect
                      ? 'bg-green-100 border-green-500 text-green-700'
                      : showResult && !isCorrect
                      ? 'bg-red-100 border-red-500 text-red-700'
                      : isSelected
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-primary hover:bg-primary/5'
                  } ${isSubmitting || showFeedback ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                  whileHover={!isSubmitting && !showFeedback ? { scale: 1.05 } : {}}
                  whileTap={!isSubmitting && !showFeedback ? { scale: 0.95 } : {}}
                >
                  <div className={`${hasMultipleBlanks ? 'text-base' : 'text-lg'} font-bold`}>{option.text}</div>
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
