# CONFIG AND ENVIRONMENT VARIABLES

## Environment Variable Inventory

### Client-Side Safe (NEXT_PUBLIC_)

| Variable | Where Read | Safe for Client | Purpose |
|----------|-----------|-----------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase/client.ts:4`, `lib/supabase/server.ts:8` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `lib/supabase/client.ts:5`, `lib/supabase/server.ts:9` | Yes | Supabase anonymous key (RLS enforced) |

### Server-Side Only (Private)

| Variable | Where Read | Safe for Client | Purpose |
|----------|-----------|-----------------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | `app/api/webhooks/route.ts:14`, `app/api/leaderboard/route.ts:133` | **NO - DANGER** | Bypasses RLS for admin operations |
| `STRIPE_SECRET_KEY` | `app/api/checkout/route.ts:12`, `app/api/webhooks/route.ts:11` | **NO - DANGER** | Stripe API access |
| `STRIPE_WEBHOOK_SECRET` | `app/api/webhooks/route.ts:12` | **NO - DANGER** | Webhook signature verification |
| `STRIPE_PRICE_ID` | `app/api/checkout/route.ts:13` | NO | Subscription price ID |

---

## Validation on Startup

### Checkout Route (`app/api/checkout/route.ts`)
```typescript
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
```
**Behavior**: Throws at module load. Fails fast during build.

### Webhooks Route (`app/api/webhooks/route.ts`)
```typescript
const must = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

for (const k of must) {
  if (!process.env[k]) throw new Error(`Missing env var: ${k}`);
}
```
**Behavior**: Throws at module load. Fails fast during build.

### Supabase Client (`lib/supabase/client.ts`)
```typescript
if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}
```
**Behavior**: Throws at module load. Client app crashes immediately if missing.

### Supabase Server (`lib/supabase/server.ts`)
```typescript
if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}
```
**Behavior**: Throws at module load. Server routes crash if missing.

---

## Missing Env Var Failure Modes

| Missing Variable | Failure Point | User Impact |
|------------------|---------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Build time | App won't build |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Build time | App won't build |
| `SUPABASE_SERVICE_ROLE_KEY` | Build time | Webhook route crashes |
| `STRIPE_SECRET_KEY` | Build time | Checkout/webhook routes crash |
| `STRIPE_WEBHOOK_SECRET` | Build time | Webhook route crashes |
| `STRIPE_PRICE_ID` | Build time | Checkout route crashes |

**Good**: All critical env vars are validated at build time, not runtime.

---

## Required Production Settings

### Vercel Configuration

```
Environment Variables (Production only):
- NEXT_PUBLIC_SUPABASE_URL = https://xxxx.supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ... (public key)
- SUPABASE_SERVICE_ROLE_KEY = eyJ... (secret - never expose)
- STRIPE_SECRET_KEY = sk_live_... (secret - never expose)
- STRIPE_WEBHOOK_SECRET = whsec_... (secret - never expose)
- STRIPE_PRICE_ID = price_... (can be public but keep private)
```

**Checklist**:
- [ ] All env vars set in Vercel Production environment
- [ ] No test keys (`sk_test_`, `whsec_test_`) in production
- [ ] Preview/Development environments have test keys only
- [ ] Environment variables NOT committed to git

---

### Supabase Configuration

**Dashboard Settings**:
- [ ] Email templates customized (verification, password reset)
- [ ] Site URL set to production domain
- [ ] Redirect URLs include production domain
- [ ] RLS enabled on all tables (verified)
- [ ] Service role key NOT exposed in client code

**Database**:
- [ ] All migrations applied
- [ ] Indexes created for performance
- [ ] Point-in-Time Recovery enabled (Pro plan)

---

### Stripe Configuration

**Dashboard Settings**:
- [ ] Live mode enabled
- [ ] Product and Price created for subscription
- [ ] Webhook endpoint created for production URL
- [ ] Webhook events selected:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- [ ] Customer portal configured (for self-service cancellation)

---

## Security Headers (`next.config.mjs`)

Current configuration is production-ready:

```javascript
headers: [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: '...' }
]
```

**CSP Sources Allowed**:
- Scripts: `self`, `unsafe-inline`, `unsafe-eval`, Vercel Analytics, Stripe
- Styles: `self`, `unsafe-inline`
- Images: `self`, `data:`, `https:`, `blob:`
- Connections: `self`, Supabase, Stripe, Vercel Analytics
- Frames: `self`, Stripe

**Note**: `unsafe-inline` and `unsafe-eval` are required for Next.js hydration and Tailwind.

---

## Vercel Configuration (`vercel.json`)

```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "outputDirectory": ".next"
}
```

**Current Status**: Basic configuration. No special rewrites or redirects needed.

---

## Local Development Setup

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
STRIPE_PRICE_ID=price_test_...
```

**Testing Webhooks Locally**:
```bash
# Install Stripe CLI
stripe login

# Forward webhooks to localhost
stripe listen --forward-to localhost:3000/api/webhooks

# This outputs a webhook secret (whsec_...) - use for local testing
```

---

## Environment Isolation Matrix

| Variable | Local Dev | Preview | Production |
|----------|-----------|---------|------------|
| Supabase URL | Test project | Test project | Prod project |
| Supabase Anon Key | Test project | Test project | Prod project |
| Service Role Key | Test project | Test project | Prod project |
| Stripe Secret | `sk_test_` | `sk_test_` | `sk_live_` |
| Stripe Webhook | `whsec_test_` | `whsec_test_` | `whsec_live_` |
| Price ID | Test price | Test price | Live price |

**Critical**: Never use `sk_live_` keys in non-production environments. This could process real payments during testing.

