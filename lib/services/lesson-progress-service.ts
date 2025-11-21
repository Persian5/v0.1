import { getModules, getModule, type Module } from '../config/curriculum';
import { type Lesson, type LessonStep } from '../types';
import { AuthService } from './auth-service';
import { DatabaseService, UserLessonProgress } from '../supabase/database';
import { VocabularyProgressService } from './vocabulary-progress-service';
import { SmartAuthService } from './smart-auth-service';
import { verifyLessonCompletionInCache } from '../utils/cache-verification';
import { withBackoff } from '../utils/retry-helpers';
import { safeTelemetry } from '../utils/telemetry-safe';

// Return type for first available lesson
export interface AvailableLesson {
  moduleId: string;
  lessonId: string;
}

// Return type for markLessonCompleted (includes success flags)
export interface LessonCompletionResult {
  success: boolean;
  dbUpdated: boolean;
  cacheUpdated: boolean;
  error?: string;
}

export class LessonProgressService {

  // ===== HELPER FUNCTIONS =====

  /**
   * Detect if a lesson is a story lesson by checking its structure
   * A story lesson has exactly one step of type 'story-conversation'
   */
  static isStoryLesson(lesson: Lesson | { steps: LessonStep[] }): boolean {
    return lesson.steps.length === 1 && lesson.steps[0].type === 'story-conversation';
  }

  // ===== CACHE MANAGEMENT =====
  
  private static progressCacheUpdater: ((progressData: UserLessonProgress[]) => void) | null = null;
  
  /**
   * Set the progress cache updater callback (used by AuthProvider)
   */
  static setProgressCacheUpdater(updater: (progressData: UserLessonProgress[]) => void): void {
    this.progressCacheUpdater = updater;
  }

  /**
   * Clear the progress cache updater callback
   */
  static clearProgressCacheUpdater(): void {
    this.progressCacheUpdater = null;
  }

  /**
   * Update progress cache with new data
   */
  private static updateProgressCache(progressData: UserLessonProgress[]): void {
    if (this.progressCacheUpdater) {
      this.progressCacheUpdater(progressData);
    }
  }

  // ===== AUTHENTICATION-AWARE METHODS =====

  /**
   * Get lesson progress for authenticated users from Supabase
   * Can be filtered by module ID.
   */
  static async getUserLessonProgress(moduleId?: string): Promise<UserLessonProgress[]> {
    const currentUser = await AuthService.getCurrentUser();
    
    if (!currentUser || !(await AuthService.isEmailVerified(currentUser))) {
      throw new Error('User must be authenticated and email verified to access lesson progress');
    }

    try {
      // Pass the optional moduleId to the database service
      return await DatabaseService.getUserLessonProgress(currentUser.id, moduleId);
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
   * Mark a lesson as completed (Production-Grade with Cache Verification)
   * 
   * ARCHITECTURE:
   * 1. Validate user authentication
   * 2. Write to DB with retry logic (blocking with timeout)
   * 3. Clear vocabulary cache (non-critical)
   * 4. Update progress cache with verification (2s timeout)
   * 5. Prefetch next lesson accessibility (non-blocking)
   * 6. Return structured result for caller verification
   * 
   * @returns LessonCompletionResult - includes success flags for DB and cache
   */
  static async markLessonCompleted(moduleId: string, lessonId: string): Promise<LessonCompletionResult> {
    safeTelemetry(() => {
      console.log(`🎯 [LessonProgress] Starting completion for ${moduleId}/${lessonId}`)
    })

    const currentUser = await AuthService.getCurrentUser();
    
    if (!currentUser || !(await AuthService.isEmailVerified(currentUser))) {
      return {
        success: false,
        dbUpdated: false,
        cacheUpdated: false,
        error: 'User must be authenticated and email verified'
      }
    }

    // PHASE 1: Write to database with retry logic
    let dbWriteSuccess = false
    try {
      await withBackoff(
        async () => {
          await DatabaseService.markLessonCompleted(currentUser.id, moduleId, lessonId)
        },
        {
          maxRetries: 3,
          baseDelay: 1000,
          onRetry: (attempt, error) => {
            safeTelemetry(() => {
              console.warn(`⚠️ [LessonProgress] DB write retry ${attempt}/3:`, error.message)
            })
          }
        }
      )
      
      dbWriteSuccess = true
      safeTelemetry(() => {
        console.log(`✅ [LessonProgress] DB write successful for ${moduleId}/${lessonId}`)
      })
    } catch (error) {
      console.error('❌ [LessonProgress] DB write failed after retries:', error)
      return {
        success: false,
        dbUpdated: false,
        cacheUpdated: false,
        error: error instanceof Error ? error.message : 'Database write failed'
      }
    }

    // PHASE 2: Clear vocabulary cache (CRITICAL for practice games)
    VocabularyProgressService.clearCache()
    safeTelemetry(() => {
      console.log(`🧹 [LessonProgress] Vocabulary cache cleared`)
    })

    // PHASE 2b: Invalidate dashboard stats cache (CRITICAL for dashboard updates)
    SmartAuthService.invalidateDashboardStats()
    // PHASE 2c: Invalidate unified dashboard cache (will refresh on next visit)
    SmartAuthService.invalidateDashboardCache()
    safeTelemetry(() => {
      console.log(`🧹 [LessonProgress] Dashboard cache invalidated`)
    })

    // PHASE 3: Update progress cache with verification (blocking with timeout)
    const cacheUpdateSuccess = await this.updateProgressCacheVerified(
      currentUser.id, 
      moduleId, 
      lessonId
    )

    // PHASE 4: Prefetch next lesson accessibility (non-blocking cache warming)
    this.prefetchNextLessonAccessibility(moduleId, lessonId).catch(err => {
      safeTelemetry(() => {
        console.warn('⚠️ [LessonProgress] Prefetch failed (non-critical):', err)
      })
    })

    return {
      success: true,
      dbUpdated: dbWriteSuccess,
      cacheUpdated: cacheUpdateSuccess
    }
  }

  /**
   * Private helper: Update progress cache with verification
   * 
   * LOGIC:
   * 1. Fetch fresh progress from DB
   * 2. Update SmartAuthService cache
   * 3. Verify completion exists in cache
   * 4. Race with 2s timeout to prevent blocking
   * 
   * @returns Promise<boolean> - true if cache verified, false if failed/timeout
   */
  private static async updateProgressCacheVerified(
    userId: string,
    moduleId: string,
    lessonId: string
  ): Promise<boolean> {
    try {
      // Race: Cache update vs. 2s timeout
      const result = await Promise.race([
        (async () => {
          // Fetch fresh progress from DB
          const updatedProgress = await DatabaseService.getUserLessonProgress(userId)
          
          // Update legacy cache updater (if exists)
          this.updateProgressCache(updatedProgress)
          
          // Update SmartAuthService cache
          SmartAuthService['sessionCache']!.progress = updatedProgress
          SmartAuthService.markProgressUpdated()
          
          // Verify completion exists in cache
          const verification = verifyLessonCompletionInCache(userId, moduleId, lessonId)
          
          if (verification.isVerified) {
            safeTelemetry(() => {
              console.log(`✅ [LessonProgress] Cache verified for ${moduleId}/${lessonId}`)
            })
            return true
          } else {
            safeTelemetry(() => {
              console.warn(`⚠️ [LessonProgress] Cache verification failed:`, verification.error)
            })
            return false
          }
        })(),
        new Promise<boolean>(resolve => setTimeout(() => {
          safeTelemetry(() => {
            console.warn(`⏱️ [LessonProgress] Cache update timeout (2s exceeded)`)
          })
          resolve(false)
        }, 2000))
      ])
      
      return result
    } catch (error) {
      safeTelemetry(() => {
        console.error('❌ [LessonProgress] Cache update error:', error)
      })
      return false
    }
  }

  /**
   * Private helper: Prefetch next lesson accessibility (cache warming)
   * 
   * Opportunistically checks if next lesson is accessible and updates cache.
   * This reduces latency when user navigates to next lesson.
   * Non-blocking - errors are logged but don't affect completion flow.
   */
  private static async prefetchNextLessonAccessibility(
    currentModuleId: string,
    currentLessonId: string
  ): Promise<void> {
    try {
      safeTelemetry(() => {
        console.log(`🔄 [LessonProgress] Prefetching next lesson accessibility...`)
      })
      
      const nextLesson = await this.getNextSequentialLesson(currentModuleId, currentLessonId)
      const isAccessible = await this.isLessonAccessible(nextLesson.moduleId, nextLesson.lessonId)
      
      safeTelemetry(() => {
        console.log(`✅ [LessonProgress] Prefetch complete - Next: ${nextLesson.moduleId}/${nextLesson.lessonId}, Accessible: ${isAccessible}`)
      })
    } catch (error) {
      safeTelemetry(() => {
        console.warn('⚠️ [LessonProgress] Prefetch error (non-critical):', error)
      })
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

  // ===== MODULE COMPLETION TRACKING =====

  /**
   * FAST: Check if a module is completed using cached progress data - no API calls
   * Use this when you already have progress data to avoid loading states
   */
  static isModuleCompletedFast(
    moduleId: string, 
    progressData: UserLessonProgress[]
  ): boolean {
    const modules = getModules();
    const module = modules.find(m => m.id === moduleId);
    if (!module) return false;
    
    const completedLessonsInModule = progressData.filter(p => 
      p.module_id === moduleId && p.status === 'completed'
    ).length;
    
    return completedLessonsInModule === module.lessonCount;
  }

  /**
   * Check if a module is completed (all lessons in module are completed)
   */
  static async isModuleCompleted(moduleId: string): Promise<boolean> {
    try {
      const progressData = await this.getUserLessonProgress();
      return this.isModuleCompletedFast(moduleId, progressData);
    } catch (error) {
      console.error('Failed to check module completion:', error);
      return false;
    }
  }

  /**
   * FAST: Get module completion percentage using cached progress data - no API calls
   */
  static getModuleCompletionPercentageFast(
    moduleId: string, 
    progressData: UserLessonProgress[]
  ): number {
    const modules = getModules();
    const module = modules.find(m => m.id === moduleId);
    if (!module) return 0;
    
    const completedLessonsInModule = progressData.filter(p => 
      p.module_id === moduleId && p.status === 'completed'
    ).length;
    
    return Math.round((completedLessonsInModule / module.lessonCount) * 100);
  }

  /**
   * Get module completion percentage
   */
  static async getModuleCompletionPercentage(moduleId: string): Promise<number> {
    try {
      const progressData = await this.getUserLessonProgress();
      return this.getModuleCompletionPercentageFast(moduleId, progressData);
    } catch (error) {
      console.error('Failed to get module completion percentage:', error);
      return 0;
    }
  }

  /**
   * FAST: Calculate module completion duration using cached progress data - no API calls
   * Returns duration in milliseconds, or null if module not completed or no start time
   */
  static getModuleCompletionDurationFast(
    moduleId: string, 
    progressData: UserLessonProgress[]
  ): number | null {
    // Check if module is completed first
    if (!this.isModuleCompletedFast(moduleId, progressData)) {
      return null;
    }

    const moduleProgress = progressData.filter(p => p.module_id === moduleId);
    
    // Find the earliest started_at time (module start)
    const moduleStartTimes = moduleProgress
      .filter(p => p.started_at)
      .map(p => new Date(p.started_at!).getTime())
      .sort((a, b) => a - b);
    
    // Find the latest completed_at time (module completion)
    const moduleCompletionTimes = moduleProgress
      .filter(p => p.completed_at && p.status === 'completed')
      .map(p => new Date(p.completed_at!).getTime())
      .sort((a, b) => b - a);
    
    if (moduleStartTimes.length === 0 || moduleCompletionTimes.length === 0) {
      return null;
    }
    
    const startTime = moduleStartTimes[0];
    const completionTime = moduleCompletionTimes[0];
    
    return completionTime - startTime;
  }

  /**
   * Calculate module completion duration (from first lesson start to last lesson completion)
   * Returns duration in milliseconds, or null if module not completed
   */
  static async getModuleCompletionDuration(moduleId: string): Promise<number | null> {
    try {
      const progressData = await this.getUserLessonProgress();
      return this.getModuleCompletionDurationFast(moduleId, progressData);
    } catch (error) {
      console.error('Failed to calculate module completion duration:', error);
      return null;
    }
  }

  /**
   * FAST: Get module completion info using cached progress data - no API calls
   * Returns comprehensive module completion status and timing info
   */
  static getModuleCompletionInfoFast(
    moduleId: string, 
    progressData: UserLessonProgress[]
  ): {
    isCompleted: boolean;
    completionPercentage: number;
    durationMs: number | null;
    durationFormatted: string | null;
  } {
    const isCompleted = this.isModuleCompletedFast(moduleId, progressData);
    const completionPercentage = this.getModuleCompletionPercentageFast(moduleId, progressData);
    const durationMs = this.getModuleCompletionDurationFast(moduleId, progressData);
    
    let durationFormatted: string | null = null;
    if (durationMs !== null) {
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        durationFormatted = `${hours}h ${minutes}m`;
      } else {
        durationFormatted = `${minutes}m`;
      }
    }
    
    return {
      isCompleted,
      completionPercentage,
      durationMs,
      durationFormatted
    };
  }

  /**
   * Get comprehensive module completion info
   */
  static async getModuleCompletionInfo(moduleId: string): Promise<{
    isCompleted: boolean;
    completionPercentage: number;
    durationMs: number | null;
    durationFormatted: string | null;
  }> {
    try {
      const progressData = await this.getUserLessonProgress();
      return this.getModuleCompletionInfoFast(moduleId, progressData);
    } catch (error) {
      console.error('Failed to get module completion info:', error);
      return {
        isCompleted: false,
        completionPercentage: 0,
        durationMs: null,
        durationFormatted: null
      };
    }
  }

  /**
   * Get the next lesson the user should continue with
   * Returns the first incomplete lesson, or the last lesson if all are complete
   * 
   * IMPORTANT: In our data model, user_lesson_progress contains a row ONLY when
   * a lesson is completed (status = 'completed', progress_percent = 100, completed_at set).
   * There is NO row for "not started" or "in progress" lessons.
   * 
   * @param progress - User's lesson progress array (only completed lessons)
   * @param curriculum - All modules from curriculum (ordered)
   * @returns Next lesson info or null if curriculum is empty
   */
  static getNextLesson(
    progress: UserLessonProgress[],
    curriculum: Module[]
  ): {
    moduleId: string
    lessonId: string
    moduleTitle: string
    lessonTitle: string
    description?: string
    status: 'not_started' | 'completed'
    allLessonsCompleted?: boolean // NEW: Flag for "all completed" state
  } | null {
    // 1. Flatten curriculum into ordered list of all lessons
    const orderedLessons = curriculum.flatMap((m) =>
      m.lessons.map((l) => ({
        moduleId: m.id,
        moduleTitle: m.title,
        moduleDescription: m.description,
        lessonId: l.id,
        lessonTitle: l.title,
        lessonDescription: l.description,
      }))
    )

    if (orderedLessons.length === 0) {
      return null
    }

    // 2. Build set of completed lesson keys for O(1) lookup
    // A lesson is completed if ANY of these are true:
    // - completed_at is set (most reliable)
    // - progress_percent = 100
    // - status = 'completed'
    const completedSet = new Set<string>()
    progress.forEach((p) => {
      const isCompleted = 
        !!p.completed_at || 
        p.progress_percent === 100 || 
        p.status === 'completed'
      
      if (isCompleted) {
        const key = `${p.module_id}-${p.lesson_id}`
        completedSet.add(key)
      }
    })

    // 3. Find the first lesson NOT completed
    for (const lesson of orderedLessons) {
      const key = `${lesson.moduleId}-${lesson.lessonId}`
      
      if (!completedSet.has(key)) {
        // This lesson is not completed → this is the next lesson
        // Description priority: lesson description > module description > undefined
        const description = lesson.lessonDescription || lesson.moduleDescription || undefined
        
        return {
          moduleId: lesson.moduleId,
          lessonId: lesson.lessonId,
          moduleTitle: lesson.moduleTitle,
          lessonTitle: lesson.lessonTitle,
          description,
          status: 'not_started' as const
        }
      }
    }

    // 4. If ALL lessons complete → return last lesson with special flag
    const last = orderedLessons[orderedLessons.length - 1]
    const description = last.lessonDescription || last.moduleDescription || undefined
    
    return {
      moduleId: last.moduleId,
      lessonId: last.lessonId,
      moduleTitle: last.moduleTitle,
      lessonTitle: last.lessonTitle,
      description,
      status: 'completed' as const,
      allLessonsCompleted: true // NEW: Flag to show "all caught up" UI
    }
  }
} 