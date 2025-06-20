// Phrase tracking for complete sentences and fixed expressions
// Tracks user's mastery of full phrases for review and remediation

// Local storage key for phrase progress
const PHRASE_PROGRESS_KEY = 'user-phrase-progress';

// Individual phrase performance tracking
export interface PhrasePerformance {
  phraseId: string;
  phrase: string;
  translation: string;
  lessonLearned: string;
  timesCorrect: number;
  timesIncorrect: number;
  lastSeen: string;
  needsReview: boolean;
  firstLearned: string;
}

export interface PhrasePerformanceMap {
  [phraseId: string]: PhrasePerformance;
}

// Predefined phrases from curriculum content
export interface CurriculumPhrase {
  id: string;
  phrase: string;
  translation: string;
  introducedInLesson: string;
  components: string[]; // Individual words for targeted review
}

// All trackable phrases from lessons 1-4
export const CURRICULUM_PHRASES: CurriculumPhrase[] = [
  {
    id: "esme-shoma-chiye",
    phrase: "esme shoma chiye?",
    translation: "what is your name?",
    introducedInLesson: "module1-lesson3",
    components: ["esm", "shoma", "chi"]
  },
  {
    id: "esme-man",
    phrase: "esme man",
    translation: "my name",
    introducedInLesson: "module1-lesson3", 
    components: ["esm", "man"]
  },
  {
    id: "khoobam-merci",
    phrase: "khoobam, merci",
    translation: "I'm good, thank you",
    introducedInLesson: "module1-lesson2",
    components: ["khoobam", "merci"]
  },
  {
    id: "na-merci",
    phrase: "na, merci",
    translation: "no, thank you", 
    introducedInLesson: "module1-lesson2",
    components: ["na", "merci"]
  },
  {
    id: "salam-chetori",
    phrase: "salam, chetori?",
    translation: "hello, how are you?",
    introducedInLesson: "module1-lesson2",
    components: ["salam", "chetori"]
  }
];

export class PhraseTrackingService {

  // Get phrase performance from local storage
  static getPerformance(): PhrasePerformanceMap {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem(PHRASE_PROGRESS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading phrase progress:', error);
      return {};
    }
  }

  // Save phrase performance to local storage
  static savePerformance(performance: PhrasePerformanceMap): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(PHRASE_PROGRESS_KEY, JSON.stringify(performance));
    } catch (error) {
      console.error('Error saving phrase progress:', error);
    }
  }

  // Record when user successfully uses a phrase
  static recordPhraseCorrect(phraseId: string): void {
    const performance = this.getPerformance();
    const phraseData = CURRICULUM_PHRASES.find(p => p.id === phraseId);
    
    if (!phraseData) return;
    
    if (!performance[phraseId]) {
      performance[phraseId] = {
        phraseId,
        phrase: phraseData.phrase,
        translation: phraseData.translation,
        lessonLearned: phraseData.introducedInLesson,
        timesCorrect: 0,
        timesIncorrect: 0,
        lastSeen: new Date().toISOString(),
        needsReview: false,
        firstLearned: new Date().toISOString()
      };
    }
    
    performance[phraseId].timesCorrect += 1;
    performance[phraseId].lastSeen = new Date().toISOString();
    performance[phraseId].needsReview = false;
    
    this.savePerformance(performance);
  }

  // Record when user gets a phrase wrong - triggers review
  static recordPhraseIncorrect(phraseId: string): void {
    const performance = this.getPerformance();
    const phraseData = CURRICULUM_PHRASES.find(p => p.id === phraseId);
    
    if (!phraseData) return;
    
    if (!performance[phraseId]) {
      performance[phraseId] = {
        phraseId,
        phrase: phraseData.phrase,
        translation: phraseData.translation,
        lessonLearned: phraseData.introducedInLesson,
        timesCorrect: 0,
        timesIncorrect: 0,
        lastSeen: new Date().toISOString(),
        needsReview: true,
        firstLearned: new Date().toISOString()
      };
    }
    
    performance[phraseId].timesIncorrect += 1;
    performance[phraseId].lastSeen = new Date().toISOString();
    performance[phraseId].needsReview = true;
    
    this.savePerformance(performance);
  }

  // Get phrases that need review (got wrong or haven't seen recently)
  static getPhrasesNeedingReview(): PhrasePerformance[] {
    const performance = this.getPerformance();
    return Object.values(performance).filter(phrase => phrase.needsReview);
  }

  // Get all phrases learned in a specific lesson
  static getPhrasesFromLesson(lessonKey: string): PhrasePerformance[] {
    const performance = this.getPerformance();
    return Object.values(performance).filter(phrase => phrase.lessonLearned === lessonKey);
  }

  // Get component words for targeted review when phrase fails
  static getComponentWordsForReview(phraseId: string): string[] {
    const phraseData = CURRICULUM_PHRASES.find(p => p.id === phraseId);
    return phraseData?.components || [];
  }

  // Mark phrase as learned (when first encountered in lesson)
  static markPhraseLearned(phraseId: string): void {
    const performance = this.getPerformance();
    const phraseData = CURRICULUM_PHRASES.find(p => p.id === phraseId);
    
    if (!phraseData || performance[phraseId]) return;
    
    performance[phraseId] = {
      phraseId,
      phrase: phraseData.phrase,
      translation: phraseData.translation,
      lessonLearned: phraseData.introducedInLesson,
      timesCorrect: 0,
      timesIncorrect: 0,
      lastSeen: new Date().toISOString(),
      needsReview: false,
      firstLearned: new Date().toISOString()
    };
    
    this.savePerformance(performance);
  }

  // Get total phrases learned count
  static getPhrasesLearnedCount(): number {
    const performance = this.getPerformance();
    return Object.keys(performance).length;
  }

  // Check if phrase is mastered (more correct than incorrect attempts)
  static isPhrasemastered(phraseId: string): boolean {
    const performance = this.getPerformance();
    const phrase = performance[phraseId];
    
    if (!phrase) return false;
    
    return phrase.timesCorrect > phrase.timesIncorrect && phrase.timesCorrect >= 2;
  }

  // Clear all phrase progress (for reset functionality)
  static clearAllProgress(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(PHRASE_PROGRESS_KEY);
  }
} 