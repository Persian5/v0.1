// app/api/verify-checkout-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { hasPremiumAccess } from "@/lib/utils/subscription";
import { withRateLimit, addRateLimitHeaders } from "@/lib/middleware/rate-limit-middleware";
import { RATE_LIMITS } from "@/lib/services/rate-limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const required = ["STRIPE_SECRET_KEY", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;
for (const k of required) {
  if (!process.env[k]) throw new Error(`Missing env var: ${k}`);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function makeSupabaseServer() {
  const store = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value;
        },
        set(_name: string, _value: string, _options: CookieOptions) {
          // no-op
        },
        remove(_name: string, _options: CookieOptions) {
          // no-op
        },
      },
    }
  );
}

export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = await withRateLimit(req, {
      config: RATE_LIMITS.VERIFY_CHECKOUT,
      keyPrefix: "verify-checkout",
      useIpFallback: false,
    });

    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    const sessionId = req.nextUrl.searchParams.get("session_id");
    if (!sessionId || sessionId.trim() === "") {
      const res = NextResponse.json(
        { verified: false, status: "invalid_session" },
        { status: 400 }
      );
      return addRateLimitHeaders(res, rateLimitResult.headers);
    }

    const supabase = makeSupabaseServer();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      const res = NextResponse.json(
        { verified: false, status: "unauthenticated" },
        { status: 401 }
      );
      return addRateLimitHeaders(res, rateLimitResult.headers);
    }

    let stripeSession: Stripe.Checkout.Session;
    try {
      stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (err) {
      console.error("Stripe session retrieve error:", err);
      const res = NextResponse.json(
        { verified: false, status: "failed" },
        { status: 400 }
      );
      return addRateLimitHeaders(res, rateLimitResult.headers);
    }

    const metadataUserId = stripeSession.metadata?.supabase_user_id;
    if (metadataUserId !== user.id) {
      const res = NextResponse.json(
        { verified: false, status: "failed" },
        { status: 403 }
      );
      return addRateLimitHeaders(res, rateLimitResult.headers);
    }

    if (stripeSession.payment_status !== "paid" || stripeSession.status !== "complete") {
      const res = NextResponse.json(
        { verified: false, status: "failed" },
        { status: 200 }
      );
      return addRateLimitHeaders(res, rateLimitResult.headers);
    }

    const hasPremium = await hasPremiumAccess();
    if (hasPremium) {
      const res = NextResponse.json(
        { verified: true, status: "verified" },
        { status: 200 }
      );
      return addRateLimitHeaders(res, rateLimitResult.headers);
    }

    const res = NextResponse.json(
      { verified: false, status: "processing" },
      { status: 200 }
    );
    return addRateLimitHeaders(res, rateLimitResult.headers);
  } catch (err) {
    console.error("Verify checkout session error:", err);
    return NextResponse.json(
      { verified: false, status: "failed" },
      { status: 500 }
    );
  }
}
