import { FinalStep, LexemeRef, VocabularyItem } from "../../types";
import { GrammarService } from "../../services/grammar-service";

/**
 * Options for final step generation
 */
export interface FinalStepOptions {
  conversationFlow: {
    description: string;
    expectedPhrase: string;
    // persianSequence is auto-generated from vocabIds
  };
  title?: string;
  description?: string;
  // successMessage and incorrectMessage have defaults - only override if needed
  successMessage?: string;
  incorrectMessage?: string;
}

/**
 * Internal helper function to generate final challenge steps
 * 
 * PHASE 4.4: Now supports LexemeRef[] (base vocab or grammar forms)
 * 
 * Final steps present a conversation challenge where users arrange words in order.
 * 
 * IMPORTANT: Stores raw LexemeRef[] to avoid circular dependencies during curriculum initialization.
 * Generates placeholder words. UI component resolves at runtime.
 * 
 * @param vocabulary - DEPRECATED: Kept for backward compatibility, not used
 * @param refs - Array of lexeme references in the target order
 * @param options - Required conversationFlow, optional title and custom messages
 * @returns FinalStep with placeholder words + raw LexemeRef[] for runtime resolution
 * 
 * Examples:
 *   finalHelper(vocabulary, ["salam", "chetori", "merci"], { conversationFlow: {...} })
 *   finalHelper(vocabulary, [{ kind: "suffix", baseId: "khoob", suffixId: "am" }, "merci"], { conversationFlow: {...} })
 */
export function finalHelper(
  vocabulary: VocabularyItem[], // DEPRECATED: Kept for backward compatibility
  refs: LexemeRef[],
  options: FinalStepOptions
): FinalStep {
  // Generate placeholder words using simple IDs
  // UI will resolve the actual text at runtime from lexemeRefs
  const words = refs.map(ref => {
    const id = typeof ref === 'string' ? ref : `${ref.baseId}_${ref.suffixId}`;
    return {
      id,
      text: id,          // Placeholder - UI resolves from lexemeRefs
      translation: id    // Placeholder - UI resolves from lexemeRefs
    };
  });

  // Generate placeholder targetWords (simple IDs)
  const targetWords = refs.map(ref => 
    typeof ref === 'string' ? ref : `${ref.baseId}_${ref.suffixId}`
  );

  // Generate placeholder persianSequence (simple IDs)
  const persianSequence = refs.map(ref => 
    typeof ref === 'string' ? ref : `${ref.baseId}_${ref.suffixId}`
  );

  // Default messages (used unless overridden)
  const defaultSuccessMessage = "Perfect! You can greet someone in Persian!";
  const defaultIncorrectMessage = "Almost there, try that conversation again!";

  // Build conversationFlow (required)
  const conversationFlow = {
    description: options.conversationFlow.description,
    expectedPhrase: options.conversationFlow.expectedPhrase,
    persianSequence // Placeholder IDs
  };

  return {
    type: "final",
    points: 4, // Consistent default
    data: {
      words,
      targetWords,
      conversationFlow,
      lexemeRefs: refs  // NEW: Store raw LexemeRef[] for runtime resolution
    },
    title: options.title || "Final Challenge",
    description: options.description,
    successMessage: options.successMessage || defaultSuccessMessage,
    incorrectMessage: options.incorrectMessage || defaultIncorrectMessage
  };
}

