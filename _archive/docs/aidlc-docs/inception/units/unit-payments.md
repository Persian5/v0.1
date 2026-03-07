# UNIT-004: Payments

**Status:** Planned  
**Epic:** EP-004  
**Story Points:** 21  
**Priority:** Critical - Primary revenue stream

---

## Unit Overview

### Purpose
Enable subscription-based monetization through Stripe integration, allowing users to purchase premium access and unlock Modules 2-10.

### Scope
- Pricing page with 3 tiers (Basic, Pro, Family)
- Stripe Checkout integration
- Webhook handling for subscription events
- Premium access checks (server-side)
- Payment success/cancel pages
- Module paywall modal

### Business Value
- **Primary revenue stream** - converts free users to paying customers
- Target: $3-5k MRR in first 12 months
- Freemium model proven by Duolingo ($500M revenue)
- Affordable pricing ($4.99-25.99) vs. tutors ($30-60/hour)

### Out of Scope (V1)
- Subscription management page (cancel, update billing)
- Receipt/billing history
- Stripe Customer Portal integration
- Annual subscription options (future)

---

## Related User Stories

### US-028: Pricing Page
**Status:** Planned → Implemented  
**Priority:** Critical  
**Story Points:** 3

**Acceptance Criteria:**
1. Display 3 tiers: Free ($0), Basic ($4.99), Pro ($14.99), Family ($25.99)
2. Each tier shows: Price, feature list, "Choose Plan" button
3. Free tier highlights "Currently Selected" if on free plan
4. Optional comparison table
5. FAQ section (cancel, refunds, switch plans)
6. Social proof (testimonials if available)
7. CTA: "Start Free" or "Upgrade Now"
8. Mobile responsive

**Implementation:**
- Page: `app/pricing/page.tsx`
- Components: shadcn/ui Card components
- Links to Stripe Checkout via `/api/checkout`

---

### US-029: Stripe Checkout Integration
**Status:** Planned → Implemented  
**Priority:** Critical  
**Story Points:** 5

**Acceptance Criteria:**
1. Clicking "Choose Plan" redirects to Stripe Checkout
2. Passes correct price ID for selected tier
3. Pre-fills user email
4. Metadata includes `supabase_user_id`
5. Stripe Checkout: Secure (HTTPS), accepts cards, shows subscription details
6. On success: Redirect to `/billing/success`
7. On cancel: Redirect to `/billing/canceled`
8. Test mode (sandbox) for development
9. Live mode ready for production

**Implementation:**
- API Route: `app/api/checkout/route.ts`
- Stripe SDK: `stripe` npm package
- Environment vars: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`

---

### US-030: Webhook Handling
**Status:** Planned → Implemented  
**Priority:** Critical  
**Story Points:** 5

**Acceptance Criteria:**
1. Webhook endpoint: `/api/webhooks`
2. Verify signature using `STRIPE_WEBHOOK_SECRET`
3. Handle events:
   - `checkout.session.completed`: Create subscription
   - `customer.subscription.updated`: Update status
   - `customer.subscription.deleted`: Cancel subscription
4. On `checkout.session.completed`:
   - Extract `supabase_user_id` from metadata
   - Upsert `user_subscriptions` table
5. Idempotent operations (handle duplicate webhooks)
6. Return 200 OK on success, 400/500 on errors
7. Log all webhook events

**Implementation:**
- API Route: `app/api/webhooks/route.ts`
- Stripe webhook signature verification
- Supabase Service Role Key for database writes

---

### US-031: Premium Access Checks
**Status:** Planned → Implemented  
**Priority:** Critical  
**Story Points:** 3

**Acceptance Criteria:**
1. Function: `hasPremiumAccess(user_id)`
2. Returns true if: Active subscription + period not ended
3. Returns false otherwise
4. Premium checks performed: Server-side, on module access, on lesson access
5. If user lacks access: Redirect or show paywall modal
6. Module 1 always accessible
7. Cache premium status

**Implementation:**
- Utility: `lib/utils/subscription.ts`
- Function: `hasPremiumAccess()`, `getSubscriptionDetails()`
- Service: `ModuleAccessService.hasAccess()`
- Query: `SELECT * FROM user_subscriptions WHERE user_id = X AND status = 'active'`

---

### US-032: Payment Success Page
**Status:** Planned → Implemented  
**Priority:** High  
**Story Points:** 2

**Acceptance Criteria:**
1. Success page displays: "Welcome to Premium!", success icon, subscription details
2. CTA: "Start Learning" (Module 2 or dashboard)
3. Verify subscription is active
4. If not active: Show processing, auto-refresh
5. Email confirmation sent
6. Mobile responsive

**Implementation:**
- Page: `app/billing/success/page.tsx`
- Checks subscription status from database

---

### US-033: Payment Cancelled Page
**Status:** Planned → Implemented  
**Priority:** High  
**Story Points:** 1

**Acceptance Criteria:**
1. Display: "Payment was cancelled", "No charges made"
2. CTA: "Try Again" (pricing page), "Continue with Free" (Module 1)
3. No subscription created
4. Mobile responsive

**Implementation:**
- Page: `app/billing/canceled/page.tsx`

---

### US-034: Module Paywall Modal
**Status:** Planned → Implemented  
**Priority:** High  
**Story Points:** 3

**Acceptance Criteria:**
1. Modal triggered when free user clicks locked module
2. Display: Lock icon, "Premium Content", benefits list, pricing
3. Buttons: "Upgrade Now" (pricing), "Maybe Later" (close)
4. Modal overlay dims background
5. Clicking outside or "X" closes modal
6. "Upgrade Now" redirects to pricing with pre-selected tier
7. Mobile responsive (full-screen on small screens)

**Implementation:**
- Component: `components/PremiumLockModal.tsx`
- Triggered from module overview or lesson pages

---

## Technical Architecture

### API Routes
```
/app/api/
  checkout/
    route.ts        # Create Stripe Checkout session
  webhooks/
    route.ts        # Handle Stripe webhook events
  check-premium/
    route.ts        # Check premium access (optional)
  check-module-access/
    route.ts        # Check module access
```

### Components
```
/app/
  pricing/
    page.tsx        # Pricing page
  billing/
    success/page.tsx  # Success page
    canceled/page.tsx # Cancel page

/components/
  PremiumLockModal.tsx  # Paywall modal
  SubscribeButton.tsx   # Subscribe button
```

### Utilities
```
/lib/utils/
  subscription.ts   # Premium access checks
```

### Services
```
/lib/services/
  module-access-service.ts  # Module unlocking logic
```

---

## Data Models

### `user_subscriptions`
```sql
CREATE TABLE user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_type text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'free',
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  cancellation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_subscriptions_customer 
ON user_subscriptions(stripe_customer_id);
```

---

## Dependencies

### Depends On
- **UNIT-001 (Auth):** Requires user identity
- **Stripe:** Third-party payment processor
- **Vercel:** Hosting for webhook endpoint

### Depended On By
- **UNIT-002 (Lessons):** Paywall enforcement on premium lessons
- **UNIT-006 (Dashboard):** May display subscription status

---

## Security Considerations

### Webhook Security
- Signature verification (CRITICAL!)
- Only process events with valid signature
- Protects against fake webhook attacks

### Premium Access
- Server-side checks only (not client-side)
- RLS policies on `user_subscriptions`
- Cannot bypass paywall by manipulating client

### Stripe Keys
- Server-only (never exposed to client)
- Different keys for test and live modes
- Stored in Vercel environment variables

---

## Testing Strategy

### Unit Tests
- Premium check logic (active vs. inactive)
- Subscription status calculation

### Integration Tests
- Stripe Checkout session creation
- Webhook processing (mock webhooks)
- Database upserts (idempotency)

### E2E Tests
1. **Happy Path:**
   - Free user clicks Module 2 → Sees paywall
   - Clicks "Upgrade" → Stripe Checkout
   - Enters test card → Payment success
   - Redirects to success page
   - Can now access Module 2

2. **Cancel Flow:**
   - Start checkout → Cancel → Redirects to canceled page
   - No subscription created

3. **Subscription Update:**
   - Stripe sends `subscription.updated` webhook
   - Database updates correctly

---

## Implementation Notes

### Current Status
- ✅ Stripe integration complete (sandbox mode)
- ✅ Webhook handling implemented
- ✅ Premium checks functional
- ✅ Pricing page complete
- ✅ Success/cancel pages complete
- ⚠️ Stripe LIVE mode not yet configured (launch blocker)

### Remaining Work
1. **Stripe LIVE Setup (4 hours):**
   - Switch to live Stripe keys
   - Create live product and price
   - Register live webhook endpoint
   - Test with real card

2. **Legal Docs (3 hours):**
   - Privacy Policy (required)
   - Terms of Service (required)
   - Refund Policy (required)

**Total: ~7 hours**

---

## Success Criteria

UNIT-004 is complete when:
1. ✅ Users can purchase subscriptions
2. ✅ Stripe webhooks process correctly
3. ✅ Premium access checks work
4. ✅ Paywall enforced on Module 2+
5. ✅ Success/cancel flows work
6. ✅ LIVE mode configured and tested
7. ✅ Legal docs complete

---

**End of UNIT-004: Payments**
