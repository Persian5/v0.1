"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AccountNavButton } from "@/app/components/AccountNavButton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, CheckCircle, PlayCircle, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { getModules } from "@/lib/config/curriculum"
import { useXp } from "@/hooks/use-xp"
import { useProgress } from "@/hooks/use-progress"
import { Star } from "lucide-react"
import { XpService } from "@/lib/services/xp-service"
import { useAuth } from "@/components/auth/AuthProvider"
import { LessonProgressService } from "@/lib/services/lesson-progress-service"

export default function ModulesPage() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { xp } = useXp()
  const { user, isEmailVerified } = useAuth()
  const { progressData, isProgressLoading } = useProgress()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate authentication status
  const isAuthenticated = user && isEmailVerified

  const modules = getModules().map((module, index) => {
    // Get module completion info using fast methods (no API calls)
    const moduleCompletionInfo = isAuthenticated ? 
      LessonProgressService.getModuleCompletionInfoFast(module.id, progressData) :
      { isCompleted: false, completionPercentage: 0, durationMs: null, durationFormatted: null }

    // Determine button text and style based on completion status
    let buttonText = "Start Module"
    let buttonIcon = <PlayCircle className="mr-2 h-4 w-4" />
    let buttonClass = "w-full bg-accent hover:bg-accent/90 text-white font-semibold py-3 rounded-lg transition-colors"

    if (moduleCompletionInfo.isCompleted) {
      buttonText = "Module Complete"
      buttonIcon = <CheckCircle className="mr-2 h-4 w-4" />
      buttonClass = "w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
    } else if (moduleCompletionInfo.completionPercentage > 0) {
      buttonText = "Continue Module"
      buttonIcon = <PlayCircle className="mr-2 h-4 w-4" />
      buttonClass = "w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
    }

    return {
      id: index + 1,
      moduleId: module.id,
      title: module.title,
      description: module.description,
      emoji: module.emoji,
      href: module.available ? `/modules/${module.id}` : "#",
      available: module.available,
      completionInfo: moduleCompletionInfo,
      buttonText,
      buttonIcon,
      buttonClass
    }
  })

  if (!mounted) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
            Home
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
              <span className="text-sm font-medium">{XpService.formatXp(xp)}</span>
            </div>
            {!user && (
              <Link href="/pricing">
                <Button variant="ghost" size="sm" className="hover:bg-primary/10 whitespace-nowrap">
                  Pricing + FAQ
                </Button>
              </Link>
            )}
            <AccountNavButton />
          </div>
        </div>
      </header>

      <main className="flex-1 bg-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Page Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-primary mb-4">
              Choose Your Module
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Start your Persian learning journey with structured lessons
            </p>
          </div>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {modules.map((module) => (
              <Card 
                key={module.id} 
                className={`relative transition-all duration-300 hover:shadow-lg border-2 bg-white ${
                  module.available 
                    ? 'hover:border-accent/50 hover:scale-105' 
                    : 'opacity-60 border-gray-200'
                }`}
              >
                <CardHeader className="pb-4">
                  <CardTitle className="text-center">
                    <div className="text-4xl sm:text-5xl mb-3">{module.emoji}</div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                      {module.title}
                    </h3>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm sm:text-base text-gray-600 mb-4 text-center min-h-[60px] sm:min-h-[80px] flex items-center justify-center">
                    {module.description}
                  </p>

                  {/* Progress Information for Authenticated Users */}
                  {isAuthenticated && !isProgressLoading && module.available && (
                    <div className="mb-4 space-y-2">
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            module.completionInfo.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${module.completionInfo.completionPercentage}%` }}
                        ></div>
                      </div>
                      
                      {/* Progress Text */}
                      <div className="flex justify-between items-center text-xs text-gray-600">
                        <span>{module.completionInfo.completionPercentage}% complete</span>
                        {module.completionInfo.durationFormatted && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{module.completionInfo.durationFormatted}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="w-full">
                    {module.available ? (
                      <Link href={module.href} className="block">
                        <Button className={module.buttonClass}>
                          {module.buttonIcon}
                          {module.buttonText}
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        className="w-full bg-gray-100 text-gray-500 cursor-not-allowed font-semibold py-3 rounded-lg"
                        disabled
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        Coming Soon
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Progress Indicator */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">Module 1 Available</span>
              <div className="w-3 h-3 rounded-full bg-gray-300 ml-2"></div>
              <span className="text-sm text-gray-400">More modules coming soon</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500 text-center sm:text-left">
              © 2025 Iranopedia. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                Home
              </Link>
              <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-700">
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 