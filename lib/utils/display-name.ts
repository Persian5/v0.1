/**
 * Display Name Utilities
 * 
 * Generates default display names for users based on their first and last names.
 * Used for leaderboards and public-facing user identification.
 */

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

