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
    
    // For now, get from current module's previous lessons
    // This is a simplified approach - in production you'd want to search across all lessons
    reviewIds.forEach((reviewId: string) => {
      // Find the vocabulary item across all lessons in current module
      // This is simplified - you might want to enhance this lookup
      const vocab = this.findVocabularyById(reviewId, moduleId);
      if (vocab) allVocab.push(vocab);
    });
    
    return allVocab;
  }

  // Helper method to find vocabulary by ID across all lessons in curriculum
  private static findVocabularyById(vocabId: string, moduleId: string): VocabularyItem | undefined {
    const module = require('../config/curriculum').getModule(moduleId);
    if (!module) return undefined;
    
    // Search through all lessons in the module for the vocabulary item
    for (const lesson of module.lessons) {
      if (lesson.vocabulary) {
        const found = lesson.vocabulary.find((item: VocabularyItem) => item.id === vocabId);
        if (found) return found;
      }
    }
    
    // If not found in current module, search across all modules
    const allModules = require('../config/curriculum').getModules();
    for (const mod of allModules) {
      if (mod.id === moduleId) continue; // Skip current module, already searched
      
      for (const lesson of mod.lessons) {
        if (lesson.vocabulary) {
          const found = lesson.vocabulary.find((item: VocabularyItem) => item.id === vocabId);
          if (found) return found;
        }
      }
    }
    
    return undefined;
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
} 