import { MatchingStep, LexemeRef } from "../../types";
import { GrammarService } from "../../services/grammar-service";

/**
 * Internal helper function to generate matching steps
 * 
 * PHASE 4.3: Now supports LexemeRef[] (base vocab or grammar forms)
 * 
 * Matching steps present words and slots that users drag to match.
 * Auto-generates English translations from lexeme references.
 * 
 * Uses GrammarService.resolve() to support both base vocab and grammar forms.
 * 
 * @param refs - Array of lexeme references to match
 * @param points - Points for the matching exercise (default: 3)
 * @returns MatchingStep with words and slots arrays
 * 
 * Examples:
 *   matchingHelper(["salam", "khodafez"])
 *   matchingHelper([{ kind: "suffix", baseId: "khoob", suffixId: "am" }, "bad"])
 */
export function matchingHelper(
  refs: LexemeRef[],
  points: number = 3
): MatchingStep {
  // Resolve all lexeme references
  const pairs = refs.map(ref => {
    const resolved = GrammarService.resolve(ref);
    
    return {
      word: resolved.finglish,  // Persian/Finglish word (e.g., "Salam" or "Khoobam")
      slot: resolved.en         // English translation (e.g., "Hello" or "I'm good")
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

