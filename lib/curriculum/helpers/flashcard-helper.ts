import { FlashcardStep } from "../../types";
import { VocabularyItem } from "../../types";

/**
 * Internal helper function to generate flashcard steps
 * 
 * This is the implementation logic for flashcard step generation.
 * Exported for use by curriculum-helpers.ts wrapper.
 * 
 * IMPORTANT: Does NOT validate vocabulary during curriculum initialization
 * to avoid circular dependencies. Validation happens at runtime in UI.
 * 
 * @param vocabulary - DEPRECATED: Kept for backward compatibility, not used
 * @param vocabId - Vocabulary ID to display (e.g., "salam")
 * @param points - Points for the flashcard (default: 1)
 * @returns FlashcardStep with vocabularyId reference (no validation)
 */
export function flashcardHelper(
  vocabulary: VocabularyItem[],  // DEPRECATED: Not used, kept for backward compat
  vocabId: string,
  points: number = 1
): FlashcardStep {
  // NO VALIDATION - store raw ID, validation happens at runtime
  return {
    type: "flashcard",
    points,
    data: {
      vocabularyId: vocabId
    }
  };
}
