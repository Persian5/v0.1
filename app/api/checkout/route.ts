// app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { validatePriceId } from "@/lib/utils/api-validation";

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
    const supabase = makeSupabaseServer();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate STRIPE_PRICE_ID format (extra safety check)
    const priceId = process.env.STRIPE_PRICE_ID!
    const priceValidation = validatePriceId(priceId)
    if (!priceValidation.valid) {
      console.error('Invalid STRIPE_PRICE_ID configuration:', priceValidation.error)
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const origin = new URL(req.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceValidation.sanitized!, quantity: 1 }],
      success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing/canceled`,
      allow_promotion_codes: true,
      customer_email: user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: err.message ?? "Checkout failed" }, { status: 500 });
  }
}
