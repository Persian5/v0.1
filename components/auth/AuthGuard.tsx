"use client"

import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { AuthModal } from './AuthModal'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireEmailVerification?: boolean
  fallback?: React.ReactNode
  onAuthRequired?: () => void
}

export function AuthGuard({ 
  children, 
  requireAuth = true,
  requireEmailVerification = true,
  fallback,
  onAuthRequired 
}: AuthGuardProps) {
  const { user, isLoading, isEmailVerified } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [shouldShowContent, setShouldShowContent] = useState(false)
  const [userClosedModal, setUserClosedModal] = useState(false)

  useEffect(() => {
    if (isLoading) {
      setShouldShowContent(false)
      return
    }

    if (!requireAuth) {
      setShouldShowContent(true)
      return
    }

    if (!user) {
      // User not authenticated
      if (!userClosedModal) {
        // Show auth modal if user hasn't closed it
        setShowAuthModal(true)
        onAuthRequired?.()
      }
      setShouldShowContent(false)
      return
    }

    if (requireEmailVerification && !isEmailVerified) {
      // User authenticated but email not verified
      if (!userClosedModal) {
        // Show auth modal if user hasn't closed it
        setShowAuthModal(true)
      }
      setShouldShowContent(false)
      return
    }

    // User is properly authenticated and verified
    setShouldShowContent(true)
    setShowAuthModal(false)
    setUserClosedModal(false) // Reset the flag when user is properly authenticated
  }, [user, isLoading, isEmailVerified, requireAuth, requireEmailVerification, onAuthRequired, userClosedModal])

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    setUserClosedModal(false)
    setShouldShowContent(true)
  }

  const handleModalClose = () => {
    // User manually closed the modal - they can browse freely but can't access protected content
    setShowAuthModal(false)
    setUserClosedModal(true)
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show auth modal if authentication is required and user hasn't closed it
  if (showAuthModal && !userClosedModal) {
    return (
      <>
        {/* Show fallback content behind modal if provided */}
        {fallback && (
          <div className="opacity-50 pointer-events-none">
            {fallback}
          </div>
        )}
        <AuthModal
          isOpen={showAuthModal}
          onClose={handleModalClose}
          onSuccess={handleAuthSuccess}
          title="Sign up to continue learning Persian"
          description="Join thousands learning to reconnect with their roots"
        />
      </>
    )
  }

  // Show content if user is properly authenticated (or auth not required)
  if (shouldShowContent) {
    return <>{children}</>
  }

  // Show fallback content if available (for when user closed modal but isn't authenticated)
  if (fallback) {
    return <>{fallback}</>
  }

  // Default fallback for when user closed modal and no fallback provided
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Authentication Required</h2>
        <p className="text-muted-foreground">Please sign in to access this content.</p>
        <button 
          onClick={() => {
            setUserClosedModal(false)
            setShowAuthModal(true)
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Sign In
        </button>
      </div>
    </div>
  )
} 