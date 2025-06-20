import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, RotateCcw } from "lucide-react"
import { XpAnimation } from "./XpAnimation"
import { AudioService } from "@/lib/services/audio-service"
import { VocabularyItem } from "@/lib/types"
import { playSuccessSound } from "./Flashcard"

interface AudioSequenceProps {
  sequence: string[] // Array of vocabulary IDs in correct order
  vocabularyBank: VocabularyItem[] // All available vocabulary for this lesson
  points?: number
  autoPlay?: boolean
  onContinue: () => void
  onXpStart?: () => void
}

export function AudioSequence({
  sequence,
  vocabularyBank,
  points = 3,
  autoPlay = false,
  onContinue,
  onXpStart
}: AudioSequenceProps) {
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false)
  const [userOrder, setUserOrder] = useState<string[]>([])
  const [showResult, setShowResult] = useState(false)
  const [showXp, setShowXp] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  // Create word bank with all learned vocabulary (shuffled ONLY ONCE on mount)
  const [allWordBankOptions] = useState(() => 
    vocabularyBank.map(v => v.id).sort(() => Math.random() - 0.5)
  )

  const playAudioSequence = async () => {
    try {
      for (let i = 0; i < sequence.length; i++) {
        const vocabularyId = sequence[i]
        await AudioService.playVocabularyAudio(vocabularyId, 'persian')
        
        // Medium pause between words
        if (i < sequence.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      setHasPlayedAudio(true)
    } catch (error) {
      console.log('Error playing audio sequence:', error)
      setHasPlayedAudio(true) // Still mark as played to enable interaction
    }
  }

  const handleItemClick = (vocabularyId: string) => {
    // Click to add items to sequence in order
    if (!userOrder.includes(vocabularyId)) {
      setUserOrder(prev => [...prev, vocabularyId])
    }
  }

  const handleRemoveItem = (vocabularyId: string) => {
    setUserOrder(prev => prev.filter(id => id !== vocabularyId))
  }

  const handleSubmit = () => {
    if (userOrder.length !== sequence.length) return

    const correct = JSON.stringify(userOrder) === JSON.stringify(sequence)
    setIsCorrect(correct)
    setShowResult(true)

    if (correct) {
      playSuccessSound()
      if (onXpStart) {
        onXpStart()
      }
      // Show XP animation immediately when correct (same as other games)
      setShowXp(true)
    }
  }

  const handleXpComplete = () => {
    onContinue()
  }

  const handleRetry = () => {
    setUserOrder([])
    setShowResult(false)
    setIsCorrect(false)
  }

  const getVocabularyById = (id: string) => {
    return vocabularyBank.find(v => v.id === id)
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
          SEQUENCE CHALLENGE
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Listen to the Persian words and click the English meanings in the same order
        </p>
      </div>

      {/* Audio Player Section */}
      <div className="bg-primary/5 rounded-xl p-6 mb-6 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <Volume2 className="h-8 w-8 text-primary" />
          <p className="text-lg font-medium text-primary">
            {hasPlayedAudio ? "Now click the meanings in order:" : "Click to hear the sequence..."}
          </p>
        </div>
        
        <Button
          onClick={playAudioSequence}
          variant="outline"
          size="lg"
          className="gap-2 w-[220px]"
          disabled={showResult}
        >
          <Volume2 className="h-5 w-5" />
          {hasPlayedAudio ? 'Play Again' : 'Play Audio Sequence'}
        </Button>
      </div>

      {/* User's Sequence - Show this first for clarity */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-center">Your Order:</h3>
        <div className="min-h-[60px] bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-4">
          {userOrder.length === 0 ? (
            <p className="text-center text-gray-500 italic">
              Click words from the bank below to build the sequence
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 justify-center">
              {userOrder.map((id, index) => {
                const vocab = getVocabularyById(id)
                
                return (
                  <div
                    key={`${id}-${index}`}
                    className={`px-3 py-2 rounded-lg border-2 relative transition-all flex items-center justify-between ${
                      showResult && isCorrect 
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : showResult && !isCorrect
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-primary bg-primary/10 text-primary'
                    }`}
                  >
                    <span className="font-medium">{vocab?.en || id}</span>
                    {!showResult ? (
                      <button
                        onClick={() => handleRemoveItem(id)}
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
        </div>
      </div>

      {/* Word Bank - All learned vocabulary */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-center">Word Bank:</h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {allWordBankOptions.map(id => {
            const vocab = getVocabularyById(id)
            const isUsed = userOrder.includes(id)
            
            return (
              <button
                key={id}
                onClick={() => !isUsed && !showResult && handleItemClick(id)}
                disabled={isUsed || showResult}
                className={`px-3 py-2 rounded-lg border-2 transition-all ${
                  isUsed 
                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'border-primary/30 bg-white hover:border-primary hover:bg-primary/5 hover:scale-105 cursor-pointer'
                } ${showResult ? 'cursor-not-allowed' : ''}`}
              >
                <span className="font-medium">{vocab?.en || id}</span>
              </button>
            )
          })}
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">
          Click words to add them to your sequence above
        </p>
      </div>

      {/* Submit Button */}
      {!showResult && (
        <div className="text-center mb-6">
          <Button
            onClick={handleSubmit}
            disabled={userOrder.length !== sequence.length}
            className="gap-2"
            size="lg"
          >
            Check My Answer ({userOrder.length}/{sequence.length})
          </Button>
        </div>
      )}

      {/* Result Feedback */}
      {showResult && (
        <div className={`text-center p-4 rounded-lg mb-6 ${
          isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          <p className="text-lg font-semibold mb-2">
            {isCorrect ? '✅ Perfect sequence!' : '❌ Not quite right'}
          </p>
          <p className="text-sm">
            {isCorrect 
              ? 'You arranged the words in the correct order!'
              : `Correct order: ${sequence.map(id => getVocabularyById(id)?.en).join(' → ')}`
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