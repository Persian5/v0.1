import { StoryProgress } from '@/lib/types';

export class StoryProgressService {
  private static STORAGE_KEY = 'story-progress';
  private static PERSONALIZATION_KEY = 'user-personalization';

  // Get story progress for a specific story
  static getStoryProgress(storyId: string): StoryProgress | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(`${this.STORAGE_KEY}-${storyId}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  // Save story progress
  static saveStoryProgress(progress: StoryProgress): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(
        `${this.STORAGE_KEY}-${progress.storyId}`, 
        JSON.stringify(progress)
      );
    } catch (error) {
      console.warn('Failed to save story progress:', error);
    }
  }

  // Initialize new story progress
  static initializeStoryProgress(
    storyId: string, 
    totalExchanges: number,
    userPersonalization?: { [key: string]: string }
  ): StoryProgress {
    const progress: StoryProgress = {
      storyId,
      completed: false,
      currentExchange: 0,
      totalExchanges,
      correctChoices: 0,
      totalChoices: 0,
      vocabularyPracticed: [],
      userPersonalization
    };
    
    this.saveStoryProgress(progress);
    return progress;
  }

  // Update story progress after choice
  static updateProgress(
    storyId: string,
    choiceMade: boolean,
    wasCorrect: boolean,
    vocabularyUsed: string[],
    exchangeAdvanced: boolean = true
  ): StoryProgress | null {
    const progress = this.getStoryProgress(storyId);
    if (!progress) return null;

    if (choiceMade) {
      progress.totalChoices++;
      if (wasCorrect) {
        progress.correctChoices++;
      }
    }

    // Add new vocabulary to practiced list
    vocabularyUsed.forEach(vocab => {
      if (!progress.vocabularyPracticed.includes(vocab)) {
        progress.vocabularyPracticed.push(vocab);
      }
    });

    // Advance to next exchange if applicable
    if (exchangeAdvanced) {
      progress.currentExchange++;
    }

    // Check if story is complete
    if (progress.currentExchange >= progress.totalExchanges) {
      progress.completed = true;
    }

    this.saveStoryProgress(progress);
    return progress;
  }

  // Mark story as completed
  static markStoryCompleted(storyId: string): void {
    const progress = this.getStoryProgress(storyId);
    if (progress) {
      progress.completed = true;
      this.saveStoryProgress(progress);
    }
  }

  // Check if story is accessible (previous lessons completed)
  static isStoryAccessible(moduleId: string, storyId: string): boolean {
    // Import LessonProgressService to check if all lessons are completed
    // For now, assume it's accessible if we have this method called
    return true; // TODO: Integrate with LessonProgressService
  }

  // Get/Set user personalization (name, etc.)
  static getUserPersonalization(): { [key: string]: string } {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem(this.PERSONALIZATION_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  static saveUserPersonalization(data: { [key: string]: string }): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.PERSONALIZATION_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save user personalization:', error);
    }
  }

  // Get user's name for personalized responses
  static getUserName(): string {
    const personalization = this.getUserPersonalization();
    return personalization.name || 'Friend';
  }

  static setUserName(name: string): void {
    const personalization = this.getUserPersonalization();
    personalization.name = name;
    this.saveUserPersonalization(personalization);
  }

  // Check if all module stories are completed (for module unlocking)
  static areAllModuleStoriesCompleted(moduleId: string): boolean {
    // This would check all stories in a module
    // For now, assume one story per module
    const storyId = `${moduleId}-story`;
    const progress = this.getStoryProgress(storyId);
    return progress?.completed || false;
  }

  // Get story completion percentage
  static getStoryCompletionPercentage(storyId: string): number {
    const progress = this.getStoryProgress(storyId);
    if (!progress || progress.totalExchanges === 0) return 0;
    
    return Math.round((progress.currentExchange / progress.totalExchanges) * 100);
  }

  // Reset story progress (for replay)
  static resetStoryProgress(storyId: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(`${this.STORAGE_KEY}-${storyId}`);
    } catch (error) {
      console.warn('Failed to reset story progress:', error);
    }
  }
} 