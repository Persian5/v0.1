import { VocabularyItem } from "../types";

/**
 * Vocabulary builder helper
 * 
 * Creates vocabulary arrays from parallel arrays of properties.
 * Much more compact than defining each vocabulary item individually.
 * 
 * @param lessonId - Lesson ID (e.g., "module1-lesson1")
 * @param vocabData - Object with parallel arrays for each property
 * @returns Array of VocabularyItem objects
 * 
 * @example
 * const vocabulary = createVocabulary("module1-lesson1", {
 *   ids: ["salam", "chetori", "khodafez", "merci"],
 *   en: ["Hello", "How Are You?", "Goodbye", "Thank You"],
 *   fa: ["سلام", "چطوری", "خداحافظ", "مرسی"],
 *   finglish: ["Salam", "Chetori", "Khodafez", "Merci"],
 *   phonetic: ["sah-LUHM", "che-TOH-ree", "kho-DUH-fez", "mer-SEE"]
 * });
 */
export function createVocabulary(
  lessonId: string,
  vocabData: {
    ids: string[];
    en: string[];
    fa: string[];
    finglish: string[];
    phonetic: string[];
  }
): VocabularyItem[] {
  const { ids, en, fa, finglish, phonetic } = vocabData;
  
  // Validate all arrays have same length
  const length = ids.length;
  if (en.length !== length || fa.length !== length || finglish.length !== length || phonetic.length !== length) {
    throw new Error(
      `[createVocabulary] All arrays must have the same length. ` +
      `ids: ${length}, en: ${en.length}, fa: ${fa.length}, finglish: ${finglish.length}, phonetic: ${phonetic.length}`
    );
  }
  
  // Build vocabulary items
  return ids.map((id, index) => ({
    id,
    en: en[index],
    fa: fa[index],
    finglish: finglish[index],
    phonetic: phonetic[index],
    lessonId
  }));
}

