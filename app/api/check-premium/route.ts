// app/api/check-premium/route.ts
import { NextRequest, NextResponse } from "next/server"
import { hasPremiumAccess } from "@/lib/utils/subscription"
import { withRateLimit, addRateLimitHeaders } from "@/lib/middleware/rate-limit-middleware"
import { RATE_LIMITS } from "@/lib/services/rate-limiter"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * API route to check if the current user has premium access
 * Used by client components that need to check subscription status
 */
export async function GET(req: NextRequest) {
  try {
    // Rate limit premium checks (20 requests per minute)
    const rateLimitResult = await withRateLimit(req, {
      config: RATE_LIMITS.CHECK_PREMIUM,
      keyPrefix: 'check-premium',
      useIpFallback: false
    });

    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    const premium = await hasPremiumAccess()
    
    const response = NextResponse.json({ hasPremium: premium }, { status: 200 })
    return addRateLimitHeaders(response, rateLimitResult.headers)
  } catch (error) {
    console.error("Error checking premium access:", error)
    return NextResponse.json({ hasPremium: false }, { status: 200 })
  }
}

