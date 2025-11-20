"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase/client'

function ResetPasswordContent() {
  const router = useRouter()
  const { user, changePassword } = useAuth()
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [passwordValid, setPasswordValid] = useState(false)
  const [passwordsMatch, setPasswordsMatch] = useState(true)

  // Check if we have a session (recovery link should log user in)
  useEffect(() => {
    const checkSession = async () => {
      // Small delay to allow session to establish from hash/code
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        // No session found - link might be invalid or expired
        // But we don't want to flash error immediately if it's just loading
        // Let's wait a bit longer or check if there's an error in URL
        const params = new URLSearchParams(window.location.search)
        const errorDescription = params.get('error_description')
        if (errorDescription) {
          setError(errorDescription)
        }
      }
    }
    checkSession()
  }, [])

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/

  const handlePasswordChange = (value: string) => {
    setNewPassword(value)
    setPasswordValid(passwordRegex.test(value))
    if (confirmPassword) {
      setPasswordsMatch(value === confirmPassword)
    }
  }

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
    setPasswordsMatch(newPassword === value)
    if (newPassword === value && error === 'Passwords do not match') {
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!passwordValid) {
      setError('Password must be at least 6 characters and include a number')
      return
    }
    
    if (!passwordsMatch) {
      setError('Passwords do not match')
      return
    }

    if (!user) {
      setError('Session expired or invalid link. Please request a new password reset.')
      return
    }
    
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      
      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        // Redirect after delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold">Password Reset!</CardTitle>
            <CardDescription>
              Your password has been successfully updated. Redirecting you to the dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <KeyRound className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
          <CardDescription>
            Please enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              {confirmPassword.length > 0 && (
                <p 
                  className={`text-xs ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}
                >
                  {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>

            {/* Password requirements */}
            {newPassword.length > 0 && (
              <p className={`text-xs ${passwordValid ? 'text-green-600' : 'text-red-600'}`}>
                Password must be at least 6 characters and include a number.
              </p>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !passwordValid || !passwordsMatch}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
