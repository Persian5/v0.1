"use client"

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
import { AlertCircle } from "lucide-react"
import { SmartAuthService } from "@/lib/services/smart-auth-service"
import { LessonProgressService } from "@/lib/services/lesson-progress-service"
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

function DashboardContent() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sharedProgress, setSharedProgress] = useState<UserLessonProgress[] | null>(null)
  const [progressLoading, setProgressLoading] = useState(true)

  // Helper: Fetch with timeout and user-friendly error handling
  const fetchWithTimeout = useCallback(async (url: string, timeoutMs: number = 10000): Promise<Response> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    
    try {
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('This is taking longer than usual. Please check your connection and try again.')
      }
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect. Please check your internet connection.')
      }
      throw error
    }
  }, [])

  // Load shared progress data (used by multiple widgets)
  useEffect(() => {
    if (!user?.id) {
      setProgressLoading(false)
      return
    }

    let isMounted = true

    async function loadSharedProgress() {
      try {
        // Check cache first
        const cached = SmartAuthService.getUserProgress()
        if (cached && cached.length > 0) {
          if (isMounted) {
            setSharedProgress(cached)
            setProgressLoading(false)
          }
          return
        }

        // Fetch fresh progress
        const progress = await LessonProgressService.getUserLessonProgress()
        if (isMounted) {
          setSharedProgress(progress)
          setProgressLoading(false)
        }
      } catch (error) {
        console.error('Failed to load progress:', error)
        if (isMounted) {
          setProgressLoading(false)
          // Don't show error - widgets will handle gracefully
        }
      }
    }

    loadSharedProgress()

    return () => {
      isMounted = false
    }
  }, [user?.id])

  const fetchStats = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    // Check cache first for instant display (stale-while-revalidate pattern)
    const cached = SmartAuthService.getCachedDashboardStats()
    let hasCachedData = false

    try {
      if (cached) {
        // Show cached data immediately
        setStats({
          wordsLearned: cached.wordsLearned,
          masteredWords: cached.masteredWords,
          hardWords: cached.hardWords,
          unclassifiedWords: cached.unclassifiedWords,
          wordsToReview: cached.wordsToReview
        })
        setIsLoading(false)
        hasCachedData = true
        // Continue to fetch fresh data in background (don't return)
      }

      // Fetch fresh data (either no cache, or background refresh)
      const response = await fetchWithTimeout('/api/user-stats', 10000)
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view your dashboard.')
        } else if (response.status === 500) {
          throw new Error('Something went wrong on our end. Please try again in a moment.')
        } else {
          throw new Error('Unable to load your stats. Please refresh the page.')
        }
      }

      const data: DashboardStats = await response.json()
      
      // Cache the fresh stats
      SmartAuthService.cacheDashboardStats(data)
      
      // Update with fresh data (silent update if cache was shown)
      setStats(data)
      setIsLoading(false)
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      
      // User-friendly error messages
      let errorMessage = 'Unable to load your dashboard. Please try again.'
      if (err instanceof Error) {
        if (err.message.includes('taking longer than usual')) {
          errorMessage = err.message
        } else if (err.message.includes('Unable to connect')) {
          errorMessage = err.message
        } else if (err.message.includes('sign in')) {
          errorMessage = err.message
        } else if (err.message.includes('Something went wrong')) {
          errorMessage = err.message
        }
      }
      
      // Only show error if we don't have cached data to display
      if (!hasCachedData) {
        setError(errorMessage)
      }
      setIsLoading(false)
    }
  }, [user?.id, fetchWithTimeout])

  // Initial load only - refreshes when navigating to dashboard (not on tab switch)
  useEffect(() => {
    if (user?.id) {
      fetchStats()
    }
  }, [user?.id, fetchStats])

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
              <ResumeLearning sharedProgress={sharedProgress} isLoading={progressLoading} />
            </WidgetErrorBoundary>
          </div>

          {/* Today's Progress - Daily Feedback Loop */}
          <div className="mb-6 md:mb-8">
            <WidgetErrorBoundary>
              <TodaysProgress sharedProgress={sharedProgress} isLoading={progressLoading} />
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
                wordsLearned={stats?.wordsLearned || 0}
                masteredWords={stats?.masteredWords || 0}
                wordsToReview={stats?.wordsToReview?.length || 0}
                isLoading={isLoading}
                sharedProgress={sharedProgress}
                progressLoading={progressLoading}
              />
            </WidgetErrorBoundary>
          </div>

          {/* Words to Review Section */}
          <div className="mb-6 sm:mb-8">
            <WidgetErrorBoundary>
              <WordsToReviewWidget 
                wordsToReview={stats?.wordsToReview || []} 
                isLoading={isLoading} 
              />
            </WidgetErrorBoundary>
          </div>

          {/* Words to Strengthen Section */}
          <div className="mb-6 sm:mb-8">
            <WidgetErrorBoundary>
              <HardWordsWidget 
                hardWords={stats?.hardWords || []} 
                isLoading={isLoading} 
              />
            </WidgetErrorBoundary>
          </div>

          {/* Leaderboard */}
          <div className="mb-6 sm:mb-8">
            <WidgetErrorBoundary>
              <LeaderboardWidget />
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

