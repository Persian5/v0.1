// app/api/check-module-access/route.ts
import { NextRequest, NextResponse } from "next/server"
import { ModuleAccessService } from "@/lib/services/module-access-service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * API route to check if the current user can access a specific module
 * Used by client components that need to verify module access
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const moduleId = searchParams.get('moduleId')
    
    if (!moduleId) {
      return NextResponse.json(
        { canAccess: false, reason: 'missing_module_id' },
        { status: 400 }
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

