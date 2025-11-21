import { VocabularyItem } from '../types';
import { getLesson, getModules, generateCompleteReviewVocabulary } from '../config/curriculum';
import { AuthService } from './auth-service';
import { DatabaseService } from '../supabase/database';

export interface CompletedLessonInfo {
  moduleId: string;
  lessonId: string;
  completedAt: string;
}

export class VocabularyProgressService {
  
  // Cache to avoid repeated DB calls within same session
  private static vocabularyCache: VocabularyItem[] | null = null;
  private static cacheTimestamp: number | null = null;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  /**
   * MAIN METHOD: Get vocabulary available for practice games
   * Based on user's completed lessons with deduplication
   */
  static async getUserPracticeVocabulary(options?: {
    maxWords?: number;
    moduleOnly?: string;
    includeReview?: boolean;
    forceRefresh?: boolean;
  }): Promise<VocabularyItem[]> {
    const currentUser = await AuthService.getCurrentUser();
    
    if (!currentUser || !(await AuthService.isEmailVerified(currentUser))) {
      throw new Error('User must be authenticated and email verified to access practice vocabulary');
    }

    const config = {
      maxWords: 50, // Default reasonable limit
      includeReview: true, // Include review vocabulary by default
      forceRefresh: false,
      ...options
    };

    // Check cache first (unless force refresh)
    if (!config.forceRefresh && this.vocabularyCache && this.cacheTimestamp) {
      const cacheAge = Date.now() - this.cacheTimestamp;
      if (cacheAge < this.CACHE_DURATION) {
        return this.filterVocabulary(this.vocabularyCache, config);
      }
    }

    try {
      // Get completed lessons from database
      const completedLessons = await this.getCompletedLessons(currentUser.id);
      
      // Extract vocabulary from completed lessons
      const availableVocabulary = this.extractVocabularyFromLessons(completedLessons, config.includeReview);
      
      // Update cache
      this.vocabularyCache = availableVocabulary;
      this.cacheTimestamp = Date.now();
      
      return this.filterVocabulary(availableVocabulary, config);
      
    } catch (error) {
      console.error('Failed to get practice vocabulary:', error);
      
      // Fallback to cached data if available
      if (this.vocabularyCache) {
        return this.filterVocabulary(this.vocabularyCache, config);
      }
      
      // Ultimate fallback: empty array (practice games will show "no vocabulary" message)
      return [];
    }
  }
  
  /**
   * Get completed lessons from database
   */
  private static async getCompletedLessons(userId: string): Promise<CompletedLessonInfo[]> {
    const progressData = await DatabaseService.getUserLessonProgress(userId);
    
    return progressData
      .filter(progress => progress.status === 'completed' && progress.completed_at)
      .map(progress => ({
        moduleId: progress.module_id,
        lessonId: progress.lesson_id,
        completedAt: progress.completed_at!
      }))
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()); // Sort chronologically
  }
  
  /**
   * Extract vocabulary from completed lessons with smart deduplication
   */
  private static extractVocabularyFromLessons(
    completedLessons: CompletedLessonInfo[], 
    includeReview: boolean = true
  ): VocabularyItem[] {
    const vocabularyMap = new Map<string, VocabularyItem>(); // Use Map for deduplication by ID
    const reviewVocabIds = new Set<string>(); // Track review vocabulary IDs
    
    for (const { moduleId, lessonId } of completedLessons) {
      const lesson = getLesson(moduleId, lessonId);
      if (!lesson) continue;
      
      // Skip story lessons (they have empty vocabulary arrays and are pure review)
      // A story lesson has exactly one step of type 'story-conversation'
      if (lesson.steps.length === 1 && lesson.steps[0].type === 'story-conversation') continue;
      
      // Add lesson-specific vocabulary
      if (lesson.vocabulary) {
        for (const vocab of lesson.vocabulary) {
          vocabularyMap.set(vocab.id, vocab);
        }
      }
      
      // Track review vocabulary IDs (but don't add duplicates)
      // AUTO-GENERATED: Automatically includes all vocabulary from previous lessons
      if (includeReview) {
        // Auto-generate review vocabulary IDs from previous lessons in module
        const lessonNum = parseInt(lessonId.replace('lesson', ''));
        if (!isNaN(lessonNum) && lessonNum > 1) {
          const autoReviewIds = generateCompleteReviewVocabulary(moduleId, lessonNum);
          autoReviewIds.forEach(id => reviewVocabIds.add(id));
        }
        
        // Also include manual reviewVocabulary if provided (backward compatibility)
        if (lesson.reviewVocabulary && lesson.reviewVocabulary.length > 0) {
        for (const reviewId of lesson.reviewVocabulary) {
          reviewVocabIds.add(reviewId);
          }
        }
      }
    }
    
    // Add review vocabulary if it's not already included
    if (includeReview) {
      for (const reviewId of reviewVocabIds) {
        if (!vocabularyMap.has(reviewId)) {
          // Find vocabulary item from curriculum
          const vocab = this.findVocabularyById(reviewId);
          if (vocab) {
            vocabularyMap.set(vocab.id, vocab);
          }
        }
      }
    }
    
    return Array.from(vocabularyMap.values());
  }
  
  /**
   * Apply filters to vocabulary list
   */
  private static filterVocabulary(
    vocabulary: VocabularyItem[], 
    config: { maxWords?: number; moduleOnly?: string }
  ): VocabularyItem[] {
    let filtered = vocabulary;
    
    // Filter by module if specified
    if (config.moduleOnly) {
      filtered = filtered.filter(vocab => vocab.lessonId.startsWith(config.moduleOnly!));
    }
    
    // Apply word limit
    if (config.maxWords && filtered.length > config.maxWords) {
      // Return most recent vocabulary (based on lesson order)
      filtered = filtered.slice(-config.maxWords);
    }
    
    return filtered;
  }
  
  /**
   * Find vocabulary item by ID across all curriculum
   * OPTIMIZED: Uses O(1) map lookup instead of O(n) scan
   */
  private static findVocabularyById(vocabId: string): VocabularyItem | undefined {
    const { getCurriculumLexicon } = require('../utils/curriculum-lexicon');
    const lexicon = getCurriculumLexicon();
    return lexicon.allVocabMap.get(vocabId);
  }
  
  /**
   * Clear vocabulary cache (called when lesson is completed)
   */
  static clearCache(): void {
    this.vocabularyCache = null;
    this.cacheTimestamp = null;
  }
  
  /**
   * Get vocabulary count for a user (for stats/UI)
   */
  static async getUserVocabularyCount(): Promise<number> {
    try {
      const vocabulary = await this.getUserPracticeVocabulary();
      return vocabulary.length;
    } catch (error) {
      console.error('Failed to get vocabulary count:', error);
      return 0;
    }
  }
  
  /**
   * Check if user has any vocabulary available for practice
   */
  static async hasVocabularyForPractice(): Promise<boolean> {
    try {
      const vocabulary = await this.getUserPracticeVocabulary({ maxWords: 1 });
      return vocabulary.length > 0;
    } catch (error) {
      console.error('Failed to check vocabulary availability:', error);
      return false;
    }
  }
} 