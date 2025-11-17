import { MatchingStep, VocabularyItem } from "../../types";
import { VocabularyService } from "../../services/vocabulary-service";

/**
 * Internal helper function to generate matching steps
 * 
 * This is the implementation logic for matching step generation.
 * Exported for use by curriculum-helpers.ts wrapper.
 * 
 * Matching steps present words and slots that users drag to match.
 * Auto-generates English translations from vocabulary IDs.
 * 
 * Uses VocabularyService.findVocabularyById() to look up vocabulary dynamically
 * from the entire curriculum - no need to pass vocabulary arrays!
 * 
 * @param vocabIds - Array of vocabulary IDs to match (e.g., ["salam", "khodafez"])
 * @param points - Points for the matching exercise (default: 3)
 * @returns MatchingStep with words and slots arrays
 */
export function matchingHelper(
  vocabIds: string[],
  points: number = 3
): MatchingStep {
  // Look up vocabulary items from entire curriculum using VocabularyService
  const pairs = vocabIds.map(vocabId => {
    const vocab = VocabularyService.findVocabularyById(vocabId);
    
    if (!vocab) {
      throw new Error(
        `[matchingHelper] Vocabulary ID "${vocabId}" not found in curriculum. ` +
        `Make sure this vocabulary exists in your curriculum definition.`
      );
    }
    
    return {
      word: vocab.finglish,  // Persian/Finglish word (e.g., "Salam")
      slot: vocab.en          // English translation (e.g., "Hello")
    };
  });

  // Generate unique IDs for words and slots
  const words = pairs.map((pair, index) => ({
    id: `word${index + 1}`,
    text: pair.word,
    slotId: `slot${index + 1}`
  }));

  const slots = pairs.map((pair, index) => ({
    id: `slot${index + 1}`,
    text: pair.slot
  }));

  return {
    type: "matching",
    points,
    data: {
      words,
      slots
    }
  };
}

