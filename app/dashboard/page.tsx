"use client"

import { usePathname } from "next/navigation"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { WelcomeCard } from "@/app/components/dashboard/WelcomeCard"
import { ResumeLearning } from "@/app/components/dashboard/ResumeLearning"
import { DailyGoalIndicator } from "@/app/components/dashboard/DailyGoalIndicator"
import { TodayStatsSection } from "@/app/components/dashboard/TodayStatsSection"
import { WordsNeedingPractice } from "@/app/components/dashboard/WordsNeedingPractice"
import { ProgressSummarySection } from "@/app/components/dashboard/ProgressSummarySection"
import { LeaderboardWidget } from "@/components/widgets/LeaderboardWidget"
import { AlertCircle, Loader2 } from "lucide-react"
import { SmartAuthService } from "@/lib/services/smart-auth-service"
import { UserLessonProgress } from "@/lib/supabase/database"
import WidgetErrorBoundary from "@/components/errors/WidgetErrorBoundary"

interface DashboardStats {
  wordsLearned: number
  masteredWords: number
  hardWords: Array<{
    vocabulary_id: string
    word_text: string
    consecutive_correct: number
    total_attempts: number
    total_correct: number
    total_incorrect: number
    accuracy: number
    last_seen_at: string | null
  }>
  unclassifiedWords?: number // Words with <3 attempts (new)
  wordsToReview?: Array<{ // Words due for review (SRS-based, new)
    vocabulary_id: string
    word_text: string
    consecutive_correct: number
    total_attempts: number
    total_correct: number
    total_incorrect: number
    accuracy: number
    last_seen_at: string | null
  }>
}

interface DashboardData {
  progress: UserLessonProgress[]
  nextLesson: {
    moduleId: string
    lessonId: string
    moduleTitle: string
    lessonTitle: string
    description?: string
    status: 'not_started' | 'completed'
    allLessonsCompleted?: boolean
  } | null
  stats: DashboardStats
  xp: number
  level: number
  streakCount: number
  dailyGoalXp: number
  dailyGoalProgress: number
  lessonsCompletedToday: number
  xpEarnedToday: number
}

import { getGreeting } from "@/lib/utils/greeting"

function DashboardContent() {
  const { user } = useAuth()
  const pathname = usePathname()
  
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get user's first name for greeting
  const firstName = useMemo(() => {
    // Try cached profile first
    const cachedProfile = SmartAuthService.getCachedProfile()
    if (cachedProfile?.first_name) {
      return cachedProfile.first_name
    }
    // Fallback to user metadata
    if (user?.user_metadata?.first_name) {
      return user.user_metadata.first_name
    }
    return null
  }, [user])

  // Single unified fetch for all dashboard data
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }

    let isMounted = true

    // Check cache first for instant render
    const cachedDashboard = SmartAuthService.getCachedDashboard()
    if (cachedDashboard && isMounted) {
      setDashboard(cachedDashboard)
      setIsLoading(false)
    }

    // Always fetch fresh data
    fetch('/api/dashboard')
      .then(response => {
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Please sign in to view your dashboard.')
          } else if (response.status === 500) {
            throw new Error('Something went wrong on our end. Please try again in a moment.')
          } else {
            throw new Error('Unable to load your dashboard. Please refresh the page.')
          }
        }
        return response.json()
      })
      .then((data: DashboardData) => {
        if (!isMounted) return
        
        // Cache the fresh data
        SmartAuthService.cacheDashboard(data)
        // Update state (silent update if cache was shown)
        setDashboard(data)
        setIsLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        
        console.error('Error fetching dashboard:', err)
        
        // Only show error if we don't have cached data
        if (!cachedDashboard) {
          let errorMessage = 'Unable to load your dashboard. Please try again.'
          if (err instanceof Error) {
            if (err.message.includes('sign in')) {
              errorMessage = err.message
            } else if (err.message.includes('Something went wrong')) {
              errorMessage = err.message
            }
          }
          setError(errorMessage)
        }
        setIsLoading(false)
      })
    
    return () => {
      isMounted = false
    }
  }, [user?.id])

  // Check if user has any progress
  const hasProgress = useMemo(() => {
    if (!dashboard) return false
    return dashboard.stats.wordsLearned > 0 || 
           dashboard.progress.length > 0 ||
           dashboard.xp > 0
  }, [dashboard])

  // Calculate level progress
  // Assuming level thresholds: L1=0-100, L2=100-200, etc. (100 XP per level for simplicity, based on calculation in API)
  // API route does: const level = Math.floor((profile?.total_xp || 0) / 100)
  const levelProgress = useMemo(() => {
    if (!dashboard) return { current: 0, next: 100, percent: 0 }
    const currentLevelXp = (dashboard.level) * 100
    const nextLevelXp = (dashboard.level + 1) * 100
    const xpInLevel = dashboard.xp - currentLevelXp
    const percent = Math.min(100, Math.max(0, (xpInLevel / 100) * 100))
    
    return {
      current: xpInLevel,
      next: 100,
      percent
    }
  }, [dashboard])

  // Show loading skeleton only if no cache exists
  if (isLoading && !dashboard) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <main className="flex-1">
          <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-primary mb-2">
                Your Learning Hub
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground">
                Track your progress and maximize your potential
              </p>
            </div>
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
          {/* Page Header */}
          <div className="text-center mb-10 md:mb-14">
            <h1 className="text-xl md:text-2xl font-medium text-neutral-500 mb-2">
              {getGreeting(firstName)}
            </h1>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 mb-6">
              Your Learning Hub
            </h2>
            
            {/* Level Indicator */}
            {hasProgress && dashboard && (
              <div className="max-w-xs mx-auto">
                <div className="flex flex-col mb-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Level {dashboard.level}</span>
                    <span className="text-xs font-medium text-neutral-400">{dashboard.xp.toLocaleString()} XP Total</span>
                  </div>
                  <div className="flex justify-end mt-1">
                    <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">{Math.round(levelProgress.percent)}% to Level {dashboard.level + 1}</span>
                  </div>
                </div>
                <div className="h-2.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${levelProgress.percent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section Divider */}
          <div className="h-3 w-full bg-gray-50 rounded-full my-8 opacity-50" />

          {/* Error Message */}
          {error && (
            <div className="mb-8 p-4 bg-amber-50 border border-amber-200/50 rounded-2xl flex items-center gap-3 text-amber-900">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* NEW USER: Show Welcome Card Only */}
          {!isLoading && !hasProgress && (
            <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
              <WidgetErrorBoundary>
                <WelcomeCard nextLesson={dashboard?.nextLesson || null} />
              </WidgetErrorBoundary>
            </div>
          )}

          {/* RETURNING USER: Show Full Dashboard */}
          {(isLoading || hasProgress) && (
            <div className="space-y-12 md:space-y-16">
              
              {/* SECTION 1: Primary Action - Resume Learning + Daily Goal */}
              <section className="space-y-6 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                <WidgetErrorBoundary>
                  <ResumeLearning nextLesson={dashboard?.nextLesson || null} />
                </WidgetErrorBoundary>
                <WidgetErrorBoundary>
                  <DailyGoalIndicator
                    earned={dashboard?.xpEarnedToday || 0}
                    goal={dashboard?.dailyGoalXp || 50}
                    percentage={(dashboard?.dailyGoalProgress || 0) * 100}
                    isLoading={isLoading}
                  />
                </WidgetErrorBoundary>
              </section>

              {/* Section Divider */}
              <div className="h-3 w-full bg-gray-50 rounded-full my-8 opacity-50" />

              {/* SECTION 2: Today's Stats */}
              <section className="max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                <div className="mb-3 md:mb-4 px-4">
                  <h2 className="text-2xl font-bold text-neutral-900 tracking-tight mb-1">
                    Today
                  </h2>
                  <p className="text-sm text-neutral-500 font-medium">
                    Your daily activity summary
                  </p>
                </div>
                <WidgetErrorBoundary>
                  <TodayStatsSection
                    xpEarned={dashboard?.xpEarnedToday || 0}
                    lessonsCompleted={dashboard?.lessonsCompletedToday || 0}
                    streak={dashboard?.streakCount || 0}
                    isLoading={isLoading}
                  />
                </WidgetErrorBoundary>
              </section>

              {/* Section Divider */}
              <div className="h-3 w-full bg-gray-50 rounded-full my-8 opacity-50" />

              {/* SECTION 3: Words Needing Practice */}
              <section className="max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                <div className="mb-3 md:mb-4 px-4">
                  <h2 className="text-2xl font-bold text-neutral-900 tracking-tight mb-1">
                    Words That Need Practice
                  </h2>
                  <p className="text-sm text-neutral-500 font-medium">
                    Strengthen words you're struggling with
                  </p>
                </div>
                <WidgetErrorBoundary>
                  <WordsNeedingPractice
                    wordsToReview={dashboard?.stats?.wordsToReview || []}
                    hardWords={dashboard?.stats?.hardWords || []}
                    isLoading={isLoading}
                  />
                </WidgetErrorBoundary>
              </section>

              {/* Section Divider */}
              <div className="h-3 w-full bg-gray-50 rounded-full my-8 opacity-50" />

              {/* SECTION 4: Progress Summary */}
              <section className="max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
                <div className="mb-3 md:mb-4 px-4">
                  <h2 className="text-2xl font-bold text-neutral-900 tracking-tight mb-1">
                    Your Progress
                  </h2>
                  <p className="text-sm text-neutral-500 font-medium">
                    Track your long-term growth
                  </p>
                </div>
                <WidgetErrorBoundary>
                  <ProgressSummarySection
                    wordsLearned={dashboard?.stats?.wordsLearned || 0}
                    masteredWords={dashboard?.stats?.masteredWords || 0}
                    lessonsCompleted={dashboard?.progress?.length || 0}
                    isLoading={isLoading}
                  />
                </WidgetErrorBoundary>
              </section>

              {/* Section Divider */}
              <div className="h-3 w-full bg-gray-50 rounded-full my-8 opacity-50" />

              {/* SECTION 5: Leaderboard */}
              <section className="max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                <h2 className="text-2xl font-bold text-neutral-900 tracking-tight mb-6 px-1 text-center">
                  Leaderboard
                </h2>
                <WidgetErrorBoundary>
                  <LeaderboardWidget key={pathname} />
                </WidgetErrorBoundary>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}

