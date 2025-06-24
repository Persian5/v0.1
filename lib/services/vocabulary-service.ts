import { VocabularyItem } from '../types';
import { getLesson } from '../config/curriculum';

// Local storage key for vocabulary progress
const VOCABULARY_PROGRESS_KEY = 'vocabulary-progress';
const WORD_PERFORMANCE_KEY = 'word-performance';

// Progress tracking structure
export interface LessonProgress {
  completed: boolean;
  wordsLearned: string[]; // Array of vocabulary IDs
  completedAt?: string;
}

export interface VocabularyProgress {
  [lessonKey: string]: LessonProgress; // "module1-lesson1": {...}
}

// Individual word performance tracking
export interface WordPerformance {
  wordId: string;
  timesCorrect: number;
  timesIncorrect: number;
  lastSeen: string;
  needsReview: boolean;
}

export interface WordPerformanceMap {
  [wordId: string]: WordPerformance;
}

export class VocabularyService {
  
  // Get vocabulary for a specific lesson
  static getLessonVocabulary(moduleId: string, lessonId: string): VocabularyItem[] {
    const lesson = getLesson(moduleId, lessonId);
    return lesson?.vocabulary || [];
  }

  // Get all vocabulary items learned from a specific lesson (for summary page)
  static getLearnedWordsFromLesson(moduleId: string, lessonId: string): string[] {
    const vocabulary = this.getLessonVocabulary(moduleId, lessonId);
    // For now, return all finglish words from the lesson's vocabulary
    // Later this will check against progress tracking
    return vocabulary.map(item => item.finglish);
  }

  // Get progress from local storage
  static getProgress(): VocabularyProgress {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem(VOCABULARY_PROGRESS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading vocabulary progress:', error);
      return {};
    }
  }

  // Save progress to local storage
  static saveProgress(progress: VocabularyProgress): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(VOCABULARY_PROGRESS_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving vocabulary progress:', error);
    }
  }

  // Get word performance data
  static getWordPerformance(): WordPerformanceMap {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem(WORD_PERFORMANCE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading word performance:', error);
      return {};
    }
  }

  // Save word performance data
  static saveWordPerformance(performance: WordPerformanceMap): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(WORD_PERFORMANCE_KEY, JSON.stringify(performance));
    } catch (error) {
      console.error('Error saving word performance:', error);
    }
  }

  // Record a correct answer for a word
  static recordCorrectAnswer(wordId: string): void {
    const performance = this.getWordPerformance();
    
    if (!performance[wordId]) {
      performance[wordId] = {
        wordId,
        timesCorrect: 0,
        timesIncorrect: 0,
        lastSeen: new Date().toISOString(),
        needsReview: false
      };
    }
    
    performance[wordId].timesCorrect += 1;
    performance[wordId].lastSeen = new Date().toISOString();
    performance[wordId].needsReview = false;
    
    this.saveWordPerformance(performance);
  }

  // Record an incorrect answer for a word
  static recordIncorrectAnswer(wordId: string): void {
    const performance = this.getWordPerformance();
    
    if (!performance[wordId]) {
      performance[wordId] = {
        wordId,
        timesCorrect: 0,
        timesIncorrect: 0,
        lastSeen: new Date().toISOString(),
        needsReview: true
      };
    }
    
    performance[wordId].timesIncorrect += 1;
    performance[wordId].lastSeen = new Date().toISOString();
    performance[wordId].needsReview = true;
    
    this.saveWordPerformance(performance);
  }

  // Check if a word needs immediate review (got wrong)
  static doesWordNeedReview(wordId: string): boolean {
    const performance = this.getWordPerformance();
    return performance[wordId]?.needsReview || false;
  }

  // Get review vocabulary for a lesson (from previous lessons)
  static getReviewVocabulary(moduleId: string, lessonId: string): VocabularyItem[] {
    const lesson = getLesson(moduleId, lessonId);
    const reviewIds = lesson?.reviewVocabulary || [];
    
    // Get vocabulary items from all previous lessons that match review IDs
    const allVocab: VocabularyItem[] = [];
    
    reviewIds.forEach((reviewId: string) => {
      // Use the new public findVocabularyById method
      const vocab = this.findVocabularyById(reviewId);
      if (vocab) allVocab.push(vocab);
    });
    
    return allVocab;
  }

  // Mark a lesson as completed with its vocabulary
  static markLessonCompleted(moduleId: string, lessonId: string): void {
    const lessonKey = `${moduleId}-${lessonId}`;
    const vocabulary = this.getLessonVocabulary(moduleId, lessonId);
    const wordIds = vocabulary.map(item => item.id);
    
    const progress = this.getProgress();
    progress[lessonKey] = {
      completed: true,
      wordsLearned: wordIds,
      completedAt: new Date().toISOString()
    };
    
    this.saveProgress(progress);
  }

  // Check if a lesson is completed
  static isLessonCompleted(moduleId: string, lessonId: string): boolean {
    const lessonKey = `${moduleId}-${lessonId}`;
    const progress = this.getProgress();
    return progress[lessonKey]?.completed || false;
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

  // Get words learned from a specific lesson (checking progress)
  static getWordsLearnedFromLesson(moduleId: string, lessonId: string): string[] {
    const lessonKey = `${moduleId}-${lessonId}`;
    const progress = this.getProgress();
    const lessonProgress = progress[lessonKey];
    
    if (!lessonProgress?.completed) {
      return [];
    }
    
    // Get the actual vocabulary items and return finglish translations
    const vocabulary = this.getLessonVocabulary(moduleId, lessonId);
    return lessonProgress.wordsLearned
      .map(wordId => vocabulary.find(item => item.id === wordId)?.finglish)
      .filter(Boolean) as string[];
  }

  // NEW METHODS FOR DYNAMIC REMEDIATION

  // Find vocabulary item by ID across all curriculum (make public)
  static findVocabularyById(vocabId: string): VocabularyItem | undefined {
    const allModules = require('../config/curriculum').getModules();
    
    for (const module of allModules) {
      for (const lesson of module.lessons) {
        if (lesson.vocabulary) {
          const found = lesson.vocabulary.find((item: VocabularyItem) => item.id === vocabId);
          if (found) return found;
        }
      }
    }
    
    return undefined;
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
  static generateQuizOptions(targetVocab: VocabularyItem, allVocab: VocabularyItem[]): { text: string, correct: boolean }[] {
    // Create correct answer
    const options = [
      { text: targetVocab.en, correct: true }
    ];

    // Generate distractors from same lesson's vocabulary (context-appropriate)
    // Sort alphabetically to ensure deterministic order
    const distractors = allVocab
      .filter(vocab => vocab.id !== targetVocab.id) // Exclude target word
      .map(vocab => vocab.en) // Get English translations
      .filter(en => en !== targetVocab.en) // Avoid duplicates
      .sort() // DETERMINISTIC: Sort alphabetically
      .slice(0, 3); // Take first 3 as distractors

    // Add distractors as incorrect options
    distractors.forEach(distractor => {
      options.push({ text: distractor, correct: false });
    });

    // If we don't have enough distractors from lesson context, add common ones
    const commonDistractors = ["Goodbye", "Thank you", "Please", "Yes", "No", "Welcome"];
    while (options.length < 4) {
      const commonDistractor = commonDistractors.find(common => 
        !options.some(opt => opt.text === common)
      );
      if (commonDistractor) {
        options.push({ text: commonDistractor, correct: false });
      } else {
        break; // No more unique distractors available
      }
    }

    return options;
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

  // NEW: Extract phrase ID from quiz step data for phrase-based questions
  static extractPhraseFromQuiz(quizData: any): string | undefined {
    const prompt = quizData.prompt?.toLowerCase() || '';
    const options = quizData.options || [];
    const correctIndex = quizData.correct || 0;

    // Import phrase data (avoiding circular imports by requiring here)
    const { CURRICULUM_PHRASES } = require('./phrase-tracking-service');
    
    // Check if correct answer matches any phrase
    if (typeof options[correctIndex] === 'string') {
      const correctAnswer = options[correctIndex].toLowerCase().replace(/[?!.,]/g, '');
      for (const phrase of CURRICULUM_PHRASES) {
        const cleanPhrase = phrase.phrase.toLowerCase().replace(/[?!.,]/g, '');
        if (cleanPhrase === correctAnswer) {
          return phrase.id;
        }
      }
    }

    // Check if prompt is asking about a specific phrase
    for (const phrase of CURRICULUM_PHRASES) {
      const cleanPhrase = phrase.phrase.toLowerCase().replace(/[?!.,]/g, '');
      const cleanTranslation = phrase.translation.toLowerCase();
      
      // Pattern: "How do you ask 'What is your name?' in Persian?"
      if (prompt.includes('how do you ask') && 
          (prompt.includes(`'${cleanTranslation}'`) || prompt.includes(`"${cleanTranslation}"`))) {
        return phrase.id;
      }
      
      // Pattern: "How do you say 'Hello, how are you?' in Persian?"
      if (prompt.includes('how do you say') && 
          (prompt.includes(`'${cleanTranslation}'`) || prompt.includes(`"${cleanTranslation}"`))) {
        return phrase.id;
      }
    }

    return undefined;
  }

  // NEW: Get critical vocabulary words that should be remediated for a phrase
  static getCriticalVocabularyForPhrase(phraseId: string): string[] {
    const { CURRICULUM_PHRASES } = require('./phrase-tracking-service');
    const phraseData = CURRICULUM_PHRASES.find((p: any) => p.id === phraseId);
    
    if (!phraseData) return [];

    // Define critical words per phrase (semantic backbone)
    const criticalWordsMap: { [key: string]: string[] } = {
      'esme-shoma-chiye': ['chi', 'esm'], // "what" and "name" are semantic backbone
      'esme-man': ['esm', 'man'], // Both words are critical for "my name"
      'khoobam-merci': ['khoobam'], // "I'm good" is more critical than "thank you"
      'na-merci': ['na'], // "No" is the key semantic word
      'salam-chetori': ['salam', 'chetori'] // Both are equally important for greeting
    };

    return criticalWordsMap[phraseId] || [];
  }

  // NEW: Determine which vocabulary words need remediation based on mastery
  static getVocabularyForRemediation(vocabularyIds: string[]): string[] {
    const needsRemediation: string[] = [];
    
    for (const vocabId of vocabularyIds) {
      const performance = this.getWordPerformance()[vocabId];
      
      // Flag for remediation if:
      // 1. Never seen before (new)
      // 2. More incorrect than correct attempts (weak)
      // 3. Currently marked as needs review
      if (!performance || 
          performance.timesIncorrect >= performance.timesCorrect ||
          performance.needsReview) {
        needsRemediation.push(vocabId);
      }
    }
    
    return needsRemediation;
  }

  // Clear all vocabulary progress (for reset functionality)
  static clearAllProgress(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(VOCABULARY_PROGRESS_KEY);
    localStorage.removeItem(WORD_PERFORMANCE_KEY);
  }
} 