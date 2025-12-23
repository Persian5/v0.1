# MUST FIX ROUTE

## Single Most Important File

**File**: `app/api/webhooks/route.ts`

**Why**: This file handles payment confirmations from Stripe. If it fails, users pay but don't get premium access. This is the highest-consequence failure mode.

**Current Status**: Correctly implemented with signature verification, but using TEST keys. The code is production-ready; the configuration is not.

---

## Ordered Launch Route (10 Steps)

### Step 1: Configure Stripe Live Mode

**Files**:
- Vercel Environment Variables (Dashboard)
- Stripe Dashboard (Production webhook)

**What to Change**:
1. In Stripe Dashboard: Create production webhook pointing to `https://yourdomain.com/api/webhooks`
2. Select events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
3. Copy the `whsec_...` signing secret
4. In Vercel Dashboard:
   - Set `STRIPE_SECRET_KEY` = `sk_live_...`
   - Set `STRIPE_WEBHOOK_SECRET` = `whsec_...` (from step 3)
   - Set `STRIPE_PRICE_ID` = your live price ID

**Why It Matters**: Cannot collect revenue without live Stripe keys.

**How to Verify**:
1. Deploy to production
2. Open browser DevTools Network tab
3. Go to `/pricing`, click Subscribe
4. Complete checkout with real card
5. Check Stripe Dashboard for successful payment
6. Check Supabase `user_subscriptions` table for new row with `status: 'active'`

---

### Step 2: Deploy to Production Domain

**Files**:
- Vercel Dashboard (Domain settings)
- DNS provider (if using external registrar)

**What to Change**:
1. In Vercel Project Settings > Domains: Add your production domain
2. Configure DNS records (CNAME or A record) per Vercel instructions
3. Verify SSL certificate is issued (automatic)

**Why It Matters**: Users need a URL to access the app.

**How to Verify**:
1. Visit `https://yourdomain.com`
2. Confirm page loads with green padlock (HTTPS)
3. Confirm no mixed content warnings in console

---

### Step 3: Verify All Environment Variables

**Files**:
- Vercel Dashboard > Project > Settings > Environment Variables

**Required Variables (Production)**:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Why It Matters**: Missing env vars cause crashes on specific routes.

**How to Verify**:
1. Trigger a redeploy in Vercel
2. Check build logs for "Missing env var" errors
3. Visit each critical route: `/modules`, `/pricing`, `/dashboard`
4. Check Vercel Function logs for runtime errors

---

### Step 4: Create Privacy Policy and Terms Pages

**Files to Create**:
- `app/privacy/page.tsx`
- `app/terms/page.tsx`

**What to Add**:
- Privacy Policy: Data collected, how used, third-party sharing (Supabase, Stripe)
- Terms of Service: Subscription terms, refund policy, account termination rights

**Why It Matters**: Legal requirement for subscription services. Stripe and App Stores require these.

**How to Verify**:
1. Visit `/privacy` and `/terms`
2. Confirm pages render without errors
3. Confirm links in footer (add to `app/layout.tsx` or footer component)

---

### Step 5: Verify Module 2-3 Content

**Files**:
- `lib/config/curriculum.ts`

**What to Do**:
1. Read through each lesson in Module 2 and Module 3
2. Confirm all lessons have complete `steps` arrays
3. Confirm vocabulary is defined for each lesson
4. Manually play through each lesson to verify no crashes

**Why It Matters**: Premium users pay money and expect complete content.

**How to Verify**:
1. Sign up as premium user (use test subscription first)
2. Complete every lesson in Module 2
3. Complete every lesson in Module 3
4. Note any incomplete steps, missing audio, or crashes

---

### Step 6: Set Up Error Monitoring

**Files to Update**:
- `app/layout.tsx`
- `next.config.mjs` (for source maps)
- Create Sentry/LogRocket account

**What to Add**:
```typescript
// In app/layout.tsx or a separate sentry.client.config.ts
import * as Sentry from "@sentry/nextjs"
Sentry.init({ dsn: "your-dsn", tracesSampleRate: 0.1 })
```

**Why It Matters**: You need to know when production breaks.

**How to Verify**:
1. Deploy with Sentry configured
2. Trigger a test error (add temporary throw in a component)
3. Confirm error appears in Sentry dashboard

---

### Step 7: Configure Database Backups

**Files**: Supabase Dashboard only

**What to Do**:
1. Go to Supabase Dashboard > Settings > Database
2. Enable Point-in-Time Recovery (Pro plan required)
3. Or: Set up pg_dump cron job for free tier

**Why It Matters**: User data loss is catastrophic and unrecoverable without backups.

**How to Verify**:
1. Create test user with progress
2. Trigger backup
3. Verify backup file exists (or PITR is enabled)

---

### Step 8: Add Support Email

**Files to Update**:
- `app/billing/canceled/page.tsx` (already references `support@iranopedia.com`)
- Create email account or forwarding rule

**What to Do**:
1. Set up `support@iranopedia.com` email
2. Configure forwarding to your personal email
3. Add contact link to account page and footer

**Why It Matters**: Users need a way to contact you for payment issues.

**How to Verify**:
1. Send test email to support address
2. Confirm you receive it
3. Reply and confirm delivery

---

### Step 9: Test Complete User Journey

**Critical Paths to Test**:

1. **Free User Flow**:
   - Sign up with email
   - Verify email
   - Complete onboarding
   - Complete Module 1 Lesson 1
   - Attempt Module 2 (should show premium modal)

2. **Paid User Flow**:
   - Sign up or sign in
   - Click Subscribe on Module 2
   - Complete Stripe checkout
   - Wait for webhook (2-3 seconds)
   - Access Module 2 lesson
   - Complete lesson and verify XP awards

3. **Edge Cases**:
   - Refresh during lesson
   - Close tab and return
   - Sign out and sign in
   - Use back button during lesson

**Why It Matters**: Finding bugs before users do.

**How to Verify**: Manual testing with checklist. Document any failures.

---

### Step 10: Launch Communications

**Files**: External (Email, Social)

**What to Do**:
1. Draft waitlist email announcing launch
2. Schedule social media posts
3. Prepare homepage messaging update
4. Have support plan ready (who responds to emails, how fast)

**Why It Matters**: Users need to know you launched.

**How to Verify**:
1. Send test email to yourself
2. Preview social posts
3. Have someone else review messaging

---

## Post-Launch Day 1 Priorities

1. Monitor Sentry for errors
2. Monitor Stripe for failed payments
3. Check Supabase for high query load
4. Respond to support emails within 4 hours
5. Track signup numbers and conversion rates

