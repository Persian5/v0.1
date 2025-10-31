import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Type, RotateCcw } from "lucide-react"
import { XpAnimation } from "./XpAnimation"
import { VocabularyItem } from "@/lib/types"
import { playSuccessSound } from "./Flashcard"
import { motion } from "framer-motion"
import { WordBankService } from "@/lib/services/word-bank-service"

interface TextSequenceProps {
  finglishText: string // Finglish phrase to display
  expectedTranslation: string // English translation to build
  vocabularyBank: VocabularyItem[] // All available vocabulary for this lesson
  points?: number
  maxWordBankSize?: number // Maximum number of options in word bank
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
    const wordBankResult = WordBankService.generateWordBank({
      expectedTranslation,
      vocabularyBank,
      maxSize: maxWordBankSize,
      distractorStrategy: 'semantic'
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
      // Convert user's display keys back to word text
      const userAnswerWords = userOrder.map(displayKey => 
        wordBankData.displayKeyToWordText.get(displayKey) || displayKey.split('-').slice(0, -1).join('-')
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
    <div className="w-full max-w-2xl mx-auto p-4 relative">
      {/* XP Animation */}
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
          TEXT SEQUENCE
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Read the Finglish phrase and build the English translation
        </p>
      </div>

      {/* Finglish Text Display Section */}
      <div className="bg-primary/5 rounded-xl p-3 sm:p-4 mb-3 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Type className="h-8 w-8 text-primary" />
          <p className="text-lg font-medium text-primary">
            Read the Persian phrase:
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-4 border-2 border-primary/20 mb-3">
          <p className="text-2xl sm:text-3xl font-bold text-primary font-mono">
            {finglishText}
          </p>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Now build the English meaning using the words below
        </p>
      </div>

      {/* User's Sequence */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold mb-3 text-center">Your Translation:</h3>
        <motion.div
          className="min-h-[60px] overflow-y-auto bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 px-2 py-2 flex items-center justify-center"
          initial={false}
          animate={showIncorrect ? { x: [0, -6, 6, -6, 6, 0] } : {}}
          transition={{ duration: 0.6 }}
        >
          {userOrder.length === 0 ? (
            <p className="text-center text-gray-500 italic">
              Click words from the bank below to build your translation
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
      <div className="space-y-2 mb-3 w-full max-w-[92vw] mx-auto px-2">
        <h3 className="text-lg font-semibold mb-3 text-center">Word Bank:</h3>
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
                className={`px-3 py-2 rounded-lg border-2 transition-all ${
                  isUsed 
                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'border-primary/30 bg-white sm:hover:border-primary sm:hover:bg-primary/5 sm:hover:scale-105 cursor-pointer'
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
        <div className="text-center mb-4">
          <Button
            onClick={handleSubmit}
            disabled={userOrder.length !== expectedWordCount}
            className="gap-2"
            size="lg"
          >
            Check My Translation ({userOrder.length}/{expectedWordCount})
          </Button>
        </div>
      )}
    </div>
  )
} 