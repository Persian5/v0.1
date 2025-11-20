"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Trophy, Award } from "lucide-react"

interface ProgressSummarySectionProps {
  wordsLearned: number
  masteredWords: number
  lessonsCompleted: number
  isLoading?: boolean
}

export function ProgressSummarySection({ 
  wordsLearned, 
  masteredWords, 
  lessonsCompleted, 
  isLoading 
}: ProgressSummarySectionProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-white border border-neutral-200 shadow-sm">
            <CardContent className="p-4">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Words Learned */}
      <Card className="bg-white border border-neutral-200/50 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl group">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-neutral-900 tracking-tight">
              {wordsLearned}
            </p>
            <p className="text-sm font-medium text-neutral-500">
              Words Learned
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Words Mastered */}
      <Card className="bg-white border border-neutral-200/50 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl group">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform duration-300">
              <Trophy className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-neutral-900 tracking-tight">
              {masteredWords}
            </p>
            <p className="text-sm font-medium text-neutral-500">
              Words Mastered
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Total Lessons Completed */}
      <Card className="bg-white border border-neutral-200/50 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl group">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 rounded-lg bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform duration-300">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-neutral-900 tracking-tight">
              {lessonsCompleted}
            </p>
            <p className="text-sm font-medium text-neutral-500">
              Lessons Completed
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

