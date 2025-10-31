/**
 * Vocabulary Tracking Service
 * 
 * Unified tracking system for vocabulary performance across all game types.
 * Tracks attempts at both overall and per-word level with full context.
 * Designed for Supabase integration (abstracted for now).
 * 
 * Architecture:
 * - VocabularyTrackingAttempt: Complete attempt record (overall + per-word)
 * - AttemptResult: Aggregated results from attempt
 * - WordAttempt: Individual word performance within attempt
 * - VocabularyPerformanceStats: Aggregated stats per word (for review mode)
 */

import { VocabularyItem } from '../types';

/**
 * Game types that support vocabulary tracking
 * Matches LessonViewType where applicable, plus flashcard views
 */
export type VocabularyGameType = 
  | 'quiz' 
  | 'input' 
  | 'audio-sequence' 
  | 'text-sequence' 
  | 'matching' 
  | 'story-conversation' 
  | 'flashcard-view'  // Separate from practice (view only)
  | 'word-rush';

/**
 * Complete vocabulary tracking attempt
 * Records a single user interaction with vocabulary content
 */
export interface VocabularyTrackingAttempt {
  // WHO & WHEN
  userId: string;
  timestamp: string;
  
  // WHAT GAME
  gameType: VocabularyGameType;
  
  // CONTEXT
  moduleId: string;
  lessonId: string;
  stepIndex?: number; // Which step in lesson (0-indexed)
  
  // ATTEMPT DATA
  attemptResult: AttemptResult;
  
  // METADATA
  metadata?: {
    stepUid?: string; // For idempotency (like XP system)
    attemptUid?: string; // Unique identifier for this attempt
    sessionId?: string; // Session identifier
    timeSpentMs?: number; // How long user took
    retryCount?: number; // How many times user retried
  };
}

/**
 * Aggregated result from an attempt
 * Contains overall result + per-word breakdown
 */
export interface AttemptResult {
  // Overall result
  isCorrect: boolean;
  
  // Per-word breakdown
  words: WordAttempt[];
  
  // Aggregated stats
  totalWords: number;
  correctWords: number;
  incorrectWords: number;
}

/**
 * Individual word performance within an attempt
 * Tracks each vocabulary item/user interaction separately
 */
export interface WordAttempt {
  // Which vocabulary item
  vocabularyId: string; // e.g., "salam"
  wordText: string; // e.g., "Hello" (normalized display text)
  
  // Result
  isCorrect: boolean;
  
  // Context
  context?: {
    position?: number; // Position in sequence (0, 1, 2...)
    isPhrase?: boolean; // Is this a phrase like "How are you"?
    wasDistractor?: boolean; // Was this a distractor the user saw?
  };
}

/**
 * Aggregated performance statistics for a vocabulary word
 * Used for review mode and analytics
 * 
 * Note: This is separate from vocabulary-service.ts WordPerformance
 * to avoid conflicts. This version is designed for Supabase aggregation.
 */
export interface VocabularyPerformanceStats {
  // Word identification
  vocabularyId: string;
  wordText: string; // Normalized display text
  
  // Aggregated stats
  timesCorrect: number;
  timesIncorrect: number;
  totalAttempts: number;
  
  // Timestamps
  firstSeenAt: string;
  lastSeenAt: string;
  lastCorrectAt?: string;
  lastIncorrectAt?: string;
  
  // Review flags
  needsReview: boolean;
  masteryLevel: number; // 0=new, 1=learning, 2=mastered
  
  // Metadata
  lessonId?: string;
  moduleId?: string;
}

/**
 * Vocabulary Tracking Service
 * 
 * Handles recording vocabulary attempts and querying performance stats.
 * Currently abstracted - will integrate with Supabase when ready.
 */
export class VocabularyTrackingService {
  /**
   * Record a vocabulary tracking attempt
   * Idempotent: if attemptUid or stepUid provided, prevents duplicates
   * 
   * @param attempt - Complete attempt data
   */
  static async recordAttempt(attempt: VocabularyTrackingAttempt): Promise<void> {
    // TODO: Implement Supabase integration
    // For now, validate and log
    this.validateAttempt(attempt);
    
    // Generate attemptUid if not provided
    const attemptUid = attempt.metadata?.attemptUid || this.generateAttemptUid(attempt);
    
    // Check idempotency (when Supabase ready)
    // const isDuplicate = await this.isAttemptDuplicate(attemptUid);
    // if (isDuplicate) return;
    
    // Store in Supabase (when ready)
    // await this.storeAttempt(attempt, attemptUid);
    
    console.log('[VocabularyTracking] Recorded attempt:', {
      attemptUid,
      gameType: attempt.gameType,
      isCorrect: attempt.attemptResult.isCorrect,
      words: attempt.attemptResult.words.length
    });
  }
  
  /**
   * Get struggling words for a user
   * Words where incorrect > correct OR needsReview = true
   * 
   * @param userId - User ID
   * @param limit - Maximum number of words to return
   * @returns Array of vocabulary IDs
   */
  static async getStrugglingWords(userId: string, limit: number = 10): Promise<string[]> {
    // TODO: Implement Supabase query
    // Query vocabulary_performance table where:
    // - user_id = userId
    // - (times_incorrect > times_correct OR needs_review = true)
    // - ORDER BY last_incorrect_at DESC
    // - LIMIT limit
    
    return [];
  }
  
  /**
   * Get words needing review for a user
   * 
   * @param userId - User ID
   * @returns Array of vocabulary IDs
   */
  static async getWordsNeedingReview(userId: string): Promise<string[]> {
    // TODO: Implement Supabase query
    // Query vocabulary_performance table where:
    // - user_id = userId
    // - needs_review = true
    // - ORDER BY last_incorrect_at DESC
    
    return [];
  }
  
  /**
   * Get performance stats for a specific word
   * 
   * @param userId - User ID
   * @param vocabularyId - Vocabulary item ID
   * @returns Performance stats or null if not found
   */
  static async getWordPerformanceStats(
    userId: string, 
    vocabularyId: string
  ): Promise<VocabularyPerformanceStats | null> {
    // TODO: Implement Supabase query
    // Query vocabulary_performance table where:
    // - user_id = userId
    // - vocabulary_id = vocabularyId
    // Return aggregated stats
    
    return null;
  }
  
  /**
   * Get all word performance stats for a user
   * 
   * @param userId - User ID
   * @returns Array of performance stats
   */
  static async getAllWordPerformanceStats(userId: string): Promise<VocabularyPerformanceStats[]> {
    // TODO: Implement Supabase query
    // Query vocabulary_performance table where:
    // - user_id = userId
    // - ORDER BY last_seen_at DESC
    
    return [];
  }
  
  /**
   * Validate attempt data structure
   * Throws error if invalid
   */
  private static validateAttempt(attempt: VocabularyTrackingAttempt): void {
    if (!attempt.userId) {
      throw new Error('VocabularyTrackingAttempt requires userId');
    }
    if (!attempt.gameType) {
      throw new Error('VocabularyTrackingAttempt requires gameType');
    }
    if (!attempt.moduleId || !attempt.lessonId) {
      throw new Error('VocabularyTrackingAttempt requires moduleId and lessonId');
    }
    if (!attempt.attemptResult) {
      throw new Error('VocabularyTrackingAttempt requires attemptResult');
    }
    if (!attempt.attemptResult.words || attempt.attemptResult.words.length === 0) {
      throw new Error('AttemptResult must contain at least one word');
    }
    if (attempt.attemptResult.totalWords !== attempt.attemptResult.words.length) {
      throw new Error('totalWords must match words array length');
    }
    if (attempt.attemptResult.correctWords + attempt.attemptResult.incorrectWords !== attempt.attemptResult.totalWords) {
      throw new Error('correctWords + incorrectWords must equal totalWords');
    }
  }
  
  /**
   * Generate unique attempt UID
   * Used for idempotency checks
   */
  private static generateAttemptUid(attempt: VocabularyTrackingAttempt): string {
    // Priority 1: Use stepUid if provided (prevents back button duplicates)
    if (attempt.metadata?.stepUid) {
      return `${attempt.metadata.stepUid}-${attempt.gameType}`;
    }
    
    // Priority 2: Generate from attempt data + timestamp
    const vocabIds = attempt.attemptResult.words.map(w => w.vocabularyId).join(',');
    return `${attempt.userId}-${attempt.gameType}-${attempt.moduleId}-${attempt.lessonId}-${attempt.stepIndex || 0}-${vocabIds}-${Date.now()}`;
  }
  
  /**
   * Check if attempt is duplicate (idempotency)
   * TODO: Implement Supabase check
   */
  private static async isAttemptDuplicate(attemptUid: string): Promise<boolean> {
    // TODO: Query Supabase vocabulary_attempts table
    // SELECT COUNT(*) WHERE attempt_uid = attemptUid
    // Return true if count > 0
    
    return false;
  }
  
  /**
   * Store attempt in Supabase
   * TODO: Implement Supabase insert
   */
  private static async storeAttempt(
    attempt: VocabularyTrackingAttempt,
    attemptUid: string
  ): Promise<void> {
    // TODO: Insert into vocabulary_attempts table
    // TODO: Insert word attempts into vocabulary_word_attempts table
    // TODO: Update aggregated stats in vocabulary_performance table
    
    // For now, no-op
  }
}

