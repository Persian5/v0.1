"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight, ChevronLeft, Star, Loader2 } from "lucide-react"
import { getModule } from "@/lib/config/curriculum"
import { useParams, useRouter } from "next/navigation"
import { LessonProgressService } from "@/lib/services/lesson-progress-service"
import { UserLessonProgress } from "@/lib/supabase/database"
import { AuthService } from "@/lib/services/auth-service"
import { AccountNavButton } from "@/app/components/AccountNavButton"
import { useXp } from "@/hooks/use-xp"
import { XpService } from "@/lib/services/xp-service"
import { AuthModal } from "@/components/auth/AuthModal"
import { useAuth } from "@/components/auth/AuthProvider"

export default function ModulePage() {
  const { moduleId } = useParams()
  const router = useRouter()
  const { user, isEmailVerified, isLoading: authLoading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [pendingLessonPath, setPendingLessonPath] = useState<string | null>(null)
  const [progress, setProgress] = useState<UserLessonProgress[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { xp } = useXp()

  // Get data from config
  const module = getModule(moduleId as string)

  // Determine if user is authenticated (no duplicate auth calls)
  const isAuthenticated = !!(user && isEmailVerified)

  useEffect(() => {
    const loadProgress = async () => {
      if (!module) return;
      
      // Wait for auth to complete before loading progress
      if (authLoading) return;
      
      try {
        setIsLoading(true)
        setError(null)
        
        if (isAuthenticated) {
          // Load progress for authenticated users
          const userProgress = await LessonProgressService.getUserLessonProgress()
          setProgress(userProgress)
        } else {
          // For unauthenticated users, just set empty progress
          setProgress([])
        }
      } catch (error) {
        console.error('Failed to load lesson progress:', error)
        // Don't set error for unauthenticated users
        if (isAuthenticated) {
          setError('Failed to load progress. Please try again.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadProgress()
  }, [module, authLoading, isAuthenticated])

  // Helper function to check if a lesson is completed
  const isLessonCompleted = (moduleId: string, lessonId: string): boolean => {
    if (!isAuthenticated) return false
    return progress.some(p => 
      p.module_id === moduleId && 
      p.lesson_id === lessonId && 
      p.status === 'completed'
    )
  }

  // Helper function to get default accessibility for unauthenticated users
  const getDefaultAccessibility = (moduleId: string, lessonId: string): boolean => {
    // For unauthenticated users: Module 1 Lesson 1 is accessible, others are locked until auth
    return moduleId === 'module1' && lessonId === 'lesson1'
  }

  // ======== INSTANT ACCESSIBILITY CALC (NO NETWORK LAG) ========
  const computeAccessibility = (): {[key: string]: boolean} => {
    if (!module) return {}

    const result: {[key: string]: boolean} = {}

    module.lessons.forEach((lesson) => {
      if (lesson.locked) {
        result[`${module.id}-${lesson.id}`] = false
        return
      }

      if (!isAuthenticated) {
        // Unauthed: only Module1 Lesson1 accessible
        result[`${module.id}-${lesson.id}`] = module.id === 'module1' && lesson.id === 'lesson1'
        return
      }

      // Use fast accessibility check with cached progress data
      result[`${module.id}-${lesson.id}`] = LessonProgressService.isLessonAccessibleFast(
        module.id, 
        lesson.id, 
        progress, 
        isAuthenticated
      )
    })

    return result
  }

  const accessibilityCache = computeAccessibility()

  // === HANDLER: lesson click interception ===
  const handleLessonClick = (
    e: React.MouseEvent,
    path: string,
    isLocked: boolean
  ) => {
    if (isLocked) {
      // Locked for sequencing/paywall – default behaviour (no nav)
      e.preventDefault()
      return
    }

    const authed = user && isEmailVerified

    if (!authed) {
      // Prevent navigation – open auth modal overlay
      e.preventDefault()
      setPendingLessonPath(path)
      setShowAuthModal(true)
    }
    // Authenticated users fall through to normal Link navigation
  }

  if (!module) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-muted-foreground">Module not found</p>
      </div>
    )
  }

  const lessons = module.lessons

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header - Much more compact on mobile */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <Link href="/modules" className="flex items-center gap-1 sm:gap-2 font-bold text-sm sm:text-lg text-primary">
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Back to Modules</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">{XpService.formatXp(xp)}</span>
            </div>
            <AccountNavButton />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Module Overview - Much more compact on mobile */}
        <section className="py-4 sm:py-8 lg:py-12 px-3 sm:px-6 lg:px-8 bg-primary/5">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-primary mb-2 sm:mb-4">
              {module.title}
            </h1>
            <p className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Master the art of Persian {module.id.replace('module', '').toLowerCase() === '1' ? 'greetings' : module.description.split(' ')[1].toLowerCase()}
            </p>
          </div>
        </section>

        {/* Lessons Grid - Compact mobile layout */}
        <section className="py-4 sm:py-8 lg:py-12 px-3 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            {(authLoading || isLoading) ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {authLoading ? "Authenticating..." : "Loading lessons..."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {lessons.map((lesson) => {
                  const isCompleted = isLessonCompleted(module.id, lesson.id)
                  const isAccessible = accessibilityCache[`${module.id}-${lesson.id}`] ?? false
                  const isLocked = !isAccessible
                  
                  return (
                  <Card
                    key={lesson.id}
                      className={`relative transition-all duration-300 hover:shadow-lg border-2 bg-white ${
                        isLocked ? "opacity-60 border-gray-200" : 
                        isCompleted ? "border-green-300 bg-green-50 hover:border-green-400" : 
                        "border-accent/30 hover:border-accent hover:scale-105"
                    }`}
                  >
                      <CardHeader className="pb-2 sm:pb-4 pt-3 sm:pt-6 px-3 sm:px-6">
                        <CardTitle className="text-center">
                          <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 leading-tight mb-2 sm:mb-3">
                        {lesson.title}
                          </h3>
                          {/* Single small status indicator */}
                          {isCompleted ? (
                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              Completed
                            </div>
                          ) : isLocked ? (
                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                              Locked
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                              Available
                            </div>
                          )}
                      </CardTitle>
                    </CardHeader>
                      <CardContent className="pt-0 px-3 sm:px-6">
                        <p className="text-xs sm:text-sm lg:text-base text-gray-600 text-center min-h-[40px] sm:min-h-[60px] lg:min-h-[80px] flex items-center justify-center">
                          {lesson.description}
                        </p>
                    </CardContent>
                      <CardFooter className="pt-0 pb-3 sm:pb-6 px-3 sm:px-6">
                        <div className="w-full">
                          <Link href={`/modules/${module.id}/${lesson.id}`} className="block" 
                            onClick={(e)=>handleLessonClick(e, `/modules/${module.id}/${lesson.id}`, isLocked)}
                          >
                        <Button
                              variant={isCompleted ? "outline" : "default"}
                              className={`w-full justify-between group py-2 sm:py-3 font-semibold text-xs sm:text-sm ${
                                isLocked ? "cursor-not-allowed bg-gray-100 text-gray-500" : 
                                isCompleted ? "border-green-300 text-green-700 hover:bg-green-50" :
                                "bg-accent hover:bg-accent/90 text-white"
                          }`}
                              disabled={isLocked}
                        >
                              <span className="flex-1 text-center">
                                {isLocked ? "Complete Previous" : isCompleted ? "Practice Again" : "Start Lesson"}
                              </span>
                              {!isLocked && <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />}
                        </Button>
                      </Link>
                        </div>
                    </CardFooter>
                  </Card>
                  )
                })}
              </div>
            )}
            
            {/* Progress Summary - More compact on mobile */}
            {!authLoading && (
              <div className="mt-6 sm:mt-8 lg:mt-12 text-center">
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white rounded-full shadow-sm border">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs sm:text-sm text-gray-600">
                    {progress.filter(p => p.status === 'completed').length} of {lessons.length} lessons completed
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Auth modal overlay */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false)
        }}
        onSuccess={() => {
          if (pendingLessonPath) {
            router.push(pendingLessonPath)
          }
        }}
      />
    </div>
  )
} 