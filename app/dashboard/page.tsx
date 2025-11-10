"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { WordsLearnedWidget } from "@/app/components/dashboard/WordsLearnedWidget"
import { MasteredWordsWidget } from "@/app/components/dashboard/MasteredWordsWidget"
import { HardWordsWidget } from "@/app/components/dashboard/HardWordsWidget"
import { LeaderboardWidget } from "@/components/widgets/LeaderboardWidget"
import { AccountNavButton } from "@/app/components/AccountNavButton"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
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
}

function DashboardContent() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
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
          hardWords: cached.hardWords
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
  }

  useEffect(() => {
    fetchStats()
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
      {/* Header */}      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 sm:py-12 max-w-6xl">
          {/* Page Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-primary mb-4">
              Your Learning Dashboard
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Track your progress and keep improving
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Widgets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Words Learned */}
            <WidgetErrorBoundary>
              <WordsLearnedWidget 
                wordsLearned={stats?.wordsLearned || 0} 
                isLoading={isLoading} 
              />
            </WidgetErrorBoundary>

            {/* Mastered Words */}
            <WidgetErrorBoundary>
              <MasteredWordsWidget 
                masteredWords={stats?.masteredWords || 0} 
                isLoading={isLoading} 
              />
            </WidgetErrorBoundary>

            {/* Leaderboard */}
            <WidgetErrorBoundary>
              <LeaderboardWidget />
            </WidgetErrorBoundary>
          </div>

          {/* Hard Words (Full Width) */}
          <div className="mb-8">
            <WidgetErrorBoundary>
              <HardWordsWidget 
                hardWords={stats?.hardWords || []} 
                isLoading={isLoading} 
              />
            </WidgetErrorBoundary>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <Link href="/modules">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white px-8 py-6 text-lg">
                Continue Learning
              </Button>
            </Link>
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

