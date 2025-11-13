"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDailyGoal } from "@/hooks/use-daily-goal"
import { Skeleton } from "@/components/ui/skeleton"
import { Target, Zap, BookOpen } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { LessonProgressService } from "@/lib/services/lesson-progress-service"
import { useAuth } from "@/components/auth/AuthProvider"
import { SmartAuthService } from "@/lib/services/smart-auth-service"

export function TodaysProgress() {
  const { progress: dailyProgress, isLoading: goalLoading } = useDailyGoal()
  const { user } = useAuth()
  const [lessonsToday, setLessonsToday] = useState(0)
  const [lessonsLoading, setLessonsLoading] = useState(true)

  // Load lessons completed today from Supabase (timezone-aware)
  const loadLessonsToday = useCallback(async (isMounted: () => boolean) => {
    if (!user?.id) {
      if (isMounted()) setLessonsLoading(false)
      return
    }

    // Check cache first (timezone-aware, auto-invalidates at midnight)
    try {
      const cachedCount = SmartAuthService.getCachedLessonsCompletedToday()
      if (cachedCount !== null) {
        if (isMounted()) {
          setLessonsToday(cachedCount)
          setLessonsLoading(false)
        }
        return
      }
    } catch (error) {
      // Cache access failed - continue to API call
      console.warn('Cache access failed, fetching from API:', error)
    }

    if (isMounted()) setLessonsLoading(true)
    
    try {
      const allProgress = await LessonProgressService.getUserLessonProgress()
      
      if (!isMounted()) return // Component unmounted, don't update state
      
      const userTimezone = SmartAuthService.getUserTimezone()
      
      // Cache the counts (timezone-aware)
      SmartAuthService.cacheLessonProgressCounts(allProgress, userTimezone)
      
      // Get from cache (now populated)
      const count = SmartAuthService.getCachedLessonsCompletedToday() ?? 0
      if (isMounted()) {
        setLessonsToday(count)
      }
    } catch (error) {
      console.error('Failed to load lessons today:', error)
      if (isMounted()) {
        setLessonsToday(0)
      }
    } finally {
      if (isMounted()) {
        setLessonsLoading(false)
      }
    }
  }, [user?.id])

  // Initial load with mount guard
  useEffect(() => {
    let isMounted = true
    
    const checkMounted = () => isMounted
    
    loadLessonsToday(checkMounted)
    
    return () => {
      isMounted = false
    }
  }, [loadLessonsToday])

  // Refresh on XP updates (lesson completion awards XP) or new day detection
  useEffect(() => {
    if (!user?.id) return

    let isMounted = true
    
    const unsubscribe = SmartAuthService.addEventListener((eventType) => {
      if (!isMounted) return // Guard against calls after unmount
      
      if (eventType === 'xp-updated' || eventType === 'daily-goal-updated') {
        // XP changed or new day detected - refresh lessons count
        loadLessonsToday(() => isMounted)
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [user?.id, loadLessonsToday])

  const isLoading = goalLoading || lessonsLoading

  if (isLoading) {
    return (
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Today's Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Today's Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* XP Earned */}
          <div className="flex flex-col items-center sm:items-start">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
              <Zap className="h-3 w-3 text-primary" />
              XP Earned
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-primary">
              {dailyProgress.earned}
            </div>
            <div className="text-xs text-muted-foreground">
              of {dailyProgress.goal} goal
            </div>
          </div>

          {/* Lessons Completed */}
          <div className="flex flex-col items-center sm:items-start">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
              <BookOpen className="h-3 w-3 text-green-500" />
              Lessons
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-primary">
              {lessonsToday}
            </div>
            <div className="text-xs text-muted-foreground">
              {lessonsToday === 1 ? "completed" : "completed"}
            </div>
          </div>

          {/* Daily Goal Progress */}
          <div className="flex flex-col items-center sm:items-start">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
              <Target className="h-3 w-3 text-green-500" />
              Goal Progress
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-primary">
              {Math.round(dailyProgress.percentage)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {dailyProgress.isMet ? "Achieved!" : `${dailyProgress.remaining} XP left`}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

