/**
 * Curriculum Lexicon Cache
 * 
 * Global cache built ONCE to eliminate repeated curriculum scanning.
 * Provides O(1) vocabulary lookups and pre-computed learned-so-far data.
 * 
 * Performance: Eliminates 10-100x repeated scans in grammar-heavy lessons.
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
 * Build learned cache for a specific lesson
 * Pre-computes learned-so-far for each step index
 */
export function buildLearnedCache(
  moduleId: string,
  lessonId: string,
  steps: LessonStep[],
  lexicon: CurriculumLexicon
): LearnedCache {
  const cache: LearnedCache = {}
  
  // Base learned vocab: all vocab from previous modules + lessons + current lesson
  const baseVocabIds = getBaseVocabIds(moduleId, lessonId, lexicon)
  
  // Base connectors: all connectors from previous lessons + current lesson
  const baseConnectors = getBaseConnectors(moduleId, lessonId, lexicon)
  
  // Incremental building: each step adds to previous
  let currentVocabIds = [...baseVocabIds]
  let currentSuffixes: string[] = []
  let currentConnectors = [...baseConnectors]
  
  for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
    const step = steps[stepIndex]
    
    // Add vocab introduced by this step
    const stepVocabIds = extractVocabFromStep(step)
    for (const vocabId of stepVocabIds) {
      if (!currentVocabIds.includes(vocabId)) {
        currentVocabIds.push(vocabId)
      }
    }
    
    // Add suffixes introduced by this step
    const stepSuffixes = lexicon.suffixIntroductions[moduleId]?.[lessonId]?.[stepIndex] || []
    for (const suffix of stepSuffixes) {
      if (!currentSuffixes.includes(suffix)) {
        currentSuffixes.push(suffix)
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
 * Get base vocabulary IDs (all previous modules + lessons + current lesson)
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
    
    // Current module: add vocab from previous lessons + current lesson
    if (moduleId === currentModuleId) {
      for (const lesson of module.lessons) {
        const lessonId = lesson.id
        
        // Add vocab from previous lessons
        if (isLessonBefore(lessonId, currentLessonId)) {
          vocabIds.push(...(lexicon.moduleVocab[moduleId]?.lessonVocab[lessonId] || []))
        }
        
        // Add vocab from current lesson (base vocabulary)
        if (lessonId === currentLessonId) {
          vocabIds.push(...(lexicon.moduleVocab[moduleId]?.lessonVocab[lessonId] || []))
        }
      }
      break
    }
  }
  
  return vocabIds
}

/**
 * Get base connectors (all connectors from previous lessons + current lesson)
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
    
    // Current module: add connectors from previous lessons + current lesson
    if (moduleId === currentModuleId) {
      for (const lesson of module.lessons) {
        const lessonId = lesson.id
        
        // Add connectors from previous lessons + current lesson
        if (isLessonBefore(lessonId, currentLessonId) || lessonId === currentLessonId) {
          connectors.push(...(lexicon.connectorIntroductions[moduleId]?.[lessonId] || []))
        }
      }
      break
    }
  }
  
  // Remove duplicates
  return Array.from(new Set(connectors))
}

/**
 * Extract vocabulary IDs introduced by a step
 */
function extractVocabFromStep(step: LessonStep): string[] {
  const vocabIds: string[] = []
  
  switch (step.type) {
    case 'flashcard':
      if (step.data.vocabularyId) {
        vocabIds.push(step.data.vocabularyId)
      }
      break
    
    case 'audio-sequence':
      if (step.data.sequence) {
        vocabIds.push(...step.data.sequence)
      }
      break
    
    case 'audio-meaning':
      if (step.data.vocabularyId) {
        vocabIds.push(step.data.vocabularyId)
      }
      break
    
    case 'matching':
      if (step.data.words) {
        for (const word of step.data.words) {
          if (word.id) {
            vocabIds.push(word.id)
          }
        }
      }
      break
  }
  
  return vocabIds
}

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

