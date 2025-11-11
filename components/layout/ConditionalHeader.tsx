"use client"

import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { AppHeader } from './AppHeader'
import { BottomNav } from './BottomNav'

/**
 * Smart wrapper that conditionally renders AppHeader and BottomNav based on current route
 * 
 * Logic:
 * - Lesson pages (/modules/[moduleId]/[lessonId]): minimal variant
 * - Auth pages (/auth): no header, no bottom nav
 * - Homepage (/): logged-out variant  
 * - All other pages: default variant
 * - BottomNav: Shown for ALL users (4th item adapts based on auth)
 * 
 * Performance: Calls useAuth once and passes down to prevent re-render loops
 */
export function ConditionalHeader() {
  const pathname = usePathname()
  const { user } = useAuth()
  
  // Memoize isLoggedIn to prevent unnecessary re-renders
  const isLoggedIn = useMemo(() => !!user, [user])

  // Memoize variant calculation
  const variant = useMemo(() => {
    if (pathname?.startsWith('/auth')) return null
    if (pathname?.match(/^\/modules\/[^/]+\/[^/]+$/)) return 'minimal'
    if (pathname === '/') return 'logged-out'
    return 'default'
  }, [pathname])

  // Don't show header OR bottom nav on auth pages
  if (variant === null) {
    return null
  }

  return (
    <>
      <AppHeader variant={variant as any} />
      {/* Show bottom nav for all users (logged-in and logged-out) */}
      <BottomNav />
    </>
  )
}

