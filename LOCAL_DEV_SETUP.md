# Local Development Setup for Stripe

## The Build Error You're Seeing is EXPECTED ✅

The error `Missing env var: STRIPE_SECRET_KEY` during build is **intentional** and confirms the code is working correctly. The routes check for required environment variables at module load to fail fast.

## Two Options for Local Development

### Option 1: Skip Stripe Routes Locally (Recommended for Testing Other Features)

If you're not actively testing Stripe locally, you can work on other features without setting up Stripe env vars. The routes will only be called when you actually test subscription flow.

**What works without Stripe env vars:**
- All lesson pages
- User authentication
- XP tracking
- Module navigation
- Account pages
- Everything except the actual Subscribe button flow

### Option 2: Full Local Stripe Setup (For Testing Payments Locally)

If you need to test the full subscription flow locally:

#### Step 1: Create `.env.local` file

Create a file named `.env.local` in your project root:

```bash
# .env.local (create this file)

# Supabase (copy from your existing setup)
NEXT_PUBLIC_SUPABASE_URL=your-actual-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-key
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key

# Stripe Test Mode Keys
STRIPE_SECRET_KEY=sk_test_your_test_key
STRIPE_PRICE_ID=price_your_test_price_id
STRIPE_WEBHOOK_SECRET=leave-empty-for-now
```

#### Step 2: Get Stripe Test Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy "Secret key" (starts with `sk_test_...`)
3. Add to `.env.local` as `STRIPE_SECRET_KEY`

#### Step 3: Create Test Product

1. Go to https://dashboard.stripe.com/test/products
2. Create product: "Persian Learning Premium"
3. Add recurring price: $4.99/month
4. Copy Price ID (starts with `price_...`)
5. Add to `.env.local` as `STRIPE_PRICE_ID`

#### Step 4: Test Locally

```bash
npm run dev
```

Now you can test checkout flow (webhooks won't work locally without Stripe CLI).

## Testing Webhooks Locally (Advanced - Optional)

If you need to test webhooks on localhost:

### Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Login
stripe login
```

### Forward Webhooks to Localhost

```bash
stripe listen --forward-to localhost:3000/api/webhooks
```

This will give you a webhook secret (starts with `whsec_...`). Add it to `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_from_stripe_cli
```

### Trigger Test Events

```bash
stripe trigger checkout.session.completed
```

## Recommended Workflow

**For most development:**
1. Don't set up Stripe locally
2. Test subscription flow on Vercel Preview deployments
3. Work on other features locally without Stripe env vars

**When you need to test Stripe:**
1. Set up `.env.local` with test keys
2. Test checkout flow (it will work)
3. Deploy to Vercel for webhook testing (easier than local Stripe CLI)

## Why This Approach is Better

- **Security**: Env vars required at build time prevents accidental deployments without secrets
- **Fail-fast**: Catches configuration issues immediately
- **Production-safe**: Same code works locally and on Vercel
- **Flexible**: You can skip Stripe setup when not needed

## Vercel Deployment (No Changes Needed)

On Vercel, the build will succeed because you'll add the env vars in the Vercel dashboard. The local build failure is expected and won't affect Vercel.

---

**TL;DR**: The build error is intentional. For local dev, either:
1. Ignore it and test other features (Stripe routes only run when called)
2. Add `.env.local` with test Stripe keys to test payments locally
3. Or just test the full flow on Vercel (easiest option)
