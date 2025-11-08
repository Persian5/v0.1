"use client"

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Lock, ArrowRight, Home, BookOpen } from 'lucide-react'
import { LessonProgressService } from '@/lib/services/lesson-progress-service'
import { getModule, getLesson } from '@/lib/config/curriculum'
import { useState, useEffect } from 'react'
import WidgetErrorBoundary from '@/components/errors/WidgetErrorBoundary'

interface LockScreenProps {
  isOpen: boolean
  type: 'sequential' | 'prerequisites'
  message: string
  currentModuleId: string
  currentLessonId?: string // Optional - only for sequential locks
  missingPrerequisites?: string[] // For prerequisites locks
}

interface NextLessonInfo {
  moduleId: string
  lessonId: string
  moduleTitle: string
  lessonTitle: string
}

export function LockScreen({
  isOpen,
  type,
  message,
  currentModuleId,
  currentLessonId,
  missingPrerequisites = []
}: LockScreenProps) {
  const router = useRouter()
  const [nextLesson, setNextLesson] = useState<NextLessonInfo | null>(null)
  const [isLoadingNextLesson, setIsLoadingNextLesson] = useState(true)

  // Auto-detect next available lesson
  useEffect(() => {
    const detectNextLesson = async () => {
      if (!isOpen) return
      
      setIsLoadingNextLesson(true)
      try {
        let next: { moduleId: string; lessonId: string }
        
        if (type === 'sequential' && currentLessonId) {
          // For sequential: find first incomplete lesson starting from current
          next = await LessonProgressService.getFirstAvailableLesson()
        } else if (type === 'prerequisites' && missingPrerequisites.length > 0) {
          // For prerequisites: go to first missing prerequisite module's first lesson
          const firstMissingModule = getModule(missingPrerequisites[0])
          if (firstMissingModule && firstMissingModule.lessons.length > 0) {
            const firstLesson = firstMissingModule.lessons.find(l => !l.locked) || firstMissingModule.lessons[0]
            next = {
              moduleId: firstMissingModule.id,
              lessonId: firstLesson.id
            }
          } else {
            // Fallback to first available lesson
            next = await LessonProgressService.getFirstAvailableLesson()
          }
        } else {
          // Fallback: get first available lesson
          next = await LessonProgressService.getFirstAvailableLesson()
        }
        
        const module = getModule(next.moduleId)
        const lesson = getLesson(next.moduleId, next.lessonId)
        
        if (module && lesson) {
          setNextLesson({
            moduleId: next.moduleId,
            lessonId: next.lessonId,
            moduleTitle: module.title,
            lessonTitle: lesson.title
          })
        }
      } catch (error) {
        console.error('Failed to detect next lesson:', error)
        // Set fallback
        setNextLesson({
          moduleId: 'module1',
          lessonId: 'lesson1',
          moduleTitle: 'Module 1',
          lessonTitle: 'Lesson 1'
        })
      } finally {
        setIsLoadingNextLesson(false)
      }
    }

    detectNextLesson()
  }, [isOpen, type, currentModuleId, currentLessonId, missingPrerequisites])

  const handleContinueLearning = () => {
    if (nextLesson) {
      router.push(`/modules/${nextLesson.moduleId}/${nextLesson.lessonId}`)
    } else {
      router.push('/modules')
    }
  }

  const handleGoToReview = () => {
    router.push('/review')
  }

  const handleGoToDashboard = () => {
    router.push('/modules')
  }

  // Simplified message - don't show specific lesson names
  const displayMessage = type === 'sequential' 
    ? 'Complete the previous lessons to unlock this lesson.'
    : message

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-background via-primary/5 to-background border-primary/20">
        <WidgetErrorBoundary>
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold">
              Lesson Locked
            </DialogTitle>
            <DialogDescription className="text-center">
              {displayMessage}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Continue Learning Button - Responsive to content */}
            {nextLesson && !isLoadingNextLesson && (
              <Button
                onClick={handleContinueLearning}
                className="w-full bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 text-white font-semibold py-6 text-base sm:text-lg break-words"
              >
                <BookOpen className="mr-2 h-5 w-5 flex-shrink-0" />
                <span className="flex-1 text-center">Continue Learning</span>
                <ArrowRight className="ml-2 h-5 w-5 flex-shrink-0" />
              </Button>
            )}
            
            {isLoadingNextLesson && (
              <Button
                disabled
                className="w-full bg-primary/50 text-white font-semibold py-6 text-base sm:text-lg"
              >
                Loading next lesson...
              </Button>
            )}

            {/* Secondary Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleGoToReview}
                className="w-full"
              >
                Go to Review
              </Button>
              
              <Button
                variant="outline"
                onClick={handleGoToDashboard}
                className="w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </div>
          </div>
        </WidgetErrorBoundary>
      </DialogContent>
    </Dialog>
  )
}

