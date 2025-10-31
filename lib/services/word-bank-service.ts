/**
 * Word Bank Service
 * 
 * Unified word bank generation for AudioSequence and TextSequence games.
 * Handles:
 * - ExpectedTranslation-first matching with vocabularyBank fallback
 * - Smart phrase detection (keeps phrases if vocabulary item exists)
 * - Sentence case normalization (consistent capitalization)
 * - Semantic distractor generation (70% same group, 30% related groups)
 * - Dynamic word bank sizing (7-13 words based on correct word count)
 */

import { VocabularyItem } from '../types';
import { getSemanticGroup, getRelatedGroups, getVocabIdsInGroup } from '../config/semantic-groups';

/**
 * Options for word bank generation
 */
export interface WordBankOptions {
  expectedTranslation?: string; // English translation to build (required for TextSequence)
  vocabularyBank: VocabularyItem[]; // All available vocabulary for this lesson
  sequenceIds?: string[]; // Vocabulary IDs in correct order (for AudioSequence)
  maxSize?: number; // Maximum word bank size (overrides dynamic calculation)
  distractorStrategy?: 'semantic' | 'random'; // Distractor selection strategy
}

/**
 * Result of word bank generation
 */
export interface WordBankResult {
  correctWords: string[]; // Normalized correct words/phrases
  distractors: string[]; // Normalized distractor words/phrases
  allOptions: string[]; // Shuffled complete word bank
  wordBankItems: WordBankItem[]; // Detailed items with metadata
}

/**
 * Individual word bank item with metadata
 */
export interface WordBankItem {
  vocabularyId?: string; // Vocabulary item ID if matched
  wordText: string; // Normalized display text
  isPhrase: boolean; // Is this a phrase or single word?
  semanticGroup?: string; // Semantic group for distractor generation
  isCorrect?: boolean; // Is this a correct answer? (set during final assembly)
}

/**
 * Contextual mapping for pronouns/possessives
 * Maps expected words to vocabulary IDs for contextual matching
 */
const CONTEXTUAL_MAPPING: Record<string, string[]> = {
  'i': ['man'],
  'me': ['man'],
  'my': ['man'],
  'you': ['shoma'],
  'your': ['shoma'],
  // Add more as needed
};

/**
 * Word Bank Service
 * 
 * Provides unified word bank generation logic for sequence-based games
 */
export class WordBankService {
  /**
   * Normalize vocabulary English translation for display
   * - Handles slash-separated translations ("I / Me" → "I")
   * - Removes extra whitespace
   * - Returns first part before slash for consistency
   * 
   * @param enText - English translation text (e.g., "I / Me", "I'm Good")
   * @returns Normalized text for display
   */
  static normalizeVocabEnglish(enText: string): string {
    if (!enText) return enText;
    
    // Handle slash-separated translations (e.g., "I / Me" → "I")
    const parts = enText.split('/').map(p => p.trim());
    const firstPart = parts[0];
    
    // Remove extra whitespace
    return firstPart.replace(/\s+/g, ' ').trim();
  }

  /**
   * Normalize vocabulary English translation for validation
   * - Handles slash-separated translations (checks both parts)
   * - Normalizes case and punctuation
   * - Returns array of normalized variants for matching
   * 
   * @param enText - English translation text (e.g., "I / Me", "I'm Good")
   * @returns Array of normalized variants for validation
   */
  static normalizeVocabEnglishForValidation(enText: string): string[] {
    if (!enText) return [];
    
    // Split by slash and get all parts
    const parts = enText.split('/').map(p => p.trim().toLowerCase());
    
    // Normalize each part (remove punctuation, normalize case)
    return parts.map(part => 
      part.replace(/[?!.,]/g, '').trim().toLowerCase()
    ).filter(p => p.length > 0);
  }
  /**
   * Get semantic unit count for progress tracking
   * Counts phrases as 1 unit, single words as 1 unit
   * This aligns with how WordBankService processes semantic units
   * 
   * @param options - Same options as generateWordBank
   * @returns Number of semantic units (phrases + words) in the correct answer
   */
  static getSemanticUnits(options: WordBankOptions): number {
    const { expectedTranslation, vocabularyBank, sequenceIds } = options;

    // Extract correct words from expectedTranslation or sequenceIds
    const correctWords = this.extractCorrectWords(expectedTranslation, sequenceIds, vocabularyBank);

    // Match words to vocabularyBank items (smart phrase detection)
    // This gives us the actual semantic units (phrases count as 1, words count as 1)
    const correctWordBankItems = this.matchWordsToVocabulary(correctWords, vocabularyBank, expectedTranslation);

    return correctWordBankItems.length;
  }

  /**
   * Generate word bank for AudioSequence or TextSequence
   * 
   * @param options - Word bank generation options
   * @returns Complete word bank with correct words and distractors
   */
  static generateWordBank(options: WordBankOptions): WordBankResult {
    const { expectedTranslation, vocabularyBank, sequenceIds, maxSize, distractorStrategy = 'semantic' } = options;

    // Step 1: Extract correct words from expectedTranslation or sequenceIds
    const correctWords = this.extractCorrectWords(expectedTranslation, sequenceIds, vocabularyBank);

    // Step 2: Match words to vocabularyBank items (smart phrase detection)
    const correctWordBankItems = this.matchWordsToVocabulary(correctWords, vocabularyBank, expectedTranslation).map(item => ({
      ...item,
      isCorrect: true
    }));

    // Step 3: Calculate word bank size
    const targetSize = maxSize || this.calculateWordBankSize(correctWordBankItems.length);

    // Step 4: Generate distractors
    let distractorItems = distractorStrategy === 'semantic'
      ? this.generateSemanticDistractors(correctWordBankItems, vocabularyBank, targetSize - correctWordBankItems.length)
      : this.generateRandomDistractors(correctWordBankItems, vocabularyBank, targetSize - correctWordBankItems.length);

    // STEP: Remove redundant single-word distractors from multi-word correct vocab items
    // Example: If "I'm good" is correct, remove "good", "I'm", "I", "am" as distractors
    const correctVocabWords = new Set<string>();
    
    correctWordBankItems.forEach(item => {
      // Check if this is a multi-word vocab item (has space in English)
      const wordText = item.wordText.toLowerCase();
      if (wordText.includes(' ')) {
        // Split the English translation into individual words
        const words = wordText.split(/\s+/).map(w => {
          // Remove punctuation and convert to lowercase
          let cleaned = w.replace(/[?!.,]/g, '').toLowerCase();
          
          // Handle contractions: "I'm" → ["I", "am"], "you're" → ["you", "are"]
          if (cleaned === "i'm") cleaned = "i am";
          if (cleaned === "you're") cleaned = "you are";
          if (cleaned === "we're") cleaned = "we are";
          if (cleaned === "they're") cleaned = "they are";
          if (cleaned === "he's") cleaned = "he is";
          if (cleaned === "she's") cleaned = "she is";
          if (cleaned === "it's") cleaned = "it is";
          if (cleaned === "don't") cleaned = "do not";
          if (cleaned === "doesn't") cleaned = "does not";
          if (cleaned === "isn't") cleaned = "is not";
          if (cleaned === "aren't") cleaned = "are not";
          if (cleaned === "won't") cleaned = "will not";
          if (cleaned === "can't") cleaned = "can not";
          if (cleaned === "didn't") cleaned = "did not";
          
          return cleaned;
        });
        
        // Extract individual words (split contractions into components)
        words.forEach(word => {
          // Split contractions like "i am" into ["i", "am"]
          const splitWords = word.split(/\s+/);
          splitWords.forEach(w => {
            if (w.length > 0) {
              correctVocabWords.add(w);
            }
          });
        });
      }
    });

    // Filter out single-word distractors that are words from multi-word correct vocab items
    distractorItems = distractorItems.filter(item => {
      const wordText = item.wordText.toLowerCase().replace(/[?!.,]/g, '');
      
      // Keep multi-word distractors (they won't be redundant subwords)
      if (item.wordText.includes(' ') || item.isPhrase) {
        return true;
      }
      
      // For single words: remove if they're a word from any multi-word correct vocab item
      if (correctVocabWords.has(wordText)) {
        return false; // Remove redundant single-word distractor
      }
      
      return true; // Keep the distractor
    });

    // Optional debug log (uncomment if needed for testing)
    // if (process.env.NODE_ENV !== 'production') {
    //   console.log('Filtered distractors:', distractorItems.map(d => d.wordText));
    // }

    // Step 5: Normalize all words to sentence case
    const normalizedCorrect = correctWordBankItems.map(item => this.normalizeCase(item.wordText));
    const normalizedDistractors = distractorItems.map(item => this.normalizeCase(item.wordText));

    // Step 6: Combine and shuffle
    const allNormalized = [...normalizedCorrect, ...normalizedDistractors];
    const shuffled = this.shuffleArray([...allNormalized]);

    // Step 7: Build complete word bank items with metadata and apply synonym deduplication
    // First normalize all word texts
    const normalizedCorrectItems = correctWordBankItems.map(item => ({
      ...item,
      wordText: this.normalizeCase(item.wordText),
      isCorrect: true
    }));
    const normalizedDistractorItems = distractorItems.map(item => ({
      ...item,
      wordText: this.normalizeCase(item.wordText),
      isCorrect: false
    }));

    // Step 7b: Deduplicate synonyms (e.g., "Hi" and "Hello", "Salam" = "Hello")
    // If correct items include one synonym, remove others from distractors
    const correctSemanticGroups = new Set(
      normalizedCorrectItems
        .map(item => item.semanticGroup)
        .filter((g): g is string => g !== undefined)
    );
    
    // Build set of correct normalized word texts for comparison
    const correctWordTexts = new Set(
      normalizedCorrectItems.map(item => item.wordText.toLowerCase().replace(/[?.,!]/g, '').trim())
    );
    
    // Filter distractors: remove synonyms of correct items
    const filteredDistractorItems = normalizedDistractorItems.filter(item => {
      // Keep if not in greetings group
      if (!item.semanticGroup || item.semanticGroup !== 'greetings') {
        return true;
      }
      
      // For greetings: check if a correct item already has this semantic group
      if (correctSemanticGroups.has('greetings')) {
        // Get normalized text for comparison
        const itemNormalized = item.wordText.toLowerCase().replace(/[?.,!]/g, '').trim();
        
        // Check if any correct item with same semantic group matches
        const hasSynonym = normalizedCorrectItems.some(correctItem => {
          if (correctItem.semanticGroup !== 'greetings') return false;
          const correctNormalized = correctItem.wordText.toLowerCase().replace(/[?.,!]/g, '').trim();
          // If they're the same normalized text, it's a duplicate
          return correctNormalized === itemNormalized;
        });
        
        // Remove if synonym exists in correct items
        if (hasSynonym) return false;
        
        // Also check common synonyms explicitly
        const itemLower = itemNormalized.toLowerCase();
        const synonymMatches = normalizedCorrectItems.some(correctItem => {
          const correctLower = correctItem.wordText.toLowerCase().replace(/[?.,!]/g, '').trim();
          // "hi" and "hello" are synonyms, "salam" maps to "hello"
          if ((itemLower === 'hi' || itemLower === 'hello' || itemLower === 'salam') &&
              (correctLower === 'hi' || correctLower === 'hello' || correctLower === 'salam')) {
            return itemLower !== correctLower; // Different variants
          }
          return false;
        });
        
        return !synonymMatches;
      }
      
      return true;
    });

    const allWordBankItems: WordBankItem[] = [
      ...normalizedCorrectItems,
      ...filteredDistractorItems
    ];

    return {
      correctWords: normalizedCorrect,
      distractors: normalizedDistractors,
      allOptions: shuffled,
      wordBankItems: allWordBankItems
    };
  }

  /**
   * Extract correct words from expectedTranslation or sequenceIds
   * 
   * @param expectedTranslation - Expected English translation (for TextSequence)
   * @param sequenceIds - Vocabulary IDs in order (for AudioSequence)
   * @param vocabularyBank - Available vocabulary items
   * @returns Array of correct word texts
   */
  private static extractCorrectWords(
    expectedTranslation: string | undefined,
    sequenceIds: string[] | undefined,
    vocabularyBank: VocabularyItem[]
  ): string[] {
    if (expectedTranslation) {
      // TextSequence: Split expectedTranslation into words
      return expectedTranslation.split(' ').filter(w => w.length > 0);
    } else if (sequenceIds && sequenceIds.length > 0) {
      // AudioSequence: Get English translations from vocabularyBank
      // Normalize slash-separated translations (use first part)
      return sequenceIds
        .map(id => vocabularyBank.find(v => v.id === id))
        .filter((v): v is VocabularyItem => v !== undefined)
        .map(v => this.normalizeVocabEnglish(v.en));
    }
    
    return [];
  }

  /**
   * Match words to vocabularyBank items with smart phrase detection
   * Priority: 1) Match phrases first, 2) Match single words, 3) Use expected word as fallback
   * 
   * @param words - Words to match
   * @param vocabularyBank - Available vocabulary items
   * @param expectedTranslation - Original expected translation (for phrase detection)
   * @returns Array of word bank items with metadata
   */
  private static matchWordsToVocabulary(
    words: string[],
    vocabularyBank: VocabularyItem[],
    expectedTranslation?: string
  ): WordBankItem[] {
    const matchedItems: WordBankItem[] = [];
    const usedVocabIds = new Set<string>();

    // Step 1: Try to match phrases first (2-3 word combinations)
    const phraseMatchedIndices = new Set<number>();
    if (expectedTranslation) {
      // TextSequence: Detect phrases from expectedTranslation
      const phraseMatches = this.detectPhrases(expectedTranslation, vocabularyBank, usedVocabIds);
      matchedItems.push(...phraseMatches.matchedItems);
      phraseMatches.matchedVocabIds.forEach(id => usedVocabIds.add(id));
      // Track which word indices were used by phrases
      phraseMatches.matchedIndices.forEach(idx => phraseMatchedIndices.add(idx));
    } else {
      // AudioSequence: Detect phrases from vocabulary items themselves
      // Check if any vocab item has multi-word English (contains space)
      const phraseVocabs = vocabularyBank.filter(v => {
        const normalizedEn = this.normalizeVocabEnglish(v.en);
        return normalizedEn.includes(' ') && !usedVocabIds.has(v.id);
      });
      
      // Match vocab phrases to words in the sequence
      phraseVocabs.forEach(vocab => {
        const vocabEn = this.normalizeVocabEnglish(vocab.en);
        const vocabWords = vocabEn.toLowerCase().split(/\s+/).map(w => w.replace(/[?.,!]/g, '').trim());
        
        // Check if this vocab phrase matches words in sequence
        let wordStartIndex = -1;
        for (let i = 0; i <= words.length - vocabWords.length; i++) {
          const sequenceWords = words.slice(i, i + vocabWords.length).map(w => w.toLowerCase().trim());
          if (JSON.stringify(sequenceWords) === JSON.stringify(vocabWords)) {
            wordStartIndex = i;
            break;
          }
        }
        
        // If matched, add as phrase and mark indices as used
        if (wordStartIndex >= 0 && !phraseMatchedIndices.has(wordStartIndex)) {
          // Check if any of these indices are already matched
          let canUse = true;
          for (let j = 0; j < vocabWords.length; j++) {
            if (phraseMatchedIndices.has(wordStartIndex + j)) {
              canUse = false;
              break;
            }
          }
          
          if (canUse) {
            matchedItems.push({
              vocabularyId: vocab.id,
              wordText: this.normalizeVocabEnglish(vocab.en), // Normalized for display
              isPhrase: true,
              semanticGroup: vocab.semanticGroup || getSemanticGroup(vocab.id),
              isCorrect: true
            });
            usedVocabIds.add(vocab.id);
            // Mark all word indices as used
            for (let j = 0; j < vocabWords.length; j++) {
              phraseMatchedIndices.add(wordStartIndex + j);
            }
          }
        }
      });
    }

    // Step 2: Match remaining single words (skip indices already used by phrases)
    words.forEach((word, index) => {
      // Skip if this word index was already matched as part of a phrase
      if (phraseMatchedIndices.has(index)) {
        return;
      }
      
      // Also skip if word text already exists in matched items (additional safety check)
      if (matchedItems.some(item => item.wordText.toLowerCase().replace(/[?.,!]/g, '') === word.toLowerCase())) {
        return;
      }

      // Try exact match first (normalize for comparison)
      const normalizedWord = word.toLowerCase().trim();
      const exactMatch = vocabularyBank.find(v => {
        if (usedVocabIds.has(v.id)) return false;
        const vocabVariants = this.normalizeVocabEnglishForValidation(v.en);
        return vocabVariants.some(variant => variant === normalizedWord);
      });

      if (exactMatch) {
        matchedItems.push({
          vocabularyId: exactMatch.id,
          wordText: this.normalizeVocabEnglish(exactMatch.en), // Normalized for display
          isPhrase: false,
          semanticGroup: exactMatch.semanticGroup || getSemanticGroup(exactMatch.id),
          isCorrect: true
        });
        usedVocabIds.add(exactMatch.id);
        return;
      }

      // Try contextual mapping (e.g., "My" → "man")
      if (CONTEXTUAL_MAPPING[normalizedWord]) {
        const mappedVocabId = CONTEXTUAL_MAPPING[normalizedWord][0];
        const mappedVocab = vocabularyBank.find(v => 
          v.id === mappedVocabId && !usedVocabIds.has(v.id)
        );
        
        if (mappedVocab) {
          // Use expected word text, but validate against vocabulary
          matchedItems.push({
            vocabularyId: mappedVocab.id,
            wordText: word, // Keep original capitalization for now (will normalize later)
            isPhrase: false,
            semanticGroup: mappedVocab.semanticGroup || getSemanticGroup(mappedVocab.id),
            isCorrect: true
          });
          usedVocabIds.add(mappedVocab.id);
          return;
        }
      }

      // Fallback: Use expected word as-is (no vocabulary match)
      matchedItems.push({
        vocabularyId: undefined,
        wordText: word,
        isPhrase: false,
        semanticGroup: undefined,
        isCorrect: true
      });
    });

    return matchedItems;
  }

  /**
   * Detect phrases in expectedTranslation and match to vocabularyBank
   * 
   * @param expectedTranslation - Expected English translation
   * @param vocabularyBank - Available vocabulary items
   * @param usedVocabIds - Set of vocabulary IDs already used
   * @returns Matched phrase items, their vocabulary IDs, and matched word indices
   */
  private static detectPhrases(
    expectedTranslation: string,
    vocabularyBank: VocabularyItem[],
    usedVocabIds: Set<string>
  ): { matchedItems: WordBankItem[]; matchedVocabIds: string[]; matchedIndices: Set<number> } {
    const matchedItems: WordBankItem[] = [];
    const matchedVocabIds: string[] = [];
    const words = expectedTranslation.split(' ').filter(w => w.length > 0);
    const matchedIndices = new Set<number>();

    // Try 2-word phrases first
    for (let i = 0; i < words.length - 1; i++) {
      if (matchedIndices.has(i) || matchedIndices.has(i + 1)) continue;

      const twoWordPhrase = `${words[i]} ${words[i + 1]}`;
      const vocabMatch = vocabularyBank.find(v => {
        // Normalize both: lowercase, remove punctuation, normalize spacing
        const vocabEn = v.en.toLowerCase().replace(/[?.,!]/g, '').trim().replace(/\s+/g, ' ');
        const phraseLower = twoWordPhrase.toLowerCase().trim().replace(/\s+/g, ' ');
        return vocabEn === phraseLower && !usedVocabIds.has(v.id);
      });

      if (vocabMatch) {
        matchedItems.push({
          vocabularyId: vocabMatch.id,
          wordText: vocabMatch.en,
          isPhrase: true,
          semanticGroup: vocabMatch.semanticGroup || getSemanticGroup(vocabMatch.id),
          isCorrect: true
        });
        matchedVocabIds.push(vocabMatch.id);
        usedVocabIds.add(vocabMatch.id);
        matchedIndices.add(i);
        matchedIndices.add(i + 1);
      }
    }

    // Try 3-word phrases (less common)
    for (let i = 0; i < words.length - 2; i++) {
      if (matchedIndices.has(i) || matchedIndices.has(i + 1) || matchedIndices.has(i + 2)) continue;

      const threeWordPhrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      const vocabMatch = vocabularyBank.find(v => {
        // Normalize both: lowercase, remove punctuation, normalize spacing
        const vocabEn = v.en.toLowerCase().replace(/[?.,!]/g, '').trim().replace(/\s+/g, ' ');
        const phraseLower = threeWordPhrase.toLowerCase().trim().replace(/\s+/g, ' ');
        return vocabEn === phraseLower && !usedVocabIds.has(v.id);
      });

      if (vocabMatch) {
        matchedItems.push({
          vocabularyId: vocabMatch.id,
          wordText: vocabMatch.en,
          isPhrase: true,
          semanticGroup: vocabMatch.semanticGroup || getSemanticGroup(vocabMatch.id),
          isCorrect: true
        });
        matchedVocabIds.push(vocabMatch.id);
        usedVocabIds.add(vocabMatch.id);
        matchedIndices.add(i);
        matchedIndices.add(i + 1);
        matchedIndices.add(i + 2);
      }
    }

    return { matchedItems, matchedVocabIds, matchedIndices };
  }

  /**
   * Generate semantic distractors (70% same group, 30% related groups)
   * 
   * @param correctItems - Correct word bank items
   * @param vocabularyBank - Available vocabulary items
   * @param maxDistractors - Maximum number of distractors to generate
   * @returns Array of distractor word bank items
   */
  private static generateSemanticDistractors(
    correctItems: WordBankItem[],
    vocabularyBank: VocabularyItem[],
    maxDistractors: number
  ): WordBankItem[] {
    if (maxDistractors <= 0) return [];

    const correctVocabIds = new Set(
      correctItems
        .map(item => item.vocabularyId)
        .filter((id): id is string => id !== undefined)
    );

    const correctWordTexts = new Set(
      correctItems.map(item => item.wordText.toLowerCase())
    );

    // Get semantic groups of correct words
    const correctGroups = new Set<string>();
    correctItems.forEach(item => {
      if (item.semanticGroup) {
        correctGroups.add(item.semanticGroup);
      } else if (item.vocabularyId) {
        const group = getSemanticGroup(item.vocabularyId);
        if (group) correctGroups.add(group);
      }
    });

    const distractors: WordBankItem[] = [];
    const usedVocabIds = new Set<string>();

    // 70% from same semantic groups
    const sameGroupCount = Math.floor(maxDistractors * 0.7);
    let sameGroupAdded = 0;

    for (const group of Array.from(correctGroups)) {
      if (sameGroupAdded >= sameGroupCount) break;

      const groupVocabIds = getVocabIdsInGroup(group);
      const availableVocab = vocabularyBank.filter(v => 
        groupVocabIds.includes(v.id) &&
        !correctVocabIds.has(v.id) &&
        !usedVocabIds.has(v.id) &&
        !correctWordTexts.has(v.en.toLowerCase())
      );

      for (const vocab of availableVocab) {
        if (sameGroupAdded >= sameGroupCount) break;
        
        distractors.push({
          vocabularyId: vocab.id,
          wordText: vocab.en,
          isPhrase: vocab.en.split(' ').length > 1,
          semanticGroup: vocab.semanticGroup || getSemanticGroup(vocab.id),
          isCorrect: false
        });
        usedVocabIds.add(vocab.id);
        sameGroupAdded++;
      }
    }

    // 30% from related groups
    const relatedGroupCount = maxDistractors - distractors.length;
    if (relatedGroupCount > 0) {
      const relatedGroups = new Set<string>();
      Array.from(correctGroups).forEach(group => {
        getRelatedGroups(group).forEach(relatedGroup => relatedGroups.add(relatedGroup));
      });

      let relatedAdded = 0;
      for (const group of Array.from(relatedGroups)) {
        if (relatedAdded >= relatedGroupCount) break;

        const groupVocabIds = getVocabIdsInGroup(group);
        const availableVocab = vocabularyBank.filter(v =>
          groupVocabIds.includes(v.id) &&
          !correctVocabIds.has(v.id) &&
          !usedVocabIds.has(v.id) &&
          !correctWordTexts.has(v.en.toLowerCase())
        );

        for (const vocab of availableVocab) {
          if (relatedAdded >= relatedGroupCount) break;

          distractors.push({
            vocabularyId: vocab.id,
            wordText: vocab.en,
            isPhrase: vocab.en.split(' ').length > 1,
            semanticGroup: vocab.semanticGroup || getSemanticGroup(vocab.id),
            isCorrect: false
          });
          usedVocabIds.add(vocab.id);
          relatedAdded++;
        }
      }
    }

    // Fill remaining slots with random vocabulary (if needed)
    const remaining = maxDistractors - distractors.length;
    if (remaining > 0) {
      const randomVocab = vocabularyBank
        .filter(v =>
          !correctVocabIds.has(v.id) &&
          !usedVocabIds.has(v.id) &&
          !correctWordTexts.has(v.en.toLowerCase())
        )
        .slice(0, remaining);

      randomVocab.forEach(vocab => {
        distractors.push({
          vocabularyId: vocab.id,
          wordText: vocab.en,
          isPhrase: vocab.en.split(' ').length > 1,
          semanticGroup: vocab.semanticGroup || getSemanticGroup(vocab.id),
          isCorrect: false
        });
      });
    }

    return distractors;
  }

  /**
   * Generate random distractors (fallback when semantic groups not available)
   * 
   * @param correctItems - Correct word bank items
   * @param vocabularyBank - Available vocabulary items
   * @param maxDistractors - Maximum number of distractors to generate
   * @returns Array of distractor word bank items
   */
  private static generateRandomDistractors(
    correctItems: WordBankItem[],
    vocabularyBank: VocabularyItem[],
    maxDistractors: number
  ): WordBankItem[] {
    if (maxDistractors <= 0) return [];

    const correctVocabIds = new Set(
      correctItems
        .map(item => item.vocabularyId)
        .filter((id): id is string => id !== undefined)
    );

    const correctWordTexts = new Set(
      correctItems.map(item => item.wordText.toLowerCase())
    );

    const availableVocab = vocabularyBank.filter(v =>
      !correctVocabIds.has(v.id) &&
      !correctWordTexts.has(v.en.toLowerCase())
    );

    // Shuffle and take first N
    const shuffled = this.shuffleArray([...availableVocab]);
    return shuffled.slice(0, maxDistractors).map(vocab => ({
      vocabularyId: vocab.id,
      wordText: vocab.en,
      isPhrase: vocab.en.split(' ').length > 1,
      semanticGroup: vocab.semanticGroup || getSemanticGroup(vocab.id),
      isCorrect: false
    }));
  }

  /**
   * Normalize word to sentence case
   * First word capitalized, rest lowercase
   * Special case: "I" always capitalized
   * 
   * @param word - Word to normalize
   * @returns Normalized word
   */
  static normalizeCase(word: string): string {
    if (!word) return word;

    // Special case: "I" always capitalized
    if (word.toLowerCase() === 'i') return 'I';

    // Handle phrases (split by space, capitalize first word of each)
    if (word.includes(' ')) {
      return word
        .split(' ')
        .map((w, index) => {
          if (index === 0) {
            return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
          }
          return w.toLowerCase();
        })
        .join(' ');
    }

    // Single word: capitalize first letter, lowercase rest
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }

  /**
   * Calculate word bank size dynamically
   * Formula: correctWordsCount * 2 + 3, clamped to 7-13
   * 
   * @param correctWordsCount - Number of correct words
   * @returns Word bank size
   */
  static calculateWordBankSize(correctWordsCount: number): number {
    const calculated = correctWordsCount * 2 + 3;
    return Math.min(Math.max(calculated, 7), 13);
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   * 
   * @param array - Array to shuffle
   * @returns Shuffled array (new array, doesn't mutate original)
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

