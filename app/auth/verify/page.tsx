"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CheckCircle2, XCircle, Loader2, Mail, Sparkles, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import { AuthModal } from '@/components/auth/AuthModal'

type VerificationStatus = 
  | 'welcome'           // Post-signup, no token - HAPPY STATE
  | 'processing'        // Processing verification link
  | 'success'           // Successfully verified
  | 'already_verified'  // User already verified
  | 'expired'           // Link expired - SPECIFIC ERROR
  | 'invalid'           // Invalid link - SPECIFIC ERROR
  | 'no_user'           // No user context, show signup modal

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isEmailVerified, resendVerification } = useAuth()
  
  const [status, setStatus] = useState<VerificationStatus>('processing')
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [isResending, setIsResending] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    const determineVerificationState = async () => {
      // Get URL parameters
      const token = searchParams.get('token')
      const type = searchParams.get('type')
      
      // CASE 1: User already verified - redirect them
      if (user && isEmailVerified) {
        setStatus('already_verified')
        return
      }

      // CASE 2: No token in URL - this is a post-signup welcome OR direct visit
      if (!token) {
        if (user && !isEmailVerified) {
          // Post-signup: User exists but not verified = WELCOME STATE
          setStatus('welcome')
          setUserEmail(user.email || '')
          return
        } else {
          // Direct visit: No user context = show signup modal
          setStatus('no_user')
          return
        }
      }

      // CASE 3: Token exists - processing verification link
      setStatus('processing')
      
      if (type !== 'signup') {
        setError('Invalid verification link type')
        setStatus('invalid')
        return
      }

      try {
        // Attempt verification
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        })

        if (error) {
          console.error('Verification error:', error)
          
          // Check for specific error types
          if (error.message.includes('expired') || error.message.includes('invalid_token')) {
            setStatus('expired')
          } else {
            setError(error.message || 'Verification failed')
            setStatus('invalid')
          }
          return
        }

        if (data.user) {
          setStatus('success')
          setUserEmail(data.user.email || '')
          
          // Redirect to lessons after celebration
          setTimeout(() => {
            router.push('/modules')
          }, 3000)
        } else {
          setError('Verification failed - no user returned')
          setStatus('invalid')
        }
      } catch (error) {
        console.error('Verification error:', error)
        setError('An unexpected error occurred')
        setStatus('invalid')
      }
    }

    determineVerificationState()
  }, [searchParams, user, isEmailVerified, router])

  const handleResendVerification = async () => {
    if (!userEmail) return
    
    setIsResending(true)
    setError(null)

    try {
      const { error } = await resendVerification(userEmail)
      if (error) {
        setError(error)
      } else {
        // Show brief success message
        setError('New verification email sent! Check your inbox.')
        setTimeout(() => setError(null), 4000)
      }
    } catch (error) {
      setError('Failed to resend verification email')
    } finally {
      setIsResending(false)
    }
  }

  const handleGoToLessons = () => {
    router.push('/modules')
  }

  const handleReturnToHome = () => {
    router.push('/')
  }

  const handleSignInAgain = () => {
    setShowAuthModal(true)
  }

  // CASE: No user context - show signup modal
  if (status === 'no_user') {
    return (
      <>
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">
                Email Verification
              </CardTitle>
              <CardDescription>
                Sign up to verify your email and start learning Persian
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <Mail className="h-12 w-12 text-primary" />
              </div>
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  You need to sign up first to verify your email address.
                </p>
                <Button onClick={handleSignInAgain} className="w-full">
                  Sign Up / Sign In
                </Button>
                <Button onClick={handleReturnToHome} variant="outline" className="w-full">
                  Return to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false)
            // Refresh to re-evaluate state
            window.location.reload()
          }}
        />
      </>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {status === 'welcome' && 'Welcome to Iranopedia Persian Academy!'}
            {status === 'processing' && 'Verifying Your Email'}
            {status === 'success' && 'Email Verified!'}
            {status === 'already_verified' && 'Welcome Back!'}
            {status === 'expired' && 'Link Expired'}
            {status === 'invalid' && 'Invalid Link'}
          </CardTitle>
          <CardDescription>
            {status === 'welcome' && `We've sent a verification email to ${userEmail}`}
            {status === 'processing' && 'Please wait while we verify your email address...'}
            {status === 'success' && 'Your email has been successfully verified. Welcome to Persian learning!'}
            {status === 'already_verified' && 'Your email is already verified. You have full access to all lessons!'}
            {status === 'expired' && 'No worries — just sign in again and we\'ll send you a fresh one!'}
            {status === 'invalid' && 'There was a problem with this verification link.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Icons */}
          <div className="flex justify-center">
            {status === 'welcome' && (
              <div className="text-4xl">🎉</div>
            )}
            {status === 'processing' && (
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            )}
            {status === 'success' && (
              <div className="flex items-center gap-2">
                <Sparkles className="h-8 w-8 text-yellow-500" />
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <Sparkles className="h-8 w-8 text-yellow-500" />
              </div>
            )}
            {status === 'already_verified' && (
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            )}
            {status === 'expired' && (
              <RefreshCw className="h-12 w-12 text-orange-500" />
            )}
            {status === 'invalid' && (
              <XCircle className="h-12 w-12 text-red-500" />
            )}
          </div>

          {/* Welcome State - Happy post-signup */}
          {status === 'welcome' && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Please check your inbox and click the link to confirm your account.
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Didn't receive it?</p>
                    <p className="text-blue-700">Check your spam folder or click below to resend.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  variant="outline"
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Resend verification email'
                  )}
                </Button>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-green-900">Once you verify</p>
                    <p className="text-green-700">You'll be automatically redirected into the app!</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className="text-4xl mb-2">🎉</div>
              <p className="text-sm text-muted-foreground">
                Welcome to Persian learning! Redirecting to lessons in 3 seconds...
              </p>
              <Button onClick={handleGoToLessons} className="w-full">
                Start Learning Now
              </Button>
            </div>
          )}

          {/* Already Verified */}
          {status === 'already_verified' && (
            <div className="text-center space-y-4">
              <Button onClick={handleGoToLessons} className="w-full">
                Continue Learning
              </Button>
            </div>
          )}

          {/* Expired Link */}
          {status === 'expired' && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  This verification link has expired, but that's totally normal!
                </p>
              </div>
              <Button onClick={handleSignInAgain} className="w-full">
                Sign in again for a fresh link
              </Button>
              <Button onClick={handleReturnToHome} variant="outline" className="w-full">
                Return to Home
              </Button>
            </div>
          )}

          {/* Invalid Link */}
          {status === 'invalid' && (
            <div className="space-y-4">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3 text-center">
                  {error}
                </div>
              )}
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  This verification link appears to be invalid or corrupted.
                </p>
              </div>
              <Button onClick={handleSignInAgain} className="w-full">
                Sign in for a new link
              </Button>
              <Button onClick={handleReturnToHome} variant="outline" className="w-full">
                Return to Home
              </Button>
            </div>
          )}

          {/* Processing State */}
          {status === 'processing' && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                This may take a few moments...
              </p>
            </div>
          )}

          {/* Resend Success/Error Messages */}
          {error && (status === 'welcome') && (
            <div className={`text-sm text-center p-3 rounded-md ${
              error.includes('sent') 
                ? 'text-green-600 bg-green-50 border border-green-200' 
                : 'text-red-600 bg-red-50 border border-red-200'
            }`}>
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auth Modal for expired/invalid cases */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false)
          // Refresh to re-evaluate state after new signup/signin
          window.location.reload()
        }}
      />
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
} 