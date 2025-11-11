/**
 * Cache Verification Utilities
 * 
 * Centralized logic for verifying lesson completion in cache.
 * Prevents drift between different verification points in the codebase.
 * 
 * @module cache-verification
 */

import type { UserLessonProgress } from '@/lib/supabase/database'

/**
 * Result of cache verification check
 */
export interface CacheVerificationResult {
  /** Whether the lesson was found in cache as completed */
  isVerified: boolean
  /** Timestamp when verification was performed */
  verifiedAt: number
  /** Optional error message if verification failed */
  error?: string
}

/**
 * Verify that a specific lesson is marked as completed in the cached progress data.
 * 
 * This is the single source of truth for cache verification across the app.
 * 
 * @param progressData - Array of cached user lesson progress
 * @param moduleId - Module ID to verify
 * @param lessonId - Lesson ID to verify
 * @returns CacheVerificationResult with verification status
 * 
 * @example
 * ```typescript
 * const result = verifyLessonCompletionInCache(
 *   SmartAuthService.getCachedProgress(),
 *   'module1',
 *   'lesson2'
 * )
 * 
 * if (result.isVerified) {
 *   console.log('Lesson is completed in cache')
 * }
 * ```
 */
export function verifyLessonCompletionInCache(
  progressData: UserLessonProgress[],
  moduleId: string,
  lessonId: string
): CacheVerificationResult {
  const verifiedAt = Date.now()
  
  try {
    // Check if lesson exists in cache with 'completed' status
    const isVerified = progressData.some(p => 
      p.module_id === moduleId && 
      p.lesson_id === lessonId && 
      p.status === 'completed'
    )
    
    return {
      isVerified,
      verifiedAt
    }
  } catch (error) {
    // Graceful error handling - return false with error message
    return {
      isVerified: false,
      verifiedAt,
      error: error instanceof Error ? error.message : 'Unknown verification error'
    }
  }
}

