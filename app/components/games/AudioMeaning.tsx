import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, RotateCcw } from "lucide-react"
import { XpAnimation } from "./XpAnimation"
import { AudioService } from "@/lib/services/audio-service"
import { VocabularyItem } from "@/lib/types"
import { playSuccessSound } from "./Flashcard"
import { motion } from "framer-motion"
import { WordBankService } from "@/lib/services/word-bank-service"
import { shuffle } from "@/lib/utils"

interface AudioMeaningProps {
  vocabularyId: string
  distractors: string[] // Other vocabulary IDs for wrong answers
  vocabularyBank: VocabularyItem[] // All available vocabulary for this lesson
  points?: number
  autoPlay?: boolean // Keep for backward compatibility but don't use
  onContinue: () => void
  onXpStart?: () => Promise<boolean> // Returns true if XP granted, false if already completed
  onVocabTrack?: (vocabularyId: string, wordText: string, isCorrect: boolean, timeSpentMs?: number) => void; // Track vocabulary performance
}

export function AudioMeaning({
  vocabularyId,
  distractors,
  vocabularyBank,
  points = 2,
  autoPlay = false, // Default to false now
  onContinue,
  onXpStart,
  onVocabTrack
}: AudioMeaningProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [showXp, setShowXp] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([])
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number>(0)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false) // Track if step was already completed (local state)
  const [hasTracked, setHasTracked] = useState(false) // Prevent duplicate tracking
  
  // Track if we've already shuffled for this vocabularyId (prevents double shuffle)
  const lastShuffledVocabId = useRef<string | null>(null)
  
  // Time tracking for analytics
  const startTime = useRef(Date.now())

  // Find the target vocabulary item
  const targetVocabulary = vocabularyBank.find(v => v.id === vocabularyId)
  
  // Fallback: if not found in bank, try to look it up from VocabularyService
  const targetVocabularyWithFallback = targetVocabulary || (() => {
    if (!vocabularyId) return null
    try {
      const { VocabularyService } = require('@/lib/services/vocabulary-service')
      return VocabularyService.findVocabularyById(vocabularyId)
    } catch {
      return null
    }
  })()
  
  // Define playTargetAudio callback before useEffects that use it
  const playTargetAudio = useCallback(async () => {
    if (targetVocabularyWithFallback) {
      setIsPlayingAudio(true)
      const success = await AudioService.playVocabularyAudio(targetVocabularyWithFallback.id)
      setIsPlayingAudio(false)
      if (success) {
        setHasPlayedAudio(true)
      }
    }
  }, [targetVocabularyWithFallback])
  
  // Initialize shuffled options - ONLY shuffle once per question (when vocabularyId changes)
  useEffect(() => {
    // Only shuffle if this is a NEW question (vocabularyId changed)
    if (vocabularyId === lastShuffledVocabId.current) {
      return // Already shuffled for this question, don't shuffle again
    }
    
    lastShuffledVocabId.current = vocabularyId
    
    // Remove duplicates from distractors first
    const uniqueDistractors = Array.from(new Set(distractors))
    const allOptions = [vocabularyId, ...uniqueDistractors]
    
    // Use Fisher-Yates shuffle for better randomization
    const shuffled = [...allOptions]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    
    setShuffledOptions(shuffled)
    setCorrectAnswerIndex(shuffled.indexOf(vocabularyId))
  }, [vocabularyId]) // ONLY depend on vocabularyId - ignore distractors changes
  
  // Reset component state when vocabularyId changes (for review mode auto-advance)
  useEffect(() => {
    setSelectedAnswer(null)
    setShowResult(false)
    setShowXp(false)
    setIsCorrect(false)
    setHasPlayedAudio(false)
    setIsPlayingAudio(false)
    setIsAlreadyCompleted(false)
    setHasTracked(false) // Reset tracking flag when vocabulary changes
    startTime.current = Date.now()
  }, [vocabularyId])
  
  // Auto-play audio when vocabularyId changes (for review mode)
  useEffect(() => {
    if (autoPlay && targetVocabularyWithFallback && !hasPlayedAudio) {
      // Small delay to ensure audio service is ready
      const timer = setTimeout(() => {
        playTargetAudio()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [vocabularyId, autoPlay, targetVocabularyWithFallback, hasPlayedAudio, playTargetAudio])
  
  // Get English meanings for the options - deduplicated and memoized
  // CRITICAL: Always ensure 4 options (1 correct + 3 distractors), replace duplicates
  const answerOptionsWithIndices = useMemo(() => {
    const optionsMap = new Map<string, { text: string; originalIndex: number; vocabId: string }>()
    const usedIndices = new Set<number>()
    const duplicatesToReplace: Array<{ originalIndex: number; vocabId: string }> = []
    
    // First pass: collect unique options and identify duplicates
    shuffledOptions.forEach((id, originalIndex) => {
      let vocab = vocabularyBank.find(v => v.id === id)
      
      // If not found in bank, try looking it up from full curriculum (defensive fallback)
      if (!vocab) {
        try {
          const { VocabularyService } = require('@/lib/services/vocabulary-service')
          vocab = VocabularyService.findVocabularyById(id)
        } catch {
          // Fallback failed, skip this option
        }
      }
      
      if (!vocab) {
        console.warn(`Vocabulary not found for ID: ${id}`)
        return // Skip this option
      }
      
      // Normalize English text
      const normalizedText = WordBankService.normalizeVocabEnglish(vocab.en)
      
      // Only add if we haven't seen this normalized text before
      if (!optionsMap.has(normalizedText)) {
        optionsMap.set(normalizedText, { text: normalizedText, originalIndex, vocabId: id })
        usedIndices.add(originalIndex)
      } else {
        // Duplicate detected - mark for replacement
        duplicatesToReplace.push({ originalIndex, vocabId: id })
      }
    })
    
    // Replace duplicates with new distractors from vocabularyBank
    // We need exactly 4 options total (1 correct + 3 distractors)
    const targetCount = 4
    const currentCount = optionsMap.size
    
    if (currentCount < targetCount && vocabularyBank.length > currentCount) {
      // Find replacement distractors (exclude current options and correct answer)
      const usedVocabIds = new Set(Array.from(optionsMap.values()).map(opt => opt.vocabId))
      usedVocabIds.add(vocabularyId) // Also exclude correct answer
      
      const availableVocab = vocabularyBank.filter(v => 
        !usedVocabIds.has(v.id) && v.id !== vocabularyId
      )
      
      // Replace duplicates or add missing distractors
      let replacementsNeeded = targetCount - currentCount
      const shuffledAvailable = shuffle(availableVocab)
      
      for (const replacement of shuffledAvailable) {
        if (replacementsNeeded <= 0) break
        
        const normalizedText = WordBankService.normalizeVocabEnglish(replacement.en)
        
        // Only add if it's still unique
        if (!optionsMap.has(normalizedText)) {
          // Use the original index from first duplicate, or create new index
          const replaceIndex = duplicatesToReplace.length > 0 
            ? duplicatesToReplace.shift()!.originalIndex 
            : shuffledOptions.length + optionsMap.size
            
          optionsMap.set(normalizedText, { 
            text: normalizedText, 
            originalIndex: replaceIndex, 
            vocabId: replacement.id 
          })
          usedIndices.add(replaceIndex)
          replacementsNeeded--
        }
      }
    }
    
    // Update correctAnswerIndex based on deduplicated options
    const correctOption = Array.from(optionsMap.values()).find(opt => opt.vocabId === vocabularyId)
    if (correctOption) {
      setCorrectAnswerIndex(correctOption.originalIndex)
    }
    
    return Array.from(optionsMap.values())
  }, [shuffledOptions, vocabularyId])
  // Note: vocabularyBank removed from deps to prevent re-shuffle during transitions

  const handleAnswerSelect = async (answerIndex: number) => {
    // Block re-clicks while feedback animates
    if (showResult) return;

    setSelectedAnswer(answerIndex);
    setShowResult(true);

    const correct = answerIndex === correctAnswerIndex;
    setIsCorrect(correct);

    // Calculate time spent
    const timeSpentMs = Date.now() - startTime.current

    // Track vocabulary performance to Supabase
    // In review mode: track every attempt (wrong or correct)
    // hasTracked prevents duplicate tracking within same answer selection
    if (onVocabTrack && targetVocabularyWithFallback && !hasTracked) {
      setHasTracked(true) // Mark as tracked for this attempt
      onVocabTrack(vocabularyId, targetVocabularyWithFallback.en, correct, timeSpentMs);
    }

    if (correct) {
      // ✅ Correct flow – green border, play sound, XP animation, then IMMEDIATELY auto-continue
      playSuccessSound();
      
      // Award XP and check if step was already completed
      if (onXpStart) {
        const wasGranted = await onXpStart(); // Await the Promise to get result
        setIsAlreadyCompleted(!wasGranted); // If not granted, it was already completed
      }

      // Show XP animation briefly, then auto-continue immediately
      setTimeout(() => setShowXp(true), 100); // let border show
      // XP animation will call onComplete which calls onContinue
    } else {
      // ❌ Incorrect flow – flash red, reset state to allow retry (don't advance)
      setTimeout(() => {
        setShowResult(false);
        setSelectedAnswer(null);
        setIsCorrect(false);
        // Reset hasTracked so user can retry and track again
        setHasTracked(false);
        // Reset start time for accurate retry timing
        startTime.current = Date.now();
      }, 600); // 0.6s red feedback before reset
    }
  }

  const handleXpComplete = () => {
    // Immediately advance to next question (no delay)
    onContinue()
  }

  if (!targetVocabularyWithFallback) {
    return (
      <div className="text-center p-6">
        <p className="text-red-500">Loading vocabulary...</p>
      </div>
    )
  }

  // Don't render until options are shuffled
  if (shuffledOptions.length === 0) {
    return null
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-primary/5 via-primary/2 to-white">
      {/* XP Animation - self-positioning */}
      {showResult && isCorrect && (
        <XpAnimation
          amount={points}
          show={showXp}
          isAlreadyCompleted={isAlreadyCompleted}
          onStart={undefined}
          onComplete={handleXpComplete}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-8 overflow-y-auto">
        <div className="w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl flex flex-col">
          {/* Header */}
          <div className="text-center mb-2 sm:mb-3">
            <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold mb-1 text-primary">
          LISTENING CHALLENGE
        </h2>
            <p className="text-sm xs:text-base text-muted-foreground mb-3">
          Listen to the Persian word and select its English meaning
        </p>
      </div>

          {/* Audio Player Section */}
          <div className="bg-white rounded-xl p-3 sm:p-4 mb-3 text-center border-2 border-primary/20 shadow-sm">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              {/* Audio icon / waveform indicator - replace icon when playing */}
              <div className="flex items-center justify-center">
                {isPlayingAudio ? (
                  <div className="flex items-end gap-0.5 h-6 sm:h-8">
                <motion.div
                      className="w-1 bg-primary rounded-full"
                  animate={{ height: ['8px', '20px', '8px'] }}
                  transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                      className="w-1 bg-primary rounded-full"
                  animate={{ height: ['12px', '24px', '12px'] }}
                  transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
                />
                <motion.div
                      className="w-1 bg-primary rounded-full"
                  animate={{ height: ['8px', '20px', '8px'] }}
                  transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                />
              </div>
                ) : (
                  <Volume2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary/60" />
            )}
          </div>
          
              <p className="text-base sm:text-lg font-medium text-gray-900">
            {isPlayingAudio ? "Listening..." : hasPlayedAudio ? "Ready to answer?" : "Click to hear the word..."}
          </p>
        </div>
        
        <Button
          onClick={playTargetAudio}
          variant="outline"
          size="lg"
              className="gap-2 border-2 border-primary text-primary hover:bg-primary hover:text-white"
        >
          <Volume2 className="h-5 w-5" />
          {hasPlayedAudio ? 'Play Again' : 'Play Audio'}
        </Button>
      </div>

      {/* Answer Options - Card Grid (2x2) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-2">
        {answerOptionsWithIndices.map((optionData, displayIndex) => {
          const actualIndex = optionData.originalIndex
          
              // Card styling
              let cardStyle = "bg-white rounded-lg p-6 sm:p-8 border-2 transition-all duration-200 cursor-pointer shadow-sm min-h-[140px] sm:min-h-[160px] flex items-center justify-center ";

          if (showResult) {
            if (isCorrect && actualIndex === selectedAnswer) {
              // Correct selection - green border
                  cardStyle += "border-green-500 bg-green-50 "
            } else if (!isCorrect && actualIndex === selectedAnswer) {
              // Incorrect selection - red border
                  cardStyle += "border-red-500 bg-red-50 "
            } else {
              // Other options stay neutral
                  cardStyle += "border-gray-200 bg-gray-50/50 opacity-50 "
            }
          } else {
            if (selectedAnswer === actualIndex) {
                  cardStyle += "border-primary bg-primary/5 "
            } else {
                  cardStyle += "border-gray-200 hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98] "
            }
          }

          const shakeKeyframes = { x: [0, -10, 10, -10, 10, 0] };
          const isShaking = showResult && !isCorrect && actualIndex === selectedAnswer;

          return (
            <motion.button
              key={`${optionData.text}-${optionData.originalIndex}`}
              type="button"
              onClick={() => handleAnswerSelect(actualIndex)}
              disabled={showResult}
              initial={false}
              animate={isShaking ? shakeKeyframes : {}}
              transition={isShaking ? { duration: 0.6, ease: "easeInOut" } : {}}
              className={cardStyle}
            >
                  <span className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 block text-center leading-tight">
                {optionData.text}
              </span>
            </motion.button>
          );
        })}
          </div>
        </div>
      </div>
    </div>
  )
} 