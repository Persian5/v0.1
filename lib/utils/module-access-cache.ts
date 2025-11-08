/**
 * Client-Side Module Access Cache
 * 
 * Prevents duplicate API calls for module access checks within a short time window.
 * Uses sessionStorage for persistence across page reloads within same session.
 * 
 * Safety features:
 * - 30-second cache expiry
 * - Clears on auth state change
 * - Individual cache per module
 * - Falls back gracefully on errors
 */

interface ModuleAccessCacheEntry {
  data: {
    canAccess: boolean
    reason?: string
    requiresPremium: boolean
    hasPremium: boolean
    prerequisitesComplete: boolean
    missingPrerequisites?: string[]
  }
  timestamp: number
  userId: string
}

const CACHE_DURATION_MS = 30000 // 30 seconds
const CACHE_KEY_PREFIX = 'module-access-cache:'

/**
 * Get cached module access check
 */
export function getCachedModuleAccess(
  moduleId: string,
  userId: string
): ModuleAccessCacheEntry['data'] | null {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${moduleId}`
    const cached = sessionStorage.getItem(cacheKey)
    
    if (!cached) {
      return null
    }

    const entry: ModuleAccessCacheEntry = JSON.parse(cached)
    
    // Validate cache
    const isExpired = Date.now() - entry.timestamp > CACHE_DURATION_MS
    const isDifferentUser = entry.userId !== userId
    
    if (isExpired || isDifferentUser) {
      // Clear invalid cache
      sessionStorage.removeItem(cacheKey)
      return null
    }

    return entry.data
  } catch (error) {
    // Fail gracefully - just return null and let API be called
    console.warn('Module access cache read error:', error)
    return null
  }
}

/**
 * Cache module access check result
 */
export function setCachedModuleAccess(
  moduleId: string,
  userId: string,
  data: ModuleAccessCacheEntry['data']
): void {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${moduleId}`
    const entry: ModuleAccessCacheEntry = {
      data,
      timestamp: Date.now(),
      userId
    }
    
    sessionStorage.setItem(cacheKey, JSON.stringify(entry))
  } catch (error) {
    // Fail gracefully - cache is optional optimization
    console.warn('Module access cache write error:', error)
  }
}

/**
 * Clear all module access caches
 * Call this when user auth state changes
 */
export function clearModuleAccessCache(): void {
  try {
    const keys = Object.keys(sessionStorage)
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        sessionStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.warn('Module access cache clear error:', error)
  }
}

/**
 * Clear cache for specific module
 */
export function clearModuleCache(moduleId: string): void {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${moduleId}`
    sessionStorage.removeItem(cacheKey)
  } catch (error) {
    console.warn('Module cache clear error:', error)
  }
}

