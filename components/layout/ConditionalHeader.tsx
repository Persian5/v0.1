"use client"

import { usePathname } from 'next/navigation'
import { AppHeader } from './AppHeader'

/**
 * Smart wrapper that conditionally renders AppHeader based on current route
 * 
 * Logic:
 * - Lesson pages (/modules/[moduleId]/[lessonId]): minimal variant
 * - Auth pages (/auth): no header
 * - Homepage (/): logged-out variant  
 * - All other pages: default variant
 */
export function ConditionalHeader() {
  const pathname = usePathname()

  // Don't show header on auth pages
  if (pathname?.startsWith('/auth')) {
    return null
  }

  // Minimal variant for lesson pages (only back button, XP, account)
  if (pathname?.match(/^\/modules\/[^/]+\/[^/]+$/)) {
    return <AppHeader variant="minimal" />
  }

  // Logged-out variant for homepage
  if (pathname === '/') {
    return <AppHeader variant="logged-out" />
  }

  // Default variant for all other pages
  return <AppHeader variant="default" />
}

