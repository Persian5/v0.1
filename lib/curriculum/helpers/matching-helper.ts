import { MatchingStep } from "../../types";

/**
 * Pair structure for matching helper
 */
export interface MatchingPair {
  word: string;  // Persian/Finglish word (e.g., "Salam")
  slot: string;  // English translation (e.g., "Hello")
}

/**
 * Internal helper function to generate matching steps
 * 
 * This is the implementation logic for matching step generation.
 * Exported for use by curriculum-helpers.ts wrapper.
 * 
 * Matching steps present words and slots that users drag to match.
 * 
 * @param pairs - Array of word-slot pairs (e.g., [{word: "Salam", slot: "Hello"}, ...])
 * @param points - Points for the matching exercise (default: 3)
 * @returns MatchingStep with words and slots arrays
 */
export function matchingHelper(
  pairs: MatchingPair[],
  points: number = 3
): MatchingStep {
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

