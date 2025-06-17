"use client"

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Medal, Star, Sparkles, ArrowRight } from "lucide-react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Confetti from 'react-confetti'

interface CompletionPageProps {
  xp?: number;
  resetLesson?: () => void;
  handleViewSummary?: () => void;
}

export default function CompletionPage({ 
  xp = 0, 
  resetLesson,
  handleViewSummary
}: CompletionPageProps) {
  const { moduleId, lessonId } = useParams();
  const router = useRouter();
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  
  // Waitlist form state
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const storedValue = localStorage.getItem('isSubscribed')
    setIsSubscribed(storedValue === 'true')
  }, [])
  
  // Default handlers if not provided via props
  const handleReset = () => {
    if (resetLesson) {
      resetLesson();
    } else {
      router.push(`/modules/${moduleId}/${lessonId}`);
    }
  };
  
  const navigateToSummary = () => {
    if (handleViewSummary) {
      handleViewSummary();
    } else {
      router.push(`/modules/${moduleId}/${lessonId}/summary`);
    }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, source: "lesson-completion" }),
      })

      // Check if the response is JSON
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Failed to subscribe')
        }
        setIsSubscribed(true)
        localStorage.setItem('isSubscribed', 'true')
        setShowConfetti(true)
        setEmail("")

        // Hide confetti after 3 seconds
        setTimeout(() => setShowConfetti(false), 3000)
      } else {
        // If not JSON, get the text and throw an error
        const text = await response.text()
        throw new Error('Server error: ' + text)
      }
    } catch (err) {
      console.error('Waitlist submission error:', err)
      setError(err instanceof Error ? err.message : 'Failed to subscribe. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto text-center animate-fade-in w-full sm:w-auto py-8">
      {showConfetti && isClient && <Confetti recycle={false} numberOfPieces={200} />}
      
      {/* Medal Icon with Pulse */}
      <div className="relative mx-auto w-24 h-24 mb-6">
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 blur-sm animate-pulse"></div>
        <div className="relative bg-amber-400 rounded-full p-4 flex justify-center items-center h-full">
          <Medal className="h-12 w-12 text-white" />
        </div>
      </div>
      
      {/* Celebration Heading */}
      <h2 className="text-4xl font-bold mb-2 text-primary">
        🥳 INCREDIBLE JOB!
      </h2>
      
      {/* Subheading */}
      <p className="text-xl text-muted-foreground mb-4">
        You helped Ali master his greetings!
      </p>
      
      {/* XP Badge */}
      <div className="bg-accent/10 rounded-lg p-4 mb-6 flex justify-center items-center gap-3">
        <Star className="h-6 w-6 text-yellow-500" />
        <span className="text-2xl font-bold">{xp} XP</span>
        <Sparkles className="h-5 w-5 text-yellow-500" />
      </div>
      
      {/* Encouraging Text */}
      <p className="text-muted-foreground mb-8">
        You're making incredible progress! Keep going to become fluent in Persian!
      </p>
      
      {/* Action Buttons */}
      <div className="space-y-4">
        <Button 
          className="w-full text-lg py-6" 
          onClick={() => setShowWaitlistModal(true)}
        >
          Sign up for FREE Beta Access Waitlist
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full"
          onClick={navigateToSummary}
        >
          View Summary <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>

      {/* Waitlist Modal */}
      <AnimatePresence>
        {showWaitlistModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowWaitlistModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {isSubscribed ? (
                <>
                  <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-primary text-center">
                    You're on the list! 🎉
                  </h3>
                  <p className="text-lg sm:text-xl text-center text-gray-600 mb-6">
                    You're officially part of the early access crew! We'll let you know the moment the full platform is ready.
                  </p>
                  <Button 
                    onClick={() => setShowWaitlistModal(false)}
                    className="w-full bg-primary hover:bg-primary/90 text-white text-lg"
                  >
                    Close
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-primary text-center">
                    Join Our Free Beta Waitlist
                  </h3>
                  <p className="text-lg sm:text-xl text-center text-gray-600 mb-6">
                    Waitlist closes before launch. No commitment. Reserve your spot.
                  </p>
                  <form
                    onSubmit={handleWaitlistSubmit}
                    className="w-full mx-auto"
                  >
                    <div className="flex flex-col gap-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        className="w-full border rounded px-3 py-2 text-lg"
                        disabled={isLoading}
                        aria-label="Email address"
                        aria-describedby="email-error"
                      />
                      <Button 
                        type="submit" 
                        className="w-full bg-primary hover:bg-primary/90 text-white text-lg"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Joining...' : 'Join Waitlist'}
                      </Button>
                    </div>
                    {error && (
                      <p id="email-error" className="text-red-500 mt-2 text-sm text-center" role="alert">
                        {error}
                      </p>
                    )}
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 