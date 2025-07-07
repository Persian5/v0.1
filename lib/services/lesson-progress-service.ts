import { getModules } from '../config/curriculum';
import { AuthService } from './auth-service';
import { DatabaseService, UserLessonProgress } from '../supabase/database';
import { VocabularyProgressService } from './vocabulary-progress-service';

// Return type for first available lesson
export interface AvailableLesson {
  moduleId: string;
  lessonId: string;
}

export class LessonProgressService {

  // ===== AUTHENTICATION-AWARE METHODS =====

  /**
   * Get lesson progress for authenticated users from Supabase
   */
  static async getUserLessonProgress(): Promise<UserLessonProgress[]> {
    const currentUser = await AuthService.getCurrentUser();
    
    if (!currentUser || !(await AuthService.isEmailVerified(currentUser))) {
      throw new Error('User must be authenticated and email verified to access lesson progress');
    }

    try {
      return await DatabaseService.getUserLessonProgress(currentUser.id);
    } catch (error) {
      console.error('Failed to fetch lesson progress from database:', error);
      return [];
    }
  }

  /**
   * Check if a specific lesson is completed
   */
  static async isLessonCompleted(moduleId: string, lessonId: string): Promise<boolean> {
    const currentUser = await AuthService.getCurrentUser();
    
    if (!currentUser || !(await AuthService.isEmailVerified(currentUser))) {
      return false;
    }

    try {
      const progress = await DatabaseService.getLessonProgress(currentUser.id, moduleId, lessonId);
      return progress?.status === 'completed' || false;
    } catch (error) {
      console.error('Failed to check lesson completion:', error);
      return false;
    }
  }

  /**
   * Mark a lesson as completed
   */
  static async markLessonCompleted(moduleId: string, lessonId: string): Promise<void> {
    const currentUser = await AuthService.getCurrentUser();
    
    if (!currentUser || !(await AuthService.isEmailVerified(currentUser))) {
      throw new Error('User must be authenticated and email verified to mark lesson as completed');
    }

    try {
      await DatabaseService.markLessonCompleted(currentUser.id, moduleId, lessonId);
      
      // CRITICAL: Clear vocabulary cache so practice games get updated vocabulary
      VocabularyProgressService.clearCache();
      
      console.log(`Lesson ${moduleId}/${lessonId} completed - vocabulary cache cleared`);
    } catch (error) {
      console.error('Failed to mark lesson completed in database:', error);
      throw error;
    }
  }

  /**
   * Mark a lesson as started
   */
  static async markLessonStarted(moduleId: string, lessonId: string): Promise<void> {
    const currentUser = await AuthService.getCurrentUser();
    
    if (!currentUser || !(await AuthService.isEmailVerified(currentUser))) {
      throw new Error('User must be authenticated and email verified to mark lesson as started');
    }

    try {
      await DatabaseService.markLessonStarted(currentUser.id, moduleId, lessonId);
    } catch (error) {
      console.error('Failed to mark lesson started in database:', error);
      throw error;
    }
  }

  /**
   * Reset all user progress (for reset button in account dashboard)
   */
  static async resetAllProgress(): Promise<void> {
    const currentUser = await AuthService.getCurrentUser();
    
    if (!currentUser || !(await AuthService.isEmailVerified(currentUser))) {
      throw new Error('User must be authenticated and email verified to reset progress');
    }

    try {
      await DatabaseService.resetUserProgress(currentUser.id);
    } catch (error) {
      console.error('Failed to reset progress in database:', error);
      throw error;
    }
  }

  // ===== LESSON ACCESSIBILITY & NAVIGATION =====

  /**
   * Check if a lesson should be accessible based on sequential completion
   * Special rule: Module 1 Lesson 1 is always accessible for authenticated users
   */
  static async isLessonAccessible(moduleId: string, lessonId: string): Promise<boolean> {
    const currentUser = await AuthService.getCurrentUser();
    
    if (!currentUser || !(await AuthService.isEmailVerified(currentUser))) {
      return false;
    }

    // Special rule: Module 1 Lesson 1 is always accessible for authenticated users
    if (moduleId === 'module1' && lessonId === 'lesson1') {
      return true;
    }

    const modules = getModules();
    
    // Find the target lesson
    const targetModule = modules.find(m => m.id === moduleId);
    if (!targetModule || !targetModule.available) return false;
    
    const targetLesson = targetModule.lessons.find(l => l.id === lessonId);
    if (!targetLesson) return false;
    
    // If lesson is manually locked in curriculum, it's not accessible
    if (targetLesson.locked) return false;
    
    // Find previous lesson in the complete sequence
    const previousLesson = await this.getPreviousLessonInSequence(moduleId, lessonId);
    
    if (!previousLesson) {
      // This shouldn't happen since Module 1 Lesson 1 is handled above
      return false;
    }
    
    // Check if the previous lesson is completed
    return await this.isLessonCompleted(previousLesson.moduleId, previousLesson.lessonId);
  }

  /**
   * FAST accessibility check using cached progress data - no API calls
   * Use this when you already have progress data to avoid loading states
   */
  static isLessonAccessibleFast(
    moduleId: string, 
    lessonId: string, 
    progressData: UserLessonProgress[],
    isAuthenticated: boolean
  ): boolean {
    if (!isAuthenticated) {
      return false;
    }

    // Special rule: Module 1 Lesson 1 is always accessible for authenticated users
    if (moduleId === 'module1' && lessonId === 'lesson1') {
      return true;
    }

    const modules = getModules();
    
    // Find the target lesson
    const targetModule = modules.find(m => m.id === moduleId);
    if (!targetModule || !targetModule.available) return false;
    
    const targetLesson = targetModule.lessons.find(l => l.id === lessonId);
    if (!targetLesson) return false;
    
    // If lesson is manually locked in curriculum, it's not accessible
    if (targetLesson.locked) return false;
    
    // Find previous lesson in the complete sequence
    const previousLesson = this.getPreviousLessonInSequenceFast(moduleId, lessonId);
    
    if (!previousLesson) {
      // This shouldn't happen since Module 1 Lesson 1 is handled above
      return false;
    }
    
    // Check if the previous lesson is completed using cached data
    return progressData.some(p => 
      p.module_id === previousLesson.moduleId && 
      p.lesson_id === previousLesson.lessonId && 
      p.status === 'completed'
    );
  }

  /**
   * Get the first available (incomplete) lesson that user can access
   */
  static async getFirstAvailableLesson(): Promise<AvailableLesson> {
    const modules = getModules();

    // Loop through all modules in order
    for (const module of modules) {
      // Skip modules where available === false
      if (!module.available) continue;

      // Within each module, go lesson by lesson
      for (const lesson of module.lessons) {
        // Skip lessons where locked === true
        if (lesson.locked) continue;

        // Check if lesson is accessible and not completed
        const isAccessible = await this.isLessonAccessible(module.id, lesson.id);
        const isCompleted = await this.isLessonCompleted(module.id, lesson.id);
        
        if (isAccessible && !isCompleted) {
          return {
            moduleId: module.id,
            lessonId: lesson.id
          };
        }
      }
    }

    // Fallback: If all lessons are done, return Module 1 Lesson 1
    return {
      moduleId: 'module1',
      lessonId: 'lesson1'
    };
  }

  /**
   * Get the next sequential lesson after the current one
   */
  static async getNextSequentialLesson(currentModuleId: string, currentLessonId: string): Promise<AvailableLesson> {
    const modules = getModules();
    let foundCurrent = false;

    // Loop through all modules in order
    for (const module of modules) {
      // Skip modules where available === false
      if (!module.available) continue;

      // Within each module, go lesson by lesson
      for (const lesson of module.lessons) {
        // Skip lessons where locked === true
        if (lesson.locked) continue;

        // If we found the current lesson in previous iteration, return this one
        if (foundCurrent) {
          return {
            moduleId: module.id,
            lessonId: lesson.id
          };
        }

        // Check if this is the current lesson
        if (module.id === currentModuleId && lesson.id === currentLessonId) {
          foundCurrent = true;
        }
      }
    }

    // If we didn't find a next lesson, return first available
    return await this.getFirstAvailableLesson();
  }

  /**
   * Get the previous lesson in the complete sequence
   */
  private static async getPreviousLessonInSequence(moduleId: string, lessonId: string): Promise<AvailableLesson | null> {
    const modules = getModules();
    let previousLesson: AvailableLesson | null = null;

    // Loop through all modules in order
    for (const module of modules) {
      if (!module.available) continue;

      for (const lesson of module.lessons) {
        if (lesson.locked) continue;

        // If we found our target lesson, return the previous one
        if (module.id === moduleId && lesson.id === lessonId) {
          return previousLesson;
        }

        // Update previous lesson for next iteration
        previousLesson = {
          moduleId: module.id,
          lessonId: lesson.id
        };
      }
    }

    return null;
  }

  /**
   * FAST version: Get the previous lesson in the complete sequence (no async calls)
   */
  private static getPreviousLessonInSequenceFast(moduleId: string, lessonId: string): AvailableLesson | null {
    const modules = getModules();
    let previousLesson: AvailableLesson | null = null;

    // Loop through all modules in order
    for (const module of modules) {
      if (!module.available) continue;

      for (const lesson of module.lessons) {
        if (lesson.locked) continue;

        // If we found our target lesson, return the previous one
        if (module.id === moduleId && lesson.id === lessonId) {
          return previousLesson;
        }

        // Update previous lesson for next iteration
        previousLesson = {
          moduleId: module.id,
          lessonId: lesson.id
        };
      }
    }

    return null;
  }

  // ===== STATS & UTILITIES =====

  /**
   * Get total number of completed lessons
   */
  static async getCompletedLessonCount(): Promise<number> {
    try {
      const progress = await this.getUserLessonProgress();
      return progress.filter(p => p.status === 'completed').length;
    } catch (error) {
      console.error('Failed to get completed lesson count:', error);
      return 0;
    }
  }
} 