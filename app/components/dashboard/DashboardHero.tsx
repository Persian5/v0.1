"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useLevel } from "@/hooks/use-level"
import { useStreak } from "@/hooks/use-streak"
import { useDailyGoal } from "@/hooks/use-daily-goal"
import { SmartAuthService } from "@/lib/services/smart-auth-service"
import { Skeleton } from "@/components/ui/skeleton"
import { Trophy, Flame, Target, Zap } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export function DashboardHero() {
  const { level, progress, isLoading: levelLoading, formattedLevel, formattedProgress } = useLevel()
  const { streak, isLoading: streakLoading, formattedStreak } = useStreak()
  const { progress: dailyProgress, isLoading: goalLoading, formattedProgress: formattedDailyProgress } = useDailyGoal()
  const totalXp = SmartAuthService.getUserXp()

  const isLoading = levelLoading || streakLoading || goalLoading

  if (isLoading) {
    return (
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 md:p-6">
        {/* Mobile: Single column, focus on streak */}
        {/* Tablet: 2x2 grid */}
        {/* Desktop: 4 columns horizontal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Level */}
          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
              <Trophy className="h-4 w-4 text-primary" />
              Level
            </div>
            <div className="text-3xl md:text-4xl font-bold text-primary">
              {level}
            </div>
            {progress && (
              <div className="w-full space-y-1">
                <div className="text-xs text-muted-foreground">
                  {progress.currentXp} / {progress.nextLevelXp} XP
                </div>
                <Progress 
                  value={progress.progress} 
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground">
                  {progress.remainingXp} XP to Level {level + 1}
                </div>
              </div>
            )}
          </div>

          {/* Total XP */}
          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
              <Zap className="h-4 w-4 text-primary" />
              Total XP
            </div>
            <div className="text-3xl md:text-4xl font-bold text-primary">
              {totalXp.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {formattedProgress}
            </div>
          </div>

          {/* Streak - Prominent on mobile */}
          <div className="flex flex-col items-center md:items-start space-y-2 order-first md:order-none">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
              <Flame className="h-4 w-4 text-orange-500" />
              Streak
            </div>
            <div className="text-4xl md:text-4xl font-bold text-primary">
              {streak}
            </div>
            <div className="text-xs text-muted-foreground">
              {formattedStreak}
            </div>
          </div>

          {/* Daily Goal */}
          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
              <Target className="h-4 w-4 text-green-500" />
              Daily Goal
            </div>
            <div className="text-3xl md:text-4xl font-bold text-primary">
              {dailyProgress.earned} / {dailyProgress.goal}
            </div>
            <div className="w-full space-y-1">
              <Progress 
                value={dailyProgress.percentage} 
                className="h-2"
              />
              <div className="text-xs text-muted-foreground">
                {dailyProgress.isMet 
                  ? "Goal achieved!" 
                  : `${dailyProgress.remaining} XP remaining`}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

