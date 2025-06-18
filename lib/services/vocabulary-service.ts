import { VocabularyItem } from '../types';
import { getLesson } from '../config/curriculum';

// Local storage key for vocabulary progress
const VOCABULARY_PROGRESS_KEY = 'vocabulary-progress';

// Progress tracking structure
export interface LessonProgress {
  completed: boolean;
  wordsLearned: string[]; // Array of vocabulary IDs
  completedAt?: string;
}

export interface VocabularyProgress {
  [lessonKey: string]: LessonProgress; // "module1-lesson1": {...}
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