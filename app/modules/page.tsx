"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, CheckCircle, PlayCircle, Clock, Crown, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { getModules } from "@/lib/config/curriculum"
import { useXp } from "@/hooks/use-xp"
import { useProgress } from "@/hooks/use-progress"
import { useAuth } from "@/components/auth/AuthProvider"
import { usePremium } from "@/hooks/use-premium"
import { SmartAuthService } from "@/lib/services/smart-auth-service"
import { LessonProgressService } from "@/lib/services/lesson-progress-service"
import { PremiumLockModal } from "@/components/PremiumLockModal"
import type { Module } from "@/lib/types"

interface ModuleAccessStatus {
  canAccess: boolean
  requiresPremium: boolean
  hasPremium: boolean
  prerequisitesComplete: boolean
  showPremiumBadge: boolean
  showCompletionLock: boolean
}

interface ModuleWithAccessStatus extends Module {
  accessStatus: ModuleAccessStatus
}

export default function ModulesPage() {
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [selectedModuleTitle, setSelectedModuleTitle] = useState<string>("")
  const router = useRouter()
  const { xp } = useXp()
  const { user, isEmailVerified, isLoading: authLoading } = useAuth()
  const { hasPremium, isLoading: premiumLoading } = usePremium()
  const { progressData, isProgressLoading } = useProgress()

  // OPTIMISTIC RENDERING: Read cached progress immediately if available
  const cachedProgress = SmartAuthService.getUserProgress()
  const effectiveProgressData = progressData.length > 0 ? progressData : cachedProgress

  // Calculate authentication status
  const isAuthenticated = user && isEmailVerified

  // Check if data is loaded (auth + premium ready)
  // CRITICAL: Wait for cache to be initialized before rendering to prevent flash
  // Check if SmartAuthService cache is ready (not initializing)
  const cacheState = SmartAuthService.getSessionState()
  const cacheReady = cacheState.isReady
  
  // CRITICAL: If authenticated and premiumLoading is false, verify cache actually has premium data
  // This prevents rendering with false premium status before cache is populated on first load
  // On first load: premiumLoading becomes false immediately (reads from empty cache)
  // But cache hasn't finished initializing yet, so hasPremium is wrong
  const premiumDataReady = !isAuthenticated || premiumLoading || (cacheReady && user) // If authenticated, wait for cache to be ready
  
  // If authenticated, wait for progress data (cached or fresh) to prevent flash
  const hasProgressData = effectiveProgressData.length > 0
  const progressReady = !isProgressLoading || hasProgressData
  
  // Render only when: cache ready AND premium data ready AND (not authenticated OR progress ready)
  const isLoaded = cacheReady && !authLoading && premiumDataReady && (!isAuthenticated || progressReady)

  // Handler for premium module click
  const handlePremiumClick = (moduleTitle: string) => {
    setSelectedModuleTitle(moduleTitle)
    setShowPremiumModal(true)
  }

  // Handler for module navigation
  const handleModuleClick = (moduleData: any, e: React.MouseEvent) => {
    // If module shows premium badge, open modal instead of navigating
    if (moduleData.accessStatus.showPremiumBadge) {
      e.preventDefault()
      handlePremiumClick(moduleData.title)
      return
    }

    // If module shows completion lock, prevent navigation
    if (moduleData.accessStatus.showCompletionLock) {
      e.preventDefault()
      return
    }

    // Otherwise, allow normal navigation (will be handled by Link component)
  }

  const modules = getModules().map((module, index) => {
    // Compute access status client-side using cached data
    const requiresPremium = module.requiresPremium ?? false
    const prerequisitesComplete = isAuthenticated ? 
      LessonProgressService.isModuleCompletedFast(index > 0 ? getModules()[index - 1].id : 'module1', effectiveProgressData) :
      true // Non-authenticated users see everything as "accessible" (will be gated on click)
    
    const showPremiumBadge = requiresPremium && !hasPremium
    const showCompletionLock = !showPremiumBadge && !prerequisitesComplete && index > 0
    const canAccess = (!requiresPremium || hasPremium) && prerequisitesComplete

    const accessStatus: ModuleAccessStatus = {
      canAccess,
      requiresPremium,
      hasPremium,
      prerequisitesComplete,
      showPremiumBadge,
      showCompletionLock
    }
    
    // Get module completion info using fast methods (no API calls) - use cached data
    const moduleCompletionInfo = isAuthenticated ? 
      LessonProgressService.getModuleCompletionInfoFast(module.id, effectiveProgressData) :
      { isCompleted: false, completionPercentage: 0, durationMs: null, durationFormatted: null }

    // Determine button text and style based on access and completion status
    let buttonText = "Start Module"
    let buttonIcon = <PlayCircle className="mr-2 h-4 w-4" />
    let buttonClass = "w-full bg-accent hover:bg-accent/90 text-white font-semibold py-3 rounded-lg transition-colors"

    // Premium badge state (free user, requires premium)
    if (showPremiumBadge) {
      buttonText = "Unlock Premium"
      buttonIcon = <Crown className="mr-2 h-4 w-4" />
      buttonClass = "w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3 rounded-lg transition-colors"
    }
    // Completion lock state (paid user, prerequisites incomplete)
    else if (showCompletionLock) {
      buttonText = "Complete Previous Modules"
      buttonIcon = <AlertCircle className="mr-2 h-4 w-4" />
      buttonClass = "w-full bg-gray-300 text-gray-600 cursor-not-allowed font-semibold py-3 rounded-lg"
    }
    // Normal access states
    else if (moduleCompletionInfo.isCompleted) {
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
      accessStatus,
      buttonText,
      buttonIcon,
      buttonClass
    }
  })

  // OPTIMISTIC RENDERING: Show skeleton only if data not loaded yet
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <main className="flex-1 bg-primary/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="text-center mb-8 sm:mb-12">
              <div className="h-12 bg-gray-200 rounded w-64 mx-auto mb-4 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-white">
                  <CardHeader className="pb-4">
                    <div className="h-16 bg-gray-200 rounded mb-3 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-20 bg-gray-200 rounded mb-4 animate-pulse"></div>
                    <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
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
                  {isAuthenticated && module.available && (
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
                      module.accessStatus?.showPremiumBadge || module.accessStatus?.showCompletionLock ? (
                        <Button 
                          className={module.buttonClass}
                          onClick={(e) => handleModuleClick(module, e)}
                          disabled={module.accessStatus?.showCompletionLock}
                        >
                          {module.buttonIcon}
                          {module.buttonText}
                        </Button>
                      ) : (
                        <Link href={module.href} className="block">
                          <Button className={module.buttonClass}>
                            {module.buttonIcon}
                            {module.buttonText}
                          </Button>
                        </Link>
                      )
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

      {/* Premium Lock Modal */}
      <PremiumLockModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        moduleTitle={selectedModuleTitle}
      />
    </div>
  )
} 