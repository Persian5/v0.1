import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, RotateCcw } from "lucide-react"
import { XpAnimation } from "./XpAnimation"
import { AudioService } from "@/lib/services/audio-service"
import { VocabularyItem } from "@/lib/types"
import { playSuccessSound } from "./Flashcard"
import { motion } from "framer-motion"
import { WordBankService } from "@/lib/services/word-bank-service"

interface AudioSequenceProps {
  sequence: string[] // Array of vocabulary IDs in correct order
  vocabularyBank: VocabularyItem[] // All available vocabulary for this lesson
  points?: number
  autoPlay?: boolean
  expectedTranslation?: string // Custom English translation override for phrases
  targetWordCount?: number // Number of English words expected (overrides sequence.length)
  maxWordBankSize?: number // Maximum number of options in word bank (prevents crowding)
  onContinue: () => void
  onXpStart?: () => Promise<boolean> // Returns true if XP granted, false if already completed
  onVocabTrack?: (vocabularyId: string, wordText: string, isCorrect: boolean, timeSpentMs?: number) => void; // Track vocabulary performance
}

export function AudioSequence({
  sequence,
  vocabularyBank,
  points = 3,
  autoPlay = false,
  expectedTranslation, // Add support for custom translation
  targetWordCount, // Add support for custom word count
  maxWordBankSize = 12, // Default max 12 options for better variety while manageable
  onContinue,
  onXpStart,
  onVocabTrack
}: AudioSequenceProps) {
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false)
  const [userOrder, setUserOrder] = useState<string[]>([])
  const [showResult, setShowResult] = useState(false)
  const [showXp, setShowXp] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showIncorrect, setShowIncorrect] = useState(false)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false) // Track if step was already completed (local state)

  // Calculate expected semantic unit count (phrases count as 1, words count as 1)
  const expectedWordCount = targetWordCount || WordBankService.getSemanticUnits({
    expectedTranslation,
    vocabularyBank,
    sequenceIds: expectedTranslation ? undefined : sequence
  });

  // WORD BANK: Use WordBankService for unified, consistent generation
  // Create mapping from wordText → vocabularyId[] and unique keys for display
  const [wordBankData] = useState<{
    wordBankItems: string[]; // Shuffled wordText values for display (from allOptions)
    displayKeyToVocabId: Map<string, string>; // Map display key → vocabularyId
    displayKeyToWordText: Map<string, string>; // Map display key → wordText
  }>(() => {
    // Generate word bank using WordBankService
    const wordBankResult = WordBankService.generateWordBank({
      expectedTranslation,
      vocabularyBank,
      sequenceIds: expectedTranslation ? undefined : sequence,
      maxSize: maxWordBankSize,
      distractorStrategy: 'semantic'
    })

    // Build mappings for vocabulary ID lookup and duplicate handling
    // Use shuffled allOptions for display order, but map to WordBankItems for metadata
    const displayKeyToVocabId = new Map<string, string>()
    const displayKeyToWordText = new Map<string, string>()

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
    const wordTextCounts = new Map<string, number>()
    wordBankResult.allOptions.forEach((wordText, displayIndex) => {
      const normalizedKey = wordText.toLowerCase()
      const count = wordTextCounts.get(normalizedKey) || 0
      wordTextCounts.set(normalizedKey, count + 1)

      // Create unique display key for this occurrence
      const displayKey = `${wordText}-${displayIndex}`

      // Find matching WordBankItem for this wordText occurrence
      const matchingItems = wordTextToItems.get(normalizedKey) || []
      const itemIndex = Math.min(count, matchingItems.length - 1)
      const matchingItem = matchingItems[itemIndex]

      // Map display key to vocabularyId and wordText
      if (matchingItem?.vocabularyId) {
        displayKeyToVocabId.set(displayKey, matchingItem.vocabularyId)
      }
      displayKeyToWordText.set(displayKey, wordText)
    })

    return {
      wordBankItems: wordBankResult.allOptions,
      displayKeyToVocabId,
      displayKeyToWordText
    }
  })

  // Dynamic vocabulary lookup with WordBankService support
  const getVocabularyById = (id: string) => {
    // Check if this is a display key (from WordBankService)
    if (wordBankData.displayKeyToWordText.has(id)) {
      const wordText = wordBankData.displayKeyToWordText.get(id)!
      const vocabId = wordBankData.displayKeyToVocabId.get(id)
      
      // If we have a vocabulary ID, lookup from vocabularyBank
      if (vocabId) {
        const vocab = vocabularyBank.find(v => v.id === vocabId)
        if (vocab) {
          // Normalize display text (handle slash-separated translations)
          return {
            ...vocab,
            en: WordBankService.normalizeVocabEnglish(vocab.en)
          }
        }
      }
      
      // Fallback: create a minimal vocab item from wordText
      return {
        id: id,
        en: wordText,
        fa: '',
        finglish: wordText,
        phonetic: '',
        lessonId: 'generated'
      } as VocabularyItem
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
    
    return undefined
  }

  const playAudioSequence = async () => {
    try {
      for (let i = 0; i < sequence.length; i++) {
        const vocabularyId = sequence[i]
        await AudioService.playVocabularyAudio(vocabularyId)
        
        // Medium pause between words
        if (i < sequence.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      setHasPlayedAudio(true)
    } catch (error) {
      console.log('Error playing audio sequence:', error)
      setHasPlayedAudio(true) // Still mark as played to enable interaction
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
        sequenceIds: undefined
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
      correct = JSON.stringify(userVocabIds) === JSON.stringify(sequence)
    }
    
    setIsCorrect(correct)
    setShowResult(true)

    // Track vocabulary performance for each word in sequence
    if (onVocabTrack) {
      sequence.forEach(vocabId => {
        const vocab = vocabularyBank.find(v => v.id === vocabId)
        if (vocab) {
          onVocabTrack(vocabId, vocab.en, correct)
        }
      })
    }

    if (correct) {
      playSuccessSound()
      if (onXpStart) {
        const wasGranted = await onXpStart(); // Await the Promise to get result
        setIsAlreadyCompleted(!wasGranted); // If not granted, it was already completed
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
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 relative">
      {/* XP Animation - positioned like other games */}
      {showResult && isCorrect && (
        <XpAnimation
          amount={points}
          show={showXp}
          isAlreadyCompleted={isAlreadyCompleted}
          onStart={undefined}
          onComplete={handleXpComplete}
        />
      )}

      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-primary">
          SEQUENCE CHALLENGE
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Listen to the Persian words and click the English meanings in the same order
        </p>
      </div>

      {/* Audio Player Section */}
      <div className="bg-primary/5 rounded-xl p-3 sm:p-4 mb-3 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Volume2 className="h-8 w-8 text-primary" />
          <p className="text-lg font-medium text-primary">
            {hasPlayedAudio ? "Now click the meanings in order:" : "Click to hear the sequence..."}
          </p>
        </div>
        
        <Button
          onClick={playAudioSequence}
          variant="outline"
          size="lg"
          className="gap-2 w-[220px]"
          disabled={showResult}
        >
          <Volume2 className="h-5 w-5" />
          {hasPlayedAudio ? 'Play Again' : 'Play Audio Sequence'}
        </Button>
      </div>

      {/* User's Sequence - Show this first for clarity */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold mb-3 text-center">Your Order:</h3>
        <motion.div
          className="min-h-[60px] overflow-y-auto bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 px-2 py-2 flex items-center justify-center"
          initial={false}
          animate={showIncorrect ? { x: [0, -6, 6, -6, 6, 0] } : {}}
          transition={{ duration: 0.6 }}
        >
          {userOrder.length === 0 ? (
            <p className="text-center text-gray-500 italic">
              Click words from the bank below to build the sequence
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

      {/* Word Bank - All learned vocabulary */}
      <div className="space-y-2 mb-3 w-full max-w-[92vw] mx-auto px-2">
        <h3 className="text-lg font-semibold mb-3 text-center">Word Bank:</h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {wordBankData.wordBankItems.map((wordText: string, index: number) => {
            const displayKey = `${wordText}-${index}`
            const isUsed = userOrder.includes(displayKey)
            
            return (
              <button
                key={displayKey}
                onClick={() => !isUsed && !showResult && handleItemClick(wordText, index)}
                disabled={isUsed || showResult}
                className={`px-3 py-2 rounded-lg border-2 transition-all ${
                  isUsed 
                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'border-primary/30 bg-white sm:hover:border-primary sm:hover:bg-primary/5 sm:hover:scale-105 cursor-pointer'
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
        <div className="text-center mb-4">
          <Button
            onClick={handleSubmit}
            disabled={userOrder.length !== expectedWordCount}
            className="gap-2"
            size="lg"
          >
            Check My Answer ({userOrder.length}/{expectedWordCount})
          </Button>
        </div>
      )}

      {/* Incorrect feedback popup removed */}
    </div>
  )
} 