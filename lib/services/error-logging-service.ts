/**
 * Error Logging Service
 * Centralizes error logging for the application
 * TODO: Integrate with Sentry/LogRocket in production
 */

interface ErrorLogContext {
  timestamp: string
  userId?: string
  routePath?: string
  [key: string]: any
}

/**
 * Logs application errors with context
 * In development: logs to console
 * In production: placeholder for Sentry/LogRocket integration
 */
export async function logAppError(
  error: unknown,
  context?: Record<string, any>
): Promise<void> {
  try {
    // Build enriched context
    const enrichedContext: ErrorLogContext = {
      timestamp: new Date().toISOString(),
      routePath: typeof window !== 'undefined' ? window.location.pathname : undefined,
      ...context
    }

    // Try to extract userId from context or session storage
    if (typeof window !== 'undefined' && !enrichedContext.userId) {
      try {
        const sessionData = sessionStorage.getItem('supabase.auth.token')
        if (sessionData) {
          const parsed = JSON.parse(sessionData)
          enrichedContext.userId = parsed?.currentSession?.user?.id
        }
      } catch {
        // Ignore session storage errors
      }
    }

    // Format error message
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    const logPayload = {
      message: errorMessage,
      stack: errorStack,
      context: enrichedContext
    }

    if (process.env.NODE_ENV === 'development') {
      // Development: log to console
      console.error('💥 App Error:', logPayload)
    } else {
      // Production: placeholder for external logging service
      console.warn('Captured error (would send to Sentry):', logPayload)
      
      // TODO: Integrate with Sentry
      // await Sentry.captureException(error, { contexts: { custom: enrichedContext } })
      
      // TODO: Integrate with LogRocket
      // LogRocket.captureException(error, { extra: enrichedContext })
    }
  } catch (loggingError) {
    // Fail silently - don't let logging errors break the app
    console.error('Error logging service failed:', loggingError)
  }
}

