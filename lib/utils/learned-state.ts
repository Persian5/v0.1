/**
 * Learned State Utilities
 * 
 * Standalone helper for querying learned vocabulary/suffixes/connectors
 * at any step index in any lesson/module.
 * 
 * This is the single source of truth for "what does the learner know
 * up to this exact step?" Used by:
 * - Word bank generation
 * - Grammar options
 * - Review mode
 * - Future adaptive engine features
 */

import { LessonStep } from '../types'
import { CurriculumLexicon, LearnedSoFar, buildLearnedCache } from './curriculum-lexicon'

/**
 * Get learned state for a specific step index
 * 
 * This is a convenience helper that other parts of the app can use to get
 * "what does the learner know up to this exact step?" without having to
 * manually build the cache or understand the internal logic.
 * 
 * @param moduleId - Current module ID
 * @param lessonId - Current lesson ID
 * @param steps - Array of lesson steps
 * @param lexicon - Pre-built curriculum lexicon
 * @param stepIndex - Step index to query (0-based)
 * @returns LearnedSoFar state for that step
 * 
 * @example
 * ```ts
 * const lexicon = getCurriculumLexicon()
 * const learned = getLearnedStateForStep('module1', 'lesson1', steps, lexicon, 5)
 * console.log(learned.vocabIds) // ['salam', 'chetori', 'merci']
 * ```
 */
export function getLearnedStateForStep(
  moduleId: string,
  lessonId: string,
  steps: LessonStep[],
  lexicon: CurriculumLexicon,
  stepIndex: number
): LearnedSoFar {
  // Build cache for this lesson
  const cache = buildLearnedCache(moduleId, lessonId, steps, lexicon)
  
  // Clamp stepIndex to valid range
  const clampedIndex = Math.max(0, Math.min(stepIndex, steps.length - 1))
  
  // Return learned state for this step (or empty if no steps)
  return cache[clampedIndex] || { vocabIds: [], suffixes: [], connectors: [] }
}

// Re-export types for convenience
export type { LearnedSoFar } from './curriculum-lexicon'

