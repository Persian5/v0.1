"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { ChevronRight, X, Heart, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { AuthModal } from "@/components/auth/AuthModal"

export default function HomePage() {
  const router = useRouter()
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null)
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [progressValue, setProgressValue] = useState(0)
  const correctAnswer = "salaam"

  // Persian Phrases Section
  const phrases = [
    { persian: "Salam", english: "Hello", emoji: "👋" },
    { persian: "Merci", english: "Thank you", emoji: "🙏" },
    { persian: "Dooset daram", english: "I love you", emoji: "❤️" },
    { persian: "Chetori?", english: "How are you?", emoji: "🙂" },
    { persian: "Khoobam", english: "I'm good", emoji: "😌" },
    { persian: "Esme shoma chieh?", english: "What's your name?", emoji: "🧑‍💼" },
    { persian: "Khodahafez", english: "Goodbye", emoji: "👋" },
  ]

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const [isPhraseFading, setIsPhraseFading] = useState(false)
  const [phraseProgressValue, setPhraseProgressValue] = useState(0)
  const phraseTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Mini-Game Section
  const [miniGameAnswer, setMiniGameAnswer] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showIncorrect, setShowIncorrect] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isLearningNavigating, setIsLearningNavigating] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Animate progress bar on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgressValue(33)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Phrase carousel with progress bar
  useEffect(() => {
    // Reset progress when phrase changes
    setPhraseProgressValue(0)

    // Animate progress over 4 seconds
    const progressInterval = setInterval(() => {
      setPhraseProgressValue((prev) => {
        if (prev >= 100) return 100
        return prev + 1
      })
    }, 40) // 4000ms / 100 steps = 40ms per step

    // Move to next phrase after 4 seconds
    phraseTimerRef.current = setTimeout(() => {
      setIsPhraseFading(true)
      setTimeout(() => {
        setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length)
        setIsPhraseFading(false)
      }, 500)
    }, 4000)

    return () => {
      clearInterval(progressInterval)
      if (phraseTimerRef.current) clearTimeout(phraseTimerRef.current)
    }
  }, [currentPhraseIndex])

  const handleMiniGameAnswer = (selectedAnswer: string) => {
    setMiniGameAnswer(selectedAnswer)
    if (selectedAnswer === "Salam") {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    } else {
      setShowIncorrect(true)
      // Reset quickly after showing incorrect message
      setTimeout(() => {
        setShowIncorrect(false)
        setMiniGameAnswer(null)
      }, 800)
    }
  }

  const handleStartLearning = () => {
    setIsLearningNavigating(true)
    router.push('/modules')
  }

  const handleCreateAccount = () => {
    setAuthModalOpen(true)
  }

  const handlePreviewLessons = () => {
    router.push('/modules')
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        {/* Hero Section with Duolingo-style layout */}
        <section className="bg-primary/10 flex items-center justify-center px-3 sm:px-6 md:px-8 lg:px-12 py-8 sm:py-12 md:py-16">
          <div className="max-w-6xl mx-auto w-full">
            {/* Desktop layout: side by side */}
            <div className="hidden sm:flex flex-col items-center gap-6 md:gap-8">
              {/* Top row: Image and Text aligned */}
              <div className="flex flex-row items-center justify-between gap-6 md:gap-12 w-full">
                {/* Left Column: Image */}
              <div className="w-1/3 md:w-2/5 flex justify-center md:justify-end">
                <img 
                  src="/icons/icon1.png" 
                  alt="Iranopedia Logo" 
                  className="w-full max-w-[180px] md:max-w-[280px] lg:max-w-[320px] object-contain"
                />
              </div>
              
                {/* Right Column: Text only */}
              <div className="w-2/3 md:w-3/5 flex flex-col items-start text-left">
                <p className="text-xs text-emerald-700 font-normal mb-3 sm:mb-4 tracking-wide uppercase">
                  Finglish by Iranopedia
                </p>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary mb-2 md:mb-5">
              Learn Persian. Reconnect with Your Roots.
            </h1>
                  <p className="text-lg md:text-2xl text-muted-foreground mb-0">
                  Start speaking Persian today with fun, bite sized lessons
                </p>
                </div>
              </div>
              
              {/* Bottom row: Two buttons side by side */}
              <div className="flex justify-center w-full">
                <div className="w-2/3 flex flex-col items-center gap-4">
                  {/* Buttons side by side */}
                  <div className="flex flex-row gap-4 w-full">
                    {/* Primary Button: Create Free Account */}
                    <div className="flex-1 flex flex-col items-center">
                      <Button
                        size="lg"
                        className="bg-accent hover:bg-accent/90 text-white transition-all duration-300 rounded-full px-8 py-4 text-lg font-semibold hover:scale-105 shadow-lg hover:shadow-xl w-full"
                        onClick={handleCreateAccount}
                        aria-label="Create Free Account"
                      >
                        Create Free Account
                      </Button>
                    </div>
                    
                    {/* Secondary Button: Preview Lesson 1 Free - White fill with red text */}
                    <div className="flex-1 flex flex-col items-center">
                      <Button
                        size="lg"
                        className="bg-white hover:bg-white/90 text-accent border-2 border-accent transition-all duration-300 rounded-full px-8 py-4 text-lg font-semibold hover:scale-105 shadow-lg hover:shadow-xl w-full"
                        onClick={handlePreviewLessons}
                        aria-label="Preview Lesson 1 Free"
                        disabled={isLearningNavigating}
                      >
                        {isLearningNavigating ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Preview Lesson 1 Free"
                        )}
                      </Button>
                    </div>
                  </div>
                  {/* Subtext below buttons */}
                  <p className="text-sm text-muted-foreground">
                    Instant access · No credit card needed
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile layout: stacked with image between subheading and buttons */}
            <div className="flex sm:hidden flex-col items-center text-center">
              <p className="text-xs text-emerald-700 font-normal mb-3 tracking-wide uppercase">
                Finglish by Iranopedia
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-primary mb-3 leading-tight">
                Learn Persian.<br />
                <span className="whitespace-nowrap text-3xl">Reconnect with Your Roots.</span>
              </h1>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                Start speaking Persian today with fun, bite sized lessons
              </p>
              
              {/* Mobile: Image between text and buttons */}
              <div className="w-[60%] max-w-[200px] flex justify-center mb-5">
                <img 
                  src="/icons/icon1.png" 
                  alt="Iranopedia Logo" 
                  className="w-full object-contain"
                />
              </div>
              
              {/* Two buttons stacked for mobile */}
              <div className="w-full px-4 flex flex-col items-center gap-4">
                {/* Primary Button: Create Free Account */}
                <div className="w-full flex flex-col items-center">
                  <Button
                    size="lg"
                    className="bg-accent hover:bg-accent/90 text-white transition-all duration-300 rounded-full px-8 py-4 text-lg font-semibold w-full hover:scale-105 shadow-lg"
                    onClick={handleCreateAccount}
                    aria-label="Create Free Account"
                  >
                    Create Free Account
                  </Button>
                  <p className="text-sm text-muted-foreground mt-3">
                    Instant access · No credit card needed
                  </p>
                </div>
                
                {/* Secondary Button: Preview Lesson 1 Free - White fill with red text */}
                <Button
                  size="lg"
                  className="bg-white hover:bg-white/90 text-accent border-2 border-accent transition-all duration-300 rounded-full px-8 py-4 text-lg font-semibold w-full hover:scale-105 shadow-lg"
                  onClick={handlePreviewLessons}
                  aria-label="Preview Lesson 1 Free"
                  disabled={isLearningNavigating}
                >
                  {isLearningNavigating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Preview Lesson 1 Free"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Persian Carpet Border */}
        <div className="w-full h-3 bg-[url('/carpet-border.svg')] bg-repeat-x"></div>

        {/* Clear Offer Section */}
        <section className="py-12 px-3 sm:px-6 bg-gradient-to-b from-primary/5 to-white">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 border-2 border-primary/20">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-4">
                Start Learning Free — No Signup Required
              </h2>
              <p className="text-lg sm:text-xl text-gray-700 mb-6">
                First module always free. No credit card. No commitment. Just start speaking Persian today.
              </p>
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-white transition-all duration-300 rounded-full px-12 py-6 text-xl font-semibold hover:scale-105 shadow-lg hover:shadow-xl"
                onClick={handleStartLearning}
                aria-label="Start Learning Persian Free"
                disabled={isLearningNavigating}
              >
                {isLearningNavigating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Start Learning Free"
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits Section - 3 Cards */}
        <section className="py-12 px-3 sm:px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-4">
                Why Learn Persian with Finglish?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Real results, real conversations, real Persian
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {/* Benefit 1 */}
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 sm:p-8 border border-primary/10">
                <div className="text-4xl sm:text-5xl mb-4 text-center">👨‍👩‍👧‍👦</div>
                <h3 className="text-xl sm:text-2xl font-bold text-primary mb-3 text-center">
                  Speak with Family in 2 Weeks
                </h3>
                <p className="text-gray-700 text-center">
                  Learn the phrases you'll actually use with your Persian family. No textbook fluff—just real conversations.
                </p>
              </div>

              {/* Benefit 2 */}
              <div className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 sm:p-8 border border-primary/10">
                <div className="text-4xl sm:text-5xl mb-4 text-center">⏱️</div>
                <h3 className="text-xl sm:text-2xl font-bold text-primary mb-3 text-center">
                  5 Minutes a Day, No Grammar Books
                </h3>
                <p className="text-gray-700 text-center">
                  Bite-sized lessons that fit your schedule. Learn through games and stories, not boring grammar rules.
                </p>
              </div>

              {/* Benefit 3 */}
              <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 sm:p-8 border border-primary/10">
                <div className="text-4xl sm:text-5xl mb-4 text-center">🎯</div>
                <h3 className="text-xl sm:text-2xl font-bold text-primary mb-3 text-center">
                  Real Phrases, Not Textbook Persian
                </h3>
                <p className="text-gray-700 text-center">
                  Learn how Persians actually talk. Cultural context, practical examples, and phrases you'll use every day.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-12 px-3 sm:px-6 bg-gradient-to-b from-white to-primary/5">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white rounded-xl shadow-md p-8 sm:p-10 border border-primary/10">
              <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-6">
                Trusted by Persian Learners Worldwide
              </h2>
              <p className="text-lg text-gray-700 mb-8">
                Join thousands of learners who are already speaking Persian with confidence.
              </p>
              <div className="flex flex-wrap justify-center gap-6 sm:gap-8 items-center">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">100%</div>
                  <div className="text-sm sm:text-base text-gray-600">Free to Start</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">No</div>
                  <div className="text-sm sm:text-base text-gray-600">Credit Card Required</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">Start</div>
                  <div className="text-sm sm:text-base text-gray-600">Learning Today</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 px-3 sm:px-6 bg-primary/10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-6">
              Ready to Start Your Persian Journey?
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              Join thousands of learners who are already discovering the beauty of Persian language and culture.
            </p>
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-white transition-all duration-300 rounded-full px-12 py-6 text-xl font-semibold hover:scale-105 shadow-lg hover:shadow-xl"
              onClick={handleStartLearning}
              aria-label="Start Learning Persian"
              disabled={isLearningNavigating}
            >
              {isLearningNavigating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  Loading...
                </>
              ) : (
                "Start Learning Free"
              )}
            </Button>
          </div>
        </section>

        {/* Email Capture + Badges Section */}
        <section className="py-16 px-3 sm:px-6 bg-background">
          <div className="max-w-4xl mx-auto">
            {/* Email Capture */}
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
                Not ready yet?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Get free weekly Persian lessons in your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1"
                />
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap"
                >
                  Send me free lessons
                </Button>
              </div>
            </div>

            {/* Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
              <div className="border border-border rounded-lg px-6 py-4 text-center">
                <p className="text-sm text-foreground">Built by Iranian creators</p>
              </div>
              <div className="border border-border rounded-lg px-6 py-4 text-center">
                <p className="text-sm text-foreground">Backed by Iranopedia, the web's #1 Persian culture platform</p>
              </div>
              <div className="border border-border rounded-lg px-6 py-4 text-center">
                <p className="text-sm text-foreground">Designed from real conversations</p>
              </div>
              <div className="border border-border rounded-lg px-6 py-4 text-center">
                <p className="text-sm text-foreground">100% beginner friendly</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer with What is Iranopedia section - Eslimi border */}
      <footer className="bg-gradient-to-b from-green-50 to-green-50 pb-8 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto">
          {/* What is Iranopedia Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8 text-center mx-auto relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/10 via-accent/20 to-primary/10"></div>
            <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-4">What is Iranopedia?</h3>
            <p className="text-lg sm:text-xl text-gray-600 mb-6">
              Iranopedia is your modern guide to Persian culture — from food and cities to art, history, and language.
              Built for Iranians and anyone curious to connect with Iran.
            </p>
            <a
              href="https://iranopedia.com"
              className="inline-flex items-center justify-center bg-primary/10 hover:bg-primary/15 text-primary px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 hover:scale-105"
            >
              Visit Iranopedia.com →
            </a>
          </div>

          {/* Divider with Eslimi-style */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent max-w-3xl mx-auto mb-6"></div>

          {/* Copyright and Links */}
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-8">
              © 2025 Iranopedia — Made with ❤️ for anyone learning Persian
            </p>

            {/* Nav Links */}
            <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4">
              <Link 
                href="/modules"
                className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
              >
                Start Learning
              </Link>
              <Link 
                href="/modules"
                className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
              >
                Learn Phrases
              </Link>
              <a 
                href="https://iranopedia.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
              >
                Iranopedia
              </a>
              <a 
                href="https://www.instagram.com/iranopediaofficial/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
              >
                Instagram
              </a>
              <a 
                href="https://www.tiktok.com/@iranopedia" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
              >
                TikTok
              </a>
            </nav>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setAuthModalOpen(false)
          router.push('/modules')
        }}
      />
    </div>
  )
}
