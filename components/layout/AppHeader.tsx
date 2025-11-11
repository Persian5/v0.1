"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Star, Menu, X, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
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

  const isLoggedIn = !!user
  const showUpgradeButton = isLoggedIn && !hasPremium && !premiumLoading

  // Determine which links are active
  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/')

  // Handle back navigation for minimal variant
  const handleBack = () => {
    // Smart back navigation
    const lessonMatch = pathname?.match(/^\/modules\/([^/]+)\/[^/]+$/)
    if (lessonMatch) {
      // Go back to module page
      router.push(`/modules/${lessonMatch[1]}`)
    } else {
      // Fallback to modules list
      router.push('/modules')
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md relative">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          {/* Minimal Variant - Back Button + XP + Account */}
          {variant === 'minimal' && (
            <>
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:inline">Back</span>
              </button>

              <div className="flex items-center gap-3">
                {/* XP Badge */}
                {isLoggedIn && (
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-sm font-semibold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
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
                    console.log('🍔 HAMBURGER CLICKED (MINIMAL)!')
                    console.log('Current mobileMenuOpen:', mobileMenuOpen)
                    console.log('Variant:', variant)
                    console.log('Setting to:', !mobileMenuOpen)
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
              {/* Logo / Home Link */}
              <Link 
                href={isLoggedIn ? "/dashboard" : "/"} 
                className="text-xl font-bold text-primary hover:opacity-80 transition-opacity"
              >
                Home
              </Link>

              {/* Desktop Navigation - Default Variant */}
              {variant === 'default' && isLoggedIn && (
                <nav className="hidden md:flex items-center gap-6">
                  <Link
                    href="/modules"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActive('/modules') ? 'text-primary' : 'text-gray-600'
                    }`}
                  >
                    Learn
                  </Link>
                  <Link
                    href="/review"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActive('/review') ? 'text-primary' : 'text-gray-600'
                    }`}
                  >
                    Review
                  </Link>
                  <Link
                    href="/leaderboard"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActive('/leaderboard') ? 'text-primary' : 'text-gray-600'
                    }`}
                  >
                    Leaderboard
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
                {/* XP Badge - Show for logged in users */}
                {isLoggedIn && (
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-sm font-semibold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{xp.toLocaleString()}</span>
                  </div>
                )}

                {/* Upgrade Button - Free Users Only */}
                {showUpgradeButton && (
                  <Link href="/pricing">
                    <Button size="sm" className="hidden sm:flex bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
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
                    className="hidden md:flex"
                    onClick={() => setAuthModalOpen(true)}
                  >
                    Sign Up / Log In
                  </Button>
                )}

                {/* Mobile Menu Toggle - DEFAULT VARIANT */}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('🍔 HAMBURGER CLICKED (DEFAULT)!')
                    console.log('Current mobileMenuOpen:', mobileMenuOpen)
                    console.log('Variant:', variant)
                    console.log('isLoggedIn:', isLoggedIn)
                    console.log('Setting to:', !mobileMenuOpen)
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

