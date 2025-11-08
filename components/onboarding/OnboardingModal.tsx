"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Sparkles, User, Target, BookOpen, Zap, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'
import { OnboardingService, OnboardingData } from '@/lib/services/onboarding-service'
import { SmartAuthService } from '@/lib/services/smart-auth-service'
import { generateDefaultDisplayName } from '@/lib/utils/display-name'
import { validateDisplayName } from '@/lib/utils/display-name'
import { useAuth } from '@/components/auth/AuthProvider'
import { useModalScrollLock } from '@/hooks/use-modal-scroll-lock'
import WidgetErrorBoundary from '@/components/errors/WidgetErrorBoundary'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
}

type OnboardingStep = 
  | 'welcome'
  | 'display_name'
  | 'learning_goal'
  | 'current_level'
  | 'primary_focus'
  | 'quick_tour'
  | 'completion'

const TOTAL_STEPS = 7

export function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form data state
  const [displayName, setDisplayName] = useState<string>('')
  const [learningGoal, setLearningGoal] = useState<OnboardingData['learning_goal'] | null>(null)
  const [currentLevel, setCurrentLevel] = useState<OnboardingData['current_level'] | null>(null)
  const [primaryFocus, setPrimaryFocus] = useState<OnboardingData['primary_focus'] | null>(null)
  
  // Freeze background scroll
  useModalScrollLock(isOpen)

  // Initialize form data from cached profile when modal opens
  useEffect(() => {
    if (isOpen && user) {
      const profile = SmartAuthService.getCachedProfile()
      if (profile) {
        // Pre-fill display name with default if not set
        if (!displayName && !profile.display_name) {
          const defaultName = generateDefaultDisplayName(
            profile.first_name,
            profile.last_name
          )
          if (defaultName) {
            setDisplayName(defaultName)
          }
        } else if (profile.display_name) {
          setDisplayName(profile.display_name)
        }
        
        // Pre-fill other fields if they exist
        if (profile.learning_goal) setLearningGoal(profile.learning_goal as OnboardingData['learning_goal'])
        if (profile.current_level) setCurrentLevel(profile.current_level as OnboardingData['current_level'])
        if (profile.primary_focus) setPrimaryFocus(profile.primary_focus as OnboardingData['primary_focus'])
      }
    }
  }, [isOpen, user])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('welcome')
      setError(null)
      setIsLoading(false)
      setIsSaving(false)
    }
  }, [isOpen])

  // Incremental save helper (saves data as user progresses)
  const saveStepData = async (stepData: Partial<OnboardingData>): Promise<boolean> => {
    if (!user?.id) return false

    setIsSaving(true)
    setError(null)

    try {
      const result = await OnboardingService.saveOnboardingData(user.id, stepData)
      if (result.error) {
        setError(result.error)
        setIsSaving(false)
        return false
      }
      setIsSaving(false)
      return true
    } catch (err) {
      setError('Failed to save. Please try again.')
      setIsSaving(false)
      return false
    }
  }

  // Complete onboarding (final step)
  const handleComplete = async () => {
    if (!user?.id || !learningGoal) {
      setError('Please complete all required fields')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const onboardingData: OnboardingData = {
        display_name: displayName.trim() || null,
        learning_goal: learningGoal,
        current_level: currentLevel || null,
        primary_focus: primaryFocus || null
      }

      const result = await OnboardingService.completeOnboarding(user.id, onboardingData)
      
      if (result.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      // Success! Close modal and call onComplete
      setIsLoading(false)
      onComplete?.()
      onClose()
    } catch (err) {
      setError('Failed to complete onboarding. Please try again.')
      setIsLoading(false)
    }
  }

  // Navigation helpers
  const goToNextStep = () => {
    const stepOrder: OnboardingStep[] = [
      'welcome',
      'display_name',
      'learning_goal',
      'current_level',
      'primary_focus',
      'quick_tour',
      'completion'
    ]
    const currentIndex = stepOrder.indexOf(currentStep)
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1])
      setError(null)
    }
  }

  const goToPreviousStep = () => {
    const stepOrder: OnboardingStep[] = [
      'welcome',
      'display_name',
      'learning_goal',
      'current_level',
      'primary_focus',
      'quick_tour',
      'completion'
    ]
    const currentIndex = stepOrder.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1])
      setError(null)
    }
  }

  const getStepNumber = (): number => {
    const stepOrder: OnboardingStep[] = [
      'welcome',
      'display_name',
      'learning_goal',
      'current_level',
      'primary_focus',
      'quick_tour',
      'completion'
    ]
    return stepOrder.indexOf(currentStep) + 1
  }

  // Progress dots component
  const ProgressDots = () => {
    const currentStepNum = getStepNumber()
    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => {
          const stepNum = index + 1
          const isActive = stepNum === currentStepNum
          const isCompleted = stepNum < currentStepNum
          
          return (
            <div
              key={stepNum}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                isActive
                  ? 'bg-primary w-8'
                  : isCompleted
                  ? 'bg-primary/50'
                  : 'bg-muted'
              }`}
            />
          )
        })}
      </div>
    )
  }

  // Step 1: Welcome
  const renderWelcomeStep = () => (
    <div className="space-y-6 text-center">
      <div className="text-6xl mb-4">👋</div>
      <DialogTitle className="text-2xl font-bold">
        Welcome to Persian Learning!
      </DialogTitle>
      <DialogDescription className="text-base">
        Let's get you set up in 30 seconds
      </DialogDescription>
      <Button
        onClick={goToNextStep}
        className="w-full bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 text-white font-semibold py-6 text-lg"
      >
        Let's go
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  )

  // Step 2: Display Name
  const renderDisplayNameStep = () => {
    const handleContinue = async () => {
      if (displayName.trim()) {
        const validation = validateDisplayName(displayName.trim())
        if (!validation.valid) {
          setError(validation.error || 'Invalid display name')
          return
        }
        await saveStepData({ display_name: displayName.trim() })
      }
      goToNextStep()
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <User className="h-12 w-12 text-primary mx-auto mb-4" />
          <DialogTitle className="text-xl font-bold">
            How should we display your name?
          </DialogTitle>
          <DialogDescription className="mt-2">
            This is how you'll appear on leaderboards
          </DialogDescription>
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            type="text"
            placeholder="Enter your display name"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value)
              setError(null)
            }}
            maxLength={50}
            disabled={isSaving}
          />
          <p className="text-xs text-muted-foreground">
            If left empty, this will be used on the leaderboard. Choose a unique display name.
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
            className="flex-1"
            disabled={isSaving}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            variant="ghost"
            onClick={goToNextStep}
            className="flex-1"
            disabled={isSaving}
          >
            Skip
          </Button>
          <Button
            onClick={handleContinue}
            className="flex-1"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // Step 3: Learning Goal (Required)
  const renderLearningGoalStep = () => {
    const goals: Array<{ value: OnboardingData['learning_goal']; label: string; emoji: string }> = [
      { value: 'heritage', label: 'Reconnect with my heritage', emoji: '🏛️' },
      { value: 'travel', label: 'Travel to Iran', emoji: '✈️' },
      { value: 'family', label: 'Speak with family/friends', emoji: '👨‍👩‍👧‍👦' },
      { value: 'academic', label: 'Academic or career', emoji: '🎓' },
      { value: 'fun', label: 'Just for fun', emoji: '🎉' }
    ]

    const handleContinue = async () => {
      if (!learningGoal) {
        setError('Please select a learning goal')
        return
      }
      await saveStepData({ learning_goal: learningGoal })
      goToNextStep()
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <Target className="h-12 w-12 text-primary mx-auto mb-4" />
          <DialogTitle className="text-xl font-bold">
            Why are you learning Persian?
          </DialogTitle>
          <DialogDescription className="mt-2">
            This helps us personalize your experience
          </DialogDescription>
        </div>

        <div className="space-y-3">
          {goals.map((goal) => {
            const isSelected = learningGoal === goal.value
            return (
              <button
                key={goal.value}
                type="button"
                onClick={() => {
                  setLearningGoal(goal.value)
                  setError(null)
                }}
                disabled={isSaving}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-gray-200 hover:border-primary/50 hover:bg-primary/5'
                } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{goal.emoji}</span>
                  <span className="font-medium">{goal.label}</span>
                  {isSelected && (
                    <CheckCircle2 className="ml-auto h-5 w-5 text-primary" />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
            className="flex-1"
            disabled={isSaving}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handleContinue}
            className="flex-1"
            disabled={!learningGoal || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // Step 4: Current Level (Optional)
  const renderCurrentLevelStep = () => {
    const levels: Array<{ value: OnboardingData['current_level']; label: string }> = [
      { value: 'beginner', label: 'Complete beginner' },
      { value: 'few_words', label: 'Know a few words' },
      { value: 'basic_conversation', label: 'Can have basic conversations' },
      { value: 'intermediate', label: 'Intermediate/Advanced' }
    ]

    const handleContinue = async () => {
      if (currentLevel) {
        await saveStepData({ current_level: currentLevel })
      }
      goToNextStep()
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
          <DialogTitle className="text-xl font-bold">
            What's your current level?
          </DialogTitle>
          <DialogDescription className="mt-2">
            This helps us personalize your lessons (optional)
          </DialogDescription>
        </div>

        <div className="space-y-3">
          {levels.map((level) => {
            const isSelected = currentLevel === level.value
            return (
              <button
                key={level.value}
                type="button"
                onClick={() => {
                  setCurrentLevel(level.value)
                  setError(null)
                }}
                disabled={isSaving}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-gray-200 hover:border-primary/50 hover:bg-primary/5'
                } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{level.label}</span>
                  {isSelected && (
                    <CheckCircle2 className="ml-auto h-5 w-5 text-primary" />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
            className="flex-1"
            disabled={isSaving}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            variant="ghost"
            onClick={goToNextStep}
            className="flex-1"
            disabled={isSaving}
          >
            Skip
          </Button>
          <Button
            onClick={handleContinue}
            className="flex-1"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // Step 5: Primary Focus (Optional)
  const renderPrimaryFocusStep = () => {
    const focuses: Array<{ value: OnboardingData['primary_focus']; label: string; emoji: string }> = [
      { value: 'speaking', label: 'Speaking & conversation', emoji: '🗣️' },
      { value: 'reading', label: 'Reading Persian script', emoji: '📖' },
      { value: 'writing', label: 'Writing Persian', emoji: '✍️' },
      { value: 'all', label: 'All of the above', emoji: '🌟' }
    ]

    const handleContinue = async () => {
      if (primaryFocus) {
        await saveStepData({ primary_focus: primaryFocus })
      }
      goToNextStep()
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
          <DialogTitle className="text-xl font-bold">
            What's most important to you?
          </DialogTitle>
          <DialogDescription className="mt-2">
            We're starting with speaking, but want to know what you'd like next
          </DialogDescription>
        </div>

        <div className="space-y-3">
          {focuses.map((focus) => {
            const isSelected = primaryFocus === focus.value
            return (
              <button
                key={focus.value}
                type="button"
                onClick={() => {
                  setPrimaryFocus(focus.value)
                  setError(null)
                }}
                disabled={isSaving}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-gray-200 hover:border-primary/50 hover:bg-primary/5'
                } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{focus.emoji}</span>
                  <span className="font-medium">{focus.label}</span>
                  {isSelected && (
                    <CheckCircle2 className="ml-auto h-5 w-5 text-primary" />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
            className="flex-1"
            disabled={isSaving}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            variant="ghost"
            onClick={goToNextStep}
            className="flex-1"
            disabled={isSaving}
          >
            Skip
          </Button>
          <Button
            onClick={handleContinue}
            className="flex-1"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // Step 6: Quick Tour (Optional)
  const renderQuickTourStep = () => (
    <div className="space-y-6 text-center">
      <div className="text-6xl mb-4">🎯</div>
      <DialogTitle className="text-xl font-bold">
        Want a quick tour?
      </DialogTitle>
      <DialogDescription className="text-base">
        We'll show you around (30 seconds)
      </DialogDescription>
      
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={goToPreviousStep}
          className="flex-1"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          variant="ghost"
          onClick={goToNextStep}
          className="flex-1"
        >
          Skip tour
        </Button>
        <Button
          onClick={goToNextStep}
          className="flex-1 bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 text-white font-semibold"
        >
          Show me around
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  // Step 7: Completion
  const renderCompletionStep = () => (
    <div className="space-y-6 text-center">
      <div className="text-6xl mb-4">🎉</div>
      <DialogTitle className="text-xl font-bold">
        You're all set!
      </DialogTitle>
      <DialogDescription className="text-base">
        Start exploring and learning Persian
      </DialogDescription>
      
      <Button
        onClick={handleComplete}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 text-white font-semibold py-6 text-lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            Get Started
            <Sparkles className="ml-2 h-5 w-5" />
          </>
        )}
      </Button>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}
    </div>
  )

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcomeStep()
      case 'display_name':
        return renderDisplayNameStep()
      case 'learning_goal':
        return renderLearningGoalStep()
      case 'current_level':
        return renderCurrentLevelStep()
      case 'primary_focus':
        return renderPrimaryFocusStep()
      case 'quick_tour':
        return renderQuickTourStep()
      case 'completion':
        return renderCompletionStep()
      default:
        return null
    }
  }

  if (!user) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Allow closing modal (user can go wherever they want)
      if (!open) {
        onClose()
      }
    }}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-background via-primary/5 to-background border-primary/20">
        <WidgetErrorBoundary>
          {/* Progress Dots - Outside DialogHeader for better layout */}
          <ProgressDots />
          
          <DialogHeader>
            {renderStep()}
          </DialogHeader>
        </WidgetErrorBoundary>
      </DialogContent>
    </Dialog>
  )
}

