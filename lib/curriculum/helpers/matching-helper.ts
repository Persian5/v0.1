import { MatchingStep } from "../../types";

/**
 * Internal helper function to generate matching steps
 * 
 * This is the implementation logic for matching step generation.
 * Exported for use by curriculum-helpers.ts wrapper.
 * 
 * Matching steps present words and slots that users drag to match.
 * 
 * @param pairs - Array of [word, slot] tuples (e.g., [["Salam", "Hello"], ["Chetori", "How are you?"]])
 * @param points - Points for the matching exercise (default: 3)
 * @returns MatchingStep with words and slots arrays
 */
export function matchingHelper(
  pairs: [string, string][],
  points: number = 3
): MatchingStep {
  // Generate unique IDs for words and slots
  const words = pairs.map(([word], index) => ({
    id: `word${index + 1}`,
    text: word,
    slotId: `slot${index + 1}`
  }));

  const slots = pairs.map(([, slot], index) => ({
    id: `slot${index + 1}`,
    text: slot
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

