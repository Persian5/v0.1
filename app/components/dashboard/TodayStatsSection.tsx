"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Zap, BookOpen, Flame } from "lucide-react"
import { useStreak } from "@/hooks/use-streak"

interface TodayStatsSectionProps {
  xpEarned: number
  lessonsCompleted: number
  streak: number
  isLoading?: boolean
}

export function TodayStatsSection({ xpEarned, lessonsCompleted, streak: _unused, isLoading }: TodayStatsSectionProps) {
  // Use the same hook as the old DashboardHero component for live streak updates
  const { streak, isLoading: streakLoading } = useStreak()
  
  const anyLoading = isLoading || streakLoading
  if (anyLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-white border border-neutral-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* XP Earned Today */}
      <Card className="bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-amber-100/50 text-amber-600 flex-shrink-0">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900">{xpEarned}</p>
            <p className="text-sm font-medium text-neutral-500">XP Today</p>
          </div>
        </CardContent>
      </Card>

      {/* Lessons Completed Today */}
      <Card className="bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-100/50 text-emerald-600 flex-shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900">{lessonsCompleted}</p>
            <p className="text-sm font-medium text-neutral-500">Lessons Today</p>
          </div>
        </CardContent>
      </Card>

      {/* Streak */}
      <Card className="bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-orange-100/50 text-orange-600 flex-shrink-0">
            <Flame className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-neutral-900">{streak}</p>
              <p className="text-sm font-medium text-neutral-500">days</p>
            </div>
            <p className="text-xs font-medium text-orange-500">Keep going!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

