# 14-Day Launch Plan

**Goal:** Launch a trustworthy v0.1 that works for real users.  
**Principle:** Fix launch safety first, then trust/conversion issues, then deploy and validate.  
**Do not use this sprint for cleanup or refactors.**

---

## Must Fix Before Launch

1. Webhook missing-row behavior in `app/api/webhooks/route.ts`
2. `check-premium` returning false on backend failure in `app/api/check-premium/route.ts`
3. Next.js upgrade from `14.2.18` to patched `14.2.35+`
4. Remove or dev-gate `CrashTestButton` in `app/layout.tsx`
5. Gate leaderboard `debug_user_id` behind development mode
6. Set Stripe LIVE and production env vars
7. Verify Supabase production Site URL / Redirect URLs
8. Fix landing-page premium CTA
9. Fix pricing-page contradiction
10. Add privacy + terms pages
11. Run full golden-path smoke tests on the live app

## Should Fix Before Launch If Possible

1. Gate or remove noisy API-route logging in production
2. Fix footer subscribe button or remove it
3. Fix Module 1 story using untaught `khoshbakhtam`
4. Fix story-completion fire-and-forget save path
5. Fix XP exception-path rollback issue
6. Add LIMIT to leaderboard fallback query

## After Launch / Ignore For Now

- OAuth
- Analytics expansion
- Subscription portal
- Cross-browser matrix
- Performance optimization
- Image compression
- Refactors and code cleanup
- New features

---

## Dependency Order

```
Payment correctness + security blockers
        ↓
Trust / conversion fixes
        ↓
Production config (Stripe + Vercel + Supabase)
        ↓
Live smoke tests
        ↓
Legal pages + launch buffer
        ↓
Launch
```

---

## Day 1 — Payment correctness

1. Fix webhook missing-row behavior in `app/api/webhooks/route.ts`
2. Fix `check-premium` to return 5xx on real failures
3. Verify checkout → webhook → `user_subscriptions` works in test mode

**Done when:** a new paying test user always gets a valid subscription row and premium access.

---

## Day 2 — Security blockers

1. Gate `debug_user_id` behind development mode
2. Remove or dev-gate `CrashTestButton`
3. Gate or remove noisy `console.log` calls in `app/api/leaderboard/route.ts` and `app/api/webhooks/route.ts`

**Done when:** production code has no intentional crash button and no debug data path.

---

## Day 3 — Platform security baseline

1. Upgrade Next.js to patched 14.x (`14.2.35+`)
2. Run `npm run build`
3. Run the app locally and verify auth, modules, lesson load, dashboard, paywall

**Done when:** app builds cleanly and the local golden path still works after the upgrade.

---

## Day 4 — Trust and conversion fixes

1. Fix landing-page premium CTA so it goes to the correct pricing / payment path
2. Fix pricing-page FAQ contradiction (remove “everything is free”)
3. Fix or remove the dead footer subscribe button
4. Add a real header/navigation to pricing if still missing

**Done when:** top-of-funnel pages no longer make the product feel amateur or contradictory.

---

## Day 5 — Learning quality fixes that matter before launch

1. Fix Module 1 story using untaught `khoshbakhtam`
2. Verify stub modules (4-11) are not misleadingly exposed in the UI
3. If story completion is still fragile, fix the fire-and-forget save path

**Done when:** the free learning path feels coherent and does not preview material incorrectly.

---

## Day 6 — Stripe LIVE

1. Create live product / price in Stripe
2. Create live webhook endpoint
3. Add live keys and webhook secret to Vercel
4. Verify checkout session creation still works

**Done when:** the production app can accept real payment configuration.

---

## Day 7 — Production config

1. Verify Vercel env vars
2. Verify Supabase Site URL and Redirect URLs
3. Verify production domain / `*.vercel.app` auth redirects
4. Deploy to production

**Done when:** the live app can sign up, log in, and hit the pricing/payment path correctly.

---

## Day 8 — Free-user smoke tests on live app

Test the full free path:
1. Homepage loads
2. Sign up
3. Email verify
4. Complete onboarding
5. Open Module 1
6. Complete a lesson
7. Dashboard shows XP / streak / progress
8. Module 2 paywall appears
9. Module 3 paywall appears

Fix anything that breaks this path before moving on.

---

## Day 9 — Paid-user smoke tests on live app

1. Start from pricing / premium CTA
2. Complete Stripe checkout
3. Verify `user_subscriptions` row
4. Verify premium access unlocks
5. Complete a premium lesson
6. Log out / log back in and confirm premium remains

Fix anything that breaks payment trust or unlock behavior.

---

## Day 10 — Review / dashboard / return-user smoke tests

1. Open review mode
2. Play each review game at least once
3. Verify XP updates correctly
4. Verify dashboard values still make sense
5. Verify returning-user flow: log back in, continue learning, resume progress

---

## Day 11 — Legal minimum

1. Create `/privacy`
2. Create `/terms`
3. Link both where needed
4. Verify pages are reachable from the live site

---

## Day 12 — Buffer for real bugs only

Use this day only for:
- launch blockers
- trust / conversion problems
- premium unlock problems
- golden-path breakage

Do **not** use this day for cleanup.

---

## Day 13 — Final validation

1. Re-run the complete golden path
2. Re-run payment path
3. Re-run return-user path
4. Check production logs
5. Make final go / no-go call

---

## Day 14 — Launch

1. Announce to waitlist
2. Monitor Vercel + Supabase + Stripe for the first 24 hours
3. Respond only to real production issues
4. Do not ship new features

---

## File Map for This Sprint

| Area | Files |
|------|-------|
| Payments | `app/api/checkout/route.ts`, `app/api/webhooks/route.ts`, `app/api/check-premium/route.ts`, `lib/utils/subscription.ts` |
| Leaderboard security | `app/api/leaderboard/route.ts` |
| Root layout | `app/layout.tsx` |
| Landing / pricing trust | `app/page.tsx`, `app/pricing/page.tsx` |
| Curriculum / lesson quality | `lib/config/curriculum.ts`, `app/components/LessonRunner.tsx` |
| Production config | `ENV_VARS_REQUIRED.md`, Vercel dashboard, Supabase dashboard, Stripe dashboard |
