import { VocabularyItem } from '../types';
import { getLesson, generateCompleteReviewVocabulary } from '../config/curriculum';
import { getSemanticGroup, getRelatedGroups, getVocabIdsInGroup } from '../config/semantic-groups';
import { WordBankService } from './word-bank-service';
import { getCurriculumLexicon } from '../utils/curriculum-lexicon';

/**
 * VocabularyContentService (formerly VocabularyService)
 * 
 * PURE CONTENT SERVICE
 * This service is responsible for retrieving vocabulary DATA from the curriculum.
 * 
 * DEPRECATED TRACKING:
 * - User progress tracking has been moved to VocabularyTrackingService (Supabase).
 * - Lesson completion has been moved to LessonProgressService (Supabase).
 * - LocalStorage tracking methods have been removed to prevent "split brain" data issues.
 */

export class VocabularyService {
  
  // Get vocabulary for a specific lesson
  static getLessonVocabulary(moduleId: string, lessonId: string): VocabularyItem[] {
    const lesson = getLesson(moduleId, lessonId);
    return lesson?.vocabulary || [];
  }

  // Get all vocabulary from a specific module
  static getModuleVocabulary(moduleId: string): VocabularyItem[] {
    const { getModule } = require('../config/curriculum');
    const module = getModule(moduleId);
    
    if (!module) {
      return [];
    }
    
    const moduleVocabulary: VocabularyItem[] = [];
    
    // Aggregate vocabulary from all lessons in the module
    for (const lesson of module.lessons) {
      if (lesson.vocabulary) {
        moduleVocabulary.push(...lesson.vocabulary);
  }
    }
    
    return moduleVocabulary;
  }

  // Get review vocabulary for a lesson (from previous lessons)
  // AUTO-GENERATED: Automatically includes all vocabulary from previous lessons in the module
  static getReviewVocabulary(moduleId: string, lessonId: string): VocabularyItem[] {
    const lesson = getLesson(moduleId, lessonId);
    if (!lesson) return [];
    
    // Auto-generate review vocabulary IDs from previous lessons
    const lessonNum = parseInt(lessonId.replace('lesson', ''));
    if (isNaN(lessonNum) || lessonNum < 1) return [];
    
    // Use manual array if provided (backward compatibility), otherwise auto-generate
    const reviewIds = lesson.reviewVocabulary && lesson.reviewVocabulary.length > 0
      ? lesson.reviewVocabulary  // Use manual if exists (backward compat)
      : generateCompleteReviewVocabulary(moduleId, lessonNum);  // Auto-generate otherwise
    
    // Get vocabulary items from all previous lessons that match review IDs
    const allVocab: VocabularyItem[] = [];
    
    reviewIds.forEach((reviewId: string) => {
      // Use the new public findVocabularyById method
      const vocab = this.findVocabularyById(reviewId);
      if (vocab) allVocab.push(vocab);
    });
    
    return allVocab;
  }

  // NEW METHODS FOR DYNAMIC REMEDIATION

  // Find vocabulary item by ID across all curriculum (make public)
  // OPTIMIZED: Uses O(1) map lookup instead of O(n) scan
  static findVocabularyById(vocabId: string): VocabularyItem | undefined {
    const lexicon = getCurriculumLexicon();
    return lexicon.allVocabMap.get(vocabId);
  }

  // SYSTEMATIC METHOD: Get all vocabulary from entire curriculum
  // This ensures vocabulary extraction can work for any word mentioned in any quiz,
  // regardless of lesson boundaries (following DEVELOPMENT_RULES.md scalability)
  static getAllCurriculumVocabulary(): VocabularyItem[] {
    const allModules = require('../config/curriculum').getModules();
    const allVocabulary: VocabularyItem[] = [];
    
    for (const module of allModules) {
      for (const lesson of module.lessons) {
        if (lesson.vocabulary) {
          allVocabulary.push(...lesson.vocabulary);
        }
      }
    }
    
    return allVocabulary;
  }

  // Generate contextual quiz options for a vocabulary item
  /**
   * Generate quiz options with semantic distractors (70% same group, 30% related)
   * Uses WordBankService semantic distractor logic for consistency
   * 
   * @param deterministic - If true, uses vocabulary ID as seed for stable shuffle order
   */
  static generateQuizOptions(targetVocab: VocabularyItem, allVocab: VocabularyItem[], deterministic: boolean = false): { text: string, correct: boolean }[] {
    // Create correct answer (normalized)
    const correctText = WordBankService.normalizeVocabEnglish(targetVocab.en);
    const options = [
      { text: correctText, correct: true }
    ];

    // Use semantic distractor generation (same as WordBankService)
    const correctItem = {
      vocabularyId: targetVocab.id,
      wordText: correctText,
      isPhrase: correctText.split(' ').length > 1,
      semanticGroup: targetVocab.semanticGroup || getSemanticGroup(targetVocab.id),
      isCorrect: true
    };

    // Generate 3 semantic distractors
    const distractors = this.generateSemanticDistractors([correctItem], allVocab, 3);

    // Add distractors as incorrect options
    distractors.forEach(distractor => {
      options.push({ text: distractor.wordText, correct: false });
    });

    // Shuffle options deterministically or randomly
    if (deterministic) {
      // Use vocabulary ID as seed for stable shuffle order
      const seed = targetVocab.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return this.deterministicShuffle(options, seed);
    } else {
      // Random shuffle (for regular quiz steps)
      return [...options].sort(() => Math.random() - 0.5);
    }
  }

  /**
   * Deterministic shuffle using seed for stable order
   */
  private static deterministicShuffle<T>(array: T[], seed: number): T[] {
    const shuffled = [...array];
    let currentSeed = seed;
    
    // Simple seeded random number generator
    const seededRandom = () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };
    
    // Fisher-Yates shuffle with seed
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }

  /**
   * Generate semantic distractors using same logic as WordBankService
   * 70% from same semantic group, 30% from related groups
   */
  private static generateSemanticDistractors(
    correctItems: Array<{ vocabularyId: string; wordText: string; semanticGroup?: string }>,
    vocabularyBank: VocabularyItem[],
    maxDistractors: number
  ): Array<{ wordText: string }> {
    if (maxDistractors <= 0) return [];

    const correctVocabIds = new Set(correctItems.map(item => item.vocabularyId));
    const correctWordTexts = new Set(
      correctItems.map(item => item.wordText.toLowerCase())
    );

    // Get semantic groups of correct words
    const correctGroups = new Set<string>();
    correctItems.forEach(item => {
      if (item.semanticGroup) {
        correctGroups.add(item.semanticGroup);
      } else {
        const group = getSemanticGroup(item.vocabularyId);
        if (group) correctGroups.add(group);
      }
    });

    const distractors: Array<{ wordText: string }> = [];
    const usedVocabIds = new Set<string>();

    // 70% from same semantic groups
    const sameGroupCount = Math.floor(maxDistractors * 0.7);
    let sameGroupAdded = 0;

    for (const group of Array.from(correctGroups)) {
      if (sameGroupAdded >= sameGroupCount) break;

      const groupVocabIds = getVocabIdsInGroup(group);
      const availableVocab = vocabularyBank.filter(v => 
        groupVocabIds.includes(v.id) &&
        !correctVocabIds.has(v.id) &&
        !usedVocabIds.has(v.id) &&
        !correctWordTexts.has(WordBankService.normalizeVocabEnglish(v.en).toLowerCase())
      );

      for (const vocab of availableVocab) {
        if (sameGroupAdded >= sameGroupCount) break;
        
        const normalizedWordText = WordBankService.normalizeVocabEnglish(vocab.en);
        distractors.push({ wordText: normalizedWordText });
        usedVocabIds.add(vocab.id);
        sameGroupAdded++;
      }
    }

    // 30% from related groups
    const relatedGroupCount = maxDistractors - distractors.length;
    if (relatedGroupCount > 0) {
      const relatedGroups = new Set<string>();
      Array.from(correctGroups).forEach(group => {
        getRelatedGroups(group).forEach(relatedGroup => relatedGroups.add(relatedGroup));
      });

      let relatedAdded = 0;
      for (const group of Array.from(relatedGroups)) {
        if (relatedAdded >= relatedGroupCount) break;

        const groupVocabIds = getVocabIdsInGroup(group);
        const availableVocab = vocabularyBank.filter(v =>
          groupVocabIds.includes(v.id) &&
          !correctVocabIds.has(v.id) &&
          !usedVocabIds.has(v.id) &&
          !correctWordTexts.has(WordBankService.normalizeVocabEnglish(v.en).toLowerCase())
        );

        for (const vocab of availableVocab) {
          if (relatedAdded >= relatedGroupCount) break;

          const normalizedWordText = WordBankService.normalizeVocabEnglish(vocab.en);
          distractors.push({ wordText: normalizedWordText });
          usedVocabIds.add(vocab.id);
          relatedAdded++;
        }
      }
    }

    // Fill remaining slots with random vocab if needed
    if (distractors.length < maxDistractors) {
      const remaining = vocabularyBank.filter(v =>
        !correctVocabIds.has(v.id) &&
        !usedVocabIds.has(v.id) &&
        !correctWordTexts.has(WordBankService.normalizeVocabEnglish(v.en).toLowerCase())
      );

      for (const vocab of remaining) {
        if (distractors.length >= maxDistractors) break;
        const normalizedWordText = WordBankService.normalizeVocabEnglish(vocab.en);
        distractors.push({ wordText: normalizedWordText });
        usedVocabIds.add(vocab.id);
      }
    }

    return distractors;
  }

  // Generate contextual quiz prompt for a vocabulary item
  static generateQuizPrompt(targetVocab: VocabularyItem): string {
    return `What does "${targetVocab.finglish}" mean?`;
  }

  // Extract vocabulary ID from quiz step data (enhanced)
  static extractVocabularyFromQuiz(quizData: any, allVocab: VocabularyItem[]): string | undefined {
    const prompt = quizData.prompt?.toLowerCase() || '';
    const options = quizData.options || [];
    const correctIndex = quizData.correct || 0;

    // PRIORITY 1: Check if correct answer matches any vocabulary (WHAT USER GOT WRONG)
    // This should be primary since we want to remediate the concept they missed
    if (typeof options[correctIndex] === 'string') {
      const correctAnswer = options[correctIndex].toLowerCase();
      for (const vocab of allVocab) {
        if (vocab.en.toLowerCase() === correctAnswer || 
            vocab.finglish.toLowerCase() === correctAnswer) {
          return vocab.id;
        }
      }
    }

    // PRIORITY 2: Check if any vocabulary words are mentioned in prompt (CONTEXT VALIDATION)
    // Use this for context when correct answer doesn't directly match vocabulary
    for (const vocab of allVocab) {
      // Pattern 1: Direct quotes - "What does 'Khodafez' mean?"
      if (prompt.includes(`'${vocab.finglish.toLowerCase()}'`) || 
          prompt.includes(`"${vocab.finglish.toLowerCase()}"`)) {
        return vocab.id;
      }
      
      // Pattern 2: English in quotes - "What does 'Goodbye' mean?"
      if (prompt.includes(`'${vocab.en.toLowerCase()}'`) || 
          prompt.includes(`"${vocab.en.toLowerCase()}"`)) {
        return vocab.id;
      }
      
      // Pattern 3: Complete/Fill patterns - "Complete: Salam, ___ Sara"
      if (prompt.includes('complete') && 
          (prompt.includes(vocab.finglish.toLowerCase()) || prompt.includes(vocab.en.toLowerCase()))) {
        return vocab.id;
      }
      
      // Pattern 4: "How do you say" patterns - "How do you say 'Thank you' in Persian?"
      if (prompt.includes('how do you say') && 
          (prompt.includes(`'${vocab.en.toLowerCase()}'`) || prompt.includes(`"${vocab.en.toLowerCase()}"`))) {
        return vocab.id;
      }
      
      // Pattern 5: Response patterns - "How do you respond to 'Chetori?'"
      if (prompt.includes('respond to') && 
          (prompt.includes(`'${vocab.finglish.toLowerCase()}'`) || prompt.includes(`"${vocab.finglish.toLowerCase()}"`))) {
        return vocab.id;
      }
      
      // Pattern 6: FIXED - Word boundary matching instead of substring
      // Use regex to match whole words only, preventing "na" from matching "name"
      const wordBoundaryRegex = new RegExp(`\\b${vocab.finglish.toLowerCase()}\\b`, 'i');
      const englishWordBoundaryRegex = new RegExp(`\\b${vocab.en.toLowerCase()}\\b`, 'i');
      
      if (wordBoundaryRegex.test(prompt) || englishWordBoundaryRegex.test(prompt)) {
        return vocab.id;
      }
    }

    // PRIORITY 3: Check if any vocabulary words appear in options (LOWEST PRIORITY)
    // Only use this as last resort since options contain distractors
    for (const vocab of allVocab) {
      if (options.some((opt: any) => {
        const optText = typeof opt === 'string' ? opt : opt.text;
        return optText && (
          optText.toLowerCase() === vocab.finglish.toLowerCase() || 
          optText.toLowerCase() === vocab.en.toLowerCase()
        );
      })) {
        return vocab.id;
      }
    }

    return undefined;
  }

} 