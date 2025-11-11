"use client"

import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { AppHeader } from './AppHeader'
import { BottomNav } from './BottomNav'

/**
 * Smart wrapper that conditionally renders AppHeader and BottomNav based on current route
 * 
 * Logic:
 * - Lesson pages (/modules/[moduleId]/[lessonId]): minimal variant
 * - Auth pages (/auth): no header
 * - Homepage (/): logged-out variant  
 * - All other pages: default variant
 * - BottomNav: Only for logged-in users on non-auth pages
 */
export function ConditionalHeader() {
  const pathname = usePathname()
  const { user } = useAuth()
  const isLoggedIn = !!user

  // Don't show header on auth pages
  if (pathname?.startsWith('/auth')) {
    return null
  }

  // Minimal variant for lesson pages (only back button, XP, account)
  if (pathname?.match(/^\/modules\/[^/]+\/[^/]+$/)) {
    return (
      <>
        <AppHeader variant="minimal" />
        {isLoggedIn && <BottomNav />}
      </>
    )
  }

  // Logged-out variant for homepage
  if (pathname === '/') {
    return (
      <>
        <AppHeader variant="logged-out" />
        {isLoggedIn && <BottomNav />}
      </>
    )
  }

  // Default variant for all other pages
  return (
    <>
      <AppHeader variant="default" />
      {isLoggedIn && <BottomNav />}
    </>
  )
}

