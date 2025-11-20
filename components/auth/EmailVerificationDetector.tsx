"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthModal } from './AuthModal'
import { useAuth } from './AuthProvider'

/**
 * PHASE 2: Email Verification Detector
 * 
 * Detects when user clicks verification link from email.
 * Expected URL format: /?verify=true&type=signup&token=XXXXX
 * 
 * Responsibilities:
 * 1. Read URL query params on client
 * 2. Open AuthModal in 'verify' mode when params exist
 * 3. Pass token & type to AuthModal for Phase 3 verification
 * 4. Clean up URL params after detection
 */
export function EmailVerificationDetector() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isEmailVerified } = useAuth()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [verificationToken, setVerificationToken] = useState<string | undefined>(undefined)
  const [verificationType, setVerificationType] = useState<string | undefined>(undefined)
  
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return
    
    // Read query params
    const verify = searchParams.get('verify')
    const token = searchParams.get('token')
    const type = searchParams.get('type')
    
    // PHASE 2: Detect verification params
    const hasVerificationParams = verify === 'true' && token && type
    
    if (!hasVerificationParams) {
      // No verification params - do nothing
      return
    }
    
    // PHASE 2: Don't open modal if user is already verified
    if (user && isEmailVerified) {
      console.log('[EmailVerificationDetector] User already verified, skipping modal')
      // Clean up URL
      const cleanUrl = window.location.pathname
      router.replace(cleanUrl)
      return
    }
    
    console.log('[EmailVerificationDetector] Verification params detected:', {
      verify,
      token: token.substring(0, 10) + '...',
      type
    })
    
    // PHASE 2: Store params and open modal
    setVerificationToken(token)
    setVerificationType(type)
    setIsModalOpen(true)
    
    // Clean up URL params (remove query string)
    const cleanUrl = window.location.pathname
    router.replace(cleanUrl)
  }, [searchParams, user, isEmailVerified, router])
  
  const handleModalClose = () => {
    setIsModalOpen(false)
    setVerificationToken(undefined)
    setVerificationType(undefined)
  }
  
  const handleVerificationSuccess = () => {
    setIsModalOpen(false)
    setVerificationToken(undefined)
    setVerificationType(undefined)
    // Redirect to modules after successful verification
    router.push('/modules')
  }
  
  // Only render modal if we have verification params
  if (!isModalOpen) {
    return null
  }
  
  return (
    <AuthModal
      isOpen={isModalOpen}
      onClose={handleModalClose}
      onSuccess={handleVerificationSuccess}
      initialMode="verify"
      verificationToken={verificationToken}
      verificationType={verificationType}
      title="Verify your email"
      description="We're verifying your email address..."
    />
  )
}

