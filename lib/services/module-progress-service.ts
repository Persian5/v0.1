import { getModule } from '../config/curriculum';
import { LessonProgressService } from './lesson-progress-service';
import { DatabaseService, UserLessonProgress } from '../supabase/database';
import { AuthService } from './auth-service';

export class ModuleProgressService {
  
  /**
   * Check if a module is completed
   * DERIVED: A module is complete if ALL lessons in that module have completed_at NOT NULL
   */
  static async isModuleCompleted(moduleId: string): Promise<boolean> {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) return false;

      const module = getModule(moduleId);
      if (!module || !module.lessons || module.lessons.length === 0) return false;

      // Get all lesson progress for this module
      const lessonProgress = await DatabaseService.getUserLessonProgress(user.id, moduleId);

      // Check if ALL lessons are completed
      return module.lessons.every(lesson => {
        const progress = lessonProgress.find(
          p => p.module_id === moduleId && p.lesson_id === lesson.id
        );
        return progress?.completed_at !== null && progress?.completed_at !== undefined;
      });
    } catch (error) {
      console.error('Error checking module completion:', error);
      return false;
    }
  }

  /**
   * Get module completion data (derived from lesson progress)
   * Returns completion status and calculated XP from all completed lessons
   */
  static async getModuleCompletion(moduleId: string): Promise<{
    completed: boolean;
    completedAt?: string;
    totalXpEarned: number;
  } | null> {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) return null;

      const module = getModule(moduleId);
      if (!module) return null;

      // Get all lesson progress for this module
      const lessonProgress = await DatabaseService.getUserLessonProgress(user.id, moduleId);

      // Check if all lessons are completed
      const allLessonsCompleted = module.lessons.every(lesson => {
        const progress = lessonProgress.find(
          p => p.module_id === moduleId && p.lesson_id === lesson.id
        );
        return progress?.completed_at !== null && progress?.completed_at !== undefined;
      });

      // Calculate total XP from completed lessons
      const totalXpEarned = lessonProgress
        .filter(p => p.module_id === moduleId && p.completed_at !== null)
        .reduce((sum, p) => sum + (p.xp_earned || 0), 0);

      // Get the latest completion date (most recent lesson completion)
      const completedLessons = lessonProgress
        .filter(p => p.module_id === moduleId && p.completed_at !== null)
        .sort((a, b) => {
          const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
          const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
          return dateB - dateA; // Most recent first
        });

      return {
        completed: allLessonsCompleted,
        completedAt: completedLessons[0]?.completed_at || undefined,
        totalXpEarned
      };
    } catch (error) {
      console.error('Error getting module completion:', error);
      return null;
    }
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

    // The logic here is now functionally correct after the system-wide XP refactor.
    // It accurately calculates the total potential XP from a module by summing
    // the `points` from each step, which is the same value now used for awarding XP.
    // The `require` call is removed from the loop for better performance and code style.
    const { getLessonSteps } = require('../config/curriculum');
    let totalXp = 0;
    
    // Sum up XP from all lessons in the module
    for (const lesson of module.lessons) {
      const steps = getLessonSteps(moduleId, lesson.id);
      
      for (const step of steps) {
        totalXp += step.points || 0;
      }
    }

    return totalXp;
  }

  // Reset module progress (for testing/development)
  // Note: Module progress is derived from lesson progress, so resetting lessons resets module
  static async resetModuleProgress(moduleId: string): Promise<void> {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        throw new Error('User must be authenticated to reset module progress');
      }

      // Delete all lesson progress for this module (which resets module completion)
      const { supabase } = await import('../supabase/client');
      const { error } = await supabase
        .from('user_lesson_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('module_id', moduleId);

      if (error) {
        throw new Error(`Failed to reset module progress: ${error.message}`);
      }
    } catch (error) {
      console.error('Error resetting module progress:', error);
      throw error;
    }
  }

  // Clear all module progress (for testing/development)
  // Note: Module progress is derived from lesson progress
  static async clearAllProgress(): Promise<void> {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        throw new Error('User must be authenticated to clear module progress');
      }

      // Delete all lesson progress (which clears all module completion)
      const { supabase } = await import('../supabase/client');
      const { error } = await supabase
        .from('user_lesson_progress')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Failed to clear module progress: ${error.message}`);
      }
    } catch (error) {
      console.error('Error clearing module progress:', error);
      throw error;
    }
  }
} 