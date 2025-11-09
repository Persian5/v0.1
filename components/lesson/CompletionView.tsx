"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Medal, Star, Sparkles, ArrowRight } from "lucide-react"
import { LessonProgressService } from "@/lib/services/lesson-progress-service"
import { useXp } from "@/hooks/use-xp"
import LessonHeader from "@/app/components/LessonHeader"
import { CountUpXP } from "@/app/components/CountUpXP"
import { getModule } from "@/lib/config/curriculum"
import { PremiumLockModal } from "@/components/PremiumLockModal"
import { getCachedModuleAccess, setCachedModuleAccess } from "@/lib/utils/module-access-cache"
import { SmartAuthService } from "@/lib/services/smart-auth-service"

interface CompletionViewProps {
  moduleId: string
  lessonId: string
  xpGained?: number
  resetLesson?: () => void
  handleViewSummary?: () => void
}

export default function CompletionView({ 
  moduleId,
  lessonId,
  xpGained,
  resetLesson,
  handleViewSummary
}: CompletionViewProps) {
  const router = useRouter()
  const { xp: totalXp } = useXp()
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [premiumModuleTitle, setPremiumModuleTitle] = useState<string | undefined>(undefined)
  
  const handleReset = () => {
    if (resetLesson) {
      resetLesson()
    } else {
      router.push(`/modules/${moduleId}/${lessonId}`)
    }
  }
  
  const navigateToSummary = () => {
    if (handleViewSummary) {
      handleViewSummary()
    } else {
      router.push(`/modules/${moduleId}/${lessonId}/summary`)
    }
  }

  const moduleData = getModule(moduleId)
  const lessonIndex = moduleData?.lessons.findIndex(l => l.id === lessonId)
  const isLastLessonInModule = moduleData && lessonIndex === moduleData.lessons.length - 1

  const navigateForward = async () => {
    try {
      if (isLastLessonInModule) {
        const nextModuleId = moduleId === "module1" ? "module2" : moduleId === "module2" ? "module3" : "module4"
        const nextModule = getModule(nextModuleId)
        
        if (nextModule?.requiresPremium) {
          const { user } = SmartAuthService.getSessionState()
          if (user) {
            try {
              const cachedAccess = getCachedModuleAccess(nextModuleId, user.id)
              let accessData
              
              if (cachedAccess) {
                accessData = cachedAccess
              } else {
                const accessResponse = await fetch(`/api/check-module-access?moduleId=${nextModuleId}`)
                if (accessResponse.ok) {
                  accessData = await accessResponse.json()
                  setCachedModuleAccess(nextModuleId, user.id, accessData)
                }
              }
              
              if (accessData && !accessData.canAccess && accessData.reason === 'no_premium') {
                setPremiumModuleTitle(nextModule.title)
                setShowPremiumModal(true)
                return
              }
            } catch (error) {
              console.error('Failed to check premium access:', error)
            }
          }
        }
        
        router.push(`/modules/${moduleId}/${lessonId}?view=module-completion`)
      } else {
        const nextLesson = await LessonProgressService.getNextSequentialLesson(moduleId, lessonId)
        
        const nextLessonModule = getModule(nextLesson.moduleId)
        if (nextLessonModule?.requiresPremium) {
          const { user } = SmartAuthService.getSessionState()
          if (user) {
            try {
              const cachedAccess = getCachedModuleAccess(nextLesson.moduleId, user.id)
              let accessData
              
              if (cachedAccess) {
                accessData = cachedAccess
              } else {
                const accessResponse = await fetch(`/api/check-module-access?moduleId=${nextLesson.moduleId}`)
                if (accessResponse.ok) {
                  accessData = await accessResponse.json()
                  setCachedModuleAccess(nextLesson.moduleId, user.id, accessData)
                }
              }
              
              if (accessData && !accessData.canAccess && accessData.reason === 'no_premium') {
                setPremiumModuleTitle(nextLessonModule.title)
                setShowPremiumModal(true)
                return
              }
            } catch (error) {
              console.error('Failed to check premium access:', error)
            }
          }
        }
        
        router.push(`/modules/${nextLesson.moduleId}/${nextLesson.lessonId}`)
      }
    } catch (error) {
      console.error('Failed to navigate:', error)
      router.push(`/modules/${moduleId}`)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LessonHeader moduleId={moduleId} />

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center animate-fade-in w-full sm:w-auto py-8">
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 blur-sm animate-pulse"></div>
            <div className="relative bg-amber-400 rounded-full p-4 flex justify-center items-center h-full">
              <Medal className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <h2 className="text-4xl font-bold mb-2 text-primary">
            INCREDIBLE JOB!
          </h2>
          
          <p className="text-xl text-muted-foreground mb-4">
            You mastered these essential greetings!
          </p>
          
          <div className="bg-accent/10 rounded-lg p-4 mb-6 flex justify-center items-center gap-3">
            <Star className="h-6 w-6 text-yellow-500" />
            <span className="text-2xl font-bold">
              <CountUpXP target={xpGained ?? totalXp} />
            </span>
            <Sparkles className="h-5 w-5 text-yellow-500" />
          </div>
          
          <p className="text-muted-foreground mb-8">
            You&apos;re making incredible progress! Keep going to become fluent in Persian!
          </p>
          
          <div className="space-y-4">
            <Button 
              className="w-full text-lg py-6" 
              onClick={navigateForward}
            >
              {isLastLessonInModule ? 'Next' : 'Next Lesson'}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={navigateToSummary}
            >
              View Summary <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </main>
      
      <PremiumLockModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        moduleTitle={premiumModuleTitle}
      />
    </div>
  )
}

