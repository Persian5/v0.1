import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, RotateCcw } from "lucide-react"
import { XpAnimation } from "./XpAnimation"
import { AudioService } from "@/lib/services/audio-service"
import { VocabularyItem } from "@/lib/types"
import { playSuccessSound } from "./Flashcard"
import { motion } from "framer-motion"

interface AudioMeaningProps {
  vocabularyId: string
  distractors: string[] // Other vocabulary IDs for wrong answers
  vocabularyBank: VocabularyItem[] // All available vocabulary for this lesson
  points?: number
  autoPlay?: boolean // Keep for backward compatibility but don't use
  onContinue: () => void
  onXpStart?: () => Promise<boolean> // Returns true if XP granted, false if already completed
  onVocabTrack?: (vocabularyId: string, wordText: string, isCorrect: boolean, timeSpentMs?: number) => void; // Track vocabulary performance
}

export function AudioMeaning({
  vocabularyId,
  distractors,
  vocabularyBank,
  points = 2,
  autoPlay = false, // Default to false now
  onContinue,
  onXpStart,
  onVocabTrack
}: AudioMeaningProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [showXp, setShowXp] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false)
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([])
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number>(0)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false) // Track if step was already completed (local state)

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
      const success = await AudioService.playVocabularyAudio(targetVocabulary.id)
      if (success) {
        setHasPlayedAudio(true)
      }
    }
  }

  const handleAnswerSelect = async (answerIndex: number) => {
    // Block re-clicks while feedback animates
    if (showResult) return;

    setSelectedAnswer(answerIndex);
    setShowResult(true);

    const correct = answerIndex === correctAnswerIndex;
    setIsCorrect(correct);

    // Track vocabulary performance to Supabase
    if (onVocabTrack && targetVocabulary) {
      onVocabTrack(vocabularyId, targetVocabulary.en, correct);
    }

    if (correct) {
      // ✅ Correct flow – behave like Quick Quiz (green border, brief pause, XP, then auto-continue)
      playSuccessSound();
      
      // Award XP and check if step was already completed
      if (onXpStart) {
        const wasGranted = await onXpStart(); // Await the Promise to get result
        setIsAlreadyCompleted(!wasGranted); // If not granted, it was already completed
      }

      setTimeout(() => setShowXp(true), 100); // let border show
    } else {
      // ❌ Incorrect flow – flash red, then reset automatically (no Try Again button)
      setTimeout(() => {
        setShowResult(false);
        setSelectedAnswer(null);
        setIsCorrect(false);
      }, 600); // 0.6 s red feedback before reset
    }
  }

  const handleXpComplete = () => {
    onContinue()
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
          isAlreadyCompleted={isAlreadyCompleted}
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
          // Reduce padding (height) by ~40% for more compact answer boxes. Remove transition-all to avoid conflict with framer-motion.
          let buttonStyle = "w-full px-3 py-2.5 border-2 rounded-lg flex items-center justify-center text-center transition-colors duration-200 ";

          if (showResult) {
            if (isCorrect && index === selectedAnswer) {
              // Correct selection turns green
              buttonStyle += "border-green-500 bg-green-50 text-green-700 ";
            } else if (!isCorrect && index === selectedAnswer) {
              // Incorrect selection turns light red (same as Quick Quiz)
              buttonStyle += "border-red-300 bg-red-100 text-red-700 ";
            } else {
              // Other options stay neutral
              buttonStyle += "border-gray-200 bg-gray-50 text-gray-500 ";
            }
          } else {
            if (selectedAnswer === index) {
              buttonStyle += "border-primary bg-primary/10 text-primary ";
            } else {
              buttonStyle += "border-gray-200 sm:hover:border-primary/50 sm:hover:bg-primary/5 ";
            }
          }

          const shakeKeyframes = { x: [0, -10, 10, -10, 10, 0] };
          const isShaking = showResult && !isCorrect && index === selectedAnswer;

          return (
            <motion.div
              key={index}
              initial={false}
              animate={isShaking ? shakeKeyframes : {}}
              transition={isShaking ? { duration: 0.6, ease: "easeInOut" } : {}}
              className="w-full"
            >
              <button
                type="button"
                onClick={() => handleAnswerSelect(index)}
                className={buttonStyle}
                disabled={showResult}
              >
                <span className="text-base sm:text-lg font-medium">{option}</span>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* (Popup feedback & retry button removed – buttons themselves convey feedback) */}
    </div>
  )
} 