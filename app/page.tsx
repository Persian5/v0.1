"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { ChevronRight, X, Heart, Loader2, Users, Clock, BookOpen, MessageSquare, Trophy, RotateCw, Volume2, Sparkles, Check, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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

    const startTime = Date.now()
    const duration = 4000 // 4 seconds

    // Use requestAnimationFrame for smoother, more efficient animation
    let animationFrameId: number
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min((elapsed / duration) * 100, 100)
      
      setPhraseProgressValue(progress)

      if (progress < 100) {
        animationFrameId = requestAnimationFrame(animate)
      }
    }

    animationFrameId = requestAnimationFrame(animate)

    // Move to next phrase after 4 seconds
    phraseTimerRef.current = setTimeout(() => {
      setIsPhraseFading(true)
      setTimeout(() => {
        setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length)
        setIsPhraseFading(false)
      }, 500)
    }, 4000)

    return () => {
      cancelAnimationFrame(animationFrameId)
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
        {/* Hero Section */}
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

        {/* SECTION 1: Why Learn Persian with Finglish */}
        <section className="py-16 md:py-24 px-4 bg-primary/5">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                Why Learn Persian with Finglish?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Real conversations. Real culture. Zero grammar-book trauma.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {/* Card 1 - Real family conversations */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="group bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors mb-4">
                    <Users className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium text-primary/70 mb-2">
                    Speak with family in 2 weeks
                  </p>
                  <h3 className="text-xl md:text-2xl font-semibold mb-3">
                    Real family conversations
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    Learn the exact phrases you'll use with parents, grandparents, cousins, and friends — from greetings and small talk to inside jokes. No fluffy textbook dialogues.
                  </p>
                </div>
              </motion.div>

              {/* Card 2 - Fits into a busy life */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="group bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-xl bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors mb-4">
                    <Clock className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium text-accent/70 mb-2">
                    5–10 minutes a day
                  </p>
                  <h3 className="text-xl md:text-2xl font-semibold mb-3">
                    Fits into a busy life
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    Short, game-like lessons you can finish while waiting for coffee. Streaks, XP, and mini-challenges keep you coming back without feeling like 'homework.'
                  </p>
                </div>
              </motion.div>

              {/* Card 3 - Built for Persian beginners */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="group bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors mb-4">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium text-primary/70 mb-2">
                    Finglish now, alphabet later
                  </p>
                  <h3 className="text-xl md:text-2xl font-semibold mb-3">
                    Built for Persian beginners
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    Start in Finglish so you can speak fast, even if you can't read the Persian script yet. When you're ready, unlock alphabet lessons and reading practice.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Social Proof Strip */}
        <section className="py-10 px-4 bg-primary/5 border-y border-gray-200">
          <div className="max-w-5xl mx-auto">
            <h3 className="text-center text-xl md:text-2xl font-semibold text-primary mb-6">
              Trusted by Persian learners worldwide
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <p className="text-sm md:text-base text-gray-700">
                Created by <span className="font-semibold text-primary">Iranopedia</span> — the web's go-to guide for Persian culture (20,000+ monthly visitors).
              </p>
              <p className="text-sm md:text-base text-gray-700">
                Backed by <span className="font-semibold text-primary">200M+ views</span> across Iranopedia's social channels.
              </p>
              <p className="text-sm md:text-base text-gray-700">
                Designed with real conversations from the <span className="font-semibold text-primary">Iranian diaspora</span>.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3: How It Works - 3-step narrative */}
        <section className="py-16 md:py-24 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                How Finglish gets you speaking fast
              </h2>
              <p className="text-lg text-muted-foreground">
                Your first real Persian conversation is just a few steps away.
              </p>
            </div>

            {/* Step 1 - Image LEFT, Text RIGHT */}
            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div className="order-2 md:order-1">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-2xl font-semibold mb-4">Start with Lesson 1 (free)</h3>
                <p className="text-gray-700 leading-relaxed">
                  Pick your goal (talk to family, travel, relationships) and jump straight into your first mini-conversation — no credit card, no long placement test.
                </p>
              </div>
              <div className="order-1 md:order-2">
                <div className="bg-primary/5 rounded-2xl aspect-square flex items-center justify-center">
                  <div className="text-center p-8">
                    <BookOpen className="h-20 w-20 text-primary/40 mx-auto" />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 - Text LEFT, Image RIGHT (flip) */}
            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-accent">2</span>
                </div>
                <h3 className="text-2xl font-semibold mb-4">Learn through games, not grammar rules</h3>
                <p className="text-gray-700 leading-relaxed">
                  Tap, match, and speak through short challenges. Each lesson teaches 3–5 phrases you'll actually use, then reuses them in new contexts so they stick.
                </p>
              </div>
              <div>
                <div className="bg-accent/5 rounded-2xl aspect-square flex items-center justify-center">
                  <div className="text-center p-8">
                    <Trophy className="h-20 w-20 text-accent/40 mx-auto" />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 - Image LEFT, Text RIGHT again */}
            <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
              <div className="order-2 md:order-1">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-2xl font-semibold mb-4">Practice with real-life prompts</h3>
                <p className="text-gray-700 leading-relaxed">
                  Get "family mission" prompts you can try on your parents or grandparents that evening — like how to say "I miss you" or "I'm hungry" in natural Persian.
                </p>
              </div>
              <div className="order-1 md:order-2">
                <div className="bg-primary/5 rounded-2xl aspect-square flex items-center justify-center">
                  <div className="text-center p-8">
                    <Users className="h-20 w-20 text-primary/40 mx-auto" />
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <Button 
                size="lg" 
                className="bg-accent hover:bg-accent/90 text-white px-8 py-4 rounded-full text-lg font-semibold"
                onClick={handleStartLearning}
                disabled={isLearningNavigating}
              >
                {isLearningNavigating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Start Lesson 1 Free"
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* SECTION 4: Before/After Section */}
        <section className="py-16 md:py-24 px-4 bg-primary/5">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-primary mb-12">
              Before Finglish vs. After Finglish
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Before Column */}
              <div className="bg-white border-2 border-red-200 rounded-2xl p-8">
                <div className="text-center mb-6">
                  <div className="inline-block px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm font-semibold mb-4">
                    Before
                  </div>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">✗</span>
                    <p className="text-gray-700">Nodding and smiling when family switches to Persian</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">✗</span>
                    <p className="text-gray-700">Feeling guilty you can't speak with grandparents</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">✗</span>
                    <p className="text-gray-700">Starting apps… then quitting after dry grammar drills</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">✗</span>
                    <p className="text-gray-700">Embarrassed to say simple things out loud</p>
                  </li>
                </ul>
              </div>

              {/* After Column */}
              <div className="bg-white border-2 border-primary rounded-2xl p-8">
                <div className="text-center mb-6">
                  <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
                    After
                  </div>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">✓</span>
                    <p className="text-gray-700">Sharing real conversations with parents & grandparents</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">✓</span>
                    <p className="text-gray-700">Confidently using everyday phrases at family gatherings</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">✓</span>
                    <p className="text-gray-700">Looking forward to quick daily lessons (and keeping your streak)</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">✓</span>
                    <p className="text-gray-700">Feeling closer to your culture and roots</p>
                  </li>
                </ul>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center mt-12">
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-white px-8 py-4 rounded-full text-lg font-semibold"
                onClick={handleStartLearning}
                disabled={isLearningNavigating}
              >
                {isLearningNavigating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "I want the \"After\" → Start Lesson 1 Free"
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* SECTION 5: Benefits Grid (6 items) */}
        <section className="py-16 md:py-24 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-primary mb-4">
              What you get inside Finglish
            </h2>
            <p className="text-center text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
              Everything you need to go from zero to confident Persian speaker.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="group">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Finglish-first lessons</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">Speak from day one without learning the Persian alphabet first.</p>
                  </div>
                </div>
              </div>

              <div className="group">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Real-life conversation tracks</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">Modules built around family, food, introductions, and everyday situations — not random vocabulary lists.</p>
                  </div>
                </div>
              </div>

              <div className="group">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Gamified progress (XP, streaks, levels)</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">Stay motivated with streaks, points, and progress bars that make learning feel fun and rewarding.</p>
                  </div>
                </div>
              </div>

              <div className="group">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <RotateCw className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Smart review mode</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">Extra practice for phrases you miss so you don't forget them a week later.</p>
                  </div>
                </div>
              </div>

              <div className="group">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Volume2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Culture notes & audio</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">Hear how things are actually said and learn the cultural 'why' behind common phrases.</p>
                  </div>
                </div>
              </div>

              <div className="group">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">New lessons added regularly</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">Get access to new modules and stories as they're released — all included in your membership.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: Pricing & Offer */}
        <section className="py-16 md:py-24 px-4 bg-primary/5">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                Start free. Upgrade only if you love it.
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Free Card */}
              <div className="bg-white border-2 border-gray-200 rounded-3xl p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">Free Starter</h3>
                  <p className="text-4xl font-bold text-primary">$0</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Access to Module 1 (all lessons)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Full Lesson 1 + story game</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">XP, streaks, and progress tracking</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">No credit card required</span>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground mb-6">
                  Perfect if you want to try Finglish and see if it clicks.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-white" 
                  size="lg"
                  onClick={handleStartLearning}
                  disabled={isLearningNavigating}
                >
                  {isLearningNavigating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Start Free"
                  )}
                </Button>
              </div>

              {/* Paid Card - Highlighted */}
              <div className="bg-white border-2 border-accent rounded-3xl p-8 relative">
                {/* Badge */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="px-4 py-1 bg-accent text-white rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                </div>

                <div className="text-center mb-6 mt-4">
                  <h3 className="text-2xl font-bold mb-2">Full Access Membership</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-accent">$4.99</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">beta pricing</p>
                </div>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">All current & future modules and story lessons</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Unlimited review mode & practice games</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Priority access to new features and content</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Cancel anytime in 2 clicks</span>
                  </li>
                </ul>

                <Button 
                  className="w-full bg-accent hover:bg-accent/90 text-white" 
                  size="lg"
                  onClick={handleStartLearning}
                  disabled={isLearningNavigating}
                >
                  {isLearningNavigating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Get Full Access"
                  )}
                </Button>
              </div>
            </div>

            {/* Risk Reversal */}
            <div className="text-center mt-8">
              <p className="text-sm text-gray-600 max-w-2xl mx-auto">
                Try Finglish for 14 days. If it's not a fit, email us and we'll refund your first month — no hard feelings.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 7: Testimonials */}
        <section className="py-16 md:py-24 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-primary mb-4">
              What early learners are saying
            </h2>
            <p className="text-center text-lg text-muted-foreground mb-12">
              Real stories from people reconnecting with Persian.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-primary/5 border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                <p className="text-gray-700 leading-relaxed mb-4 italic">
                  "After two weeks on Finglish I had my first full conversation with my grandma — in Persian. She cried. I did too."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-semibold">S</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Sarah, 24</p>
                    <p className="text-xs text-muted-foreground">Iranian-American</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                <p className="text-gray-700 leading-relaxed mb-4 italic">
                  "I've tried other apps, but this is the first one that actually teaches how my in-laws speak at home, not textbook phrases."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-semibold">M</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Michael</p>
                    <p className="text-xs text-muted-foreground">Learning for his partner</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                <p className="text-gray-700 leading-relaxed mb-4 italic">
                  "The 5-minute lessons are perfect between classes. I finally feel connected to my culture again."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-semibold">A</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Arya</p>
                    <p className="text-xs text-muted-foreground">College student</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-8 mt-12 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Built by Iranian creators</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Backed by Iranopedia</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>100% beginner-friendly</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 8: Email Capture */}
        <section className="py-16 md:py-24 px-4 bg-primary/5">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl border border-gray-200 p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
                Not ready to start today?
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                Get one free Persian mini-lesson in your inbox every week.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1"
                />
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-white px-6">
                  Send me free lessons
                </Button>
              </div>

              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
                <span>✓ Built by Iranian creators</span>
                <span>✓ Designed from real conversations</span>
                <span>✓ Beginner-friendly</span>
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                No spam, ever. Just short lessons and updates about new modules.
              </p>
                </div>
                </div>
        </section>

        {/* SECTION 9: What is Iranopedia? */}
        <section className="py-16 md:py-24 px-4 bg-white border-t border-gray-200">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Logo */}
              <div className="flex justify-center">
                <div className="w-48 h-48 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <span className="text-primary text-6xl font-bold">I</span>
                </div>
              </div>

              {/* Text */}
              <div>
                <h2 className="text-3xl font-bold text-primary mb-4">
                  What is Iranopedia?
                </h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  Iranopedia is your modern guide to Persian culture — from food and cities to history, art, and language. Millions of people discover Iran through our content every year.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="border-2 border-primary text-primary hover:bg-primary hover:text-white"
                >
                  <a href="https://iranopedia.com" target="_blank" rel="noopener noreferrer">
                    Visit Iranopedia.com →
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 10: FAQ */}
        <section className="py-16 md:py-24 px-4 bg-primary/5">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-primary mb-12">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-2">Do I need to know the Persian alphabet?</h3>
                <p className="text-gray-700 leading-relaxed">No! We start with Finglish (Persian written in English letters). You can unlock alphabet lessons later when you're ready.</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-2">How long does it take to see results?</h3>
                <p className="text-gray-700 leading-relaxed">Most learners have their first real conversation within 2 weeks of daily practice. Progress depends on your consistency.</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-2">Can I cancel my subscription anytime?</h3>
                <p className="text-gray-700 leading-relaxed">Yes, you can cancel in 2 clicks from your account settings. No questions asked.</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-2">Is Finglish really free to start?</h3>
                <p className="text-gray-700 leading-relaxed">Yes! Module 1 is completely free with no credit card required. You can try it risk-free.</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-2">What makes Finglish different from other apps?</h3>
                <p className="text-gray-700 leading-relaxed">We focus on real family conversations, not textbook Persian. Built by Iranians, for people connecting with their roots.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 11: Final CTA */}
        <section className="py-24 md:py-32 px-4 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-6">
              Ready to reconnect with your Persian roots?
            </h2>
            <p className="text-lg md:text-xl text-gray-700 mb-10 max-w-2xl mx-auto">
              Join thousands of learners who are finally speaking Persian with confidence. Start your first lesson in 60 seconds.
            </p>
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-white px-12 py-6 rounded-full text-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={handleStartLearning}
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
            <p className="text-sm text-muted-foreground mt-6">
              No credit card • No commitment • Start speaking today
            </p>
          </div>
        </section>
      </main>

      {/* Footer with What is Iranopedia section */}
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

          {/* Divider */}
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
