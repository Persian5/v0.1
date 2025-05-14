import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { XpAnimation } from "./XpAnimation"
import { playSuccessSound } from "./Flashcard"

interface FillInTheBlankProps {
  question: string
  correctAnswer: string
  onContinue: () => void
}

export function FillInTheBlank({
  question,
  correctAnswer,
  onContinue,
}: FillInTheBlankProps) {
  const [answer, setAnswer] = useState("")
  const [showXp, setShowXp] = useState(false)
  const [isAnswered, setIsAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const handleCheck = () => {
    if (isAnswered) return
    const correct = answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
    setIsCorrect(correct)
    setIsAnswered(true)
    
    // If the answer is correct, play success sound
    if (correct) {
      playSuccessSound();
    }
    
    // Trigger animation 
    setShowXp(true)  // trigger XP animation
  }

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-primary">Fill in the Blank</h2>
        <p className="text-muted-foreground">Type the correct translation</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 relative w-full">
        <XpAnimation 
          amount={2} 
          show={showXp}
          onComplete={() => {
            // Removed storage-based XP update; using setXp in parent
            onContinue()  // advance parent immediately
            setShowXp(false)  // reset for next use
          }}
        />
        
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-center mb-6">{question}</h3>
          
          <div className="flex flex-col gap-4">
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className={`w-full p-3 rounded-lg border-2 ${
                isAnswered
                  ? isCorrect
                    ? "border-green-500 bg-green-50"
                    : "border-red-500 bg-red-50"
                  : "border-gray-200"
              }`}
              placeholder="Type your answer here..."
              disabled={isAnswered}
            />
            
            <Button
              onClick={handleCheck}
              disabled={isAnswered || !answer.trim()}
              className="w-full"
            >
              Check Answer
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 