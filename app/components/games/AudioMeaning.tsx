import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, RotateCcw } from "lucide-react"
import { XpAnimation } from "./XpAnimation"
import { AudioService } from "@/lib/services/audio-service"
import { VocabularyItem } from "@/lib/types"
import { playSuccessSound } from "./Flashcard"

interface AudioMeaningProps {
  vocabularyId: string
  distractors: string[] // Other vocabulary IDs for wrong answers
  vocabularyBank: VocabularyItem[] // All available vocabulary for this lesson
  points?: number
  autoPlay?: boolean // Keep for backward compatibility but don't use
  onContinue: () => void
  onXpStart?: () => void
}

export function AudioMeaning({
  vocabularyId,
  distractors,
  vocabularyBank,
  points = 2,
  autoPlay = false, // Default to false now
  onContinue,
  onXpStart
}: AudioMeaningProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [showXp, setShowXp] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false)
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([])
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number>(0)

  // Find the target vocabulary item
  const targetVocabulary = vocabularyBank.find(v => v.id === vocabularyId)
  
  // Initialize shuffled options only once when component mounts
  useEffect(() => {
    const allOptions = [vocabularyId, ...distractors]
    const shuffled = [...allOptions].sort(() => Math.random() - 0.5)
    setShuffledOptions(shuffled)
    setCorrectAnswerIndex(shuffled.indexOf(vocabularyId))
  }, [vocabularyId, distractors])
  
  // Get English meanings for the options
  const answerOptions = shuffledOptions.map(id => {
    const vocab = vocabularyBank.find(v => v.id === id)
    return vocab?.en || id
  })

  const playTargetAudio = async () => {
    if (targetVocabulary) {
      const success = await AudioService.playVocabularyAudio(targetVocabulary.id, 'persian')
      if (success) {
        setHasPlayedAudio(true)
      }
    }
  }

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return // Prevent changes after showing result
    
    setSelectedAnswer(answerIndex)
    setShowResult(true)
    const correct = answerIndex === correctAnswerIndex
    setIsCorrect(correct)
    
    // If correct, play success sound and auto-advance with XP animation
    if (correct) {
      playSuccessSound() // Add success sound effect
      if (onXpStart) {
        onXpStart()
      }
      // XP animation will show automatically due to showResult && isCorrect condition
      setTimeout(() => {
        setShowXp(true)
      }, 100) // Small delay to let the correct answer styling show first
    }
  }

  const handleXpComplete = () => {
    onContinue()
  }

  const handleRetry = () => {
    setSelectedAnswer(null)
    setShowResult(false)
    setIsCorrect(false)
    // Don't auto-play on retry - let them choose
  }

  if (!targetVocabulary) {
    return (
      <div className="text-center p-6">
        <p className="text-red-500">Error: Vocabulary item not found</p>
      </div>
    )
  }

  // Don't render until options are shuffled
  if (shuffledOptions.length === 0) {
    return null
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 relative">
      {/* XP Animation - positioned like other games */}
      {showResult && isCorrect && (
        <XpAnimation
          amount={points}
          show={showXp}
          onStart={undefined}
          onComplete={handleXpComplete}
        />
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-primary">
          LISTENING CHALLENGE
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Listen to the Persian word and select its English meaning
        </p>
      </div>

      {/* Audio Player Section */}
      <div className="bg-primary/5 rounded-xl p-6 mb-6 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <Volume2 className="h-8 w-8 text-primary" />
          <p className="text-lg font-medium text-primary">
            {hasPlayedAudio ? "Ready to answer?" : "Click to hear the word..."}
          </p>
        </div>
        
        <Button
          onClick={playTargetAudio}
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <Volume2 className="h-5 w-5" />
          {hasPlayedAudio ? 'Play Again' : 'Play Audio'}
        </Button>
      </div>

      {/* Answer Options */}
      <div className="space-y-3 mb-6">
        {answerOptions.map((option, index) => {
          let buttonStyle = "w-full p-4 text-left border-2 transition-all duration-200 "
          
          if (showResult) {
            if (index === correctAnswerIndex) {
              buttonStyle += "border-green-500 bg-green-50 text-green-700 "
            } else if (index === selectedAnswer && !isCorrect) {
              buttonStyle += "border-red-500 bg-red-50 text-red-700 "
            } else {
              buttonStyle += "border-gray-200 bg-gray-50 text-gray-500 "
            }
          } else {
            if (selectedAnswer === index) {
              buttonStyle += "border-primary bg-primary/10 text-primary "
            } else {
              buttonStyle += "border-gray-200 hover:border-primary/50 hover:bg-primary/5 "
            }
          }

          return (
            <Button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              variant="ghost"
              className={buttonStyle}
              disabled={showResult}
            >
              <span className="text-lg font-medium">{option}</span>
            </Button>
          )
        })}
      </div>

      {/* Result Feedback */}
      {showResult && (
        <div className={`text-center p-4 rounded-lg mb-6 ${
          isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          <p className="text-lg font-semibold mb-2">
            {isCorrect ? '✅ Correct!' : '❌ Not quite right'}
          </p>
          <p className="text-sm">
            {isCorrect 
              ? `"${targetVocabulary.finglish}" means "${targetVocabulary.en}"`
              : `The correct answer is "${targetVocabulary.en}" (${targetVocabulary.finglish})`
            }
          </p>
        </div>
      )}

      {/* Retry Button (only shown for wrong answers) */}
      {showResult && !isCorrect && (
        <div className="flex justify-center">
          <Button
            onClick={handleRetry}
            variant="outline"
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      )}
    </div>
  )
} 