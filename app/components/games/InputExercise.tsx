import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { XpAnimation } from "./XpAnimation"
import { playSuccessSound } from "./Flashcard"

export interface InputExerciseProps {
  question: string
  answer: string
  points?: number
  onComplete: (correct: boolean) => void
  onXpStart?: () => void
}

export function InputExercise({ 
  question = "Type 'How are you?' in Persian (Finglish)",
  answer = "Chetori",
  points = 2,
  onComplete,
  onXpStart
}: InputExerciseProps) {
  const [input, setInput] = useState("")
  const [showFeedback, setShowFeedback] = useState(false)
  const [showXp, setShowXp] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    if (showFeedback && !isCorrect) {
      setShowFeedback(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const isAnswerCorrect = input.toLowerCase().trim() === answer.toLowerCase().trim()
    setIsCorrect(isAnswerCorrect)
    setShowFeedback(true)

    if (isAnswerCorrect) {
      // Play success sound for correct answers
      playSuccessSound();
      setShowXp(true)  // trigger XP animation
    } else {
      // If incorrect, show feedback briefly and then reset
      setTimeout(() => {
        setShowFeedback(false);
        setInput("");
      }, 1500); // Reset after 1.5 seconds
    }
  }

  const toggleHint = () => {
    setShowHint(prev => !prev);
  }

  return (
    <div className="w-full max-w-[90vw] sm:max-w-[80vw] mx-auto py-4">
      <div className="text-center mb-4">
        <h2 className="text-2xl sm:text-3xl font-bold mb-1 text-primary">Practice</h2>
        <p className="text-muted-foreground">Type the correct word in Finglish</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 relative">
        <XpAnimation 
          amount={points} 
          show={showXp}
          onStart={onXpStart}
          onComplete={() => {
            setShowXp(false)  // reset for next use
            onComplete(true)
          }}
        />
        
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-lg sm:text-xl">
              {question}
            </p>
          </div>

          <form id="answerForm" onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              initial={false}
              animate={showFeedback && !isCorrect ? { x: [0, -5, 5, -5, 5, 0] } : {}}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <Input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Type your answer..."
                className={`w-full pr-10 text-base sm:text-lg bg-gray-100 text-gray-800 px-4 py-3 rounded-full shadow-sm transition-all ${
                  showFeedback
                    ? isCorrect
                      ? "ring-2 ring-green-300"
                      : "ring-2 ring-red-300"
                    : "focus:ring-2 focus:ring-primary/50"
                }`}
                disabled={showFeedback && isCorrect}
              />
              <AnimatePresence>
                {showFeedback && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute right-3 top-0 bottom-0 flex items-center"
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Hint Toggle (Collapsible Pill) - Added more margin, responsive */}
            <div className="mt-3 mb-4 sm:mb-6">
              <div className="bg-gray-100 rounded-full">
                <button 
                  type="button"
                  onClick={toggleHint}
                  className="w-full flex items-center justify-center p-2 text-sm text-gray-600 hover:bg-gray-200 transition-colors duration-200"
                >
                  <span className="mr-1">🔍</span>
                  <span>Need a hint?</span>
                  {showHint ? 
                    <ChevronUp className="ml-1 h-4 w-4" /> : 
                    <ChevronDown className="ml-1 h-4 w-4" />
                  }
                </button>
                
                {/* Simplified hint display without height animation */}
                {showHint && (
                  <div className="px-4 pb-3 pt-1">
                    <p className="text-center text-green-700 font-medium">
                      <span className="mr-1">📣</span> Starts with: "che..."
                    </p>
                  </div>
                )}
              </div>
            </div>
          </form>

          <AnimatePresence>
            {showFeedback && !isCorrect && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center text-red-500 mt-3 text-sm"
              >
                Almost! Try again.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Motivation Bubble - Moved outside the main container */}
      <div className="mt-5 mb-4 sm:mt-6 sm:mb-5">
        <div className="bg-primary/5 p-3 rounded-xl text-center">
          <p className="text-sm text-gray-600 font-normal">
            💡 Remember what you learned from the flashcard!
          </p>
        </div>
      </div>
      
      {/* Submit button - Moved outside the main container */}
      <Button
        type="submit"
        form="answerForm"
        className="w-full text-base sm:text-lg py-3 mt-2"
        disabled={showFeedback && isCorrect}
      >
        Check Answer
      </Button>
    </div>
  )
}
