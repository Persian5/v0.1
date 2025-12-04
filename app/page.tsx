"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Badge } from "../components/ui/badge"
import { ChevronRight, ChevronLeft, Loader2, Users, Clock, BookOpen, MessageSquare, Trophy, RotateCw, Volume2, Sparkles, Check, ChevronDown, Play, Zap, Target, Heart } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { AuthModal } from "@/components/auth/AuthModal"
import confetti from "canvas-confetti"

// Testimonials data
const testimonials = [
  {
    quote: "I've been trying to learn Persian to surprise my girlfriend and her family, and Finglish is the first app that actually stuck. I never thought I'd be able to say full sentences, but now I can both say and understand them. It's honestly crazy how fast it clicked once I started using it.",
    name: "Karan V.",
    context: "Learning for his partner"
  },
  {
    quote: "I grew up in an Iranian household but forgot a lot of my Persian over the years. Finglish helped me get it back so fast. I love that I can do the lessons in short bursts whenever I have time. I'm actually speaking Persian with my family again and it feels amazing.",
    name: "Nommi A.",
    context: "Reconnecting with roots"
  },
  {
    quote: "My best friend is Persian and I was tired of never knowing what he was saying. I tried a bunch of stuff but Finglish was the only one that made sense. Now I can follow basic conversations and actually talk back. Super easy to use.",
    name: "Will R.",
    context: "Learning for friendship"
  },
  {
    quote: "All my boys speak Persian and I wanted to finally understand them. I've been looking for something that teaches the way I learn, and Finglish had it. I don't need to learn the script yet, so I like that it focuses on speaking first. I'm finally keeping up with everyone.",
    name: "Ameer A.",
    context: "Keeping up with friends"
  }
]

// FAQ data
const faqs = [
  {
    question: "Do I need to know the Persian alphabet?",
    answer: "No! We start with Finglish (Persian written in English letters). You can unlock alphabet lessons later when you're ready."
  },
  {
    question: "How long does it take to see results?",
    answer: "Most learners have their first real conversation within 2 weeks of daily practice. Progress depends on your consistency."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel in 2 clicks from your account settings. No questions asked."
  },
  {
    question: "Is Finglish really free to start?",
    answer: "Yes! Module 1 is completely free with no credit card required. You can try it risk-free."
  },
  {
    question: "What makes Finglish different from other apps?",
    answer: "We focus on real family conversations, not textbook Persian. Built by Iranians, for people connecting with their roots."
  }
]

export default function HomePage() {
  const router = useRouter()
  const [isLearningNavigating, setIsLearningNavigating] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  // Interactive Demo state
  const [demoAnswer, setDemoAnswer] = useState<string | null>(null)
  const [demoCorrect, setDemoCorrect] = useState(false)
  
  // Testimonial carousel state
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  
  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  
  // Animated counter state
  const [countersVisible, setCountersVisible] = useState(false)
  const counterRef = useRef<HTMLDivElement>(null)

  // Intersection observer for counters
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCountersVisible(true)
        }
      },
      { threshold: 0.3 }
    )
    
    if (counterRef.current) {
      observer.observe(counterRef.current)
    }
    
    return () => observer.disconnect()
  }, [])

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  const handleDemoAnswer = (answer: string) => {
    setDemoAnswer(answer)
    if (answer === "Salam") {
      setDemoCorrect(true)
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#277c52', '#c41e3a', '#f59e0b']
      })
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

  // Animated counter component
  const AnimatedCounter = ({ end, suffix = "" }: { end: number; suffix?: string }) => {
    const [count, setCount] = useState(0)
    
    useEffect(() => {
      if (!countersVisible) return
      
      const duration = 2000
      const steps = 60
      const increment = end / steps
      let current = 0
      
      const timer = setInterval(() => {
        current += increment
        if (current >= end) {
          setCount(end)
          clearInterval(timer)
        } else {
          setCount(Math.floor(current))
        }
      }, duration / steps)
      
      return () => clearInterval(timer)
    }, [countersVisible, end])
    
    return <span>{count}{suffix}</span>
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        {/* ============================================ */}
        {/* HERO SECTION - UNCHANGED */}
        {/* ============================================ */}
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

        {/* ============================================ */}
        {/* SECTION 1: PROOF BAR */}
        {/* ============================================ */}
        <section className="py-5 bg-white border-y border-gray-100" ref={counterRef}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-semibold text-primary">
                  <AnimatedCounter end={200} suffix="M+" />
                </span>
                <span>social views</span>
              </div>
              <div className="hidden md:block w-px h-4 bg-gray-200" />
              <div className="flex items-center gap-2 text-gray-700">
                <Check className="h-4 w-4 text-primary" />
                <span>Built by <span className="font-semibold text-primary">Iranians</span></span>
              </div>
              <div className="hidden md:block w-px h-4 bg-gray-200" />
              <div className="flex items-center gap-2 text-gray-700">
                <Users className="h-4 w-4 text-primary" />
                <span>Trusted by <span className="font-semibold text-primary">diaspora learners</span></span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION 2: HOW IT WORKS - Asymmetric Zig-Zag */}
        {/* ============================================ */}
        <section className="py-20 md:py-28 bg-gradient-to-b from-white to-primary/5 overflow-hidden">
          <div className="max-w-6xl mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16 md:mb-20"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-4">
                Speaking Persian in 3 steps
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Your first real conversation is just a few minutes away
              </p>
            </motion.div>

            {/* Step 1: Image LEFT, Text RIGHT */}
              <motion.div 
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12 items-center mb-20 md:mb-28"
            >
              <div className="md:col-span-3 relative order-2 md:order-1">
                {/* Image placeholder */}
                <div className="aspect-[4/3] rounded-[32px] bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] flex items-center justify-center border border-primary/10">
                  <div className="text-center p-8">
                    <BookOpen className="h-20 w-20 text-primary/30 mx-auto mb-4" />
                    <p className="text-sm text-primary/50 font-medium">Lesson Preview</p>
                  </div>
                </div>
                {/* Floating badge */}
                <div className="absolute -bottom-3 -right-3 md:-bottom-4 md:-right-4 px-4 py-2 bg-accent text-white rounded-full text-sm font-medium shadow-lg">
                  Free to try
                  </div>
              </div>
              <div className="md:col-span-2 space-y-4 order-1 md:order-2">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full text-sm text-primary font-semibold">
                  <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">1</span>
                  Step One
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Start your first lesson
                  </h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  No signup needed. Jump straight into real Persian phrases you'll use with family — from greetings to everyday conversations.
                  </p>
                </div>
              </motion.div>

            {/* Step 2: Text LEFT, Image RIGHT */}
              <motion.div 
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12 items-center mb-20 md:mb-28"
            >
              <div className="md:col-span-2 space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 rounded-full text-sm text-accent font-semibold">
                  <span className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold">2</span>
                  Step Two
                  </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Learn through games, not grammar
                  </h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Tap, match, and speak through short challenges. Each lesson teaches 3-5 phrases you'll actually use, then reinforces them so they stick.
                  </p>
                </div>
              <div className="md:col-span-3 relative">
                {/* Image placeholder */}
                <div className="aspect-[4/3] rounded-[32px] bg-gradient-to-br from-accent/10 to-accent/5 overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] flex items-center justify-center border border-accent/10">
                  <div className="text-center p-8">
                    <Trophy className="h-20 w-20 text-accent/30 mx-auto mb-4" />
                    <p className="text-sm text-accent/50 font-medium">Game-based Learning</p>
                  </div>
                </div>
                {/* Floating XP badge */}
                <div className="absolute -top-3 -left-3 md:-top-4 md:-left-4 px-4 py-2 bg-primary text-white rounded-full text-sm font-medium shadow-lg flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  +10 XP
              </div>
            </div>
            </motion.div>

            {/* Step 3: Image LEFT, Text RIGHT */}
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12 items-center mb-12"
            >
              <div className="md:col-span-3 relative order-2 md:order-1">
                {/* Image placeholder */}
                <div className="aspect-[4/3] rounded-[32px] bg-gradient-to-br from-primary/10 to-accent/5 overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] flex items-center justify-center border border-primary/10">
                  <div className="text-center p-8">
                    <Users className="h-20 w-20 text-primary/30 mx-auto mb-4" />
                    <p className="text-sm text-primary/50 font-medium">Real Conversations</p>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 space-y-4 order-1 md:order-2">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full text-sm text-primary font-semibold">
                  <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">3</span>
                  Step Three
            </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Use it with real people
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Get "family mission" prompts you can try on your parents or grandparents — like how to say "I miss you" or "I'm hungry" in natural Persian.
                </p>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center mt-12"
            >
              <Button 
                size="lg" 
                className="bg-accent hover:bg-accent/90 text-white px-10 py-6 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
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
            </motion.div>
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION 3: INTERACTIVE DEMO */}
        {/* ============================================ */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-3xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-primary/5 via-white to-accent/5 rounded-[32px] p-8 md:p-12 border border-gray-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)]"
            >
              <div className="text-center mb-8">
                <Badge className="mb-4 bg-accent/10 text-accent border-0 px-4 py-1.5">
                  <Play className="h-3 w-3 mr-1.5" />
                  Try it now
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold text-primary">
                  How do you say "Hello" in Persian?
            </h2>
              </div>
              
              {!demoCorrect ? (
                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                  {["Salam", "Merci", "Chetori", "Khoob"].map((option) => (
                    <button
                      key={option}
                      onClick={() => handleDemoAnswer(option)}
                      disabled={demoAnswer !== null && demoAnswer !== option}
                      className={`p-5 rounded-2xl border-2 transition-all duration-300 ${
                        demoAnswer === option
                          ? option === "Salam"
                            ? "border-primary bg-primary/10 scale-105"
                            : "border-red-300 bg-red-50 animate-shake"
                          : "border-gray-200 hover:border-primary/50 hover:bg-primary/5 hover:scale-105"
                      } ${demoAnswer !== null && demoAnswer !== option ? "opacity-50" : ""}`}
                    >
                      <span className="text-lg font-semibold text-gray-800">{option}</span>
                    </button>
                  ))}
                  </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="h-10 w-10 text-primary" />
                </div>
                  <h3 className="text-2xl font-bold text-primary mb-2">Afarin! (Well done!)</h3>
                  <p className="text-gray-600 mb-6">You just learned your first Persian word. Imagine what you'll know in a week.</p>
                  <Button 
                    onClick={handleStartLearning}
                    className="bg-accent hover:bg-accent/90 text-white rounded-full px-8 py-4 font-semibold"
                    disabled={isLearningNavigating}
                  >
                    {isLearningNavigating ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Continue Learning Free"
                    )}
                  </Button>
                </motion.div>
              )}
              
              {demoAnswer && demoAnswer !== "Salam" && !demoCorrect && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-red-500 mt-4 text-sm"
                >
                  Not quite! Try again.
                </motion.p>
              )}
            </motion.div>
              </div>
        </section>

        {/* ============================================ */}
        {/* SECTION 4: TRANSFORMATION (Before/After) */}
        {/* ============================================ */}
        <section className="py-20 md:py-28 bg-primary/5">
          <div className="max-w-5xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-4">
                Your transformation
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                This is what happens when you commit to 5 minutes a day
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="grid md:grid-cols-2 gap-0 md:gap-1 bg-gradient-to-r from-gray-300 via-primary to-gray-300 p-px rounded-[32px] overflow-hidden">
                
                {/* Before */}
                <div className="bg-white p-8 md:p-10 rounded-t-[31px] md:rounded-l-[31px] md:rounded-tr-none">
                  <div className="inline-block px-4 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold mb-6">
                    Today
                  </div>
                  <ul className="space-y-5">
                    {[
                      "Nodding along when family speaks Persian",
                      "Feeling guilty you can't speak with grandparents",
                      "Starting apps... then quitting after dry grammar drills",
                      "Embarrassed to say simple things out loud"
                    ].map((item, i) => (
                      <motion.li 
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-4"
                      >
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                          ✗
                        </span>
                        <span className="text-gray-600">{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
                
                {/* After */}
                <div className="bg-gradient-to-br from-primary/5 to-accent/5 p-8 md:p-10 rounded-b-[31px] md:rounded-r-[31px] md:rounded-bl-none">
                  <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-6">
                    In 30 days
                  </div>
                  <ul className="space-y-5">
                    {[
                      "Having real conversations with grandparents",
                      "Confidently using everyday phrases at gatherings",
                      "Looking forward to quick daily lessons",
                      "Feeling closer to your culture and roots"
                    ].map((item, i) => (
                      <motion.li 
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-4"
                      >
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm">
                          ✓
                        </span>
                        <span className="text-gray-800 font-medium">{item}</span>
                      </motion.li>
                    ))}
                </ul>
              </div>
            </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center mt-12"
            >
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-white px-10 py-6 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                onClick={handleStartLearning}
                disabled={isLearningNavigating}
              >
                {isLearningNavigating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>I want the "After" <ChevronRight className="h-5 w-5 ml-1" /></>
                )}
              </Button>
            </motion.div>
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION 5: FEATURE BENTO GRID */}
        {/* ============================================ */}
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-4">
                Everything you need
            </h2>
              <p className="text-lg text-gray-600">Built for Persian learners, by Persian creators</p>
            </motion.div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-5">
              
              {/* Large feature card (span 2x2) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-primary/10 to-primary/5 rounded-[28px] p-8 relative overflow-hidden group hover:shadow-xl transition-all duration-500"
              >
                <div className="relative z-10">
                  <div className="p-3 rounded-2xl bg-white/80 w-fit mb-6 shadow-sm">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900">Real conversations, not textbooks</h3>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    Learn the exact phrases you'll use with parents, grandparents, and cousins — from greetings to inside jokes.
                  </p>
                  </div>
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              </motion.div>
              
              {/* Small feature 1 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-gray-50 rounded-[24px] p-6 hover:bg-gray-100 transition-all hover:-translate-y-1 duration-300 hover:shadow-md"
              >
                <Clock className="h-7 w-7 text-accent mb-4" />
                <h3 className="font-bold text-lg mb-2">5-minute lessons</h3>
                <p className="text-sm text-gray-600">Learn while waiting for coffee</p>
              </motion.div>
              
              {/* Small feature 2 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="bg-gray-50 rounded-[24px] p-6 hover:bg-gray-100 transition-all hover:-translate-y-1 duration-300 hover:shadow-md"
              >
                <BookOpen className="h-7 w-7 text-primary mb-4" />
                <h3 className="font-bold text-lg mb-2">Finglish-first</h3>
                <p className="text-sm text-gray-600">Speak before you read</p>
              </motion.div>
              
              {/* Wide feature (span 2x1) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="md:col-span-2 bg-accent/5 rounded-[24px] p-6 flex items-center gap-6 hover:bg-accent/10 transition-all hover:shadow-md"
              >
                <div className="p-4 rounded-xl bg-accent/10 flex-shrink-0">
                  <Trophy className="h-8 w-8 text-accent" />
                  </div>
                  <div>
                  <h3 className="font-bold text-lg mb-1">Streaks, XP & achievements</h3>
                  <p className="text-sm text-gray-600">Stay motivated with gamified progress that makes learning addictive</p>
                  </div>
              </motion.div>
              
              {/* Small feature 3 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="bg-gray-50 rounded-[24px] p-6 hover:bg-gray-100 transition-all hover:-translate-y-1 duration-300 hover:shadow-md"
              >
                <RotateCw className="h-7 w-7 text-primary mb-4" />
                <h3 className="font-bold text-lg mb-2">Smart review</h3>
                <p className="text-sm text-gray-600">Never forget what you learned</p>
              </motion.div>
              
              {/* Small feature 4 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-gray-50 rounded-[24px] p-6 hover:bg-gray-100 transition-all hover:-translate-y-1 duration-300 hover:shadow-md"
              >
                <Volume2 className="h-7 w-7 text-accent mb-4" />
                <h3 className="font-bold text-lg mb-2">Native audio</h3>
                <p className="text-sm text-gray-600">Hear how it's really said</p>
              </motion.div>
              
              {/* Wide feature 2 (span 2x1) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="md:col-span-2 bg-primary/5 rounded-[24px] p-6 flex items-center gap-6 hover:bg-primary/10 transition-all hover:shadow-md"
              >
                <div className="p-4 rounded-xl bg-primary/10 flex-shrink-0">
                  <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                  <h3 className="font-bold text-lg mb-1">New content added regularly</h3>
                  <p className="text-sm text-gray-600">Fresh modules and stories released every month — all included</p>
                  </div>
              </motion.div>
                </div>
              </div>
        </section>

        {/* ============================================ */}
        {/* SECTION 6: TESTIMONIALS CAROUSEL */}
        {/* ============================================ */}
        <section className="py-20 md:py-28 bg-gradient-to-b from-primary/5 to-white overflow-hidden">
          <div className="max-w-5xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-4">
                Loved by learners
              </h2>
              <p className="text-lg text-gray-600">Real stories from people reconnecting with Persian</p>
            </motion.div>

            {/* Testimonial Carousel */}
            <div className="relative max-w-3xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white rounded-[32px] p-8 md:p-10 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.1)] border border-gray-100"
                >
                  <div className="text-5xl text-primary/20 mb-4 font-serif">"</div>
                  <p className="text-lg md:text-xl text-gray-800 leading-relaxed mb-8">
                    {testimonials[currentTestimonial].quote}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {testimonials[currentTestimonial].name.charAt(0)}
                  </div>
                  <div>
                      <p className="font-bold text-gray-900">{testimonials[currentTestimonial].name}</p>
                      <p className="text-sm text-gray-500">{testimonials[currentTestimonial].context}</p>
                  </div>
                </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation arrows */}
              <button
                onClick={() => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>

              {/* Dots */}
              <div className="flex justify-center gap-2 mt-8">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentTestimonial(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i === currentTestimonial ? "bg-primary w-8" : "bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                ))}
                </div>
              </div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-wrap justify-center gap-6 md:gap-10 mt-12 text-sm text-gray-600"
            >
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
            </motion.div>
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION 7: PRICING */}
        {/* ============================================ */}
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-4">
                Start free. Upgrade when ready.
              </h2>
              <p className="text-lg text-gray-600">No credit card required to begin</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              {/* Free tier */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-gray-50 rounded-[32px] p-8 md:p-10 hover:shadow-lg transition-shadow"
              >
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2 text-gray-900">Free Starter</h3>
                  <div className="text-4xl font-bold text-primary">$0</div>
                </div>
                <ul className="space-y-4 mb-8">
                  {[
                    "Full Module 1 access",
                    "All lesson types & story games",
                    "XP, streaks & progress tracking",
                    "No credit card required"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                  </li>
                  ))}
                </ul>
                <Button 
                  variant="outline" 
                  className="w-full rounded-full border-2 border-gray-300 hover:border-primary hover:bg-primary/5 py-6 text-lg font-semibold"
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
              </motion.div>
              
              {/* Pro tier */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-gradient-to-br from-primary/10 via-white to-accent/10 rounded-[32px] p-8 md:p-10 border-2 border-primary relative overflow-hidden"
              >
                {/* Popular badge */}
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2">
                  <div className="px-5 py-1.5 bg-primary text-white text-sm font-semibold rounded-b-xl">
                    Most Popular
                  </div>
                </div>

                <div className="mb-6 mt-4">
                  <h3 className="text-xl font-bold mb-2 text-gray-900">Full Access</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-primary">$4.99</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Beta pricing — locked in forever</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {[
                    "Everything in Free, plus...",
                    "All current & future modules",
                    "Unlimited review mode & games",
                    "Priority access to new features",
                    "Cancel anytime in 2 clicks"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-accent flex-shrink-0" />
                      <span className={`text-gray-700 ${i === 0 ? "font-semibold" : ""}`}>{item}</span>
                  </li>
                  ))}
                </ul>
                <Button 
                  className="w-full rounded-full bg-accent hover:bg-accent/90 text-white shadow-lg hover:shadow-xl transition-all py-6 text-lg font-semibold"
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
              </motion.div>
            </div>

            {/* Risk reversal */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center text-sm text-gray-500 mt-8"
            >
              14-day money-back guarantee. Cancel anytime in 2 clicks.
            </motion.p>
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION 8: FAQ ACCORDION */}
        {/* ============================================ */}
        <section className="py-20 md:py-28 bg-primary/5">
          <div className="max-w-3xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-4">
                Common questions
            </h2>
            </motion.div>

            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left"
                  >
                    <span className="font-semibold text-lg text-gray-900">{faq.question}</span>
                    <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                          {faq.answer}
                  </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* SECTION 9: FINAL CTA */}
        {/* ============================================ */}
        <section className="py-24 md:py-36 bg-gradient-to-br from-primary/10 via-white to-accent/5 relative overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute top-20 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto px-4 text-center relative"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-6 leading-tight">
              Ready to speak Persian<br className="hidden md:block" /> with your family?
            </h2>
            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Start your first lesson in 60 seconds. No signup required.
            </p>
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-white px-12 py-7 rounded-full text-xl font-semibold shadow-[0_8px_32px_-8px_rgba(196,30,58,0.5)] hover:shadow-[0_12px_40px_-8px_rgba(196,30,58,0.6)] hover:scale-105 transition-all"
              onClick={handleStartLearning}
              disabled={isLearningNavigating}
            >
              {isLearningNavigating ? (
                <>
                  <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                  Loading...
                </>
              ) : (
                "Start Learning Free"
              )}
            </Button>
            <p className="text-sm text-gray-500 mt-6">
              No credit card · No commitment · Cancel anytime
            </p>
          </motion.div>
        </section>
      </main>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <footer className="bg-gray-50 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* About Iranopedia */}
          <div className="max-w-xl mx-auto text-center mb-12">
            <div className="inline-block p-4 bg-primary/10 rounded-2xl mb-4">
              <img 
                src="/icons/icon1.png" 
                alt="Iranopedia" 
                className="h-12 w-12 object-contain"
              />
            </div>
            <h3 className="text-xl font-bold text-primary mb-3">Built by Iranopedia</h3>
            <p className="text-gray-600 mb-4">
              Your modern guide to Persian culture — from food and cities to history, art, and language.
            </p>
            <a
              href="https://iranopedia.com"
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium inline-flex items-center gap-1"
            >
              Visit Iranopedia.com <ChevronRight className="h-4 w-4" />
            </a>
          </div>

          {/* Email capture */}
          <div className="max-w-md mx-auto bg-white rounded-2xl p-6 shadow-sm mb-12 border border-gray-100">
            <p className="text-center font-semibold mb-4 text-gray-900">Get weekly Persian mini-lessons</p>
            <div className="flex gap-2">
              <Input 
                placeholder="Your email" 
                className="rounded-full border-gray-200 focus:border-primary" 
              />
              <Button className="rounded-full bg-primary hover:bg-primary/90 px-6">
                Subscribe
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-3">No spam, ever. Just short lessons and updates.</p>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-200 mb-8" />

          {/* Links + Copyright */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">© 2025 Iranopedia</p>
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <Link href="/modules" className="hover:text-primary transition-colors">Start Learning</Link>
              <a href="https://iranopedia.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Iranopedia</a>
              <a href="https://instagram.com/iranopediaofficial" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Instagram</a>
              <a href="https://tiktok.com/@iranopedia" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">TikTok</a>
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
