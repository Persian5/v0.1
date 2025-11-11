"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, RotateCcw, Trophy, BarChart3, UserPlus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { AuthModal } from '@/components/auth/AuthModal'

/**
 * Mobile bottom navigation bar
 * Only shown for logged-in users on mobile devices
 * Follows iOS/Material Design patterns for thumb-reachable navigation
 * Auto-hides when footer is visible to prevent overlap
 * 4th item adapts: Progress (logged-in) or Sign Up (logged-out)
 */
export function BottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const isLoggedIn = !!user
  const [isVisible, setIsVisible] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Hide bottom nav when scrolled to bottom (footer visible)
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      
      // Hide nav if within 100px of bottom (footer area)
      const distanceFromBottom = documentHeight - (scrollTop + windowHeight)
      setIsVisible(distanceFromBottom > 100)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial state
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (path: string) => {
    if (path === '/modules') {
      return pathname === '/modules' || pathname?.startsWith('/modules/')
    }
    return pathname === path || pathname?.startsWith(path + '/')
  }

  // Define nav items - 4th item changes based on auth state
  const navItems = [
    {
      href: '/modules',
      icon: BookOpen,
      label: 'Learn',
      active: isActive('/modules')
    },
    {
      href: '/review',
      icon: RotateCcw,
      label: 'Review',
      active: isActive('/review')
    },
    {
      href: '/leaderboard',
      icon: Trophy,
      label: 'Leaderboard',
      active: isActive('/leaderboard')
    },
    // 4th slot: Progress for logged-in, Sign Up for logged-out
    isLoggedIn ? {
      href: '/dashboard',
      icon: BarChart3,
      label: 'Progress',
      active: isActive('/dashboard')
    } : {
      href: '/auth',
      icon: UserPlus,
      label: 'Sign Up',
      active: false // Auth page won't have active state
    }
  ]

  return (
    <>
      <nav 
        className={`fixed left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 transition-transform duration-300 ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ 
          bottom: 0,
          paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' // Account for iPhone notch
        }}
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around" style={{ height: '56px' }}>
          {navItems.map((item) => {
            const Icon = item.icon
            
            // Special handling for Sign Up button (logged-out 4th item)
            if (!isLoggedIn && item.label === 'Sign Up') {
              return (
                <button
                  key="sign-up"
                  onClick={() => setShowAuthModal(true)}
                  className="flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 text-gray-500 hover:text-gray-700"
                  aria-label="Sign up for Finglish"
                >
                  <Icon 
                    className="w-6 h-6 mb-0.5 stroke-2" 
                  />
                  <span className="text-xs font-medium leading-tight">
                    {item.label}
                  </span>
                </button>
              )
            }
            
            // Regular nav items
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${
                  item.active
                    ? 'text-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                aria-current={item.active ? 'page' : undefined}
              >
                <Icon 
                  className={`w-6 h-6 mb-0.5 ${
                    item.active ? 'stroke-[2.5]' : 'stroke-2'
                  }`} 
                />
                <span className="text-xs font-medium leading-tight">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
      
      {/* Auth Modal for Sign Up button */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode="signup"
      />
    </>
  )
}

