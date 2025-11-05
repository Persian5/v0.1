"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { AudioMeaning } from "@/app/components/games/AudioMeaning"
import { ReviewFilter } from "@/lib/services/review-session-service"
import { ReviewSessionService } from "@/lib/services/review-session-service"
import { VocabularyTrackingService } from "@/lib/services/vocabulary-tracking-service"
import { VocabularyItem } from "@/lib/types"
import { VocabularyService } from "@/lib/services/vocabulary-service"
import { WordBankService } from "@/lib/services/word-bank-service"
import { useAuth } from "@/components/auth/AuthProvider"
import { X, TrendingUp, TrendingDown, Star, Heart, RotateCcw, Home, BookOpen } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useSmartXp } from "@/hooks/use-smart-xp"
import Link from "next/link"
import { shuffle } from "@/lib/utils"

interface ReviewAudioDefinitionsProps {
  filter: ReviewFilter
  onExit: () => void
}

export function ReviewAudioDefinitions({ filter, onExit }: ReviewAudioDefinitionsProps) {
  const { user } = useAuth()
  const { xp } = useSmartXp() // Get current XP for display
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [lives, setLives] = useState(3) // 3 lives system
  const [isGameOver, setIsGameOver] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [xpCapReached, setXpCapReached] = useState(false)
  const [xpCapShown, setXpCapShown] = useState(false)
  const [lastVocabId, setLastVocabId] = useState<string | null>(null) // Track last vocab to avoid duplicates
  const gameStartTime = useRef(Date.now())

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

        // Shuffle vocabulary for variety - ensure never same word twice in a row
        // Use proper Fisher-Yates shuffle algorithm (not broken .sort())
        const shuffled = shuffle([...vocabItems])
        
        // If we have a previous vocab, ensure first word is different
        if (lastVocabId && shuffled.length > 1 && shuffled[0].id === lastVocabId) {
          // Swap first with a random other position
          const swapIndex = Math.floor(Math.random() * (shuffled.length - 1)) + 1
          ;[shuffled[0], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[0]]
        }
        
        setVocabulary(shuffled)
        setCurrentIndex(0)
        setLives(3) // Reset lives on new session
        setIsGameOver(false)
        setCorrectCount(0)
        setWrongCount(0)
      } catch (error) {
        console.error('Error loading vocabulary:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadVocabulary()
  }, [user?.id, filter])

  // Get current vocabulary item
  const currentVocab = vocabulary[currentIndex]

  // Generate distractors for current word AND build complete vocabularyBank
  const distractors = useRef<string[]>([])
  const completeVocabularyBank = useRef<VocabularyItem[]>([])
  
  // Ensure vocabularyBank always has current vocab (defensive)
  useEffect(() => {
    if (currentVocab && completeVocabularyBank.current.length === 0) {
      // If bank is empty but we have current vocab, add it immediately
      completeVocabularyBank.current = [currentVocab]
    }
  }, [currentVocab])
  
  useEffect(() => {
    if (!currentVocab || vocabulary.length === 0) return

    // Get all vocabulary for distractor generation
    const allVocab = VocabularyService.getAllCurriculumVocabulary()
    
    // Generate semantic distractors using WordBankService logic
    const correctItem = {
      vocabularyId: currentVocab.id,
      wordText: WordBankService.normalizeVocabEnglish(currentVocab.en),
      isPhrase: currentVocab.en.split(' ').length > 1,
      semanticGroup: currentVocab.semanticGroup,
      isCorrect: true
    }

    // Generate 3 distractors
    const distractorItems = WordBankService.generateSemanticDistractors(
      [correctItem],
      allVocab,
      3
    )

    // Convert to vocabulary IDs AND collect all vocab items for complete bank
    // CRITICAL: Use vocabularyId directly from distractorItems (already includes ID)
    const distractorIds: string[] = []
    const vocabItemsForBank = new Map<string, VocabularyItem>()
    
    // Add current vocab to bank FIRST (always include it)
    vocabItemsForBank.set(currentVocab.id, currentVocab)
    
    for (const distractor of distractorItems) {
      // Use vocabularyId directly (more reliable than text matching)
      if (distractor.vocabularyId && distractor.vocabularyId !== currentVocab.id) {
        distractorIds.push(distractor.vocabularyId)
        
        // Look up vocab item by ID (defensive - should always exist)
        const vocab = VocabularyService.findVocabularyById(distractor.vocabularyId)
        if (vocab) {
          vocabItemsForBank.set(vocab.id, vocab)
        } else {
          console.warn(`⚠️ Distractor vocabularyId not found: ${distractor.vocabularyId}`)
        }
      }
    }

    // If we don't have enough distractors, fill with random vocab from filtered set
    while (distractorIds.length < 3 && vocabulary.length > 1) {
      const randomVocab = vocabulary[Math.floor(Math.random() * vocabulary.length)]
      if (randomVocab.id !== currentVocab.id && !distractorIds.includes(randomVocab.id)) {
        distractorIds.push(randomVocab.id)
        vocabItemsForBank.set(randomVocab.id, randomVocab) // Add to complete bank
      }
    }

    distractors.current = distractorIds.slice(0, 3)
    completeVocabularyBank.current = Array.from(vocabItemsForBank.values())
  }, [currentVocab, vocabulary])

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
      gameType: 'review-audio-definitions',
      isCorrect,
      timeSpentMs,
      contextData: { reviewMode: true }
    }).catch(console.error)

    // Update stats and handle lives
    if (isCorrect) {
      setCorrectCount(prev => prev + 1)
      
      // Award XP (1 XP per correct answer)
      const result = await ReviewSessionService.awardReviewXp(user.id, 1)
      if (!result.awarded && result.reason === 'Daily review XP cap reached' && !xpCapShown) {
        setXpCapReached(true)
        setXpCapShown(true)
        setTimeout(() => setXpCapReached(false), 5000)
      }
      
      // Auto-advance immediately after correct (handled by handleContinue)
    } else {
      // Wrong answer - lose a life
      setWrongCount(prev => prev + 1)
      
      setLives(prev => {
        const newLives = prev - 1
        if (newLives <= 0) {
          setIsGameOver(true)
        }
        return newLives
      })
      
      // Stay on same question - don't advance (AudioMeaning will reset its state)
    }
  }

  // Handle XP start (for review mode, we handle XP ourselves)
  const handleXpStart = async (): Promise<boolean> => {
    // XP is handled in handleVocabTrack, so return true to allow animation
    return true
  }
  
  // Handle restart game
  const handleRestart = () => {
    // Reshuffle vocabulary using proper Fisher-Yates shuffle
    const shuffled = shuffle([...vocabulary])
    
    // Ensure first word is different from last (if we had one)
    if (lastVocabId && shuffled.length > 1 && shuffled[0].id === lastVocabId) {
      const swapIndex = Math.floor(Math.random() * (shuffled.length - 1)) + 1
      ;[shuffled[0], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[0]]
    }
    
    setVocabulary(shuffled)
    setCurrentIndex(0)
    setLives(3)
    setIsGameOver(false)
    setCorrectCount(0)
    setWrongCount(0)
    setLastVocabId(null)
    gameStartTime.current = Date.now()
  }

  // Handle continue (auto-advance to next question) - ONLY called on correct answer
  const handleContinue = () => {
    if (isGameOver) return // Don't advance if game over
    
    // Store current vocab ID to avoid showing it next
    const currentVocabId = vocabulary[currentIndex]?.id
    setLastVocabId(currentVocabId)
    
    // Find next available vocab (never same as current)
    let nextIndex = currentIndex + 1
    
    // Find next vocab that's different from current
    while (nextIndex < vocabulary.length && vocabulary[nextIndex]?.id === currentVocabId) {
      nextIndex++
    }
    
    if (nextIndex < vocabulary.length) {
      setCurrentIndex(nextIndex)
    } else {
      // Reached end - shuffle and start over, but skip last vocab
      // Use proper Fisher-Yates shuffle algorithm (not broken .sort())
      const shuffled = shuffle([...vocabulary])
      
      // Ensure first word is different from last
      if (shuffled.length > 1 && shuffled[0].id === currentVocabId) {
        const swapIndex = Math.floor(Math.random() * (shuffled.length - 1)) + 1
        ;[shuffled[0], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[0]]
      }
      
      setVocabulary(shuffled)
      setCurrentIndex(0)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F3]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E63946] border-t-transparent mx-auto mb-4" />
          <p className="text-[#1E293B]">Loading vocabulary...</p>
        </div>
      </div>
    )
  }

  if (vocabulary.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F3]">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg border-2 border-[#E63946]/30 shadow-sm">
          <p className="text-lg font-semibold mb-2 text-[#1E293B]">No vocabulary available</p>
          <p className="text-gray-600 mb-4">
            Complete some lessons first to unlock review games with your learned vocabulary!
          </p>
          <Button onClick={onExit} className="bg-[#E63946] hover:bg-[#DC2626] text-white">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!currentVocab) {
    return null
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

      {/* Game Over Overlay */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-lg p-6 sm:p-8 max-w-md w-full text-center border-2 border-[#E63946]"
            >
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-[#1E293B]">Game Over!</h2>
              <p className="text-muted-foreground mb-6">
                You ran out of lives. Correct: {correctCount}, Wrong: {wrongCount}
              </p>
              <div className="space-y-3">
                <Button onClick={handleRestart} className="w-full gap-2 bg-[#E63946] hover:bg-[#DC2626] text-white">
                  <RotateCcw className="h-4 w-4" />
                  Play Again
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={onExit} className="gap-2 border-[#E63946] text-[#E63946] hover:bg-[#E63946]/10">
                    <BookOpen className="h-4 w-4" />
                    Review Games
                  </Button>
                  <Link href="/" className="contents">
                    <Button variant="outline" className="w-full gap-2 border-[#E63946] text-[#E63946] hover:bg-[#E63946]/10">
                      <Home className="h-4 w-4" />
                      Home
                    </Button>
                  </Link>
                </div>
                <Link href="/modules" className="contents">
                  <Button variant="outline" className="w-full gap-2 border-[#E63946] text-[#E63946] hover:bg-[#E63946]/10">
                    <BookOpen className="h-4 w-4" />
                    Continue Lessons
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content - Responsive Layout */}
      {/* Mobile: Stats below game, Desktop: Split screen */}
      <main className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full">
        {/* Game Area - Mobile: Full width, Desktop: ~70% */}
        <div className="flex-1 lg:w-[70%] lg:border-r-2 lg:border-[#10B981]/20 p-4 sm:p-6">
          {!isGameOver && currentVocab && completeVocabularyBank.current.length > 0 ? (
            <AudioMeaning
              vocabularyId={currentVocab.id}
              distractors={distractors.current}
              vocabularyBank={completeVocabularyBank.current}
              points={1}
              autoPlay={true}
              onContinue={handleContinue}
              onXpStart={handleXpStart}
              onVocabTrack={handleVocabTrack}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          )}
          
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

