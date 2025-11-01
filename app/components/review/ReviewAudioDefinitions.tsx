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
import { X, TrendingUp, TrendingDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ReviewAudioDefinitionsProps {
  filter: ReviewFilter
  onExit: () => void
}

export function ReviewAudioDefinitions({ filter, onExit }: ReviewAudioDefinitionsProps) {
  const { user } = useAuth()
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [xpCapReached, setXpCapReached] = useState(false)
  const [xpCapShown, setXpCapShown] = useState(false)
  const [usedVocabularyIds, setUsedVocabularyIds] = useState<Set<string>>(new Set())
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

        // Shuffle vocabulary for variety
        const shuffled = [...vocabItems].sort(() => Math.random() - 0.5)
        setVocabulary(shuffled)
        setUsedVocabularyIds(new Set())
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

  // Generate distractors for current word
  const distractors = useRef<string[]>([])
  
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

    // Convert to vocabulary IDs
    const distractorIds: string[] = []
    for (const distractor of distractorItems) {
      const vocab = allVocab.find(v => 
        WordBankService.normalizeVocabEnglish(v.en).toLowerCase() === distractor.wordText.toLowerCase()
      )
      if (vocab && vocab.id !== currentVocab.id) {
        distractorIds.push(vocab.id)
      }
    }

    // If we don't have enough distractors, fill with random vocab
    while (distractorIds.length < 3 && vocabulary.length > 1) {
      const randomVocab = vocabulary[Math.floor(Math.random() * vocabulary.length)]
      if (randomVocab.id !== currentVocab.id && !distractorIds.includes(randomVocab.id)) {
        distractorIds.push(randomVocab.id)
      }
    }

    distractors.current = distractorIds.slice(0, 3)
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

    // Update stats
    if (isCorrect) {
      setCorrectCount(prev => prev + 1)
      setStreak(prev => prev + 1)
      
      // Award XP (1 XP per correct answer)
      const result = await ReviewSessionService.awardReviewXp(user.id, 1)
      if (!result.awarded && result.reason === 'Daily review XP cap reached' && !xpCapShown) {
        setXpCapReached(true)
        setXpCapShown(true)
        setTimeout(() => setXpCapReached(false), 5000)
      }
    } else {
      setWrongCount(prev => prev + 1)
      setStreak(0)
    }
  }

  // Handle XP start (for review mode, we handle XP ourselves)
  const handleXpStart = async (): Promise<boolean> => {
    // XP is handled in handleVocabTrack, so return true to allow animation
    return true
  }

  // Handle continue (auto-advance to next question)
  const handleContinue = () => {
    if (currentIndex < vocabulary.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setUsedVocabularyIds(prev => new Set(prev).add(currentVocab.id))
    } else {
      // Cycle through vocabulary (unlimited mode)
      // Reset to start, but skip already-used words
      const unusedVocab = vocabulary.filter(v => !usedVocabularyIds.has(v.id))
      if (unusedVocab.length > 0) {
        const randomIndex = vocabulary.findIndex(v => v.id === unusedVocab[0].id)
        setCurrentIndex(randomIndex)
      } else {
        // All words used, reset
        setUsedVocabularyIds(new Set())
        setCurrentIndex(0)
      }
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

  if (!currentVocab) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Stats */}
            <div className="text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-600">{correctCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="font-semibold text-red-600">{wrongCount}</span>
              </div>
            </div>
            
            {/* Streak */}
            {streak > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">Streak: </span>
                <span className="font-semibold text-orange-600">{streak}</span>
              </div>
            )}
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

      {/* Game Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <AudioMeaning
            vocabularyId={currentVocab.id}
            distractors={distractors.current}
            vocabularyBank={vocabulary}
            points={1} // 1 XP per correct in review mode
            onContinue={handleContinue}
            onXpStart={handleXpStart}
            onVocabTrack={handleVocabTrack}
          />
        </div>
      </main>
    </div>
  )
}

