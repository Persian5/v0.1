"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { MatchingGame } from "@/app/components/games/MatchingGame"
import { ReviewFilter } from "@/lib/services/review-session-service"
import { ReviewSessionService } from "@/lib/services/review-session-service"
import { VocabularyTrackingService } from "@/lib/services/vocabulary-tracking-service"
import { VocabularyItem } from "@/lib/types"
import { VocabularyService } from "@/lib/services/vocabulary-service"
import { GrammarService } from "@/lib/services/grammar-service"
import { WordBankService } from "@/lib/services/word-bank-service"
import { useAuth } from "@/components/auth/AuthProvider"
import { X, Heart, Target, Star } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useSmartXp } from "@/hooks/use-smart-xp"
import { shuffle } from "@/lib/utils"

interface ReviewMatchingMarathonProps {
  filter: ReviewFilter
  onExit: () => void
}

export function ReviewMatchingMarathon({ filter, onExit }: ReviewMatchingMarathonProps) {
  const { user } = useAuth()
  const { xp } = useSmartXp() // Get current XP for display
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([])
  const [currentPairs, setCurrentPairs] = useState<Array<{ words: Array<{ id: string; text: string; slotId: string }>; slots: Array<{ id: string; text: string }> }>>([])
  const [nextRoundPairs, setNextRoundPairs] = useState<Array<{ words: Array<{ id: string; text: string; slotId: string }>; slots: Array<{ id: string; text: string }> }>>([])
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0)
  const [lives, setLives] = useState(3)
  const [round, setRound] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isGameOver, setIsGameOver] = useState(false)
  const [xpCapReached, setXpCapReached] = useState(false)
  const [xpCapShown, setXpCapShown] = useState(false)
  const roundStartTime = useRef(Date.now())
  const vocabularyIndexRef = useRef(0) // Track current position in vocabulary array

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
          // Use unified helper for vocabulary resolution
          const vocabItem = ReviewSessionService.toVocabularyItem(word);
          
          if (vocabItem) {
            vocabItems.push(vocabItem)
          }
        }

        // Shuffle vocabulary using proper Fisher-Yates algorithm
        const shuffled = shuffle(vocabItems)
        setVocabulary(shuffled)
        vocabularyIndexRef.current = 0 // Reset index when vocabulary loads
        
        // CRITICAL: Pre-generate initial pairs BEFORE setIsLoading(false)
        // This ensures arrays are ready immediately when component renders MatchingGame
        generatePairsFromVocab(shuffled, 2)
      } catch (error) {
        console.error('Error loading vocabulary:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadVocabulary()
  }, [user?.id, filter])

  // Internal helper: Generate pairs from specific vocabulary array
  const generatePairsFromVocab = (vocab: VocabularyItem[], numPairs: number) => {
    if (vocab.length === 0) return
    
    // Ensure minimum 2 pairs
    const actualNumPairs = Math.max(2, Math.min(numPairs, vocab.length))
    const pairs: Array<{ words: Array<{ id: string; text: string; slotId: string }>; slots: Array<{ id: string; text: string }> }> = []
    
    // Check if we need to reshuffle (vocabulary exhausted)
    if (vocabularyIndexRef.current + actualNumPairs > vocab.length) {
      // Reshuffle vocabulary and reset index
      const reshuffled = shuffle([...vocab])
      setVocabulary(reshuffled)
      vocabularyIndexRef.current = 0
      // Use reshuffled vocab for this round
      return generatePairsFromVocab(reshuffled, numPairs)
    }
    
    // Use vocabulary sequentially from current index
    for (let i = 0; i < actualNumPairs; i++) {
      const vocabIndex = (vocabularyIndexRef.current + i) % vocab.length
      const vocabItem = vocab[vocabIndex]
      
      const words = [{
        id: `word-${vocabItem.id}-${round}-${i}`,
        text: vocabItem.finglish,
        slotId: `slot-${vocabItem.id}-${round}-${i}`
      }]
      
      const slots = [{
        id: `slot-${vocabItem.id}-${round}-${i}`,
        text: WordBankService.normalizeVocabEnglish(vocabItem.en)
      }]
      
      pairs.push({ words, slots })
    }
    
    // Advance vocabulary index for next round
    vocabularyIndexRef.current = (vocabularyIndexRef.current + actualNumPairs) % vocab.length
    
    // Pre-shuffle words and slots BEFORE setting state
    // This prevents visible shuffle in MatchingGame component
    const allWords = pairs.flatMap(p => p.words)
    const allSlots = pairs.flatMap(p => p.slots)
    const shuffledWords = shuffle(allWords)
    const shuffledSlots = shuffle(allSlots)
    
    // Set as single round (not array of rounds) with pre-shuffled arrays
    setCurrentPairs([{ words: shuffledWords, slots: shuffledSlots }])
    setCurrentRoundIndex(0) // Reset to first round
  }

  // Public function: Generate pairs using current vocabulary state
  const generatePairs = (numPairs: number) => {
    const currentVocab = vocabulary.length > 0 ? vocabulary : []
    if (currentVocab.length === 0) return
    generatePairsFromVocab(currentVocab, numPairs)
  }

  // Get current round's words and slots - arrays are already pre-shuffled
  const currentRound = currentPairs[currentRoundIndex]
  const currentWords = currentRound?.words || []
  const currentSlots = currentRound?.slots || []
  
  // Pre-generate next round pairs WHILE user is playing current round
  // This ensures smooth transition with no loading state
  useEffect(() => {
    if (currentRound && vocabulary.length > 0 && !isGameOver) {
      const nextRound = round + 1
      const nextNumPairs = Math.min(2 + Math.floor(nextRound / 2), 8)
      
      // Pre-generate next round pairs in background (store in nextRoundPairs, don't overwrite current)
      const timer = setTimeout(() => {
        const vocab = vocabulary.length > 0 ? vocabulary : []
        if (vocab.length === 0) return
        
        // Generate pairs for next round
        const actualNumPairs = Math.max(2, Math.min(nextNumPairs, vocab.length))
        const pairs: Array<{ words: Array<{ id: string; text: string; slotId: string }>; slots: Array<{ id: string; text: string }> }> = []
        
        // Use vocabulary sequentially
        const startIndex = (vocabularyIndexRef.current + actualNumPairs) % vocab.length
        for (let i = 0; i < actualNumPairs; i++) {
          const vocabIndex = (startIndex + i) % vocab.length
          const vocabItem = vocab[vocabIndex]
          
          pairs.push({
            words: [{
              id: `word-${vocabItem.id}-${nextRound}-${i}`,
              text: vocabItem.finglish,
              slotId: `slot-${vocabItem.id}-${nextRound}-${i}`
            }],
            slots: [{
              id: `slot-${vocabItem.id}-${nextRound}-${i}`,
              text: WordBankService.normalizeVocabEnglish(vocabItem.en)
            }]
          })
        }
        
        // Pre-shuffle and store in nextRoundPairs
        const allWords = pairs.flatMap(p => p.words)
        const allSlots = pairs.flatMap(p => p.slots)
        const shuffledWords = shuffle(allWords)
        const shuffledSlots = shuffle(allSlots)
        
        setNextRoundPairs([{ words: shuffledWords, slots: shuffledSlots }])
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [currentRound, round, vocabulary.length, isGameOver])

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

  // Handle round completion - XP awarded per round (not per match)
  const handleComplete = async (allCorrect: boolean) => {
    if (!user?.id || !allCorrect) return

    // Award XP for completing round (1 XP per round completion)
    const result = await ReviewSessionService.awardReviewXp(user.id, 1, {
      gameType: 'matching-marathon',
      actionId: `round-${round}-${Date.now()}`,
      metadata: {
        round
      }
    })
    if (!result.awarded && result.reason === 'Daily review XP cap reached' && !xpCapShown) {
      setXpCapReached(true)
      setXpCapShown(true)
      setTimeout(() => setXpCapReached(false), 5000)
    }

    // Advance to next round - use pre-generated pairs if available
    const newRound = round + 1
    
    // If next round pairs are ready, use them (instant transition, no loading)
    if (nextRoundPairs.length > 0) {
      setCurrentPairs(nextRoundPairs)
      setNextRoundPairs([]) // Clear for next pre-generation
      vocabularyIndexRef.current = (vocabularyIndexRef.current + Math.min(2 + Math.floor(round / 2), 8)) % vocabulary.length
    } else {
      // Fallback: generate synchronously (should be rare, only if pre-generation failed)
      const nextNumPairs = Math.min(2 + Math.floor(newRound / 2), 8)
      generatePairs(nextNumPairs)
    }
    
    setRound(newRound)
    roundStartTime.current = Date.now()
  }

  // Only show "no vocabulary" message if vocabulary is truly empty AND we're not loading
  if (!isLoading && vocabulary.length === 0) {
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

  // Don't render MatchingGame until arrays are ready (but no loading spinner - arrays generate in background)
  // If arrays aren't ready yet, render empty (component will auto-update when arrays are ready)
  if (!currentRound || currentWords.length === 0 || currentSlots.length === 0) {
    return null // Render nothing, component will update when arrays are ready
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* XP Display */}
            <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-lg border border-accent/20">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-semibold text-primary">{xp.toLocaleString()}</span>
            </div>
            
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
                    vocabularyIndexRef.current = 0 // Reset vocabulary index
                    // Reshuffle vocabulary for fresh start
                    const reshuffled = shuffle([...vocabulary])
                    setVocabulary(reshuffled)
                    generatePairsFromVocab(reshuffled, 2) // Start with 2 pairs
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
            key={`round-${round}`} // Force remount on round change to reset internal state
            words={currentWords}
            slots={currentSlots}
            points={1} // 1 XP per round in review mode
            vocabularyBank={vocabulary}
            onXpStart={handleXpStart}
            onComplete={handleComplete}
            onVocabTrack={handleVocabTrack}
            preShuffled={true} // Arrays already shuffled in generatePairsFromVocab
          />
        </div>
      </main>
    </div>
  )
}

