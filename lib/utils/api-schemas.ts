/**
 * API Input Validation Schemas (Zod)
 * 
 * Centralized validation for all API endpoints
 * Prevents injection attacks, type coercion issues, and invalid data
 */

import { z } from 'zod';

// ============================================================================
// Leaderboard API
// ============================================================================

export const LeaderboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});

export type LeaderboardQuery = z.infer<typeof LeaderboardQuerySchema>;

// ============================================================================
// User Stats API
// ============================================================================

export const UserStatsQuerySchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
});

export type UserStatsQuery = z.infer<typeof UserStatsQuerySchema>;

// ============================================================================
// Module Access Check API
// ============================================================================

export const ModuleAccessQuerySchema = z.object({
  moduleId: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Invalid module ID'),
});

export type ModuleAccessQuery = z.infer<typeof ModuleAccessQuerySchema>;

// ============================================================================
// Checkout API
// ============================================================================

export const CheckoutBodySchema = z.object({
  priceId: z.string().min(1).optional(), // Optional: defaults to env var
  metadata: z.record(z.string(), z.string()).optional(), // Fixed: z.record needs 2 args
});

export type CheckoutBody = z.infer<typeof CheckoutBodySchema>;

// ============================================================================
// Webhook API (Stripe)
// ============================================================================

export const StripeWebhookHeadersSchema = z.object({
  'stripe-signature': z.string().min(1, 'Missing Stripe signature'),
});

export type StripeWebhookHeaders = z.infer<typeof StripeWebhookHeadersSchema>;

// ============================================================================
// Premium Status Check
// ============================================================================

export const PremiumCheckQuerySchema = z.object({
  userId: z.string().uuid().optional(),
});

export type PremiumCheckQuery = z.infer<typeof PremiumCheckQuerySchema>;

// ============================================================================
// Generic Validation Helpers
// ============================================================================

/**
 * Safely parse and validate input
 * Returns { success: true, data } or { success: false, error }
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(input);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const errorMessage = result.error.issues
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    return { success: false, error: errorMessage };
  }
}

/**
 * Validate or throw (for simpler API route code)
 */
export function validateOrThrow<T>(
  schema: z.ZodSchema<T>,
  input: unknown,
  errorMessage: string = 'Invalid input'
): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.issues.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      throw new Error(`${errorMessage} - ${details}`);
    }
    throw error;
  }
}

