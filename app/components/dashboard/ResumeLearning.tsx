"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/AuthProvider"
import { LessonProgressService } from "@/lib/services/lesson-progress-service"
import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Play, BookOpen } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface LastLesson {
  moduleId: string
  lessonId: string
  moduleTitle: string
  lessonTitle: string
  progressPercent: number
}

export function ResumeLearning() {
  const { user } = useAuth()
  const [lastLesson, setLastLesson] = useState<LastLesson | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadLastLesson() {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      try {
        const allProgress = await LessonProgressService.getAllProgress(user.id)
        
        // Find last started or completed lesson
        const lastStarted = allProgress
          .filter(p => p.status === 'in_progress' || p.status === 'completed')
          .sort((a, b) => {
            const aDate = a.started_at ? new Date(a.started_at).getTime() : 0
            const bDate = b.started_at ? new Date(b.started_at).getTime() : 0
            return bDate - aDate
          })[0]

        if (lastStarted) {
          // Get module/lesson titles from curriculum
          const { getCurriculum } = await import('@/lib/config/curriculum')
          const curriculum = getCurriculum()
          const module = curriculum.modules.find(m => m.id === lastStarted.module_id)
          const lesson = module?.lessons.find(l => l.id === lastStarted.lesson_id)

          if (module && lesson) {
            setLastLesson({
              moduleId: lastStarted.module_id,
              lessonId: lastStarted.lesson_id,
              moduleTitle: module.title,
              lessonTitle: lesson.title,
              progressPercent: lastStarted.progress_percent,
            })
          }
        }
      } catch (error) {
        console.error('Failed to load last lesson:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLastLesson()
  }, [user?.id])

  if (isLoading) {
    return (
      <Card className="bg-primary/5 border-primary/20 shadow-md">
        <CardContent className="p-4 md:p-6">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!lastLesson) {
    return (
      <Card className="bg-primary/5 border-primary/20 shadow-md">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Start Learning</h3>
                <p className="text-sm text-muted-foreground">Begin your Persian journey</p>
              </div>
            </div>
            <Link href="/modules">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                <Play className="h-4 w-4 mr-2" />
                Start
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isCompleted = lastLesson.progressPercent === 100

  return (
    <Card className="bg-primary/5 border-primary/20 shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-3 rounded-lg bg-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{lastLesson.lessonTitle}</h3>
              <p className="text-sm text-muted-foreground truncate">{lastLesson.moduleTitle}</p>
              {!isCompleted && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{lastLesson.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${lastLesson.progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <Link 
            href={`/modules/${lastLesson.moduleId}/lessons/${lastLesson.lessonId}`}
            className="w-full sm:w-auto"
          >
            <Button 
              size="lg" 
              className={cn(
                "w-full sm:w-auto bg-primary hover:bg-primary/90",
                "min-h-[48px]" // Touch target
              )}
            >
              <Play className="h-4 w-4 mr-2" />
              {isCompleted ? "Review Lesson" : "Continue"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

