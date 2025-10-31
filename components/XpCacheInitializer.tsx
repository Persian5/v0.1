'use client'

/**
 * XP Cache Initializer
 * 
 * Runs once on app boot to ensure XP cache version matches current UID version.
 * When UID format changes (v1 → v2), old cache is automatically cleared.
 * 
 * This prevents users from double-earning XP due to cache invalidation.
 */

import { useEffect } from 'react'
import { XpService } from '@/lib/services/xp-service'

export function XpCacheInitializer() {
  useEffect(() => {
    // Run cache version check on client mount
    XpService.ensureXpCacheVersion()
  }, [])

  // This component renders nothing
  return null
}

