import { FlashcardStep } from "../../types";
import { VocabularyItem } from "../../types";

/**
 * Internal helper function to generate flashcard steps
 * 
 * This is the implementation logic for flashcard step generation.
 * Exported for use by curriculum-helpers.ts wrapper.
 * 
 * @param vocabulary - Array of vocabulary items from the lesson (for validation)
 * @param vocabId - Vocabulary ID to display (e.g., "salam")
 * @param points - Points for the flashcard (default: 1)
 * @returns FlashcardStep with vocabularyId reference
 */
export function flashcardHelper(
  vocabulary: VocabularyItem[],
  vocabId: string,
  points: number = 1
): FlashcardStep {
  // Validate vocabulary ID exists
  const vocab = vocabulary.find(v => v.id === vocabId);
  
  if (!vocab) {
    throw new Error(
      `[flashcardHelper] Vocabulary ID "${vocabId}" not found in vocabulary array. ` +
      `Available IDs: ${vocabulary.map(v => v.id).join(', ')}`
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

