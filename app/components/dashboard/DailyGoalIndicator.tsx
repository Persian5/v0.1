"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Target, Zap, CheckCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface DailyGoalIndicatorProps {
  earned: number
  goal: number
  percentage: number
  isLoading?: boolean
}

export function DailyGoalIndicator({ earned, goal, percentage, isLoading }: DailyGoalIndicatorProps) {
  if (isLoading) {
    return (
      <div className="w-full">
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    )
  }

  const isMet = percentage >= 100
  const remaining = Math.max(0, goal - earned)

  return (
    <Card className={cn(
      "border-none shadow-sm bg-white/80 border border-neutral-200/50 rounded-xl transition-all duration-300",
      isMet ? "bg-green-50/50 border-green-100" : ""
    )}>
      <CardContent className="p-3 md:p-4 flex items-center gap-4">
        <div className={cn(
          "p-2 rounded-full flex-shrink-0",
          isMet ? "bg-green-100 text-green-600" : "bg-neutral-100 text-neutral-500"
        )}>
          {isMet ? <CheckCircle className="h-5 w-5" /> : <Target className="h-5 w-5" />}
        </div>
        
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className={cn("font-medium", isMet ? "text-green-700" : "text-neutral-700")}>
              {isMet ? "Daily Goal Achieved!" : "Daily Goal"}
            </span>
            <span className="font-bold text-neutral-900">
              {earned} <span className="text-neutral-400 font-normal">/ {goal} XP</span>
            </span>
          </div>
          
          <div className="relative h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
            <div 
              className={cn(
                "absolute left-0 top-0 h-full transition-all duration-500 ease-out rounded-full",
                isMet ? "bg-green-500" : "bg-primary"
              )}
              style={{ width: `${Math.min(100, percentage)}%` }}
            />
          </div>
        </div>
        
        {!isMet && (
          <div className="hidden sm:flex flex-col items-end flex-shrink-0">
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md whitespace-nowrap">
              {remaining} XP left
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

