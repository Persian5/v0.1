"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { XpAnimation } from "./XpAnimation"
import { playSuccessSound } from "./Flashcard"
import { GrammarFillBlankStep } from "@/lib/types"
import { shuffle } from "@/lib/utils"
import { useAuth } from "@/components/auth/AuthProvider"
import { deriveStepUid } from "@/lib/utils/step-uid"
import { GrammarTrackingService } from "@/lib/services/grammar-tracking-service"
import { generateGrammarOptions, type GrammarOption } from "@/lib/utils/grammar-options"
import { VocabularyService } from "@/lib/services/vocabulary-service"

export interface GrammarFillBlankProps {
  exercises: GrammarFillBlankStep['data']['exercises']
  conceptId?: string // Grammar concept ID (e.g., "connectors-placement")
  moduleId?: string  // NEW: Required for tracking
  lessonId?: string  // NEW: Required for tracking
  stepIndex?: number // NEW: Required for tracking
  title?: string
  label?: string // Main title (like Quiz/Flashcard)
  subtitle?: string // Subtitle (like Quiz/Flashcard)
  points?: number
  onComplete: (correct: boolean) => void
  onXpStart?: () => Promise<boolean>
  learnedSoFar?: {  // PHASE 3: Learned cache (not used yet, reserved for Phase 5)
    vocabIds: string[]
    suffixes: string[]
    connectors: string[]
  }
}

export function GrammarFillBlank({
  exercises,
  conceptId,
  moduleId,
  lessonId,
  stepIndex,
  title,
  label,
  subtitle,
  points = 1,
  onComplete,
  onXpStart,
  learnedSoFar  // PHASE 5: NOW ACTIVE - Used to dynamically generate options
}: GrammarFillBlankProps) {
  const { user } = useAuth()
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
  
  // PHASE 5: Get ALL learned vocabulary for dynamic generation (not just current lesson)
  // CRITICAL FIX: Use learnedSoFar.vocabIds to get ALL learned vocab, not just current lesson vocab
  // This ensures words like "khoobam" from previous lessons are available as distractors
  const lessonVocabulary = useMemo(() => {
    if (learnedSoFar?.vocabIds && learnedSoFar.vocabIds.length > 0) {
      // Build vocabulary array from all learned vocab IDs
      const allLearnedVocab = learnedSoFar.vocabIds
        .map(id => VocabularyService.findVocabularyById(id))
        .filter((v): v is NonNullable<typeof v> => v !== undefined)
      
      // DEBUG LOG: Lesson vocabulary loaded
      console.log('📚 [GrammarFillBlank] Lesson Vocabulary Loaded:', {
        moduleId,
        lessonId,
        stepIndex,
        learnedVocabIds: learnedSoFar.vocabIds,
        loadedVocabCount: allLearnedVocab.length,
        loadedVocab: allLearnedVocab.map(v => ({
          id: v.id,
          finglish: v.finglish,
          semanticGroup: v.semanticGroup
        }))
      })
      
      return allLearnedVocab
    }
    
    console.log('⚠️ [GrammarFillBlank] No learnedSoFar vocabIds, returning empty array')
    return []
  }, [learnedSoFar, moduleId, lessonId, stepIndex])

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

  // PHASE 5: Get options for current blank - dynamically generate if learnedSoFar exists, else use curriculum
  const rawOptions: Array<{ id: string; text: string }> = useMemo(() => {
    // DEBUG LOG: Component state
    console.log('🔍 [GrammarFillBlank] Component State:', {
      moduleId,
      lessonId,
      stepIndex,
      exerciseIndex: currentExerciseIndex,
      activeBlankIndex,
      hasMultipleBlanks,
      blanks: blanks.map(b => ({
        index: b.index,
        type: b.type,
        correctAnswer: b.correctAnswer,
        expectedSemanticGroup: b.expectedSemanticGroup
      })),
      currentBlank: currentBlank ? {
        index: currentBlank.index,
        type: currentBlank.type,
        correctAnswer: currentBlank.correctAnswer,
        expectedSemanticGroup: currentBlank.expectedSemanticGroup
      } : null,
      isSuffixBased,
      isConnectorBased,
      isWordBased,
      learnedSoFar: learnedSoFar ? {
        vocabIds: learnedSoFar.vocabIds,
        vocabIdsCount: learnedSoFar.vocabIds?.length || 0,
        suffixes: learnedSoFar.suffixes,
        suffixesCount: learnedSoFar.suffixes?.length || 0,
        connectors: learnedSoFar.connectors,
        connectorsCount: learnedSoFar.connectors?.length || 0
      } : null,
      lessonVocabularyCount: lessonVocabulary.length,
      currentExercise: {
        sentence: currentExercise.sentence,
        translation: currentExercise.translation,
        correctAnswer: currentExercise.correctAnswer,
        expectedSemanticGroup: currentExercise.expectedSemanticGroup,
        suffixOptions: currentExercise.suffixOptions,
        wordOptions: currentExercise.wordOptions
      }
    })
    
    // PHASE 5: Dynamic generation when learnedSoFar exists
    if (learnedSoFar && lessonVocabulary.length > 0) {
      // Determine correct answer for current blank
      let correctAnswer: string = ''
      let blankType: 'suffix' | 'connector' | 'word' = 'word'
      let expectedSemanticGroup: string | undefined = undefined
      
      if (hasMultipleBlanks && currentBlank) {
        correctAnswer = currentBlank.correctAnswer
        blankType = currentBlank.type === 'connector' ? 'connector' : currentBlank.type === 'suffix' ? 'suffix' : 'word'
        expectedSemanticGroup = currentBlank.expectedSemanticGroup  // SEMANTIC FILTER: Read from blank
      } else if (isSuffixBased) {
        correctAnswer = currentExercise.correctAnswer || ''
        blankType = 'suffix'
      } else if (isConnectorBased) {
        correctAnswer = currentExercise.correctAnswer || ''
        blankType = 'connector'
      } else {
        correctAnswer = currentExercise.correctAnswer || ''
        blankType = 'word'
        expectedSemanticGroup = currentExercise.expectedSemanticGroup  // SEMANTIC FILTER: Read from exercise
      }
      
      // AUTO-SEMANTIC GROUP DETECTION: SIMPLIFIED - Only use if we have plenty of options
      // Disable auto-detection to prevent single-option banks - rely on manual curriculum tags only
      let finalSemanticGroup = expectedSemanticGroup
      // Removed auto-detection to prevent issues - curriculum must explicitly specify if needed
      
      // DEBUG LOG: Before generating options
      console.log('🎯 [GrammarFillBlank] Generating Options:', {
        blankType,
        correctAnswer,
        expectedSemanticGroup,
        finalSemanticGroup,
        lessonVocabularyCount: lessonVocabulary.length,
        learnedSoFarConfig: {
          vocabIds: learnedSoFar.vocabIds,
          suffixes: learnedSoFar.suffixes,
          connectors: learnedSoFar.connectors
        }
      })
      
      // Generate options dynamically using learnedSoFar + semantic filtering
      const dynamicOptions = generateGrammarOptions(
        blankType,
        correctAnswer,
        lessonVocabulary,
        undefined, // No reviewVocabulary (ignored per user rules)
        undefined, // No customDistractors (let generator pick from learned)
        {
          learnedSoFar: {
            vocabIds: learnedSoFar.vocabIds,
            suffixes: learnedSoFar.suffixes,
            connectors: learnedSoFar.connectors
          },
          expectedSemanticGroup: finalSemanticGroup  // SEMANTIC FILTER: Pass auto-detected or explicit semantic group
        }
      )
      
      // DEBUG LOG: After generating options (before shuffle)
      console.log('✅ [GrammarFillBlank] Options Generated (before shuffle):', {
        blankType,
        optionsCount: dynamicOptions.length,
        options: dynamicOptions
      })
      
      // WORD-BLANK SHUFFLE: Apply shuffle ONLY to word blanks (not suffix/connector)
      if (blankType === 'word') {
        const shuffledOptions = shuffle(dynamicOptions)
        console.log('🔀 [GrammarFillBlank] Options Shuffled (word blank):', {
          beforeShuffle: dynamicOptions,
          afterShuffle: shuffledOptions
        })
        return shuffledOptions
      }
      
      return dynamicOptions
    }
    
    // FALLBACK: Use curriculum-defined options (backward compatibility)
    console.log('📖 [GrammarFillBlank] Using Curriculum Fallback (no learnedSoFar or empty vocab):', {
      hasLearnedSoFar: !!learnedSoFar,
      lessonVocabularyCount: lessonVocabulary.length,
      isSuffixBased,
      isConnectorBased,
      isWordBased,
      curriculumSuffixOptions: currentExercise.suffixOptions,
      curriculumWordOptions: currentExercise.wordOptions,
      curriculumDistractors: currentExercise.distractors
    })
    
    if (isSuffixBased) {
      // Suffix blank: ONLY show suffix options
      const fallbackOptions = [
        ...(currentExercise.suffixOptions || []),
        ...(currentExercise.distractors?.filter(d => d.text.startsWith('-')) || [])
      ]
      console.log('📖 [GrammarFillBlank] Fallback Suffix Options:', fallbackOptions)
      return fallbackOptions
    } else if (isConnectorBased) {
      // Connector blank: ONLY show connector options (detected by ID prefix "conn-")
      const fallbackOptions = [
        ...(currentExercise.suffixOptions?.filter(opt => opt.id.startsWith('conn-')) || []),
        ...(currentExercise.wordOptions?.filter(opt => opt.id.startsWith('conn-')) || [])
      ]
      console.log('📖 [GrammarFillBlank] Fallback Connector Options:', fallbackOptions)
      return fallbackOptions
    } else {
      // Word blank: ONLY show vocabulary options (exclude connectors by ID prefix)
      const fallbackOptions = [
        ...(currentExercise.wordOptions?.filter(opt => !opt.id.startsWith('conn-')) || []),
        ...(currentExercise.distractors?.filter(d => !d.text.startsWith('-') && !d.id.startsWith('conn-')) || [])
      ]
      console.log('📖 [GrammarFillBlank] Fallback Word Options:', fallbackOptions)
      return fallbackOptions
    }
  }, [isSuffixBased, isConnectorBased, currentExercise, activeBlankIndex, learnedSoFar, lessonVocabulary, hasMultipleBlanks, currentBlank])

  // Shuffle options for randomization (like Quiz component)
  const allOptions = useMemo(() => {
    const shuffled = shuffle(rawOptions)
    console.log('🎲 [GrammarFillBlank] Final Options Displayed (post-shuffle):', {
      rawOptionsCount: rawOptions.length,
      shuffledOptionsCount: shuffled.length,
      shuffledOptions: shuffled
    })
    return shuffled
  }, [rawOptions])

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

  // Check if current blank is correct - FIXED: Always check the SPECIFIC blank, robust matching
  const checkCurrentBlank = (selectedText: string, blankIndexToCheck?: number) => {
    const blankIndex = blankIndexToCheck !== undefined ? blankIndexToCheck : (hasMultipleBlanks ? activeBlankIndex : 0)
    
    console.log('🔍 [checkCurrentBlank] Called:', {
      selectedText,
      blankIndexToCheck,
      computedBlankIndex: blankIndex,
      hasMultipleBlanks,
      blanksLength: blanks.length,
      blanks: blanks.map(b => ({
        index: b.index,
        type: b.type,
        correctAnswer: b.correctAnswer
      }))
    })
    
    if (hasMultipleBlanks) {
      const blankToCheck = blanks[blankIndex]
      console.log('🔍 [checkCurrentBlank] Multi-blank check:', {
        blankIndex,
        blankToCheck: blankToCheck ? {
          index: blankToCheck.index,
          type: blankToCheck.type,
          correctAnswer: blankToCheck.correctAnswer
        } : null,
        blankFound: !!blankToCheck
      })
      
      if (!blankToCheck) {
        console.error('❌ [checkCurrentBlank] Blank not found at index:', blankIndex)
        return false
      }
      
      // Normalize selected text (case-insensitive, trim)
      const normalizedSelected = selectedText.toLowerCase().trim()
      const normalizedCorrect = blankToCheck.correctAnswer.toLowerCase().trim()
      
      console.log('🔍 [checkCurrentBlank] Comparison:', {
        selectedText,
        normalizedSelected,
        correctAnswer: blankToCheck.correctAnswer,
        normalizedCorrect,
        directMatch: normalizedSelected === normalizedCorrect
      })
      
      // Direct match first
      if (normalizedSelected === normalizedCorrect) {
        console.log('✅ [checkCurrentBlank] Direct match found!')
        return true
      }
      
      // Also check if selectedText matches any vocab item that matches the correct answer
      const correctVocab = lessonVocabulary.find(v =>
        v.id.toLowerCase() === normalizedCorrect ||
        v.finglish?.toLowerCase() === normalizedCorrect
      )
      
      console.log('🔍 [checkCurrentBlank] Vocab lookup:', {
        normalizedCorrect,
        correctVocab: correctVocab ? {
          id: correctVocab.id,
          finglish: correctVocab.finglish
        } : null,
        vocabMatch: correctVocab ? (
          normalizedSelected === correctVocab.id.toLowerCase() ||
          normalizedSelected === correctVocab.finglish?.toLowerCase()
        ) : false
      })
      
      if (correctVocab) {
        // Check if selected text matches the correct vocab item's ID or finglish
        const vocabMatch = normalizedSelected === correctVocab.id.toLowerCase() ||
               normalizedSelected === correctVocab.finglish?.toLowerCase()
        if (vocabMatch) {
          console.log('✅ [checkCurrentBlank] Vocab match found!')
        }
        return vocabMatch
      }
      
      console.log('❌ [checkCurrentBlank] No match found')
      return false
    } else {
      // Single blank (backward compatibility)
      const normalizedSelected = selectedText.toLowerCase().trim()
      const normalizedCorrect = (currentExercise.correctAnswer || '').toLowerCase().trim()
      
      console.log('🔍 [checkCurrentBlank] Single blank check:', {
        selectedText,
        normalizedSelected,
        correctAnswer: currentExercise.correctAnswer,
        normalizedCorrect,
        match: normalizedSelected === normalizedCorrect
      })
      
      return normalizedSelected === normalizedCorrect
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
    
    // CRITICAL FIX: Determine which blank we're answering based on current activeBlankIndex
    const blankIndex = hasMultipleBlanks ? activeBlankIndex : 0
    const blankBeingAnswered = hasMultipleBlanks ? blanks[blankIndex] : null
    
    // DEBUG LOG: Before extracting text
    console.log('🎯 [GrammarFillBlank] handleSelectOption:', {
      optionId,
      selectedOption,
      blankIndex,
      activeBlankIndex,
      hasMultipleBlanks,
      blankBeingAnswered: blankBeingAnswered ? {
        index: blankBeingAnswered.index,
        type: blankBeingAnswered.type,
        correctAnswer: blankBeingAnswered.correctAnswer
      } : null,
      isSuffixBased,
      isConnectorBased,
      isWordBased
    })
    
    // Extract text based on blank type
    let selectedText: string
    if (blankBeingAnswered?.type === 'suffix' || isSuffixBased) {
      selectedText = selectedOption.text.replace(/^-/, '')  // Remove dash prefix
      console.log('✂️ [GrammarFillBlank] Suffix text extraction:', {
        originalText: selectedOption.text,
        extractedText: selectedText
      })
    } else {
      selectedText = selectedOption.text  // Use as-is for words/connectors
      console.log('📝 [GrammarFillBlank] Non-suffix text (as-is):', {
        selectedText
      })
    }
    
    // CRITICAL FIX: Check correctness for the SPECIFIC blank we're answering
    const isAnswerCorrect = checkCurrentBlank(selectedText, blankIndex) ?? false
    
    // DEBUG LOG: Correctness check result
    console.log('✅ [GrammarFillBlank] Correctness Check:', {
      selectedText,
      blankIndex,
      blankBeingAnswered: blankBeingAnswered ? {
        type: blankBeingAnswered.type,
        correctAnswer: blankBeingAnswered.correctAnswer
      } : null,
      isAnswerCorrect,
      checkDetails: hasMultipleBlanks && blankBeingAnswered ? {
        normalizedSelected: selectedText.toLowerCase().trim(),
        normalizedCorrect: blankBeingAnswered.correctAnswer.toLowerCase().trim(),
        directMatch: selectedText.toLowerCase().trim() === blankBeingAnswered.correctAnswer.toLowerCase().trim()
      } : null
    })
    
    // Store answer for current blank
    setBlankAnswers(prev => ({ ...prev, [blankIndex]: selectedText }))
    
    setIsCorrect(isAnswerCorrect)
    setShowFeedback(true)

    if (isAnswerCorrect) {
      playSuccessSound()
      
      // CRITICAL FIX: Update blankAnswers state FIRST, then check all blanks
      const updatedBlankAnswers = { ...blankAnswers, [blankIndex]: selectedText }
      
      // Check if all blanks are filled
      if (hasMultipleBlanks) {
        const allBlanksFilled = blanks.every(blank => {
          // Check if this blank has an answer (either just filled or already filled)
          return updatedBlankAnswers[blank.index] !== undefined
        })
        
        if (allBlanksFilled) {
          // CRITICAL FIX: Check if all are correct using normalized comparison
          const allCorrect = blanks.every(blank => {
            const answer = updatedBlankAnswers[blank.index]
            if (!answer) return false
            
            // Use the same normalization logic as checkCurrentBlank
            const normalizedAnswer = answer.toLowerCase().trim()
            const normalizedCorrect = blank.correctAnswer.toLowerCase().trim()
            
            // Direct match
            if (normalizedAnswer === normalizedCorrect) return true
            
            // Also check vocab item match
            const correctVocab = lessonVocabulary.find(v =>
              v.id.toLowerCase() === normalizedCorrect ||
              v.finglish?.toLowerCase() === normalizedCorrect
            )
            
            if (correctVocab) {
              return normalizedAnswer === correctVocab.id.toLowerCase() ||
                     normalizedAnswer === correctVocab.finglish?.toLowerCase()
            }
            
            return false
          })
          
          if (allCorrect) {
            // Track grammar attempt (fire-and-forget, non-blocking)
            if (user?.id && conceptId && moduleId && lessonId && stepIndex !== undefined) {
              const timeSpentMs = Date.now() - startTime.current
              
              // Create a step object for deriveStepUid
              const step: GrammarFillBlankStep = {
                type: 'grammar-fill-blank',
                points: points || 1,
                data: {
                  conceptId,
                  exercises,
                  label,
                  subtitle
                }
              }
              
              const stepUid = deriveStepUid(step, stepIndex, moduleId, lessonId)
              
              GrammarTrackingService.logGrammarAttempt({
                userId: user.id,
                conceptId,
                stepType: 'grammar-fill-blank',
                isCorrect: true,
                timeSpentMs,
                moduleId,
                lessonId,
                stepUid,
                contextData: {
                  stepIndex,
                  exerciseIndex: currentExerciseIndex,
                  blankType: blanks[activeBlankIndex]?.type,
                  totalBlanks: blanks.length
                }
              }).catch(err => {
                console.error('Failed to track grammar attempt:', err)
              })
            }
            
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
            // All blanks filled but some incorrect - find which blank(s) are wrong
            const incorrectBlanks = blanks.filter(blank => {
              const answer = updatedBlankAnswers[blank.index]
              if (!answer) return true
              
              const normalizedAnswer = answer.toLowerCase().trim()
              const normalizedCorrect = blank.correctAnswer.toLowerCase().trim()
              
              if (normalizedAnswer === normalizedCorrect) return false
              
              const correctVocab = lessonVocabulary.find(v =>
                v.id.toLowerCase() === normalizedCorrect ||
                v.finglish?.toLowerCase() === normalizedCorrect
              )
              
              if (correctVocab) {
                return normalizedAnswer !== correctVocab.id.toLowerCase() &&
                       normalizedAnswer !== correctVocab.finglish?.toLowerCase()
              }
              
              return true
            })
            
            // Track incorrect attempt for each wrong blank
            if (user?.id && conceptId && moduleId && lessonId && stepIndex !== undefined) {
              const timeSpentMs = Date.now() - startTime.current
              
              const step: GrammarFillBlankStep = {
                type: 'grammar-fill-blank',
                points: points || 1,
                data: {
                  conceptId,
                  exercises,
                  label,
                  subtitle
                }
              }
              
              const stepUid = deriveStepUid(step, stepIndex, moduleId, lessonId)
              
              // Track each incorrect blank separately
              incorrectBlanks.forEach(blank => {
                GrammarTrackingService.logGrammarAttempt({
                  userId: user.id,
                  conceptId,
                  stepType: 'grammar-fill-blank',
                  isCorrect: false,
                  timeSpentMs,
                  moduleId,
                  lessonId,
                  stepUid,
                  contextData: {
                    stepIndex,
                    exerciseIndex: currentExerciseIndex,
                    blankIndex: blank.index,
                    blankType: blank.type,
                    totalBlanks: blanks.length,
                    allBlanksFilled: true,
                    selectedAnswer: updatedBlankAnswers[blank.index],
                    correctAnswer: blank.correctAnswer
                  }
                }).catch(err => {
                  console.error('Failed to track grammar attempt:', err)
                })
              })
            }
            
            // All blanks filled but some incorrect - show error
            setTimeout(() => {
              setShowFeedback(false)
              setIsSubmitting(false)
            }, 1500)
          }
        } else {
          // Move to next blank (not all filled yet)
          if (activeBlankIndex < blanks.length - 1) {
            setTimeout(() => {
              setActiveBlankIndex(prev => prev + 1)
              setShowFeedback(false)
              setIsSubmitting(false)
            }, 1000)
          } else {
            // All blanks filled but logic didn't catch it - force recheck
            setIsSubmitting(false)
          }
        }
      } else {
        // Single blank - complete exercise
        // Track grammar attempt (fire-and-forget, non-blocking)
        if (user?.id && conceptId && moduleId && lessonId && stepIndex !== undefined) {
          const timeSpentMs = Date.now() - startTime.current
          
          // Create a step object for deriveStepUid
          const step: GrammarFillBlankStep = {
            type: 'grammar-fill-blank',
            points: points || 1,
            data: {
              conceptId,
              exercises,
              label,
              subtitle
            }
          }
          
          const stepUid = deriveStepUid(step, stepIndex, moduleId, lessonId)
          
          GrammarTrackingService.logGrammarAttempt({
            userId: user.id,
            conceptId,
            stepType: 'grammar-fill-blank',
            isCorrect: true,
            timeSpentMs,
            moduleId,
            lessonId,
            stepUid,
            contextData: {
              stepIndex,
              exerciseIndex: currentExerciseIndex,
              blankType: 'single',
              totalBlanks: 1
            }
          }).catch(err => {
            console.error('Failed to track grammar attempt:', err)
          })
        }
        
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
      // Show error feedback and allow retry - track incorrect attempt
      // CRITICAL FIX: Track the SPECIFIC blank that was answered incorrectly
      if (user?.id && conceptId && moduleId && lessonId && stepIndex !== undefined) {
        const timeSpentMs = Date.now() - startTime.current
        
        const step: GrammarFillBlankStep = {
          type: 'grammar-fill-blank',
          points: points || 1,
          data: {
            conceptId,
            exercises,
            label,
            subtitle
          }
        }
        
        const stepUid = deriveStepUid(step, stepIndex, moduleId, lessonId)
        
        // CRITICAL FIX: Use the blankIndex we just answered, not activeBlankIndex (which might have changed)
        const blankThatWasAnswered = hasMultipleBlanks ? blanks[blankIndex] : null
        
        GrammarTrackingService.logGrammarAttempt({
          userId: user.id,
          conceptId,
          stepType: 'grammar-fill-blank',
          isCorrect: false,
          timeSpentMs,
          moduleId,
          lessonId,
          stepUid,
          contextData: {
            stepIndex,
            exerciseIndex: currentExerciseIndex,
            blankIndex: blankIndex,  // Track which blank was answered
            blankType: blankThatWasAnswered?.type || (hasMultipleBlanks ? 'unknown' : 'single'),
            totalBlanks: hasMultipleBlanks ? blanks.length : 1,
            selectedAnswer: selectedText,  // Debug: what was selected
            correctAnswer: blankThatWasAnswered?.correctAnswer || currentExercise.correctAnswer || ''  // Debug: what was expected
          }
        }).catch(err => {
          console.error('Failed to track grammar attempt:', err)
        })
      }
      
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

  // Check if a specific blank is correct - FIXED: Use normalized comparison, accept optional answers map
  const isBlankCorrect = (blankIndex: number, answersMap?: Record<number, string>) => {
    const answers = answersMap || blankAnswers
    
    if (hasMultipleBlanks) {
      const blank = blanks[blankIndex]
      const answer = answers[blankIndex]
      if (!answer || !blank) return false
      
      // Normalize both for comparison
      const normalizedAnswer = answer.toLowerCase().trim()
      const normalizedCorrect = blank.correctAnswer.toLowerCase().trim()
      
      // Direct match
      if (normalizedAnswer === normalizedCorrect) return true
      
      // Also check vocab item match
      const correctVocab = lessonVocabulary.find(v =>
        v.id.toLowerCase() === normalizedCorrect ||
        v.finglish?.toLowerCase() === normalizedCorrect
      )
      
      if (correctVocab) {
        return normalizedAnswer === correctVocab.id.toLowerCase() ||
               normalizedAnswer === correctVocab.finglish?.toLowerCase()
      }
      
      return false
    } else {
      const answer = answers[0]
      const correctAnswer = currentExercise.correctAnswer || ''
      if (!answer) return false
      
      const normalizedAnswer = answer.toLowerCase().trim()
      const normalizedCorrect = correctAnswer.toLowerCase().trim()
      return normalizedAnswer === normalizedCorrect
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
                  animate={showFeedback && blankAnswers[index] && isBlankCorrect(index, blankAnswers) ? { scale: [1, 1.2, 1] } : {}}
                  className={`inline-block min-w-[80px] px-3 py-2 rounded-lg border-2 mx-1 ${
                    blankAnswers[index] && isBlankCorrect(index, blankAnswers)
                      ? 'bg-green-100 border-green-500 text-green-700'
                      : blankAnswers[index] && !isBlankCorrect(index, blankAnswers)
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
