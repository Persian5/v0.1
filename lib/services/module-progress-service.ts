import { getModule } from '../config/curriculum';
import { LessonProgressService } from './lesson-progress-service';

// Local storage key for module progress
const MODULE_PROGRESS_KEY = 'user-module-progress';

// Module progress tracking structure
export interface ModuleProgressMap {
  [moduleId: string]: {
    completed: boolean;
    completedAt?: string;
    totalXpEarned: number;
  };
}

export class ModuleProgressService {
  
  // Get module progress from local storage
  private static getProgress(): ModuleProgressMap {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem(MODULE_PROGRESS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading module progress:', error);
      return {};
    }
  }

  // Save module progress to local storage
  private static saveProgress(progress: ModuleProgressMap): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(MODULE_PROGRESS_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving module progress:', error);
    }
  }

  // Check if a module is completed
  static isModuleCompleted(moduleId: string): boolean {
    const progress = this.getProgress();
    return progress[moduleId]?.completed || false;
  }

  // Mark a module as completed
  static markModuleCompleted(moduleId: string, totalXpEarned: number): void {
    const progress = this.getProgress();
    progress[moduleId] = {
      completed: true,
      completedAt: new Date().toISOString(),
      totalXpEarned
    };
    this.saveProgress(progress);
  }

  // Get module completion data
  static getModuleCompletion(moduleId: string) {
    const progress = this.getProgress();
    return progress[moduleId] || null;
  }

  // Check if all lessons in a module are completed (this triggers module completion)
  static async checkModuleCompletion(moduleId: string): Promise<boolean> {
    const module = getModule(moduleId);
    if (!module) return false;

    // Check if all lessons in the module are completed
    for (const lesson of module.lessons) {
      const isCompleted = await LessonProgressService.isLessonCompleted(moduleId, lesson.id);
      if (!isCompleted) {
        return false;
      }
    }

    return true;
  }

  // Get total XP earned in a module (sum from all lessons)
  static calculateModuleXp(moduleId: string): number {
    const module = getModule(moduleId);
    if (!module) return 0;

    let totalXp = 0;
    
    // Sum up XP from all lessons in the module
    for (const lesson of module.lessons) {
      // Get lesson steps and sum their points
      const { getLessonSteps } = require('../config/curriculum');
      const steps = getLessonSteps(moduleId, lesson.id);
      
      for (const step of steps) {
        totalXp += step.points || 0;
      }
    }

    return totalXp;
  }

  // Reset module progress (for testing/development)
  static resetModuleProgress(moduleId: string): void {
    const progress = this.getProgress();
    delete progress[moduleId];
    this.saveProgress(progress);
  }

  // Clear all module progress
  static clearAllProgress(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(MODULE_PROGRESS_KEY);
    }
  }
} 