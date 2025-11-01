"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { playSuccessSound } from "@/app/components/games/Flashcard"
import { ReviewFilter } from "@/lib/services/review-session-service"
import { ReviewSessionService } from "@/lib/services/review-session-service"
import { VocabularyTrackingService } from "@/lib/services/vocabulary-tracking-service"
import { VocabularyItem } from "@/lib/types"
import { VocabularyService } from "@/lib/services/vocabulary-service"
import { AudioService } from "@/lib/services/audio-service"
import { useAuth } from "@/components/auth/AuthProvider"
import { Heart, RotateCcw } from "lucide-react"

interface ReviewMemoryGameProps {
  filter: ReviewFilter
  onExit: () => void
}

interface MemoryCard {
  id: string
  vocabularyId: string
  type: 'persian' | 'english'
  text: string
  isFlipped: boolean
  isMatched: boolean
}

export function ReviewMemoryGame({ filter, onExit }: ReviewMemoryGameProps) {
  const { user } = useAuth()
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([])
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [flippedCards, setFlippedCards] = useState<string[]>([])
  const [matches, setMatches] = useState<Set<string>>(new Set())
  const [lives, setLives] = useState(3)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [xpCapReached, setXpCapReached] = useState(false)
  const [xpCapShown, setXpCapShown] = useState(false)
  const startTime = useRef(Date.now())

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
        const words = await ReviewSessionService.getVocabularyForFilter(user.id, filter, 50)
        
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

        setVocabulary(vocabItems)
      } catch (error) {
        console.error('Error loading vocabulary:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadVocabulary()
  }, [user?.id, filter])

  // Convert vocabulary to memory card pairs
  useEffect(() => {
    if (vocabulary.length === 0) return

    // Create pairs: each vocab item becomes 2 cards (Persian + English)
    const newCards: MemoryCard[] = []
    
    // Use closest even number (e.g., 9 words -> use 8, skip 1)
    const numPairs = Math.floor(vocabulary.length / 2) * 2 // Round down to even
    const vocabToUse = vocabulary.slice(0, numPairs)

    vocabToUse.forEach((vocab, index) => {
      // Persian card (shows finglish)
      newCards.push({
        id: `persian-${vocab.id}`,
        vocabularyId: vocab.id,
        type: 'persian',
        text: vocab.finglish,
        isFlipped: false,
        isMatched: false
      })

      // English card (shows English)
      newCards.push({
        id: `english-${vocab.id}`,
        vocabularyId: vocab.id,
        type: 'english',
        text: vocab.en,
        isFlipped: false,
        isMatched: false
      })
    })

    // Shuffle cards
    const shuffled = [...newCards].sort(() => Math.random() - 0.5)
    setCards(shuffled)
  }, [vocabulary])

  // Handle card flip
  const handleCardClick = (cardId: string) => {
    const card = cards.find(c => c.id === cardId)
    if (!card || card.isFlipped || card.isMatched || flippedCards.length >= 2) return

    // Don't allow clicking if 2 cards are already flipped
    if (flippedCards.length >= 2) return

    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    ))
    setFlippedCards(prev => [...prev, cardId])
  }

  // Check for match when 2 cards are flipped
  useEffect(() => {
    if (flippedCards.length !== 2) return

    const [card1Id, card2Id] = flippedCards
    const card1 = cards.find(c => c.id === card1Id)
    const card2 = cards.find(c => c.id === card2Id)

    if (!card1 || !card2) return

    const isMatch = card1.vocabularyId === card2.vocabularyId && card1.type !== card2.type

    if (isMatch) {
      // Match found!
      setMatches(prev => new Set(prev).add(card1.vocabularyId))
      setCards(prev => prev.map(c => 
        c.vocabularyId === card1.vocabularyId ? { ...c, isMatched: true, isFlipped: true } : c
      ))
      setCorrectCount(prev => prev + 1)
      setFlippedCards([])

      // Play success sound
      playSuccessSound()

      // Award XP (1 XP per correct match)
      if (user?.id) {
        ReviewSessionService.awardReviewXp(user.id, 1).then(result => {
          if (!result.awarded && result.reason === 'Daily review XP cap reached' && !xpCapShown) {
            setXpCapReached(true)
            setXpCapShown(true)
            // Hide message after 5 seconds
            setTimeout(() => setXpCapReached(false), 5000)
          }
        }).catch(console.error)

        // Track vocabulary performance (correct)
        const vocabItem = VocabularyService.findVocabularyById(card1.vocabularyId)
        if (vocabItem) {
          const timeSpentMs = Date.now() - startTime.current
          VocabularyTrackingService.storeAttempt({
            userId: user.id,
            vocabularyId: card1.vocabularyId,
            wordText: vocabItem.en,
            gameType: 'review-memory-game',
            isCorrect: true,
            timeSpentMs,
            contextData: { reviewMode: true }
          }).catch(console.error)
        }
      }
    } else {
      // Wrong match - lose a life
      setTimeout(() => {
        setCards(prev => prev.map(c => 
          flippedCards.includes(c.id) ? { ...c, isFlipped: false } : c
        ))
        setFlippedCards([])
        setWrongCount(prev => prev + 1)
        setLives(prev => {
          const newLives = prev - 1
          if (newLives <= 0) {
            setIsGameOver(true)
          }
          return newLives
        })

        // Track vocabulary performance (incorrect)
        if (user?.id && card1 && card2) {
          const vocabItem = VocabularyService.findVocabularyById(card1.vocabularyId)
          if (vocabItem) {
            const timeSpentMs = Date.now() - startTime.current
            VocabularyTrackingService.storeAttempt({
              userId: user.id,
              vocabularyId: card1.vocabularyId,
              wordText: vocabItem.en,
              gameType: 'review-memory-game',
              isCorrect: false,
              timeSpentMs,
              contextData: { reviewMode: true }
            }).catch(console.error)
          }
        }
      }, 1000) // Wait 1 second before flipping back
    }
  }, [flippedCards, cards, user?.id, xpCapShown])

  // Check if game is won (all cards matched)
  useEffect(() => {
    if (cards.length > 0 && matches.size === cards.length / 2) {
      setIsGameOver(true)
    }
  }, [matches, cards.length])

  // Grid layout: 4x2 for 8 words (4 pairs)
  const gridCols = 4
  const gridRows = 2

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
            
            {/* Stats */}
            <div className="text-sm text-muted-foreground">
              Correct: <span className="font-semibold text-green-600">{correctCount}</span> | 
              Wrong: <span className="font-semibold text-red-600">{wrongCount}</span>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={onExit}>
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
              <h2 className="text-2xl font-bold mb-4">
                {lives > 0 ? '🎉 Great Job!' : 'Game Over'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {lives > 0 
                  ? `You matched all pairs! Correct: ${correctCount}, Wrong: ${wrongCount}`
                  : `You ran out of lives. Correct: ${correctCount}, Wrong: ${wrongCount}`
                }
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onExit} className="flex-1">
                  Exit
                </Button>
                <Button
                  onClick={() => {
                    // Reset game
                    setLives(3)
                    setCorrectCount(0)
                    setWrongCount(0)
                    setMatches(new Set())
                    setFlippedCards([])
                    setCards(prev => prev.map(c => ({ ...c, isFlipped: false, isMatched: false })))
                    setIsGameOver(false)
                    startTime.current = Date.now()
                  }}
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Play Again
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Board */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <h1 className="text-2xl font-bold text-center mb-6">Memory Game</h1>
          
          {/* Grid: Dynamic columns based on number of pairs */}
          <div className={`grid gap-3 max-w-md mx-auto ${
            gridCols === 4 ? 'grid-cols-4' : 'grid-cols-6'
          }`}>
            {cards.map((card) => (
              <motion.button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                disabled={card.isFlipped || card.isMatched || flippedCards.length >= 2}
                className={`
                  aspect-square rounded-lg border-2 transition-all
                  ${card.isMatched 
                    ? 'bg-green-100 border-green-500 cursor-default' 
                    : card.isFlipped
                      ? 'bg-white border-primary'
                      : 'bg-gray-200 border-gray-300 hover:border-gray-400 cursor-pointer'
                  }
                  ${card.isMatched || card.isFlipped ? '' : 'hover:scale-105'}
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                whileHover={!card.isFlipped && !card.isMatched ? { scale: 1.05 } : {}}
                whileTap={!card.isFlipped && !card.isMatched ? { scale: 0.95 } : {}}
              >
                {card.isFlipped || card.isMatched ? (
                  <div className="flex items-center justify-center h-full text-sm font-semibold">
                    {card.text}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-2xl">
                    ?
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

