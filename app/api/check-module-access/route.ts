// app/api/check-module-access/route.ts
import { NextRequest, NextResponse } from "next/server"
import { ModuleAccessService } from "@/lib/services/module-access-service"
import { rateLimiters, getClientIdentifier } from "@/lib/utils/rate-limit"
import { ModuleAccessQuerySchema, safeValidate } from "@/lib/utils/api-schemas"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * API route to check if the current user can access a specific module
 * Used by client components that need to verify module access
 */
export async function GET(req: NextRequest) {
  try {
    // Input validation with Zod
    const { searchParams } = new URL(req.url)
    const validationResult = safeValidate(ModuleAccessQuerySchema, {
      moduleId: searchParams.get('moduleId'),
    })
    
    if (!validationResult.success) {
      return NextResponse.json(
        { canAccess: false, reason: 'invalid_module_id', error: validationResult.error },
        { status: 400 }
      )
    }
    
    const { moduleId } = validationResult.data
    
    // Rate limit module access checks (20 requests per minute)
    const identifier = getClientIdentifier(req);
    const { success } = await rateLimiters.checkPremium.limit(identifier);
    
    if (!success) {
      return NextResponse.json(
        { canAccess: false, reason: 'rate_limit_exceeded' },
        { status: 429 }
      )
    }
    
    // Use the server-side service to check access
    const accessCheck = await ModuleAccessService.canAccessModule(moduleId)
    
    return NextResponse.json(accessCheck, { status: 200 })
  } catch (error) {
    console.error("Error checking module access:", error)
    return NextResponse.json(
      { canAccess: false, reason: 'server_error' },
      { status: 500 }
    )
  }
}

