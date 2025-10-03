# Stripe Integration Setup Guide

Complete step-by-step guide to integrate Stripe subscriptions with your Persian learning app.

## Prerequisites

- [x] Supabase project with `user_subscriptions` table
- [x] Next.js app deployed on Vercel
- [ ] Stripe account (test mode initially)

## Step 1: Create Stripe Product & Price

1. **Go to Stripe Dashboard** → Products → [+ Add Product]
2. **Product Details**:
   - Name: "Persian Learning Premium"
   - Description: "Full access to all Persian language modules and lessons"
3. **Pricing**:
   - Model: **Recurring**
   - Price: **$4.99**
   - Billing period: **Monthly**
   - Currency: **USD**
4. **Click "Save product"**
5. **Copy the Price ID** (starts with `price_...`) → You'll need this for `STRIPE_PRICE_ID`

## Step 2: Get Stripe API Keys

1. **Go to Stripe Dashboard** → Developers → API Keys
2. **Copy "Secret key"** (starts with `sk_test_...` in test mode)
   - This is your `STRIPE_SECRET_KEY`
3. **Keep "Publishable key"** visible (you won't need it for server-side integration)

## Step 3: Add Environment Variables to Vercel

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
2. **Add these variables** (for both Production and Preview):

```
STRIPE_SECRET_KEY=sk_test_your_actual_key_here
STRIPE_PRICE_ID=price_your_actual_price_id_here
STRIPE_WEBHOOK_SECRET=(leave blank for now - add in Step 5)
```

3. **Save changes**
4. **Redeploy your app** (Vercel → Deployments → [...] → Redeploy)

## Step 4: Deploy & Get Your Domain

1. **Wait for deployment to complete**
2. **Copy your production URL**: `https://your-app.vercel.app`
3. **Confirm /api/checkout and /api/webhooks are deployed**
   - You can check: `https://your-app.vercel.app/api/checkout` (should return 401 Unauthorized if not logged in - that's correct!)

## Step 5: Create Stripe Webhook

1. **Go to Stripe Dashboard** → Developers → Webhooks → [+ Add endpoint]
2. **Endpoint URL**: `https://your-app.vercel.app/api/webhooks`
3. **Listen to events** → Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. **Click "Add endpoint"**
5. **Copy the "Signing secret"** (starts with `whsec_...`)
6. **Go back to Vercel** → Environment Variables → Add:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret_here
   ```
7. **Redeploy again** (required for webhook secret to take effect)

## Step 6: Test the Integration

### Test User Flow

1. **Create a test user** in your app (or use existing)
2. **Log in** to the app
3. **Add a Subscribe button** to your pricing page (use `<SubscribeButton />` component)
4. **Click Subscribe**
   - Should redirect to Stripe Checkout
5. **Use test card**: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/34)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)
6. **Complete checkout**
   - Should redirect to `/billing/success`
7. **Check Supabase** → Table Editor → `user_subscriptions`
   - Row should exist with:
     - `status = 'active'`
     - `plan_type = 'premium'`
     - `stripe_customer_id` filled
     - `stripe_subscription_id` filled
     - `current_period_end` set to ~30 days from now

### Verify Webhook Events

1. **Go to Stripe Dashboard** → Developers → Webhooks → [Your Endpoint]
2. **Check "Attempted events"**
   - Should see `checkout.session.completed` with **200 response**
   - Should see `customer.subscription.updated` with **200 response**
3. **If you see 4xx or 5xx errors**:
   - Click the event → View logs
   - Check error message
   - Common issues:
     - Missing `STRIPE_WEBHOOK_SECRET` (redeploy after adding)
     - Wrong webhook secret (copy from Stripe again)
     - Supabase RLS blocking writes (webhook uses service role key to bypass)

### Test Subscription Access

1. **In your app**, check that the user can now access Module 2+ lessons
2. **Use the `hasPremiumAccess()` utility** in server components:
   ```typescript
   import { hasPremiumAccess } from '@/lib/utils/subscription';
   
   const isPremium = await hasPremiumAccess();
   if (!isPremium && moduleId !== 'module1') {
     redirect('/pricing');
   }
   ```

### Test Cancellation Flow

1. **Go to Stripe Dashboard** → Customers → [Test Customer] → Subscriptions
2. **Click subscription** → Actions → **Cancel subscription**
3. **Choose**: "Cancel at period end" (recommended for testing)
4. **Confirm cancellation**
5. **Check webhook fired** → Should see `customer.subscription.updated` with 200
6. **Check Supabase** → `user_subscriptions` table:
   - `cancel_at_period_end` should be `true`
   - `status` still `active` (until period end)
7. **Try "Cancel immediately"**:
   - Status changes to `canceled`
   - User loses access immediately

### Test Resubscription

1. **Log in as canceled user**
2. **Click Subscribe again**
3. **Complete new checkout**
4. **Verify**:
   - New subscription created
   - `status` back to `active`
   - `cancel_at_period_end` back to `false`

## Step 7: Add Subscription Gating to Lessons

**Example**: Gate Module 2+ lessons behind subscription

```typescript
// app/modules/[moduleId]/page.tsx
import { hasPremiumAccess } from '@/lib/utils/subscription';
import { redirect } from 'next/navigation';

export default async function ModulePage({ params }: { params: { moduleId: string } }) {
  const { moduleId } = params;
  
  // Module 1 is free, everything else requires premium
  if (moduleId !== 'module1') {
    const isPremium = await hasPremiumAccess();
    if (!isPremium) {
      redirect('/pricing?upgrade=true');
    }
  }
  
  // ... rest of your module page
}
```

## Step 8: Go Live (When Ready)

### Before Going Live Checklist

- [ ] All test flows working perfectly
- [ ] Webhook events showing 200 responses
- [ ] Database updating correctly
- [ ] Subscription gating working on all protected routes
- [ ] Success/cancel pages styled and working
- [ ] Account page shows subscription status

### Production Setup

1. **Stripe Dashboard** → Developers → Toggle "View test data" OFF
2. **Create production product** (same as test, but in live mode)
3. **Copy live Price ID** (starts with `price_...`)
4. **Go to API Keys** → Copy **live** Secret key (starts with `sk_live_...`)
5. **Create new webhook** for production URL with live mode events
6. **Update Vercel env vars** (Production only):
   ```
   STRIPE_SECRET_KEY=sk_live_your_live_key
   STRIPE_PRICE_ID=price_your_live_price_id
   STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
   ```
7. **Redeploy production**
8. **Test with real card** (or another test in live mode)

## Common Issues & Solutions

### Issue: "Missing env var: STRIPE_SECRET_KEY"
**Solution**: Env vars not set or deployment happened before vars were added. Add vars and redeploy.

### Issue: Webhook showing 401 Unauthorized
**Solution**: Wrong `STRIPE_WEBHOOK_SECRET` or it's not set. Copy from Stripe webhook settings, update Vercel, redeploy.

### Issue: Webhook fires but database not updating
**Solution**: 
- Check Vercel logs for errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check Supabase table name matches exactly: `user_subscriptions`
- Verify RLS policies allow service role to write

### Issue: User stays on "free" after payment
**Solution**:
- Check webhook fired successfully (200 response in Stripe)
- Check `user_subscriptions` table for updated row
- Verify `metadata.supabase_user_id` was passed in checkout
- Check Vercel function logs for webhook errors

### Issue: Stripe API version error
**Solution**: The code doesn't pin `apiVersion` to avoid this. If you modified the code to pin a version, remove it or use exact version from your Stripe account settings.

### Issue: Build fails with TypeScript errors
**Solution**: 
- Install Stripe types: `npm install stripe`
- Ensure all env vars exist (build checks for them)
- Check imports match file paths exactly

## Database Indexes (Recommended for Performance)

Run this in Supabase SQL editor:

```sql
-- Unique index on user_id for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS user_subscriptions_user_id_idx
  ON user_subscriptions (user_id);

-- Index on stripe_customer_id for webhook lookups
CREATE INDEX IF NOT EXISTS user_subscriptions_customer_idx
  ON user_subscriptions (stripe_customer_id);
```

## Support Resources

- **Stripe Docs**: https://stripe.com/docs/billing/subscriptions/overview
- **Stripe Test Cards**: https://stripe.com/docs/testing#cards
- **Supabase RLS**: https://supabase.com/docs/guides/auth/row-level-security
- **Next.js API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

---

**You're all set!** Your Stripe integration is production-ready. 🎉
