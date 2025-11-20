"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, BookOpen, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { getModules } from "@/lib/config/curriculum"

interface NextLesson {
  moduleId: string
  lessonId: string
  moduleTitle: string
  lessonTitle: string
  description?: string
  status: 'not_started' | 'completed'
  allLessonsCompleted?: boolean
}

interface ResumeLearningProps {
  nextLesson: NextLesson | null
}

/**
 * Extract lesson number from lessonId (e.g., "lesson1" → "1", "lesson12" → "12")
 */
function extractLessonNumber(lessonId: string): string {
  const match = lessonId.match(/lesson(\d+)/i)
  return match ? match[1] : lessonId.replace('lesson', '')
}

/**
 * Format lesson title as "Lesson {n}: {title}"
 */
function formatLessonTitle(lessonId: string, lessonTitle: string): string {
  const lessonNum = extractLessonNumber(lessonId)
  return `Lesson ${lessonNum}: ${lessonTitle}`
}

export function ResumeLearning({ nextLesson }: ResumeLearningProps) {
  // Fallback to Module 1 Lesson 1 if nextLesson is null
  const displayLesson: NextLesson = nextLesson || (() => {
    const modules = getModules()
    const module1 = modules.find(m => m.id === 'module1')
    const lesson1 = module1?.lessons.find(l => l.id === 'lesson1')
    
    if (!module1 || !lesson1) {
      // Ultimate fallback (should never happen)
      return {
        moduleId: 'module1',
        lessonId: 'lesson1',
        moduleTitle: 'Module 1: Greetings & Politeness',
        lessonTitle: 'Basic Persian Greetings',
        description: 'Start your Persian learning journey',
        status: 'not_started' as const,
        allLessonsCompleted: false
      }
    }
    
    return {
      moduleId: module1.id,
      lessonId: lesson1.id,
      moduleTitle: module1.title,
      lessonTitle: lesson1.title,
      description: lesson1.description || module1.description || 'Continue your Persian journey',
      status: 'not_started' as const,
      allLessonsCompleted: false
    }
  })()

  // Handle "all lessons completed" state
  if (displayLesson.allLessonsCompleted) {
    return (
      <Card className="bg-primary/5 border-primary/20 shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg mb-1">You're All Caught Up!</h3>
                <p className="text-sm text-muted-foreground">
                  New lessons coming soon. While you wait, strengthen your vocabulary.
                </p>
              </div>
            </div>
            <Link 
              href="/review"
              className="w-full sm:w-auto flex-shrink-0"
            >
              <Button 
                size="lg" 
                className={cn(
                  "w-full sm:w-auto bg-primary hover:bg-primary/90",
                  "min-h-[48px]" // Touch target
                )}
              >
                <Play className="h-4 w-4 mr-2" />
                Review Your Words
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Regular lesson state (not started or in progress)
  const formattedTitle = formatLessonTitle(displayLesson.lessonId, displayLesson.lessonTitle)

  return (
    <Card className="bg-primary/5 border-primary/20 shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg truncate">{formattedTitle}</h3>
              </div>
              <p className="text-sm text-muted-foreground truncate mb-1">{displayLesson.moduleTitle}</p>
              {displayLesson.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{displayLesson.description}</p>
              )}
            </div>
          </div>
          <Link 
            href={`/modules/${displayLesson.moduleId}/${displayLesson.lessonId}`}
            className="w-full sm:w-auto flex-shrink-0"
          >
            <Button 
              size="lg" 
              className={cn(
                "w-full sm:w-auto bg-primary hover:bg-primary/90",
                "min-h-[48px]" // Touch target
              )}
            >
              <Play className="h-4 w-4 mr-2" />
              Continue Learning
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
