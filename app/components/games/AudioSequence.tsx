import { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, RotateCcw } from "lucide-react"
import { XpAnimation } from "./XpAnimation"
import { AudioService } from "@/lib/services/audio-service"
import { VocabularyItem, LexemeRef, ResolvedLexeme } from "@/lib/types"
import { playSuccessSound } from "./Flashcard"
import { motion } from "framer-motion"
import { WordBankService } from "@/lib/services/word-bank-service"
import { FLAGS } from "@/lib/flags"
import { type LearnedSoFar } from "@/lib/utils/curriculum-lexicon"
import { GrammarService } from "@/lib/services/grammar-service"

interface AudioSequenceProps {
  sequence: string[] // Array of vocabulary IDs in correct order (backward compat, legacy)
  lexemeSequence?: LexemeRef[] // NEW: Optional LexemeRef[] for grammar forms (takes precedence over sequence)
  vocabularyBank: VocabularyItem[] // All available vocabulary for this lesson
  points?: number
  autoPlay?: boolean
  expectedTranslation?: string // Custom English translation override for phrases
  targetWordCount?: number // Number of English words expected (overrides sequence.length)
  maxWordBankSize?: number // Maximum number of options in word bank (prevents crowding)
  learnedSoFar?: LearnedSoFar // PHASE 4: Learned vocabulary state for filtering word bank
  moduleId?: string // For tiered fallback in WordBankService
  lessonId?: string // For tiered fallback in WordBankService
  onContinue: () => void
  onXpStart?: () => Promise<boolean> // Returns true if XP granted, false if already completed
  onVocabTrack?: (vocabularyId: string, wordText: string, isCorrect: boolean, timeSpentMs?: number) => void; // Track vocabulary performance
}

export function AudioSequence({
  sequence,
  lexemeSequence, // NEW: Optional LexemeRef[] for grammar forms
  vocabularyBank,
  points = 3,
  autoPlay = false,
  expectedTranslation, // Add support for custom translation
  targetWordCount, // Add support for custom word count
  maxWordBankSize = 12, // Default max 12 options for better variety while manageable
  learnedSoFar, // PHASE 4: Learned vocabulary state
  moduleId, // For tiered fallback
  lessonId, // For tiered fallback
  onContinue,
  onXpStart,
  onVocabTrack
}: AudioSequenceProps) {
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [userOrder, setUserOrder] = useState<string[]>([])
  const [showResult, setShowResult] = useState(false)
  const [showXp, setShowXp] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showIncorrect, setShowIncorrect] = useState(false)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false) // Track if step was already completed (local state)
  const [isProcessingXp, setIsProcessingXp] = useState(false) // Guard against concurrent XP calls

  // Time tracking for analytics
  const startTime = useRef(Date.now())

  // CRITICAL: Resolve LexemeRef[] if provided, otherwise use sequence
  const resolvedLexemes: ResolvedLexeme[] = useMemo(() => {
    if (lexemeSequence && lexemeSequence.length > 0) {
      return lexemeSequence.map(ref => {
        try {
          return GrammarService.resolve(ref);
        } catch (error) {
          console.error('[AudioSequence] Failed to resolve lexemeRef:', ref, error);
          // Fallback: try to treat as string vocab ID
          const vocab = vocabularyBank.find(v => v.id === (typeof ref === 'string' ? ref : ref.baseId));
          if (vocab) {
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
          }
          throw error;
        }
      });
    }
    
    // Fallback to sequence (backward compat)
    return sequence.map(id => {
      const vocab = vocabularyBank.find(v => v.id === id) || (() => {
        try {
          const { VocabularyService } = require('@/lib/services/vocabulary-service')
          return VocabularyService.findVocabularyById(id)
        } catch {
          return null
        }
      })();
      
      if (!vocab) {
        console.warn(`[AudioSequence] Vocabulary not found for ID: ${id}`);
        // Return placeholder
        return {
          id,
          baseId: id,
          en: id,
          fa: '',
          finglish: id,
          phonetic: '',
          lessonId: undefined,
          semanticGroup: undefined,
          isGrammarForm: false
        };
      }
      
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
    });
  }, [lexemeSequence, sequence, vocabularyBank]);

  // Extract sequence IDs from resolved lexemes
  const resolvedSequenceIds = useMemo(() => resolvedLexemes.map(l => l.id), [resolvedLexemes]);

  // Calculate expected semantic unit count (phrases count as 1, words count as 1)
  const expectedWordCount = targetWordCount || WordBankService.getSemanticUnits({
    expectedTranslation,
    vocabularyBank,
    sequenceIds: expectedTranslation ? undefined : resolvedSequenceIds
  });

  // CRITICAL FIX: Create stable signatures for useMemo dependencies to prevent infinite recalculation
  // learnedSoFar is a new object reference on every render, so we need to extract stable values
  const learnedVocabIdsSignature = useMemo(() => 
    learnedSoFar?.vocabIds?.join(',') || '', 
    [learnedSoFar?.vocabIds]
  );
  const vocabularyBankSignature = useMemo(() => 
    vocabularyBank.map(v => v.id).join(','), 
    [vocabularyBank]
  );
  const resolvedSequenceIdsSignature = useMemo(() => 
    resolvedSequenceIds.join(','), 
    [resolvedSequenceIds]
  );

  // WORD BANK: Use WordBankService for unified, consistent generation
  // Create mapping from wordText → vocabularyId[] and unique keys for display
  // CRITICAL: Use stable signatures to prevent reshuffling on re-renders
  // Only recalculate when actual content changes (resolvedSequenceIds, expectedTranslation)
  const wordBankData = useMemo<{
    wordBankItems: string[]; // Shuffled wordText values for display (from allOptions)
    displayKeyToVocabId: Map<string, string>; // Map display key → vocabularyId
    displayKeyToWordText: Map<string, string>; // Map display key → wordText
    wordTextToDisplayKey: Map<string, string>; // NEW: Map wordText → stable displayKey (for userOrder lookup)
  }>(() => {
    // PHASE 4: Sanity logging before calling generateWordBank
    if (FLAGS.LOG_WORDBANK) {
      const learnedIds = learnedVocabIdsSignature ? learnedVocabIdsSignature.split(',').filter(id => id.length > 0) : [];
      console.log(
        "%c[AUDIO SEQUENCE - PRE WORDBANK]",
        "color: #00BCD4; font-weight: bold;",
        {
          stepType: 'audio-sequence',
          learnedVocabIds: learnedIds,
          learnedVocabCount: learnedIds.length,
          vocabularyBankSize: vocabularyBank.length,
        }
      );
    }
    
    // Generate word bank using WordBankService
    // Use resolved sequence IDs (from resolved lexemes)
    const wordBankResult = WordBankService.generateWordBank({
      expectedTranslation,
      vocabularyBank,
      sequenceIds: expectedTranslation ? undefined : resolvedSequenceIds,
      maxSize: maxWordBankSize,
      distractorStrategy: 'semantic',
      // PHASE 4: Pass learned vocab IDs if feature flag is enabled
      // Use stable vocabIds from learnedSoFar (extracted via signature)
      learnedVocabIds: FLAGS.USE_LEARNED_VOCAB_IN_WORDBANK && learnedVocabIdsSignature
        ? learnedVocabIdsSignature.split(',').filter(id => id.length > 0)
        : undefined,
      moduleId, // For tiered fallback
      lessonId, // For tiered fallback
    })

    // Build mappings for vocabulary ID lookup and duplicate handling
    // Use shuffled allOptions for display order, but map to WordBankItems for metadata
    const displayKeyToVocabId = new Map<string, string>()
    const displayKeyToWordText = new Map<string, string>()
    const wordTextToDisplayKey = new Map<string, string>() // NEW: Stable mapping wordText → displayKey

    // Create a map from wordText (normalized) to WordBankItem[] for lookup
    const wordTextToItems = new Map<string, typeof wordBankResult.wordBankItems>()
    wordBankResult.wordBankItems.forEach((item) => {
      const normalizedKey = item.wordText.toLowerCase()
      if (!wordTextToItems.has(normalizedKey)) {
        wordTextToItems.set(normalizedKey, [])
      }
      wordTextToItems.get(normalizedKey)!.push(item)
    })

    // Process shuffled allOptions to create display keys in display order
    // Track how many times we've seen each wordText to handle duplicates
    // CRITICAL: Use stable displayKeys based on wordText + occurrence, NOT array index
    const wordTextCounts = new Map<string, number>()
    wordBankResult.allOptions.forEach((wordText, displayIndex) => {
      const normalizedKey = wordText.toLowerCase()
      const count = wordTextCounts.get(normalizedKey) || 0
      wordTextCounts.set(normalizedKey, count + 1)

      // CRITICAL FIX: Use stable displayKey based on wordText + occurrence count, NOT array index
      // This ensures displayKeys don't change when array reshuffles
      const displayKey = `${wordText}-${count}` // Use count (occurrence) instead of displayIndex

      // Find matching WordBankItem for this wordText occurrence
      const matchingItems = wordTextToItems.get(normalizedKey) || []
      const itemIndex = Math.min(count, matchingItems.length - 1)
      const matchingItem = matchingItems[itemIndex]

      // Map display key to vocabularyId and wordText
      if (matchingItem?.vocabularyId) {
        displayKeyToVocabId.set(displayKey, matchingItem.vocabularyId)
      }
      displayKeyToWordText.set(displayKey, wordText)
      
      // NEW: Create stable mapping wordText → displayKey (first occurrence only)
      if (!wordTextToDisplayKey.has(wordText)) {
        wordTextToDisplayKey.set(wordText, displayKey)
      }
    })
      
      return {
      wordBankItems: wordBankResult.allOptions,
      displayKeyToVocabId,
      displayKeyToWordText,
      wordTextToDisplayKey // NEW: Add stable mapping
    }
  }, [expectedTranslation, vocabularyBankSignature, resolvedSequenceIdsSignature, maxWordBankSize, learnedVocabIdsSignature, moduleId, lessonId])

  // Dynamic vocabulary lookup with WordBankService support
  const getVocabularyById = (id: string) => {
    // Check if this is a display key (from WordBankService)
    if (wordBankData.displayKeyToWordText.has(id)) {
      const wordText = wordBankData.displayKeyToWordText.get(id)!
      
      // ✅ FIX: Always return the DISPLAY TEXT that user clicked, not vocab lookup
      // This prevents "I" from switching to "Me" after submission
      return {
        id: id,
        en: wordText, // Use what was clicked, not vocab.en
        fa: '',
        finglish: wordText,
        phonetic: '',
        lessonId: 'display'
      } as VocabularyItem
    }
    
    // NEW: Fallback - if id is a wordText, look it up via wordTextToDisplayKey
    // This handles cases where displayKey changed but userOrder still has old key
    if (wordBankData.wordTextToDisplayKey.has(id)) {
      const displayKey = wordBankData.wordTextToDisplayKey.get(id)!
      const wordText = wordBankData.displayKeyToWordText.get(displayKey)
      if (wordText) {
        return {
          id: displayKey,
          en: wordText,
          fa: '',
          finglish: wordText,
          phonetic: '',
          lessonId: 'display'
        } as VocabularyItem
      }
    }

    // Check the original vocabulary bank
    const vocab = vocabularyBank.find(v => v.id === id)
    if (vocab) {
      // Normalize display text (handle slash-separated translations)
    return {
        ...vocab,
        en: WordBankService.normalizeVocabEnglish(vocab.en)
      }
    }
    
    // Final fallback: if id looks like a displayKey but wasn't found, extract wordText
    // Handle format "wordText-0" or "wordText-1"
    const match = id.match(/^(.+)-(\d+)$/)
    if (match) {
      const wordText = match[1]
      return {
        id: id,
        en: wordText,
        fa: '',
        finglish: wordText,
        phonetic: '',
        lessonId: 'display'
      } as VocabularyItem
    }
    
    return undefined
  }

  const playAudioSequence = async () => {
    setIsPlayingAudio(true)
    try {
      // Use resolved lexemes - playLexeme handles both base vocab and grammar forms
      for (let i = 0; i < resolvedLexemes.length; i++) {
        const resolvedLexeme = resolvedLexemes[i]
        await AudioService.playLexeme(resolvedLexeme)
        
        // Short pause between words
        if (i < resolvedLexemes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
      setHasPlayedAudio(true)
    } catch (error) {
      console.log('Error playing audio sequence:', error)
      setHasPlayedAudio(true) // Still mark as played to enable interaction
    } finally {
      setIsPlayingAudio(false)
    }
  }

  const handleItemClick = (wordText: string, index: number) => {
    // Create display key for this word occurrence
    const displayKey = `${wordText}-${index}`
    
    // Click to add items to sequence in order
    if (!userOrder.includes(displayKey)) {
      setUserOrder(prev => [...prev, displayKey])
    }
  }

  const handleRemoveItem = (displayKey: string) => {
    setUserOrder(prev => prev.filter(key => key !== displayKey))
  }

  const handleSubmit = async () => {
    // expectedWordCount is already calculated via useMemo above
    if (userOrder.length !== expectedWordCount) return

    let correct = false
    
    if (expectedTranslation) {
      // Use semantic units for validation (get from WordBankService)
      const wordBankResult = WordBankService.generateWordBank({
        expectedTranslation,
        vocabularyBank,
        sequenceIds: undefined,
        moduleId, // For tiered fallback
        lessonId, // For tiered fallback
      });
      
      // Extract expected semantic units (normalized with contractions and punctuation)
      const expectedUnits = wordBankResult.wordBankItems
        .filter(item => item.isCorrect)
        .flatMap(item => WordBankService.normalizeForValidation(item.wordText));
      
      // Extract user's semantic units from display keys (normalized)
      const userUnits = userOrder.flatMap(displayKey => {
        const wordText = wordBankData.displayKeyToWordText.get(displayKey) || displayKey.split('-').slice(0, -1).join('-');
        return WordBankService.normalizeForValidation(wordText);
      });
      
      // Compare semantic units (order matters, but allow synonyms and contractions)
      correct = expectedUnits.length === userUnits.length &&
        userUnits.every((userUnit, index) => {
          const expectedUnit = expectedUnits[index];
          
          // Exact match (already normalized)
          if (userUnit === expectedUnit) return true;
          
          // Synonym match (for greetings: hi/hello/salam)
          const userLower = userUnit.toLowerCase();
          const expectedLower = expectedUnit.toLowerCase();
          if ((userLower === 'hi' || userLower === 'hello' || userLower === 'salam') &&
              (expectedLower === 'hi' || expectedLower === 'hello' || expectedLower === 'salam')) {
            return true;
          }
          
          return false;
        });
    } else {
      // Default behavior: match vocabulary ID order
      // Extract vocabulary IDs from display keys
      const userVocabIds = userOrder.map(displayKey => {
        return wordBankData.displayKeyToVocabId.get(displayKey) || displayKey
      })
      // Compare with resolved sequence IDs (from resolved lexemes)
      correct = JSON.stringify(userVocabIds) === JSON.stringify(resolvedSequenceIds)
    }
    
    setIsCorrect(correct)
    setShowResult(true)

    // Calculate time spent
    const timeSpentMs = Date.now() - startTime.current

    // Track vocabulary performance PER-WORD (accurate tracking for multi-word games)
    if (onVocabTrack && expectedTranslation) {
      // Convert user's display keys back to word text
      const userAnswerWords = userOrder.map(displayKey => 
        wordBankData.displayKeyToWordText.get(displayKey) || displayKey.split('-').slice(0, -1).join('-')
      );
      
      // Validate each word individually
      const perWordResults = WordBankService.validateUserAnswer({
        userAnswer: userAnswerWords,
        expectedTranslation,
        vocabularyBank,
        sequenceIds: sequence
      });
      
      // Track each word with its individual result
      perWordResults.forEach(result => {
        if (result.vocabularyId) {
          onVocabTrack(result.vocabularyId, result.wordText, result.isCorrect, timeSpentMs);
        }
      });
    } else if (onVocabTrack) {
      // Fallback: If no expectedTranslation, use resolved lexemes for tracking
      // Track baseId (e.g., "bad" not "badam") to track base vocab performance
      resolvedLexemes.forEach(resolved => {
        onVocabTrack(resolved.baseId, resolved.en, correct, timeSpentMs);
      });
    }

    if (correct) {
      playSuccessSound()
      if (onXpStart && !isProcessingXp) {
        setIsProcessingXp(true) // Guard: prevent concurrent calls
        try {
          const wasGranted = await onXpStart(); // Await the Promise to get result
          setIsAlreadyCompleted(!wasGranted); // If not granted, it was already completed
        } finally {
          setIsProcessingXp(false) // Always clear guard
        }
      }
      setShowXp(true)
    } else {
      setShowIncorrect(true)
      setTimeout(() => {
        setShowIncorrect(false);
        handleRetry();
      }, 600);
    }
  }

  const handleXpComplete = () => {
    onContinue()
  }

  const handleRetry = () => {
    setUserOrder([])
    setShowResult(false)
    setIsCorrect(false)
    setShowIncorrect(false)
    setIsProcessingXp(false) // Reset guard on retry
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
          <div className="text-center mb-3 sm:mb-4">
            <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold mb-1 text-primary">
              BUILD THE SENTENCE
        </h2>
            <p className="text-sm xs:text-base text-muted-foreground mb-2">
          Listen to the Persian words and click the English meanings in the same order
        </p>
      </div>

      {/* Audio Player Section */}
          <div className="bg-primary/5 rounded-xl p-2 sm:p-3 mb-3 text-center">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              {/* Audio icon / waveform indicator - replace icon when playing */}
              <div className="flex items-center justify-center">
                {isPlayingAudio ? (
                  <div className="flex items-end gap-0.5 h-6 sm:h-8">
                <motion.div
                  className="w-1 bg-primary rounded-full"
                  animate={{ height: ['10px', '24px', '10px'] }}
                  transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="w-1 bg-primary rounded-full"
                  animate={{ height: ['14px', '28px', '14px'] }}
                  transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
                />
                <motion.div
                  className="w-1 bg-primary rounded-full"
                  animate={{ height: ['10px', '24px', '10px'] }}
                  transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                />
              </div>
                ) : (
                  <Volume2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary/60" />
            )}
          </div>
          
              <p className="text-base sm:text-lg font-medium text-gray-900">
            {isPlayingAudio ? "Listening..." : hasPlayedAudio ? "Now click the meanings in order:" : "Click to hear the sequence..."}
          </p>
        </div>
        
        <Button
          onClick={playAudioSequence}
          variant="outline"
          size="lg"
              className="gap-2 border-2 border-primary text-primary hover:bg-primary hover:text-white"
          disabled={showResult}
        >
          <Volume2 className="h-5 w-5" />
          {hasPlayedAudio ? 'Play Again' : 'Play Audio Sequence'}
        </Button>
      </div>

          {/* User's Sequence */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold mb-3 text-center">Your Order:</h3>
        <motion.div
              className={`min-h-[60px] overflow-y-auto rounded-xl border-2 px-2 py-2 flex items-center justify-center transition-colors ${
                showResult && isCorrect 
                  ? 'bg-green-50 border-green-300'
                  : showResult && !isCorrect
                  ? 'bg-red-50 border-red-300'
                  : 'bg-[#F8FAF8] border-gray-200'
              }`}
          initial={false}
              animate={
                showIncorrect 
                  ? { x: [0, -6, 6, -6, 6, 0] }
                  : showResult && isCorrect
                  ? { scale: [1, 1.02, 1], backgroundColor: ['#F8FAF8', '#dcfce7', '#F8FAF8'] }
                  : {}
              }
          transition={{ duration: 0.6 }}
        >
          {userOrder.length === 0 ? (
                <p className="text-center text-gray-400 italic text-sm">
                  Click words from the bank below
            </p>
          ) : (
            <div className="flex flex-wrap gap-1 sm:gap-2 justify-center content-center">
              {userOrder.map((id, index) => {
                const vocab = getVocabularyById(id)
                
                return (
                  <div
                    key={`${id}-${index}`}
                    className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border-2 relative transition-all flex items-center justify-between ${
                      showResult && isCorrect 
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : showResult && !isCorrect
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-primary bg-primary/10 text-primary'
                    }`}
                  >
                    <span className="font-medium">{vocab?.en || id}</span>
                    {!showResult ? (
                      <button
                        onClick={() => handleRemoveItem(id)}
                        className="text-gray-400 hover:text-red-500 flex items-center ml-2"
                        title="Remove this word"
                      >
                        <span className="text-sm">×</span>
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500 ml-2">#{index + 1}</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

          {/* Word Bank */}
          <div className="mb-3">
            <h3 className="text-lg font-semibold mb-2 text-center">Word Bank:</h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {wordBankData.wordBankItems.map((wordText: string, index: number) => {
            // CRITICAL FIX: Use stable displayKey based on wordText + occurrence count
            // Count occurrences of this wordText up to current index
            const occurrenceCount = wordBankData.wordBankItems.slice(0, index + 1).filter(w => w === wordText).length - 1
            const displayKey = `${wordText}-${occurrenceCount}` // Stable key based on occurrence, not array index
            const isUsed = userOrder.includes(displayKey)
            
            return (
              <button
                key={displayKey}
                onClick={() => !isUsed && !showResult && handleItemClick(wordText, index)}
                disabled={isUsed || showResult}
                    className={`px-3 py-2 rounded-lg border-2 transition-all shadow-sm ${
                  isUsed 
                        ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                        : 'border-primary/30 bg-white hover:border-green-400 hover:bg-green-50 hover:shadow-md active:scale-95 cursor-pointer'
                } ${showResult ? 'cursor-not-allowed' : ''}`}
              >
                <span className="font-medium">{wordText}</span>
              </button>
            )
          })}
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">
          Click words to add them to your sequence above
        </p>
      </div>

      {/* Submit Button */}
      {!showResult && (
            <div className="w-full mt-2">
          <Button
            onClick={handleSubmit}
            disabled={userOrder.length !== expectedWordCount}
                className="gap-2 w-full"
            size="lg"
          >
            Check My Answer ({userOrder.length}/{expectedWordCount})
          </Button>
        </div>
      )}
        </div>
      </div>
    </div>
  )
} 