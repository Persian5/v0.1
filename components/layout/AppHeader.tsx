"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Star, Menu, X, ArrowLeft, Crown } from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { usePremium } from '@/hooks/use-premium'
import { useSmartXp } from '@/hooks/use-smart-xp'
import { AccountDropdown } from './AccountDropdown'
import { MobileMenu } from './MobileMenu'
import { Button } from '@/components/ui/button'
import { AuthModal } from '@/components/auth/AuthModal'
import { getModule } from '@/lib/config/curriculum'

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
  const { user, isLoading: authLoading } = useAuth()
  const { hasPremium, isLoading: premiumLoading } = usePremium()
  const { xp } = useSmartXp()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  // Memoize computed values to prevent unnecessary re-renders
  const isLoggedIn = useMemo(() => !!user, [user])
  const showUpgradeButton = useMemo(
    () => isLoggedIn && !hasPremium && !premiumLoading,
    [isLoggedIn, hasPremium, premiumLoading]
  )
  
  // FLICKER FIX: Show skeleton/nothing while auth is loading to prevent flash of "logged out" state
  const isAuthReady = useMemo(() => !authLoading, [authLoading])

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

  // Get module info for back button text
  const moduleInfo = useMemo(() => {
    const lessonMatch = pathname?.match(/^\/modules\/([^/]+)\/[^/]+$/)
    if (lessonMatch) {
      const module = getModule(lessonMatch[1])
      if (module) {
        // Extract module number from title (e.g., "Module 1: Greetings" -> "Module 1")
        const match = module.title.match(/Module (\d+)/)
        return match ? `Module ${match[1]}` : module.title.split(':')[0]
      }
    }
    return null
  }, [pathname])

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
                aria-label={moduleInfo ? `Go back to ${moduleInfo}` : "Go back to previous page"}
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {moduleInfo ? `Back to ${moduleInfo}` : 'Back'}
                </span>
              </button>

              <div className="flex items-center gap-3">
                {/* FLICKER FIX: Show skeleton while auth is loading */}
                {!isAuthReady ? (
                  <>
                    {/* Loading skeleton for XP badge */}
                    <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gray-100 animate-pulse">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gray-200" />
                      <div className="w-12 h-4 bg-gray-200 rounded" />
                    </div>
                    {/* Loading skeleton for account dropdown */}
                    <div className="hidden md:block w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
                    {/* Mobile menu toggle (always show) */}
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
                  </>
                ) : (
                  <>
                    {/* XP Badge - Always visible on all screen sizes */}
                    {isLoggedIn && (
                      <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs sm:text-sm font-semibold shadow-[0_0_4px_rgba(255,193,7,0.3)]">
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
                  </>
                )}
              </div>
            </>
          )}

          {/* Default & Logged-Out Variants */}
          {variant !== 'minimal' && (
            <>
              {/* Logo / Home Link - Always goes to homepage */}
              <Link 
                href="/" 
                className="text-xl font-bold text-primary hover:opacity-80 transition-opacity flex-shrink-0"
                aria-label="Finglish Home"
              >
                Finglish
              </Link>

              {/* Desktop Navigation - Default Variant */}
              {variant === 'default' && isLoggedIn && (
                <nav className="hidden md:flex items-center gap-6 flex-1 ml-6 lg:ml-8" aria-label="Main navigation">
                  <Link
                    href="/modules"
                    className={`text-base transition-colors duration-200 hover:text-primary relative group ${
                      isActive('/modules') ? 'text-primary font-semibold' : 'text-gray-600 font-medium'
                    }`}
                    aria-current={isActive('/modules') ? 'page' : undefined}
                  >
                    Learn
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                  </Link>
                  <Link
                    href="/review"
                    className={`text-base transition-colors duration-200 hover:text-primary relative group ${
                      isActive('/review') ? 'text-primary font-semibold' : 'text-gray-600 font-medium'
                    }`}
                    aria-current={isActive('/review') ? 'page' : undefined}
                  >
                    Review
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                  </Link>
                  <Link
                    href="/leaderboard"
                    className={`text-base transition-colors duration-200 hover:text-primary relative group ${
                      isActive('/leaderboard') ? 'text-primary font-semibold' : 'text-gray-600 font-medium'
                    }`}
                    aria-current={isActive('/leaderboard') ? 'page' : undefined}
                  >
                    Leaderboard
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                  </Link>
                  <Link
                    href="/dashboard"
                    className={`text-base transition-colors duration-200 hover:text-primary relative group ${
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
                    className="text-base font-medium text-gray-600 hover:text-primary transition-colors"
                  >
                    Modules
                  </Link>
                  <Link
                    href="/pricing"
                    className="text-base font-medium text-gray-600 hover:text-primary transition-colors"
                  >
                    Pricing
                  </Link>
                </nav>
              )}

              {/* Right Side Actions */}
              <div className="flex items-center gap-3">
                {/* FLICKER FIX: Show skeleton while auth is loading */}
                {!isAuthReady ? (
                  <>
                    {/* Loading skeleton for XP badge */}
                    <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gray-100 animate-pulse">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gray-200" />
                      <div className="w-12 h-4 bg-gray-200 rounded" />
                    </div>
                    {/* Loading skeleton for account button */}
                    <div className="hidden md:block w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
                    {/* Mobile menu toggle (always show) */}
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
                  </>
                ) : (
                  <>
                    {/* XP Badge - Show for logged in users on all screen sizes */}
                    {isLoggedIn && (
                      <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs sm:text-sm font-semibold shadow-[0_0_4px_rgba(255,193,7,0.3)]">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
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
                        aria-label="Sign in to Finglish"
                      >
                        Sign In
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
                  </>
                )}
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

