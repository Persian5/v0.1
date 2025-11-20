"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Target, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { VocabularyService } from "@/lib/services/vocabulary-service"
import type { VocabularyItem } from "@/lib/types"
import { cn } from "@/lib/utils"
import { motion, useInView } from "framer-motion"

interface WordNeedingPractice {
  vocabulary_id: string
  word_text: string
  consecutive_correct: number
  total_attempts: number
  total_correct: number
  total_incorrect: number
  accuracy: number
  last_seen_at: string | null
}

interface WordsNeedingPracticeProps {
  wordsToReview: WordNeedingPractice[]
  hardWords: WordNeedingPractice[]
  isLoading: boolean
  shouldAnimate?: boolean
  onAnimationComplete?: () => void
}

export function WordsNeedingPractice({ wordsToReview, hardWords, isLoading, shouldAnimate = true, onAnimationComplete }: WordsNeedingPracticeProps) {
  const [vocabDefinitions, setVocabDefinitions] = useState<Map<string, VocabularyItem>>(new Map())
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  
  // Mark animation as complete when section enters viewport
  useEffect(() => {
    if (isInView && shouldAnimate && onAnimationComplete) {
      onAnimationComplete()
    }
  }, [isInView, shouldAnimate, onAnimationComplete])
  
  // Merge and deduplicate words (prioritize hard words for accuracy display)
  const mergedWords = (() => {
    const seen = new Set<string>()
    const combined: WordNeedingPractice[] = []
    
    // Add hard words first (lower accuracy = higher priority)
    for (const word of [...hardWords].sort((a, b) => a.accuracy - b.accuracy)) {
      if (!seen.has(word.vocabulary_id)) {
        seen.add(word.vocabulary_id)
        combined.push(word)
      }
    }
    
    // Add words to review that aren't already in hard words
    for (const word of wordsToReview) {
      if (!seen.has(word.vocabulary_id)) {
        seen.add(word.vocabulary_id)
        combined.push(word)
      }
    }
    
    return combined.slice(0, 8) // Show max 8 words (2 rows of 4)
  })()

  // Load vocabulary definitions
  useEffect(() => {
    if (mergedWords.length === 0) return

    setVocabDefinitions(prev => {
      const updated = new Map(prev)
      
      for (const word of mergedWords) {
        if (!updated.has(word.vocabulary_id)) {
          const vocab = VocabularyService.findVocabularyById(word.vocabulary_id)
          if (vocab) {
            updated.set(word.vocabulary_id, vocab)
          }
        }
      }
      
      return updated
    })
  }, [mergedWords.length])

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (mergedWords.length === 0) {
    return (
      <Card className="bg-white border border-neutral-200/50 shadow-sm rounded-2xl">
        <CardContent className="p-8 text-center">
          <div className="inline-flex p-3 rounded-full bg-green-100 text-green-600 mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">All Caught Up!</h3>
          <p className="text-neutral-500 mb-6">
            Excellent work! All your words are strong.
          </p>
          <Link href="/modules">
            <Button variant="outline" className="border-neutral-200">
              Continue Learning
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div ref={ref}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
        {mergedWords.map((word, index) => {
          const vocab = vocabDefinitions.get(word.vocabulary_id)
          const finglish = vocab?.finglish || word.word_text || 'Loading...'
          const english = vocab?.en || word.word_text || 'Loading...'
          const accuracy = Math.round(word.accuracy)
          
          return (
            <motion.div
              key={word.vocabulary_id}
              initial={shouldAnimate ? { opacity: 0, y: 30 } : { opacity: 1, y: 0 }}
              animate={isInView && shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: index * 0.04 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Link
                href={`/review?word=${word.vocabulary_id}`}
                className="block group h-full"
              >
                <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 hover:bg-white hover:border-primary/30 hover:shadow-md transition-all duration-200 h-full flex flex-col justify-center text-center relative overflow-hidden">
                  <p className="font-semibold text-neutral-900 mb-1 truncate text-base">
                    {finglish}
                  </p>
                  <p className="text-xs text-neutral-500 truncate mb-3">
                    {english}
                  </p>
                  
                  {/* Accuracy Label */}
                  <p className={cn(
                    "text-[10px] font-medium text-right mb-1",
                    accuracy < 50 ? "text-red-500" : accuracy < 80 ? "text-amber-500" : "text-green-500"
                  )}>
                    Accuracy {accuracy}%
                  </p>

                  {/* Accuracy indicator bar */}
                  <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={shouldAnimate ? { width: 0 } : { width: `${accuracy}%` }}
                      animate={isInView && shouldAnimate ? { width: `${accuracy}%` } : { width: `${accuracy}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: shouldAnimate ? 0.5 + (index * 0.04) : 0 }}
                      className={cn(
                        "h-full rounded-full",
                        accuracy < 50 ? "bg-red-400" : accuracy < 80 ? "bg-amber-400" : "bg-green-400"
                      )}
                    />
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      <Link href="/review" className="block">
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button 
            variant="secondary" 
            className="w-full bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-medium h-12 rounded-2xl shadow-sm hover:shadow transition-all"
          >
            <Target className="h-4 w-4 mr-2 text-primary" />
            Practice All Words
          </Button>
        </motion.div>
      </Link>
    </div>
  )
}

