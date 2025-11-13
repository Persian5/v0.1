"use client"

import { WordsLearnedWidget } from "./WordsLearnedWidget"
import { MasteredWordsWidget } from "./MasteredWordsWidget"
import { useLevel } from "@/hooks/use-level"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Award } from "lucide-react"
import { useAuth } from "@/components/auth/AuthProvider"
import { LessonProgressService } from "@/lib/services/lesson-progress-service"
import { SmartAuthService } from "@/lib/services/smart-auth-service"
import { useState, useEffect } from "react"

interface ProgressOverviewProps {
  wordsLearned: number
  masteredWords: number
  wordsToReview?: number
  isLoading?: boolean
}

export function ProgressOverview({ wordsLearned, masteredWords, wordsToReview = 0, isLoading }: ProgressOverviewProps) {
  const { level, progress, isLoading: levelLoading } = useLevel()
  const { user } = useAuth()
  const [lessonsCompleted, setLessonsCompleted] = useState(0)
  const [lessonsLoading, setLessonsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    
    async function loadLessonsCompleted() {
      if (!user?.id) {
        if (isMounted) setLessonsLoading(false)
        return
      }

      // Check cache first (shared with TodaysProgress)
      try {
        const cachedTotal = SmartAuthService.getCachedLessonsCompletedTotal()
        if (cachedTotal !== null) {
          if (isMounted) {
            setLessonsCompleted(cachedTotal)
            setLessonsLoading(false)
          }
          return
        }
      } catch (error) {
        // Cache access failed - continue to API call
        console.warn('Cache access failed, fetching from API:', error)
      }

      try {
        const allProgress = await LessonProgressService.getUserLessonProgress()
        
        if (!isMounted) return // Component unmounted, don't update state
        
        const userTimezone = SmartAuthService.getUserTimezone()
        
        // Cache the counts (timezone-aware, shared with TodaysProgress)
        SmartAuthService.cacheLessonProgressCounts(allProgress, userTimezone)
        
        // Get from cache (now populated)
        const count = SmartAuthService.getCachedLessonsCompletedTotal() ?? 0
        if (isMounted) {
          setLessonsCompleted(count)
        }
      } catch (error) {
        console.error('Failed to load lessons completed:', error)
        if (isMounted) {
          setLessonsCompleted(0)
        }
      } finally {
        if (isMounted) {
          setLessonsLoading(false)
        }
      }
    }

    loadLessonsCompleted()
    
    return () => {
      isMounted = false
    }
  }, [user?.id])

  const isAnyLoading = isLoading || levelLoading || lessonsLoading

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {/* Words Learned */}
      <WordsLearnedWidget wordsLearned={wordsLearned} isLoading={isAnyLoading} />

      {/* Mastered Words */}
      <MasteredWordsWidget masteredWords={masteredWords} isLoading={isAnyLoading} />

      {/* Lessons Completed */}
      {isAnyLoading ? (
        <Card className="bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Lessons Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Lessons Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">
                {lessonsCompleted}
              </div>
              <p className="text-sm text-muted-foreground">
                {lessonsCompleted === 0
                  ? "Complete your first lesson!"
                  : lessonsCompleted === 1
                  ? "lesson completed"
                  : "lessons completed"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}

