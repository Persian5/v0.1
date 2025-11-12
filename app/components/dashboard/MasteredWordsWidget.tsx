"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Trophy } from "lucide-react"

interface MasteredWordsWidgetProps {
  masteredWords: number
  isLoading: boolean
}

export function MasteredWordsWidget({ masteredWords, isLoading }: MasteredWordsWidgetProps) {
  if (isLoading) {
    return (
      <Card className="bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-green-500" />
            Mastered Words
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
          <Trophy className="h-5 w-5 text-success-500" />
          Mastered Words
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
              <div className="text-5xl font-bold text-green-500 mb-2">
            {masteredWords}
          </div>
          <p className="text-sm text-muted-foreground">
            {masteredWords === 0
              ? "Keep practicing to master words!"
              : masteredWords === 1
              ? "word mastered"
              : "words mastered"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

