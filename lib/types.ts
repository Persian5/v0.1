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

// Lesson types
export interface Lesson {
  id: string;
  title: string;
  description: string;
  emoji: string;
  progress?: number;
  locked: boolean;
  steps: LessonStep[];
}

// Step types
export type LessonViewType = 'welcome' | 'flashcard' | 'quiz' | 'input' | 'dragdrop' | 'final' | 'completion' | 'summary';

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
}

// Flashcard step
export interface FlashcardStep extends BaseStep {
  type: 'flashcard';
  data: {
    front: string;
    back: string;
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

// DragDrop step
export interface DragDropStep extends BaseStep {
  type: 'dragdrop';
  data: {
    words: {
      id: string;
      text: string;
      slotId: string;
    }[];
    slots: {
      id: string;
      text: string;
    }[];
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
  };
}

// Union type for all step types
export type LessonStep = 
  | WelcomeStep
  | FlashcardStep
  | QuizStep
  | InputStep
  | DragDropStep 
  | FinalStep;

// State types
export interface LessonState {
  xp: number;
  progress: number;
  currentCardIndex: number;
  currentView: LessonViewType;
  isFlipped: boolean;
  showContinue: boolean;
} 