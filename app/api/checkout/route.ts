// app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { withRateLimit, addRateLimitHeaders } from "@/lib/middleware/rate-limit-middleware";
import { RATE_LIMITS } from "@/lib/services/rate-limiter";

export const runtime = "nodejs";         // required to avoid Edge runtime
export const dynamic = "force-dynamic";  // don't cache

// ---- Guard env at module load (fail fast on Vercel build) ----
const required = [
  "STRIPE_SECRET_KEY",
  "STRIPE_PRICE_ID",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

for (const k of required) {
  if (!process.env[k]) {
    throw new Error(`Missing env var: ${k}`);
  }
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
// Note: not pinning apiVersion avoids the "clover/acacia" mismatch issue.
// If you *do* pin, ensure it matches your account's version exactly.

function makeSupabaseServer() {
  const store = cookies();
  // Minimal cookie adapter; we only *read* cookies here.
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // no-op: not setting cookies from this route
        },
        remove(name: string, options: CookieOptions) {
          // no-op
        },
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    // CRITICAL: Rate limit checkout to prevent abuse (3 requests per 5 minutes)
    const rateLimitResult = await withRateLimit(req, {
      config: RATE_LIMITS.CHECKOUT,
      keyPrefix: 'checkout',
      useIpFallback: true
    });

    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    const supabase = makeSupabaseServer();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const origin = new URL(req.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      // Keep success/cancel on your domain; no extra env needed:
      success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing/canceled`,
      allow_promotion_codes: true,

      // IMPORTANT: pass ONLY ONE of `customer` or `customer_email`.
      customer_email: user.email ?? undefined,

      // Carry the supabase user id so the webhook can update your row.
      metadata: { supabase_user_id: user.id },
    });

    const response = NextResponse.json({ url: session.url }, { status: 200 });
    return addRateLimitHeaders(response, rateLimitResult.headers);
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: err.message ?? "Checkout failed" }, { status: 500 });
  }
}
