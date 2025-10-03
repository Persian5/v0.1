# Required Environment Variables for Stripe Integration

Add these to Vercel Project Settings → Environment Variables (both Production and Preview):

## Already Set (Confirm in Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## NEW - Must Add for Stripe

### STRIPE_SECRET_KEY
- **Type**: Server-only secret
- **Value**: `sk_test_...` (test mode) or `sk_live_...` (production)
- **Where to find**: Stripe Dashboard → Developers → API Keys
- **Never** prefix with `NEXT_PUBLIC_`

### STRIPE_PRICE_ID
- **Type**: Server-only secret
- **Value**: `price_...` (recurring monthly price ID)
- **Where to find**: Stripe Dashboard → Products → [Your Product] → Pricing → Price ID
- **Must be**: A recurring subscription price (not one-time payment)

### STRIPE_WEBHOOK_SECRET
- **Type**: Server-only secret
- **Value**: `whsec_...`
- **Where to find**: Stripe Dashboard → Developers → Webhooks → [Your Endpoint] → Signing Secret
- **When to add**: After creating webhook endpoint (see STRIPE_SETUP_GUIDE.md)
- **Leave blank initially**, fill after webhook creation

## Important Notes

1. **After adding env vars to Vercel, you MUST redeploy** for changes to take effect
2. **Never commit** these values to git
3. **Test mode first**: Use `sk_test_` keys for initial testing
4. **Production**: Switch to `sk_live_` keys only after successful testing
5. **Webhook secret is different** for test vs live mode - update accordingly

## Verification Checklist

- [ ] All three Supabase vars set and working
- [ ] STRIPE_SECRET_KEY added (starts with sk_test_ or sk_live_)
- [ ] STRIPE_PRICE_ID added (starts with price_)
- [ ] STRIPE_WEBHOOK_SECRET added after webhook creation (starts with whsec_)
- [ ] Redeployed Vercel after adding new vars
- [ ] Build passes without "Missing env var" errors
