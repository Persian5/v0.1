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
 * Auto-generates words array, targetWords, and persianSequence from lexeme references.
 * Points have consistent default - always 4 points.
 * 
 * @param vocabulary - DEPRECATED: Kept for backward compatibility, not used (GrammarService looks up vocab)
 * @param refs - Array of lexeme references in the target order
 * @param options - Required conversationFlow, optional title and custom messages
 * @returns FinalStep with auto-generated words, targetWords, and persianSequence
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
  // Resolve all lexeme references (vocabulary parameter ignored)
  const resolved = refs.map(ref => GrammarService.resolve(ref));

  // Auto-generate words array from resolved lexemes
  const words = resolved.map(lexeme => ({
    id: lexeme.id,          // Surface ID (e.g., "khoobam" for grammar forms)
    text: lexeme.finglish,  // Use finglish for display (e.g., "Salam" or "Khoobam")
    translation: lexeme.en   // Use English translation (e.g., "Hello" or "I'm good")
  }));

  // Auto-generate targetWords (surface IDs in order)
  const targetWords = resolved.map(lexeme => lexeme.id);

  // Auto-generate persianSequence (surface IDs in order)
  const persianSequence = resolved.map(lexeme => lexeme.id);

  // Default messages (used unless overridden)
  const defaultSuccessMessage = "Perfect! You can greet someone in Persian!";
  const defaultIncorrectMessage = "Almost there, try that conversation again!";

  // Build conversationFlow (required)
  const conversationFlow = {
    description: options.conversationFlow.description,
    expectedPhrase: options.conversationFlow.expectedPhrase,
    persianSequence // Auto-generated from refs
  };

  return {
    type: "final",
    points: 4, // Consistent default
    data: {
      words,
      targetWords,
      conversationFlow,
      ...(options?.title && { title: options.title }),
      ...(options?.description && { description: options.description }),
      successMessage: options?.successMessage || defaultSuccessMessage,
      incorrectMessage: options?.incorrectMessage || defaultIncorrectMessage
    }
  };
}

