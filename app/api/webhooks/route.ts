// app/api/webhooks/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

export const runtime = "nodejs";        // webhooks must not run on Edge
export const dynamic = "force-dynamic"; // never cache

const must = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

for (const k of must) {
  if (!process.env[k]) throw new Error(`Missing env var: ${k}`);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
// See note in checkout: we don't pin apiVersion to avoid mismatches.

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // server-only
  { auth: { persistSession: false } }
);

// Utility: upsert user_subscriptions row by user_id
async function upsertSubscription(params: {
  user_id: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  status?: string;
  plan_type?: string;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
}) {
  const { error } = await supabaseAdmin
    .from("user_subscriptions")
    .upsert(
      {
        user_id: params.user_id,
        stripe_customer_id: params.stripe_customer_id ?? undefined,
        stripe_subscription_id: params.stripe_subscription_id ?? undefined,
        status: params.status ?? undefined,
        plan_type: params.plan_type ?? undefined,
        current_period_end: params.current_period_end ?? undefined,
        cancel_at_period_end: params.cancel_at_period_end ?? undefined,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) throw error;
}

export async function POST(req: Request) {
  const sig = headers().get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const supabaseUserId = session.metadata?.supabase_user_id;
        if (!supabaseUserId) {
          console.warn("No supabase_user_id on session.metadata; skipping");
          return NextResponse.json({ received: true }, { status: 200 });
        }

        const customerId = (session.customer as string) ?? null;

        // 1) Seed a minimal row so later events can find it.
        await upsertSubscription({
          user_id: supabaseUserId,
          stripe_customer_id: customerId,
          plan_type: "premium",
          status: "active",
        });

        // 2) Best-effort enrich with subscription details (but never crash).
        const subId = session.subscription as string | null;
        if (subId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subId);
            await upsertSubscription({
              user_id: supabaseUserId,
              stripe_customer_id: customerId,
              stripe_subscription_id: sub.id,
              status: sub.status,
              plan_type: "premium",
              current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
              cancel_at_period_end: (sub as any).cancel_at_period_end ?? false,
            });
          } catch (e) {
            console.warn("Subscription not retrievable yet, will rely on later events.", subId, e);
          }
        }

        return NextResponse.json({ received: true }, { status: 200 });
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = String(sub.customer);

        // Find the owning user by customer id
        const { data: row, error } = await supabaseAdmin
          .from("user_subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (error) throw error;
        if (!row) {
          console.warn("No user_subscriptions row for customer", customerId);
          break;
        }

        await upsertSubscription({
          user_id: row.user_id,
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id,
          status: sub.status,
          plan_type: sub.status === "active" ? "premium" : "free",
          current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
          cancel_at_period_end: (sub as any).cancel_at_period_end ?? false,
        });

        break;
      }

      default:
        // It's fine to ignore other events
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
