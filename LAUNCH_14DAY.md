# 14-Day Launch Sprint

**Start date:** When you're back "all in" (after March 7)
**Goal:** Ship a non-broken v0.1 where real users can sign up, learn, and pay.

---

## Dependency chain

```
Critical code fixes (items 1-5)
       |
       v
Stripe LIVE + Vercel production deploy + Supabase URLs
       |
       v
Smoke test golden path in production
       |
       v
Legal pages (privacy, terms)
       |
       v
Launch
```

Everything below follows this chain. Do not skip ahead.

---

## Days 1-3: Critical code fixes

These 5 items block everything. Each is a small, targeted change.

**Day 1:**

1. **Module 3 paywall bypass** (5 min)
   - File: `lib/config/curriculum.ts` (~line 1847)
   - Action: Add `requiresPremium: true` to Module 3 definition
   - Verify: Free user cannot open Module 3 lessons

2. **Leaderboard personal data** (10 min)
   - File: `app/api/leaderboard/route.ts`
   - Action: Delete lines 291-311 (hardcoded `881a4bff` UUID and `Armee E.` name)
   - Action: Wrap lines 251-289 (`debug_user_id` block) in `if (process.env.NODE_ENV === 'development')`
   - Verify: `?debug_user_id=xxx` returns nothing in production

3. **sessionCache null crash** (15 min)
   - File: `lib/services/lesson-progress-service.ts` (line 228)
   - Action: Replace `SmartAuthService['sessionCache']!.progress = ...` with null-safe pattern using `SmartAuthService.getSessionState()` + `SmartAuthService.updateUserData()`
   - Verify: Complete a lesson without crash

**Day 2:**

4. **Webhook subscription creation** (30 min)
   - File: `app/api/webhooks/route.ts` (lines 135-148)
   - Action: When `user_subscriptions` row is missing, create it (upsert) instead of returning early
   - Verify: New user pays via Stripe checkout, `user_subscriptions` row exists after webhook

5. **Leaderboard service role key** (30 min)
   - File: `app/api/leaderboard/route.ts` (line 130)
   - Action: Add RLS policy allowing public read of `display_name` + `total_xp` on `user_profiles`, switch to anon key
   - Verify: Leaderboard loads, no PII exposed beyond display name + XP

**Day 3:**

6. **Run `npm run build`** and fix any build errors
7. **Run the app locally** and walk through: signup → email verify → Module 1 Lesson 1 → complete → dashboard → try Module 2 (paywall) → try Module 3 (paywall) → review games

---

## Days 4-5: Stripe LIVE + production deploy

**Day 4: Stripe LIVE**

1. In Stripe dashboard: switch to live mode
2. Create production webhook endpoint: `https://yourdomain.com/api/webhooks`
3. Subscribe to events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy live keys: `sk_live_...`, `whsec_...`
5. Create live price ($4.99/month) and copy `price_...` ID

**Day 5: Vercel production deploy**

1. In Vercel: connect GitHub repo (if not done), set root directory
2. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY` (live)
   - `STRIPE_PRICE_ID` (live)
   - `STRIPE_WEBHOOK_SECRET` (live)
3. In Supabase dashboard: set Site URL to production domain, add production domain to Redirect URLs
4. Deploy and verify build succeeds

---

## Days 6-8: Smoke test in production

Walk through every critical path on the live URL. Fix only what blocks the golden path.

**Test 1: Free user flow**
- Land on homepage
- Sign up with email/password
- Verify email
- Complete onboarding
- Open Module 1, complete Lesson 1
- Check XP on dashboard
- Try Module 2 → paywall modal appears
- Try Module 3 → paywall modal appears

**Test 2: Payment flow**
- Click "Upgrade" / pricing
- Complete Stripe checkout (use a real card, refund after)
- Verify `user_subscriptions` row in Supabase
- Open Module 2 → access granted
- Complete a premium lesson

**Test 3: Review games**
- Open /review
- Play one game with "all learned" filter
- Verify XP is awarded

**Test 4: Returning user**
- Log out
- Log back in
- Progress, XP, streak still visible
- "Continue learning" goes to correct lesson

---

## Days 9-10: Legal pages + polish

1. Create `/privacy` page (minimal privacy policy)
2. Create `/terms` page (minimal terms of service)
3. Link from footer and signup flow
4. Fix any bugs found during smoke tests

---

## Days 11-12: Buffer

Reserved for:
- Fixing bugs from smoke tests
- Any critical issue that surfaced
- Final UI polish on golden path only

---

## Days 13-14: Launch

1. Final smoke test pass
2. Switch to custom domain (if ready)
3. Announce to waitlist
4. Monitor Vercel logs + Supabase for 24 hours

---

## What is NOT in this sprint

- OAuth (Google/Apple)
- Analytics beyond Vercel Analytics
- Feedback forms
- Subscription management page
- Cross-browser QA matrix
- Image compression
- Performance profiling
- Code cleanup / refactoring
- New features

---

## File reference

| Area | Key files |
|------|-----------|
| Curriculum content | `lib/config/curriculum.ts` |
| Paywall / access | `lib/services/module-access-service.ts`, `app/api/check-module-access/route.ts`, `components/PremiumLockModal.tsx` |
| Module pages | `app/modules/page.tsx`, `app/modules/[moduleId]/page.tsx`, `app/modules/[moduleId]/[lessonId]/page.tsx` |
| Review hub + games | `app/review/page.tsx`, `app/components/review/Review*.tsx`, `app/components/games/PersianWordRush.tsx` |
| Auth | `components/auth/AuthProvider.tsx`, `components/auth/AuthModal.tsx`, `lib/services/smart-auth-service.ts` |
| Stripe | `app/api/checkout/route.ts`, `app/api/webhooks/route.ts`, `app/api/check-premium/route.ts`, `lib/utils/subscription.ts` |
| Leaderboard | `app/api/leaderboard/route.ts`, `app/leaderboard/page.tsx` |
| Dashboard | `app/dashboard/page.tsx`, `app/components/dashboard/*.tsx` |
