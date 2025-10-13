import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, RotateCcw } from "lucide-react"
import { XpAnimation } from "./XpAnimation"
import { AudioService } from "@/lib/services/audio-service"
import { VocabularyItem } from "@/lib/types"
import { playSuccessSound } from "./Flashcard"
import { motion } from "framer-motion"

interface AudioSequenceProps {
  sequence: string[] // Array of vocabulary IDs in correct order
  vocabularyBank: VocabularyItem[] // All available vocabulary for this lesson
  points?: number
  autoPlay?: boolean
  expectedTranslation?: string // Custom English translation override for phrases
  targetWordCount?: number // Number of English words expected (overrides sequence.length)
  maxWordBankSize?: number // Maximum number of options in word bank (prevents crowding)
  onContinue: () => void
  onXpStart?: () => void
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
  onXpStart
}: AudioSequenceProps) {
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false)
  const [userOrder, setUserOrder] = useState<string[]>([])
  const [showResult, setShowResult] = useState(false)
  const [showXp, setShowXp] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showIncorrect, setShowIncorrect] = useState(false)

  // WORD BANK: Parse expectedTranslation into individual words (same logic as TextSequence)
  const [allWordBankOptions] = useState<{ vocabItems: VocabularyItem[]; vocabIds: string[] }>(() => {
    if (!expectedTranslation) {
      // Default behavior: curated selection from available vocabulary
      const correctWords = vocabularyBank.filter(v => sequence.includes(v.id));
      
      // Add strategic distractors (avoid overwhelming)
      const maxDistractors = Math.max(0, maxWordBankSize - correctWords.length);
      const distractors = vocabularyBank
        .filter(v => !sequence.includes(v.id))
        .sort(() => Math.random() - 0.5)
        .slice(0, maxDistractors);
      
      const curatedVocab = [...correctWords, ...distractors];
      const vocabIds = curatedVocab.map(v => v.id).sort(() => Math.random() - 0.5);
      
      return {
        vocabItems: curatedVocab,
        vocabIds
      };
    }

    // Parse expectedTranslation into individual words (same as TextSequence)
    const words = expectedTranslation.split(' ').filter(w => w.length > 0);
    
    // Handle duplicates by creating unique IDs (e.g., "you" appears twice → "you_1", "you_2")
    const wordCounts = new Map<string, number>();
    const contextualVocab: VocabularyItem[] = [];
    
    words.forEach((word) => {
      const normalizedWord = word.toLowerCase();
      const currentCount = wordCounts.get(normalizedWord) || 0;
      wordCounts.set(normalizedWord, currentCount + 1);
      
      const uniqueId = currentCount > 0 ? `${normalizedWord}_${currentCount + 1}` : normalizedWord;
      
      contextualVocab.push({
        id: uniqueId,
        en: word, // Keep original capitalization
        fa: '',
        finglish: word,
        phonetic: '',
        lessonId: 'generated'
      });
    });
    
    // Shuffle for word bank display
    const shuffledIds = contextualVocab.map(v => v.id).sort(() => Math.random() - 0.5);
    
    return {
      vocabItems: contextualVocab,
      vocabIds: shuffledIds
    };
  })

  // Dynamic vocabulary lookup with contextual support
  const getVocabularyById = (id: string) => {
    // First check the original vocabulary bank
    let vocab = vocabularyBank.find(v => v.id === id)
    if (vocab) return vocab
    
    // Check the contextual vocabulary items we created
    const contextualVocab = allWordBankOptions.vocabItems.find((v: VocabularyItem) => v.id === id)
    if (contextualVocab) return contextualVocab
    
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

  const handleItemClick = (vocabularyId: string) => {
    // Click to add items to sequence in order
    if (!userOrder.includes(vocabularyId)) {
      setUserOrder(prev => [...prev, vocabularyId])
    }
  }

  const handleRemoveItem = (vocabularyId: string) => {
    setUserOrder(prev => prev.filter(id => id !== vocabularyId))
  }

  const handleSubmit = () => {
    // Calculate expected word count
    let expectedWordCount: number;
    
    if (targetWordCount) {
      expectedWordCount = targetWordCount;
    } else if (expectedTranslation) {
      // Count words in expectedTranslation
      expectedWordCount = expectedTranslation.split(' ').filter(w => w.length > 0).length;
    } else {
      expectedWordCount = sequence.length;
    }
    
    if (userOrder.length !== expectedWordCount) return

    let correct = false
    
    if (expectedTranslation) {
      // For expectedTranslation, build the expected ID sequence
      const words = expectedTranslation.split(' ').filter(w => w.length > 0);
      const wordCounts = new Map<string, number>();
      const expectedIds: string[] = [];
      
      words.forEach((word) => {
        const normalizedWord = word.toLowerCase();
        const currentCount = wordCounts.get(normalizedWord) || 0;
        wordCounts.set(normalizedWord, currentCount + 1);
        
        const uniqueId = currentCount > 0 ? `${normalizedWord}_${currentCount + 1}` : normalizedWord;
        expectedIds.push(uniqueId);
      });
      
      // Match user order against expected IDs
      correct = JSON.stringify(userOrder) === JSON.stringify(expectedIds);
    } else {
      // Default behavior: match vocabulary ID order
      correct = JSON.stringify(userOrder) === JSON.stringify(sequence)
    }
    
    setIsCorrect(correct)
    setShowResult(true)

    if (correct) {
      playSuccessSound()
      if (onXpStart) {
        onXpStart()
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
          {allWordBankOptions.vocabIds.map((id: string) => {
            const vocab = getVocabularyById(id)
            const isUsed = userOrder.includes(id)
            
            return (
              <button
                key={id}
                onClick={() => !isUsed && !showResult && handleItemClick(id)}
                disabled={isUsed || showResult}
                className={`px-3 py-2 rounded-lg border-2 transition-all ${
                  isUsed 
                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'border-primary/30 bg-white sm:hover:border-primary sm:hover:bg-primary/5 sm:hover:scale-105 cursor-pointer'
                } ${showResult ? 'cursor-not-allowed' : ''}`}
              >
                <span className="font-medium">{vocab?.en || id}</span>
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
            disabled={userOrder.length !== (targetWordCount || (expectedTranslation ? expectedTranslation.split(' ').filter(w => w.length > 0).length : sequence.length))}
            className="gap-2"
            size="lg"
          >
            Check My Answer ({userOrder.length}/{targetWordCount || (expectedTranslation ? expectedTranslation.split(' ').filter(w => w.length > 0).length : sequence.length)})
          </Button>
        </div>
      )}

      {/* Incorrect feedback popup removed */}
    </div>
  )
} 