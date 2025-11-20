"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, BookOpen, CheckCircle2, ArrowRight } from "lucide-react"
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
      <Card className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 shadow-sm">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 flex-shrink-0">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-neutral-900">You're All Caught Up!</h3>
                <p className="text-base text-neutral-600">
                  New lessons coming soon. While you wait, strengthen your vocabulary.
                </p>
              </div>
            </div>
            <Link href="/review" className="w-full md:w-auto">
              <Button 
                size="lg" 
                className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-14 px-8 rounded-xl shadow-sm hover:shadow transition-all"
              >
                <Play className="h-5 w-5 mr-2 fill-current" />
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
    <Card className="bg-gradient-to-br from-amber-50/80 to-white border border-amber-100/50 shadow-sm hover:shadow-md transition-all duration-300 group">
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-5 flex-1 w-full">
            <div className="p-4 rounded-2xl bg-amber-100/50 text-amber-600 flex-shrink-0 shadow-inner hidden sm:block">
              <BookOpen className="h-8 w-8" />
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold tracking-wide uppercase">
                  Next Up
                </span>
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 tracking-tight leading-tight">
                {formattedTitle}
              </h3>
              <p className="text-base font-medium text-neutral-500 truncate">
                {displayLesson.moduleTitle}
              </p>
              {displayLesson.description && (
                <p className="text-sm text-neutral-400 line-clamp-2 max-w-xl">
                  {displayLesson.description}
                </p>
              )}
            </div>
          </div>
          
          <Link 
            href={`/modules/${displayLesson.moduleId}/${displayLesson.lessonId}`}
            className="w-full md:w-auto flex-shrink-0 mt-2 md:mt-0"
          >
            <Button 
              size="lg" 
              className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white font-bold h-14 px-8 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 text-lg"
            >
              Continue Learning
              <ArrowRight className="h-5 w-5 ml-2 stroke-[3px]" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
