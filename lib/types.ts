// Module types
export interface Module {
  id: string;
  title: string;
  description: string;
  emoji?: string;
  lessonCount: number;
  estimatedTime: string;
  available: boolean;
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
  steps: LessonStep[];
  vocabulary?: VocabularyItem[];  // Optional vocabulary bank for this lesson
  reviewVocabulary?: string[];    // Vocabulary IDs from previous lessons to review
}

// Step types
export type LessonViewType = 'welcome' | 'flashcard' | 'quiz' | 'input' | 'matching' | 'final' | 'grammar-concept' | 'completion' | 'summary' | 'audio-meaning' | 'audio-sequence';

export type StepType = 'welcome' | 'flashcard' | 'quiz' | 'input' | 'matching' | 'final' | 'grammar-concept' | 'audio-meaning' | 'audio-sequence';

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
  };
}

// Union type for all step types
export type LessonStep = 
  | WelcomeStep
  | FlashcardStep
  | QuizStep
  | InputStep
  | MatchingStep
  | FinalStep
  | GrammarConceptStep
  | AudioMeaningStep
  | AudioSequenceStep;

// State types
export interface LessonState {
  xp: number;
  progress: number;
  currentCardIndex: number;
  currentView: LessonViewType;
  isFlipped: boolean;
  showContinue: boolean;
} 