import { supabase } from '@/lib/supabase/client'
import { ensureFreshSession, looksLikeAuthExpiry } from './token-guard'

/**
 * Wrap database operations with automatic token refresh and retry logic
 * 
 * Flow:
 * 1. Ensure token is fresh (proactive refresh if needed)
 * 2. Try the operation
 * 3. If auth error occurs, refresh token and retry ONCE
 * 4. Throw error if retry fails
 * 
 * Usage:
 * ```typescript
 * await withAuthRetry(async () => {
 *   const { error } = await supabase.from('table').insert(data)
 *   if (error) throw error
 * })
 * ```
 */
export async function withAuthRetry<T>(
  operation: () => Promise<T>,
  operationName?: string
): Promise<T> {
  // Step 1: Proactively ensure token is fresh
  await ensureFreshSession()
  
  try {
    // Step 2: Try the operation
    return await operation()
  } catch (error: any) {
    // Step 3: Check if error is auth-related
    const isAuthError = looksLikeAuthExpiry(error)
    
    if (!isAuthError) {
      // Not an auth error - throw immediately
      console.error(`Operation failed (${operationName || 'unknown'}):`, error)
      throw error
    }
    
    // Step 4: Auth error detected - try refresh and retry
    console.warn(`🔄 Auth error detected in ${operationName || 'operation'} - attempting refresh and retry`)
    
    // Store retry attempt in localStorage for debugging
    if (typeof window !== 'undefined') {
      const retryLog = JSON.parse(localStorage.getItem('auth-retry-log') || '[]')
      retryLog.push({
        operation: operationName,
        timestamp: new Date().toISOString(),
        error: error.message
      })
      // Keep only last 10 retries
      if (retryLog.length > 10) retryLog.shift()
      localStorage.setItem('auth-retry-log', JSON.stringify(retryLog))
    }
    
    try {
      const { error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.error('❌ Token refresh failed during retry:', refreshError)
        throw error // Throw original error
      }
      
      console.log('✅ Token refreshed - retrying operation')
      
      // Step 5: Retry the operation ONCE
      return await operation()
      
    } catch (retryError: any) {
      // Retry failed - throw original error with context
      console.error(`❌ Retry failed for ${operationName || 'operation'}:`, retryError)
      throw new Error(`Operation failed after token refresh: ${error.message}`)
    }
  }
}

/**
 * Specialized wrapper for operations that should queue on failure
 * Used for XP sync and other non-critical writes that can be retried later
 * 
 * Returns: { success: boolean, error?: Error }
 */
export async function withAuthRetryAndQueue<T>(
  operation: () => Promise<T>,
  operationName?: string,
  onQueueNeeded?: (error: Error) => void
): Promise<{ success: boolean; data?: T; error?: Error }> {
  try {
    const data = await withAuthRetry(operation, operationName)
    return { success: true, data }
  } catch (error: any) {
    console.error(`Operation failed and will be queued: ${operationName}`, error)
    
    // Notify caller that operation should be queued
    if (onQueueNeeded) {
      onQueueNeeded(error)
    }
    
    return { success: false, error }
  }
}

