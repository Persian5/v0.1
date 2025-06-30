"use client"

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'

type VerificationStatus = 'loading' | 'success' | 'error' | 'already_verified'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isEmailVerified } = useAuth()
  
  const [status, setStatus] = useState<VerificationStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleEmailVerification = async () => {
      // Check if user is already verified
      if (user && isEmailVerified) {
        setStatus('already_verified')
        return
      }

      // Get the token from URL
      const token = searchParams.get('token')
      const type = searchParams.get('type')

      if (!token || type !== 'signup') {
        setError('Invalid verification link')
        setStatus('error')
        return
      }

      try {
        // Verify the email with Supabase
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        })

        if (error) {
          console.error('Verification error:', error)
          setError(error.message || 'Verification failed')
          setStatus('error')
          return
        }

        if (data.user) {
          setStatus('success')
          
          // Redirect to lessons after a delay
          setTimeout(() => {
            router.push('/modules')
          }, 3000)
        } else {
          setError('Verification failed')
          setStatus('error')
        }
      } catch (error) {
        console.error('Verification error:', error)
        setError('An unexpected error occurred')
        setStatus('error')
      }
    }

    handleEmailVerification()
  }, [searchParams, user, isEmailVerified, router])

  const handleReturnToHome = () => {
    router.push('/')
  }

  const handleGoToLessons = () => {
    router.push('/modules')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'Verifying Your Email'}
            {status === 'success' && 'Email Verified!'}
            {status === 'already_verified' && 'Already Verified'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we verify your email address...'}
            {status === 'success' && 'Your email has been successfully verified. You can now access all lessons!'}
            {status === 'already_verified' && 'Your email is already verified. You have full access to the platform.'}
            {status === 'error' && 'There was a problem verifying your email address.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            {status === 'loading' && (
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            )}
            {status === 'already_verified' && (
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            )}
            {status === 'error' && (
              <XCircle className="h-12 w-12 text-red-500" />
            )}
          </div>

          {status === 'success' && (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Welcome to Persian learning! Redirecting to lessons in 3 seconds...
              </p>
              <Button onClick={handleGoToLessons} className="w-full">
                Start Learning Now
              </Button>
            </div>
          )}

          {status === 'already_verified' && (
            <div className="text-center space-y-4">
              <Button onClick={handleGoToLessons} className="w-full">
                Continue Learning
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3 text-center">
                  {error}
                </div>
              )}
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Verification link may be expired or invalid.
                </p>
                <div className="flex flex-col gap-2">
                  <Button onClick={handleReturnToHome} variant="outline">
                    Return to Home
                  </Button>
                  <Button 
                    onClick={() => router.push('/modules')}
                    variant="ghost"
                    size="sm"
                  >
                    Try signing in again
                  </Button>
                </div>
              </div>
            </div>
          )}

          {status === 'loading' && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                This may take a few moments...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
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