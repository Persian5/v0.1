/**
 * Step UID Generator (v3 - Production Stable)
 * 
 * Generates stable, unique identifiers for lesson steps.
 * These UIDs are used for XP idempotency - ensuring users can only earn XP once per step.
 * 
 * Key principles:
 * 1. UIDs must be stable (same step = same UID across app versions)
 * 2. UIDs must be unique within a lesson AND across lessons
 * 3. UIDs are content-based ONLY (never position-based)
 * 4. UIDs are collision-resistant through hashing
 * 5. STRICT: Throw errors if content is missing (forces proper curriculum data)
 * 
 * Version History:
 * - v1: Original implementation (index-based fallbacks, truncation issues)
 * - v2: Content-based hashing, no truncation, version prefix, collision-resistant
 * - v3: STRICT mode - no index fallbacks, forces proper curriculum data
 */

import type { LessonStep } from '@/lib/types'

/**
 * UID version identifier
 * Increment this when changing UID generation logic to invalidate old cache
 */
export const UID_VERSION = 'v3'

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
 * Strategy (v3 - STRICT):
 * - Use step type + content identifier (REQUIRED)
 * - Hash content for collision resistance
 * - NEVER fall back to stepIndex (throw error instead)
 * - Forces proper curriculum data quality
 * 
 * Examples:
 * - v3-flashcard-salam
 * - v3-quiz-3agmcd (hashed)
 * - v3-audio-seq-k8n2m (hashed sequence)
 * - v3-final-challenge
 */
export function deriveStepUid(step: LessonStep, stepIndex: number, moduleId?: string, lessonId?: string): string {
  const type = step.type
  const location = moduleId && lessonId ? `${moduleId}/${lessonId}` : 'unknown'
  
  switch (type) {
    case 'welcome':
      // Welcome screens are always first, use fixed UID
      return `${UID_VERSION}-welcome`
    
    case 'flashcard': {
      const vocabId = (step as any).data?.vocabularyId
      if (!vocabId) {
        throw new Error(`[${location}] Flashcard step ${stepIndex} missing vocabularyId - required for stable UID`)
      }
      return `${UID_VERSION}-flashcard-${vocabId}`
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
      throw new Error(`[${location}] Quiz step ${stepIndex} missing vocabularyId or (prompt + correct) - required for stable UID`)
    }
    
    case 'input': {
      const vocabId = (step as any).data?.vocabularyId
      if (vocabId) {
        return `${UID_VERSION}-input-${vocabId}`
      }
      // Use answer as identifier if available
      const answer = (step as any).data?.answer
      if (!answer) {
        throw new Error(`[${location}] Input step ${stepIndex} missing vocabularyId or answer - required for stable UID`)
      }
      // Sanitize answer for UID (remove special chars, lowercase)
      const sanitized = answer.replace(/[^a-z0-9]/gi, '').toLowerCase()
      // Hash if too long
      const answerId = sanitized.length > 30 
        ? simpleHash(sanitized)
        : sanitized
      return `${UID_VERSION}-input-${answerId}`
    }
    
    case 'matching': {
      // Extract content from matching words for content-based UID
      const words = (step as any).data?.words
      
      if (!words || !Array.isArray(words) || words.length === 0) {
        throw new Error(`[${location}] Matching step ${stepIndex} missing words array - required for stable UID`)
      }
      
      // Create stable identifier from word texts and their slot assignments
      // Format: "word1Text:slot1Id,word2Text:slot2Id"
      const wordSlotPairs = words.map((w: any) => {
        return `${w.text || w.id}:${w.slotId || ''}`
      }).join(',')
      
      return `${UID_VERSION}-matching-${simpleHash(wordSlotPairs)}`
    }
    
    case 'audio-meaning': {
      const vocabId = (step as any).data?.vocabularyId
      if (!vocabId) {
        throw new Error(`[${location}] Audio-meaning step ${stepIndex} missing vocabularyId - required for stable UID`)
      }
      return `${UID_VERSION}-audio-meaning-${vocabId}`
    }
    
    case 'audio-sequence': {
      // Audio sequences have a sequence array of vocabulary IDs
      const sequence = (step as any).data?.sequence
      if (!sequence || !Array.isArray(sequence) || sequence.length === 0) {
        throw new Error(`[${location}] Audio-sequence step ${stepIndex} missing sequence array - required for stable UID`)
      }
      // Hash the full sequence for unique, collision-resistant identifier
      const sequenceKey = sequence.join(',')
      return `${UID_VERSION}-audio-seq-${simpleHash(sequenceKey)}`
    }
    
    case 'text-sequence': {
      // Text sequences have finglish text
      const finglish = (step as any).data?.finglishText
      if (!finglish) {
        throw new Error(`[${location}] Text-sequence step ${stepIndex} missing finglishText - required for stable UID`)
      }
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
    
    case 'final':
      // Final challenges are always last, use fixed UID
      return `${UID_VERSION}-final-challenge`
    
    case 'story-conversation': {
      // Story conversations use story ID
      const storyId = (step as any).data?.storyId
      if (!storyId) {
        throw new Error(`[${location}] Story-conversation step ${stepIndex} missing storyId - required for stable UID`)
      }
      return `${UID_VERSION}-story-${storyId}`
    }
    
    case 'grammar-intro': {
      const conceptId = (step as any).data?.conceptId
      if (!conceptId) {
        throw new Error(`[${location}] Grammar-intro step ${stepIndex} missing conceptId - required for stable UID`)
      }
      return `${UID_VERSION}-grammar-intro-${conceptId}`
    }
    
    case 'grammar-fill-blank': {
      const conceptId = (step as any).data?.conceptId
      const exercises = (step as any).data?.exercises
      if (!conceptId || !exercises || !Array.isArray(exercises) || exercises.length === 0) {
        throw new Error(`[${location}] Grammar-fill-blank step ${stepIndex} missing conceptId or exercises - required for stable UID`)
      }
      // Use first exercise's sentence + correct answer for uniqueness
      const firstExercise = exercises[0]
      const sentence = firstExercise.sentence || ''
      const correctAnswer = firstExercise.correctAnswer || (firstExercise.blanks?.[0]?.correctAnswer) || ''
      const exerciseKey = `${sentence}-${correctAnswer}`
      return `${UID_VERSION}-grammar-fill-blank-${conceptId}-${simpleHash(exerciseKey)}`
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
      throw new Error(`[${location}] Reverse-quiz step ${stepIndex} missing vocabularyId or (prompt + correct) - required for stable UID`)
    }
    
    default:
      // Unknown step type - use type + hash of data
      const dataStr = JSON.stringify((step as any).data || {})
      console.warn(`Unknown step type: ${type} in ${location}, using content hash`)
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
