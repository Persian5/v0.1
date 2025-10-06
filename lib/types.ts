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
}

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
export type LessonViewType = 'welcome' | 'flashcard' | 'quiz' | 'reverse-quiz' | 'input' | 'matching' | 'final' | 'grammar-concept' | 'completion' | 'summary' | 'audio-meaning' | 'audio-sequence' | 'text-sequence' | 'story-conversation';

export type StepType = 'welcome' | 'flashcard' | 'quiz' | 'reverse-quiz' | 'input' | 'matching' | 'final' | 'grammar-concept' | 'audio-meaning' | 'audio-sequence' | 'text-sequence' | 'story-conversation';

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
    options: string[];
    correct: number;
  };
}

// Reverse Quiz step (Persian options, English prompt)
export interface ReverseQuizStep extends BaseStep {
  type: 'reverse-quiz';
  data: {
    prompt: string;       // English prompt: "How do you say 'Hello' in Persian?"
    options: string[];    // Persian options: ["سلام", "خداحافظ", "مرسی", "بله"]
    correct: number;      // Index of correct Persian option
  };
}

// Input step
export interface InputStep extends BaseStep {
  type: 'input';
  data: {
    question: string;
    answer: string;
  };
}

// Matching step (renamed from DragDrop)
export interface MatchingStep extends BaseStep {
  type: 'matching';
  data: {
    words: { id: string; text: string; slotId: string }[];
    slots: { id: string; text: string }[];
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

export interface GrammarConceptStep {
  type: 'grammar-concept';
  points: number;
  data: {
    conceptId: string; // References grammar-concepts.ts
  };
}

// Audio-meaning step (listen to Persian audio, select English meaning)
export interface AudioMeaningStep extends BaseStep {
  type: 'audio-meaning';
  data: {
    vocabularyId: string;  // The target vocabulary item to test
    distractors: string[]; // Other vocabulary IDs to use as wrong answers
    autoPlay?: boolean;    // Whether to auto-play audio on load (default: true)
  };
}

// Audio-sequence step (listen to multiple Persian words, arrange English meanings in order)
export interface AudioSequenceStep extends BaseStep {
  type: 'audio-sequence';
  data: {
    sequence: string[];       // Array of vocabulary IDs in the order they should be played
    autoPlay?: boolean;       // Whether to auto-play audio sequence on load (default: false)
    expectedTranslation?: string; // Custom English meaning override for phrases (e.g., "My name" for "esme man")
    targetWordCount?: number; // Number of English words expected (overrides sequence.length when provided)
    maxWordBankSize?: number; // Maximum number of options in word bank (default: 12, prevents crowding while allowing variety)
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
  | GrammarConceptStep
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