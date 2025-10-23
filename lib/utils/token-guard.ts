import { supabase } from '@/lib/supabase/client'

/**
 * Token Guard - Ensures fresh session tokens before database operations
 * 
 * Prevents race conditions by using a single-flight pattern:
 * - Only one refresh runs at a time
 * - Concurrent calls wait for the same refresh to complete
 * - Proactively refreshes tokens within 60s of expiry
 */

let refreshInFlight: Promise<void> | null = null

/**
 * Ensure the current session has a fresh, valid token
 * 
 * - Checks if token expires within 60 seconds
 * - Refreshes proactively if needed
 * - Uses single-flight guard to prevent duplicate refreshes
 * - Signs out user if refresh fails (security measure)
 */
export async function ensureFreshSession(): Promise<void> {
  const { data } = await supabase.auth.getSession()
  
  // No session = no refresh needed
  if (!data.session) {
    return
  }
  
  const expiresAt = data.session.expires_at ? data.session.expires_at * 1000 : 0
  const now = Date.now()
  const timeUntilExpiry = expiresAt - now
  
  // Token is fresh (> 60 seconds until expiry)
  if (timeUntilExpiry > 60_000) {
    return
  }
  
  // Token is expired or expiring soon - refresh needed
  console.log(`Token expiring in ${Math.floor(timeUntilExpiry / 1000)}s - refreshing proactively`)
  
  // Single-flight guard: if refresh already in progress, wait for it
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const { error } = await supabase.auth.refreshSession()
        
        if (error) {
          console.error('Token refresh failed:', error.message)
          // Hard reset: sign out user if refresh fails
          await supabase.auth.signOut()
          throw new Error('Session refresh failed - please sign in again')
        }
        
        console.log('Token refreshed successfully')
      } catch (error) {
        console.error('Token refresh error:', error)
        throw error
      } finally {
        // Clear the in-flight flag
        refreshInFlight = null
      }
    })()
  }
  
  // Wait for the refresh to complete (whether we started it or it was already running)
  await refreshInFlight
}

/**
 * Check if an error looks like an auth/token expiry error
 * Used by retry wrapper to detect when to refresh and retry
 */
export function looksLikeAuthExpiry(error: any): boolean {
  const msg = String(error?.message ?? error).toLowerCase()
  
  return (
    msg.includes('jwt') ||
    msg.includes('expired') ||
    msg.includes('invalid') && msg.includes('token') ||
    msg.includes('401') ||
    msg.includes('unauthorized')
  )
}

