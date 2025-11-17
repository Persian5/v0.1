/**
 * Centralized Tracking Service (PHASE 5)
 * 
 * Unified tracking logic for vocabulary + grammar forms.
 * Routes attempts to appropriate services based on lexeme type and quiz type.
 * 
 * Tracking Rules:
 * - Grammar form + vocab quiz → log vocab (base), grammar exposure (suffix)
 * - Grammar form + grammar quiz → log grammar (suffix), vocab exposure (base)
 * - Base vocab only → log vocab only (existing behavior)
 * 
 * Database Tables Used:
 * - vocabulary_performance + vocabulary_attempts (via VocabularyTrackingService)
 * - grammar_performance + grammar_attempts (via GrammarTrackingService)
 */

import { LexemeRef, ResolvedLexeme } from '../types';
import { GrammarService } from './grammar-service';
import { VocabularyTrackingService } from './vocabulary-tracking-service';
import { GrammarTrackingService } from './grammar-tracking-service';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Quiz type determines what gets tracked
 */
export type QuizType = 'vocab-normal' | 'vocab-reverse' | 'phrase' | 'grammar';

/**
 * Parameters for logging an attempt
 */
export interface LogAttemptParams {
  userId: string;
  lexemeRef: LexemeRef;          // Can be base vocab or grammar form
  quizType: QuizType;             // Determines tracking logic
  gameType: string;               // e.g., "audio-meaning", "matching", "quiz"
  isCorrect: boolean;
  timeSpentMs?: number;
  moduleId?: string;
  lessonId?: string;
  stepUid?: string;
  contextData?: any;
}

// ============================================================================
// TRACKING SERVICE
// ============================================================================

export class TrackingService {
  
  /**
   * Log an attempt with unified tracking logic
   * 
   * Routes to appropriate tracking services based on:
   * - Whether lexeme is a grammar form or base vocab
   * - Quiz type (vocab vs grammar focus)
   * 
   * @param params - Attempt parameters
   * @returns true if tracking succeeded, false otherwise
   */
  static async logAttempt(params: LogAttemptParams): Promise<boolean> {
    const {
      userId,
      lexemeRef,
      quizType,
      gameType,
      isCorrect,
      timeSpentMs,
      moduleId,
      lessonId,
      stepUid,
      contextData
    } = params;
    
    // Resolve the lexeme reference
    const resolved = GrammarService.resolve(lexemeRef);
    
    // ========================================================================
    // RULE 1: BASE VOCABULARY ONLY (NO GRAMMAR)
    // ========================================================================
    
    if (!resolved.isGrammarForm) {
      // Simple case: base vocab, no grammar involved
      return await VocabularyTrackingService.storeAttempt({
        userId,
        vocabularyId: resolved.id,
        wordText: resolved.en,
        gameType,
        isCorrect,
        timeSpentMs,
        moduleId,
        lessonId,
        stepUid,
        contextData
      });
    }
    
    // ========================================================================
    // RULE 2: GRAMMAR FORM - DETERMINE PRIMARY TRACKING TARGET
    // ========================================================================
    
    // For grammar forms, determine what to track based on quiz type
    const isVocabQuiz = quizType === 'vocab-normal' || quizType === 'vocab-reverse' || quizType === 'phrase';
    const isGrammarQuiz = quizType === 'grammar';
    
    // ========================================================================
    // RULE 2A: GRAMMAR FORM IN VOCAB QUIZ
    // ========================================================================
    // User is being tested on vocabulary comprehension, not grammar rules
    // Primary: Track base vocab (e.g., "khoob")
    // Secondary: Track grammar exposure (e.g., suffix "-am")
    
    if (isVocabQuiz) {
      // Track base vocabulary (primary target)
      const vocabSuccess = await VocabularyTrackingService.storeAttempt({
        userId,
        vocabularyId: resolved.baseId,  // Base vocab (e.g., "khoob")
        wordText: resolved.en,           // Full meaning (e.g., "I'm good")
        gameType,
        isCorrect,
        timeSpentMs,
        moduleId,
        lessonId,
        stepUid,
        contextData: {
          ...contextData,
          lexemeType: 'grammar-form',
          surfaceForm: resolved.id,
          trackingNote: 'Base vocab tracked for grammar form in vocab quiz'
        }
      });
      
      // Track grammar exposure (secondary, non-graded)
      // This logs that user saw suffix "-am" but doesn't affect grammar mastery
      if (resolved.grammar && resolved.grammar.kind === 'suffix') {
        // Don't await - this is supplementary tracking
        GrammarTrackingService.logGrammarAttempt({
          userId,
          conceptId: `suffix-${resolved.grammar.suffixId}`,
          stepType: gameType as any,
          isCorrect: false, // Always false for exposure (not being graded on grammar)
          timeSpentMs,
          moduleId,
          lessonId,
          stepUid,
          contextData: {
            ...contextData,
            trackingType: 'exposure',
            baseVocabId: resolved.baseId,
            note: 'Suffix exposure during vocab quiz'
          }
        }).catch(err => {
          console.warn('[TrackingService] Failed to log grammar exposure (non-critical):', err);
        });
      }
      
      return vocabSuccess;
    }
    
    // ========================================================================
    // RULE 2B: GRAMMAR FORM IN GRAMMAR QUIZ
    // ========================================================================
    // User is being tested on grammar rules (e.g., "when do we use -am?")
    // Primary: Track grammar (suffix)
    // Secondary: Track vocab exposure (base word)
    
    if (isGrammarQuiz) {
      if (!resolved.grammar || resolved.grammar.kind !== 'suffix') {
        console.error('[TrackingService] Grammar quiz with non-suffix grammar form:', resolved);
        return false;
      }
      
      // Track grammar performance (primary target)
      const grammarSuccess = await GrammarTrackingService.logGrammarAttempt({
        userId,
        conceptId: `suffix-${resolved.grammar.suffixId}`,
        stepType: 'grammar-fill-blank',
        isCorrect,
        timeSpentMs,
        moduleId,
        lessonId,
        stepUid,
        contextData: {
          ...contextData,
          baseVocabId: resolved.baseId,
          surfaceForm: resolved.id,
          trackingNote: 'Grammar tracked for suffix in grammar quiz'
        }
      });
      
      // Track vocab exposure (secondary, non-graded)
      // Don't await - this is supplementary tracking
      VocabularyTrackingService.storeAttempt({
        userId,
        vocabularyId: resolved.baseId,
        wordText: resolved.en,
        gameType,
        isCorrect: false, // Always false for exposure (not being graded on vocab)
        timeSpentMs,
        moduleId,
        lessonId,
        stepUid,
        contextData: {
          ...contextData,
          trackingType: 'exposure',
          grammarSuffix: resolved.grammar.suffixId,
          note: 'Base vocab exposure during grammar quiz'
        }
      }).catch(err => {
        console.warn('[TrackingService] Failed to log vocab exposure (non-critical):', err);
      });
      
      return grammarSuccess;
    }
    
    // ========================================================================
    // FALLBACK: UNKNOWN QUIZ TYPE
    // ========================================================================
    
    console.warn('[TrackingService] Unknown quiz type:', quizType, '- defaulting to vocab tracking');
    return await VocabularyTrackingService.storeAttempt({
      userId,
      vocabularyId: resolved.baseId,
      wordText: resolved.en,
      gameType,
      isCorrect,
      timeSpentMs,
      moduleId,
      lessonId,
      stepUid,
      contextData
    });
  }
  
  /**
   * Helper: Extract quiz type from step data
   * Used by LessonRunner to determine tracking logic
   */
  static inferQuizType(step: any): QuizType {
    // Check step.data.quizType if available
    if (step?.data?.quizType) {
      return step.data.quizType;
    }
    
    // Infer from step type
    switch (step?.type) {
      case 'grammar-intro':
      case 'grammar-fill-blank':
        return 'grammar';
      case 'audio-meaning':
      case 'audio-sequence':
      case 'flashcard':
      case 'matching':
      case 'text-sequence':
        return 'vocab-normal';
      case 'quiz':
        return 'vocab-normal'; // Default for quiz
      case 'reverse-quiz':
        return 'vocab-reverse';
      case 'final':
        return 'phrase';
      default:
        return 'vocab-normal'; // Safe default
    }
  }
}

