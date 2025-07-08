import { VocabularyItem } from '../types';

// Persian Grammar Transformation Result
export interface GrammarTransformation {
  id: string;
  originalId: string;
  en: string;
  fa: string;
  finglish: string;
  phonetic: string;
  lessonId: string;
}

// Grammar pattern detection and transformation
export class PersianGrammarService {
  
  // Words that ALWAYS stay as complete phrases, never break down
  private static ALWAYS_STANDALONE = new Set([
    'khoshbakhtam', // Nice to Meet You
    'khodafez',     // Goodbye
    'khosh_amadid'  // Welcome
  ]);
  
  // Pronouns and their possessive forms
  private static PRONOUN_POSSESSIVE: Record<string, string> = {
    'man': 'My',
    'shoma': 'Your'
  };
  
  // Words that can break down contextually
  private static CONTEXTUAL_BREAKDOWN: Record<string, {
    standalone: string;
    breakdown: string[];
    shouldBreakdown: (expectedTranslation: string) => boolean;
  }> = {
    'chiye': {
      standalone: 'What is it?',
      breakdown: ['What', 'is'],
      // Break down if expected translation is longer than 3 words
      shouldBreakdown: (expectedTranslation: string) => expectedTranslation.split(' ').length > 3
    },
    'hasti': {
      standalone: 'You are',
      breakdown: ['Are'],
      // Break down when used with "shoma" to avoid redundancy
      shouldBreakdown: (expectedTranslation: string) => {
        const lower = expectedTranslation.toLowerCase();
        return lower.includes('you') && lower.includes('are');
      }
    }
  };
  
  /**
   * Transform a sequence of vocabulary IDs based on Persian grammar rules
   * Priority: 1) Always standalone, 2) Possessive patterns, 3) Pronoun-verb combinations, 4) Contextual breakdown
   */
  static transformSequence(
    sequence: string[], 
    vocabularyBank: VocabularyItem[], 
    expectedTranslation: string
  ): GrammarTransformation[] {
    const result: GrammarTransformation[] = [];
    const expectedWords = expectedTranslation.toLowerCase().split(' ');
    let sequenceIndex = 0;
    
    while (sequenceIndex < sequence.length) {
      const currentId = sequence[sequenceIndex];
      const currentVocab = vocabularyBank.find(v => v.id === currentId);
      
      if (!currentVocab) {
        sequenceIndex++;
        continue;
      }
      
      // RULE 1: Always standalone words (highest priority)
      if (this.ALWAYS_STANDALONE.has(currentId)) {
        result.push({
          id: currentVocab.id,
          originalId: currentVocab.id,
          en: currentVocab.en,
          fa: currentVocab.fa,
          finglish: currentVocab.finglish,
          phonetic: currentVocab.phonetic,
          lessonId: currentVocab.lessonId
        });
        sequenceIndex++;
        continue;
      }
      
      // RULE 2: Possessive pattern detection (esme + pronoun)
      if (currentId === 'esme' && sequenceIndex + 1 < sequence.length) {
        const nextId = sequence[sequenceIndex + 1];
        const nextVocab = vocabularyBank.find(v => v.id === nextId);
        
        if (nextVocab && nextId in this.PRONOUN_POSSESSIVE) {
          // Create possessive transformation: "esme man" → "My name"
          const possessiveForm = this.PRONOUN_POSSESSIVE[nextId];
          
          // Add possessive word (My/Your)
          result.push({
            id: `${currentId}_possessive`,
            originalId: currentId,
            en: possessiveForm,
            fa: currentVocab.fa,
            finglish: currentVocab.finglish,
            phonetic: currentVocab.phonetic,
            lessonId: currentVocab.lessonId
          });
          
          // Add "name" 
          result.push({
            id: `${nextId}_possessed`,
            originalId: nextId,
            en: 'Name',
            fa: nextVocab.fa,
            finglish: nextVocab.finglish,
            phonetic: nextVocab.phonetic,
            lessonId: nextVocab.lessonId
          });
          
          sequenceIndex += 2; // Skip both words
          continue;
        }
      }
      
      // RULE 3: Pronoun + verb pattern detection (shoma + hasti)
      if (currentId === 'shoma' && sequenceIndex + 1 < sequence.length) {
        const nextId = sequence[sequenceIndex + 1];
        const nextVocab = vocabularyBank.find(v => v.id === nextId);
        
        if (nextVocab && nextId === 'hasti') {
          // Create pronoun-verb combination: "shoma hasti" → "You" + "Are"
          
          // Add pronoun (You)
          result.push({
            id: currentVocab.id,
            originalId: currentVocab.id,
            en: currentVocab.en,
            fa: currentVocab.fa,
            finglish: currentVocab.finglish,
            phonetic: currentVocab.phonetic,
            lessonId: currentVocab.lessonId
          });
          
          // Add verb breakdown (Are)
          result.push({
            id: `${nextId}_verb_only`,
            originalId: nextId,
            en: 'Are',
            fa: nextVocab.fa,
            finglish: nextVocab.finglish,
            phonetic: nextVocab.phonetic,
            lessonId: nextVocab.lessonId
          });
          
          sequenceIndex += 2; // Skip both words
          continue;
        }
      }
      
      // RULE 4: Contextual breakdown
      const breakdownRule = this.CONTEXTUAL_BREAKDOWN[currentId];
      if (breakdownRule && breakdownRule.shouldBreakdown(expectedTranslation)) {
        // Break down the word: "chiye" → ["What", "is"]
        breakdownRule.breakdown.forEach((word: string, index: number) => {
          result.push({
            id: `${currentId}_breakdown_${index}`,
            originalId: currentId,
            en: word,
            fa: currentVocab.fa,
            finglish: currentVocab.finglish,
            phonetic: currentVocab.phonetic,
            lessonId: currentVocab.lessonId
          });
        });
        sequenceIndex++;
        continue;
      }
      
      // RULE 5: Default - keep original meaning
      result.push({
        id: currentVocab.id,
        originalId: currentVocab.id,
        en: currentVocab.en,
        fa: currentVocab.fa,
        finglish: currentVocab.finglish,
        phonetic: currentVocab.phonetic,
        lessonId: currentVocab.lessonId
      });
      sequenceIndex++;
    }
    
    return result;
  }
  
  /**
   * Check if a sequence contains possessive pattern
   */
  static hasPossessivePattern(sequence: string[]): boolean {
    for (let i = 0; i < sequence.length - 1; i++) {
      if (sequence[i] === 'esme' && sequence[i + 1] in this.PRONOUN_POSSESSIVE) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Get expected word count after grammar transformations
   */
  static getExpectedWordCount(
    sequence: string[], 
    vocabularyBank: VocabularyItem[], 
    expectedTranslation: string
  ): number {
    const transformed = this.transformSequence(sequence, vocabularyBank, expectedTranslation);
    return transformed.length;
  }
} 