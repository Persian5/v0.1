"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { motion, AnimatePresence } from "framer-motion"
import { playSuccessSound } from "@/app/components/games/Flashcard"
import { ReviewFilter } from "@/lib/services/review-session-service"
import { ReviewSessionService } from "@/lib/services/review-session-service"
import { VocabularyTrackingService } from "@/lib/services/vocabulary-tracking-service"
import { VocabularyItem } from "@/lib/types"
import { VocabularyService } from "@/lib/services/vocabulary-service"
import { AudioService } from "@/lib/services/audio-service"
import { useAuth } from "@/components/auth/AuthProvider"
import { Heart, RotateCcw, Star, X, TrendingUp, TrendingDown, Home, BookOpen } from "lucide-react"
import { useSmartXp } from "@/hooks/use-smart-xp"
import Link from "next/link"
import { shuffle } from "@/lib/utils"

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
  const { xp } = useSmartXp() // Get current XP for display
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([])
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [flippedCards, setFlippedCards] = useState<string[]>([])
  const [matches, setMatches] = useState<Set<string>>(new Set())
  
  // Round-based state
  const [currentRound, setCurrentRound] = useState(1)
  const [roundPairs, setRoundPairs] = useState(2) // Start with 2 pairs, max 8
  const [lives, setLives] = useState(3) // Lives reset each round
  const [correctCount, setCorrectCount] = useState(0) // Session-wide
  const [wrongCount, setWrongCount] = useState(0) // Session-wide
  
  // Preview phase state
  const [isPreviewPhase, setIsPreviewPhase] = useState(true)
  const [previewCountdown, setPreviewCountdown] = useState<number | null>(null)
  const [isGameActive, setIsGameActive] = useState(false)
  
  const [isGameOver, setIsGameOver] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [xpCapReached, setXpCapReached] = useState(false)
  const [xpCapShown, setXpCapShown] = useState(false)
  const startTime = useRef(Date.now())
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

  // Initialize a new round: randomly select vocabulary and create cards
  const initializeRound = useCallback(() => {
    if (vocabulary.length === 0) return

    // Determine number of pairs for this round (2 → 3 → ... → 8, cap at 8)
    const pairsForRound = Math.min(roundPairs, 8)
    
    // Randomly select vocabulary items for this round
    const shuffledVocab = shuffle(vocabulary)
    const vocabToUse = shuffledVocab.slice(0, pairsForRound)

    // Create pairs: each vocab item becomes 2 cards (Persian + English)
    const newCards: MemoryCard[] = []
    
    vocabToUse.forEach((vocab) => {
      // Persian card (shows finglish)
      newCards.push({
        id: `persian-${vocab.id}-${Date.now()}-${Math.random()}`,
        vocabularyId: vocab.id,
        type: 'persian',
        text: vocab.finglish,
        isFlipped: true, // Start flipped for preview
        isMatched: false
      })

      // English card (shows English)
      newCards.push({
        id: `english-${vocab.id}-${Date.now()}-${Math.random()}`,
        vocabularyId: vocab.id,
        type: 'english',
        text: vocab.en,
        isFlipped: true, // Start flipped for preview
        isMatched: false
      })
    })

    // Shuffle cards using Fisher-Yates for better randomization
    setCards(shuffle(newCards))
    setFlippedCards([])
    setMatches(new Set())
    setLives(3) // Reset lives for new round
    // Don't reset isGameOver here - only reset when restarting full game
    roundStartTime.current = Date.now()
    
    // Start preview phase
    setIsPreviewPhase(true)
    setIsGameActive(false)
  }, [vocabulary, roundPairs])

  // Preview countdown effect: 3... 2... 1... Start (3 seconds total)
  useEffect(() => {
    if (!isPreviewPhase || cards.length === 0) {
      setPreviewCountdown(null)
      return
    }

    // Start countdown immediately
    setPreviewCountdown(3)
    
    let count = 3
    const countdownInterval = setInterval(() => {
      count -= 1
      
      if (count <= 0) {
        clearInterval(countdownInterval)
        setPreviewCountdown(0) // Show "Start!"
        
        // After showing "Start!", flip cards and start game
        setTimeout(() => {
          setCards(prevCards => prevCards.map(c => ({ ...c, isFlipped: false })))
          setIsPreviewPhase(false)
          setIsGameActive(true)
          setPreviewCountdown(null)
        }, 500) // Brief delay after "Start!"
      } else {
        setPreviewCountdown(count)
      }
    }, 1000)

    return () => {
      clearInterval(countdownInterval)
    }
  }, [isPreviewPhase, cards.length])

  // Initialize round when vocabulary loads or round changes
  useEffect(() => {
    if (vocabulary.length === 0) return
    if (!isPreviewPhase) return // Only initialize during preview phase
    if (cards.length > 0) return // Already have cards
    
    // Use a small delay to ensure state is updated
    const timeoutId = setTimeout(() => {
      initializeRound()
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [vocabulary.length, currentRound, isPreviewPhase, initializeRound])

  // Handle restart game (full reset to round 1)
  const handleRestart = useCallback(() => {
    // CRITICAL: Reset isGameOver FIRST to hide modal immediately
    setIsGameOver(false)
    
    // Reset state synchronously to prevent flash
    setCurrentRound(1)
    setRoundPairs(2)
    setCorrectCount(0)
    setWrongCount(0)
    setFlippedCards([])
    setMatches(new Set())
    setLives(3)
    setIsPreviewPhase(true)
    setIsGameActive(false)
    startTime.current = Date.now()
    
    // Initialize new round immediately (prevents empty card grid flash)
    // Don't clear cards first - let initializeRound replace them
    if (vocabulary.length > 0) {
      // Inline initialize logic for immediate execution
      const pairsForRound = 2 // Starting pairs
      const shuffledVocab = shuffle(vocabulary)
      const vocabToUse = shuffledVocab.slice(0, pairsForRound)
      
      const newCards: MemoryCard[] = []
      vocabToUse.forEach((vocab) => {
        newCards.push({
          id: `persian-${vocab.id}-${Date.now()}-${Math.random()}`,
          vocabularyId: vocab.id,
          type: 'persian',
          text: vocab.finglish,
          isFlipped: true,
          isMatched: false
        })
        newCards.push({
          id: `english-${vocab.id}-${Date.now()}-${Math.random()}`,
          vocabularyId: vocab.id,
          type: 'english',
          text: vocab.en,
          isFlipped: true,
          isMatched: false
        })
      })
      
      // Shuffle cards using Fisher-Yates algorithm
      setCards(shuffle(newCards))
      roundStartTime.current = Date.now()
    }
  }, [vocabulary])

  // Handle card flip (only during active game, not preview)
  const handleCardClick = (cardId: string) => {
    if (!isGameActive || isPreviewPhase) return // Don't allow clicks during preview
    
    const card = cards.find(c => c.id === cardId)
    if (!card || card.isFlipped || card.isMatched || flippedCards.length >= 2) return

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

        // DON'T track incorrect attempts for memory game
        // Users are guessing/finding pairs, not demonstrating knowledge
        // Only track correct matches (when they successfully match a pair)
      }, 1000) // Wait 1 second before flipping back
    }
  }, [flippedCards, cards, user?.id, xpCapShown])

  // Check if round is complete (all pairs matched) - auto-advance to next round
  useEffect(() => {
    if (!isGameActive || isPreviewPhase) return
    if (cards.length === 0) return
    if (isGameOver) return // Don't advance if game is over (lives lost)
    
    const expectedPairs = cards.length / 2
    if (matches.size === expectedPairs) {
      // Round complete! Auto-advance to next round (no game over summary, no countdown on completion)
      setIsGameActive(false) // Stop game first
      
      // Update round and pairs, then start next round with countdown
      setCurrentRound(prev => prev + 1)
      setRoundPairs(prev => Math.min(prev + 1, 8)) // Increment pairs, cap at 8
      setCards([]) // Clear cards to trigger initialization
      setIsPreviewPhase(true) // Start preview phase for next round (triggers countdown)
      // NOTE: isGameOver stays false - only becomes true when lives = 0
    }
  }, [matches, cards.length, isGameActive, isPreviewPhase, isGameOver])

  // Check if game over (lives = 0)
  useEffect(() => {
    if (lives <= 0 && isGameActive) {
      setIsGameOver(true)
      setIsGameActive(false)
    }
  }, [lives, isGameActive])

  // Calculate responsive grid layout based on number of pairs
  const pairsCount = cards.length / 2
  const getGridCols = () => {
    if (pairsCount <= 2) return 2 // 2 pairs: 2x2
    if (pairsCount <= 4) return 4 // 4 pairs: 4x2
    if (pairsCount <= 6) return 6 // 6 pairs: 6x2
    return 4 // 8 pairs: 4x4
  }
  const gridCols = getGridCols()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F3]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#10B981] border-t-transparent mx-auto mb-4" />
          <p className="text-[#1E293B]">Loading vocabulary...</p>
        </div>
      </div>
    )
  }

  if (vocabulary.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F3]">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg border-2 border-[#10B981]/30 shadow-sm">
          <p className="text-lg font-semibold mb-2 text-[#1E293B]">No vocabulary available</p>
          <p className="text-gray-600 mb-4">
            Complete some lessons first to unlock review games with your learned vocabulary!
          </p>
          <Button onClick={onExit} className="bg-[#10B981] hover:bg-[#059669] text-white">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF8F3]">
      {/* Header - Compact on mobile */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b-2 border-[#10B981] px-3 sm:px-4 py-2 sm:py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* XP Display */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 bg-[#10B981]/10 rounded-lg border border-[#10B981]/30">
              <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#10B981]" />
              <span className="text-xs sm:text-sm font-semibold text-[#1E293B]">{xp.toLocaleString()}</span>
            </div>
            
            {/* Lives */}
            <div className="flex items-center gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart
                  key={i}
                  className={`h-4 w-4 sm:h-5 sm:w-5 ${
                    i < lives ? 'text-[#E63946] fill-[#E63946]' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={onExit} className="h-8 sm:h-9 text-[#1E293B] hover:bg-[#10B981]/10">
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Exit</span>
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
            className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 px-3 sm:px-4 py-2 text-center text-xs sm:text-sm"
          >
            <p className="font-semibold">
              Daily review XP cap reached (1000/1000). You can continue playing, but no more XP will be awarded in review mode for today.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Dialog */}
      <Dialog open={isGameOver} onOpenChange={(open) => !open && setIsGameOver(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl sm:text-3xl font-bold text-center">
              Game Over
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              You reached Round {currentRound}!<br />
              Correct: {correctCount} | Wrong: {wrongCount}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 pt-4">
            <Button
              onClick={handleRestart}
              className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <RotateCcw className="h-4 w-4" />
              Play Again
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                onClick={onExit} 
                className="gap-2 border-primary text-primary hover:bg-primary/10"
              >
                <BookOpen className="h-4 w-4" />
                Review Games
              </Button>
              <Link href="/" className="contents">
                <Button 
                  variant="outline" 
                  className="w-full gap-2 border-primary text-primary hover:bg-primary/10"
                >
                  <Home className="h-4 w-4" />
                  Home
                </Button>
              </Link>
            </div>
            <Link href="/modules" className="contents">
              <Button 
                variant="outline" 
                className="w-full gap-2 border-primary text-primary hover:bg-primary/10"
              >
                <BookOpen className="h-4 w-4" />
                Continue Lessons
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content - Responsive Layout */}
      <main className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full">
        {/* Game Area - Mobile: Full width, Desktop: ~70% */}
        <div className="flex-1 lg:w-[70%] lg:border-r-2 lg:border-[#10B981]/20 p-4 sm:p-6">
          <div className="w-full max-w-4xl mx-auto">
            <h1 className="text-xl sm:text-2xl font-bold text-center mb-2 text-[#1E293B]">Memory Game</h1>
            
            {/* Round Indicator */}
            <div className="text-center mb-4 sm:mb-6">
              <span className="text-lg sm:text-xl font-semibold text-[#1E293B]">
                Round {currentRound}
              </span>
            </div>

            {/* Game Board Container - Relative positioning for countdown overlay */}
            <div className="relative">
              {/* Preview Countdown Overlay - Only on game container */}
              {isPreviewPhase && previewCountdown !== null && (
                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                  <motion.div
                    key={previewCountdown}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="text-6xl sm:text-8xl font-bold text-[#1E293B] drop-shadow-lg bg-white/80 rounded-full w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center border-4 border-[#10B981]"
                  >
                    {previewCountdown === 0 ? 'Start!' : previewCountdown}
                  </motion.div>
                </div>
              )}
              
              {/* Grid: Dynamic columns based on number of pairs */}
              <div className={`grid gap-2 sm:gap-3 mx-auto relative ${
                gridCols === 2 ? 'grid-cols-2 max-w-xs' :
                gridCols === 4 ? 'grid-cols-4 max-w-lg' :
                gridCols === 6 ? 'grid-cols-6 max-w-2xl' :
                'grid-cols-4 max-w-2xl'
              }`}>
              {cards.map((card) => {
                // Dynamic card sizing: larger cards for 6+ pairs so text fits better
                const cardSizeClass = pairsCount >= 6 
                  ? 'min-h-[100px] sm:min-h-[120px]' // Larger for 6+ pairs
                  : '' // Normal size for 2-4 pairs
                
                return (
                  <motion.button
                    key={card.id}
                    onClick={() => handleCardClick(card.id)}
                    disabled={!isGameActive || isPreviewPhase || card.isFlipped || card.isMatched || flippedCards.length >= 2}
                    className={`
                      aspect-square rounded-lg border-2 transition-all shadow-sm ${cardSizeClass}
                      ${isPreviewPhase
                        ? 'bg-white border-[#10B981]' // Preview: all cards face-up
                        : card.isMatched 
                          ? 'bg-[#10B981]/10 border-[#10B981] cursor-default' 
                          : card.isFlipped
                            ? 'bg-white border-[#10B981]'
                            : 'bg-gray-200 border-gray-300 hover:border-[#10B981]/50 cursor-pointer'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                    whileHover={!card.isFlipped && !card.isMatched && isGameActive && !isPreviewPhase ? { scale: 1.05 } : {}}
                    whileTap={!card.isFlipped && !card.isMatched && isGameActive && !isPreviewPhase ? { scale: 0.95 } : {}}
                  >
                    {(card.isFlipped || card.isMatched || isPreviewPhase) ? (
                      <div className={`flex items-center justify-center h-full font-semibold text-[#1E293B] px-1 text-center ${
                        pairsCount >= 6 ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
                      }`}>
                        {card.text}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-xl sm:text-2xl text-gray-400">
                        ?
                      </div>
                    )}
                  </motion.button>
                )
              })}
              </div>
            </div>
          </div>
          
          {/* Stats - Mobile: Below game */}
          <div className="lg:hidden mt-6 pt-6 border-t-2 border-[#10B981]/20">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border-2 border-[#10B981]/30 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-5 w-5 text-[#10B981]" />
                  <span className="text-sm font-medium text-[#1E293B]">Correct</span>
                </div>
                <p className="text-2xl font-bold text-[#10B981]">{correctCount}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border-2 border-[#E63946]/30 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-5 w-5 text-[#E63946]" />
                  <span className="text-sm font-medium text-[#1E293B]">Wrong</span>
                </div>
                <p className="text-2xl font-bold text-[#E63946]">{wrongCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Sidebar - Desktop: Right sidebar ~30% */}
        <div className="hidden lg:flex lg:w-[30%] lg:flex-col lg:bg-white/50 lg:p-6 lg:space-y-6">
          {/* XP Badge */}
          <div className="bg-[#10B981]/10 rounded-lg p-4 border-2 border-[#10B981]/30">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-[#10B981]" />
              <span className="text-sm font-medium text-[#1E293B]">Total XP</span>
            </div>
            <p className="text-3xl font-bold text-[#1E293B]">{xp.toLocaleString()}</p>
          </div>

          {/* Lives */}
          <div className="bg-white rounded-lg p-4 border-2 border-[#E63946]/30 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-[#1E293B]">Lives</span>
            </div>
            <div className="flex items-center gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart
                  key={i}
                  className={`h-8 w-8 ${
                    i < lives ? 'text-[#E63946] fill-[#E63946]' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white rounded-lg p-4 border-2 border-[#10B981]/30 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-5 w-5 text-[#10B981]" />
                <span className="text-sm font-medium text-[#1E293B]">Correct</span>
              </div>
              <p className="text-3xl font-bold text-[#10B981]">{correctCount}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border-2 border-[#E63946]/30 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-5 w-5 text-[#E63946]" />
                <span className="text-sm font-medium text-[#1E293B]">Wrong</span>
              </div>
              <p className="text-3xl font-bold text-[#E63946]">{wrongCount}</p>
            </div>
          </div>

          {/* Exit Button */}
          <Button 
            variant="outline" 
            onClick={onExit} 
            className="w-full border-2 border-[#10B981] text-[#10B981] hover:bg-[#10B981] hover:text-white"
          >
            Exit Game
          </Button>
        </div>
      </main>
    </div>
  )
}

