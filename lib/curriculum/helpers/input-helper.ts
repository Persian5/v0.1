import { InputStep } from "../../types";

/**
 * Internal helper function to generate input exercise steps
 * 
 * This is the implementation logic for input step generation.
 * Exported for use by curriculum-helpers.ts wrapper.
 * 
 * @param question - The question prompt (e.g., "How do you say 'Goodbye' in Persian?")
 * @param answer - The expected answer (e.g., "Khodafez")
 * @param points - Points for the input exercise (default: 2)
 * @returns InputStep with question and answer
 */
export function inputHelper(
  question: string,
  answer: string,
  points: number = 2
): InputStep {
  return {
    type: "input",
    points,
    data: {
      question,
      answer
    }
  };
}

