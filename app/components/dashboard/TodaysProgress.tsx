"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDailyGoal } from "@/hooks/use-daily-goal"
import { useStreak } from "@/hooks/use-streak"
import { SmartAuthService } from "@/lib/services/smart-auth-service"
import { Skeleton } from "@/components/ui/skeleton"
import { Target, Flame, Zap, BookOpen } from "lucide-react"
import { useState, useEffect } from "react"
import { LessonProgressService } from "@/lib/services/lesson-progress-service"
import { useAuth } from "@/components/auth/AuthProvider"

export function TodaysProgress() {
  const { progress: dailyProgress, isLoading: goalLoading } = useDailyGoal()
  const { streak, isLoading: streakLoading } = useStreak()
  const { user } = useAuth()
  const [lessonsToday, setLessonsToday] = useState(0)
  const [lessonsLoading, setLessonsLoading] = useState(true)
  const totalXp = SmartAuthService.getUserXp()

  useEffect(() => {
    async function loadLessonsToday() {
      if (!user?.id) {
        setLessonsLoading(false)
        return
      }

      try {
        const allProgress = await LessonProgressService.getAllProgress(user.id)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const completedToday = allProgress.filter(p => {
          if (!p.completed_at) return false
          const completedDate = new Date(p.completed_at)
          completedDate.setHours(0, 0, 0, 0)
          return completedDate.getTime() === today.getTime()
        }).length

        setLessonsToday(completedToday)
      } catch (error) {
        console.error('Failed to load lessons today:', error)
      } finally {
        setLessonsLoading(false)
      }
    }

    loadLessonsToday()
  }, [user?.id])

  const isLoading = goalLoading || streakLoading || lessonsLoading

  if (isLoading) {
    return (
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Today's Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

          {/* Streak */}
          <div className="flex flex-col items-center sm:items-start">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
              <Flame className="h-3 w-3 text-orange-500" />
              Streak
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-primary">
              {streak}
            </div>
            <div className="text-xs text-muted-foreground">
              {streak === 1 ? "day" : "days"}
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
              Goal
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

