"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, Eye, EyeOff, X } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase/client'
import WidgetErrorBoundary from '@/components/errors/WidgetErrorBoundary'
import { useModalScrollLock } from '@/hooks/use-modal-scroll-lock'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  title?: string
  description?: string
}

type AuthMode = 'signin' | 'signup' | 'verify' | 'success'

export function AuthModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  title = "Sign up to continue learning Persian",
  description = "Join thousands learning to reconnect with their roots"
}: AuthModalProps) {
  const router = useRouter()
  const { signIn, signUp, resendVerification, user, isEmailVerified } = useAuth()
  
  const [mode, setMode] = useState<AuthMode>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isResendingVerification, setIsResendingVerification] = useState(false)
  const [passwordValid, setPasswordValid] = useState(false)
  const [passwordsMatch, setPasswordsMatch] = useState(true)

  // Auto-switch to verify mode if user exists but email not verified
  useEffect(() => {
    if (user && !isEmailVerified) {
      setMode('verify')
      setEmail(user.email || '')
    }
  }, [user, isEmailVerified])

  // Auto-poll for email verification when in verify mode (every 3 seconds)
  useEffect(() => {
    if (mode === 'verify' && user && !isEmailVerified && isOpen) {
      const pollInterval = setInterval(async () => {
        try {
          // Refresh session to check if email was verified
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session?.user?.email_confirmed_at) {
            // Email verified! Switch to success mode
            setMode('success')
            clearInterval(pollInterval)
            
            // Refresh the page to ensure auth context picks up the verified session
            // This ensures all components get the updated auth state
            setTimeout(() => {
              window.location.reload()
            }, 1500)
          }
        } catch (error) {
          console.error('Error polling for email verification:', error)
        }
      }, 3000) // Poll every 3 seconds

      return () => clearInterval(pollInterval)
    }
  }, [mode, user, isEmailVerified, isOpen])

  // Freeze background scroll when modal open
  useModalScrollLock(isOpen)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // ✅ SECURITY: Client-side validation (UX only - server still validates)
    if (mode === 'signup') {
      // Validate all required fields
      if (!firstName.trim()) {
        setError('First name is required')
        setIsLoading(false)
        return
      }
      if (!lastName.trim()) {
        setError('Last name is required')
        setIsLoading(false)
        return
      }
      if (!email.trim()) {
        setError('Email is required')
        setIsLoading(false)
        return
      }
      if (!password) {
        setError('Password is required')
        setIsLoading(false)
        return
      }
      if (!confirmPassword) {
        setError('Please confirm your password')
        setIsLoading(false)
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        setIsLoading(false)
        return
      }
      if (!passwordValid) {
        setError('Password must be at least 6 characters and include a number')
        setIsLoading(false)
        return
      }
    } else if (mode === 'signin') {
      if (!email.trim()) {
        setError('Email is required')
        setIsLoading(false)
        return
      }
      if (!password) {
        setError('Password is required')
        setIsLoading(false)
        return
      }
    }
    
    setIsLoading(true)

    try {
      if (mode === 'signup') {
        // ✅ SECURITY: Only send password to server, NEVER send confirmPassword
        const { error } = await signUp(email, password, firstName, lastName)
        if (error) {
          setError(error)
        } else {
          // Clear confirmPassword from memory after successful signup
          setConfirmPassword('')
          // Keep user in modal and switch to verify mode instead of redirecting
          setMode('verify')
          // Don't close modal - keep them in the verification flow
        }
      } else if (mode === 'signin') {
        const { error } = await signIn(email, password)
        if (error) {
          setError('Incorrect email or password. Please try again.')
        } else {
          // Fetch fresh user to inspect email_confirmed_at once after sign-in
          const { data: fresh } = await supabase.auth.getUser();
          const verified = !!fresh.user?.email_confirmed_at;

          if (verified) {
            setMode('success')
            setTimeout(() => {
              onSuccess?.()
              onClose()
            }, 1500)
          } else {
            // Keep user in modal and switch to verify mode
            setMode('verify')
            // Don't close modal - let them handle verification within modal
          }
        }
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setIsResendingVerification(true)
    setError(null)

    try {
      const { error } = await resendVerification(email)
      if (error) {
        setError(error)
      } else {
        setError(null)
        // Show success message briefly
        setTimeout(() => setError(null), 3000)
      }
    } catch (error) {
      setError('Failed to resend verification email')
    } finally {
      setIsResendingVerification(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setFirstName('')
    setLastName('')
    setError(null)
    setShowPassword(false)
    setShowConfirmPassword(false)
    setPasswordValid(false)
    setPasswordsMatch(true)
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setError(null)
  }

  const handleClose = () => {
    // Allow users to close modal and continue browsing freely
    onClose()
  }

  // Password strength check
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    setPasswordValid(passwordRegex.test(value))
    // Check if passwords match when password changes
    if (confirmPassword) {
      setPasswordsMatch(value === confirmPassword)
    }
  }

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
    // Check if passwords match
    setPasswordsMatch(password === value)
    // Clear error if passwords now match
    if (password === value && error === 'Passwords do not match') {
      setError(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-background via-primary/5 to-background border-primary/20">
        <WidgetErrorBoundary>
          {/* X Button in top right */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>

          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">
              {mode === 'signup' && title}
              {mode === 'signin' && 'Welcome back!'}
              {mode === 'verify' && 'Check your email'}
              {mode === 'success' && 'Welcome to Persian Learning!'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {mode === 'signup' && description}
              {mode === 'signin' && 'Sign in to continue your Persian learning journey'}
              {mode === 'verify' && 'We sent you a verification link. Please check your email and click the link to continue.'}
              {mode === 'success' && 'Your account is ready. Starting your lesson...'}
            </DialogDescription>
          </DialogHeader>

        {mode === 'verify' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Mail className="h-12 w-12 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Verification email sent to:
              </p>
              <p className="font-medium">{email}</p>
              <p className="text-xs text-muted-foreground mt-2">
                We'll automatically detect when you verify your email...
              </p>
            </div>
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleResendVerification}
                disabled={isResendingVerification}
              >
                {isResendingVerification ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend verification email'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm"
                onClick={() => {
                  resetForm()
                  switchMode('signup')
                }}
              >
                Try a different email
              </Button>
            </div>
          </div>
        )}

        {mode === 'success' && (
          <div className="text-center space-y-4">
            <div className="text-4xl">🎉</div>
            <p className="text-sm text-muted-foreground">
              Redirecting to your lesson...
            </p>
          </div>
        )}

        {(mode === 'signup' || mode === 'signin') && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                  aria-describedby={mode === 'signup' ? 'password-requirements' : undefined}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Confirm Password Field - Only for Signup */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                    required
                    disabled={isLoading}
                    aria-invalid={!passwordsMatch && confirmPassword.length > 0}
                    aria-describedby={confirmPassword.length > 0 ? 'password-match-status' : undefined}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {/* Password match status */}
                {confirmPassword.length > 0 && (
                  <p 
                    id="password-match-status"
                    className={`text-xs ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}
                    role="status"
                    aria-live="polite"
                  >
                    {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>
            )}

            {/* Password strength validation message */}
            {mode === 'signup' && password.length > 0 && (
              <p 
                id="password-requirements"
                className={`text-xs ${passwordValid ? 'text-green-600' : 'text-red-600'}`}
              >
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
              disabled={
                isLoading || 
                (mode === 'signup' && (!passwordValid || !passwordsMatch || !confirmPassword))
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'signup' ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                mode === 'signup' ? 'Create account' : 'Sign in'
              )}
            </Button>

            <div className="text-center text-sm">
              {mode === 'signup' ? (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="text-primary hover:underline font-medium"
                    onClick={() => {
                      resetForm()
                      switchMode('signin')
                    }}
                    disabled={isLoading}
                  >
                    Sign in
                  </button>
                </p>
              ) : (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    className="text-primary hover:underline font-medium"
                    onClick={() => {
                      resetForm()
                      switchMode('signup')
                    }}
                    disabled={isLoading}
                  >
                    Sign up
                  </button>
                </p>
              )}
            </div>
          </form>
        )}
        </WidgetErrorBoundary>
      </DialogContent>
    </Dialog>
  )
} 