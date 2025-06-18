"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { ChevronRight, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

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
    router.push('/modules')
  }

  // Only render the button content after hydration
  const buttonContent = isClient ? (
    <Button
      size="lg"
      className="bg-accent hover:bg-accent/90 text-white transition-all duration-300 rounded-full sm:px-8 sm:py-6 px-4 py-4 text-base sm:text-lg w-full sm:w-auto"
      aria-label="Preview Lesson 1"
      onClick={() => {
        window.location.href = '/modules/module1/lesson1';
      }}
    >
      Preview Lesson 1
    </Button>
  ) : (
    <Button
      size="lg"
      className="bg-accent hover:bg-accent/90 text-white transition-all duration-300 rounded-full sm:px-8 sm:py-6 px-4 py-4 text-base sm:text-lg w-full sm:w-auto"
      aria-label="Preview Lesson 1"
      disabled
    >
      Loading...
    </Button>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navbar with Eslimi-inspired border */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative">
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20"></div>
        <div className="flex h-16 items-center justify-between px-3 sm:px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-base sm:text-lg text-primary">
            Home
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/pricing">
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                Pricing + FAQ
              </Button>
            </Link>
            <Link href="/modules">
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-white">
                Start Learning
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section with Duolingo-style layout */}
        <section className="bg-primary/10 flex items-center justify-center px-3 sm:px-6 md:px-8 lg:px-12 pt-6 pb-12 sm:pt-8 sm:pb-16 md:pt-12 md:pb-24">
          <div className="max-w-6xl mx-auto w-full">
            {/* Desktop layout: side by side */}
            <div className="hidden sm:flex flex-row items-center justify-between gap-6 md:gap-12">
              {/* Left Column: Image - stays on left for desktop */}
              <div className="w-1/3 md:w-2/5 flex justify-center md:justify-end">
                <img 
                  src="/icons/icon1.png" 
                  alt="Iranopedia Logo" 
                  className="w-full max-w-[180px] md:max-w-[280px] lg:max-w-[320px] object-contain"
                />
              </div>
              
              {/* Right Column: Text and Buttons - stays on right for desktop */}
              <div className="w-2/3 md:w-3/5 flex flex-col items-start text-left">
                <p className="text-xs text-emerald-700 font-normal mb-3 sm:mb-4 tracking-wide uppercase">
                  An Iranopedia App
                </p>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary mb-2 md:mb-5">
              Learn Persian. Reconnect with Your Roots.
            </h1>
                <p className="text-lg md:text-2xl text-muted-foreground mb-4 md:mb-7 max-w-md">
                  Start speaking Persian today — with fun, bite-sized lessons
                </p>
                <div className="flex flex-row gap-3 w-auto">
                  {buttonContent}
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-accent text-accent hover:bg-accent/10 transition-all duration-300 rounded-full px-8 py-6 text-lg w-auto"
                    onClick={handleStartLearning}
                    aria-label="Start Learning Persian"
                  >
                    Start Learning
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile layout: stacked with image between subheading and buttons */}
            <div className="flex sm:hidden flex-col items-center text-center">
              <p className="text-xs text-emerald-700 font-normal mb-3 tracking-wide uppercase">
                An Iranopedia App
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-primary mb-3 leading-tight">
                Learn Persian.<br />
                <span className="whitespace-nowrap text-3xl">Reconnect with Your Roots.</span>
              </h1>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                Start speaking Persian today — with fun, bite-sized lessons
              </p>
              
              {/* Mobile: Image between text and buttons */}
              <div className="w-[60%] max-w-[200px] flex justify-center mb-5">
                <img 
                  src="/icons/icon1.png" 
                  alt="Iranopedia Logo" 
                  className="w-full object-contain"
                />
              </div>
              
              <div className="flex flex-col gap-3 w-full">
                {buttonContent}
                <Button
                  size="lg"
                  variant="outline"
                  className="border-accent text-accent hover:bg-accent/10 transition-all duration-300 rounded-full px-4 py-4 text-base w-full"
                  onClick={handleStartLearning}
                  aria-label="Start Learning Persian"
                >
                  Start Learning
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Persian Carpet Border */}
        <div className="w-full h-3 bg-[url('/carpet-border.svg')] bg-repeat-x"></div>

        {/* World Map Section with subtle Girih pattern and Tehran skyline */}
        <section className="py-8 px-3 sm:px-4 bg-gradient-to-b from-blue-50 to-green-50 relative">
          <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cGF0aCBkPSJNMCAwaDQwdjQwSDBWMHptMjAgMTBMMTAgMjBoMjBMMjAgMTB6IiBmaWxsPSIjMjc3QzUyIiBmaWxsLW9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')]"></div>
          <div className="absolute inset-x-0 bottom-0 h-48 opacity-15 bg-[url('/tehran.png')] bg-bottom bg-contain bg-repeat-x"></div>
          <div className="max-w-6xl mx-auto text-center relative z-10">
            <h2 className="sm:text-3xl md:text-4xl font-bold text-primary mb-4" style={{ fontSize: '19px' }}>
              Start Your Persian Learning Journey Today!
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-6">Iranian culture is everywhere. You belong here.</p>
          </div>
        </section>

        {/* Gamified Features Section with geometric pattern background - MOVED HERE */}
        <section className="py-8 px-3 sm:px-6 bg-gradient-to-br from-blue-50 via-white to-green-50 border-y border-primary/10 relative">
          <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDUwIDUwIj48cGF0aCBkPSJNMjUsMCBMMCwyNSA1MCwyNSBaIE0wLDI1IEwwLDUwIDI1LDI1IFogTTUwLDI1IEw1MCw1MCAyNSwyNSBaIE0yNSw1MCBMMCw1MCAyNSwyNSA1MCw1MCBaIiBmaWxsPSIjMjc3QzUyIiBmaWxsLW9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')]"></div>
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-10 animate-fade-in">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-primary inline-flex items-center">
                <span className="mr-2">🎮</span> Gamified Learning Experience
              </h2>
              <p className="text-lg sm:text-xl text-gray-700 mb-4">
                Our learners don't just study — they level up. Track your streaks, speak aloud with real-time feedback,
                and climb the leaderboard as you grow.
              </p>
              <p className="text-base text-gray-600">
                Join thousands of learners already on the journey — start learning Persian today.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-6 md:gap-8">
              {/* Card 1: Leaderboard Mockup */}
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-3 sm:p-6 card-hover h-full relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10"></div>
                <h3 className="text-base sm:text-xl font-bold mb-2 sm:mb-4 flex justify-center items-center">
                  <span className="text-lg sm:text-2xl mr-1 sm:mr-2">🏆</span> Leaderboard
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center py-1 sm:py-2 px-2 sm:px-3 bg-gray-50 rounded-lg text-xs sm:text-base">
                    <span className="font-medium">PersianPro92</span>
                    <span className="text-gray-600">2,540 XP</span>
                  </div>
                  <div className="flex justify-between items-center py-1 sm:py-2 px-2 sm:px-3 text-xs sm:text-base">
                    <span className="font-medium">PersianFanatic</span>
                    <span className="text-gray-600">2,210 XP</span>
                  </div>
                  <div className="flex justify-between items-center py-1 sm:py-2 px-2 sm:px-3 bg-gray-50 rounded-lg text-xs sm:text-base">
                    <span className="font-medium">KoobidehKing</span>
                    <span className="text-gray-600">1,980 XP</span>
                  </div>
                  <div className="flex justify-between items-center py-1 sm:py-2 px-2 sm:px-3 bg-blue-50 rounded-lg text-xs sm:text-base">
                    <span className="font-medium text-blue-600">You</span>
                    <span className="text-blue-600">1,450 XP</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Streak Popup Mockup */}
              <div className="bg-gradient-to-br from-yellow-100 via-orange-50 to-amber-100 rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-3 sm:p-6 card-hover text-center h-full relative">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent/10 via-accent/30 to-accent/10"></div>
                <div className="absolute -top-3 -right-3 w-8 h-8 sm:w-12 sm:h-12 bg-orange-400 rounded-full flex items-center justify-center text-white text-base sm:text-xl font-bold opacity-80 shadow-sm">
                  +5
                </div>
                <h3 className="text-base sm:text-xl font-bold mb-2 sm:mb-3 flex justify-center items-center">
                  <span className="text-lg sm:text-2xl mr-1 sm:mr-2">🔥</span> Well Done!
                </h3>
                <p className="text-gray-700 mb-2 sm:mb-4 text-xs sm:text-base">You've completed today's lesson!</p>
                <div className="text-2xl sm:text-4xl font-bold text-orange-500 mb-2 sm:mb-4">5-Day Streak</div>
                <div className="py-2 sm:py-3 px-2 sm:px-4 bg-white/60 backdrop-blur-sm rounded-lg sm:rounded-xl text-xs sm:text-base">
                  <p className="text-gray-700 font-medium">Keep it going tomorrow!</p>
                </div>
              </div>

              {/* Card 3: Pronunciation Score Mockup */}
              <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-3 sm:p-6 card-hover text-center h-full relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/10 via-accent/20 to-primary/10"></div>
                <h3 className="text-base sm:text-xl font-bold mb-2 sm:mb-4 flex justify-center items-center">
                  <span className="text-lg sm:text-2xl mr-1 sm:mr-2">🎤</span> Pronunciation Score
                </h3>
                <div className="text-4xl sm:text-6xl mb-3 sm:mb-6 animate-pulse">🎙️</div>
                <div className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">Your score: 82%</div>
                <button className="bg-primary/10 hover:bg-primary/20 text-primary font-medium py-2 px-4 sm:py-3 sm:px-6 rounded-full transition-all duration-300 hover:scale-105 text-xs sm:text-base">
                  Try Again!
                </button>
              </div>

              {/* Card 4: Mini Games */}
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-3 sm:p-6 card-hover h-full relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent/10 via-accent/30 to-accent/10"></div>
                <h3 className="text-base sm:text-xl font-bold mb-2 sm:mb-4 flex justify-center items-center">
                  <span className="text-lg sm:text-2xl mr-1 sm:mr-2">🎮</span> Mini Games
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center">
                    <div className="text-2xl sm:text-4xl mb-1 sm:mb-2">🎯</div>
                    <p className="font-medium text-primary text-xs sm:text-base">Today's Challenge</p>
                    <p className="text-sm sm:text-lg font-bold text-gray-700">Match 10 Persian Words</p>
                  </div>

                  <div className="relative">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '20%' }}></div>
                    </div>
                    <div className="text-center text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">2/10 Words</div>
                  </div>
                </div>
              </div>

              {/* Card 5: Unlockables */}
              <div className="bg-gradient-to-br from-indigo-50 via-white to-teal-50 rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-3 sm:p-6 card-hover h-full relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10"></div>
                <h3 className="text-base sm:text-xl font-bold mb-2 sm:mb-4 flex justify-center items-center">
                  <span className="text-lg sm:text-2xl mr-1 sm:mr-2">📖</span> Story Mode
                </h3>
                <div className="flex flex-col items-center text-center">
                  <p className="text-gray-700 text-xs sm:text-base font-medium mb-2">New Story Unlocked!</p>
                  <p className="text-base sm:text-lg font-bold text-primary mb-2 sm:mb-3">
                    🧆 "Nowruz at Grandma's House"
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                    Place yourself in real-world conversations and learn Persian through immersive stories!
                  </p>
                  <button className="bg-primary/10 hover:bg-primary/20 text-primary font-medium py-2 px-4 sm:py-3 sm:px-6 rounded-full transition-all duration-300 hover:scale-105 text-xs sm:text-base inline-flex items-center">
                    <span className="mr-1">▶️</span> Start Story
                  </button>
                </div>
              </div>

              {/* Card 6: Badge Preview */}
              <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-3 sm:p-6 card-hover h-full relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent/10 via-accent/30 to-accent/10"></div>
                <h3 className="text-base sm:text-xl font-bold mb-2 sm:mb-4 flex justify-center items-center">
                  <span className="text-lg sm:text-2xl mr-1 sm:mr-2">🎖️</span> Badge Preview
                </h3>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <span className="text-2xl sm:text-3xl">👨‍👩‍👧‍👦</span>
                  </div>
                  <p className="font-bold text-base sm:text-lg text-primary mb-2">Mehmooni Ready</p>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 text-center">
                  You can now properly introduce yourself at Persian gatherings.
                </p>
                <div className="flex flex-col items-center">
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '3%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500">Badges Unlocked: 1 of 35</p>
                </div>
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
    </div>
  )
}
