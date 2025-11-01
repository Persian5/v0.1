"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { MatchingGame } from "@/app/components/games/MatchingGame"
import { ReviewFilter } from "@/lib/services/review-session-service"
import { ReviewSessionService } from "@/lib/services/review-session-service"
import { VocabularyTrackingService } from "@/lib/services/vocabulary-tracking-service"
import { VocabularyItem } from "@/lib/types"
import { VocabularyService } from "@/lib/services/vocabulary-service"
import { WordBankService } from "@/lib/services/word-bank-service"
import { useAuth } from "@/components/auth/AuthProvider"
import { X, Heart, Target } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ReviewMatchingMarathonProps {
  filter: ReviewFilter
  onExit: () => void
}

export function ReviewMatchingMarathon({ filter, onExit }: ReviewMatchingMarathonProps) {
  const { user } = useAuth()
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([])
  const [currentPairs, setCurrentPairs] = useState<Array<{ words: Array<{ id: string; text: string; slotId: string }>; slots: Array<{ id: string; text: string }> }>>([])
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0)
  const [lives, setLives] = useState(3)
  const [round, setRound] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isGameOver, setIsGameOver] = useState(false)
  const [xpCapReached, setXpCapReached] = useState(false)
  const [xpCapShown, setXpCapShown] = useState(false)
  const roundStartTime = useRef(Date.now())

  // Fetch vocabulary based on filter
  useEffect(() => {
    const loadVocabulary = async () => {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        
        // Initialize user timezone if needed
        await ReviewSessionService.initializeUserTimezone(user.id)

        // Fetch vocabulary based on filter
        const words = await ReviewSessionService.getVocabularyForFilter(user.id, filter, 100)
        
        if (words.length === 0) {
          setIsLoading(false)
          return
        }

        // Convert to VocabularyItem[] by looking up each word
        const vocabItems: VocabularyItem[] = []
        for (const word of words) {
          const vocabItem = VocabularyService.findVocabularyById(word.vocabulary_id)
          if (vocabItem) {
            vocabItems.push(vocabItem)
          }
        }

        // Shuffle vocabulary
        const shuffled = [...vocabItems].sort(() => Math.random() - 0.5)
        setVocabulary(shuffled)
        
        // Generate initial pairs (start with 3 pairs, increase over time)
        generatePairs(shuffled, 3)
      } catch (error) {
        console.error('Error loading vocabulary:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadVocabulary()
  }, [user?.id, filter])

  // Generate pairs for a round
  const generatePairs = (vocab: VocabularyItem[], numPairs: number) => {
    const pairs: Array<{ words: Array<{ id: string; text: string; slotId: string }>; slots: Array<{ id: string; text: string }> }> = []
    
    // Use vocabulary in batches
    for (let i = 0; i < numPairs && i * 2 < vocab.length; i++) {
      const vocabItem = vocab[i % vocab.length]
      
      const words = [{
        id: `word-${vocabItem.id}-${i}`,
        text: vocabItem.finglish,
        slotId: `slot-${vocabItem.id}-${i}`
      }]
      
      const slots = [{
        id: `slot-${vocabItem.id}-${i}`,
        text: WordBankService.normalizeVocabEnglish(vocabItem.en)
      }]
      
      pairs.push({ words, slots })
    }
    
    setCurrentPairs(pairs)
  }

  // Get current round's words and slots
  const currentRound = currentPairs[currentRoundIndex]
  
  // Combine all words and slots for current round
  const currentWords = currentRound?.words.flat() || []
  const currentSlots = currentRound?.slots.flat() || []

  // Handle vocabulary tracking
  const handleVocabTrack = async (
    vocabularyId: string,
    wordText: string,
    isCorrect: boolean,
    timeSpentMs?: number
  ) => {
    if (!user?.id) return

    // Track vocabulary performance (no remediation in review mode)
    await VocabularyTrackingService.storeAttempt({
      userId: user.id,
      vocabularyId,
      wordText,
      gameType: 'review-matching-marathon',
      isCorrect,
      timeSpentMs,
      contextData: { reviewMode: true, round }
    }).catch(console.error)

    // Lose life on wrong match
    if (!isCorrect) {
      setLives(prev => {
        const newLives = prev - 1
        if (newLives <= 0) {
          setIsGameOver(true)
        }
        return newLives
      })
    }
  }

  // Handle XP start (for review mode, we handle XP ourselves)
  const handleXpStart = async (): Promise<boolean> => {
    // XP is handled in handleComplete, so return true to allow animation
    return true
  }

  // Handle round completion
  const handleComplete = async (allCorrect: boolean) => {
    if (!user?.id || !allCorrect) return

    // Award XP for completing round (1 XP per round)
    const result = await ReviewSessionService.awardReviewXp(user.id, 1)
    if (!result.awarded && result.reason === 'Daily review XP cap reached' && !xpCapShown) {
      setXpCapReached(true)
      setXpCapShown(true)
      setTimeout(() => setXpCapReached(false), 5000)
    }

    // Move to next round
    if (currentRoundIndex < currentPairs.length - 1) {
      setCurrentRoundIndex(prev => prev + 1)
      roundStartTime.current = Date.now()
    } else {
      // All rounds in current set complete - generate new set with more pairs
      const newRound = round + 1
      setRound(newRound)
      
      // Increase difficulty: more pairs per round (cap at 6 pairs)
      const numPairs = Math.min(3 + Math.floor(newRound / 2), 6)
      generatePairs(vocabulary, numPairs)
      setCurrentRoundIndex(0)
      roundStartTime.current = Date.now()
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading vocabulary...</p>
        </div>
      </div>
    )
  }

  if (vocabulary.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center max-w-md mx-auto p-6">
          <p className="text-lg font-semibold mb-2">No vocabulary available</p>
          <p className="text-muted-foreground mb-4">
            Complete some lessons first to unlock review games with your learned vocabulary!
          </p>
          <Button onClick={onExit}>Go Back</Button>
        </div>
      </div>
    )
  }

  if (!currentRound) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Lives */}
            <div className="flex items-center gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart
                  key={i}
                  className={`h-5 w-5 ${
                    i < lives ? 'text-red-500 fill-red-500' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            
            {/* Round Counter */}
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold">Round {round}</span>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={onExit}>
            <X className="h-4 w-4 mr-2" />
            Exit
          </Button>
        </div>
      </div>

      {/* XP Cap Message */}
      <AnimatePresence>
        {xpCapReached && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 text-center"
          >
            <p className="font-semibold">
              Daily review XP cap reached (1000/1000). You can continue playing, but no more XP will be awarded in review mode for today.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-lg p-8 max-w-md mx-4 text-center"
            >
              <h2 className="text-2xl font-bold mb-4">Game Over</h2>
              <p className="text-muted-foreground mb-6">
                You completed {round - 1} round{round - 1 !== 1 ? 's' : ''}!
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onExit} className="flex-1">
                  Exit
                </Button>
                <Button
                  onClick={() => {
                    // Reset game
                    setLives(3)
                    setRound(1)
                    setCurrentRoundIndex(0)
                    generatePairs(vocabulary, 3)
                    setIsGameOver(false)
                    roundStartTime.current = Date.now()
                  }}
                  className="flex-1"
                >
                  Play Again
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <MatchingGame
            words={currentWords}
            slots={currentSlots}
            points={1} // 1 XP per round in review mode
            vocabularyBank={vocabulary}
            onXpStart={handleXpStart}
            onComplete={handleComplete}
            onVocabTrack={handleVocabTrack}
          />
        </div>
      </main>
    </div>
  )
}

