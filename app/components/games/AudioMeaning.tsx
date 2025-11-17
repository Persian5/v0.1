import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, RotateCcw } from "lucide-react"
import { XpAnimation } from "./XpAnimation"
import { AudioService } from "@/lib/services/audio-service"
import { VocabularyItem, LexemeRef, ResolvedLexeme } from "@/lib/types"
import { playSuccessSound } from "./Flashcard"
import { motion } from "framer-motion"
import { WordBankService } from "@/lib/services/word-bank-service"
import { shuffle } from "@/lib/utils"
import { FLAGS } from "@/lib/flags"
import { type LearnedSoFar } from "@/lib/utils/curriculum-lexicon"
import { GrammarService } from "@/lib/services/grammar-service"

interface AudioMeaningProps {
  vocabularyId: string
  lexemeRef?: LexemeRef // NEW: Optional LexemeRef for grammar forms (takes precedence over vocabularyId)
  distractors: string[] // Other vocabulary IDs for wrong answers
  vocabularyBank: VocabularyItem[] // All available vocabulary for this lesson
  points?: number
  autoPlay?: boolean // Keep for backward compatibility but don't use
  learnedSoFar?: LearnedSoFar // PHASE 5: Learned vocabulary state for unified distractor generation
  moduleId?: string // For tiered fallback in WordBankService
  lessonId?: string // For tiered fallback in WordBankService
  onContinue: () => void
  onXpStart?: () => Promise<boolean> // Returns true if XP granted, false if already completed
  onVocabTrack?: (vocabularyId: string, wordText: string, isCorrect: boolean, timeSpentMs?: number) => void; // Track vocabulary performance
}

export function AudioMeaning({
  vocabularyId,
  lexemeRef, // NEW: Optional LexemeRef for grammar forms
  distractors,
  vocabularyBank,
  points = 2,
  autoPlay = false, // Default to false now
  learnedSoFar, // PHASE 5: Learned vocabulary state
  moduleId, // For tiered fallback
  lessonId, // For tiered fallback
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
  
  // Track if we've already shuffled for this question (prevents double shuffle)
  const lastShuffledKey = useRef<string | null>(null)
  
  // Time tracking for analytics
  const startTime = useRef(Date.now())

  // CRITICAL: Resolve LexemeRef if provided, otherwise use vocabularyId
  const resolvedLexeme: ResolvedLexeme | null = useMemo(() => {
    if (lexemeRef) {
      try {
        return GrammarService.resolve(lexemeRef);
      } catch (error) {
        console.error('[AudioMeaning] Failed to resolve lexemeRef:', error);
        return null;
      }
    }
    
    // Fallback to vocabularyId lookup
    const vocab = vocabularyBank.find(v => v.id === vocabularyId) || (() => {
      try {
        const { VocabularyService } = require('@/lib/services/vocabulary-service')
        return VocabularyService.findVocabularyById(vocabularyId)
      } catch {
        return null
      }
    })();
    
    if (!vocab) return null;
    
    // Convert VocabularyItem to ResolvedLexeme format
    return {
      id: vocab.id,
      baseId: vocab.id,
      en: vocab.en,
      fa: vocab.fa,
      finglish: vocab.finglish,
      phonetic: vocab.phonetic,
      lessonId: vocab.lessonId,
      semanticGroup: vocab.semanticGroup,
      isGrammarForm: false
    };
  }, [lexemeRef, vocabularyId, vocabularyBank]);

  // Use resolved lexeme for display and audio
  const targetVocabularyWithFallback = resolvedLexeme ? {
    id: resolvedLexeme.id,
    en: resolvedLexeme.en,
    fa: resolvedLexeme.fa,
    finglish: resolvedLexeme.finglish,
    phonetic: resolvedLexeme.phonetic,
    lessonId: resolvedLexeme.lessonId,
    semanticGroup: resolvedLexeme.semanticGroup
  } as VocabularyItem : null;
  
  // Define playTargetAudio callback - uses playLexeme for grammar forms
  const playTargetAudio = useCallback(async () => {
    if (resolvedLexeme) {
      setIsPlayingAudio(true)
      const success = await AudioService.playLexeme(resolvedLexeme)
      setIsPlayingAudio(false)
      if (success) {
        setHasPlayedAudio(true)
      }
    }
  }, [resolvedLexeme])
  
  // Initialize shuffled options - ONLY shuffle once per question (when resolved lexeme changes)
  useEffect(() => {
    if (!resolvedLexeme) return;
    
    // Use resolved lexeme ID as unique key for shuffle tracking
    const shuffleKey = resolvedLexeme.id;
    if (shuffleKey === lastShuffledKey.current) {
      return // Already shuffled for this question, don't shuffle again
    }
    
    lastShuffledKey.current = shuffleKey
    
    // PHASE 5: Use unified WordBankService when flag is ON
    if (FLAGS.USE_LEARNED_VOCAB_IN_AUDIO_MEANING) {
      // PHASE 5: Debug logging
      if (FLAGS.LOG_WORDBANK) {
        console.log(
          "%c[AUDIO MEANING - UNIFIED WORDBANK]",
          "color: #FF9800; font-weight: bold;",
          {
            stepType: 'audio-meaning',
            resolvedLexemeId: resolvedLexeme.id,
            resolvedLexemeEn: resolvedLexeme.en,
            isGrammarForm: resolvedLexeme.isGrammarForm,
            learnedVocabIds: learnedSoFar?.vocabIds || [],
            learnedVocabCount: learnedSoFar?.vocabIds?.length || 0,
            vocabularyBankSize: vocabularyBank.length,
            usingUnifiedWordBank: true,
          }
        );
      }
      
      // Generate options using WordBankService (semantic distractors)
      // Use resolved lexeme's English translation as correct answer
      const correctAnswerText = WordBankService.normalizeVocabEnglish(resolvedLexeme.en);
      
      const wordBankResult = WordBankService.generateWordBank({
        expectedTranslation: resolvedLexeme.en, // Use resolved English translation
        vocabularyBank,
        sequenceIds: [resolvedLexeme.id], // Use resolved lexeme ID
        maxSize: 4, // 1 correct + 3 distractors
        distractorStrategy: 'semantic',
        learnedVocabIds: FLAGS.USE_LEARNED_VOCAB_IN_WORDBANK && learnedSoFar
          ? learnedSoFar.vocabIds
          : undefined,
        moduleId, // For tiered fallback
        lessonId, // For tiered fallback
      });
      
      // PATCH: Extract correct answer and distractors from WordBankService
      const { correctWords, distractors: distractorWords } = wordBankResult;
      
      // PATCH: Use first correct word as the correct option (should match resolved lexeme's English)
      const correctOption = correctWords[0] || correctAnswerText;
      
      // PATCH: Build options array by shuffling correct + distractors, limit to 4
      const options = shuffle([correctOption, ...distractorWords]).slice(0, 4);
      
      // PATCH: Ensure correct answer is always present
      if (!options.includes(correctOption)) {
        options[0] = correctOption; // Force correct answer into first slot if missing
      }
      
      setShuffledOptions(options);
      setCorrectAnswerIndex(options.indexOf(correctOption));
    } else {
      // OLD BEHAVIOR: Manual distractor handling
      // Remove duplicates from distractors first
      const uniqueDistractors = Array.from(new Set(distractors))
      const allOptions = [resolvedLexeme.id, ...uniqueDistractors]
      
      // Use Fisher-Yates shuffle for better randomization
      const shuffled = [...allOptions]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      
      setShuffledOptions(shuffled)
      setCorrectAnswerIndex(shuffled.indexOf(resolvedLexeme.id))
    }
  }, [resolvedLexeme, learnedSoFar, vocabularyBank, distractors]) // Use resolvedLexeme instead of vocabularyId
  
  // Reset component state when resolved lexeme changes (for review mode auto-advance)
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
  }, [resolvedLexeme?.id]) // Use resolved lexeme ID
  
  // Auto-play audio when resolved lexeme changes (for review mode)
  useEffect(() => {
    if (autoPlay && resolvedLexeme && !hasPlayedAudio) {
      // Small delay to ensure audio service is ready
      const timer = setTimeout(() => {
        playTargetAudio()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [resolvedLexeme?.id, autoPlay, resolvedLexeme, hasPlayedAudio, playTargetAudio])
  
  // Get English meanings for the options - deduplicated and memoized
  // CRITICAL: Always ensure 4 options (1 correct + 3 distractors), replace duplicates
  const answerOptionsWithIndices = useMemo(() => {
    // PHASE 5: When using unified WordBankService, shuffledOptions contains English text strings
    // OLD: When using manual distractors, shuffledOptions contains vocabulary IDs
    
    if (FLAGS.USE_LEARNED_VOCAB_IN_AUDIO_MEANING) {
      // NEW BEHAVIOR: shuffledOptions are English text strings from WordBankService
      // Simply map them to display format
      if (!resolvedLexeme) return [];
      return shuffledOptions.map((text, index) => ({
        text,
        originalIndex: index,
        vocabId: resolvedLexeme.id // Use resolved lexeme ID for tracking
      }));
    }
    
    // OLD BEHAVIOR: Manual deduplication and replacement logic
    const optionsMap = new Map<string, { text: string; originalIndex: number; vocabId: string }>()
    const usedIndices = new Set<number>()
    const duplicatesToReplace: Array<{ originalIndex: number; vocabId: string }> = []
    
    if (!resolvedLexeme) return [];
    
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
      usedVocabIds.add(resolvedLexeme.id) // Also exclude correct answer
      
      const availableVocab = vocabularyBank.filter(v => 
        !usedVocabIds.has(v.id) && v.id !== resolvedLexeme.id
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
    const correctOption = Array.from(optionsMap.values()).find(opt => opt.vocabId === resolvedLexeme.id)
    if (correctOption) {
      setCorrectAnswerIndex(correctOption.originalIndex)
    }
    
    const optionItems = Array.from(optionsMap.values());
    
    if (FLAGS.LOG_DISTRACTORS) {
      console.log(
        "%c[AUDIO MEANING DISTRACTORS]",
        "color: #FF9800; font-weight: bold;",
        {
          resolvedLexemeId: resolvedLexeme.id,
          resolvedLexemeEn: resolvedLexeme.en,
          correct: resolvedLexeme.en,
          distractors: optionItems
            .filter(opt => opt.vocabId !== resolvedLexeme.id)
            .map(opt => {
              const vocab = vocabularyBank.find(v => v.id === opt.vocabId);
              return vocab?.en || opt.text;
            }),
        }
      );
    }
    
    return optionItems;
  }, [shuffledOptions, resolvedLexeme, vocabularyBank])
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
    // Use baseId for tracking (e.g., "bad" not "badam") to track base vocab performance
    if (onVocabTrack && resolvedLexeme && !hasTracked) {
      setHasTracked(true) // Mark as tracked for this attempt
      onVocabTrack(resolvedLexeme.baseId, resolvedLexeme.en, correct, timeSpentMs);
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
    <div className="w-full h-full flex flex-col">
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