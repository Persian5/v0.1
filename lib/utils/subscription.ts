// lib/utils/subscription.ts (server-side only)
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Server-side check for premium subscription access
 * Use this in server components, server actions, or API routes
 * 
 * @returns true if user has active premium subscription, false otherwise
 */
export async function hasPremiumAccess(): Promise<boolean> {
  const store = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // no-op: not setting cookies from this utility
        },
        remove(name: string, options: CookieOptions) {
          // no-op
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("status,current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return false;

  const isActive = data.status === "active";
  const notExpired =
    !data.current_period_end ||
    new Date(data.current_period_end).getTime() > Date.now();

  return isActive && notExpired;
}

/**
 * Get full subscription details for the current user
 * Use this when you need more than just access check
 */
export async function getSubscriptionDetails() {
  const store = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // no-op
        },
        remove(name: string, options: CookieOptions) {
          // no-op
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching subscription:", error);
    return null;
  }

  return data;
}
