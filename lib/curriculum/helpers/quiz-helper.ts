import { QuizStep } from "../../types";
import { VocabularyItem } from "../../types";

/**
 * Internal helper function to generate vocab quiz steps
 * 
 * This is the implementation logic for quiz step generation.
 * Exported for use by curriculum-helpers.ts wrapper.
 * 
 * @param vocabulary - Array of vocabulary items from the lesson (for lookup)
 * @param vocabId - Vocabulary ID to test (e.g., "salam")
 * @param quizType - Type of quiz: "vocab-normal" (Persian → English) or "vocab-reverse" (English → Persian)
 * @param points - Points for the quiz (default: 2)
 * @returns QuizStep with auto-generated prompt and empty options
 */
export function quizHelper(
  vocabulary: VocabularyItem[],
  vocabId: string,
  quizType: 'vocab-normal' | 'vocab-reverse',
  points: number = 2
): QuizStep {
  // Find vocabulary item
  const vocab = vocabulary.find(v => v.id === vocabId);
  
  if (!vocab) {
    throw new Error(
      `[quizHelper] Vocabulary ID "${vocabId}" not found in vocabulary array. ` +
      `Available IDs: ${vocabulary.map(v => v.id).join(', ')}`
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

