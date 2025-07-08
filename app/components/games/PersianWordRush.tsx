"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, X, Trophy, Zap, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { VocabularyService } from "@/lib/services/vocabulary-service"
import { XpService } from "@/lib/services/xp-service"
import { VocabularyItem } from "@/lib/types"
import { VocabularyProgressService } from "@/lib/services/vocabulary-progress-service"
import { useAuth } from "@/components/auth/AuthProvider"

// Game states
type GameState = 'menu' | 'playing' | 'game-over' | 'paused' | 'loading'

// Game configuration
const GAME_CONFIG = {
  INITIAL_SPEED: 6000, // 6 seconds for first word
  MIN_SPEED: 2000, // Minimum 2 seconds (max speed)
  SPEED_INCREASE: 200, // Decrease by 200ms every 4 correct answers
  LIVES: 3,
  CHOICES_COUNT: 4,
  COMBO_THRESHOLD: 4, // Every 4 correct answers increases XP
  INITIAL_XP: 10,
  XP_CORRECT: 15,
  XP_BONUS_COMBO_2: 5,
  XP_BONUS_COMBO_3: 10,
  XP_BONUS_COMBO_5: 20
}

interface GameStats {
  score: number
  lives: number
  combo: number
  currentXp: number
  totalXpEarned: number
  wordsAnswered: number
  correctAnswers: number
  accuracy: number
}

interface SlidingWord {
  id: string
  word: VocabularyItem
  speed: number // milliseconds to cross screen
  timeRemaining: number // seconds remaining for this word
  animationState: 'sliding' | 'shaking-green' | 'shaking-red' | 'exploding'
}

export function PersianWordRush() {
  const [gameState, setGameState] = useState<GameState>('menu')
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([])
  const [vocabularyError, setVocabularyError] = useState<string | null>(null)
  const [currentWord, setCurrentWord] = useState<SlidingWord | null>(null)
  const [choices, setChoices] = useState<string[]>([])
  const [correctChoice, setCorrectChoice] = useState<number>(0)
  const [gameStats, setGameStats] = useState<GameStats>({
    score: 0,
    lives: GAME_CONFIG.LIVES,
    combo: 0,
    currentXp: GAME_CONFIG.INITIAL_XP,
    totalXpEarned: 0,
    wordsAnswered: 0,
    correctAnswers: 0,
    accuracy: 100
  })
  
  // Animation and timing refs
  const wordAnimationRef = useRef<NodeJS.Timeout | null>(null)
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const [showXpGain, setShowXpGain] = useState<number | null>(null)
  
  // Separate timer state to prevent useEffect re-runs
  const [timerDisplay, setTimerDisplay] = useState<number>(6)
  
  // Track current word position for shake animations
  const currentPositionRef = useRef<number>(0)
  
  // New animation states for word shake & explode
  const [wordAnimationState, setWordAnimationState] = useState<'sliding' | 'shaking-green' | 'shaking-red' | 'exploding' | null>('sliding')
  const [wordPosition, setWordPosition] = useState<{ x: number, y: number } | null>(null)

  const { user, isEmailVerified } = useAuth()

  // Load user's vocabulary on component mount
  useEffect(() => {
    const loadVocabulary = async () => {
      if (!user || !isEmailVerified) {
        setVocabularyError('Please sign in to play')
        return
      }

      try {
        setGameState('loading')
        const userVocabulary = await VocabularyProgressService.getUserPracticeVocabulary({
          maxWords: 100 // Get up to 100 words for variety
        })
        
        if (userVocabulary.length === 0) {
          setVocabularyError('Complete some lessons first to unlock this game!')
          setGameState('menu')
          return
        }
        
        setVocabulary(userVocabulary)
        setVocabularyError(null)
        setGameState('menu')
        console.log(`Loaded ${userVocabulary.length} vocabulary words for practice`)
      } catch (error) {
        console.error('Failed to load vocabulary:', error)
        setVocabularyError('Failed to load vocabulary. Please try again.')
        setGameState('menu')
    }
    }

    loadVocabulary()
  }, [user, isEmailVerified])

  // Calculate current word speed based on progress
  const getCurrentSpeed = useCallback(() => {
    // No speed progression for now - always 6 seconds
    return GAME_CONFIG.INITIAL_SPEED // Always 6000ms = 6 seconds
  }, [])

  // Generate random word and choices
  const generateWordAndChoices = useCallback(() => {
    if (vocabulary.length === 0) return

    // Select random word
    const randomWord = vocabulary[Math.floor(Math.random() * vocabulary.length)]
    
    // Generate 3 wrong choices + 1 correct choice
    const wrongChoices: string[] = []
    const allEnglishWords = vocabulary
      .filter(v => v.id !== randomWord.id)
      .map(v => v.en)
    
    while (wrongChoices.length < 3 && allEnglishWords.length > wrongChoices.length) {
      const randomChoice = allEnglishWords[Math.floor(Math.random() * allEnglishWords.length)]
      if (!wrongChoices.includes(randomChoice)) {
        wrongChoices.push(randomChoice)
      }
    }

    // Create choices array and randomize position of correct answer
    const allChoices = [...wrongChoices, randomWord.en]
    const shuffledChoices = allChoices.sort(() => Math.random() - 0.5)
    const correctIndex = shuffledChoices.indexOf(randomWord.en)

    // Create sliding word
    const slidingWord: SlidingWord = {
      id: `word-${Date.now()}`,
      word: randomWord,
      speed: getCurrentSpeed(),
      timeRemaining: Math.ceil(getCurrentSpeed() / 1000), // Convert to seconds
      animationState: 'sliding'
    }

    setCurrentWord(slidingWord)
    setChoices(shuffledChoices)
    setCorrectChoice(correctIndex)
  }, [vocabulary, getCurrentSpeed])

  // Helper function to shake word green (correct answer)
  const shakeWordGreen = useCallback(() => {
    if (!currentWord) return

    // Clear the sliding timer
    if (wordAnimationRef.current) {
      clearTimeout(wordAnimationRef.current)
    }

    // Update word to shaking state
    setCurrentWord(prev => prev ? { 
      ...prev, 
      animationState: 'shaking-green' 
    } : null)

    // Shake for 0.5 seconds then explode and start next word
    setTimeout(() => {
      setCurrentWord(prev => prev ? { 
        ...prev, 
        animationState: 'exploding' 
      } : null)
      
      // Start next word after explosion
      setTimeout(() => {
        setShowXpGain(null) // Clear XP animation
        generateWordAndChoices()
      }, 300) // Wait for explosion to complete
    }, 500)
  }, [currentWord, generateWordAndChoices])

  // Helper function to shake word red (incorrect answer or timeout)
  const shakeWordRed = useCallback(() => {
    if (!currentWord) return

    // Clear the sliding timer
    if (wordAnimationRef.current) {
      clearTimeout(wordAnimationRef.current)
    }

    // Update word to shaking state
    setCurrentWord(prev => prev ? { 
      ...prev, 
      animationState: 'shaking-red' 
    } : null)

    // Shake for 0.5 seconds then explode and start next word
    setTimeout(() => {
      setCurrentWord(prev => prev ? { 
        ...prev, 
        animationState: 'exploding' 
      } : null)
      
      // Start next word after explosion
      setTimeout(() => {
        generateWordAndChoices()
      }, 300) // Wait for explosion to complete
    }, 500)
  }, [currentWord, generateWordAndChoices])

  // Start word animation when current word changes
  useEffect(() => {
    if (gameState === 'playing' && currentWord) {
      // Clear any existing animation
      if (wordAnimationRef.current) {
        clearTimeout(wordAnimationRef.current)
      }

      // Start countdown timer
      const startTime = Date.now()
      const totalDuration = currentWord.speed
      
      // Initialize timer display
      setTimerDisplay(6)
      
      const updateTimer = () => {
        const elapsed = Date.now() - startTime
        const timeRemaining = Math.max(0, Math.ceil((totalDuration - elapsed) / 1000))

        if (elapsed >= totalDuration) {
          // Time is up - lose a life and shake word red
          setGameStats(prev => ({
            ...prev,
            lives: prev.lives - 1,
            combo: 0, // Reset combo
            currentXp: GAME_CONFIG.INITIAL_XP, // Reset XP back to 1
            wordsAnswered: prev.wordsAnswered + 1,
            accuracy: Math.round((prev.correctAnswers * 100) / (prev.wordsAnswered + 1))
          }))

          // Record performance
          VocabularyService.recordIncorrectAnswer(currentWord.word.id)

          // Check game over or shake word red
          const newLives = gameStats.lives - 1
          if (newLives <= 0) {
            setGameState('game-over')
          } else {
            // Shake word red and then start next word
            shakeWordRed()
          }
          return
        }

        // Update timer display only (don't modify currentWord)
        setTimerDisplay(timeRemaining)
        
        wordAnimationRef.current = setTimeout(updateTimer, 100) // Update every 100ms for smooth countdown
      }

      updateTimer()
    }

    return () => {
      if (wordAnimationRef.current) {
        clearTimeout(wordAnimationRef.current)
      }
    }
  }, [gameState, currentWord, shakeWordRed])

  // Handle choice selection
  const handleChoiceSelect = useCallback((choiceIndex: number) => {
    if (gameState !== 'playing' || !currentWord) return

    if (choiceIndex === correctChoice) {
      // Handle correct answer - shake word green
      // Clear word animation
      if (wordAnimationRef.current) {
        clearTimeout(wordAnimationRef.current)
      }

      // Update stats
      setGameStats(prev => {
        const newCombo = prev.combo + 1
        const newWordsAnswered = prev.wordsAnswered + 1
        const newCorrectAnswers = prev.correctAnswers + 1
        const xpGain = newCombo % GAME_CONFIG.COMBO_THRESHOLD === 0 ? prev.currentXp + 1 : prev.currentXp
        const totalXpGained = newCombo % GAME_CONFIG.COMBO_THRESHOLD === 0 ? prev.totalXpEarned + prev.currentXp : prev.totalXpEarned
        
        return {
          ...prev,
          score: prev.score + prev.currentXp,
          combo: newCombo,
          currentXp: xpGain,
          totalXpEarned: totalXpGained,
          wordsAnswered: newWordsAnswered,
          correctAnswers: newCorrectAnswers,
          accuracy: Math.round((newCorrectAnswers * 100) / newWordsAnswered)
        }
      })

      // Show XP gain if combo milestone reached
      if ((gameStats.combo + 1) % GAME_CONFIG.COMBO_THRESHOLD === 0) {
        setShowXpGain(gameStats.currentXp)
      }

      // Record performance
      VocabularyService.recordCorrectAnswer(currentWord.word.id)

      // Shake word green and then start next word
      shakeWordGreen()
    } else {
      // Handle incorrect answer - shake word red
      // Clear word animation
      if (wordAnimationRef.current) {
        clearTimeout(wordAnimationRef.current)
      }

      // Update stats
      setGameStats(prev => ({
        ...prev,
        lives: prev.lives - 1,
        combo: 0, // Reset combo
        currentXp: GAME_CONFIG.INITIAL_XP, // Reset XP back to 1
        wordsAnswered: prev.wordsAnswered + 1,
        accuracy: Math.round((prev.correctAnswers * 100) / (prev.wordsAnswered + 1))
      }))

      // Record performance
      VocabularyService.recordIncorrectAnswer(currentWord.word.id)

      // Check game over or shake word red
      const newLives = gameStats.lives - 1
      if (newLives <= 0) {
        setGameState('game-over')
      } else {
        // Shake word red and then start next word
        shakeWordRed()
      }
    }
  }, [gameState, currentWord, correctChoice, gameStats.combo, gameStats.currentXp, gameStats.lives, gameStats.correctAnswers, gameStats.wordsAnswered, shakeWordGreen, shakeWordRed])

  // Start game
  const startGame = useCallback(() => {
    if (vocabulary.length === 0) {
      console.error('Cannot start game: No vocabulary loaded')
      return
    }

    setGameState('playing')
    setGameStats({
      score: 0,
      lives: GAME_CONFIG.LIVES,
      combo: 0,
      currentXp: GAME_CONFIG.INITIAL_XP,
      totalXpEarned: 0,
      wordsAnswered: 0,
      correctAnswers: 0,
      accuracy: 100
    })
    setShowXpGain(null)
    generateWordAndChoices()
  }, [vocabulary.length, generateWordAndChoices])

  // Restart game
  const restartGame = useCallback(() => {
    // Clear any running timers
    if (wordAnimationRef.current) {
      clearTimeout(wordAnimationRef.current)
    }
    if (gameLoopRef.current) {
      clearTimeout(gameLoopRef.current)
    }

    startGame()
  }, [startGame])

  // Exit game
  const exitGame = useCallback(() => {
    // Clear any running timers
    if (wordAnimationRef.current) {
      clearTimeout(wordAnimationRef.current)
    }
    if (gameLoopRef.current) {
      clearTimeout(gameLoopRef.current)
    }

    setGameState('menu')
    setCurrentWord(null)
    setChoices([])
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wordAnimationRef.current) {
        clearTimeout(wordAnimationRef.current)
      }
      if (gameLoopRef.current) {
        clearTimeout(gameLoopRef.current)
      }
    }
  }, [])

  // Loading state
  if (gameState === 'loading') {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Loading Vocabulary...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render menu screen
  if (gameState === 'menu') {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold mb-4">Persian Word Rush</CardTitle>
          </CardHeader>
          <CardContent>
            {vocabularyError ? (
              <div className="text-center space-y-4">
                <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="font-medium">{vocabularyError}</p>
                </div>
                <Button onClick={() => window.history.back()} variant="outline" className="w-full">
                  Go Back
                </Button>
          </div>
            ) : (
              <>
          <div className="bg-primary/5 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">How to Play</h3>
            <div className="text-left space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                <span>Persian words slide right-to-left across the screen</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                <span>Choose the correct English translation from 4 options</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                <span>You have 3 lives - game ends when all lives are lost</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                <span>Build combos to increase XP rewards</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                <span>Speed increases as you progress</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Button 
              size="lg" 
              className="w-full bg-accent hover:bg-accent/90 text-white font-semibold py-4 text-lg"
              onClick={startGame}
              disabled={vocabulary.length === 0}
            >
                    {vocabulary.length === 0 ? 'No Vocabulary Available' : 'Start Game'}
            </Button>
            
            {vocabulary.length > 0 && (
                    <p className="text-sm text-muted-foreground text-center">
                      Ready with {vocabulary.length} words from your completed lessons
              </p>
            )}
          </div>
              </>
            )}
        </CardContent>
      </Card>
      </div>
    )
  }

  // Render game over screen
  if (gameState === 'game-over') {
    return (
      <Card className="w-full max-w-2xl mx-auto bg-white shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="text-6xl mb-4">💥</div>
            <h1 className="text-3xl font-bold text-primary mb-2">Game Over</h1>
            <p className="text-lg text-muted-foreground">
              You've used all your lives!
            </p>
          </div>
          
          <div className="bg-primary/5 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{gameStats.correctAnswers}</div>
                <div className="text-sm text-muted-foreground">Words Answered Correctly</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent">{gameStats.totalXpEarned}</div>
                <div className="text-sm text-muted-foreground">Total XP Earned</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{gameStats.wordsAnswered}</div>
                <div className="text-sm text-muted-foreground">Total Words Attempted</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{gameStats.accuracy}%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              size="lg" 
              className="w-full bg-accent hover:bg-accent/90 text-white font-semibold py-4"
              onClick={restartGame}
            >
              Play Again
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="w-full"
              onClick={exitGame}
            >
              Back to Menu
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render playing screen
  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-blue-50 to-green-50 relative overflow-hidden">
      {/* Game UI Header */}
      <div className="flex items-center justify-between p-4 bg-white/90 backdrop-blur-sm shadow-sm z-10 h-16 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={exitGame}>
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: GAME_CONFIG.LIVES }).map((_, i) => (
              <Heart 
                key={i} 
                className={`h-5 w-5 ${i < gameStats.lives ? 'text-red-500 fill-red-500' : 'text-gray-300'}`} 
              />
            ))}
          </div>
        </div>

        {/* Game Title */}
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold text-primary">Persian Word Rush</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{gameStats.score}</div>
            <div className="text-xs text-muted-foreground">Score</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-accent flex items-center gap-1">
              <Zap className="h-4 w-4" />
              {gameStats.combo}
            </div>
            <div className="text-xs text-muted-foreground">Combo</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{gameStats.currentXp} XP</div>
            <div className="text-xs text-muted-foreground">Next Reward</div>
          </div>
        </div>
      </div>

      {/* Game Area - Takes remaining space */}
      <div className="flex-1 relative overflow-hidden">
        {/* Progress Bar */}
        {currentWord && (
          <div className="absolute top-0 left-0 right-0 h-2 bg-gray-200 z-10">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-red-500 transition-all duration-1000"
              style={{ 
                width: `${((currentWord.speed / 1000 - currentWord.timeRemaining) / (currentWord.speed / 1000)) * 100}%` 
              }}
            />
          </div>
        )}
        
        {/* Sliding Word */}
        <AnimatePresence>
          {currentWord && (
            <motion.div
              key={currentWord.id}
              className="absolute z-20"
              style={{ top: '40%', transform: 'translateY(-50%)' }}
              initial={{ x: '100vw' }}
              animate={
                currentWord.animationState === 'sliding' 
                  ? { x: '-200px' }
                  : currentWord.animationState === 'shaking-green' || currentWord.animationState === 'shaking-red'
                  ? { 
                      x: [
                        currentPositionRef.current,
                        currentPositionRef.current - 10,
                        currentPositionRef.current + 10,
                        currentPositionRef.current - 10,
                        currentPositionRef.current + 10,
                        currentPositionRef.current
                      ]
                    }
                  : currentWord.animationState === 'exploding'
                  ? { 
                      scale: [1, 1.3, 0],
                      opacity: [1, 1, 0],
                      rotate: [0, 180, 360],
                      x: currentPositionRef.current
                    }
                  : {}
              }
              transition={
                currentWord.animationState === 'sliding'
                  ? { 
                      duration: currentWord.speed / 1000, 
                      ease: 'linear' 
                    }
                  : currentWord.animationState === 'shaking-green' || currentWord.animationState === 'shaking-red'
                  ? {
                      duration: 0.5,
                      times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                      ease: 'easeInOut',
                      type: 'tween'
                    }
                  : currentWord.animationState === 'exploding'
                  ? {
                      duration: 0.3,
                      ease: 'easeOut'
                    }
                  : {}
              }
              onUpdate={(latest) => {
                // Track current position during sliding
                if (currentWord.animationState === 'sliding' && typeof latest.x === 'number') {
                  currentPositionRef.current = latest.x
                }
              }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className={`rounded-lg shadow-lg border-2 px-6 py-4 relative`}
                animate={
                  currentWord.animationState === 'shaking-green'
                    ? { backgroundColor: '#22c55e', borderColor: '#16a34a' }
                    : currentWord.animationState === 'shaking-red'
                    ? { backgroundColor: '#ef4444', borderColor: '#dc2626' }
                    : { backgroundColor: '#ffffff', borderColor: 'var(--primary)' }
                }
                transition={{ duration: 0.2 }}
              >
                {/* Timer Badge */}
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
                  {timerDisplay}
                </div>
                <div className={`text-2xl font-bold text-center ${
                  currentWord.animationState === 'shaking-green' || currentWord.animationState === 'shaking-red'
                    ? 'text-white'
                    : 'text-primary'
                }`}>
                  {currentWord.word.finglish}
                </div>
                <div className={`text-sm text-center mt-1 ${
                  currentWord.animationState === 'shaking-green' || currentWord.animationState === 'shaking-red'
                    ? 'text-white/80'
                    : 'text-muted-foreground'
                }`}>
                  {currentWord.word.fa}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Answer Choices */}
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
            {choices.map((choice, index) => (
              <Button
                key={`choice-${index}-${choice}`}
                size="lg"
                variant="outline"
                className="h-14 text-base font-semibold bg-white/90 backdrop-blur-sm hover:bg-primary/10 hover:scale-105 transition-all"
                onClick={() => handleChoiceSelect(index)}
                disabled={currentWord?.animationState !== 'sliding'}
              >
                {choice}
              </Button>
            ))}
          </div>
        </div>

        {/* XP Gain Animation - positioned above the shaking word */}
        <AnimatePresence>
          {showXpGain && currentWord && (
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 z-30"
              style={{ top: '30%' }}
              initial={{ opacity: 0, y: 20, scale: 0.5 }}
              animate={{ opacity: 1, y: -20, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.5 }}
            >
              <div className="bg-accent text-white px-4 py-2 rounded-full font-bold text-lg">
                +{showXpGain} XP!
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 