import { FlashcardStep } from "../../types";
import { VocabularyItem } from "../../types";
import { VocabularyService } from "../../services/vocabulary-service";

/**
 * Internal helper function to generate flashcard steps
 * 
 * This is the implementation logic for flashcard step generation.
 * Exported for use by curriculum-helpers.ts wrapper.
 * 
 * Uses VocabularyService for global vocabulary lookup to support
 * flashcards for vocabulary from any lesson.
 * 
 * @param vocabulary - DEPRECATED: Kept for backward compatibility, not used (VocabularyService looks up vocab)
 * @param vocabId - Vocabulary ID to display (e.g., "salam")
 * @param points - Points for the flashcard (default: 1)
 * @returns FlashcardStep with vocabularyId reference
 */
export function flashcardHelper(
  vocabulary: VocabularyItem[],  // DEPRECATED: Not used, kept for backward compat
  vocabId: string,
  points: number = 1
): FlashcardStep {
  // Look up vocabulary globally (supports cross-lesson flashcards)
  const vocab = VocabularyService.findVocabularyById(vocabId);
  
  if (!vocab) {
    throw new Error(
      `[flashcardHelper] Vocabulary ID "${vocabId}" not found in curriculum. ` +
      `Make sure the vocabulary exists in any lesson.`
    );
  }
  
  return {
    type: "flashcard",
    points,
    data: {
      vocabularyId: vocabId
    }
  };
}
