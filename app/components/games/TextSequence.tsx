import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Type, RotateCcw } from "lucide-react"
import { XpAnimation } from "./XpAnimation"
import { VocabularyItem } from "@/lib/types"
import { playSuccessSound } from "./Flashcard"
import { motion } from "framer-motion"

interface TextSequenceProps {
  finglishText: string // Finglish phrase to display
  expectedTranslation: string // English translation to build
  vocabularyBank: VocabularyItem[] // All available vocabulary for this lesson
  points?: number
  maxWordBankSize?: number // Maximum number of options in word bank
  onContinue: () => void
  onXpStart?: () => Promise<boolean> // Returns true if XP granted, false if already completed
}

export function TextSequence({
  finglishText,
  expectedTranslation,
  vocabularyBank,
  points = 3,
  maxWordBankSize = 10,
  onContinue,
  onXpStart
}: TextSequenceProps) {
  const [userOrder, setUserOrder] = useState<string[]>([])
  const [showResult, setShowResult] = useState(false)
  const [showXp, setShowXp] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showIncorrect, setShowIncorrect] = useState(false)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false) // Track if step was already completed (local state)

  // SMART WORD BANK: Generate contextual options with sentence-building distractors
  const [wordBankOptions] = useState<string[]>(() => {
    // Split expected translation into individual words
    const correctWords = expectedTranslation.split(' ').filter(word => word.length > 0)
    
    // Generate smart distractors that can form coherent sentences
    const generateSmartDistractors = (targetWords: string[], vocab: VocabularyItem[]): string[] => {
      const usedWords = new Set(targetWords.map(w => w.toLowerCase()))
      const distractors: string[] = []
      
      // Define thematic word groups for sentence building
      const wordGroups = {
        questions: ['Where', 'When', 'Why', 'How', 'Who', 'Which'],
        family: ['mother', 'brother', 'sister', 'family', 'daughter', 'son'],
        verbs: ['is', 'are', 'was', 'were', 'do', 'does', 'did', 'have', 'has'],
        pronouns: ['my', 'his', 'her', 'their', 'our', 'me', 'him', 'them'],
        articles: ['the', 'a', 'an'],
        common: ['good', 'nice', 'from', 'with', 'and', 'but', 'or']
      }
      
      // Determine which groups to prioritize based on expected translation
      const expectedLower = expectedTranslation.toLowerCase()
      const relevantGroups: string[] = []
      
      if (expectedLower.includes('what') || expectedLower.includes('where') || expectedLower.includes('how')) {
        relevantGroups.push(...wordGroups.questions)
      }
      if (expectedLower.includes('father') || expectedLower.includes('mother') || expectedLower.includes('name')) {
        relevantGroups.push(...wordGroups.family)
      }
      if (expectedLower.includes('is') || expectedLower.includes('are')) {
        relevantGroups.push(...wordGroups.verbs)
      }
      if (expectedLower.includes('your') || expectedLower.includes('my')) {
        relevantGroups.push(...wordGroups.pronouns)
      }
      
      // Add fallback groups if none match
      if (relevantGroups.length === 0) {
        relevantGroups.push(...wordGroups.common, ...wordGroups.verbs)
      }
      
      // Select distractors from relevant groups
      const maxDistractors = Math.min(5, maxWordBankSize - correctWords.length)
      let addedCount = 0
      
      for (const word of relevantGroups) {
        if (addedCount >= maxDistractors) break
        if (!usedWords.has(word.toLowerCase()) && !distractors.includes(word)) {
          distractors.push(word)
          usedWords.add(word.toLowerCase())
          addedCount++
        }
      }
      
      // Fill remaining slots with vocabulary from lesson context
      if (addedCount < maxDistractors) {
        const vocabWords = vocab
          .map(v => v.en.split(' '))
          .flat()
          .filter(word => 
            word.length > 0 && 
            !usedWords.has(word.toLowerCase()) && 
            !distractors.includes(word)
          )
          .slice(0, maxDistractors - addedCount)
        
        distractors.push(...vocabWords)
      }
      
      return distractors
    }
    
    const smartDistractors = generateSmartDistractors(correctWords, vocabularyBank)
    const allOptions = [...correctWords, ...smartDistractors]
    
    // Shuffle the word bank for display
    return allOptions.sort(() => Math.random() - 0.5)
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
    const expectedWords = expectedTranslation.split(' ').filter(word => word.length > 0)
    
    if (userOrder.length !== expectedWords.length) return

    // Extract actual words from wordKeys (remove the index suffix)
    const userWords = userOrder.map(wordKey => wordKey.split('-').slice(0, -1).join('-'))
    const userTranslation = userWords.join(' ')
    const normalizedUser = userTranslation.toLowerCase().trim()
    const normalizedExpected = expectedTranslation.toLowerCase().trim()
    
    const correct = normalizedUser === normalizedExpected
    setIsCorrect(correct)
    setShowResult(true)

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

  const expectedWordCount = expectedTranslation.split(' ').filter(word => word.length > 0).length

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