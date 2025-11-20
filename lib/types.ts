// Module types
export interface Module {
  id: string;
  title: string;
  description: string;
  emoji?: string;
  lessonCount: number;
  estimatedTime: string;
  available: boolean;
  requiresPremium?: boolean; // True for modules that require paid subscription (Module 2+)
  lessons: Lesson[];
}

// Vocabulary types
export interface VocabularyItem {
  id: string;           // e.g., "salam"
  en: string;           // English meaning
  fa: string;           // Persian script
  finglish: string;     // Latin transliteration
  phonetic: string;     // Pronunciation guide (e.g., "sah-LUHM")
  lessonId: string;     // "module1-lesson1"
  audio?: string;       // optional audio file path
  semanticGroup?: string; // Semantic group for distractor generation (e.g., "greetings", "pronouns")
}

// ============================================================================
// LEXEME & GRAMMAR TYPES (PHASE 1)
// ============================================================================
// Support for grammar-generated forms (e.g., "khoobam" = "khoob" + "-am")
// Backward compatible: All existing string vocab IDs remain valid

/**
 * Base vocabulary ID (e.g., "khoob", "salam")
 */
export type VocabId = string;

/**
 * Grammar reference for morphological forms
 * Example: { kind: "suffix", baseId: "khoob", suffixId: "am" } → "khoobam" (I'm good)
 */
export interface GrammarRef {
  kind: "suffix";
  baseId: VocabId;
  suffixId: string; // e.g., "am", "i", "e", "im", "et", "and"
}

/**
 * Lexeme reference - union type supporting both base vocab and grammar forms
 * - string: Base vocabulary ID (existing behavior, backward compatible)
 * - GrammarRef: Grammar-generated form (new)
 */
export type LexemeRef = VocabId | GrammarRef;

/**
 * Resolved lexeme with all fields populated
 * Returned by GrammarService.resolve()
 */
export interface ResolvedLexeme {
  id: string;           // Surface ID (e.g., "khoobam" for grammar form, "salam" for base)
  baseId: string;       // Base vocabulary ID (e.g., "khoob")
  en: string;           // English meaning (e.g., "I'm good")
  fa: string;           // Persian script (e.g., "خوبم")
  finglish: string;     // Finglish (e.g., "Khoobam")
  phonetic?: string;    // Pronunciation guide (e.g., "khoob-AM")
  lessonId?: string;    // Lesson where base vocab was introduced
  semanticGroup?: string; // Semantic group of base vocab
  isGrammarForm: boolean; // true if generated from GrammarRef, false if base vocab
  grammar?: {
    kind: "suffix";
    suffixId: string;   // The suffix used (e.g., "am")
  };
}

// ============================================================================

// Lesson types
export interface Lesson {
  id: string;
  title: string;
  description: string;
  emoji: string;
  progress?: number;
  locked: boolean;
  isStoryLesson?: boolean; // Flag to indicate this lesson should go directly to module completion
  grammarLesson?: boolean; // Flag to indicate this is a grammar-focused lesson
  steps: LessonStep[];
  vocabulary?: VocabularyItem[];  // Optional vocabulary bank for this lesson
  reviewVocabulary?: string[];    // Vocabulary IDs from previous lessons to review
}

// Step types
export type LessonViewType = 'welcome' | 'flashcard' | 'quiz' | 'reverse-quiz' | 'input' | 'matching' | 'final' | 'grammar-intro' | 'grammar-fill-blank' | 'completion' | 'summary' | 'audio-meaning' | 'audio-sequence' | 'text-sequence' | 'story-conversation';

export type StepType = 'welcome' | 'flashcard' | 'quiz' | 'reverse-quiz' | 'input' | 'matching' | 'final' | 'grammar-intro' | 'grammar-fill-blank' | 'audio-meaning' | 'audio-sequence' | 'text-sequence' | 'story-conversation';

// Define base step type
export interface BaseStep {
  type: LessonViewType; 
  points: number;
}

// Welcome step
export interface WelcomeStep extends BaseStep {
  type: 'welcome';
  title: string;
  description: string;
  data?: {
    objectives?: string[];
    lessonType?: string;
    sectionTitle?: string;
    sectionDescription?: string;
  };
}

// Flashcard step
export interface FlashcardStep extends BaseStep {
  type: 'flashcard';
  data: {
    // Legacy format (still supported for backward compatibility)
    front?: string;
    back?: string;
    // New vocabulary-based format
    vocabularyId?: string;  // References a vocabulary item ID from lesson.vocabulary
  };
}

// Quiz step
export interface QuizStep extends BaseStep {
  type: 'quiz';
  data: {
    prompt: string;
    options: string[]; // Generic string options (for QuizOption object array, component handles casting)
    correct: number;
    quizType?: 'vocab-normal' | 'vocab-reverse' | 'phrase' | 'grammar'; // NEW: Distinguishes quiz types
    vocabularyId?: string; // For vocab quizzes, specifies which vocabulary item to test
    lexemeRef?: LexemeRef; // NEW: For grammar forms (e.g., { kind: "suffix", ... })
  };
}

// Reverse Quiz step (Persian options, English prompt)
export interface ReverseQuizStep extends BaseStep {
  type: 'reverse-quiz';
  data: {
    prompt: string;       // English prompt: "How do you say 'Hello' in Persian?"
    options: string[];    // Persian options: ["سلام", "خداحافظ", "مرسی", "بله"]
    correct: number;      // Index of correct Persian option
    quizType?: 'vocab-normal' | 'vocab-reverse' | 'phrase' | 'grammar'; // NEW: Distinguishes quiz types
    vocabularyId?: string; // For vocab quizzes, specifies which vocabulary item to test
    lexemeRef?: LexemeRef; // NEW: For grammar forms (e.g., { kind: "suffix", ... })
  };
}

// Input step
export interface InputStep extends BaseStep {
  type: 'input';
  data: {
    question: string;
    answer: string;
    vocabularyId?: string; // NEW: Track performance
    lexemeRef?: LexemeRef; // NEW: For grammar forms (e.g., { kind: "suffix", ... })
  };
}

// Matching step (renamed from DragDrop)
export interface MatchingStep extends BaseStep {
  type: 'matching';
  data: {
    words: { id: string; text: string; slotId: string }[];
    slots: { id: string; text: string }[];
    lexemeRefs?: LexemeRef[];  // NEW: Raw LexemeRef[] for runtime resolution (avoids circular init)
  };
}

// Final step
export interface FinalStep extends BaseStep {
  type: 'final';
  data: {
    words: {
      id: string;
      text: string;
      translation: string;
    }[];
    targetWords: string[];
    lexemeRefs?: LexemeRef[];  // NEW: Raw LexemeRef[] for runtime resolution (avoids circular init)
    // Optional content configuration
    title?: string;
    description?: string;
    successMessage?: string;
    incorrectMessage?: string;
    // Conversation flow for realistic Persian patterns
    conversationFlow?: {
      description: string;           // "A polite introduction conversation"
      expectedPhrase: string;        // "Hello, what is your name, goodbye, thank you"
      persianSequence: string[];     // ["salam", "esme", "shoma", "chiye", "khodafez", "merci"]
    };
  };
}

// Grammar Intro step - Big simple description
export interface GrammarIntroStep extends BaseStep {
  type: 'grammar-intro';
  data: {
    conceptId: string;
    title: string;
    description: string; // Big simple explanation (2-3 sentences)
    rule: string; // One-line rule
    visualType: 'tree' | 'comparison' | 'flow';
    visualData: {
      // For tree: base → transformations
      base?: string;
      transformations?: Array<{
        label: string; // e.g., "-am"
        result: string; // e.g., "khoobam"
        meaning: string; // e.g., "I'm good"
      }>;
      // For comparison: before vs after
      before?: string; // e.g., "esm man"
      after?: string; // e.g., "esme man"
      // For flow: step-by-step
      steps?: string[];
    };
  };
}

/**
 * Grammar Fill Blank Step
 * 
 * ============================================================================
 * TO ADD A NEW BLANK TYPE (e.g., "prefix"):
 * ============================================================================
 * 
 * 1. Update blank type union (line 180):
 *    type: 'suffix' | 'word' | 'connector' | 'prefix'  // ← ADD 'prefix'
 * 
 * 2. Update generateGrammarOptions() signature in grammar-options.ts
 * 3. Update GrammarFillBlank.tsx component logic
 * 4. Update curriculum-lexicon.ts if prefixes are grammar-introduced
 * 
 * See lib/utils/GRAMMAR_ARCHITECTURE.md for full guide.
 * 
 * ============================================================================
 */
// Grammar Fill Blank step - Fill blanks in sentences
export interface GrammarFillBlankStep extends BaseStep {
  type: 'grammar-fill-blank';
  data: {
    conceptId: string;
    label?: string; // Main title (like Quiz/Flashcard)
    subtitle?: string; // Subtitle (like Quiz/Flashcard)
    exercises: Array<{
      sentence: string; // e.g., "na merci, man khoob-___" or "esme ___ chiye?" or "esm-___ ___ chiye?"
      translation: string; // e.g., "No thank you, I am good" or "What is your name?"
      blankPosition?: number; // Where the blank is (character index) - deprecated, use blanks array
      correctAnswer?: string; // What goes in blank (e.g., "am" or "shoma") - deprecated, use blanks array
      // For multiple blanks (suffix + word)
      blanks?: Array<{
        index: number; // Which blank (0 = first, 1 = second, etc.)
        type: 'suffix' | 'word' | 'connector'; // Type of blank - UPDATE THIS UNION FOR NEW TYPES
        correctAnswer: string; // Correct answer for this blank
        expectedSemanticGroup?: string; // SEMANTIC FILTER: Expected semantic group for word blanks (e.g., "pronoun", "adjectives")
      }>;
      // SEMANTIC FILTER: Expected semantic group for single-blank word exercises
      expectedSemanticGroup?: string;
      // For suffix-based fill-blank (Step 2 style)
      suffixOptions?: Array<{
        id: string;
        text: string; // e.g., "-am"
        meaning?: string; // e.g., "I am"
      }>;
      // For word-based fill-blank (Step 3 style - sentence context)
      wordOptions?: Array<{
        id: string;
        text: string; // e.g., "shoma"
        meaning?: string; // e.g., "you"
      }>;
      distractors?: Array<{
        id: string;
        text: string;
        meaning?: string;
      }>;
    }>;
  };
}

// Audio-meaning step (listen to Persian audio, select English meaning)
export interface AudioMeaningStep extends BaseStep {
  type: 'audio-meaning';
  data: {
    vocabularyId: string;     // The target vocabulary item to test (base vocab for tracking, backward compat)
    lexemeId?: string;         // DEPRECATED: surface form ID for grammar forms (e.g., "khoobam")
    lexemeRef?: LexemeRef;     // NEW: Raw LexemeRef for runtime resolution (avoids circular init)
    distractors: string[];     // Other vocabulary IDs to use as wrong answers
    autoPlay?: boolean;        // Whether to auto-play audio on load (default: true)
  };
}

// Audio-sequence step (listen to multiple Persian words, arrange English meanings in order)
export interface AudioSequenceStep extends BaseStep {
  type: 'audio-sequence';
  data: {
    sequence: string[];             // Array of vocabulary IDs (backward compat, legacy)
    lexemeSequence?: LexemeRef[];   // NEW: Raw LexemeRef[] for runtime resolution (avoids circular init)
    autoPlay?: boolean;             // Whether to auto-play audio sequence on load (default: false)
    expectedTranslation?: string;   // Custom English meaning override for phrases (e.g., "My name" for "esme man")
    targetWordCount?: number;       // Number of English words expected (overrides sequence.length when provided)
    maxWordBankSize?: number;       // Maximum number of options in word bank (default: 12, prevents crowding while allowing variety)
  };
}

// TextSequence step interface - displays Finglish text instead of playing audio
export interface TextSequenceStep {
  type: 'text-sequence';
  points: number;
  data: {
    finglishText: string; // Finglish phrase to display (e.g., "Esme pedare shoma chiye")
    expectedTranslation: string; // English translation to build (e.g., "What is your father's name")
    maxWordBankSize?: number; // Maximum number of options in word bank (default: 10)
    lexemeSequence?: LexemeRef[]; // Optional: Lexeme references for grammar forms (same as AudioSequence)
  };
}

// Story conversation step (modular for all modules)
export interface StoryConversationStep extends BaseStep {
  type: 'story-conversation';
  data: {
    storyId: string;
    title: string;
    description: string;
    setting: string;
    characterName: string;
    characterEmoji: string;
    exchanges: StoryExchange[];
    successMessage?: string; // Made optional
    requiresPersonalization?: boolean; // For name input
  };
}

// Individual exchange in story conversation
export interface StoryExchange {
  id: string;
  initiator: 'user' | 'character';
  characterMessage?: string; // What character says (if character initiates)
  choices: StoryChoice[];
  correctChoiceIds?: string[]; // Multiple correct answers allowed
  nextExchangeId?: string; // For complex branching (future)
}

// Individual choice in an exchange
export interface StoryChoice {
  id: string;
  text: string; // Persian text to display
  vocabularyUsed: string[]; // Track vocabulary usage
  isCorrect: boolean;
  points: number; // 1 XP for correct first try
  responseMessage?: string; // Character's response to this choice
}

// Story progress tracking
export interface StoryProgress {
  storyId: string;
  completed: boolean;
  currentExchange: number;
  totalExchanges: number;
  correctChoices: number;
  totalChoices: number;
  vocabularyPracticed: string[];
  userPersonalization?: { [key: string]: string }; // Store user name, etc.
}

// Union type for all step types
export type LessonStep = 
  | WelcomeStep
  | FlashcardStep
  | QuizStep
  | ReverseQuizStep
  | InputStep
  | MatchingStep
  | FinalStep
  | GrammarIntroStep
  | GrammarFillBlankStep
  | AudioMeaningStep
  | AudioSequenceStep
  | TextSequenceStep
  | StoryConversationStep;

// State types
export interface LessonState {
  xp: number;
  progress: number;
  currentCardIndex: number;
  currentView: LessonViewType;
  isFlipped: boolean;
  showContinue: boolean;
} 