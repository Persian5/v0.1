import { InputStep, LexemeRef } from "../../types";

/**
 * Internal helper function to generate input exercise steps
 * 
 * This is the implementation logic for input step generation.
 * Exported for use by curriculum-helpers.ts wrapper.
 * 
 * @param question - The question prompt (e.g., "How do you say 'Goodbye' in Persian?")
 * @param answer - The expected answer (e.g., "Khodafez")
 * @param points - Points for the input exercise (default: 2)
 * @param vocabRef - Optional: Vocabulary ID or Grammar Form for tracking
 * @returns InputStep with question and answer
 */
export function inputHelper(
  question: string,
  answer: string,
  points: number = 2,
  vocabRef?: string | LexemeRef
): InputStep {
  const vocabularyId = typeof vocabRef === 'string' ? vocabRef : undefined;
  const lexemeRef = typeof vocabRef !== 'string' ? vocabRef : undefined;

  return {
    type: "input",
    points,
    data: {
      question,
      answer,
      vocabularyId, // NEW: For tracking
      lexemeRef     // NEW: For grammar forms
    }
  };
}

