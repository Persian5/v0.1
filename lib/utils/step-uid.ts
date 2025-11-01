/**
 * Step UID Generator (v2)
 * 
 * Generates stable, unique identifiers for lesson steps.
 * These UIDs are used for XP idempotency - ensuring users can only earn XP once per step.
 * 
 * Key principles:
 * 1. UIDs must be stable (same step = same UID across app versions)
 * 2. UIDs must be unique within a lesson AND across lessons
 * 3. UIDs should survive step reordering (content-based, not position-based)
 * 4. UIDs are collision-resistant through hashing
 * 
 * Version History:
 * - v1: Original implementation (index-based fallbacks, truncation issues)
 * - v2: Content-based hashing, no truncation, version prefix, collision-resistant
 */

import type { LessonStep } from '@/lib/types'

/**
 * UID version identifier
 * Increment this when changing UID generation logic to invalidate old cache
 */
export const UID_VERSION = 'v2'

/**
 * Simple hash function for generating stable, short identifiers
 * Uses a 32-bit FNV-1a hash for speed and consistency
 * 
 * @param str - String to hash
 * @returns Base36-encoded hash (alphanumeric, short)
 */
function simpleHash(str: string): string {
  let hash = 2166136261; // FNV-1a offset basis
  
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  
  // Convert to unsigned 32-bit integer and encode as base36
  return (hash >>> 0).toString(36);
}

/**
 * Derive a stable UID for a lesson step.
 * 
 * Strategy:
 * - Use step type + content identifier when possible
 * - Hash content for collision resistance
 * - Fall back to step index only when no content available
 * 
 * Examples:
 * - v2-flashcard-salam
 * - v2-quiz-3agmcd (hashed)
 * - v2-audio-seq-k8n2m (hashed sequence)
 * - v2-final-challenge
 */
export function deriveStepUid(step: LessonStep, stepIndex: number): string {
  const type = step.type
  
  switch (type) {
    case 'welcome':
      // Welcome screens are always first, use fixed UID
      return `${UID_VERSION}-welcome`
    
    case 'flashcard': {
      const vocabId = (step as any).data?.vocabularyId
      if (vocabId) {
        return `${UID_VERSION}-flashcard-${vocabId}`
      }
      // Fallback: use index (shouldn't happen with proper curriculum)
      console.warn(`Flashcard step ${stepIndex} missing vocabularyId, using index fallback`)
      return `${UID_VERSION}-flashcard-${stepIndex}`
    }
    
    case 'quiz': {
      const vocabId = (step as any).data?.vocabularyId
      if (vocabId) {
        return `${UID_VERSION}-quiz-${vocabId}`
      }
      // If no vocabId, hash the prompt + correct answer for uniqueness
      const prompt = (step as any).data?.prompt
      const correct = (step as any).data?.correct
      if (prompt !== undefined && correct !== undefined) {
        return `${UID_VERSION}-quiz-${simpleHash(`${prompt}-${correct}`)}`
      }
      // Final fallback
      console.warn(`Quiz step ${stepIndex} missing vocabularyId and content, using index fallback`)
      return `${UID_VERSION}-quiz-${stepIndex}`
    }
    
    case 'input': {
      const vocabId = (step as any).data?.vocabularyId
      if (vocabId) {
        return `${UID_VERSION}-input-${vocabId}`
      }
      // Use answer as identifier if available
      const answer = (step as any).data?.answer
      if (answer) {
        // Sanitize answer for UID (remove special chars, lowercase)
        const sanitized = answer.replace(/[^a-z0-9]/gi, '').toLowerCase()
        // Hash if too long
        const answerId = sanitized.length > 30 
          ? simpleHash(sanitized)
          : sanitized
        return `${UID_VERSION}-input-${answerId}`
      }
      console.warn(`Input step ${stepIndex} missing vocabularyId and answer, using index fallback`)
      return `${UID_VERSION}-input-${stepIndex}`
    }
    
    case 'matching': {
      // Extract content from matching words for content-based UID
      const words = (step as any).data?.words
      const slots = (step as any).data?.slots
      
      if (words && Array.isArray(words) && words.length > 0) {
        // Create stable identifier from word texts and their slot assignments
        // Format: "word1Text:slot1Id,word2Text:slot2Id"
        const wordSlotPairs = words.map((w: any) => {
          return `${w.text || w.id}:${w.slotId || ''}`
        }).join(',')
        
        if (wordSlotPairs) {
          return `${UID_VERSION}-matching-${simpleHash(wordSlotPairs)}`
        }
      }
      
      // Fallback: use index (matching is contextual, so reordering = new challenge)
      console.warn(`Matching step ${stepIndex} missing words data, using index fallback`)
      return `${UID_VERSION}-matching-${stepIndex}`
    }
    
    case 'audio-meaning': {
      const vocabId = (step as any).data?.vocabularyId
      if (vocabId) {
        return `${UID_VERSION}-audio-meaning-${vocabId}`
      }
      console.warn(`Audio-meaning step ${stepIndex} missing vocabularyId, using index fallback`)
      return `${UID_VERSION}-audio-meaning-${stepIndex}`
    }
    
    case 'audio-sequence': {
      // Audio sequences have a sequence array of vocabulary IDs
      const sequence = (step as any).data?.sequence
      if (sequence && Array.isArray(sequence) && sequence.length > 0) {
        // Hash the full sequence for unique, collision-resistant identifier
        // This ensures "salam,khoobam" and "salam,chetori" get different UIDs
        const sequenceKey = sequence.join(',')
        return `${UID_VERSION}-audio-seq-${simpleHash(sequenceKey)}`
      }
      console.warn(`Audio-sequence step ${stepIndex} missing sequence data, using index fallback`)
      return `${UID_VERSION}-audio-seq-${stepIndex}`
    }
    
    case 'text-sequence': {
      // Text sequences have finglish text
      const finglish = (step as any).data?.finglishText
      if (finglish) {
        // Sanitize: remove special characters, lowercase
        const sanitized = finglish.replace(/[^a-z0-9]/gi, '').toLowerCase()
        
        // Use full sanitized text if short (easier to debug)
        // Hash if longer than 50 chars to keep UIDs manageable
        if (sanitized.length <= 50) {
          return `${UID_VERSION}-text-seq-${sanitized}`
        } else {
          return `${UID_VERSION}-text-seq-${simpleHash(sanitized)}`
        }
      }
      console.warn(`Text-sequence step ${stepIndex} missing finglishText, using index fallback`)
      return `${UID_VERSION}-text-seq-${stepIndex}`
    }
    
    case 'final':
      // Final challenges are always last, use fixed UID
      return `${UID_VERSION}-final-challenge`
    
    case 'story-conversation': {
      // Story conversations use story ID
      const storyId = (step as any).data?.storyId
      if (storyId) {
        return `${UID_VERSION}-story-${storyId}`
      }
      console.warn(`Story-conversation step ${stepIndex} missing storyId, using index fallback`)
      return `${UID_VERSION}-story-${stepIndex}`
    }
    
    case 'grammar-concept': {
      const conceptId = (step as any).data?.conceptId
      if (conceptId) {
        return `${UID_VERSION}-grammar-${conceptId}`
      }
      console.warn(`Grammar-concept step ${stepIndex} missing conceptId, using index fallback`)
      return `${UID_VERSION}-grammar-${stepIndex}`
    }
    
    case 'reverse-quiz': {
      // Reverse quiz is like quiz but asks Persian -> English
      const vocabId = (step as any).data?.vocabularyId
      if (vocabId) {
        return `${UID_VERSION}-reverse-quiz-${vocabId}`
      }
      const prompt = (step as any).data?.prompt
      const correct = (step as any).data?.correct
      if (prompt !== undefined && correct !== undefined) {
        return `${UID_VERSION}-reverse-quiz-${simpleHash(`${prompt}-${correct}`)}`
      }
      console.warn(`Reverse-quiz step ${stepIndex} missing content, using index fallback`)
      return `${UID_VERSION}-reverse-quiz-${stepIndex}`
    }
    
    default:
      // Unknown step type - use type + hash of data
      console.warn(`Unknown step type: ${type}, using content hash fallback`)
      const dataStr = JSON.stringify((step as any).data || {})
      return `${UID_VERSION}-${type}-${simpleHash(dataStr)}`
  }
}

/**
 * Create a full idempotency key for XP transactions.
 * 
 * Format: moduleId:lessonId:stepUid
 * Example: module1:lesson2:v2-flashcard-salam
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
