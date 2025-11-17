import { QuizStep } from "../../types";
import { VocabularyItem } from "../../types";

/**
 * Internal helper function to generate vocab quiz steps
 * 
 * This is the implementation logic for quiz step generation.
 * Exported for use by curriculum-helpers.ts wrapper.
 * 
 * IMPORTANT: Does NOT validate or look up vocabulary during curriculum initialization
 * to avoid circular dependencies. Prompt generation and validation happen at runtime in UI.
 * 
 * @param vocabulary - DEPRECATED: Kept for backward compatibility, not used
 * @param vocabId - Vocabulary ID to test (e.g., "salam")
 * @param quizType - Type of quiz: "vocab-normal" (Persian → English) or "vocab-reverse" (English → Persian)
 * @param points - Points for the quiz (default: 2)
 * @returns QuizStep with vocabularyId (no validation, no prompt generation)
 */
export function quizHelper(
  vocabulary: VocabularyItem[],  // DEPRECATED: Not used, kept for backward compat
  vocabId: string,
  quizType: 'vocab-normal' | 'vocab-reverse',
  points: number = 2
): QuizStep {
  // NO VALIDATION - store raw ID and quiz type
  // UI component will look up vocab and generate prompt at runtime
  return {
    type: "quiz",
    points,
    data: {
      prompt: "",  // Empty - UI generates prompt at runtime from vocabularyId
      options: [], // Empty - WordBankService will generate distractors at runtime
      correct: 0,  // Always 0 - first option from WordBankService is correct
      quizType,
      vocabularyId: vocabId
    }
  };
}
