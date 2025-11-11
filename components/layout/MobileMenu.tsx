"use client"

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, BookOpen, RotateCcw, Trophy, Crown, Settings, LogOut, X } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { usePremium } from '@/hooks/use-premium'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  variant?: 'default' | 'minimal' | 'logged-out'
  onOpenAuthModal?: () => void
}

/**
 * Mobile navigation menu with slide-in drawer animation
 * Auto-closes on navigation or escape key
 */
export function MobileMenu({ isOpen, onClose, variant = 'default', onOpenAuthModal }: MobileMenuProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { hasPremium } = usePremium()

  const isLoggedIn = !!user

  console.log('🔄 MobileMenu RENDER')
  console.log('isOpen:', isOpen)
  console.log('variant:', variant)
  console.log('isLoggedIn:', isLoggedIn)

  // Close menu on route change
  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleNavigation = (path: string) => {
    router.push(path)
    onClose()
  }

  const handleSignOut = async () => {
    await signOut()
    onClose()
    router.push('/')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[60] md:hidden"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-[80%] max-w-sm bg-white z-[70] md:hidden overflow-y-auto shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:text-primary transition-colors rounded-lg hover:bg-gray-50"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Content */}
            <div className="flex flex-col p-4 gap-2">
              {/* Logged In Menu Items - Show for both default AND minimal variants */}
              {isLoggedIn && (variant === 'default' || variant === 'minimal') && (
                <>
                  <button
                    onClick={() => handleNavigation('/dashboard')}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <Home className="w-5 h-5" />
                    <span className="font-medium">Dashboard</span>
                  </button>

                  <button
                    onClick={() => handleNavigation('/modules')}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span className="font-medium">Learn</span>
                  </button>

                  <button
                    onClick={() => handleNavigation('/review')}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span className="font-medium">Review Mode</span>
                  </button>

                  <button
                    onClick={() => handleNavigation('/leaderboard')}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <Trophy className="w-5 h-5" />
                    <span className="font-medium">Leaderboard</span>
                  </button>

                  {/* Divider */}
                  <div className="my-2 h-px bg-gray-200" />

                  {/* Upgrade to Premium - Free Users Only */}
                  {!hasPremium && (
                    <button
                      onClick={() => handleNavigation('/pricing')}
                      className="flex items-center gap-3 px-4 py-3 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left font-medium"
                    >
                      <Crown className="w-5 h-5" />
                      <span>Upgrade to Premium</span>
                    </button>
                  )}

                  {/* Account Settings */}
                  <button
                    onClick={() => handleNavigation('/account')}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Account Settings</span>
                  </button>

                  {/* Divider */}
                  <div className="my-2 h-px bg-gray-200" />

                  {/* Sign Out */}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left font-medium"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </>
              )}

              {/* Logged Out Menu Items */}
              {!isLoggedIn && (
                <>
                  <button
                    onClick={() => handleNavigation('/modules')}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span className="font-medium">Modules</span>
                  </button>

                  <button
                    onClick={() => handleNavigation('/pricing')}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <Crown className="w-5 h-5" />
                    <span className="font-medium">Pricing</span>
                  </button>

                  {/* Divider */}
                  <div className="my-4 h-px bg-gray-200" />

                  {/* Sign Up / Log In */}
                  <button
                    onClick={() => {
                      onClose()
                      onOpenAuthModal?.()
                    }}
                    className="px-4 py-3 text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors text-center font-semibold"
                  >
                    Sign Up / Log In
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

