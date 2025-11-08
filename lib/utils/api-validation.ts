/**
 * API Input Validation Utilities
 * 
 * Provides basic input sanitization and validation for API routes.
 * Prevents injection attacks and malformed requests.
 */

/**
 * Validate moduleId format
 * Expected: module1, module2, etc.
 */
export function validateModuleId(moduleId: unknown): { valid: boolean; sanitized?: string; error?: string } {
  if (typeof moduleId !== 'string') {
    return { valid: false, error: 'moduleId must be a string' }
  }

  // Must match pattern: module[number]
  const modulePattern = /^module\d+$/
  if (!modulePattern.test(moduleId)) {
    return { valid: false, error: 'Invalid moduleId format. Expected: module[number]' }
  }

  // Additional safety: max length check
  if (moduleId.length > 20) {
    return { valid: false, error: 'moduleId too long' }
  }

  return { valid: true, sanitized: moduleId }
}

/**
 * Validate lessonId format
 * Expected: lesson1, lesson2, etc.
 */
export function validateLessonId(lessonId: unknown): { valid: boolean; sanitized?: string; error?: string } {
  if (typeof lessonId !== 'string') {
    return { valid: false, error: 'lessonId must be a string' }
  }

  // Must match pattern: lesson[number]
  const lessonPattern = /^lesson\d+$/
  if (!lessonPattern.test(lessonId)) {
    return { valid: false, error: 'Invalid lessonId format. Expected: lesson[number]' }
  }

  // Additional safety: max length check
  if (lessonId.length > 20) {
    return { valid: false, error: 'lessonId too long' }
  }

  return { valid: true, sanitized: lessonId }
}

/**
 * Validate priceId format (Stripe price IDs)
 * Expected: price_xxxxxxxxxxxxx
 */
export function validatePriceId(priceId: unknown): { valid: boolean; sanitized?: string; error?: string } {
  if (typeof priceId !== 'string') {
    return { valid: false, error: 'priceId must be a string' }
  }

  // Must start with price_ and contain only alphanumeric and underscores
  const pricePattern = /^price_[a-zA-Z0-9_]+$/
  if (!pricePattern.test(priceId)) {
    return { valid: false, error: 'Invalid priceId format' }
  }

  // Stripe price IDs are typically 20-30 chars
  if (priceId.length > 50) {
    return { valid: false, error: 'priceId too long' }
  }

  return { valid: true, sanitized: priceId }
}

/**
 * Validate URL parameter from query string
 * Generic validation for any string parameter
 */
export function validateStringParam(
  paramName: string,
  value: unknown,
  options?: {
    maxLength?: number
    allowEmpty?: boolean
    pattern?: RegExp
  }
): { valid: boolean; sanitized?: string; error?: string } {
  if (typeof value !== 'string') {
    return { valid: false, error: `${paramName} must be a string` }
  }

  if (!options?.allowEmpty && value.trim() === '') {
    return { valid: false, error: `${paramName} cannot be empty` }
  }

  const maxLength = options?.maxLength || 100
  if (value.length > maxLength) {
    return { valid: false, error: `${paramName} too long (max ${maxLength} chars)` }
  }

  if (options?.pattern && !options.pattern.test(value)) {
    return { valid: false, error: `${paramName} format invalid` }
  }

  return { valid: true, sanitized: value.trim() }
}

/**
 * Create a standardized error response for validation failures
 */
export function createValidationErrorResponse(error: string, status: number = 400) {
  return Response.json(
    { error: 'Validation Error', message: error },
    { status }
  )
}

