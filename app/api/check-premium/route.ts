// app/api/check-premium/route.ts
import { NextResponse } from "next/server"
import { hasPremiumAccess } from "@/lib/utils/subscription"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * API route to check if the current user has premium access
 * Used by client components that need to check subscription status
 */
export async function GET() {
  try {
    const premium = await hasPremiumAccess()
    
    return NextResponse.json({ hasPremium: premium }, { status: 200 })
  } catch (error) {
    console.error("Error checking premium access:", error)
    return NextResponse.json({ hasPremium: false }, { status: 200 })
  }
}

