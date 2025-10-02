"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Loader2 } from "lucide-react"
import Link from "next/link"
import confetti from "canvas-confetti"

export default function SubscribeSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fire confetti celebration
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        clearInterval(interval)
        return
      }

      const particleCount = 50 * (timeLeft / duration)

      confetti({
        particleCount,
        angle: randomInRange(55, 125),
        spread: randomInRange(50, 70),
        origin: { y: 0.6 }
      })
    }, 250)

    // Simulate checking payment status
    setTimeout(() => {
      setLoading(false)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 flex items-center justify-center py-12 px-4">
      <Card className="max-w-2xl w-full border-2 border-green-500/20 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          {loading ? (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
              <CardTitle className="text-2xl">Processing your subscription...</CardTitle>
            </>
          ) : (
            <>
              <div className="h-16 w-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-3xl">Welcome to Premium! 🎉</CardTitle>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {!loading && (
            <>
              <div className="text-center space-y-2">
                <p className="text-lg text-muted-foreground">
                  Your subscription is now active. You have full access to all modules and lessons!
                </p>
              </div>

              <div className="bg-primary/5 rounded-lg p-6 space-y-3">
                <h3 className="font-semibold text-lg">What's Next?</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Explore all modules - Module 2 and beyond are now unlocked</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Continue building your XP and track your progress</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Practice with interactive games and real-life scenarios</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Manage your subscription anytime from account settings</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => router.push('/modules')}
                  size="lg"
                  className="w-full"
                >
                  Start Learning Now
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/account')}
                  className="w-full"
                >
                  View Account Settings
                </Button>
              </div>

              {sessionId && (
                <p className="text-xs text-center text-muted-foreground">
                  Confirmation ID: {sessionId.substring(0, 20)}...
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

