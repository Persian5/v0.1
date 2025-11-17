import { QuizStep } from "../../types";
import { VocabularyItem } from "../../types";
import { VocabularyService } from "../../services/vocabulary-service";

/**
 * Internal helper function to generate vocab quiz steps
 * 
 * This is the implementation logic for quiz step generation.
 * Exported for use by curriculum-helpers.ts wrapper.
 * 
 * Uses VocabularyService for global vocabulary lookup to support
 * quizzing on vocabulary from previous lessons.
 * 
 * @param vocabulary - DEPRECATED: Kept for backward compatibility, not used (VocabularyService looks up vocab)
 * @param vocabId - Vocabulary ID to test (e.g., "salam")
 * @param quizType - Type of quiz: "vocab-normal" (Persian → English) or "vocab-reverse" (English → Persian)
 * @param points - Points for the quiz (default: 2)
 * @returns QuizStep with auto-generated prompt and empty options
 */
export function quizHelper(
  vocabulary: VocabularyItem[],  // DEPRECATED: Not used, kept for backward compat
  vocabId: string,
  quizType: 'vocab-normal' | 'vocab-reverse',
  points: number = 2
): QuizStep {
  // Look up vocabulary globally (supports cross-lesson quizzes)
  const vocab = VocabularyService.findVocabularyById(vocabId);
  
  if (!vocab) {
    throw new Error(
      `[quizHelper] Vocabulary ID "${vocabId}" not found in curriculum. ` +
      `Make sure the vocabulary exists in any lesson.`
    );
  }
  
  // Generate prompt based on quiz type
  let prompt: string;
  if (quizType === 'vocab-normal') {
    // Persian prompt → English options
    // "What does Salam mean?"
    prompt = `What does ${vocab.finglish} mean?`;
  } else {
    // vocab-reverse: English prompt → Persian options
    // "Which means 'Hello'?"
    prompt = `Which means '${vocab.en}'?`;
  }
  
  return {
    type: "quiz",
    points,
    data: {
      prompt,
      options: [], // Empty - WordBankService will generate distractors
      correct: 0, // Always 0 - first option from WordBankService is correct
      quizType,
      vocabularyId: vocabId
    }
  };
}
