#!/usr/bin/env node

/**
 * Curriculum Validator (MODEL C)
 * 
 * READ-ONLY validator that checks curriculum consistency.
 * NEVER modifies data - only analyzes and reports.
 * 
 * MODEL C Vocabulary Introduction Rules:
 * - A vocabulary item is "introduced" if it appears in:
 *   1. The lesson's vocabulary array, OR
 *   2. The lesson's reviewVocabulary array, OR
 *   3. Any previous lesson's vocabulary array in ANY previous module
 */

import { curriculumData } from '../lib/config/curriculum';
import { grammarConcepts, getGrammarConcept } from '../lib/config/grammar-concepts';
import { Module, Lesson, LessonStep, VocabularyItem } from '../lib/types';

// ============================================
// TYPES & INTERFACES
// ============================================

interface ValidationError {
  type: 'error' | 'warning';
  check: string;
  moduleId: string;
  lessonId: string;
  stepIndex?: number;
  message: string;
  context?: string;
}

interface VocabularyInfo {
  id: string;
  en: string;
  finglish: string;
  lessonId: string;
  moduleId: string;
  lessonNumber: number;
}

interface GrammarIntroduction {
  conceptId: string;
  moduleId: string;
  lessonId: string;
  lessonNumber: number;
}

// ============================================
// GLOBAL TRACKING
// ============================================

const errors: ValidationError[] = [];
const warnings: ValidationError[] = [];
const vocabularyMap = new Map<string, VocabularyInfo>(); // id -> VocabularyInfo
const vocabularyByLesson = new Map<string, Set<string>>(); // "moduleX-lessonY" -> Set<vocabIds>
const grammarIntroductions: GrammarIntroduction[] = [];
const grammarConceptIds = new Set(grammarConcepts.map(c => c.conceptId));

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Normalize English translation to consistent style
 * - Capitalize first word only
 * - Keep proper nouns capitalized
 * - Add ? when finglish ends with '?'
 * - Remove commas except list commas
 */
function normalizeEnglish(text: string, finglish?: string): string {
  if (!text) return text;
  
  // Remove leading/trailing whitespace
  let normalized = text.trim();
  
  // Capitalize first letter
  normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
  
  // Add question mark if finglish ends with '?'
  if (finglish && finglish.trim().endsWith('?') && !normalized.endsWith('?')) {
    normalized += '?';
  }
  
  // Remove commas (except we'll keep them for now as it's complex to detect list commas)
  // For now, just ensure consistent capitalization
  
  return normalized;
}

/**
 * Normalize Finglish to consistent format
 * - Capitalize first letter of standalone words
 * - Keep hyphens inside suffixes (e.g., Khoob-i)
 * - For multi-word phrases: only capitalize first word
 * - Maintain question marks
 */
function normalizeFinglish(text: string): string {
  if (!text) return text;
  
  const trimmed = text.trim();
  
  // Check if it's a multi-word phrase (contains space)
  if (trimmed.includes(' ')) {
    // Multi-word: capitalize first word only
    const words = trimmed.split(' ');
    const firstWord = words[0];
    const rest = words.slice(1).join(' ');
    
    // Capitalize first letter of first word
    const normalizedFirst = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
    
    return `${normalizedFirst} ${rest}`;
  } else {
    // Single word: capitalize first letter
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  }
}

/**
 * Check if vocabulary ID is introduced by MODEL C rules
 */
function isVocabularyIntroduced(vocabId: string, currentModuleId: string, currentLessonId: string): boolean {
  // Check if it's in the vocabulary map (means it was introduced in a previous lesson)
  if (vocabularyMap.has(vocabId)) {
    return true;
  }
  
  // Check current lesson's vocabulary or reviewVocabulary
  const currentModule = curriculumData.find(m => m.id === currentModuleId);
  if (!currentModule) return false;
  
  const currentLesson = currentModule.lessons.find(l => l.id === currentLessonId);
  if (!currentLesson) return false;
  
  // Check vocabulary array
  if (currentLesson.vocabulary?.some(v => v.id === vocabId)) {
    return true;
  }
  
  // Check reviewVocabulary array
  if (currentLesson.reviewVocabulary?.includes(vocabId)) {
    return true;
  }
  
  return false;
}

/**
 * Extract vocabulary IDs from a step
 * FIX: Made safe for steps that don't have conversationFlow
 */
function extractVocabularyFromStep(step: any): string[] {
  const vocab: string[] = [];

  const data: any = step?.data ?? {};

  // 1. vocabularyId field
  if (typeof data.vocabularyId === "string") {
    vocab.push(data.vocabularyId);
  }

  // 2. text-sequence finglishText
  if (typeof data.finglishText === "string") {
    const tokens = data.finglishText
      .split(/\s+/)
      .map((t: string) => t.replace(/[^a-zA-Z\-?]/g, ""));
    vocab.push(...tokens);
  }

  // 3. audio-sequence vocabularyUsed
  if (Array.isArray(data.vocabularyUsed)) {
    vocab.push(...data.vocabularyUsed);
  }

  // 4. conversationFlow (safe guard)
  const cf: any = data.conversationFlow;

  // 4a. persianSequence
  if (cf && Array.isArray(cf.persianSequence)) {
    cf.persianSequence.forEach((sentence: string) => {
      const tokens = sentence
        .split(/\s+/)
        .map((t: string) => t.replace(/[^a-zA-Z\-?]/g, ""));
      vocab.push(...tokens);
    });
  }

  // 4b. choices
  if (cf && Array.isArray(cf.choices)) {
    cf.choices.forEach((choice: any) => {
      // vocabularyUsed[]
      if (Array.isArray(choice.vocabularyUsed)) {
        vocab.push(...choice.vocabularyUsed);
      }
      // text → tokenized
      if (typeof choice.text === "string") {
        const tokens = choice.text
          .split(/\s+/)
          .map((t: string) => t.replace(/[^a-zA-Z\-?]/g, ""));
        vocab.push(...tokens);
      }
    });
  }

  return vocab.filter(Boolean);
}

/**
 * Extract words from finglishText (for text-sequence validation)
 */
function extractWordsFromFinglishText(finglishText: string): string[] {
  // Simple extraction: split by spaces and normalize
  return finglishText
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.replace(/[?!.,]/g, '')) // Remove punctuation
    .filter(w => w.length > 0);
}

// ============================================
// VALIDATION CHECKS
// ============================================

/**
 * CHECK 1: Duplicate Vocabulary IDs
 */
function checkDuplicateVocabularyIds() {
  console.log('\n[CHECK 1] Scanning for duplicate vocabulary IDs...');
  
  const vocabById = new Map<string, VocabularyInfo[]>();
  
  // Collect all vocabulary items
  curriculumData.forEach(module => {
    module.lessons.forEach(lesson => {
      if (lesson.vocabulary) {
        lesson.vocabulary.forEach(vocab => {
          if (!vocabById.has(vocab.id)) {
            vocabById.set(vocab.id, []);
          }
          vocabById.get(vocab.id)!.push({
            id: vocab.id,
            en: vocab.en,
            finglish: vocab.finglish,
            lessonId: vocab.lessonId,
            moduleId: module.id,
            lessonNumber: parseInt(lesson.id.replace('lesson', '')) || 0
          });
        });
      }
    });
  });
  
  // Check for duplicates with different content
  vocabById.forEach((items, id) => {
    if (items.length > 1) {
      const first = items[0];
      const hasDifferentContent = items.some(item => 
        item.en !== first.en || item.finglish !== first.finglish
      );
      
      if (hasDifferentContent) {
        errors.push({
          type: 'error',
          check: 'DUPLICATE_VOCAB_ID',
          moduleId: 'multiple',
          lessonId: 'multiple',
          message: `Vocabulary ID "${id}" appears in multiple lessons with different content`,
          context: `Found in: ${items.map(i => `${i.moduleId}/${i.lessonId}`).join(', ')}`
        });
      }
    }
  });
  
  console.log(`  ✓ Checked ${vocabById.size} unique vocabulary IDs`);
}

/**
 * CHECK 2: Missing Vocabulary References
 */
function checkMissingVocabularyReferences() {
  console.log('\n[CHECK 2] Checking vocabulary references in steps...');
  
  curriculumData.forEach(module => {
    module.lessons.forEach(lesson => {
      lesson.steps.forEach((step, stepIndex) => {
        const vocabIds = extractVocabularyFromStep(step);
        
        vocabIds.forEach(vocabId => {
          if (!isVocabularyIntroduced(vocabId, module.id, lesson.id)) {
            errors.push({
              type: 'error',
              check: 'MISSING_VOCAB_REF',
              moduleId: module.id,
              lessonId: lesson.id,
              stepIndex,
              message: `Vocabulary ID "${vocabId}" referenced but not introduced`,
              context: `Step type: ${step.type}`
            });
          }
        });
        
        // Special check for text-sequence: extract words from finglishText
        if (step.type === 'text-sequence' && 'finglishText' in step.data) {
          const words = extractWordsFromFinglishText(step.data.finglishText);
          words.forEach(word => {
            // Check if word matches any vocabulary ID (case-insensitive)
            const matchingVocab = Array.from(vocabularyMap.keys()).find(
              vid => vid.toLowerCase() === word.toLowerCase()
            );
            
            if (matchingVocab && !isVocabularyIntroduced(matchingVocab, module.id, lesson.id)) {
              warnings.push({
                type: 'warning',
                check: 'MISSING_VOCAB_IN_TEXT',
                moduleId: module.id,
                lessonId: lesson.id,
                stepIndex,
                message: `Word "${word}" in finglishText may reference vocabulary "${matchingVocab}" that's not introduced`,
                context: `finglishText: "${step.data.finglishText}"`
              });
            }
          });
        }
      });
    });
  });
  
  console.log(`  ✓ Checked vocabulary references in all steps`);
}

/**
 * CHECK 3: Bad lessonId Format
 */
function checkLessonIdFormat() {
  console.log('\n[CHECK 3] Validating lessonId format...');
  
  const lessonIdRegex = /^module\d+-lesson\d+$/;
  
  curriculumData.forEach(module => {
    module.lessons.forEach(lesson => {
      if (lesson.vocabulary) {
        lesson.vocabulary.forEach(vocab => {
          if (!lessonIdRegex.test(vocab.lessonId)) {
            errors.push({
              type: 'error',
              check: 'BAD_LESSON_ID_FORMAT',
              moduleId: module.id,
              lessonId: lesson.id,
              message: `Vocabulary "${vocab.id}" has invalid lessonId format: "${vocab.lessonId}"`,
              context: `Expected format: module{X}-lesson{Y}`
            });
          }
        });
      }
    });
  });
  
  console.log(`  ✓ Validated all lessonId formats`);
}

/**
 * CHECK 4: Grammar Concept Validation
 */
function checkGrammarConcepts() {
  console.log('\n[CHECK 4] Validating grammar concept references...');
  
  curriculumData.forEach(module => {
    module.lessons.forEach(lesson => {
      lesson.steps.forEach((step, stepIndex) => {
        if (step.type === 'grammar-intro' || step.type === 'grammar-fill-blank') {
          const conceptId = (step.data as any).conceptId;
          if (conceptId && !grammarConceptIds.has(conceptId)) {
            errors.push({
              type: 'error',
              check: 'MISSING_GRAMMAR_CONCEPT',
              moduleId: module.id,
              lessonId: lesson.id,
              stepIndex,
              message: `Grammar concept "${conceptId}" referenced but not found in grammar-concepts.ts`,
              context: `Step type: ${step.type}`
            });
          }
        }
      });
    });
  });
  
  console.log(`  ✓ Validated all grammar concept references`);
}

/**
 * CHECK 5: Grammar Order Validation
 */
function checkGrammarOrder() {
  console.log('\n[CHECK 5] Checking grammar introduction order...');
  
  // First pass: collect all grammar introductions
  curriculumData.forEach(module => {
    module.lessons.forEach(lesson => {
      const lessonNumber = parseInt(lesson.id.replace('lesson', '')) || 0;
      lesson.steps.forEach((step, stepIndex) => {
        if (step.type === 'grammar-intro') {
          const conceptId = (step.data as any).conceptId;
          grammarIntroductions.push({
            conceptId,
            moduleId: module.id,
            lessonId: lesson.id,
            lessonNumber
          });
        }
      });
    });
  });
  
  // Second pass: check grammar-fill-blank steps
  curriculumData.forEach((module, moduleIndex) => {
    module.lessons.forEach(lesson => {
      const lessonNumber = parseInt(lesson.id.replace('lesson', '')) || 0;
      lesson.steps.forEach((step, stepIndex) => {
        if (step.type === 'grammar-fill-blank') {
          const conceptId = (step.data as any).conceptId;
          
          // Check if this concept was introduced before
          // Find the introduction that comes before this step
          let foundIntroduction = false;
          
          for (const intro of grammarIntroductions) {
            if (intro.conceptId === conceptId) {
              // Check if introduction comes before current step
              const introModuleIndex = curriculumData.findIndex(m => m.id === intro.moduleId);
              
              if (introModuleIndex < moduleIndex) {
                // Introduction is in an earlier module
                foundIntroduction = true;
                break;
              } else if (introModuleIndex === moduleIndex) {
                // Same module - check lesson number
                if (intro.lessonNumber < lessonNumber) {
                  foundIntroduction = true;
                  break;
                }
              }
            }
          }
          
          if (!foundIntroduction) {
            errors.push({
              type: 'error',
              check: 'EARLY_GRAMMAR_USE',
              moduleId: module.id,
              lessonId: lesson.id,
              stepIndex,
              message: `Grammar concept "${conceptId}" used before introduction`,
              context: `grammar-fill-blank step uses concept before grammar-intro`
            });
          }
        }
      });
    });
  });
  
  console.log(`  ✓ Found ${grammarIntroductions.length} grammar introductions`);
}

/**
 * CHECK 6: maxWordBankSize Check
 */
function checkMaxWordBankSize() {
  console.log('\n[CHECK 6] Checking maxWordBankSize in text-sequence steps...');
  
  curriculumData.forEach(module => {
    module.lessons.forEach(lesson => {
      lesson.steps.forEach((step, stepIndex) => {
        if (step.type === 'text-sequence') {
          const data = step.data as any;
          if (data.maxWordBankSize === undefined || data.maxWordBankSize === null) {
            warnings.push({
              type: 'warning',
              check: 'MISSING_MAX_WORD_BANK_SIZE',
              moduleId: module.id,
              lessonId: lesson.id,
              stepIndex,
              message: `text-sequence step missing maxWordBankSize`,
              context: `finglishText: "${data.finglishText}"`
            });
          }
        }
      });
    });
  });
  
  console.log(`  ✓ Checked all text-sequence steps`);
}

/**
 * CHECK 7: English Translation Style Consistency
 */
function checkEnglishTranslationStyle() {
  console.log('\n[CHECK 7] Checking English translation style consistency...');
  
  curriculumData.forEach(module => {
    module.lessons.forEach(lesson => {
      lesson.steps.forEach((step, stepIndex) => {
        if (step.type === 'text-sequence' || step.type === 'audio-sequence') {
          const data = step.data as any;
          if (data.expectedTranslation) {
            const normalized = normalizeEnglish(
              data.expectedTranslation,
              data.finglishText || data.sequence?.[0]
            );
            
            if (data.expectedTranslation !== normalized) {
              warnings.push({
                type: 'warning',
                check: 'ENGLISH_STYLE_INCONSISTENCY',
                moduleId: module.id,
                lessonId: lesson.id,
                stepIndex,
                message: `English translation style inconsistent`,
                context: `Current: "${data.expectedTranslation}" | Expected: "${normalized}"`
              });
            }
          }
        }
        
        // Also check final step conversationFlow
        if (step.type === 'final' && step.data.conversationFlow?.expectedPhrase) {
          const expectedPhrase = step.data.conversationFlow.expectedPhrase;
          const normalized = normalizeEnglish(expectedPhrase);
          
          if (expectedPhrase !== normalized) {
            warnings.push({
              type: 'warning',
              check: 'ENGLISH_STYLE_INCONSISTENCY',
              moduleId: module.id,
              lessonId: lesson.id,
              stepIndex,
              message: `Final step expectedPhrase style inconsistent`,
              context: `Current: "${expectedPhrase}" | Expected: "${normalized}"`
            });
          }
        }
      });
    });
  });
  
  console.log(`  ✓ Checked English translation styles`);
}

/**
 * CHECK 8: Finglish Format Consistency
 */
function checkFinglishFormat() {
  console.log('\n[CHECK 8] Checking Finglish format consistency...');
  
  // Check vocabulary items
  curriculumData.forEach(module => {
    module.lessons.forEach(lesson => {
      if (lesson.vocabulary) {
        lesson.vocabulary.forEach((vocab, vocabIndex) => {
          const normalized = normalizeFinglish(vocab.finglish);
          
          if (vocab.finglish !== normalized) {
            warnings.push({
              type: 'warning',
              check: 'FINGLISH_FORMAT_INCONSISTENCY',
              moduleId: module.id,
              lessonId: lesson.id,
              message: `Vocabulary "${vocab.id}" finglish format inconsistent`,
              context: `Current: "${vocab.finglish}" | Expected: "${normalized}"`
            });
          }
        });
      }
    });
  });
  
  // Check text-sequence steps
  curriculumData.forEach(module => {
    module.lessons.forEach(lesson => {
      lesson.steps.forEach((step, stepIndex) => {
        if (step.type === 'text-sequence' && 'finglishText' in step.data) {
          const finglishText = step.data.finglishText;
          const normalized = normalizeFinglish(finglishText);
          
          if (finglishText !== normalized) {
            warnings.push({
              type: 'warning',
              check: 'FINGLISH_FORMAT_INCONSISTENCY',
              moduleId: module.id,
              lessonId: lesson.id,
              stepIndex,
              message: `text-sequence finglishText format inconsistent`,
              context: `Current: "${finglishText}" | Expected: "${normalized}"`
            });
          }
        }
      });
    });
  });
  
  console.log(`  ✓ Checked Finglish format consistency`);
}

// ============================================
// MAIN VALIDATION FLOW
// ============================================

function main() {
  console.log('===========================================');
  console.log('CURRICULUM VALIDATOR (MODEL C)');
  console.log('===========================================');
  console.log('\n📚 Loading curriculum data...');
  
  // Build vocabulary map (MODEL C: track all vocabulary introduced so far)
  curriculumData.forEach(module => {
    module.lessons.forEach(lesson => {
      const lessonKey = `${module.id}-${lesson.id}`;
      const vocabSet = new Set<string>();
      
      if (lesson.vocabulary) {
        lesson.vocabulary.forEach(vocab => {
          vocabSet.add(vocab.id);
          
          // Add to global vocabulary map if not already present
          if (!vocabularyMap.has(vocab.id)) {
            vocabularyMap.set(vocab.id, {
              id: vocab.id,
              en: vocab.en,
              finglish: vocab.finglish,
              lessonId: vocab.lessonId,
              moduleId: module.id,
              lessonNumber: parseInt(lesson.id.replace('lesson', '')) || 0
            });
          }
        });
      }
      
      if (lesson.reviewVocabulary) {
        lesson.reviewVocabulary.forEach(vocabId => {
          vocabSet.add(vocabId);
        });
      }
      
      vocabularyByLesson.set(lessonKey, vocabSet);
    });
  });
  
  console.log(`  ✓ Loaded ${curriculumData.length} modules`);
  console.log(`  ✓ Loaded ${vocabularyMap.size} unique vocabulary items`);
  console.log(`  ✓ Loaded ${grammarConcepts.length} grammar concepts`);
  
  // Run all validation checks
  checkDuplicateVocabularyIds();
  checkLessonIdFormat();
  checkGrammarConcepts();
  checkGrammarOrder();
  checkMaxWordBankSize();
  checkMissingVocabularyReferences();
  checkEnglishTranslationStyle();
  checkFinglishFormat();
  
  // ============================================
  // SUMMARY OUTPUT
  // ============================================
  
  console.log('\n===========================================');
  console.log('VALIDATION SUMMARY');
  console.log('===========================================');
  
  const totalModules = curriculumData.length;
  const totalLessons = curriculumData.reduce((sum, m) => sum + m.lessons.length, 0);
  const totalVocabItems = vocabularyMap.size;
  const totalSteps = curriculumData.reduce((sum, m) => 
    sum + m.lessons.reduce((s, l) => s + l.steps.length, 0), 0
  );
  const totalErrors = errors.length;
  const totalWarnings = warnings.length;
  
  console.log('\n📊 Statistics:');
  console.log(`   Total modules:        ${totalModules}`);
  console.log(`   Total lessons:        ${totalLessons}`);
  console.log(`   Total vocab items:    ${totalVocabItems}`);
  console.log(`   Total steps:          ${totalSteps}`);
  console.log(`   Grammar concepts:     ${grammarConcepts.length}`);
  
  console.log('\n❌ ERRORS (must fix):');
  if (errors.length === 0) {
    console.log('   ✓ No errors found!');
  } else {
    errors.forEach((error, index) => {
      console.log(`\n   [${index + 1}] ${error.check}`);
      console.log(`       Module: ${error.moduleId}`);
      console.log(`       Lesson: ${error.lessonId}`);
      if (error.stepIndex !== undefined) {
        console.log(`       Step: ${error.stepIndex}`);
      }
      console.log(`       Message: ${error.message}`);
      if (error.context) {
        console.log(`       Context: ${error.context}`);
      }
    });
  }
  
  console.log('\n⚠️  WARNINGS (should fix):');
  if (warnings.length === 0) {
    console.log('   ✓ No warnings found!');
  } else {
    warnings.forEach((warning, index) => {
      console.log(`\n   [${index + 1}] ${warning.check}`);
      console.log(`       Module: ${warning.moduleId}`);
      console.log(`       Lesson: ${warning.lessonId}`);
      if (warning.stepIndex !== undefined) {
        console.log(`       Step: ${warning.stepIndex}`);
      }
      console.log(`       Message: ${warning.message}`);
      if (warning.context) {
        console.log(`       Context: ${warning.context}`);
      }
    });
  }
  
  console.log('\n===========================================');
  console.log(`Total Errors:   ${totalErrors}`);
  console.log(`Total Warnings: ${totalWarnings}`);
  console.log('===========================================\n');
  
  // Exit with error code if errors exist
  process.exit(totalErrors > 0 ? 1 : 0);
}

// Run validation
main();

