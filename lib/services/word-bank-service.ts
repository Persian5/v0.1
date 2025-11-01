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
   * - Removes punctuation for storage consistency
   * - Removes extra whitespace
   * - Returns first part before slash for consistency
   * 
   * @param enText - English translation text (e.g., "I / Me", "I'm Good", "How Are You?")
   * @returns Normalized text for display (no punctuation, no slashes)
   */
  static normalizeVocabEnglish(enText: string): string {
    if (!enText) return enText;
    
    // Handle slash-separated translations (e.g., "I / Me" → "I")
    const parts = enText.split('/').map(p => p.trim());
    const firstPart = parts[0];
    
    // Remove punctuation for storage consistency
    let normalized = firstPart.replace(/[?!.,]/g, '');
    
    // Remove extra whitespace
    return normalized.replace(/\s+/g, ' ').trim();
  }

  /**
   * Expand contractions for normalization
   * Converts "I'm" → "i am", "you're" → "you are", etc.
   * 
   * @param text - Text that may contain contractions
   * @returns Text with contractions expanded
   */
  static expandContractions(text: string): string {
    if (!text) return text;
    
    const contractions: Record<string, string> = {
      "i'm": "i am",
      "you're": "you are",
      "we're": "we are",
      "they're": "they are",
      "he's": "he is",
      "she's": "she is",
      "it's": "it is",
      "don't": "do not",
      "doesn't": "does not",
      "isn't": "is not",
      "aren't": "are not",
      "won't": "will not",
      "can't": "can not",
      "didn't": "did not",
      "i'd": "i would",
      "you'd": "you would",
      "we'd": "we would",
      "they'd": "they would",
      "i've": "i have",
      "you've": "you have",
      "we've": "we have",
      "they've": "they have",
      "i'll": "i will",
      "you'll": "you will",
      "we'll": "we will",
      "they'll": "they will"
    };
    
    let expanded = text.toLowerCase();
    
    // Replace contractions (longest first to avoid partial matches)
    const sortedContractions = Object.entries(contractions).sort((a, b) => b[0].length - a[0].length);
    for (const [contraction, expansion] of sortedContractions) {
      const regex = new RegExp(`\\b${contraction.replace(/'/g, "\\'")}\\b`, 'gi');
      expanded = expanded.replace(regex, expansion);
    }
    
    return expanded;
  }

  /**
   * Normalize text for validation comparison
   * - Removes punctuation
   * - Expands contractions
   * - Normalizes case and whitespace
   * - Handles slash-separated translations (checks all parts)
   * 
   * @param text - Text to normalize
   * @returns Array of normalized variants for matching
   */
  static normalizeForValidation(text: string): string[] {
    if (!text) return [];
    
    // Split by slash if present (e.g., "I / Me")
    const parts = text.split('/').map(p => p.trim());
    
    // Normalize each part
    return parts.map(part => {
      // Remove punctuation
      let normalized = part.replace(/[?!.,]/g, '').trim();
      // Expand contractions
      normalized = this.expandContractions(normalized);
      // Normalize case and whitespace
      return normalized.toLowerCase().replace(/\s+/g, ' ').trim();
    }).filter(p => p.length > 0);
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

    if (expectedTranslation) {
      // TextSequence: Extract semantic units directly from expectedTranslation
      const semanticUnits = this.extractSemanticUnitsFromExpected(expectedTranslation, vocabularyBank);
      return semanticUnits.length;
    } else if (sequenceIds && sequenceIds.length > 0) {
      // AudioSequence: Get English translations from vocabularyBank
      const correctWords = sequenceIds
        .map(id => vocabularyBank.find(v => v.id === id))
        .filter((v): v is VocabularyItem => v !== undefined)
        .map(v => this.normalizeVocabEnglish(v.en));
      
      // Match words to vocabularyBank items (smart phrase detection)
      const correctWordBankItems = this.matchWordsToVocabulary(correctWords, vocabularyBank, expectedTranslation);
      return correctWordBankItems.length;
    }
    
    return 0;
  }

  /**
   * Generate word bank for AudioSequence or TextSequence
   * 
   * @param options - Word bank generation options
   * @returns Complete word bank with correct words and distractors
   */
  static generateWordBank(options: WordBankOptions): WordBankResult {
    const { expectedTranslation, vocabularyBank, sequenceIds, maxSize, distractorStrategy = 'semantic' } = options;

    // Step 1: Extract semantic units from expectedTranslation (PRIMARY source)
    // This ensures all expected words/phrases appear in word bank even if vocabulary matching fails
    let correctWordBankItems: WordBankItem[] = [];
    
    if (expectedTranslation) {
      // TextSequence: Extract semantic units directly from expectedTranslation
      correctWordBankItems = this.extractSemanticUnitsFromExpected(expectedTranslation, vocabularyBank, sequenceIds).map(item => ({
        ...item,
        isCorrect: true
      }));
    } else if (sequenceIds && sequenceIds.length > 0) {
      // AudioSequence: Get English translations from vocabularyBank
      // Normalize slash-separated translations (use first part)
      const correctWords = sequenceIds
        .map(id => vocabularyBank.find(v => v.id === id))
        .filter((v): v is VocabularyItem => v !== undefined)
        .map(v => this.normalizeVocabEnglish(v.en));
      
      // Match words to vocabularyBank items (smart phrase detection)
      correctWordBankItems = this.matchWordsToVocabulary(correctWords, vocabularyBank, expectedTranslation).map(item => ({
        ...item,
        isCorrect: true
      }));
    } else {
      correctWordBankItems = [];
    }

    // Step 1b: Get vocabulary IDs that are actually correct (for synonym preference)
    const correctVocabIds = new Set<string>();
    if (sequenceIds) {
      sequenceIds.forEach(id => correctVocabIds.add(id));
    } else {
      // Extract from correctWordBankItems
      correctWordBankItems.forEach(item => {
        if (item.vocabularyId) {
          correctVocabIds.add(item.vocabularyId);
        }
      });
    }

    // Step 3: Calculate word bank size
    const targetSize = maxSize || this.calculateWordBankSize(correctWordBankItems.length);

    // Step 4: Generate distractors
    let distractorItems = distractorStrategy === 'semantic'
      ? this.generateSemanticDistractors(correctWordBankItems, vocabularyBank, targetSize - correctWordBankItems.length)
      : this.generateRandomDistractors(correctWordBankItems, vocabularyBank, targetSize - correctWordBankItems.length);

    // STEP: Remove redundant single-word distractors from multi-word correct vocab items
    // Example: If "I'm good" is correct, remove "good", "I'm", "I", "am" as distractors
    const correctVocabWords = new Set<string>();
    const correctPhrases = new Set<string>(); // Track full phrases (normalized)
    const correctSubPhrases = new Set<string>(); // Track sub-phrases contained in correct phrases
    
    correctWordBankItems.forEach(item => {
      // Check if this is a multi-word vocab item (has space in English)
      const wordText = item.wordText.toLowerCase();
      
      if (wordText.includes(' ')) {
        // Track the full phrase (normalized)
        const normalizedPhrase = this.expandContractions(wordText.replace(/[?!.,]/g, '').trim());
        correctPhrases.add(normalizedPhrase);
        
        // Extract all possible sub-phrases (2-word and 3-word combinations)
        const words = normalizedPhrase.split(/\s+/).filter(w => w.length > 0);
        
        // Extract 2-word sub-phrases (e.g., "where are", "are you" from "where are you")
        for (let i = 0; i <= words.length - 2; i++) {
          const twoWordPhrase = `${words[i]} ${words[i + 1]}`;
          correctSubPhrases.add(twoWordPhrase);
          // Also add reversed version (e.g., "you are" from "where are you")
          const reversedTwoWordPhrase = `${words[i + 1]} ${words[i]}`;
          correctSubPhrases.add(reversedTwoWordPhrase);
        }
        
        // Extract 3-word sub-phrases if phrase is 4+ words (e.g., "where are you" from "where are you from")
        if (words.length >= 4) {
          for (let i = 0; i <= words.length - 3; i++) {
            const threeWordPhrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
            correctSubPhrases.add(threeWordPhrase);
          }
        }
        
        // Split the English translation into individual words
        const phraseWords = wordText.split(/\s+/).map(w => {
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
        phraseWords.forEach(word => {
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

    // Filter out distractors that are sub-phrases of correct phrases OR single words from multi-word phrases
    distractorItems = distractorItems.filter(item => {
      const wordText = item.wordText.toLowerCase().replace(/[?!.,]/g, '');
      const normalizedDistractor = this.expandContractions(wordText.trim());
      
      // FILTER: Remove distractors that match sub-phrases of correct phrases
      // Example: If "where are you" is correct, remove "are you" and "where are"
      if (correctSubPhrases.has(normalizedDistractor)) {
        return false; // This distractor is a sub-phrase of a correct phrase
      }
      
      // Keep multi-word distractors that aren't sub-phrases (they won't be redundant)
      if (item.wordText.includes(' ') || item.isPhrase) {
        // Double-check: even if it's multi-word, filter if it's a sub-phrase
        // This handles cases where vocab items exist as both phrases and sub-phrases
        if (correctSubPhrases.has(normalizedDistractor)) {
          return false;
        }
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

    // Step 5: Normalize all words to sentence case (before deduplication)
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

    // Step 6: Deduplicate TRUE synonyms (e.g., "Hi" and "Hello", NOT "Hello" and "How are you")
    // CRITICAL: Only deduplicate if they're actual synonyms (same meaning), not just same semantic group
    // "Hello" and "How are you" are DIFFERENT phrases - keep both!
    
    const deduplicatedCorrectItems: WordBankItem[] = [];
    const seenSynonyms = new Map<string, WordBankItem>(); // Maps normalized synonym text -> item
    
    normalizedCorrectItems.forEach(item => {
      // Check if this is a TRUE synonym of an existing item
      // Only deduplicate if they're semantically identical (e.g., "hi" = "hello" = "salam")
      // NOT if they're just in the same group (e.g., "hello" ≠ "how are you")
      
      const normalizedText = this.expandContractions(item.wordText.toLowerCase().replace(/[?.,!]/g, '').trim());
      
      // Check against existing items to see if this is a true synonym
      let isDuplicate = false;
      for (const [synonymKey, existingItem] of seenSynonyms.entries()) {
        const existingNormalized = this.expandContractions(existingItem.wordText.toLowerCase().replace(/[?.,!]/g, '').trim());
        
        // Only consider true synonyms (same meaning, interchangeable):
        // - "hi", "hello", "salam" (all mean greeting)
        // NOT "hello" vs "how are you" (different phrases)
        const isTrueSynonym = 
          (normalizedText === 'hi' || normalizedText === 'hello' || normalizedText === 'salam') &&
          (existingNormalized === 'hi' || existingNormalized === 'hello' || existingNormalized === 'salam') &&
          normalizedText !== existingNormalized; // Different variants
        
        if (isTrueSynonym) {
          // This is a true synonym - prefer the one matching correctVocabIds
          if (item.vocabularyId && correctVocabIds.has(item.vocabularyId)) {
            // Replace existing with this one (it's the correct answer)
            const existingIndex = deduplicatedCorrectItems.findIndex(i => i === existingItem);
            if (existingIndex >= 0) {
              deduplicatedCorrectItems[existingIndex] = item;
              seenSynonyms.set(synonymKey, item);
            }
          }
          // Otherwise skip (keep existing)
          isDuplicate = true;
          break;
        }
      }
      
      if (!isDuplicate) {
        // Not a duplicate - keep it
        deduplicatedCorrectItems.push(item);
        // Track it for future synonym checks
        seenSynonyms.set(normalizedText, item);
      }
    });
    
    // Now filter distractors: remove synonyms of correct items AND slash-separated translations
    const correctSemanticGroups = new Set(
      deduplicatedCorrectItems
        .map(item => item.semanticGroup)
        .filter((g): g is string => g !== undefined)
    );
    
    // Build set of correct normalized word texts for comparison (with contraction expansion)
    const correctWordTexts = new Set(
      deduplicatedCorrectItems.map(item => 
        this.expandContractions(item.wordText.toLowerCase().replace(/[?.,!]/g, '').trim())
      )
    );
    
    // Filter distractors: remove synonyms and slash-separated translations
    const filteredDistractorItems = normalizedDistractorItems.filter(item => {
      // CRITICAL: Filter out ALL slash-separated translations from distractors
      // Check if the original vocab has a slash (e.g., "I / Me")
      const originalVocab = item.vocabularyId ? vocabularyBank.find(v => v.id === item.vocabularyId) : null;
      if (originalVocab && originalVocab.en.includes('/')) {
        // This came from a slash-separated vocab - filter it out completely
        return false;
      }
      
      // Also check if normalized text matches slash-separated pattern (shouldn't happen after normalizeVocabEnglish, but safety check)
      const itemNormalized = item.wordText.toLowerCase().replace(/[?.,!]/g, '').trim();
      if (itemNormalized.includes('/')) {
        return false;
      }
      
      // Filter out synonyms of correct items (for greetings: hi/hello/salam)
      const itemLower = this.expandContractions(itemNormalized);
      
      // Check if this is a synonym of a correct item
      const isSynonymOfCorrect = deduplicatedCorrectItems.some(correctItem => {
        const correctNormalized = correctItem.wordText.toLowerCase().replace(/[?.,!]/g, '').trim();
        const correctLower = this.expandContractions(correctNormalized);
        
        // True synonyms: hi/hello/salam
        if ((itemLower === 'hi' || itemLower === 'hello' || itemLower === 'salam') &&
            (correctLower === 'hi' || correctLower === 'hello' || correctLower === 'salam')) {
          return itemLower !== correctLower; // Different variants
        }
        
        return false;
      });
      
      if (isSynonymOfCorrect) {
        return false;
      }
      
      // Check if normalized text matches any correct item (exact duplicate)
      const normalizedCorrectText = deduplicatedCorrectItems.map(correctItem => 
        this.expandContractions(correctItem.wordText.toLowerCase().replace(/[?.,!]/g, '').trim())
      );
      if (normalizedCorrectText.includes(itemLower)) {
        return false;
      }
      
      return true;
    });

    // Step 7: Deduplicate ALL items (correct + distractors) by normalized text to prevent duplicates
    // This ensures no duplicate word bank items appear (e.g., "I/me" twice, "name of" twice)
    const allItemsForDedup: WordBankItem[] = [...deduplicatedCorrectItems, ...filteredDistractorItems];
    const deduplicatedAllItems: WordBankItem[] = [];
    const seenNormalizedTexts = new Set<string>();
    
    allItemsForDedup.forEach(item => {
      // Normalize text for comparison (expand contractions, lowercase, remove punctuation)
      const normalizedText = this.expandContractions(item.wordText.toLowerCase().replace(/[?.,!]/g, '').trim());
      
      // Skip if we've already seen this normalized text
      if (seenNormalizedTexts.has(normalizedText)) {
        return;
      }
      
      // Track this normalized text
      seenNormalizedTexts.add(normalizedText);
      deduplicatedAllItems.push(item);
    });
    
    // Split back into correct and distractors
    const finalCorrectItems = deduplicatedAllItems.filter(item => item.isCorrect);
    const finalDistractorItems = deduplicatedAllItems.filter(item => !item.isCorrect);

    // Step 8: Normalize for display (sentence case)
    const normalizedCorrect = finalCorrectItems.map(item => this.normalizeCase(item.wordText));
    const normalizedDistractors = finalDistractorItems.map(item => this.normalizeCase(item.wordText));

    // Step 9: Combine and shuffle
    const allNormalized = [...normalizedCorrect, ...normalizedDistractors];
    const shuffled = this.shuffleArray([...allNormalized]);

    const allWordBankItems: WordBankItem[] = [
      ...finalCorrectItems,
      ...finalDistractorItems
    ];

    return {
      correctWords: normalizedCorrect,
      distractors: normalizedDistractors,
      allOptions: shuffled,
      wordBankItems: allWordBankItems
    };
  }

  /**
   * Extract semantic units from expectedTranslation
   * CRITICAL: This is the PRIMARY source - vocabulary matching is secondary
   * Returns phrases and words in order, ensuring all expected content appears in word bank
   * 
   * @param expectedTranslation - Expected English translation
   * @param vocabularyBank - Available vocabulary for matching
   * @param sequenceIds - Optional sequence IDs from AudioSequence (for contextual filtering)
   * @returns Array of semantic units (phrases + words) as WordBankItems
   */
  private static extractSemanticUnitsFromExpected(
    expectedTranslation: string,
    vocabularyBank: VocabularyItem[],
    sequenceIds?: string[]
  ): WordBankItem[] {
    const semanticUnits: WordBankItem[] = [];
    const usedVocabIds = new Set<string>();
    const words = expectedTranslation.split(' ').filter(w => w.length > 0);
    const matchedIndices = new Set<number>();

    // Step 1: Detect phrases from expectedTranslation FIRST (3-word, then 2-word)
    // This ensures phrases like "How are you" are detected before individual words
    const phraseMatches = this.detectPhrases(expectedTranslation, vocabularyBank, usedVocabIds);
    phraseMatches.matchedVocabIds.forEach(id => usedVocabIds.add(id));
    phraseMatches.matchedIndices.forEach(idx => matchedIndices.add(idx));

    // Step 2: Build semantic units in ORDER from expectedTranslation
    // Process words sequentially, checking if they're part of a detected phrase first
    let i = 0;
    while (i < words.length) {
      if (matchedIndices.has(i)) {
        // This index is part of a phrase - find which phrase and add it
        // Check if this starts a 3-word phrase first (longer phrases take priority)
        if (i <= words.length - 3 && 
            matchedIndices.has(i) && matchedIndices.has(i + 1) && matchedIndices.has(i + 2)) {
          const threeWordPhrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
          // Find the matching vocab from phraseMatches results
          const phraseItem = phraseMatches.matchedItems.find(item => {
            const vocab = vocabularyBank.find(v => v.id === item.vocabularyId);
            if (!vocab) return false;
            const vocabEnNormalized = this.expandContractions(vocab.en.toLowerCase().replace(/[?.,!]/g, '').trim().replace(/\s+/g, ' '));
            const phraseNormalized = this.expandContractions(threeWordPhrase.toLowerCase().trim().replace(/\s+/g, ' '));
            return vocabEnNormalized === phraseNormalized;
          });
          if (phraseItem) {
            semanticUnits.push(phraseItem);
            i += 3;
            continue;
          }
        }
        // Check if this starts a 2-word phrase
        if (i <= words.length - 2 && 
            matchedIndices.has(i) && matchedIndices.has(i + 1)) {
          const twoWordPhrase = `${words[i]} ${words[i + 1]}`;
          // Find the matching vocab from phraseMatches results
          const phraseItem = phraseMatches.matchedItems.find(item => {
            const vocab = vocabularyBank.find(v => v.id === item.vocabularyId);
            if (!vocab) return false;
            const vocabEnNormalized = this.expandContractions(vocab.en.toLowerCase().replace(/[?.,!]/g, '').trim().replace(/\s+/g, ' '));
            const phraseNormalized = this.expandContractions(twoWordPhrase.toLowerCase().trim().replace(/\s+/g, ' '));
            return vocabEnNormalized === phraseNormalized;
          });
          if (phraseItem) {
            semanticUnits.push(phraseItem);
            i += 2;
            continue;
          }
        }
        // Shouldn't reach here, but skip if already matched
        i++;
        continue;
      }

      // Single word - not part of a phrase
      const word = words[i];
      const normalizedWord = word.toLowerCase().trim();
      
      // CONTEXTUAL FILTERING: Check if this word's vocab is already covered by a matched phrase
      // Example: If "live" (from "zendegi mikonam") is matched as a phrase, skip "I do" from "mikonam"
      // Find ALL vocab candidates that match this word (including ones already used in phrases)
      const allVocabCandidates = vocabularyBank.filter(v => {
        const vocabVariants = this.normalizeForValidation(v.en);
        const isSingleWordVocab = vocabVariants.every(variant => !variant.includes(' '));
        if (isSingleWordVocab) {
          return vocabVariants.some(variant => variant === normalizedWord);
        }
        return false;
      });
      
      // If ALL vocab candidates matching this word are already used in phrases, skip it (contextually redundant)
      // This prevents showing "I do" when "live" (from "zendegi mikonam") is already matched
      if (allVocabCandidates.length > 0 && allVocabCandidates.every(v => usedVocabIds.has(v.id))) {
        // All candidates are already used in phrases - skip standalone definition
        i++;
        continue;
      }
      
      // Try to match to vocabulary
      const vocabMatch = vocabularyBank.find(v => {
        if (usedVocabIds.has(v.id)) return false;
        const vocabVariants = this.normalizeForValidation(v.en);
        const isSingleWordVocab = vocabVariants.every(variant => !variant.includes(' '));
        if (isSingleWordVocab) {
          return vocabVariants.some(variant => variant === normalizedWord);
        }
        return false;
      });

      if (vocabMatch) {
        semanticUnits.push({
          vocabularyId: vocabMatch.id,
          wordText: this.normalizeVocabEnglish(vocabMatch.en),
          isPhrase: false,
          semanticGroup: vocabMatch.semanticGroup || getSemanticGroup(vocabMatch.id),
          isCorrect: true
        });
        usedVocabIds.add(vocabMatch.id);
      } else {
        // CRITICAL: Always include expected word even if vocabulary match fails
        // Check contextual mapping first
        if (CONTEXTUAL_MAPPING[normalizedWord]) {
          const mappedVocabId = CONTEXTUAL_MAPPING[normalizedWord][0];
          const mappedVocab = vocabularyBank.find(v => v.id === mappedVocabId && !usedVocabIds.has(v.id));
          if (mappedVocab) {
            semanticUnits.push({
              vocabularyId: mappedVocab.id,
              wordText: this.normalizeCase(word), // Use expected word
              isPhrase: false,
              semanticGroup: mappedVocab.semanticGroup || getSemanticGroup(mappedVocab.id),
              isCorrect: true
            });
            usedVocabIds.add(mappedVocab.id);
            i++;
            continue;
          }
        }
        
        // Fallback: Use expected word as-is (guaranteed to appear in word bank)
        semanticUnits.push({
          vocabularyId: undefined,
          wordText: this.normalizeCase(word),
          isPhrase: false,
          semanticGroup: undefined,
          isCorrect: true
        });
      }
      i++;
    }

    return semanticUnits;
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
      
      // Match vocab phrases to words in the sequence (with contraction expansion)
      phraseVocabs.forEach(vocab => {
        const vocabEn = this.normalizeVocabEnglish(vocab.en);
        const vocabWordsNormalized = this.expandContractions(vocabEn.toLowerCase()).split(/\s+/).map(w => w.trim());
        
        // Check if this vocab phrase matches words in sequence (with contraction expansion)
        let wordStartIndex = -1;
        for (let i = 0; i <= words.length - vocabWordsNormalized.length; i++) {
          const sequenceWords = words.slice(i, i + vocabWordsNormalized.length);
          const sequenceNormalized = sequenceWords.map(w => this.expandContractions(w.toLowerCase().trim()));
          if (JSON.stringify(sequenceNormalized) === JSON.stringify(vocabWordsNormalized)) {
            wordStartIndex = i;
            break;
          }
        }
        
        // If matched, add as phrase and mark indices as used
        if (wordStartIndex >= 0 && !phraseMatchedIndices.has(wordStartIndex)) {
          // Check if any of these indices are already matched
          let canUse = true;
          for (let j = 0; j < vocabWordsNormalized.length; j++) {
            if (phraseMatchedIndices.has(wordStartIndex + j)) {
              canUse = false;
              break;
            }
          }
          
          if (canUse) {
            matchedItems.push({
              vocabularyId: vocab.id,
              wordText: this.normalizeVocabEnglish(vocab.en), // Normalized for display (no punctuation)
              isPhrase: true,
              semanticGroup: vocab.semanticGroup || getSemanticGroup(vocab.id),
              isCorrect: true
            });
            usedVocabIds.add(vocab.id);
            // Mark all word indices as used
            for (let j = 0; j < vocabWordsNormalized.length; j++) {
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

      // CONTEXTUAL FILTERING: Check if this word's vocab is already covered by a matched phrase
      // Example: If "live" (from "zendegi mikonam") is matched as a phrase, skip "I do" from "mikonam"
      // First, normalize the word for comparison
      const normalizedWord = word.toLowerCase().trim();
      
      // Find ALL vocab candidates that match this word (including ones already used in phrases)
      const allVocabCandidates = vocabularyBank.filter(v => {
        const vocabVariants = this.normalizeForValidation(v.en);
        const isSingleWordVocab = vocabVariants.every(variant => !variant.includes(' '));
        if (isSingleWordVocab) {
          return vocabVariants.some(variant => variant === normalizedWord);
        }
        return false;
      });
      
      // If ALL vocab candidates matching this word are already used in phrases, skip it (contextually redundant)
      // This prevents showing "I do" when "live" (from "zendegi mikonam") is already matched
      if (allVocabCandidates.length > 0 && allVocabCandidates.every(v => usedVocabIds.has(v.id))) {
        // All candidates are already used in phrases - skip standalone definition
        return;
      }

      // Try exact match first (normalize for comparison with contraction expansion)
      // IMPORTANT: For single-word matching, we need to check if this word matches any vocab
      // BUT we must handle multi-word vocabs correctly - a single word can't match a multi-word phrase
      const exactMatch = vocabularyBank.find(v => {
        if (usedVocabIds.has(v.id)) return false;
        
        // Get normalized vocab variants
        const vocabVariants = this.normalizeForValidation(v.en);
        
        // For single-word matching, check if:
        // 1. The vocab is a single word AND matches this word exactly
        // 2. OR the vocab is a multi-word phrase AND this word is part of it
        // BUT we should only match if it's a single-word vocab (phrases should be caught by detectPhrases)
        
        // Check if vocab is single-word (no space in normalized variants)
        const isSingleWordVocab = vocabVariants.every(variant => !variant.includes(' '));
        
        if (isSingleWordVocab) {
          // Single-word vocab: check exact match
          return vocabVariants.some(variant => variant === normalizedWord);
        } else {
          // Multi-word vocab: this single word shouldn't match it
          // Phrases should be caught by detectPhrases() which runs first
          return false;
        }
      });

      if (exactMatch) {
        matchedItems.push({
          vocabularyId: exactMatch.id,
          wordText: this.normalizeVocabEnglish(exactMatch.en), // Normalized for display (no punctuation)
          isPhrase: false,
          semanticGroup: exactMatch.semanticGroup || getSemanticGroup(exactMatch.id),
          isCorrect: true
        });
        usedVocabIds.add(exactMatch.id);
        return;
      }

      // Try contextual mapping (e.g., "My" → "man", "your" → "shoma")
      if (CONTEXTUAL_MAPPING[normalizedWord]) {
        const mappedVocabId = CONTEXTUAL_MAPPING[normalizedWord][0];
        const mappedVocab = vocabularyBank.find(v => 
          v.id === mappedVocabId && !usedVocabIds.has(v.id)
        );
        
        if (mappedVocab) {
          // Use the EXPECTED word for display (contextually appropriate)
          // Example: "your" → display "Your" not "You"
          const contextualDisplayText = this.normalizeCase(word);
          
          matchedItems.push({
            vocabularyId: mappedVocab.id,
            wordText: contextualDisplayText, // Use expected word, not vocab.en
            isPhrase: false,
            semanticGroup: mappedVocab.semanticGroup || getSemanticGroup(mappedVocab.id),
            isCorrect: true
          });
          usedVocabIds.add(mappedVocab.id);
          return;
        }
      }

      // Fallback: Use expected word as-is (normalized)
      matchedItems.push({
        vocabularyId: undefined,
        wordText: this.normalizeVocabEnglish(word), // Normalized for display
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

    // CRITICAL: Try 3-word phrases FIRST (before 2-word) to catch phrases like "How are you"
    // This prevents "How are" from matching before "How are you" is detected
    for (let i = 0; i < words.length - 2; i++) {
      if (matchedIndices.has(i) || matchedIndices.has(i + 1) || matchedIndices.has(i + 2)) continue;

      const threeWordPhrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      const vocabMatch = vocabularyBank.find(v => {
        // Normalize both: lowercase, remove punctuation, normalize spacing, expand contractions
        const vocabEnNormalized = this.expandContractions(v.en.toLowerCase().replace(/[?.,!]/g, '').trim().replace(/\s+/g, ' '));
        const phraseNormalized = this.expandContractions(threeWordPhrase.toLowerCase().trim().replace(/\s+/g, ' '));
        return vocabEnNormalized === phraseNormalized && !usedVocabIds.has(v.id);
      });

      if (vocabMatch) {
        matchedItems.push({
          vocabularyId: vocabMatch.id,
          wordText: this.normalizeVocabEnglish(vocabMatch.en), // Store normalized (no punctuation)
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

    // Try 2-word phrases second (after 3-word to avoid partial matches)
    for (let i = 0; i < words.length - 1; i++) {
      if (matchedIndices.has(i) || matchedIndices.has(i + 1)) continue;

      const twoWordPhrase = `${words[i]} ${words[i + 1]}`;
      const vocabMatch = vocabularyBank.find(v => {
        // Normalize both: lowercase, remove punctuation, normalize spacing, expand contractions
        const vocabEnNormalized = this.expandContractions(v.en.toLowerCase().replace(/[?.,!]/g, '').trim().replace(/\s+/g, ' '));
        const phraseNormalized = this.expandContractions(twoWordPhrase.toLowerCase().trim().replace(/\s+/g, ' '));
        return vocabEnNormalized === phraseNormalized && !usedVocabIds.has(v.id);
      });

      if (vocabMatch) {
        matchedItems.push({
          vocabularyId: vocabMatch.id,
          wordText: this.normalizeVocabEnglish(vocabMatch.en), // Store normalized (no punctuation)
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
        
        // CRITICAL: Normalize vocab.en before adding (remove slashes, normalize display)
        const normalizedWordText = this.normalizeVocabEnglish(vocab.en);
        
        distractors.push({
          vocabularyId: vocab.id,
          wordText: normalizedWordText, // Use normalized (no slashes)
          isPhrase: normalizedWordText.split(' ').length > 1,
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

          // CRITICAL: Normalize vocab.en before adding (remove slashes, normalize display)
          const normalizedWordText = this.normalizeVocabEnglish(vocab.en);
          
          distractors.push({
            vocabularyId: vocab.id,
            wordText: normalizedWordText, // Use normalized (no slashes)
            isPhrase: normalizedWordText.split(' ').length > 1,
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
        // CRITICAL: Normalize vocab.en before adding (remove slashes, normalize display)
        const normalizedWordText = this.normalizeVocabEnglish(vocab.en);
        
        distractors.push({
          vocabularyId: vocab.id,
          wordText: normalizedWordText, // Use normalized (no slashes)
          isPhrase: normalizedWordText.split(' ').length > 1,
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
    return shuffled.slice(0, maxDistractors).map(vocab => {
      // CRITICAL: Normalize vocab.en before adding (remove slashes, normalize display)
      const normalizedWordText = this.normalizeVocabEnglish(vocab.en);
      
      return {
        vocabularyId: vocab.id,
        wordText: normalizedWordText, // Use normalized (no slashes)
        isPhrase: normalizedWordText.split(' ').length > 1,
        semanticGroup: vocab.semanticGroup || getSemanticGroup(vocab.id),
        isCorrect: false
      };
    });
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

  /**
   * Validate user answer against expected translation (PER-WORD validation)
   * 
   * This is CRITICAL for accurate tracking in multi-word games.
   * Instead of marking ALL words as correct/incorrect, this validates each word individually.
   * 
   * Example:
   *   Expected: "Hello, how are you?"
   *   User: "Hello, goodbye"
   *   Result: [
   *     { vocabularyId: "salam", wordText: "Hello", isCorrect: true },
   *     { vocabularyId: "chetori", wordText: "How are you", isCorrect: false }
   *   ]
   * 
   * @param params - Validation parameters
   * @returns Array of per-word validation results
   */
  static validateUserAnswer(params: {
    userAnswer: string[];           // User's selected words in order (e.g., ["Hello", "goodbye"])
    expectedTranslation: string;    // Expected English translation (e.g., "Hello, how are you?")
    vocabularyBank: VocabularyItem[];
    sequenceIds?: string[];         // Optional: vocabulary IDs for fallback matching
  }): Array<{ vocabularyId: string, wordText: string, isCorrect: boolean }> {
    const { userAnswer, expectedTranslation, vocabularyBank, sequenceIds } = params;

    // Step 1: Generate word bank to get expected semantic units
    const wordBankResult = this.generateWordBank({
      expectedTranslation,
      vocabularyBank,
      sequenceIds
    });

    // Step 2: Extract expected units (correct answers only)
    const expectedUnits = wordBankResult.wordBankItems
      .filter(item => item.isCorrect)
      .map(item => ({
        vocabularyId: item.vocabularyId || '',
        wordText: item.wordText,
        normalized: this.normalizeForValidation(item.wordText)
      }));

    // Step 3: Normalize user answer (flatten arrays since each word returns string[])
    const userUnits = userAnswer.flatMap(word => this.normalizeForValidation(word));

    // Step 4: Match each expected unit to user unit (in order)
    const results = expectedUnits.map((expected, index) => {
      const userUnit = userUnits[index];
      
      // Check if user's answer matches expected (handles synonyms)
      const isMatch: boolean = Boolean(userUnit && expected.normalized.some(exp => {
        // Exact match
        if (userUnit.toLowerCase() === exp.toLowerCase()) return true;
        
        // Synonym match (for greetings: hi/hello/salam)
        const userLower = userUnit.toLowerCase();
        const expLower = exp.toLowerCase();
        if ((userLower === 'hi' || userLower === 'hello' || userLower === 'salam') &&
            (expLower === 'hi' || expLower === 'hello' || expLower === 'salam')) {
          return true;
        }
        
        return false;
      }));

      return {
        vocabularyId: expected.vocabularyId,
        wordText: expected.wordText,
        isCorrect: isMatch
      };
    });

    return results;
  }
}

