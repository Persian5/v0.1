import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, RotateCcw } from "lucide-react"
import { XpAnimation } from "./XpAnimation"
import { AudioService } from "@/lib/services/audio-service"
import { VocabularyItem } from "@/lib/types"
import { PersianGrammarService } from "@/lib/services/persian-grammar-service"
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

  // CURATED WORD BANK: Smart selection to prevent overwhelming users
  const [allWordBankOptions] = useState<string[] | { vocabItems: VocabularyItem[]; vocabIds: string[] }>(() => {
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
      return curatedVocab.map(v => v.id).sort(() => Math.random() - 0.5);
    }

    // SMART PERSIAN GRAMMAR: Use grammar service for transformations
    const transformedWords = PersianGrammarService.transformSequence(
      sequence, 
      vocabularyBank, 
      expectedTranslation
    );
    
    // Convert to VocabularyItem format
    const contextualVocab: VocabularyItem[] = transformedWords.map(transformed => ({
      id: transformed.id,
      en: transformed.en,
      fa: transformed.fa,
      finglish: transformed.finglish,
      phonetic: transformed.phonetic,
      lessonId: transformed.lessonId
    }));
    
    // Track used meanings to avoid duplicates
    const usedEnglishMeanings = new Set(contextualVocab.map(v => v.en.toLowerCase()));
    
    // Add strategic distractors (avoid semantic conflicts)
    const maxDistractors = Math.max(4, maxWordBankSize - contextualVocab.length);
    const potentialDistractors = vocabularyBank.filter(vocab => {
      // Skip if meaning already used
      if (usedEnglishMeanings.has(vocab.en.toLowerCase())) return false;
      
      // Skip if this vocab is already in our contextual vocab
      if (contextualVocab.some(cv => cv.id === vocab.id)) return false;
      
      // ENHANCED: Check for semantic similarity with existing contextual vocab
      const vocabNormalized = vocab.en.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();
      const hasSemanticConflict = contextualVocab.some(existingVocab => {
        const existingNormalized = existingVocab.en.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();
        
        // Check for exact match after normalization
        if (vocabNormalized === existingNormalized) return true;
        
        // Check for substantial word overlap (e.g., "nice to meet you" vs "nice meet you")
        const vocabWords = vocabNormalized.split(' ');
        const existingWords = existingNormalized.split(' ');
        const commonWords = vocabWords.filter(word => existingWords.includes(word));
        
        // If more than 50% of words overlap, it's too similar
        const overlapPercentage = commonWords.length / Math.max(vocabWords.length, existingWords.length);
        return overlapPercentage > 0.5;
      });
      
      if (hasSemanticConflict) return false;
      
      // AVOID words that overlap with expected translation
      const expectedWords = expectedTranslation.toLowerCase().split(' ');
      const vocabWords = vocab.en.toLowerCase().split(' ');
      const hasConfusingOverlap = vocabWords.some(word => 
        expectedWords.some(expectedWord => {
          return word === expectedWord || 
                 (word.includes(expectedWord) && word.length <= expectedWord.length + 2) ||
                 (expectedWord.includes(word) && expectedWord.length <= word.length + 2);
        })
      );
      
      return !hasConfusingOverlap;
    });
    
    // Select good distractors
    const selectedDistractors = potentialDistractors
      .sort(() => Math.random() - 0.5)
      .slice(0, maxDistractors);
    
    selectedDistractors.forEach(vocab => {
      contextualVocab.push({
        id: vocab.id,
        en: vocab.en,
        fa: vocab.fa,
        finglish: vocab.finglish,
        phonetic: vocab.phonetic,
        lessonId: vocab.lessonId
      });
    });
    
    return {
      vocabItems: contextualVocab,
      vocabIds: contextualVocab.map(v => v.id).sort(() => Math.random() - 0.5)
    };
  })

  // Dynamic vocabulary lookup with contextual support
  const getVocabularyById = (id: string) => {
    // First check the original vocabulary bank
    let vocab = vocabularyBank.find(v => v.id === id)
    if (vocab) return vocab
    
    // Check the contextual vocabulary items we created
    if (typeof allWordBankOptions === 'object' && 'vocabItems' in allWordBankOptions) {
      const contextualVocab = allWordBankOptions.vocabItems.find((v: VocabularyItem) => v.id === id)
      if (contextualVocab) return contextualVocab
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
    // Use targetWordCount if provided, otherwise calculate based on grammar rules
    let expectedWordCount: number;
    
    if (targetWordCount) {
      expectedWordCount = targetWordCount;
    } else if (expectedTranslation) {
      // Use grammar service to determine correct word count
      expectedWordCount = PersianGrammarService.getExpectedWordCount(
        sequence, 
        vocabularyBank, 
        expectedTranslation
      );
    } else {
      expectedWordCount = sequence.length;
    }
    
    if (userOrder.length !== expectedWordCount) return

    let correct = false
    
    if (expectedTranslation) {
      // For custom phrases, match against expected translation
      const userTranslation = userOrder.map(id => {
        const vocab = getVocabularyById(id)
        return vocab?.en || ''
      }).join(' ')
      
      // Normalize: lowercase, trim, collapse spaces, strip punctuation
      const normalize = (str: string) => str
        .toLowerCase()
        .trim()
        .replace(/[?!.,]/g, '')
        .replace(/\s+/g, ' ')
      
      correct = normalize(userTranslation) === normalize(expectedTranslation)
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
          {(typeof allWordBankOptions === 'object' && 'vocabIds' in allWordBankOptions 
            ? allWordBankOptions.vocabIds 
            : allWordBankOptions
          ).map((id: string) => {
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
            disabled={userOrder.length !== (targetWordCount || (expectedTranslation ? PersianGrammarService.getExpectedWordCount(sequence, vocabularyBank, expectedTranslation) : sequence.length))}
            className="gap-2"
            size="lg"
          >
            Check My Answer ({userOrder.length}/{targetWordCount || (expectedTranslation ? PersianGrammarService.getExpectedWordCount(sequence, vocabularyBank, expectedTranslation) : sequence.length)})
          </Button>
        </div>
      )}

      {/* Incorrect feedback popup removed */}
    </div>
  )
} 