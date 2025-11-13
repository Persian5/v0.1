"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { TrendingUp, CheckCircle2 } from "lucide-react"
import Link from "next/link"

interface HardWord {
  vocabulary_id: string
  word_text: string
  consecutive_correct: number
  total_attempts: number
  total_correct: number
  total_incorrect: number
  accuracy: number
  last_seen_at: string | null
}

interface HardWordsWidgetProps {
  hardWords: HardWord[]
  isLoading: boolean
}

export function HardWordsWidget({ hardWords, isLoading }: HardWordsWidgetProps) {
  if (isLoading) {
    return (
      <Card className="bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Words to Strengthen
          </CardTitle>
          <CardDescription>Words that need more practice</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (hardWords.length === 0) {
    return (
      <Card className="bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Words to Strengthen
          </CardTitle>
          <CardDescription>Excellent! All words are strong.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Keep practicing to maintain your progress!
            </p>
            <Link href="/modules">
              <Button variant="outline" className="border-neutral-300">
                Continue Learning
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Words to Strengthen
        </CardTitle>
        <CardDescription>Focus on these words to build mastery</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {hardWords.slice(0, 10).map((word) => (
            <div
              key={word.vocabulary_id}
              className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:bg-neutral-100 transition-colors min-h-[48px]"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">{word.word_text}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {Math.round(word.accuracy)}% accuracy
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className="text-xs text-primary font-medium whitespace-nowrap">
                  {word.consecutive_correct < 2 ? "Keep practicing" : "Getting stronger"}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <Link href="/review?filter=hard-words" className="block">
            <Button variant="outline" className="w-full border-neutral-300 min-h-[48px]">
              Practice These Words
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

