// app/api/check-module-access/route.ts
import { NextRequest, NextResponse } from "next/server"
import { ModuleAccessService } from "@/lib/services/module-access-service"
import { withRateLimit, addRateLimitHeaders } from "@/lib/middleware/rate-limit-middleware"
import { RATE_LIMITS } from "@/lib/services/rate-limiter"
import { validateModuleId, createValidationErrorResponse } from "@/lib/utils/api-validation"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * API route to check if the current user can access a specific module
 * Used by client components that need to verify module access
 */
export async function GET(req: NextRequest) {
  try {
    // Rate limit module access checks (30 requests per minute)
    const rateLimitResult = await withRateLimit(req, {
      config: RATE_LIMITS.MODULE_ACCESS,
      keyPrefix: 'module-access',
      useIpFallback: false // Only rate limit authenticated users
    });

    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    const { searchParams } = new URL(req.url)
    const moduleId = searchParams.get('moduleId')
    
    if (!moduleId) {
      return NextResponse.json(
        { canAccess: false, reason: 'missing_module_id' },
        { status: 400 }
      )
    }
    
    // Validate moduleId format
    const validation = validateModuleId(moduleId)
    if (!validation.valid) {
      return createValidationErrorResponse(validation.error!)
    }
    
    // Use the server-side service to check access
    const accessCheck = await ModuleAccessService.canAccessModule(validation.sanitized!)
    
    const response = NextResponse.json(accessCheck, { status: 200 })
    return addRateLimitHeaders(response, rateLimitResult.headers)
  } catch (error) {
    console.error("Error checking module access:", error)
    return NextResponse.json(
      { canAccess: false, reason: 'server_error' },
      { status: 500 }
    )
  }
}

