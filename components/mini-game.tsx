"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function MiniGame() {
  const [answer, setAnswer] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showIncorrect, setShowIncorrect] = useState(false)

  const handleAnswer = (selectedAnswer: string) => {
    setAnswer(selectedAnswer)
    if (selectedAnswer === "Salam") {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    } else {
      setShowIncorrect(true)
      setTimeout(() => setShowIncorrect(false), 1500)
    }
  }

  return (
    <Card className="border-primary/20 shadow-md rounded-xl overflow-hidden relative">
      <CardHeader className="bg-primary/10 pb-4">
        <CardTitle className="text-xl sm:text-2xl text-primary text-center">Interactive Language Mini-Game</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 pb-8">
        <h3 className="text-lg sm:text-xl font-medium text-center mb-6">How do you say "Hello" in Persian?</h3>

        <div className="grid grid-cols-2 gap-4">
          {["Khoshgel", "Salam", "Merci", "Halet chetore"].map((option) => (
            <Button
              key={option}
              variant={answer === option ? (option === "Salam" ? "default" : "destructive") : "outline"}
              className={`py-6 text-lg ${answer === option && option === "Salam" ? "bg-green-600" : ""}`}
              onClick={() => handleAnswer(option)}
            >
              {option}
            </Button>
          ))}
        </div>

        {showConfetti && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div className="absolute top-0 left-1/4 text-4xl animate-bounce">🎉</div>
            <div className="absolute top-10 left-1/2 text-4xl animate-bounce" style={{ animationDelay: "0.2s" }}>
              🎊
            </div>
            <div className="absolute top-0 right-1/4 text-4xl animate-bounce" style={{ animationDelay: "0.4s" }}>
              ✨
            </div>
          </div>
        )}

        {answer === "Salam" && (
          <div className="mt-6 p-4 bg-green-100 text-green-800 rounded-lg text-center">
            <p className="font-medium">Nice! You just learned your first word — Salam 👋 means Hello!</p>
          </div>
        )}

        {showIncorrect && (
          <div className="mt-6 p-4 bg-red-100 text-red-800 rounded-lg text-center">
            <p className="font-medium">Incorrect. Try Again!</p>
          </div>
        )}

        {answer === "Salam" && (
          <div className="mt-6 flex justify-center">
            <Button className="bg-primary hover:bg-primary/90 text-white">Next word →</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
