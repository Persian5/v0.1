import { FinalStep, VocabularyItem } from "../../types";

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
 * This is the implementation logic for final step generation.
 * Exported for use by curriculum-helpers.ts wrapper.
 * 
 * Final steps present a conversation challenge where users arrange words in order.
 * Auto-generates words array, targetWords, and persianSequence from vocabulary IDs.
 * 
 * @param vocabulary - Array of vocabulary items from the lesson (for lookup)
 * @param vocabIds - Array of vocabulary IDs in the target order (e.g., ["salam", "chetori", "merci", "khodafez"])
 * @param points - Points for the final challenge (default: 4)
 * @param options - Optional custom fields (title, messages, conversationFlow)
 * @returns FinalStep with auto-generated words, targetWords, and persianSequence
 */
export function finalHelper(
  vocabulary: VocabularyItem[],
  vocabIds: string[],
  points: number = 4,
  options?: FinalStepOptions
): FinalStep {
  // Validate all vocabulary IDs exist
  const missingIds = vocabIds.filter(id => !vocabulary.find(v => v.id === id));
  if (missingIds.length > 0) {
    throw new Error(
      `[finalHelper] Vocabulary IDs not found in vocabulary array: ${missingIds.join(', ')}. ` +
      `Available IDs: ${vocabulary.map(v => v.id).join(', ')}`
    );
  }

  // Auto-generate words array from vocabulary
  const words = vocabIds.map(vocabId => {
    const vocab = vocabulary.find(v => v.id === vocabId);
    if (!vocab) {
      // This should never happen due to validation above, but TypeScript needs it
      throw new Error(`[finalHelper] Vocabulary ID "${vocabId}" not found`);
    }
    
    return {
      id: vocabId,
      text: vocab.finglish,  // Use finglish for display (e.g., "Salam")
      translation: vocab.en   // Use English translation (e.g., "Hello")
    };
  });

  // Auto-generate targetWords (same as vocabIds in order)
  const targetWords = [...vocabIds];

  // Auto-generate persianSequence (same as vocabIds in order)
  const persianSequence = [...vocabIds];

  // Default messages (used unless overridden)
  const defaultSuccessMessage = "Perfect! You can greet someone in Persian!";
  const defaultIncorrectMessage = "Almost there, try that conversation again!";

  // Build conversationFlow (required)
  const conversationFlow = {
    description: options.conversationFlow.description,
    expectedPhrase: options.conversationFlow.expectedPhrase,
    persianSequence // Auto-generated from vocabIds
  };

  return {
    type: "final",
    points,
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

