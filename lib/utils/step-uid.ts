/**
 * Step UID Generator
 * 
 * Generates stable, unique identifiers for lesson steps.
 * These UIDs are used for XP idempotency - ensuring users can only earn XP once per step.
 * 
 * Key principles:
 * 1. UIDs must be stable (same step = same UID across app versions)
 * 2. UIDs must be unique within a lesson
 * 3. UIDs should survive step reordering
 * 4. UIDs should be somewhat human-readable for debugging
 */

import type { LessonStep } from '@/lib/types'

/**
 * Derive a stable UID for a lesson step.
 * 
 * Strategy:
 * - Use step type + content identifier when possible
 * - Fall back to step index for steps without unique identifiers
 * 
 * Examples:
 * - flashcard-salam
 * - quiz-chetori
 * - audio-seq-2 (if no unique identifier available)
 * - final-challenge
 */
export function deriveStepUid(step: LessonStep, stepIndex: number): string {
  const type = step.type
  
  switch (type) {
    case 'welcome':
      // Welcome screens are always first, use fixed UID
      return 'welcome'
    
    case 'flashcard': {
      const vocabId = (step as any).data?.vocabularyId
      if (vocabId) {
        return `flashcard-${vocabId}`
      }
      // Legacy fallback
      return `flashcard-${stepIndex}`
    }
    
    case 'quiz': {
      const vocabId = (step as any).data?.vocabularyId
      if (vocabId) {
        return `quiz-${vocabId}`
      }
      // If no vocabId, use index
      return `quiz-${stepIndex}`
    }
    
    case 'input': {
      const vocabId = (step as any).data?.vocabularyId
      if (vocabId) {
        return `input-${vocabId}`
      }
      // Use answer as identifier if available
      const answer = (step as any).data?.answer
      if (answer) {
        return `input-${answer}`
      }
      return `input-${stepIndex}`
    }
    
    case 'matching': {
      // Matching games don't have unique identifiers
      // Use index (if step order changes, this is a new challenge anyway)
      return `matching-${stepIndex}`
    }
    
    case 'audio-meaning': {
      const vocabId = (step as any).data?.vocabularyId
      if (vocabId) {
        return `audio-meaning-${vocabId}`
      }
      return `audio-meaning-${stepIndex}`
    }
    
    case 'audio-sequence': {
      // Audio sequences have a sequence array
      const sequence = (step as any).data?.sequence
      if (sequence && Array.isArray(sequence) && sequence.length > 0) {
        // Use first vocab ID + length as identifier
        return `audio-seq-${sequence[0]}-${sequence.length}`
      }
      return `audio-seq-${stepIndex}`
    }
    
    case 'text-sequence': {
      // Text sequences have finglish text
      const finglish = (step as any).data?.finglishText
      if (finglish) {
        // Use first 10 chars of finglish as identifier (sanitized)
        const sanitized = finglish.replace(/[^a-z0-9]/gi, '').toLowerCase().substring(0, 10)
        return `text-seq-${sanitized}`
      }
      return `text-seq-${stepIndex}`
    }
    
    case 'final':
      // Final challenges are always last, use fixed UID
      return 'final-challenge'
    
    case 'story-conversation': {
      // Story conversations use story ID
      const storyId = (step as any).data?.storyId
      if (storyId) {
        return `story-${storyId}`
      }
      return `story-${stepIndex}`
    }
    
    case 'grammar-concept': {
      const conceptId = (step as any).data?.conceptId
      if (conceptId) {
        return `grammar-${conceptId}`
      }
      return `grammar-${stepIndex}`
    }
    
    default:
      // Unknown step type - use type + index
      console.warn(`Unknown step type: ${type}, using index-based UID`)
      return `${type}-${stepIndex}`
  }
}

/**
 * Create a full idempotency key for XP transactions.
 * 
 * Format: moduleId:lessonId:stepUid
 * Example: module1:lesson2:flashcard-salam
 */
export function makeStepKey(moduleId: string, lessonId: string, stepUid: string): string {
  return `${moduleId}:${lessonId}:${stepUid}`
}

/**
 * Parse a step key back into components (for debugging/analytics)
 */
export function parseStepKey(key: string): { moduleId: string, lessonId: string, stepUid: string } | null {
  const parts = key.split(':')
  if (parts.length !== 3) return null
  
  return {
    moduleId: parts[0],
    lessonId: parts[1],
    stepUid: parts[2]
  }
}

