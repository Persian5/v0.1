import { DatabaseService, UserSubscription } from '@/lib/supabase/database'
import { AuthService } from './auth-service'

/**
 * SubscriptionService - Business logic for subscription management
 * 
 * Paywall Logic:
 * - Module 1 (all lessons): FREE for everyone
 * - Module 2+: Requires active subscription
 * - No subscription row in DB = free user = Module 1 only
 * - Subscription row with status='active' or 'trialing' = full access
 */
export class SubscriptionService {

  /**
   * Check if user has access to a specific module
   * Module 1 is always accessible, Module 2+ requires subscription
   */
  static async hasModuleAccess(userId: string, moduleId: string): Promise<boolean> {
    try {
      // Module 1 is always free
      if (moduleId === 'module1') {
        return true
      }

      // Module 2+ requires active subscription
      const hasSubscription = await DatabaseService.hasActiveSubscription(userId)
      return hasSubscription
    } catch (error) {
      // Fail closed: if error checking access, deny access to paid modules
      console.error('Error checking module access:', error)
      return moduleId === 'module1' // Only allow Module 1 on error
    }
  }

  /**
   * Get user's subscription status
   * Returns null if user has no subscription (free tier)
   */
  static async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      return await DatabaseService.getUserSubscription(userId)
    } catch (error) {
      console.error('Error fetching subscription:', error)
      return null
    }
  }

  /**
   * Check if user has any active subscription
   */
  static async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      return await DatabaseService.hasActiveSubscription(userId)
    } catch (error) {
      console.error('Error checking active subscription:', error)
      return false
    }
  }

  /**
   * Get subscription status for display
   * Returns user-friendly status string
   */
  static async getSubscriptionStatus(userId: string): Promise<string> {
    try {
      const subscription = await DatabaseService.getUserSubscription(userId)
      
      if (!subscription) {
        return 'free'
      }

      return subscription.status
    } catch (error) {
      console.error('Error getting subscription status:', error)
      return 'free'
    }
  }

  /**
   * Check if current authenticated user has module access
   * Convenience method that gets current user automatically
   */
  static async currentUserHasModuleAccess(moduleId: string): Promise<boolean> {
    try {
      const user = await AuthService.getCurrentUser()
      
      if (!user) {
        // No authenticated user = only Module 1 access
        return moduleId === 'module1'
      }

      return await this.hasModuleAccess(user.id, moduleId)
    } catch (error) {
      console.error('Error checking current user module access:', error)
      return moduleId === 'module1'
    }
  }

  /**
   * Get human-readable subscription info for UI display
   */
  static async getSubscriptionDisplayInfo(userId: string): Promise<{
    status: string
    displayText: string
    isActive: boolean
    periodEnd: Date | null
  }> {
    try {
      const subscription = await DatabaseService.getUserSubscription(userId)

      if (!subscription) {
        return {
          status: 'free',
          displayText: 'Free Plan',
          isActive: false,
          periodEnd: null
        }
      }

      const isActive = await DatabaseService.hasActiveSubscription(userId)
      const periodEnd = subscription.current_period_end 
        ? new Date(subscription.current_period_end) 
        : null

      let displayText = 'Unknown'
      
      switch (subscription.status) {
        case 'active':
          displayText = 'Premium Plan'
          break
        case 'trialing':
          displayText = 'Free Trial'
          break
        case 'canceled':
          displayText = 'Canceled'
          break
        case 'past_due':
          displayText = 'Payment Issue'
          break
        default:
          displayText = 'Free Plan'
      }

      return {
        status: subscription.status,
        displayText,
        isActive,
        periodEnd
      }
    } catch (error) {
      console.error('Error getting subscription display info:', error)
      return {
        status: 'free',
        displayText: 'Free Plan',
        isActive: false,
        periodEnd: null
      }
    }
  }
}

