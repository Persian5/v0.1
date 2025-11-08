"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight, ChevronLeft, Star, Loader2 } from "lucide-react"
import { ModulePreviewContent } from "@/components/previews/ModulePreviewContent"
import { BlurredPreviewContainer } from "@/components/previews/BlurredPreviewContainer"
import { NotFound } from "@/components/NotFound"
import { getModule } from "@/lib/config/curriculum"
import { LessonProgressService } from "@/lib/services/lesson-progress-service"
import { AccountNavButton } from "@/app/components/AccountNavButton"
import { useParams, useRouter } from "next/navigation"
import { UserLessonProgress } from "@/lib/supabase/database"
import { useXp } from "@/hooks/use-xp"
import { XpService } from "@/lib/services/xp-service"
import { AuthModal } from "@/components/auth/AuthModal"
import { PremiumLockModal } from "@/components/PremiumLockModal"
import { LockScreen } from "@/components/LockScreen"
import { SmartAuthService } from "@/lib/services/smart-auth-service"
import { getCachedModuleAccess, setCachedModuleAccess } from "@/lib/utils/module-access-cache"

export default function ModulePage() {
  const { moduleId } = useParams()
  const router = useRouter()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [showLockScreen, setShowLockScreen] = useState(false)
  const [lockType, setLockType] = useState<'sequential' | 'prerequisites' | null>(null)
  const [lockMessage, setLockMessage] = useState('')
  const [missingPrerequisites, setMissingPrerequisites] = useState<string[]>([])
  const [pendingLessonPath, setPendingLessonPath] = useState<string | null>(null)
  const [allProgress, setAllProgress] = useState<UserLessonProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { xp } = useXp()

  // Get data from config
  const module = getModule(moduleId as string)
  
  useEffect(() => {
    const loadAuthAndProgress = async () => {
      if (!module) return;
      
      try {
        setIsLoading(true)
        setError(null)
        
        // Use SmartAuthService for instant auth state (cached)
        const { user, isEmailVerified, isReady } = await SmartAuthService.initializeSession()
        
        if (!isReady) {
          // Still initializing
          return
        }
        
        const authenticated = !!(user && isEmailVerified)
        setIsAuthenticated(authenticated)
        
        // Check module access with caching (only if authenticated and module requires it)
        if (authenticated && module?.requiresPremium && user) {
          try {
            // Check cache first (30-second cache)
            const cachedAccess = getCachedModuleAccess(moduleId as string, user.id)
            let accessData
            
            if (cachedAccess) {
              accessData = cachedAccess
            } else {
              // Cache miss - fetch from API
              const accessResponse = await fetch(`/api/check-module-access?moduleId=${moduleId}`)
              if (accessResponse.ok) {
                accessData = await accessResponse.json()
                setCachedModuleAccess(moduleId as string, user.id, accessData)
              }
            }
            
            // ✅ FIX: Show overlay instead of redirecting
            if (accessData && !accessData.canAccess) {
              if (accessData.reason === 'no_premium') {
                // Show premium modal overlay
                setShowPremiumModal(true)
                setIsLoading(false)
                return
              } else if (accessData.reason === 'incomplete_prerequisites') {
                // Show prerequisites lock screen
                const missingModules = accessData.missingPrerequisites || []
                const { getModule } = await import('@/lib/config/curriculum')
                const firstMissingModule = missingModules[0] ? getModule(missingModules[0]) : null
                const message = firstMissingModule
                  ? `Complete ${firstMissingModule.title} first to unlock this module.`
                  : 'Complete previous modules first to unlock this module.'
                
                setShowLockScreen(true)
                setLockType('prerequisites')
                setLockMessage(message)
                setMissingPrerequisites(missingModules)
                setIsLoading(false)
                return
              }
            }
          } catch (accessError) {
            console.error('Failed to check module access:', accessError)
            // On error, continue to allow access (fail open for better UX)
          }
        }
        
        if (authenticated) {
          // Use cached progress data if available, otherwise load
          if (SmartAuthService.hasCachedProgress()) {
            const cachedProgress = SmartAuthService.getCachedProgress()
            setAllProgress(cachedProgress)
          } else {
            // Fallback to API call if cache not available
            const userProgress = await LessonProgressService.getUserLessonProgress()
            setAllProgress(userProgress)
          }
        } else {
          // For unauthenticated users, just set empty progress
          setAllProgress([])
        }
      } catch (error) {
        console.error('Failed to load auth and progress:', error)
        // Don't set error for unauthenticated users
        if (isAuthenticated) {
          setError('Failed to load progress. Please try again.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadAuthAndProgress()
  }, [module, moduleId, router])

  // Helper function to check if a lesson is completed
  const isLessonCompleted = (moduleId: string, lessonId: string): boolean => {
    if (!isAuthenticated) return false
    return allProgress.some(p => 
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

      // Use fast accessibility check with the complete, unfiltered progress data
      result[`${module.id}-${lesson.id}`] = LessonProgressService.isLessonAccessibleFast(
        module.id, 
        lesson.id, 
        allProgress, 
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

    const authed = isAuthenticated

    if (!authed) {
      // Prevent navigation – open auth modal overlay
      e.preventDefault()
      setPendingLessonPath(path)
      setShowAuthModal(true)
    }
    // Authenticated users fall through to normal Link navigation
  }

  if (!module) {
    return <NotFound type="module" moduleId={moduleId as string} />
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

  // For non-auth users: show full lesson list with auth modal overlay (cannot be dismissed)
  if (!isAuthenticated && !isLoading) {
    return (
      <>
        <BlurredPreviewContainer
          header={
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
          }
        >
          <ModulePreviewContent
            module={module}
            lessons={lessons}
            accessibilityCache={accessibilityCache}
            badgeText="Sign up to unlock"
            buttonText="Sign up to start"
            showStats={true}
          />
        </BlurredPreviewContainer>
        
        {/* Auth Modal Overlay - Cannot be dismissed, only navigation allowed */}
        <AuthModal
          isOpen={true}
          onClose={() => {
            router.push('/modules')
          }}
          onSuccess={async () => {
            window.location.reload()
          }}
          title="Sign up to continue learning Persian"
          description="Join thousands learning to reconnect with their roots"
        />
      </>
    )
  }

  // For authenticated users with premium/prerequisites issues: show overlay
  if (isAuthenticated && !isLoading && (showPremiumModal || showLockScreen)) {
    return (
      <>
        <BlurredPreviewContainer
          header={
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
          }
        >
          <ModulePreviewContent
            module={module}
            lessons={lessons}
            accessibilityCache={{}}
            badgeText={showPremiumModal ? 'Premium Required' : 'Locked'}
            buttonText={showPremiumModal ? 'Unlock Premium' : 'Complete Previous'}
            showStats={true}
          />
        </BlurredPreviewContainer>
        
        {/* Premium Modal Overlay */}
        {showPremiumModal && (
          <PremiumLockModal
            isOpen={true}
            onClose={() => {
              setShowPremiumModal(false)
              router.push('/modules')
            }}
            moduleTitle={module?.title}
          />
        )}

        {/* Lock Screen Overlay */}
        {showLockScreen && lockType && (
          <LockScreen
            isOpen={true}
            type={lockType}
            message={lockMessage}
            currentModuleId={moduleId as string}
            missingPrerequisites={missingPrerequisites}
          />
        )}
      </>
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
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Loading lessons...
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
            {!isLoading && (
            <div className="mt-6 sm:mt-8 lg:mt-12 text-center">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white rounded-full shadow-sm border">
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
                <span className="text-xs sm:text-sm text-gray-600">
                    {allProgress.filter(p => p.module_id === moduleId && p.status === 'completed').length} of {lessons.length} lessons completed
                </span>
              </div>
            </div>
            )}
          </div>
        </section>
      </main>

      {/* Auth modal overlay (for authenticated users clicking locked lessons) */}
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