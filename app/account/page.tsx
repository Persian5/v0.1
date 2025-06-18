"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, User, Trophy, Target, Loader2 } from "lucide-react"
import { useXp } from "@/hooks/use-xp"
import { XpService } from "@/lib/services/xp-service"
import { LessonProgressService } from "@/lib/services/lesson-progress-service"

export default function AccountPage() {
  const [mounted, setMounted] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const { xp } = useXp({
    storageKey: 'global-user-xp'
  });

  useEffect(() => {
    setMounted(true)
  }, [])

  // Get the next lesson to continue from
  const getNextLesson = () => {
    return LessonProgressService.getFirstAvailableLesson();
  }

  const handleContinueLearning = () => {
    setIsNavigating(true)
    const nextLesson = getNextLesson()
    window.location.href = `/modules/${nextLesson.moduleId}/${nextLesson.lessonId}`
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-3 sm:px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-base sm:text-lg text-primary hover:text-primary/80 transition-colors">
            Home
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/pricing">
              <Button variant="ghost" size="sm" className="hover:bg-primary/10 transition-colors">
                Pricing + FAQ
              </Button>
            </Link>
            <Link href="/modules">
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-white transition-all duration-200 hover:scale-105">
                Start Learning
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
          {/* Page Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex justify-center items-center gap-3 mb-4">
              <User className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-primary">
                Your Account
              </h1>
            </div>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Track your Persian learning progress
            </p>
          </div>

          {/* XP Card */}
          <Card className="mb-6 sm:mb-8 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20 hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl sm:text-2xl flex items-center gap-3">
                <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
                Total Experience Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl sm:text-6xl font-bold text-accent mb-4">
                  {XpService.formatXp(xp)}
                </div>
                <p className="text-muted-foreground text-base sm:text-lg">
                  Keep learning to earn more XP!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Learning Stats */}
            <Card className="hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                  Learning Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-muted-foreground text-sm sm:text-base">Lessons Completed</span>
                    <span className="font-semibold text-sm sm:text-base">
                      {xp > 0 ? Math.floor(xp / 10) : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-muted-foreground text-sm sm:text-base">Current Streak</span>
                    <span className="font-semibold text-sm sm:text-base">
                      {xp > 20 ? "🔥 Active" : "Start learning!"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground text-sm sm:text-base">Learning Level</span>
                    <span className="font-semibold text-sm sm:text-base">
                      {xp < 50 ? "Beginner" : xp < 200 ? "Intermediate" : "Advanced"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Goals */}
            <Card className="hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  Learning Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-muted-foreground text-sm sm:text-base">Next Milestone</span>
                    <span className="font-semibold text-sm sm:text-base">
                      {xp < 100 ? "100 XP" : xp < 500 ? "500 XP" : "1000 XP"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-muted-foreground text-sm sm:text-base">Progress</span>
                    <span className="font-semibold text-sm sm:text-base">
                      {xp < 100 ? `${xp}/100` : xp < 500 ? `${xp}/500` : `${xp}/1000`}
                    </span>
                  </div>
                  <div className="py-2">
                    <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                      <div 
                        className="bg-green-500 h-2 sm:h-3 rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${Math.min(100, xp < 100 ? (xp / 100) * 100 : xp < 500 ? (xp / 500) * 100 : (xp / 1000) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Link href="/modules" className="flex-1">
                  <Button className="w-full bg-accent hover:bg-accent/90 text-white transition-all duration-200 hover:scale-105 py-3 sm:py-2 text-base sm:text-sm">
                    Browse Modules
                  </Button>
                </Link>
                <Button 
                  onClick={handleContinueLearning}
                  variant="outline" 
                  className="flex-1 w-full transition-all duration-200 hover:scale-105 py-3 sm:py-2 text-base sm:text-sm hover:bg-primary/10"
                  disabled={isNavigating}
                >
                  {isNavigating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Continue Learning"
                  )}
                </Button>
                <Link href="/pricing" className="flex-1">
                  <Button variant="outline" className="w-full transition-all duration-200 hover:scale-105 py-3 sm:py-2 text-base sm:text-sm hover:bg-primary/10">
                    FAQ
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 