"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, User, Trophy, Target, Loader2, RotateCcw, AlertTriangle, Check } from "lucide-react"
import { useXp } from "@/hooks/use-xp"
import { XpService } from "@/lib/services/xp-service"
import { LessonProgressService } from "@/lib/services/lesson-progress-service"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"
import { AuthGuard } from "@/components/auth/AuthGuard"

function AccountContent() {
  const [mounted, setMounted] = useState(false)
  const [showResetConfirmation, setShowResetConfirmation] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completedLessons, setCompletedLessons] = useState(0)
  const { xp, resetXp } = useXp()
  const { user, signOut, changePassword } = useAuth()
  const router = useRouter()
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load completed lessons count
  useEffect(() => {
    const loadStats = async () => {
      if (!mounted) return
      
      try {
        const count = await LessonProgressService.getCompletedLessonCount()
        setCompletedLessons(count)
      } catch (error) {
        console.error('Failed to load lesson stats:', error)
      }
    }

    loadStats()
  }, [mounted, resetSuccess]) // Reload after successful reset

  // Get next lesson for continue learning button
  const getNextLesson = async () => {
    return await LessonProgressService.getFirstAvailableLesson();
  }

  const handleContinueLearning = async () => {
    try {
      const nextLesson = await getNextLesson();
      router.push(`/modules/${nextLesson.moduleId}/${nextLesson.lessonId}`);
    } catch (error) {
      console.error('Failed to get next lesson:', error);
      router.push('/modules');
    }
  }

  // Handle reset progress confirmation
  const handleResetProgress = () => {
    setShowResetConfirmation(true)
  }

  // Execute reset - clear all progress
  const executeReset = () => {
    setIsResetting(true)
    
    const performReset = async () => {
      try {
        // Reset progress using the new Supabase service
        await LessonProgressService.resetAllProgress()
        
        // Reset local XP display to 0 immediately
        resetXp()
        
        // Show success message
        setResetSuccess(true)
        setShowResetConfirmation(false)
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setResetSuccess(false)
        }, 3000)
        
      } catch (error) {
        console.error('Error resetting progress:', error)
        setError('Failed to reset progress. Please try again.')
      } finally {
        setIsResetting(false)
      }
    }

    performReset()
  }

  // Cancel reset
  const cancelReset = () => {
    setShowResetConfirmation(false)
  }

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    if (!user?.email) return
    setPwLoading(true)
    const { error } = await changePassword(user.email, currentPassword, newPassword)
    setPwLoading(false)
    if (error) {
      setPwError(error)
    } else {
      setPwError(null)
      setPwSuccess(true)
      setShowPasswordForm(false)
      setTimeout(() => setPwSuccess(false), 3000)
    }
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
      {/* Reset Confirmation Modal */}
      {showResetConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Are you sure?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                This will permanently delete all your progress including:
              </p>
              <ul className="text-sm text-muted-foreground mb-6 space-y-1">
                <li>• All XP points</li>
                <li>• Lesson completion progress</li>
                <li>• Vocabulary learning progress</li>
                <li>• Phrases learned and practice data</li>
                <li>• Performance tracking data</li>
              </ul>
              <p className="text-sm font-medium text-red-600 mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={cancelReset}
                  className="flex-1"
                  disabled={isResetting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={executeReset}
                  className="flex-1"
                  disabled={isResetting}
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Progress"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Success Message */}
      {resetSuccess && (
        <div className="fixed top-4 right-4 z-50">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-800">
                <Check className="h-4 w-4" />
                <span className="font-medium">Progress reset successfully!</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                      {completedLessons}
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

          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Quick Actions */}
            <Card className="hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <Link href="/modules" className="w-full">
                    <Button className="w-full bg-accent hover:bg-accent/90 text-white transition-all duration-200 hover:scale-105 py-3 text-base">
                      Browse Modules
                    </Button>
                  </Link>
                  <Button 
                    onClick={handleContinueLearning}
                    variant="outline" 
                    className="w-full transition-all duration-200 hover:scale-105 py-3 text-base hover:bg-primary/10"
                  >
                    Continue Learning
                  </Button>
                  <Link href="/pricing" className="w-full">
                    <Button variant="outline" className="w-full transition-all duration-200 hover:scale-105 py-3 text-base hover:bg-primary/10">
                      FAQ
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Reset Progress Card */}
            <Card className="hover:shadow-md transition-shadow duration-300 border-red-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2 text-red-600">
                  <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
                  Reset Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  Clear all your learning progress and start fresh. This will reset your XP, lesson progress, and vocabulary tracking.
                </p>
                <Button 
                  onClick={handleResetProgress}
                  variant="destructive" 
                  className="w-full transition-all duration-200 hover:scale-105 py-3 text-base"
                  disabled={isResetting}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset All Progress
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Security Section */}
          <Card className="mt-10 hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Change Password toggle */}
              {showPasswordForm ? (
                <div className="space-y-4 max-w-sm">
                  <input type="password" placeholder="Current password" id="current-pw" className="w-full border p-2 rounded" />
                  <input type="password" placeholder="New password" id="new-pw" className="w-full border p-2 rounded" />
                  {pwError && <p className="text-red-600 text-sm">{pwError}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="w-full" onClick={() => setShowPasswordForm(false)}>Cancel</Button>
                    <Button size="sm" className="w-full" onClick={() => handleChangePassword((document.getElementById('current-pw') as HTMLInputElement).value, (document.getElementById('new-pw') as HTMLInputElement).value)} disabled={pwLoading}>{pwLoading ? 'Saving...' : 'Save'}</Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setShowPasswordForm(true)}>Change Password</Button>
              )}

              <div className="mt-6">
                <Button variant="destructive" size="sm" className="w-full" onClick={async () => { await signOut(); router.push('/') }}>
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default function AccountPage() {
  return (
    <AuthGuard requireAuth={true} requireEmailVerification={true}>
      <AccountContent />
    </AuthGuard>
  )
} 