import { getModule, getModules } from '../config/curriculum'
import { hasPremiumAccess } from '../utils/subscription'
import { Module } from '../types'
import { LessonProgressService } from './lesson-progress-service'

/**
 * Module Access Service
 * 
 * Centralized service for checking module access based on:
 * 1. Premium subscription requirement (payment)
 * 2. Prerequisite completion (progress)
 * 
 * Business Logic:
 * - Module 1: FREE for everyone
 * - Module 2+: Requires PREMIUM subscription
 * - All modules: Require previous modules to be completed
 */

export interface ModuleAccessCheck {
  canAccess: boolean
  reason?: 'no_premium' | 'incomplete_prerequisites' | 'not_authenticated'
  requiresPremium: boolean
  hasPremium: boolean
  prerequisitesComplete: boolean
  missingPrerequisites?: string[]
}

export interface ModuleWithAccessStatus extends Module {
  accessStatus: {
    canAccess: boolean
    requiresPremium: boolean
    hasPremium: boolean
    prerequisitesComplete: boolean
    showPremiumBadge: boolean  // Show "PREMIUM" badge (free user, module requires premium)
    showCompletionLock: boolean  // Show gray/disabled (prerequisites incomplete)
  }
}

export class ModuleAccessService {
  /**
   * Check if user can access a specific module
   * 
   * @param moduleId - The module ID to check (e.g., "module1", "module2")
   * @returns Detailed access information
   */
  static async canAccessModule(moduleId: string): Promise<ModuleAccessCheck> {
    // Get module configuration
    const module = getModule(moduleId)
    if (!module) {
      return {
        canAccess: false,
        reason: 'not_authenticated',
        requiresPremium: false,
        hasPremium: false,
        prerequisitesComplete: false
      }
    }

    // Check 1: Does this module require premium?
    const requiresPremium = module.requiresPremium ?? false
    
    // Check 2: Does user have premium?
    const hasPremium = await hasPremiumAccess()
    
    // Check 3: Are prerequisites complete?
    const { prerequisitesComplete, missingPrerequisites } = await this.checkPrerequisites(moduleId)
    
    // Determine access
    // NEW LOGIC: Premium users skip prerequisite checks (can access all modules immediately)
    // Free users must pass both payment check AND prerequisite check
    const passesPaymentCheck = !requiresPremium || hasPremium
    const canAccess = hasPremium ? passesPaymentCheck : (passesPaymentCheck && prerequisitesComplete)
    
    // Determine reason if no access
    let reason: 'no_premium' | 'incomplete_prerequisites' | undefined
    if (!canAccess) {
      if (!passesPaymentCheck) {
        reason = 'no_premium'
      } else if (!prerequisitesComplete && !hasPremium) {
        reason = 'incomplete_prerequisites'
      }
    }
    
    return {
      canAccess,
      reason,
      requiresPremium,
      hasPremium,
      prerequisitesComplete,
      missingPrerequisites
    }
  }

  /**
   * Check if prerequisites are complete for a module
   * 
   * @param moduleId - The module ID to check
   * @returns Whether prerequisites are complete and which are missing
   */
  static async checkPrerequisites(moduleId: string): Promise<{
    prerequisitesComplete: boolean
    missingPrerequisites: string[]
  }> {
    // Module 1 has no prerequisites
    if (moduleId === 'module1') {
      return {
        prerequisitesComplete: true,
        missingPrerequisites: []
      }
    }
    
    // For other modules, check if all previous modules are completed
    const allModules = getModules()
    const currentModuleIndex = allModules.findIndex(m => m.id === moduleId)
    
    if (currentModuleIndex === -1 || currentModuleIndex === 0) {
      return {
        prerequisitesComplete: true,
        missingPrerequisites: []
      }
    }
    
    // Check all previous modules
    const missingPrerequisites: string[] = []
    
    for (let i = 0; i < currentModuleIndex; i++) {
      const prerequisiteModule = allModules[i]
      const isComplete = await LessonProgressService.isModuleCompleted(prerequisiteModule.id)
      
      if (!isComplete) {
        missingPrerequisites.push(prerequisiteModule.id)
      }
    }
    
    return {
      prerequisitesComplete: missingPrerequisites.length === 0,
      missingPrerequisites
    }
  }

  /**
   * Get all modules with enriched access status
   * 
   * @returns Array of modules with access status information
   */
  static async getModulesWithAccessStatus(): Promise<ModuleWithAccessStatus[]> {
    const modules = getModules()
    const hasPremium = await hasPremiumAccess()
    
    // Process each module
    const modulesWithStatus = await Promise.all(
      modules.map(async (module) => {
        const requiresPremium = module.requiresPremium ?? false
        const { prerequisitesComplete } = await this.checkPrerequisites(module.id)
        
        // Determine what to show
        const showPremiumBadge = requiresPremium && !hasPremium
        // Free users: blocked by either premium badge OR prerequisite completion
        // Premium users: NEVER see completion locks (they skip prerequisites)
        const showCompletionLock = !hasPremium && !prerequisitesComplete && !showPremiumBadge
        // Premium users can access all modules immediately (skip prerequisite checks)
        const canAccess = hasPremium ? (!requiresPremium || hasPremium) : ((!requiresPremium || hasPremium) && prerequisitesComplete)
        
        return {
          ...module,
          accessStatus: {
            canAccess,
            requiresPremium,
            hasPremium,
            prerequisitesComplete,
            showPremiumBadge,
            showCompletionLock
          }
        }
      })
    )
    
    return modulesWithStatus
  }

  /**
   * Check if a module requires premium (pure function, no auth check)
   * 
   * @param moduleId - The module ID to check
   * @returns True if module requires premium subscription
   */
  static moduleRequiresPremium(moduleId: string): boolean {
    const module = getModule(moduleId)
    return module?.requiresPremium ?? false
  }
}

