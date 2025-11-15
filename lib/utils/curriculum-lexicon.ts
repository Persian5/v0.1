/**
 * Curriculum Lexicon Cache
 * 
 * ============================================================================
 * ARCHITECTURE & REQUIREMENTS FOR ADDING NEW GRAMMAR TYPES
 * ============================================================================
 * 
 * This cache pre-computes vocabulary, suffixes, and connectors from the
 * entire curriculum to eliminate repeated scanning.
 * 
 * TO ADD TRACKING FOR NEW GRAMMAR TYPE (e.g., "prefixes"):
 * 
 * 1. Update CurriculumLexicon interface (line 17):
 *    prefixIntroductions: {
 *      [moduleId: string]: {
 *        [lessonId: string]: {
 *          [stepIndex: number]: string[]
 *        }
 *      }
 *    }
 * 
 * 2. Update buildCurriculumLexicon() (after line 60):
 *    const prefixIntroductions: CurriculumLexicon['prefixIntroductions'] = {}
 *    // ... initialize in module loop
 *    
 *    // Extract prefix introductions from grammar steps
 *    prefixIntroductions[moduleId][lessonId] = {}
 *    if (lesson.steps) {
 *      for (let stepIndex = 0; stepIndex < lesson.steps.length; stepIndex++) {
 *        const step = lesson.steps[stepIndex]
 *        if (step.type === 'grammar-fill-blank' && step.data.exercises) {
 *          const stepPrefixes: string[] = []
 *          for (const exercise of step.data.exercises) {
 *            if (exercise.prefixOptions) {
 *              for (const option of exercise.prefixOptions) {
 *                if (option.id.startsWith('prefix-')) {
 *                  const prefix = option.id.replace('prefix-', '')
 *                  if (!stepPrefixes.includes(prefix)) {
 *                    stepPrefixes.push(prefix)
 *                  }
 *                }
 *              }
 *            }
 *          }
 *          if (stepPrefixes.length > 0) {
 *            prefixIntroductions[moduleId][lessonId][stepIndex] = stepPrefixes
 *          }
 *        }
 *      }
 *    }
 * 
 * 3. Update LearnedSoFar interface (line 48):
 *    prefixes?: string[]
 * 
 * 4. Update buildLearnedCache() (line 100):
 *    let currentPrefixes: string[] = []
 *    // ... track prefixes similar to suffixes
 *    cache[stepIndex] = {
 *      vocabIds: [...currentVocabIds],
 *      suffixes: [...currentSuffixes],
 *      connectors: [...currentConnectors],
 *      prefixes: [...currentPrefixes]  // ← ADD
 *    }
 * 
 * ============================================================================
 * WHEN TO UPDATE THIS FILE
 * ============================================================================
 * 
 * Update ONLY if:
 * - New grammar type introduces vocab/suffixes/connectors/prefixes via grammar steps
 * - Need to track when grammar concepts are introduced
 * - Need to build learned-so-far cache for new grammar type
 * 
 * DO NOT update if:
 * - Just adding a new blank type that uses existing vocab/suffixes
 * - Adding a new step type that doesn't introduce grammar concepts
 * - Changing UI/UX only
 * 
 * ============================================================================
 * CACHING STRATEGY
 * ============================================================================
 * 
 * Global Lexicon (built once):
 * - Scans entire curriculum ONCE
 * - Stores vocab, module vocab, lesson vocab
 * - Stores suffix/connector introduction maps
 * - Reused across all lessons
 * 
 * Learned Cache (built per lesson):
 * - Uses global lexicon for lookups
 * - Builds incrementally (step 0 → step N)
 * - Each step adds vocab/suffixes/connectors introduced at that step
 * - Passed to components as learnedSoFar prop
 * 
 * Performance: O(1) lookups instead of O(n) scans
 * 
 * ============================================================================
 */

import { VocabularyItem, Module, LessonStep } from '../types'
import { getModules } from '../config/curriculum'

// ============================================================================
// TYPES
// ============================================================================

export interface CurriculumLexicon {
  // Flat vocabulary registry (O(1) lookups)
  allVocabIds: string[]
  allVocabMap: Map<string, VocabularyItem>
  
  // Hierarchical organization
  moduleVocab: {
    [moduleId: string]: {
      allVocabIds: string[]
      lessonVocab: {
        [lessonId: string]: string[]
      }
    }
  }
  
  // Grammar tracking
  suffixIntroductions: {
    [moduleId: string]: {
      [lessonId: string]: {
        [stepIndex: number]: string[]
      }
    }
  }
  
  connectorIntroductions: {
    [moduleId: string]: {
      [lessonId: string]: string[]
    }
  }
}

export interface LearnedSoFar {
  vocabIds: string[]
  suffixes: string[]
  connectors: string[]
}

export interface LearnedCache {
  [stepIndex: number]: LearnedSoFar
}

// ============================================================================
// GLOBAL CACHE (MODULE-SCOPED)
// ============================================================================

let globalLexicon: CurriculumLexicon | null = null

/**
 * Get or build the global curriculum lexicon cache
 * Built once and reused across all lessons
 */
export function getCurriculumLexicon(): CurriculumLexicon {
  if (globalLexicon) {
    return globalLexicon
  }
  
  globalLexicon = buildCurriculumLexicon()
  return globalLexicon
}

/**
 * Force rebuild of global lexicon (for testing or curriculum updates)
 */
export function resetCurriculumLexicon(): void {
  globalLexicon = null
}

// ============================================================================
// LEXICON BUILDER
// ============================================================================

function buildCurriculumLexicon(): CurriculumLexicon {
  const modules = getModules()
  
  const allVocabIds: string[] = []
  const allVocabMap = new Map<string, VocabularyItem>()
  const moduleVocab: CurriculumLexicon['moduleVocab'] = {}
  const suffixIntroductions: CurriculumLexicon['suffixIntroductions'] = {}
  const connectorIntroductions: CurriculumLexicon['connectorIntroductions'] = {}
  
  // Scan all modules
  for (const module of modules) {
    const moduleId = module.id
    moduleVocab[moduleId] = {
      allVocabIds: [],
      lessonVocab: {}
    }
    suffixIntroductions[moduleId] = {}
    connectorIntroductions[moduleId] = {}
    
    // Scan all lessons
    for (const lesson of module.lessons) {
      const lessonId = lesson.id
      const lessonVocabIds: string[] = []
      
      // Extract lesson vocabulary
      if (lesson.vocabulary) {
        for (const vocab of lesson.vocabulary) {
          allVocabIds.push(vocab.id)
          allVocabMap.set(vocab.id, vocab)
          lessonVocabIds.push(vocab.id)
          moduleVocab[moduleId].allVocabIds.push(vocab.id)
        }
      }
      
      moduleVocab[moduleId].lessonVocab[lessonId] = lessonVocabIds
      
      // Extract suffix introductions from grammar steps
      suffixIntroductions[moduleId][lessonId] = {}
      
      if (lesson.steps) {
        for (let stepIndex = 0; stepIndex < lesson.steps.length; stepIndex++) {
          const step = lesson.steps[stepIndex]
          
          if (step.type === 'grammar-fill-blank' && step.data.exercises) {
            const stepSuffixes: string[] = []
            
            for (const exercise of step.data.exercises) {
              if (exercise.suffixOptions) {
                for (const option of exercise.suffixOptions) {
                  // Extract suffix from ID: "suffix-am" → "am"
                  if (option.id.startsWith('suffix-')) {
                    const suffix = option.id.replace('suffix-', '')
                    if (!stepSuffixes.includes(suffix)) {
                      stepSuffixes.push(suffix)
                    }
                  }
                }
              }
            }
            
            if (stepSuffixes.length > 0) {
              suffixIntroductions[moduleId][lessonId][stepIndex] = stepSuffixes
            }
          }
        }
      }
      
      // Extract connector introductions
      const lessonConnectors: string[] = []
      
      // From lesson vocabulary (connectors are vocab items)
      if (lesson.vocabulary) {
        for (const vocab of lesson.vocabulary) {
          if (['va', 'ham', 'vali'].includes(vocab.id)) {
            if (!lessonConnectors.includes(vocab.id)) {
              lessonConnectors.push(vocab.id)
            }
          }
        }
      }
      
      // From grammar steps (wordOptions with conn- prefix)
      if (lesson.steps) {
        for (const step of lesson.steps) {
          if (step.type === 'grammar-fill-blank' && step.data.exercises) {
            for (const exercise of step.data.exercises) {
              if (exercise.wordOptions) {
                for (const option of exercise.wordOptions) {
                  // Extract connector from ID: "conn-vali" → "vali"
                  if (option.id.startsWith('conn-')) {
                    const connector = option.id.replace('conn-', '')
                    if (!lessonConnectors.includes(connector)) {
                      lessonConnectors.push(connector)
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      connectorIntroductions[moduleId][lessonId] = lessonConnectors
    }
  }
  
  return {
    allVocabIds,
    allVocabMap,
    moduleVocab,
    suffixIntroductions,
    connectorIntroductions
  }
}

// ============================================================================
// LEARNED CACHE BUILDER
// ============================================================================

/**
 * CURRENT BEHAVIOR (FIXED):
 * - Step 0 starts with ONLY vocabulary from PREVIOUS modules/lessons
 * - Does NOT include current lesson's vocabulary array upfront
 * - Vocabulary is added step-by-step as flashcards/audio-meaning steps introduce them
 * - Grammar suffixes/connectors are added when grammar-intro steps occur
 * 
 * PREVIOUS BUG (NOW FIXED):
 * - getBaseVocabIds used to include current lesson's vocabulary array,
 *   causing step 0 to have all lesson vocab immediately (incorrect)
 */
export function buildLearnedCache(
  moduleId: string,
  lessonId: string,
  steps: LessonStep[],
  lexicon: CurriculumLexicon
): LearnedCache {
  const cache: LearnedCache = {}
  
  // Base learned state: ONLY from PREVIOUS modules/lessons (NOT current lesson)
  const baseVocabIds = getBaseVocabIds(moduleId, lessonId, lexicon)
  const baseSuffixes = getBaseSuffixes(moduleId, lessonId, lexicon)
  const baseConnectors = getBaseConnectors(moduleId, lessonId, lexicon)
  
  // Incremental building: each step adds new introductions
  let currentVocabIds = [...baseVocabIds]
  let currentSuffixes = [...baseSuffixes]
  let currentConnectors = [...baseConnectors]
  
  for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
    const step = steps[stepIndex]
    
    // Get what this step introduces
    const introductions = getIntroductionsFromStep(step, lexicon, moduleId, lessonId, stepIndex)
    
    // Add new vocab (deduplicate)
    for (const vocabId of introductions.vocabIds) {
      if (!currentVocabIds.includes(vocabId)) {
        currentVocabIds.push(vocabId)
      }
    }
    
    // Add new suffixes (deduplicate)
    for (const suffix of introductions.suffixes) {
      if (!currentSuffixes.includes(suffix)) {
        currentSuffixes.push(suffix)
      }
    }
    
    // Add new connectors (deduplicate)
    for (const connector of introductions.connectors) {
      if (!currentConnectors.includes(connector)) {
        currentConnectors.push(connector)
      }
    }
    
    // Store snapshot for this step
    cache[stepIndex] = {
      vocabIds: [...currentVocabIds],
      suffixes: [...currentSuffixes],
      connectors: [...currentConnectors]
    }
  }
  
  return cache
}

/**
 * Get base vocabulary IDs (all previous modules + lessons ONLY, NOT current lesson)
 * FIX: Removed current lesson's vocabulary from base — it's added step-by-step instead
 */
function getBaseVocabIds(
  currentModuleId: string,
  currentLessonId: string,
  lexicon: CurriculumLexicon
): string[] {
  const vocabIds: string[] = []
  const modules = getModules()
  
  for (const module of modules) {
    const moduleId = module.id
    
    // Add all vocab from previous modules
    if (isModuleBefore(moduleId, currentModuleId)) {
      vocabIds.push(...(lexicon.moduleVocab[moduleId]?.allVocabIds || []))
      continue
    }
    
    // Current module: add vocab from PREVIOUS lessons ONLY (NOT current lesson)
    if (moduleId === currentModuleId) {
      for (const lesson of module.lessons) {
        const lessonId = lesson.id
        
        // Add vocab from previous lessons only
        if (isLessonBefore(lessonId, currentLessonId)) {
          vocabIds.push(...(lexicon.moduleVocab[moduleId]?.lessonVocab[lessonId] || []))
        }
        
        // DO NOT add current lesson vocab — that's added step-by-step
      }
      break
    }
  }
  
  return vocabIds
}

/**
 * Get base suffixes (all suffixes from previous lessons ONLY, NOT current lesson)
 * FIX: Added to properly track suffixes from previous lessons
 */
function getBaseSuffixes(
  currentModuleId: string,
  currentLessonId: string,
  lexicon: CurriculumLexicon
): string[] {
  const suffixes: string[] = []
  const modules = getModules()
  
  for (const module of modules) {
    const moduleId = module.id
    
    // Add all suffixes from previous modules
    if (isModuleBefore(moduleId, currentModuleId)) {
      const moduleSuffixIntros = lexicon.suffixIntroductions[moduleId] || {}
      for (const lessonId in moduleSuffixIntros) {
        const lessonSuffixIntros = moduleSuffixIntros[lessonId] || {}
        for (const stepIndex in lessonSuffixIntros) {
          suffixes.push(...lessonSuffixIntros[stepIndex])
        }
      }
      continue
    }
    
    // Current module: add suffixes from PREVIOUS lessons ONLY
    if (moduleId === currentModuleId) {
      for (const lesson of module.lessons) {
        const lessonId = lesson.id
        
        // Add suffixes from previous lessons only
        if (isLessonBefore(lessonId, currentLessonId)) {
          const lessonSuffixIntros = lexicon.suffixIntroductions[moduleId]?.[lessonId] || {}
          for (const stepIndex in lessonSuffixIntros) {
            suffixes.push(...lessonSuffixIntros[stepIndex])
          }
        }
        
        // DO NOT add current lesson suffixes — that's added step-by-step
      }
      break
    }
  }
  
  // Remove duplicates
  return Array.from(new Set(suffixes))
}

/**
 * Get base connectors (all connectors from previous lessons ONLY, NOT current lesson)
 * FIX: Removed current lesson's connectors from base — they're added step-by-step instead
 */
function getBaseConnectors(
  currentModuleId: string,
  currentLessonId: string,
  lexicon: CurriculumLexicon
): string[] {
  const connectors: string[] = []
  const modules = getModules()
  
  for (const module of modules) {
    const moduleId = module.id
    
    // Add all connectors from previous modules
    if (isModuleBefore(moduleId, currentModuleId)) {
      for (const lesson of module.lessons) {
        connectors.push(...(lexicon.connectorIntroductions[moduleId]?.[lesson.id] || []))
      }
      continue
    }
    
    // Current module: add connectors from PREVIOUS lessons ONLY (NOT current lesson)
    if (moduleId === currentModuleId) {
      for (const lesson of module.lessons) {
        const lessonId = lesson.id
        
        // Add connectors from previous lessons only
        if (isLessonBefore(lessonId, currentLessonId)) {
          connectors.push(...(lexicon.connectorIntroductions[moduleId]?.[lessonId] || []))
        }
        
        // DO NOT add current lesson connectors — that's added step-by-step
      }
      break
    }
  }
  
  // Remove duplicates
  return Array.from(new Set(connectors))
}

/**
 * Step Introduction Result
 * Represents what new items a single step introduces
 */
interface StepIntroduction {
  vocabIds: string[]
  suffixes: string[]
  connectors: string[]
}

/**
 * Determine what vocabulary, suffixes, and connectors a step introduces
 * 
 * STEP TYPE INTRODUCTION RULES:
 * 
 * VOCABULARY INTRODUCTION:
 * - flashcard: ONLY step type that introduces vocabulary (if vocabularyId present)
 * 
 * GRAMMAR INTRODUCTION:
 * - grammar-fill-blank: Introduces suffixes tracked in lexicon for this step
 * - grammar-intro: May introduce suffixes/connectors (future, tracked via lexicon)
 * 
 * PRACTICE-ONLY (NO INTRODUCTIONS):
 * - welcome, audio-meaning, audio-sequence, text-sequence, matching
 * - quiz, reverse-quiz, input, final, story-conversation
 */
function getIntroductionsFromStep(
  step: LessonStep,
  lexicon: CurriculumLexicon,
  moduleId: string,
  lessonId: string,
  stepIndex: number
): StepIntroduction {
  const vocabIds: string[] = []
  const suffixes: string[] = []
  const connectors: string[] = []
  
  switch (step.type) {
    case 'flashcard':
      // ONLY flashcards introduce new vocabulary
      if (step.data?.vocabularyId) {
        vocabIds.push(step.data.vocabularyId)
      }
      break
    
    case 'grammar-fill-blank':
      // Grammar fill-blank introduces suffixes tracked in lexicon
      const stepSuffixes = lexicon.suffixIntroductions[moduleId]?.[lessonId]?.[stepIndex] || []
      suffixes.push(...stepSuffixes)
      break
    
    case 'grammar-intro':
      // Grammar intro doesn't introduce vocab, but may introduce suffixes/connectors
      // (Currently tracked at grammar-fill-blank step level in lexicon)
      // Future: Could extract from conceptId if needed
      break
    
    // All other step types are practice/review only (no introductions)
    case 'audio-meaning':
    case 'audio-sequence':
    case 'matching':
    case 'welcome':
    case 'text-sequence':
    case 'quiz':
    case 'reverse-quiz':
    case 'input':
    case 'final':
    case 'story-conversation':
    default:
      // No introductions - practice only
      break
  }
  
  return {
    vocabIds,
    suffixes,
    connectors
  }
}

// ============================================================================
// STANDALONE HELPER FOR EXTERNAL USE
// ============================================================================

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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if moduleA comes before moduleB (lexicographic comparison)
 */
function isModuleBefore(moduleA: string, moduleB: string): boolean {
  // Extract module numbers: "module1" → 1, "module2" → 2
  const numA = parseInt(moduleA.replace('module', ''), 10)
  const numB = parseInt(moduleB.replace('module', ''), 10)
  return numA < numB
}

/**
 * Check if lessonA comes before lessonB (lexicographic comparison)
 */
function isLessonBefore(lessonA: string, lessonB: string): boolean {
  // Extract lesson numbers: "lesson1" → 1, "lesson2" → 2
  const numA = parseInt(lessonA.replace('lesson', ''), 10)
  const numB = parseInt(lessonB.replace('lesson', ''), 10)
  return numA < numB
}

