"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Star, Menu, X, ArrowLeft, Crown } from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { usePremium } from '@/hooks/use-premium'
import { useXp } from '@/hooks/use-xp'
import { AccountDropdown } from './AccountDropdown'
import { MobileMenu } from './MobileMenu'
import { Button } from '@/components/ui/button'
import { AuthModal } from '@/components/auth/AuthModal'

type HeaderVariant = 'default' | 'minimal' | 'logged-out'

interface AppHeaderProps {
  variant?: HeaderVariant
}

/**
 * Universal application header with support for multiple variants
 * 
 * Variants:
 * - default: Full navigation with Learn, Review, Leaderboard links
 * - minimal: Lesson pages - only back button, XP, account
 * - logged-out: Homepage/marketing - Modules, Pricing, Sign In
 */
export function AppHeader({ variant = 'default' }: AppHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const { hasPremium, isLoading: premiumLoading } = usePremium()
  const { xp } = useXp()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  // Memoize computed values to prevent unnecessary re-renders
  const isLoggedIn = useMemo(() => !!user, [user])
  const showUpgradeButton = useMemo(
    () => isLoggedIn && !hasPremium && !premiumLoading,
    [isLoggedIn, hasPremium, premiumLoading]
  )

  // Memoize isActive function
  const isActive = useCallback(
    (path: string) => pathname === path || pathname?.startsWith(path + '/'),
    [pathname]
  )

  // Handle back navigation for minimal variant
  const handleBack = useCallback(() => {
    const lessonMatch = pathname?.match(/^\/modules\/([^/]+)\/[^/]+$/)
    if (lessonMatch) {
      router.push(`/modules/${lessonMatch[1]}`)
    } else {
      router.push('/modules')
    }
  }, [pathname, router])

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md relative">
        <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6">
          {/* Minimal Variant - Back Button + XP + Account */}
          {variant === 'minimal' && (
            <>
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors"
                aria-label="Go back to previous page"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:inline">Back</span>
              </button>

              <div className="flex items-center gap-3">
                {/* XP Badge - Always visible on all screen sizes */}
                {isLoggedIn && (
                  <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs sm:text-sm font-semibold">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
                    <span>{xp.toLocaleString()}</span>
                  </div>
                )}

                {/* Account Dropdown - Desktop only */}
                {isLoggedIn && <div className="hidden md:block"><AccountDropdown /></div>}

                {/* Mobile Menu Toggle - MINIMAL VARIANT */}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setMobileMenuOpen(!mobileMenuOpen)
                  }}
                  className="md:hidden p-2 text-gray-600 hover:text-primary transition-colors"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </>
          )}

          {/* Default & Logged-Out Variants */}
          {variant !== 'minimal' && (
            <>
              {/* Logo / Home Link - Always goes to homepage */}
              <Link 
                href="/" 
                className="text-xl font-bold text-primary hover:opacity-80 transition-opacity"
                aria-label="Finglish Home"
              >
                Finglish
              </Link>

              {/* Desktop Navigation - Default Variant */}
              {variant === 'default' && isLoggedIn && (
                <nav className="hidden md:flex items-center gap-8 flex-1 justify-center" aria-label="Main navigation">
                  <Link
                    href="/modules"
                    className={`text-sm transition-colors duration-200 hover:text-primary relative group ${
                      isActive('/modules') ? 'text-primary font-semibold' : 'text-gray-600 font-medium'
                    }`}
                    aria-current={isActive('/modules') ? 'page' : undefined}
                  >
                    Learn
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                  </Link>
                  <Link
                    href="/review"
                    className={`text-sm transition-colors duration-200 hover:text-primary relative group ${
                      isActive('/review') ? 'text-primary font-semibold' : 'text-gray-600 font-medium'
                    }`}
                    aria-current={isActive('/review') ? 'page' : undefined}
                  >
                    Review
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                  </Link>
                  <Link
                    href="/leaderboard"
                    className={`text-sm transition-colors duration-200 hover:text-primary relative group ${
                      isActive('/leaderboard') ? 'text-primary font-semibold' : 'text-gray-600 font-medium'
                    }`}
                    aria-current={isActive('/leaderboard') ? 'page' : undefined}
                  >
                    Leaderboard
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                  </Link>
                  <Link
                    href="/dashboard"
                    className={`text-sm transition-colors duration-200 hover:text-primary relative group ${
                      isActive('/dashboard') ? 'text-primary font-semibold' : 'text-gray-600 font-medium'
                    }`}
                    aria-current={isActive('/dashboard') ? 'page' : undefined}
                  >
                    Dashboard
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                  </Link>
                </nav>
              )}

              {/* Desktop Navigation - Logged Out Variant */}
              {variant === 'logged-out' && !isLoggedIn && (
                <nav className="hidden md:flex items-center gap-6">
                  <Link
                    href="/modules"
                    className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
                  >
                    Modules
                  </Link>
                  <Link
                    href="/pricing"
                    className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
                  >
                    Pricing
                  </Link>
                </nav>
              )}

              {/* Right Side Actions */}
              <div className="flex items-center gap-3">
                {/* XP Badge - Show for logged in users on all screen sizes */}
                {isLoggedIn && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-sm font-semibold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{xp.toLocaleString()}</span>
                  </div>
                )}

                {/* Upgrade Button - Free Users Only - PROMINENT */}
                {showUpgradeButton && (
                  <Link href="/pricing" aria-label="Upgrade to premium">
                    <Button 
                      size="sm" 
                      className="hidden sm:flex bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 hover:from-purple-700 hover:via-purple-600 hover:to-pink-600 text-white font-bold shadow-lg animate-pulse hover:animate-none transition-all"
                    >
                      <Crown className="w-4 h-4 mr-1.5" />
                      Upgrade
                    </Button>
                  </Link>
                )}

                {/* Account Dropdown - Desktop */}
                {isLoggedIn ? (
                  <div className="hidden md:block">
                    <AccountDropdown />
                  </div>
                ) : (
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-semibold shadow-sm"
                    onClick={() => setAuthModalOpen(true)}
                    aria-label="Sign up for Finglish"
                  >
                    Sign Up
                  </Button>
                )}

                {/* Mobile Menu Toggle - DEFAULT VARIANT */}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setMobileMenuOpen(!mobileMenuOpen)
                  }}
                  className="md:hidden p-2 text-gray-600 hover:text-primary transition-colors"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </>
          )}
        </div>
        {/* Gradient border at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/10 via-accent/20 to-primary/10"></div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)}
        variant={variant}
        onOpenAuthModal={() => setAuthModalOpen(true)}
      />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  )
}

