/**
 * Display Name Utilities
 * 
 * Generates default display names for users based on their first and last names.
 * Used for leaderboards and public-facing user identification.
 */

import { supabase } from '@/lib/supabase/client'

/**
 * Generates a default display name in the format "FirstName LastInitial."
 * 
 * Examples:
 * - "Armeen" + "Aminzadeh" → "Armeen A."
 * - "Sara" + null → "Sara"
 * - null + "Smith" → null (fallback to existing display_name)
 * 
 * @param firstName - User's first name (can be null/undefined)
 * @param lastName - User's last name (can be null/undefined)
 * @returns Display name string or null if firstName is missing
 */
export function generateDefaultDisplayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string | null {
  // If no first name, return null (will fallback to existing display_name)
  if (!firstName || firstName.trim() === '') {
    return null
  }

  const trimmedFirst = firstName.trim()
  
  // If no last name, return just first name (no period)
  if (!lastName || lastName.trim() === '') {
    return trimmedFirst
  }

  // Format: "FirstName LastInitial."
  const lastInitial = lastName.trim().charAt(0).toUpperCase()
  return `${trimmedFirst} ${lastInitial}.`
}

/**
 * Validates a display name for length and content.
 * 
 * @param displayName - Display name to validate
 * @returns Object with valid flag and optional error message
 */
export function validateDisplayName(displayName: string): {
  valid: boolean
  error?: string
} {
  if (!displayName || displayName.trim() === '') {
    return { valid: false, error: 'Display name cannot be empty' }
  }

  const trimmed = displayName.trim()

  if (trimmed.length < 2) {
    return { valid: false, error: 'Display name must be at least 2 characters' }
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'Display name must be 50 characters or less' }
  }

  return { valid: true }
}

/**
 * Checks if a display name is already taken by another user.
 * 
 * @param displayName - The display name to check.
 * @param currentUserId - The current user's ID (to exclude from check).
 * @returns true if display name is available, false if taken.
 */
export async function isDisplayNameAvailable(
  displayName: string,
  currentUserId: string
): Promise<{ available: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('display_name', displayName.trim())
      .neq('id', currentUserId)
      .limit(1)
      .single()

    if (error && error.code === 'PGRST116') {
      // No results found - display name is available
      return { available: true }
    }

    if (error) {
      console.error('Error checking display name availability:', error)
      return { available: false, error: 'Failed to check display name availability.' }
    }

    // If data exists, display name is taken
    return { available: false }
  } catch (error) {
    console.error('Error checking display name availability:', error)
    return { available: false, error: 'Failed to check display name availability.' }
  }
}

/**
 * Generates a unique display name by appending a number if needed.
 * 
 * @param baseDisplayName - The desired display name.
 * @param currentUserId - The current user's ID.
 * @returns A unique display name (may have a number appended).
 */
export async function generateUniqueDisplayName(
  baseDisplayName: string,
  currentUserId: string
): Promise<string> {
  const trimmed = baseDisplayName.trim()
  const check = await isDisplayNameAvailable(trimmed, currentUserId)
  
  if (check.available) {
    return trimmed
  }

  // Try appending numbers until we find an available one
  for (let i = 1; i <= 9999; i++) {
    const candidate = `${trimmed}${i}`
    const checkCandidate = await isDisplayNameAvailable(candidate, currentUserId)
    if (checkCandidate.available) {
      return candidate
    }
  }

  // Fallback: append timestamp if all numbers are taken (very unlikely)
  return `${trimmed}${Date.now().toString().slice(-4)}`
}

