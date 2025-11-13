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
import { Loader2, AlertCircle } from "lucide-react"
import { SmartAuthService } from "@/lib/services/smart-auth-service"
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

  const fetchStats = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Check cache first for instant display
      const cached = SmartAuthService.getCachedDashboardStats()
      if (cached) {
        setStats({
          wordsLearned: cached.wordsLearned,
          masteredWords: cached.masteredWords,
          hardWords: cached.hardWords,
          unclassifiedWords: cached.unclassifiedWords,
          wordsToReview: cached.wordsToReview
        })
        setIsLoading(false)
        return
      }

      // No cache - fetch fresh data
      const response = await fetch('/api/user-stats')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: DashboardStats = await response.json()
      
      // Cache the stats
      SmartAuthService.cacheDashboardStats(data)
      
      setStats(data)
      setIsLoading(false)
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      setError('Failed to load dashboard stats. Please refresh the page.')
      setIsLoading(false)
    }
  }, [user?.id])

  // Initial load only - refreshes when navigating to dashboard (not on tab switch)
  useEffect(() => {
    if (user?.id) {
      fetchStats()
    }
  }, [user?.id])

  if (isLoading && !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
              <ResumeLearning />
            </WidgetErrorBoundary>
          </div>

          {/* Today's Progress - Daily Feedback Loop */}
          <div className="mb-6 md:mb-8">
            <WidgetErrorBoundary>
              <TodaysProgress />
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

