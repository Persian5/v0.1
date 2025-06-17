import { useState } from "react"
import { Button } from "@/components/ui/button"
import { XpAnimation } from "./XpAnimation"
import { playSuccessSound } from "./Flashcard"

interface MultipleChoiceProps {
  question: string
  options: string[]
  correctAnswer: string
  onContinue: () => void
}

export function MultipleChoice({
  question,
  options,
  correctAnswer,
  onContinue,
}: MultipleChoiceProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showXp, setShowXp] = useState(false)
  const [isAnswered, setIsAnswered] = useState(false)

  const handleAnswer = (option: string) => {
    if (isAnswered) return
    
    // Update UI state only
    setSelectedAnswer(option)
    setIsAnswered(true)
    
    // If correct answer
    if (option === correctAnswer) {
      // Play success sound
      playSuccessSound();
      setTimeout(() => {
        setShowXp(true)
      }, 300)
    }
  }

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-primary">Multiple Choice</h2>
        <p className="text-muted-foreground">Select the correct translation</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 relative w-full">
        <XpAnimation
          amount={2}
          show={showXp}
          onStart={() => {
            // ▶ XP update fired here at animation start
            const current = parseInt(localStorage.getItem('points') || '0')
            const updated = current + 2
            localStorage.setItem('points', updated.toString())
            const pointsElement = document.getElementById('points-display')
            if (pointsElement) {
              pointsElement.textContent = updated.toString()
            }
          }}
          onComplete={() => {
            // ▶ Lesson advance fired here at animation end
            onContinue()
            setShowXp(false)   // reset for next question
          }}
        />
        
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-center mb-6">{question}</h3>
          
          <div className="grid gap-3">
            {options.map((option, index) => (
              <Button
                key={index}
                variant={selectedAnswer === option ? "default" : "outline"}
                className={`w-full justify-start ${
                  isAnswered && option === correctAnswer
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : isAnswered && selectedAnswer === option && option !== correctAnswer
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : ""
                }`}
                onClick={() => handleAnswer(option)}
                disabled={isAnswered}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 