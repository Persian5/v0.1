/**
 * Grammar Options Generator
 * 
 * Generates options for grammar-fill-blank steps dynamically.
 * Keeps the same structure as hardcoded options but generates them automatically.
 * 
 * Usage in curriculum.ts:
 * wordOptions: generateGrammarOptions('word', 'khoobam', vocabulary, reviewVocabulary, ['khoobi'])
 */

import { VocabularyItem } from '../types';

export interface GrammarOption {
  id: string;
  text: string;
}

/**
 * Generate options for a grammar fill-blank step
 * 
 * @param blankType - Type of blank: 'suffix', 'connector', or 'word'
 * @param correctAnswer - The correct answer for this blank
 * @param lessonVocabulary - All vocabulary items from the lesson (pass from lesson.vocabulary)
 * @param reviewVocabulary - Vocabulary IDs from previous lessons (optional, pass from lesson.reviewVocabulary)
 * @param customDistractors - Additional custom distractors (optional, e.g., ['khoobi', 'esmam'])
 * @returns Array of options including correct answer + distractors
 */
export function generateGrammarOptions(
  blankType: 'suffix' | 'connector' | 'word',
  correctAnswer: string,
  lessonVocabulary: VocabularyItem[],
  reviewVocabulary?: string[],
  customDistractors?: string[]
): GrammarOption[] {
  const options: GrammarOption[] = [];
  const usedWords = new Set<string>();

  // Add correct answer first
  const prefix = blankType === 'suffix' ? 'suffix' : blankType === 'connector' ? 'connector' : 'word';
  options.push({
    id: `${prefix}-${correctAnswer}`,
    text: blankType === 'suffix' ? `-${correctAnswer}` : correctAnswer
  });
  usedWords.add(correctAnswer.toLowerCase());

  // Generate distractors based on blank type
  if (blankType === 'suffix') {
    // Suffix distractors: common suffixes
    const commonSuffixes = ['am', 'i', 'e', 'et', 'esh', 'ye'];
    for (const suffix of commonSuffixes) {
      if (suffix.toLowerCase() !== correctAnswer.toLowerCase() && options.length < 4) {
        options.push({
          id: `suffix-${suffix}`,
          text: `-${suffix}`
        });
      }
    }
  } else if (blankType === 'connector') {
    // Connector distractors: other connectors
    const connectors = ['vali', 'va', 'ham'];
    for (const connector of connectors) {
      if (connector.toLowerCase() !== correctAnswer.toLowerCase() && options.length < 4) {
        options.push({
          id: `connector-${connector}`,
          text: connector
        });
      }
    }
  } else {
    // Word distractors: from lesson vocabulary + review vocabulary
    const allVocabIds = new Set<string>();
    
    // Add lesson vocabulary
    lessonVocabulary.forEach(vocab => {
      allVocabIds.add(vocab.id);
    });
    
    // Add review vocabulary IDs
    if (reviewVocabulary) {
      reviewVocabulary.forEach(id => allVocabIds.add(id));
    }
    
    // Filter out connectors and the correct answer
    const connectorWords = ['vali', 'va', 'ham'];
    const availableVocab = lessonVocabulary.filter(vocab => 
      !connectorWords.includes(vocab.id.toLowerCase()) &&
      vocab.id.toLowerCase() !== correctAnswer.toLowerCase() &&
      vocab.finglish.toLowerCase() !== correctAnswer.toLowerCase()
    );
    
    // Add custom distractors first (if provided)
    if (customDistractors) {
      for (const distractor of customDistractors) {
        if (options.length < 4 && !usedWords.has(distractor.toLowerCase())) {
          // Find vocab item or use as-is
          const vocabItem = availableVocab.find(v => 
            v.id.toLowerCase() === distractor.toLowerCase() ||
            v.finglish.toLowerCase() === distractor.toLowerCase()
          );
          
          if (vocabItem) {
            options.push({
              id: `word-${vocabItem.id}`,
              text: vocabItem.finglish
            });
            usedWords.add(vocabItem.id.toLowerCase());
          } else {
            options.push({
              id: `word-${distractor}`,
              text: distractor
            });
            usedWords.add(distractor.toLowerCase());
          }
        }
      }
    }
    
    // Fill remaining slots with random vocabulary (max 4 total options)
    const remaining = availableVocab.filter(v => 
      !usedWords.has(v.id.toLowerCase()) &&
      !usedWords.has(v.finglish.toLowerCase())
    );
    
    // Shuffle and take up to remaining slots
    const shuffled = [...remaining].sort(() => Math.random() - 0.5);
    for (const vocab of shuffled) {
      if (options.length >= 4) break;
      options.push({
        id: `word-${vocab.id}`,
        text: vocab.finglish
      });
      usedWords.add(vocab.id.toLowerCase());
    }
  }

  return options;
}

