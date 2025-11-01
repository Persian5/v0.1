"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { AlertCircle, TrendingDown } from "lucide-react"
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
      <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200 hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            Words to Review
          </CardTitle>
          <CardDescription>Words you're struggling with</CardDescription>
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
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-green-700">
            <TrendingDown className="h-5 w-5" />
            Words to Review
          </CardTitle>
          <CardDescription>Great job! No struggling words right now.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Keep practicing to maintain your progress!
            </p>
            <Link href="/modules">
              <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-100">
                Continue Learning
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200 hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          Words to Review
        </CardTitle>
        <CardDescription>Focus on these words to improve</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {hardWords.slice(0, 10).map((word) => (
            <div
              key={word.vocabulary_id}
              className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-red-100 hover:bg-white/80 transition-colors"
            >
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{word.word_text}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {word.total_correct} correct / {word.total_attempts} attempts • {Math.round(word.accuracy)}% accuracy
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-red-600 font-medium">
                  {word.consecutive_correct < 2 ? "Needs practice" : "Getting better"}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-red-200">
          <Link href="/review" className="block">
            <Button variant="outline" className="w-full border-red-300 text-red-700 hover:bg-red-100">
              Review Mode
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

