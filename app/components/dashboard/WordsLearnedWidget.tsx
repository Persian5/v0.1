"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Trophy, AlertCircle } from "lucide-react"

interface WordsLearnedWidgetProps {
  wordsLearned: number
  isLoading: boolean
}

export function WordsLearnedWidget({ wordsLearned, isLoading }: WordsLearnedWidgetProps) {
  if (isLoading) {
    return (
      <Card className="bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Words Learned
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Words Learned
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="text-5xl font-bold text-primary mb-2">
            {wordsLearned}
          </div>
          <p className="text-sm text-muted-foreground">
            {wordsLearned === 0 
              ? "Start your first lesson to learn words!"
              : wordsLearned === 1
              ? "word learned"
              : "words learned"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

