"use client"

export const dynamic = 'force-dynamic'

import { useState, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Lock, CheckCircle, PlayCircle, Crown, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { getModules } from "@/lib/config/curriculum"
import { useSmartXp } from "@/hooks/use-smart-xp"
import { useProgress } from "@/hooks/use-progress"
import { useAuth } from "@/components/auth/AuthProvider"
import { usePremium } from "@/hooks/use-premium"
import { SmartAuthService } from "@/lib/services/smart-auth-service"
import { LessonProgressService } from "@/lib/services/lesson-progress-service"
import { PremiumLockModal } from "@/components/PremiumLockModal"
import type { Module } from "@/lib/types"
import { ModuleSnakePath } from "@/app/components/modules/ModuleSnakePath"

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
  const { xp } = useSmartXp()
  const { user, isEmailVerified, isLoading: authLoading } = useAuth()
  const { hasPremium: hookHasPremium, isLoading: premiumLoading } = usePremium()
  const { progressData, isProgressLoading } = useProgress()

  // OPTIMISTIC RENDERING: Read cached data directly from cache (synchronous, no race condition)
  const cachedProfile = SmartAuthService.getCachedProfile()
  const cachedProgress = SmartAuthService.getUserProgress()
  const cachedHasPremium = SmartAuthService.getHasPremium()
  const cacheState = SmartAuthService.getSessionState()
  const effectiveProgressData = progressData.length > 0 ? progressData : cachedProgress

  // Calculate authentication status
  const isAuthenticated = user && isEmailVerified

  // CRITICAL: Read premium status directly from cache to avoid race condition
  // usePremium() hook has async state updates, causing component to render with stale value
  // Reading directly from cache ensures we get the correct value synchronously
  // CRITICAL FIX: If user exists, ONLY use cache value - never hook fallback
  // On refresh, user exists but cache doesn't yet - if we use hook, hasPremium is wrong
  // If user exists but cache doesn't, hasPremium will be wrong, but we won't render (skeleton shows)
  // Once cache loads, hasPremium will be correct and we'll render
  const hasPremium = cachedProfile ? cachedHasPremium : (user ? false : hookHasPremium)

  // Check if data is loaded (auth + premium ready)
  // CRITICAL: On refresh, if user exists, cache MUST exist before rendering
  // Problem: On refresh, user exists but cache doesn't yet, causing wrong hasPremium
  // Solution: If user exists, wait for cache to exist AND initialization complete
  const hasUser = !!user
  const cacheExists = !!cachedProfile
  const initializationComplete = cacheState.isReady // false when isInitializing = true
  
  // CRITICAL: If user exists, cache MUST exist AND hasPremium must be confirmed before rendering
  // This prevents showing wrong state when cache exists but hasPremium hasn't been set yet
  // getHasPremium() returns false if cache doesn't exist, but also returns false if user doesn't have premium
  // So we need to ensure cache exists AND initialization is complete (which sets hasPremium)
  const hasPremiumConfirmed = cachedProfile ? (cachedHasPremium !== undefined) : true // If cache exists, hasPremium must be set
  const cacheReady = !hasUser || (cacheExists && initializationComplete && hasPremiumConfirmed && !premiumLoading)
  
  // If authenticated, wait for progress data (cached or fresh) to prevent flash
  const hasProgressData = effectiveProgressData.length > 0
  const progressReady = !isProgressLoading || hasProgressData
  
  // Render only when: auth ready AND premium ready AND cache ready AND (not authenticated OR progress ready)
  // CRITICAL: If user exists but cache doesn't, DON'T render (show skeleton)
  const isLoaded = !authLoading && !premiumLoading && cacheReady && (!isAuthenticated || progressReady)

  // Handler for premium module click
  const handlePremiumClick = (moduleTitle: string) => {
    setSelectedModuleTitle(moduleTitle)
    setShowPremiumModal(true)
  }

  // Handler for module navigation
  const handleModuleClick = (moduleData: any, e: React.MouseEvent) => {
    e.preventDefault()
    
    // If module shows premium badge, open modal instead of navigating
    if (moduleData.accessStatus.showPremiumBadge) {
      handlePremiumClick(moduleData.title)
      return
    }

    // If module shows completion lock, prevent navigation
    if (moduleData.accessStatus.showCompletionLock) {
      return
    }

    // Navigate to the module page
    if (moduleData.href && moduleData.href !== "#") {
      router.push(moduleData.href)
    }
  }

  // CRITICAL: Only calculate modules when data is loaded to prevent wrong hasPremium calculation
  // On refresh, hasPremium might be wrong until cache loads, causing wrong button states
  const modules = useMemo(() => {
    if (!isLoaded) return [] // Don't calculate if not loaded (prevents wrong hasPremium)
    
    return getModules().map((module, index) => {
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
    let buttonClass = "w-full bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#1E7B57] font-semibold py-3 rounded-lg transition-colors"
    let uiState: 'locked' | 'completed' | 'current' | 'available' = 'available'

    // Premium badge state (free user, requires premium)
    if (showPremiumBadge) {
      buttonText = "Unlock Premium"
      buttonIcon = <Crown className="mr-2 h-4 w-4" />
      buttonClass = "w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3 rounded-lg transition-colors"
      uiState = 'locked'
    }
    // Completion lock state (paid user, prerequisites incomplete)
    else if (showCompletionLock) {
      buttonText = "Complete Previous Modules"
      buttonIcon = <AlertCircle className="mr-2 h-4 w-4" />
      buttonClass = "w-full bg-gray-300 text-gray-600 cursor-not-allowed font-semibold py-3 rounded-lg"
      uiState = 'locked'
    }
    
    // Generate prerequisite message
    let prerequisiteMessage: string | undefined
    if (showCompletionLock && index > 0) {
      const previousModule = getModules()[index - 1]
      prerequisiteMessage = `Complete Module ${index} first`
    }
    // Normal access states
    else if (moduleCompletionInfo.isCompleted) {
      buttonText = "Module Complete"
      buttonIcon = <CheckCircle className="mr-2 h-4 w-4" />
      buttonClass = "w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
      uiState = 'completed'
    } else if (moduleCompletionInfo.completionPercentage > 0) {
      buttonText = "Continue Module"
      buttonIcon = <PlayCircle className="mr-2 h-4 w-4" />
      buttonClass = "w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
      uiState = 'current' // In-progress modules are "current"
    } else {
      uiState = 'available' // New modules are "available"
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
      buttonClass,
      uiState,
      lessonCount: module.lessons.length,
      prerequisiteMessage
    }
    })
  }, [isLoaded, hasPremium, isAuthenticated, effectiveProgressData])

  const highlightModule = useMemo(() => {
    const inProgress = modules.find(module => module.uiState === 'current')
    if (inProgress) return inProgress
    return modules.find(module => module.uiState === 'available') || null
  }, [modules])

  // Calculate progress based on lessons, not modules
  // Must be called before any conditional returns (React hooks rule)
  const totalLessons = useMemo(() => {
    return getModules().reduce((sum, module) => sum + module.lessons.length, 0)
  }, [])
  
  const completedLessons = useMemo(() => {
    if (!isAuthenticated) return 0
    // Count unique completed lessons from progress data
    const completedSet = new Set<string>()
    effectiveProgressData.forEach((p) => {
      const isCompleted = 
        !!p.completed_at || 
        p.progress_percent === 100 || 
        p.status === 'completed'
      if (isCompleted) {
        completedSet.add(`${p.module_id}-${p.lesson_id}`)
      }
    })
    return completedSet.size
  }, [isAuthenticated, effectiveProgressData])
  
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  // OPTIMISTIC RENDERING: Show skeleton only if data not loaded yet
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F5FAF5]">
        <main className="flex-1">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
            <div className="text-center space-y-3">
              <div className="h-4 w-32 bg-slate-200 rounded-full mx-auto animate-pulse" />
              <div className="h-10 w-60 bg-slate-200 rounded-full mx-auto animate-pulse" />
              <div className="h-4 w-72 bg-slate-200 rounded-full mx-auto animate-pulse" />
            </div>
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-pulse h-40" />
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F5FAF5]">
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-2 md:px-4 lg:px-8 py-6 sm:py-8 space-y-8">
          {/* Page Header - Compact */}
          <div className="text-center space-y-1">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1E7B57]">
              Choose Your Module
            </h1>
            
            {/* Overall Progress Bar - Compact */}
            <div className="max-w-md mx-auto mt-3 px-4">
              <div className="flex justify-between text-xs font-medium text-neutral-600 mb-1">
                <span>Overall Progress</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#4AB88A] transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Snake Path Layout */}
          <section className="py-2">
            <ModuleSnakePath 
              modules={modules} 
              onModuleClick={handleModuleClick} 
            />
          </section>
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
