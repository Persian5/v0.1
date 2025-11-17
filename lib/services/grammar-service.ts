/**
 * Grammar Service (PHASE 2)
 * 
 * Resolves LexemeRef (base vocab or grammar forms) into complete ResolvedLexeme objects.
 * 
 * Supports:
 * - Base vocabulary lookup (string)
 * - Suffix-based morphology (GrammarRef with kind: "suffix")
 * 
 * Example:
 *   resolve("salam") → { id: "salam", baseId: "salam", en: "Hello", isGrammarForm: false, ... }
 *   resolve({ kind: "suffix", baseId: "khoob", suffixId: "am" }) 
 *     → { id: "khoobam", baseId: "khoob", en: "I'm good", isGrammarForm: true, ... }
 */

import { LexemeRef, GrammarRef, ResolvedLexeme, VocabId } from '../types';
import { VocabularyService } from './vocabulary-service';

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a LexemeRef is a GrammarRef
 */
export function isGrammarRef(ref: LexemeRef): ref is GrammarRef {
  return typeof ref === 'object' && ref !== null && 'kind' in ref && ref.kind === 'suffix';
}

// ============================================================================
// SUFFIX DEFINITIONS
// ============================================================================

/**
 * Supported Persian suffixes with their meanings
 * Start with "-am" only (I am), will expand later
 */
const SUFFIX_DEFINITIONS: Record<string, {
  faScript: string;      // Persian suffix character(s)
  meaningPrefix: string; // English prefix to add (e.g., "I'm ")
}> = {
  'am': {
    faScript: 'م',          // Persian "م"
    meaningPrefix: "I'm "   // "I'm good", "I'm bad", etc.
  }
  // Future suffixes:
  // 'i': { faScript: 'ی', meaningPrefix: "You're " },      // informal you
  // 'e': { faScript: 'ه', meaningPrefix: '' },              // ezafe connector
  // 'im': { faScript: 'یم', meaningPrefix: "We're " },     // we are
  // 'et': { faScript: 'ت', meaningPrefix: "Your " },        // possessive your
  // 'and': { faScript: 'ند', meaningPrefix: "They're " },   // they are
};

// ============================================================================
// RESOLVER
// ============================================================================

/**
 * Resolve a LexemeRef into a complete ResolvedLexeme
 * 
 * @param ref - Base vocabulary ID (string) or grammar reference (GrammarRef)
 * @returns ResolvedLexeme with all fields populated
 * @throws Error if base vocab not found or suffix not supported
 */
export function resolve(ref: LexemeRef): ResolvedLexeme {
  // ============================================================================
  // STEP 2.2: BASE-ONLY RESOLUTION
  // ============================================================================
  
  if (typeof ref === 'string') {
    // Base vocabulary ID - look up from curriculum
    const baseVocab = VocabularyService.findVocabularyById(ref);
    
    if (!baseVocab) {
      throw new Error(
        `[GrammarService] Base vocabulary "${ref}" not found in curriculum. ` +
        `Check lib/config/curriculum.ts for available vocabulary IDs.`
      );
    }
    
    // Return as non-grammar form
    return {
      id: baseVocab.id,
      baseId: baseVocab.id,
      en: baseVocab.en,
      fa: baseVocab.fa,
      finglish: baseVocab.finglish,
      phonetic: baseVocab.phonetic,
      lessonId: baseVocab.lessonId,
      semanticGroup: baseVocab.semanticGroup,
      isGrammarForm: false
    };
  }
  
  // ============================================================================
  // STEP 2.3: SUFFIX RESOLUTION (GRAMMAR FORMS)
  // ============================================================================
  
  if (isGrammarRef(ref)) {
    const { baseId, suffixId } = ref;
    
    // Step 2.4: Guard against unsupported suffixes
    if (!SUFFIX_DEFINITIONS[suffixId]) {
      throw new Error(
        `[GrammarService] Unsupported suffix "${suffixId}". ` +
        `Currently supported: ${Object.keys(SUFFIX_DEFINITIONS).join(', ')}. ` +
        `To add new suffixes, update SUFFIX_DEFINITIONS in lib/services/grammar-service.ts.`
      );
    }
    
    // Look up base vocabulary
    const baseVocab = VocabularyService.findVocabularyById(baseId);
    
    if (!baseVocab) {
      throw new Error(
        `[GrammarService] Base vocabulary "${baseId}" not found for grammar form "${baseId}${suffixId}". ` +
        `Check lib/config/curriculum.ts for available vocabulary IDs.`
      );
    }
    
    const suffixDef = SUFFIX_DEFINITIONS[suffixId];
    
    // Generate grammar form fields
    const compositeId = `${baseVocab.id}${suffixId}`;
    const compositeFinglish = `${baseVocab.finglish}${suffixId}`;
    const compositeFa = `${baseVocab.fa}${suffixDef.faScript}`;
    
    // Generate English meaning (e.g., "I'm good" from "good" + "-am")
    const compositeEn = `${suffixDef.meaningPrefix}${baseVocab.en.toLowerCase()}`;
    
    // Generate phonetic (e.g., "khoob-AM" from "khoob" + "-am")
    // Capitalize suffix for emphasis
    const compositePhonetic = baseVocab.phonetic 
      ? `${baseVocab.phonetic}-${suffixId.toUpperCase()}`
      : compositeFinglish;
    
    return {
      id: compositeId,
      baseId: baseVocab.id,
      en: compositeEn,
      fa: compositeFa,
      finglish: compositeFinglish,
      phonetic: compositePhonetic,
      lessonId: baseVocab.lessonId,
      semanticGroup: baseVocab.semanticGroup,
      isGrammarForm: true,
      grammar: {
        kind: 'suffix',
        suffixId
      }
    };
  }
  
  // Should never reach here due to TypeScript exhaustiveness checking
  throw new Error(`[GrammarService] Invalid LexemeRef: ${JSON.stringify(ref)}`);
}

// ============================================================================
// EXPORTS
// ============================================================================

export const GrammarService = {
  resolve,
  isGrammarRef
};

