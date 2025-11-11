/**
 * Cache Verification Utilities
 * 
 * Centralized logic for verifying lesson completion in cache.
 * Prevents drift between different verification points in the codebase.
 * 
 * @module cache-verification
 */

import { SmartAuthService } from '@/lib/services/smart-auth-service'

/**
 * Result of cache verification check
 */
export interface CacheVerificationResult {
  /** Whether the lesson was found in cache as completed */
  isVerified: boolean
  /** Timestamp when verification was performed */
  verifiedAt: number | null
  /** Optional error message if verification failed */
  error: string | null
}

/**
 * Verify that a specific lesson is marked as completed in the SmartAuthService cache.
 * 
 * This is the single source of truth for cache verification across the app.
 * Automatically fetches cached progress from SmartAuthService.
 * 
 * @param userId - User ID to verify (used for logging/debugging)
 * @param moduleId - Module ID to verify
 * @param lessonId - Lesson ID to verify
 * @returns CacheVerificationResult with verification status
 * 
 * @example
 * ```typescript
 * const result = verifyLessonCompletionInCache(user.id, 'module1', 'lesson2')
 * 
 * if (result.isVerified) {
 *   console.log('Lesson is completed in cache')
 * } else {
 *   console.warn('Verification failed:', result.error)
 * }
 * ```
 */
export function verifyLessonCompletionInCache(
  userId: string,
  moduleId: string,
  lessonId: string
): CacheVerificationResult {
  try {
    // Fetch cached progress from SmartAuthService
    const cachedProgress = SmartAuthService.getCachedProgress()
    
    // Check if lesson exists in cache with 'completed' status
    const isCompletedInCache = cachedProgress.some(
      (p) => p.user_id === userId && p.module_id === moduleId && p.lesson_id === lessonId && p.status === 'completed'
    )

    if (isCompletedInCache) {
      return { isVerified: true, verifiedAt: Date.now(), error: null }
    } else {
      return {
        isVerified: false,
        verifiedAt: null,
        error: `Lesson ${moduleId}/${lessonId} not found as completed in cache.`,
      }
    }
  } catch (err: any) {
    console.error('Error during cache verification:', err)
    return {
      isVerified: false,
      verifiedAt: null,
      error: `Cache verification failed: ${err.message || 'Unknown error'}`,
    }
  }
}

