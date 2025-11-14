/**
 * Grammar Options Generator
 * 
 * Generates options for grammar-fill-blank steps dynamically.
 * Keeps the same structure as hardcoded options but generates them automatically.
 * 
 * PHASE 4: Now supports optional learnedSoFar parameter for filtered distractors.
 * When learnedSoFar is provided, only uses vocab/suffixes/connectors learned so far.
 * When absent, falls back to existing behavior (full lesson vocab, hardcoded lists).
 * 
 * Usage in curriculum.ts:
 * wordOptions: generateGrammarOptions('word', 'khoobam', vocabulary, reviewVocabulary, ['khoobi'])
 * 
 * Usage with learned filtering (Phase 5):
 * wordOptions: generateGrammarOptions('word', 'khoobam', vocabulary, undefined, ['khoobi'], learnedSoFar)
 */

import { VocabularyItem } from '../types';
import { getSemanticGroup } from '../config/semantic-groups';

export interface GrammarOption {
  id: string;
  text: string;
}

/**
 * PHASE 4: Optional learned-so-far parameter for filtered distractors
 */
export interface LearnedSoFar {
  vocabIds?: string[]
  suffixes?: string[]
  connectors?: string[]
}

/**
 * SEMANTIC FILTER: Optional semantic group for intelligent word distractor selection
 */
export interface GrammarOptionsConfig {
  learnedSoFar?: LearnedSoFar
  expectedSemanticGroup?: string  // Filter word distractors by semantic group
}

/**
 * Generate options for a grammar fill-blank step
 * 
 * @param blankType - Type of blank: 'suffix', 'connector', or 'word'
 * @param correctAnswer - The correct answer for this blank
 * @param lessonVocabulary - All vocabulary items from the lesson (pass from lesson.vocabulary)
 * @param reviewVocabulary - Vocabulary IDs from previous lessons (optional, pass from lesson.reviewVocabulary)
 * @param customDistractors - Additional custom distractors (optional, e.g., ['khoobi', 'esmam'])
 * @param config - PHASE 4: Optional configuration (learnedSoFar + expectedSemanticGroup)
 * @returns Array of options including correct answer + distractors
 */
export function generateGrammarOptions(
  blankType: 'suffix' | 'connector' | 'word',
  correctAnswer: string,
  lessonVocabulary: VocabularyItem[],
  reviewVocabulary?: string[],
  customDistractors?: string[],
  config?: GrammarOptionsConfig
): GrammarOption[] {
  const learnedSoFar = config?.learnedSoFar
  const expectedSemanticGroup = config?.expectedSemanticGroup
  const options: GrammarOption[] = [];
  const usedWords = new Set<string>();
  
  // DEBUG LOG: Function entry
  console.log('🚀 [generateGrammarOptions] Function Called:', {
    blankType,
    correctAnswer,
    lessonVocabularyCount: lessonVocabulary.length,
    lessonVocabulary: lessonVocabulary.map(v => ({
      id: v.id,
      finglish: v.finglish,
      semanticGroup: v.semanticGroup
    })),
    reviewVocabulary,
    customDistractors,
    learnedSoFar: learnedSoFar ? {
      vocabIds: learnedSoFar.vocabIds,
      vocabIdsCount: learnedSoFar.vocabIds?.length || 0,
      suffixes: learnedSoFar.suffixes,
      suffixesCount: learnedSoFar.suffixes?.length || 0,
      connectors: learnedSoFar.connectors,
      connectorsCount: learnedSoFar.connectors?.length || 0
    } : null,
    expectedSemanticGroup
  })

  // CORRECT-ANSWER TEXT NORMALIZATION: Derive display text from VocabularyItem
  // This ensures consistent casing and formatting across all modules
  let displayText: string
  if (blankType === 'word') {
    const correctVocab = lessonVocabulary.find(v =>
      v.id.toLowerCase() === correctAnswer.toLowerCase() ||
      v.finglish?.toLowerCase() === correctAnswer.toLowerCase()
    )
    displayText = correctVocab?.finglish || (
      correctAnswer.charAt(0).toUpperCase() + correctAnswer.slice(1)
    )
  } else {
    displayText = blankType === 'suffix' ? `-${correctAnswer}` : correctAnswer
  }

  // Add correct answer first
  const prefix = blankType === 'suffix' ? 'suffix' : blankType === 'connector' ? 'conn' : 'word';
  options.push({
    id: `${prefix}-${correctAnswer}`,
    text: displayText
  });
  usedWords.add(correctAnswer.toLowerCase());

  // Generate distractors based on blank type
  if (blankType === 'suffix') {
    // PHASE 4: Use learned suffixes if provided, else fallback to hardcoded
    const suffixPool = learnedSoFar?.suffixes && learnedSoFar.suffixes.length > 0
      ? learnedSoFar.suffixes
      : ['am', 'i', 'e', 'et', 'esh', 'ye']; // Fallback: hardcoded list
    
    console.log('🔤 [generateGrammarOptions] Suffix Blank:', {
      correctAnswer,
      learnedSuffixes: learnedSoFar?.suffixes,
      usingLearnedSuffixes: learnedSoFar?.suffixes && learnedSoFar.suffixes.length > 0,
      suffixPool,
      suffixPoolCount: suffixPool.length
    })
    
    for (const suffix of suffixPool) {
      if (suffix.toLowerCase() !== correctAnswer.toLowerCase() && options.length < 4) {
        options.push({
          id: `suffix-${suffix}`,
          text: `-${suffix}`
        });
      }
    }
  } else if (blankType === 'connector') {
    // PHASE 4: Use learned connectors if provided, else fallback to hardcoded
    const connectorPool = learnedSoFar?.connectors && learnedSoFar.connectors.length > 0
      ? learnedSoFar.connectors
      : ['vali', 'va', 'ham']; // Fallback: hardcoded list
    
    console.log('🔗 [generateGrammarOptions] Connector Blank:', {
      correctAnswer,
      learnedConnectors: learnedSoFar?.connectors,
      usingLearnedConnectors: learnedSoFar?.connectors && learnedSoFar.connectors.length > 0,
      connectorPool,
      connectorPoolCount: connectorPool.length
    })
    
    for (const connector of connectorPool) {
      if (connector.toLowerCase() !== correctAnswer.toLowerCase() && options.length < 4) {
        options.push({
          id: `conn-${connector}`,
          text: connector
        });
      }
    }
  } else {
    // PHASE 4: Filter vocabulary by learned IDs if provided
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
    let availableVocab = lessonVocabulary.filter(vocab => 
      !connectorWords.includes(vocab.id.toLowerCase()) &&
      vocab.id.toLowerCase() !== correctAnswer.toLowerCase() &&
      vocab.finglish.toLowerCase() !== correctAnswer.toLowerCase()
    );
    
    // DEBUG LOG: After filtering connectors/correct answer
    console.log('🔍 [generateGrammarOptions] After Filtering Connectors/Correct Answer:', {
      originalVocabCount: lessonVocabulary.length,
      afterFilterCount: availableVocab.length,
      filteredOut: lessonVocabulary.length - availableVocab.length,
      availableVocab: availableVocab.map(v => ({
        id: v.id,
        finglish: v.finglish,
        semanticGroup: v.semanticGroup
      }))
    })
    
    // PHASE 4: If learnedSoFar provided, filter to only learned vocab IDs
    if (learnedSoFar?.vocabIds && learnedSoFar.vocabIds.length > 0) {
      const learnedSet = new Set(learnedSoFar.vocabIds.map(id => id.toLowerCase()));
      const beforeLearnedFilter = availableVocab.length
      availableVocab = availableVocab.filter(vocab => 
        learnedSet.has(vocab.id.toLowerCase())
      );
      
      // DEBUG LOG: After learnedSoFar filter
      console.log('📚 [generateGrammarOptions] After learnedSoFar Filter:', {
        beforeCount: beforeLearnedFilter,
        afterCount: availableVocab.length,
        learnedVocabIds: learnedSoFar.vocabIds,
        filteredVocab: availableVocab.map(v => ({
          id: v.id,
          finglish: v.finglish,
          semanticGroup: v.semanticGroup
        })),
        removedVocab: lessonVocabulary.filter(v => 
          !connectorWords.includes(v.id.toLowerCase()) &&
          v.id.toLowerCase() !== correctAnswer.toLowerCase() &&
          v.finglish.toLowerCase() !== correctAnswer.toLowerCase() &&
          !learnedSet.has(v.id.toLowerCase())
        ).map(v => ({
          id: v.id,
          finglish: v.finglish,
          semanticGroup: v.semanticGroup
        }))
      })
    }
    
    // SEMANTIC FILTER: If expectedSemanticGroup provided, prefer semantic matches but ensure minimum options
    // SIMPLIFIED: Always ensure we have enough options for a proper word bank
    if (expectedSemanticGroup && blankType === 'word') {
      const semanticMatches = availableVocab.filter(vocab => {
        const vocabGroup = vocab.semanticGroup || getSemanticGroup(vocab.id)
        return vocabGroup === expectedSemanticGroup
      })
      
      // DEBUG LOG: Semantic filtering decision
      console.log('🎨 [generateGrammarOptions] Semantic Filter Decision:', {
        expectedSemanticGroup,
        semanticMatchesCount: semanticMatches.length,
        semanticMatches: semanticMatches.map(v => ({
          id: v.id,
          finglish: v.finglish,
          semanticGroup: v.semanticGroup || getSemanticGroup(v.id)
        })),
        threshold: 3,
        willUseSemanticFilter: semanticMatches.length >= 3,
        beforeSemanticFilter: availableVocab.length,
        afterSemanticFilter: semanticMatches.length >= 3 ? semanticMatches.length : availableVocab.length
      })
      
      // Only use semantic filter if we have enough for 4+ total options (1 correct + 3+ distractors)
      // Otherwise use all available vocab to prevent single-option banks
      if (semanticMatches.length >= 3) {
        availableVocab = semanticMatches
      }
      // If <3 semantic matches, keep all availableVocab (fallback ensures proper word bank)
    }
    
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
    
    // Fill remaining slots with random vocabulary (ensure minimum 3 distractors = 4 total options)
    const remaining = availableVocab.filter(v => 
      !usedWords.has(v.id.toLowerCase()) &&
      !usedWords.has(v.finglish.toLowerCase())
    );
    
    // DEBUG LOG: Before distractor selection
    console.log('🎲 [generateGrammarOptions] Before Distractor Selection:', {
      optionsSoFar: options.length,
      optionsSoFarList: options,
      remainingCount: remaining.length,
      remainingVocab: remaining.map(v => ({
        id: v.id,
        finglish: v.finglish,
        semanticGroup: v.semanticGroup
      })),
      needDistractors: 4 - options.length,
      hasEnoughRemaining: remaining.length >= 3
    })
    
    // CRITICAL: Ensure we always have at least 3 distractors (4 total options minimum)
    // If we don't have enough, use ALL learned vocab regardless of semantic filtering
    if (remaining.length < 3 && learnedSoFar?.vocabIds && learnedSoFar.vocabIds.length > 0) {
      console.log('⚠️ [generateGrammarOptions] FALLBACK: Not enough remaining vocab, using all learned vocab')
      
      // Fallback: Use all learned vocab to ensure proper word bank
      const allLearnedVocab = lessonVocabulary.filter(vocab => {
        const learnedSet = new Set(learnedSoFar.vocabIds.map(id => id.toLowerCase()));
        return learnedSet.has(vocab.id.toLowerCase()) &&
               !connectorWords.includes(vocab.id.toLowerCase()) &&
               vocab.id.toLowerCase() !== correctAnswer.toLowerCase() &&
               vocab.finglish.toLowerCase() !== correctAnswer.toLowerCase() &&
               !usedWords.has(vocab.id.toLowerCase()) &&
               !usedWords.has(vocab.finglish.toLowerCase());
      });
      
      console.log('🔄 [generateGrammarOptions] Fallback Vocab:', {
        fallbackVocabCount: allLearnedVocab.length,
        fallbackVocab: allLearnedVocab.map(v => ({
          id: v.id,
          finglish: v.finglish,
          semanticGroup: v.semanticGroup
        }))
      })
      
      // Use all learned vocab if we still don't have enough
      if (allLearnedVocab.length >= 3) {
        const shuffled = [...allLearnedVocab].sort(() => Math.random() - 0.5);
        for (const vocab of shuffled) {
          if (options.length >= 4) break;
          options.push({
            id: `word-${vocab.id}`,
            text: vocab.finglish
          });
          usedWords.add(vocab.id.toLowerCase());
        }
      } else {
        // Last resort: Use whatever we have
        console.log('🚨 [generateGrammarOptions] LAST RESORT: Using remaining vocab (< 3 items)')
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
    } else {
      // Normal case: Use remaining vocab
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
  }

  // DEBUG LOG: Final options
  console.log('✅ [generateGrammarOptions] Final Options Returned:', {
    blankType,
    correctAnswer,
    totalOptions: options.length,
    options: options
  })

  return options;
}

