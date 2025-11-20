/**
 * Centralized logging for email verification flow
 * 
 * All verification-related logs should use this utility
 * to maintain consistent logging format across AuthModal,
 * EmailVerificationDetector, and related components.
 * 
 * Format: [VERIFY] message data
 */
export const verificationLog = (...args: any[]) => {
  console.log('[VERIFY]', ...args)
}

