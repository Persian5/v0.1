"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { VocabularyService } from "@/lib/services/vocabulary-service"
import type { VocabularyItem } from "@/lib/types"

interface WordToReview {
  vocabulary_id: string
  word_text: string
  consecutive_correct: number
  total_attempts: number
  total_correct: number
  total_incorrect: number
  accuracy: number
  last_seen_at: string | null
}

interface WordsToReviewWidgetProps {
  wordsToReview: WordToReview[]
  isLoading: boolean
}

export function WordsToReviewWidget({ wordsToReview, isLoading }: WordsToReviewWidgetProps) {
  const [expanded, setExpanded] = useState(false)
  const [displayedCount, setDisplayedCount] = useState(3)
  const [vocabDefinitions, setVocabDefinitions] = useState<Map<string, VocabularyItem>>(new Map())

  // Load vocabulary definitions for displayed words
  useEffect(() => {
    if (wordsToReview.length === 0) return

    const loadDefinitions = () => {
      const definitions = new Map<string, VocabularyItem>()
      const wordsToLoad = wordsToReview.slice(0, displayedCount)
      
      for (const word of wordsToLoad) {
        if (!vocabDefinitions.has(word.vocabulary_id)) {
          const vocab = VocabularyService.findVocabularyById(word.vocabulary_id)
          if (vocab) {
            definitions.set(word.vocabulary_id, vocab)
          }
        }
      }
      
      if (definitions.size > 0) {
        setVocabDefinitions(prev => {
          const updated = new Map(prev)
          definitions.forEach((value, key) => updated.set(key, value))
          return updated
        })
      }
    }

    loadDefinitions()
  }, [wordsToReview, displayedCount, vocabDefinitions])

  const handleLoadMore = () => {
    setDisplayedCount(prev => Math.min(prev + 5, wordsToReview.length))
  }

  const displayedWords = wordsToReview.slice(0, displayedCount)
  const hasMore = displayedCount < wordsToReview.length

  if (isLoading) {
    return (
      <Card className="bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Words to Review
          </CardTitle>
          <CardDescription>Words due for review</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (wordsToReview.length === 0) {
    return (
      <Card className="bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Words to Review
          </CardTitle>
          <CardDescription>Words due for review</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-5xl font-bold text-primary mb-2">0</div>
            <p className="text-sm text-muted-foreground">
              No words due for review right now
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Words to Review
        </CardTitle>
        <CardDescription>
          {wordsToReview.length} {wordsToReview.length === 1 ? 'word' : 'words'} due for review
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayedWords.map((word) => {
            const vocab = vocabDefinitions.get(word.vocabulary_id)
            const finglish = vocab?.finglish || word.word_text || 'Loading...'
            const english = vocab?.en || 'Loading...'
            
            return (
              <div
                key={word.vocabulary_id}
                className="flex items-start justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200 hover:bg-neutral-100 transition-colors min-h-[48px]"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{finglish}</div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {english}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {Math.round(word.accuracy)}% accuracy
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {hasMore && (
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              className="w-full border-neutral-300 min-h-[48px]"
            >
              Load {Math.min(5, wordsToReview.length - displayedCount)} More
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {displayedCount >= wordsToReview.length && wordsToReview.length > 3 && (
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <Button
              variant="outline"
              onClick={() => {
                setDisplayedCount(3)
                setExpanded(false)
              }}
              className="w-full border-neutral-300 min-h-[48px]"
            >
              Show Less
              <ChevronUp className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-neutral-200">
          <Link href="/review" className="block">
            <Button variant="outline" className="w-full border-neutral-300 min-h-[48px]">
              Review All Words
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

