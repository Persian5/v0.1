import { getModules } from '../config/curriculum';

// Local storage key for lesson progress
const LESSON_PROGRESS_KEY = 'user-lesson-progress';

// Progress tracking structure - simple completion flags
export interface LessonProgressMap {
  [lessonKey: string]: boolean; // "module1-lesson1": true/false
}

// Return type for first available lesson
export interface AvailableLesson {
  moduleId: string;
  lessonId: string;
}

export class LessonProgressService {

  // Get lesson progress from local storage
  static getProgress(): LessonProgressMap {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem(LESSON_PROGRESS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading lesson progress:', error);
      return {};
    }
  }

  // Save lesson progress to local storage
  static saveProgress(progress: LessonProgressMap): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(LESSON_PROGRESS_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving lesson progress:', error);
    }
  }

  // Mark a lesson as completed
  static markLessonCompleted(moduleId: string, lessonId: string): void {
    const lessonKey = `${moduleId}-${lessonId}`;
    const progress = this.getProgress();
    progress[lessonKey] = true;
    this.saveProgress(progress);
  }

  // Check if a lesson is completed
  static isLessonCompleted(moduleId: string, lessonId: string): boolean {
    const lessonKey = `${moduleId}-${lessonId}`;
    const progress = this.getProgress();
    return progress[lessonKey] || false;
  }

  // Get the first available (incomplete) lesson
  static getFirstAvailableLesson(): AvailableLesson {
    const modules = getModules();
    const progress = this.getProgress();

    // Loop through all modules in order
    for (const module of modules) {
      // Skip modules where available === false
      if (!module.available) continue;

      // Within each module, go lesson by lesson
      for (const lesson of module.lessons) {
        // Skip lessons where locked === true
        if (lesson.locked) continue;

        const lessonKey = `${module.id}-${lesson.id}`;
        
        // If lesson is not marked completed, return it
        if (!progress[lessonKey]) {
          return {
            moduleId: module.id,
            lessonId: lesson.id
          };
        }
      }
    }

    // Fallback: If all lessons are done, return module1/lesson1
    return {
      moduleId: 'module1',
      lessonId: 'lesson1'
    };
  }

  // Get the next sequential lesson (regardless of completion status)
  // Used when clicking "Next Lesson" from completion/summary pages
  static getNextSequentialLesson(currentModuleId: string, currentLessonId: string): AvailableLesson {
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

    // If we didn't find a next lesson, fallback to first available lesson
    return this.getFirstAvailableLesson();
  }

  // Helper to get lesson completion count for stats
  static getCompletedLessonCount(): number {
    const progress = this.getProgress();
    return Object.values(progress).filter(completed => completed).length;
  }

  // Check if a lesson should be accessible based on dependency completion
  static isLessonAccessible(moduleId: string, lessonId: string): boolean {
    const modules = getModules();
    const progress = this.getProgress();
    
    // Find the target lesson
    const targetModule = modules.find(m => m.id === moduleId);
    if (!targetModule || !targetModule.available) return false;
    
    const targetLesson = targetModule.lessons.find(l => l.id === lessonId);
    if (!targetLesson) return false;
    
    // If lesson is manually locked in curriculum, it's not accessible
    if (targetLesson.locked) return false;
    
    // Find previous lesson in sequence
    let previousLessonFound = false;
    let previousModuleId = '';
    let previousLessonId = '';
    
    // Search through all modules and lessons in order
    for (const module of modules) {
      if (!module.available) continue;
      
      for (const lesson of module.lessons) {
        if (lesson.locked) continue;
        
        // If we found our target lesson and there was a previous lesson, check if previous is completed
        if (module.id === moduleId && lesson.id === lessonId) {
          if (previousLessonFound) {
            const previousLessonKey = `${previousModuleId}-${previousLessonId}`;
            return progress[previousLessonKey] || false;
          } else {
            // This is the first lesson, so it's always accessible
            return true;
          }
        }
        
        // Track this as the previous lesson for next iteration
        previousLessonFound = true;
        previousModuleId = module.id;
        previousLessonId = lesson.id;
      }
    }
    
    return false;
  }
} 