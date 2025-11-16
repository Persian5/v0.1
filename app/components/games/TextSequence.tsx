import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Type, RotateCcw } from "lucide-react"
import { XpAnimation } from "./XpAnimation"
import { VocabularyItem } from "@/lib/types"
import { playSuccessSound } from "./Flashcard"
import { motion } from "framer-motion"
import { WordBankService } from "@/lib/services/word-bank-service"
import { FLAGS } from "@/lib/flags"
import { type LearnedSoFar } from "@/lib/utils/curriculum-lexicon"

interface TextSequenceProps {
  finglishText: string // Finglish phrase to display
  expectedTranslation: string // English translation to build
  vocabularyBank: VocabularyItem[] // All available vocabulary for this lesson
  points?: number
  maxWordBankSize?: number // Maximum number of options in word bank
  learnedSoFar?: LearnedSoFar // PHASE 4: Learned vocabulary state for filtering word bank
  moduleId?: string // For tiered fallback in WordBankService
  lessonId?: string // For tiered fallback in WordBankService
  onContinue: () => void
  onXpStart?: () => Promise<boolean> // Returns true if XP granted, false if already completed
  onVocabTrack?: (vocabularyId: string, wordText: string, isCorrect: boolean, timeSpentMs?: number) => void; // Track vocabulary performance
}

export function TextSequence({
  finglishText,
  expectedTranslation,
  vocabularyBank,
  points = 3,
  maxWordBankSize = 10,
  learnedSoFar, // PHASE 4: Learned vocabulary state
  moduleId, // For tiered fallback
  lessonId, // For tiered fallback
  onContinue,
  onXpStart,
  onVocabTrack
}: TextSequenceProps) {
  const [userOrder, setUserOrder] = useState<string[]>([])
  const [showResult, setShowResult] = useState(false)
  const [showXp, setShowXp] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showIncorrect, setShowIncorrect] = useState(false)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false) // Track if step was already completed (local state)
  
  // Time tracking for analytics
  const startTime = useRef(Date.now())

  // Calculate expected semantic unit count (phrases count as 1, words count as 1)
  const expectedWordCount = WordBankService.getSemanticUnits({
    expectedTranslation,
    vocabularyBank
  });

  // WORD BANK: Use WordBankService for unified, consistent generation
  const [wordBankOptions] = useState<string[]>(() => {
    // PHASE 4: Sanity logging before calling generateWordBank
    if (FLAGS.LOG_WORDBANK) {
      console.log(
        "%c[TEXT SEQUENCE - PRE WORDBANK]",
        "color: #00BCD4; font-weight: bold;",
        {
          stepType: 'text-sequence',
          learnedVocabIds: learnedSoFar?.vocabIds || [],
          learnedVocabCount: learnedSoFar?.vocabIds?.length || 0,
          vocabularyBankSize: vocabularyBank.length,
        }
      );
    }
    
    const wordBankResult = WordBankService.generateWordBank({
      expectedTranslation,
      vocabularyBank,
      maxSize: maxWordBankSize,
      distractorStrategy: 'semantic',
      // PHASE 4: Pass learned vocab IDs if feature flag is enabled
      learnedVocabIds: FLAGS.USE_LEARNED_VOCAB_IN_WORDBANK && learnedSoFar
        ? learnedSoFar.vocabIds
        : undefined,
      moduleId, // For tiered fallback
      lessonId, // For tiered fallback
    })
    
    // WordBankService returns normalized, shuffled words ready for display
    return wordBankResult.allOptions
  })

  const handleItemClick = (word: string, wordIndex: number) => {
    // Click to add words to sequence in order - use unique key for duplicates
    const wordKey = `${word}-${wordIndex}`;
    if (!userOrder.includes(wordKey)) {
      setUserOrder(prev => [...prev, wordKey])
    }
  }

  const handleRemoveItem = (wordKey: string) => {
    setUserOrder(prev => prev.filter(w => w !== wordKey))
  }

  const handleSubmit = async () => {
    // Use semantic units for validation (phrases count as 1, words count as 1)
    if (userOrder.length !== expectedWordCount) return

    // Get correct semantic units from WordBankService
    const wordBankResult = WordBankService.generateWordBank({
      expectedTranslation,
      vocabularyBank
    });
    
    // Extract expected semantic units (normalized with contractions and punctuation)
    const expectedUnits = wordBankResult.wordBankItems
      .filter(item => item.isCorrect)
      .flatMap(item => WordBankService.normalizeForValidation(item.wordText));
    
    // Extract user's semantic units from wordKeys (normalized)
    const userUnits = userOrder.flatMap(wordKey => {
      const wordText = wordKey.split('-').slice(0, -1).join('-');
      return WordBankService.normalizeForValidation(wordText);
    });
    
    // Compare semantic units (order matters, but allow synonyms and contractions)
    // Check if each user unit matches expected unit (with synonym support)
    const correct = expectedUnits.length === userUnits.length &&
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
    setIsCorrect(correct)
    setShowResult(true)

    // Calculate time spent
    const timeSpentMs = Date.now() - startTime.current

    // Track vocabulary performance PER-WORD (accurate tracking for multi-word games)
    if (onVocabTrack) {
      // Convert user's word keys back to actual word text (strip index suffix)
      const userAnswerWords = userOrder.map(wordKey => 
        wordKey.split('-').slice(0, -1).join('-')
      );
      
      // Validate each word individually
      const perWordResults = WordBankService.validateUserAnswer({
        userAnswer: userAnswerWords,
        expectedTranslation,
        vocabularyBank
      });
      
      // Track each word with its individual result
      perWordResults.forEach(result => {
        if (result.vocabularyId) {
          onVocabTrack(result.vocabularyId, result.wordText, result.isCorrect, timeSpentMs);
        }
      });
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
        setShowIncorrect(false)
        handleRetry()
      }, 600)
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
              Click the words in order to form the correct translation
        </p>
      </div>

      {/* Finglish Text Display Section */}
          <div className="bg-primary/5 rounded-xl p-2 sm:p-3 mb-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Type className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              <p className="text-base sm:text-lg font-medium text-primary">
            Read the Persian phrase:
          </p>
        </div>
        
            <div className="bg-white rounded-lg p-3 border-2 border-primary/20 mb-2">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-primary font-mono">
            {finglishText}
          </p>
        </div>
        
            <p className="text-xs sm:text-sm text-muted-foreground">
          Now build the English meaning using the words below
        </p>
      </div>

      {/* User's Sequence */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold mb-3 text-center">Your Translation:</h3>
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
              {userOrder.map((wordKey, index) => {
                const word = wordKey.split('-').slice(0, -1).join('-');
                const wordIndex = parseInt(wordKey.split('-').slice(-1)[0]);
                return (
                  <div
                    key={wordKey}
                    className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border-2 relative transition-all flex items-center justify-between ${
                      showResult && isCorrect 
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : showResult && !isCorrect
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-primary bg-primary/10 text-primary'
                    }`}
                  >
                    <span className="font-medium">{word}</span>
                    {!showResult ? (
                      <button
                        onClick={() => handleRemoveItem(wordKey)}
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
          {wordBankOptions.map((word, index) => {
            // Simple check: is THIS specific word bank item used?
            const wordKey = `${word}-${index}`;
            const isUsed = userOrder.includes(wordKey);
            
            return (
              <button
                key={`${word}-${index}`}
                onClick={() => !isUsed && !showResult && handleItemClick(word, index)}
                disabled={isUsed || showResult}
                    className={`px-3 py-2 rounded-lg border-2 transition-all shadow-sm ${
                  isUsed 
                        ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                        : 'border-primary/30 bg-white hover:border-green-400 hover:bg-green-50 hover:shadow-md active:scale-95 cursor-pointer'
                } ${showResult ? 'cursor-not-allowed' : ''}`}
              >
                <span className="font-medium">{word}</span>
              </button>
            )
          })}
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">
          Click words to add them to your translation above
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
            Check My Translation ({userOrder.length}/{expectedWordCount})
          </Button>
        </div>
      )}
        </div>
      </div>
    </div>
  )
} 