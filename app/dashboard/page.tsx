"use client"

import { usePathname } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { DashboardHero } from "@/app/components/dashboard/DashboardHero"
import { QuickActions } from "@/app/components/dashboard/QuickActions"
import { ResumeLearning } from "@/app/components/dashboard/ResumeLearning"
import { TodaysProgress } from "@/app/components/dashboard/TodaysProgress"
import { ProgressOverview } from "@/app/components/dashboard/ProgressOverview"
import { HardWordsWidget } from "@/app/components/dashboard/HardWordsWidget"
import { WordsToReviewWidget } from "@/app/components/dashboard/WordsToReviewWidget"
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

function DashboardContent() {
  const { user } = useAuth()
  const pathname = usePathname()
  
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
  }, [user?.id]) // FIXED: Removed cachedDashboard from dependencies

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
        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
          {/* Page Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-primary mb-2">
              Your Learning Hub
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Track your progress and maximize your potential
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Action-First Layout: Resume Learning (Primary Action) */}
          <div className="mb-6 md:mb-8">
            <WidgetErrorBoundary>
              <ResumeLearning nextLesson={dashboard?.nextLesson || null} />
            </WidgetErrorBoundary>
          </div>

          {/* Today's Progress - Daily Feedback Loop */}
          <div className="mb-6 md:mb-8">
            <WidgetErrorBoundary>
              <TodaysProgress sharedProgress={dashboard?.progress || null} isLoading={isLoading} />
            </WidgetErrorBoundary>
          </div>

          {/* Hero Section - Level, XP, Streak, Daily Goal */}
          <div className="mb-6 md:mb-8">
            <WidgetErrorBoundary>
              <DashboardHero />
            </WidgetErrorBoundary>
          </div>

          {/* Quick Actions */}
          <div className="mb-6 md:mb-8">
            <QuickActions />
          </div>

          {/* Progress Overview - Stats Grid */}
          <div className="mb-6 md:mb-8">
            <WidgetErrorBoundary>
              <ProgressOverview 
                wordsLearned={dashboard?.stats?.wordsLearned || 0}
                masteredWords={dashboard?.stats?.masteredWords || 0}
                wordsToReview={dashboard?.stats?.wordsToReview?.length || 0}
                isLoading={isLoading}
                sharedProgress={dashboard?.progress || null}
                progressLoading={isLoading}
              />
            </WidgetErrorBoundary>
          </div>

          {/* Words to Review Section */}
          <div className="mb-6 sm:mb-8">
            <WidgetErrorBoundary>
              <WordsToReviewWidget 
                wordsToReview={dashboard?.stats?.wordsToReview || []} 
                isLoading={isLoading} 
              />
            </WidgetErrorBoundary>
          </div>

          {/* Words to Strengthen Section */}
          <div className="mb-6 sm:mb-8">
            <WidgetErrorBoundary>
              <HardWordsWidget 
                hardWords={dashboard?.stats?.hardWords || []} 
                isLoading={isLoading} 
              />
            </WidgetErrorBoundary>
          </div>

          {/* Leaderboard */}
          <div className="mb-6 sm:mb-8">
            <WidgetErrorBoundary>
              <LeaderboardWidget key={pathname} />
            </WidgetErrorBoundary>
          </div>
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

