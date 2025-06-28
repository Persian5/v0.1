/**
 * ConversationFlowService - Handles Persian conversation patterns and grammar structures
 * 
 * This service provides systematic rules for Persian language patterns that differ from English:
 * - Possessive structures ("my name" -> "esme man" not "man esm")
 * - Question formations ("what is your name" -> "esme shoma chiye")
 * - Conversation flows that follow Persian cultural patterns
 * 
 * Prevents hardcoding and provides scalable solutions for future curriculum expansion.
 */

export interface ConversationPattern {
  id: string;
  description: string;
  englishPattern: string;
  persianPattern: string[];
  category: 'possessive' | 'question' | 'greeting' | 'response' | 'politeness';
  rules: string[];
}

export interface ConversationFlow {
  description: string;
  expectedPhrase: string;
  persianSequence: string[];
}

export class ConversationFlowService {
  // Core Persian grammar patterns
  private static readonly CONVERSATION_PATTERNS: ConversationPattern[] = [
    {
      id: 'possessive_my',
      description: 'Persian possessive structure for "my X"',
      englishPattern: 'My {noun}',
      persianPattern: ['{noun}e', 'man'],
      category: 'possessive',
      rules: [
        'Persian possessive comes AFTER the noun',
        'Add "e" (ezafe) between noun and possessive pronoun',
        '"my name" = "esme man" (literally "name-of me")'
      ]
    },
    {
      id: 'possessive_your',
      description: 'Persian possessive structure for "your X"',
      englishPattern: 'Your {noun}',
      persianPattern: ['{noun}e', 'shoma'],
      category: 'possessive',
      rules: [
        'Persian possessive comes AFTER the noun',
        'Add "e" (ezafe) between noun and possessive pronoun',
        '"your name" = "esme shoma" (literally "name-of you")'
      ]
    },
    {
      id: 'question_what_is',
      description: 'Persian question formation for "what is X"',
      englishPattern: 'What is {phrase}',
      persianPattern: ['{phrase}', 'chiye'],
      category: 'question',
      rules: [
        'Question word "chiye" comes at the END in Persian',
        '"what is your name" = "esme shoma chiye"',
        'Structure: [subject] + [question word]'
      ]
    },
    {
      id: 'polite_introduction',
      description: 'Standard Persian introduction conversation flow',
      englishPattern: 'Hello, what is your name, goodbye, thank you',
      persianPattern: ['salam', 'esme', 'shoma', 'chiye', 'khodafez', 'merci'],
      category: 'greeting',
      rules: [
        'Persian conversations flow more naturally with possessive structures',
        'Questions use Persian word order with question words at end',
        'Politeness markers are culturally important'
      ]
    }
  ];

  /**
   * Generate conversation flow for common Persian patterns
   */
  static generateConversationFlow(
    englishPhrase: string,
    vocabularyIds: string[]
  ): ConversationFlow | null {
    // Normalize the input
    const normalizedPhrase = englishPhrase.toLowerCase().trim();
    
    // Check for known patterns
    for (const pattern of this.CONVERSATION_PATTERNS) {
      if (this.matchesPattern(normalizedPhrase, pattern.englishPattern.toLowerCase())) {
        return {
          description: pattern.description,
          expectedPhrase: englishPhrase,
          persianSequence: this.buildPersianSequence(pattern, vocabularyIds)
        };
      }
    }
    
    // If no pattern matches, try to build intelligently
    return this.buildIntelligentFlow(englishPhrase, vocabularyIds);
  }

  /**
   * Check if a phrase matches a pattern template
   */
  private static matchesPattern(phrase: string, pattern: string): boolean {
    // Simple pattern matching - can be enhanced with regex
    const patternWords = pattern.split(' ').filter(w => !w.includes('{'));
    const phraseWords = phrase.split(' ');
    
    // Check if all pattern words are present in order
    let patternIndex = 0;
    for (const word of phraseWords) {
      if (patternIndex < patternWords.length && word === patternWords[patternIndex]) {
        patternIndex++;
      }
    }
    
    return patternIndex === patternWords.length;
  }

  /**
   * Build Persian sequence based on pattern rules
   */
  private static buildPersianSequence(
    pattern: ConversationPattern,
    vocabularyIds: string[]
  ): string[] {
    const sequence: string[] = [];
    
    for (const element of pattern.persianPattern) {
      if (element.startsWith('{') && element.endsWith('}')) {
        // This is a template variable - find matching vocabulary
        const templateVar = element.slice(1, -1); // Remove { }
        
        if (templateVar === 'noun' || templateVar === 'phrase') {
          // Add vocabulary that matches the context
          const contextualVocab = this.findContextualVocabulary(templateVar, vocabularyIds);
          sequence.push(...contextualVocab);
        }
      } else {
        // This is a literal Persian word
        sequence.push(element);
      }
    }
    
    return sequence;
  }

  /**
   * Find vocabulary that fits the contextual need
   */
  private static findContextualVocabulary(
    context: string,
    vocabularyIds: string[]
  ): string[] {
    // For possessive patterns, intelligently map vocabulary
    if (context === 'noun' || context === 'phrase') {
      // Look for possessive forms first
      const possessiveForms = vocabularyIds.filter(id => id.includes('esme'));
      if (possessiveForms.length > 0) {
        return possessiveForms;
      }
      
      // Fallback to base nouns
      const nouns = vocabularyIds.filter(id => 
        ['esm', 'name'].some(noun => id.includes(noun))
      );
      return nouns;
    }
    
    return [];
  }

  /**
   * Build intelligent conversation flow when no pattern matches
   */
  private static buildIntelligentFlow(
    englishPhrase: string,
    vocabularyIds: string[]
  ): ConversationFlow | null {
    const words = englishPhrase.toLowerCase().split(' ');
    const sequence: string[] = [];
    
    // Apply Persian grammar rules intelligently
    if (words.includes('my') && words.includes('name')) {
      // Convert "my name" to Persian possessive structure
      sequence.push('esme', 'man');
    } else if (words.includes('your') && words.includes('name')) {
      // Convert "your name" to Persian possessive structure  
      sequence.push('esme', 'shoma');
    } else if (words.includes('what') && words.includes('is')) {
      // Handle "what is" questions
      const questionTarget = this.extractQuestionTarget(words);
      sequence.push(...questionTarget, 'chiye');
    }
    
    // Add remaining vocabulary from the provided list
    vocabularyIds.forEach(id => {
      if (!sequence.includes(id) && this.isRelevantVocabulary(id, words)) {
        sequence.push(id);
      }
    });
    
    if (sequence.length === 0) {
      return null; // Couldn't build intelligent flow
    }
    
    return {
      description: 'Persian conversation following grammar rules',
      expectedPhrase: englishPhrase,
      persianSequence: sequence
    };
  }

  /**
   * Extract the target of a "what is" question
   */
  private static extractQuestionTarget(words: string[]): string[] {
    // Look for possessive structures in questions
    if (words.includes('your') && words.includes('name')) {
      return ['esme', 'shoma'];
    } else if (words.includes('my') && words.includes('name')) {
      return ['esme', 'man'];
    }
    
    return [];
  }

  /**
   * Check if vocabulary is relevant to the conversation
   */
  private static isRelevantVocabulary(vocabularyId: string, englishWords: string[]): boolean {
    // Map vocabulary IDs to their likely English meanings
    const vocabularyMappings: Record<string, string[]> = {
      'salam': ['hello', 'hi'],
      'khodafez': ['goodbye', 'bye'],
      'merci': ['thank', 'thanks'],
      'esm': ['name'],
      'esme': ['name'],
      'man': ['my', 'me', 'i'],
      'shoma': ['your', 'you'],
      'chi': ['what'],
      'chiye': ['what', 'is']
    };
    
    const englishMeanings = vocabularyMappings[vocabularyId] || [];
    return englishMeanings.some(meaning => 
      englishWords.some(word => word.includes(meaning))
    );
  }

  /**
   * Get explanation for a conversation pattern
   */
  static getPatternExplanation(patternId: string): string {
    const pattern = this.CONVERSATION_PATTERNS.find(p => p.id === patternId);
    if (!pattern) return '';
    
    return `${pattern.description}\n\nRules:\n${pattern.rules.join('\n')}`;
  }

  /**
   * Validate if a Persian sequence follows correct grammar rules
   */
  static validatePersianGrammar(sequence: string[]): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Check possessive structure
    const hasEzafe = sequence.some(word => word.endsWith('e'));
    const hasPossessive = sequence.includes('man') || sequence.includes('shoma');
    
    if (hasPossessive && !hasEzafe) {
      issues.push('Missing ezafe connector in possessive structure');
      suggestions.push('Add "e" between noun and possessive (e.g., "esme man")');
    }
    
    // Check question structure
    const hasQuestionWord = sequence.includes('chiye') || sequence.includes('chi');
    const questionWordPosition = sequence.findIndex(word => 
      word === 'chiye' || word === 'chi'
    );
    
    if (hasQuestionWord && questionWordPosition !== sequence.length - 1) {
      issues.push('Question word should come at the end in Persian');
      suggestions.push('Move "chiye" or "chi" to the end of the sequence');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }
} 