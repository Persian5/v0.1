import { MatchingStep, LexemeRef } from "../../types";
import { GrammarService } from "../../services/grammar-service";

/**
 * Internal helper function to generate matching steps
 * 
 * PHASE 4.3: Now supports LexemeRef[] (base vocab or grammar forms)
 * 
 * Matching steps present words and slots that users drag to match.
 * 
 * IMPORTANT: Stores raw LexemeRef[] to avoid circular dependencies during curriculum initialization.
 * For now, generates simple placeholder words/slots. UI component should resolve at runtime.
 * 
 * @param refs - Array of lexeme references to match
 * @param points - Points for the matching exercise (default: 3)
 * @returns MatchingStep with placeholder words/slots + raw LexemeRef[]
 * 
 * Examples:
 *   matchingHelper(["salam", "khodafez"])
 *   matchingHelper([{ kind: "suffix", baseId: "khoob", suffixId: "am" }, "bad"])
 */
export function matchingHelper(
  refs: LexemeRef[],
  points: number = 3
): MatchingStep {
  // Generate placeholder words and slots using simple IDs
  // UI will resolve the actual text at runtime from lexemeRefs
  const words = refs.map((ref, index) => {
    const id = typeof ref === 'string' ? ref : `${ref.baseId}_${ref.suffixId}`;
    return {
      id: `word${index + 1}`,
      text: id,  // Placeholder - UI resolves from lexemeRefs
      slotId: `slot${index + 1}`
    };
  });

  const slots = refs.map((ref, index) => {
    const id = typeof ref === 'string' ? ref : `${ref.baseId}_${ref.suffixId}`;
    return {
      id: `slot${index + 1}`,
      text: id  // Placeholder - UI resolves from lexemeRefs
    };
  });

  return {
    type: "matching",
    points,
    data: {
      words,
      slots,
      lexemeRefs: refs  // NEW: Store raw LexemeRef[] for runtime resolution
    }
  };
}
