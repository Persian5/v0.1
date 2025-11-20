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
import { verificationLog } from '@/lib/utils/verification-logger'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  title?: string
  description?: string
  // PHASE 2: Verification params for email link flow
  initialMode?: AuthMode
  verificationToken?: string
  verificationType?: string
}

type AuthMode = 'signin' | 'signup' | 'verify' | 'success' | 'forgot_password'

export function AuthModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  title = "Sign up to continue learning Persian",
  description = "Join thousands learning to reconnect with their roots",
  initialMode,
  verificationToken,
  verificationType
}: AuthModalProps) {
  const router = useRouter()
  const { signIn, signUp, resendVerification, sendPasswordReset, user, isEmailVerified } = useAuth() // Added sendPasswordReset
  
  const [mode, setMode] = useState<AuthMode>(initialMode || 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isResendingVerification, setIsResendingVerification] = useState(false)
  const [passwordValid, setPasswordValid] = useState(false)
  const [passwordsMatch, setPasswordsMatch] = useState(true)
  
  // PHASE 2: Store verification params for Phase 3 usage
  const [storedVerificationToken, setStoredVerificationToken] = useState<string | undefined>(verificationToken)
  const [storedVerificationType, setStoredVerificationType] = useState<string | undefined>(verificationType)
  
  // PHASE 3: Track verification state
  const [isVerifying, setIsVerifying] = useState(false)

  // Auto-switch to verify mode if user exists but email not verified
  useEffect(() => {
    if (user && !isEmailVerified) {
      setMode('verify')
      setEmail(user.email || '')
    }
  }, [user, isEmailVerified])

  // PHASE 3: Auto-verify with token when available
  useEffect(() => {
    // Only run if in verify mode with token and type
    if (mode !== 'verify') return
    if (!storedVerificationToken || !storedVerificationType) return
    if (isVerifying) return // Prevent duplicate calls
    
    verificationLog('Auto-verifying email with token')
    verifyEmail()
  }, [mode, storedVerificationToken, storedVerificationType])

  // PHASE 3: Token-based email verification
  const verifyEmail = async () => {
    if (!storedVerificationToken || !storedVerificationType) {
      verificationLog('Cannot verify: missing token or type')
      return
    }
    
    setIsVerifying(true)
    setIsLoading(true)
    setError(null)
    
    verificationLog('Calling supabase.auth.verifyOtp', {
      type: storedVerificationType,
      token: storedVerificationToken.substring(0, 10) + '...'
    })
    
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: storedVerificationToken,
        type: storedVerificationType as any
      })
      
      if (verifyError) {
        verificationLog('Verification failed:', verifyError)
        
        // Handle specific error cases
        const errorMsg = verifyError.message?.toLowerCase() || ''
        
        if (errorMsg.includes('expired') || errorMsg.includes('token has expired')) {
          setError('This link has expired. Please request a new one.')
        } else if (errorMsg.includes('invalid') || errorMsg.includes('token not found')) {
          setError('Invalid verification link. Try resending the verification email.')
        } else if (errorMsg.includes('already') || errorMsg.includes('email already confirmed')) {
          // Already verified - treat as success
          verificationLog('Email already verified')
          await handleVerificationSuccess()
          return
        } else {
          setError('Verification failed. Please try again or request a new link.')
        }
        
        setIsVerifying(false)
        setIsLoading(false)
        // Clear stored token so user can retry with resend
        setStoredVerificationToken(undefined)
        setStoredVerificationType(undefined)
        return
      }
      
      // Success!
      verificationLog('Verification successful:', data)
      await handleVerificationSuccess()
      
    } catch (error: any) {
      verificationLog('Verification error:', error)
      setError('An unexpected error occurred. Please try again.')
      setIsVerifying(false)
      setIsLoading(false)
      setStoredVerificationToken(undefined)
      setStoredVerificationType(undefined)
    }
  }
  
  // PHASE 3: Handle successful verification
  const handleVerificationSuccess = async () => {
    verificationLog('Verification success - refreshing session')
    
    try {
      // Refresh auth session to get latest user state
      const { SmartAuthService } = await import('@/lib/services/smart-auth-service')
      await SmartAuthService.refreshSession()
      
      // Wait briefly for context to propagate
      await new Promise(resolve => setTimeout(resolve, 400))
      
      // Clear verification state
      setStoredVerificationToken(undefined)
      setStoredVerificationType(undefined)
      setIsVerifying(false)
      setIsLoading(false)
      
      // Switch to success mode briefly
      setMode('success')
      
      // Close modal and trigger success callback
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1500)
      
    } catch (error) {
      verificationLog('Failed to refresh session after verification:', error)
      // Still close modal even if refresh fails
      setIsVerifying(false)
      setIsLoading(false)
      onSuccess?.()
      onClose()
    }
  }

  // PHASE 3: Fallback polling for manual verification (when no token provided)
  // This is for users who sign up normally and need to click email link separately
  useEffect(() => {
    // Only poll if:
    // 1. In verify mode
    // 2. No token-based verification in progress
    // 3. User exists but not verified
    if (mode !== 'verify') return
    if (storedVerificationToken) return // Token-based verification active
    if (!user || isEmailVerified) return
    if (!isOpen) return
    
    verificationLog('Starting polling for manual verification')
    
    const pollInterval = setInterval(async () => {
      try {
        // Force refresh session from server (not cached)
        const { data: { session }, error } = await supabase.auth.refreshSession()
        
        if (error) {
          verificationLog('Error refreshing session during polling:', error)
          return
        }
        
        if (session?.user?.email_confirmed_at) {
          verificationLog('Email verified via polling')
          clearInterval(pollInterval)
          await handleVerificationSuccess()
        }
      } catch (error) {
        verificationLog('Error polling for email verification:', error)
      }
    }, 5000) // Poll every 5 seconds

    return () => {
      verificationLog('Stopping polling')
      clearInterval(pollInterval)
    }
  }, [mode, storedVerificationToken, user, isEmailVerified, isOpen, onSuccess, onClose])

  // Freeze background scroll when modal open
  useModalScrollLock(isOpen)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isProcessing) {
      return
    }
    
    setIsProcessing(true)
    setError(null)
    
    const normalizedEmail = email.trim().toLowerCase()
    
    // ✅ SECURITY: Client-side validation (UX only - server still validates)
    if (mode === 'signup') {
      // Validate all required fields
      if (!firstName.trim()) {
        setError('First name is required')
        setIsLoading(false)
        setIsProcessing(false)
        return
      }
      if (!lastName.trim()) {
        setError('Last name is required')
        setIsLoading(false)
        setIsProcessing(false)
        return
      }
      if (!normalizedEmail) {
        setError('Email is required')
        setIsLoading(false)
        setIsProcessing(false)
        return
      }
      if (!password) {
        setError('Password is required')
        setIsLoading(false)
        setIsProcessing(false)
        return
      }
      if (!confirmPassword) {
        setError('Please confirm your password')
        setIsLoading(false)
        setIsProcessing(false)
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        setIsLoading(false)
        setIsProcessing(false)
        return
      }
      if (!passwordValid) {
        setError('Password must be at least 6 characters and include a number')
        setIsLoading(false)
        setIsProcessing(false)
        return
      }
    } else if (mode === 'signin') {
      if (!normalizedEmail) {
        setError('Email is required')
        setIsLoading(false)
        setIsProcessing(false)
        return
      }
      if (!password) {
        setError('Password is required')
        setIsLoading(false)
        setIsProcessing(false)
        return
      }
    }
    
    setIsLoading(true)

    try {
      if (mode === 'signup') {
        // ✅ SECURITY: Only send password to server, NEVER send confirmPassword
        const { error } = await signUp(normalizedEmail, password, firstName, lastName)
        if (error) {
          // CRITICAL: Detect duplicate account errors
          const errorLower = error.toLowerCase()
          if (errorLower.includes('user already registered') ||
              errorLower.includes('email address already in use') ||
              errorLower.includes('duplicate key value') ||
              errorLower.includes('already exists')) {
            setError('This email is already registered. Please sign in instead.')
            // Auto-switch to signin mode after 3 seconds
            setTimeout(() => {
              setEmail(normalizedEmail) // Keep email filled
              setPassword('') // Clear password
              setConfirmPassword('')
              setFirstName('')
              setLastName('')
              switchMode('signin')
            }, 3000)
          } else if (errorLower.includes('too many requests') ||
              errorLower.includes('rate limit') ||
              errorLower.includes('429') ||
              errorLower.includes('exceeded')) {
            setError('Too many attempts. Please wait a minute before trying again.')
          } else {
            setError(error)
          }
        } else {
          // 2.6: Signup success state
          setError(null)
          // Clear confirmPassword from memory after successful signup
          setConfirmPassword('')
          // Keep user in modal and switch to verify mode instead of redirecting
          setMode('verify')
          // Don't close modal - keep them in the verification flow
        }
      } else if (mode === 'signin') {
        const { error } = await signIn(normalizedEmail, password)
        if (error) {
          // 2.4: Sign-in error specificity
          const errorLower = error.toLowerCase()
          if (errorLower.includes('invalid login') || errorLower.includes('invalid credentials')) {
            setError('Incorrect email or password. Please check both and try again.')
          } else if (errorLower.includes('email not confirmed') || errorLower.includes('not verified')) {
            setError('Please verify your email first. Check your inbox for the verification link.')
            setTimeout(() => {
              setMode('verify')
            }, 2000)
          } else if (errorLower.includes('rate limit') || errorLower.includes('429')) {
            setError('Too many sign-in attempts. Please wait a minute.')
          } else if (errorLower.includes('too many requests') ||
              errorLower.includes('rate limit') ||
              errorLower.includes('429')) {
            setError('Too many sign-in attempts. Please wait a minute before trying again.')
          } else {
            setError('Incorrect email or password. Please try again.')
          }
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
    } catch (error: any) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('Network error. Please check your internet connection and try again.')
      } else if (error.message?.includes('rate limit') || error.message?.includes('429') || error.message?.includes('too many requests')) {
        setError('Too many attempts. Please wait a minute before trying again.')
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
      setIsProcessing(false)
    }
  }

  const handleResendVerification = async () => {
    if (isProcessing || isResendingVerification) {
      return
    }

    setIsProcessing(true)
    setIsResendingVerification(true)
    setError(null)
    setResendSuccess(false)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      const { error } = await resendVerification(normalizedEmail)
      if (error) {
        setError(error)
        setResendSuccess(false)
      } else {
        setResendSuccess(true)
        setError(null)
        // Show success message briefly
        setTimeout(() => setResendSuccess(false), 5000)
      }
    } catch (error) {
      setError('Failed to resend verification email')
      setResendSuccess(false)
    } finally {
      setIsResendingVerification(false)
      setIsProcessing(false)
    }
  }

  const handleForgotPassword = async () => {
    if (isProcessing) return
    
    setIsProcessing(true)
    setError(null)
    
    const normalizedEmail = email.trim().toLowerCase()
    
    if (!normalizedEmail) {
      setError('Please enter your email address')
      setIsProcessing(false)
      return
    }
    
    try {
      const { error } = await sendPasswordReset(normalizedEmail)
      if (error) {
        const errorLower = error.toLowerCase()
        if (errorLower.includes('rate limit') || errorLower.includes('too many requests')) {
           setError('Too many attempts. Please wait a minute.')
        } else {
           setError(error)
        }
      } else {
        setError(null)
        // Show success message
        setResendSuccess(true) // Reuse this state for success banner
        setTimeout(() => {
           setResendSuccess(false)
           switchMode('signin')
        }, 5000)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsProcessing(false)
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
              {mode === 'verify' && (isVerifying ? 'Verifying your email...' : 'Check your email')}
              {mode === 'success' && 'Welcome to Persian Learning!'}
              {mode === 'forgot_password' && 'Reset Password'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {mode === 'signup' && description}
              {mode === 'signin' && 'Sign in to continue your Persian learning journey'}
              {mode === 'verify' && (isVerifying ? 'Please wait while we confirm your account.' : 'We sent you a verification link. Please check your email and click the link to continue.')}
              {mode === 'success' && 'Your account is ready. Starting your lesson...'}
              {mode === 'forgot_password' && "Enter your email and we'll send you a link to reset your password."}
            </DialogDescription>
          </DialogHeader>

        {mode === 'verify' && (
          <div className="space-y-4">
            {/* PHASE 3: Show verification progress when token is present */}
            {isVerifying ? (
              <>
                <div className="flex justify-center">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                </div>
                <div className="text-center space-y-2">
                  <p className="font-medium">Verifying your email...</p>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we confirm your account.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-center">
                  <Mail className="h-12 w-12 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Verification email sent to:
                  </p>
                  <p className="font-medium break-words px-4 text-sm sm:text-base">
                    {email.length > 40 ? (
                      <span title={email} className="truncate block">
                        {email.substring(0, 40)}...
                      </span>
                    ) : (
                      email
                    )}
                  </p>
                  {!storedVerificationToken && (
                    <>
                      <p className="text-xs text-muted-foreground mt-2">
                        We'll automatically detect when you verify your email...
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        💡 Didn't receive it? Check your spam folder or try resending.
                      </p>
                    </>
                  )}
                </div>
                
                {resendSuccess && (
                  <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-2 text-center">
                    ✅ Verification email resent! Check your inbox.
                  </div>
                )}

                {/* PHASE 3: Only show resend button when not verifying and no token */}
                {!isVerifying && !storedVerificationToken && (
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
                )}
                
                {/* PHASE 3: Show resend button after verification fails */}
                {!isVerifying && storedVerificationToken === undefined && error && (
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
                        'Request new verification link'
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
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

        {mode === 'forgot_password' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isProcessing || resendSuccess}
              />
            </div>
            
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                {error}
              </div>
            )}
            
            {resendSuccess && (
              <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-3">
                ✅ Password reset link sent! Check your email.
              </div>
            )}

            <Button 
              type="button" 
              className="w-full" 
              onClick={handleForgotPassword}
              disabled={isProcessing || !email || resendSuccess}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => switchMode('signin')}
              disabled={isProcessing}
            >
              Back to Sign In
            </Button>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot_password')}
                    className="text-xs text-primary hover:underline"
                    tabIndex={-1}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
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
                isLoading || isProcessing ||
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