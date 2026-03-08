# 14-Day Launch Plan

**Goal:** Launch a trustworthy v0.1 that works for real users.  
**Principle:** Fix launch safety first, then trust/conversion issues, then deploy and validate.  
**Do not use this sprint for cleanup or refactors.**  
**Last updated:** February 26, 2026

---

## Completed (as of Feb 26, 2026)


- **Webhook missing-row behavior** — `app/api/webhooks/route.ts`: returns 500 when `supabase_user_id` missing on checkout; throws when no `user_subscriptions` row for subscription events.
- **check-premium** — `app/api/check-premium/route.ts`: returns 5xx on real backend failures instead of masking as `hasPremium: false`.
- **CrashTestButton** — `app/layout.tsx`: rendered only when `NODE_ENV === "development"`.
- **Leaderboard debug_user_id** — `app/api/leaderboard/route.ts`: used only when `NODE_ENV === "development"`.
- **Landing-page premium CTA** — `app/page.tsx`: "Get Full Access" now routes to `/pricing` via `handleGetFullAccess`.
- **Pricing page** — `app/pricing/page.tsx`: Full rebuild. New copy, pricing ($0.99 first month, then $9.99/month), trust bar, 4-question FAQ accordion, dual final CTA. No contradictory "everything is free" copy.
- **Review games** — Filter-specific empty states, Memory timeSpentMs fix, Matching Marathon duplicate-advance fix, mobile layout for 6+ pairs.
- **Billing success verification** — `app/billing/success/page.tsx`: polls `/api/verify-checkout-session` for real payment state; handles processing/verified/failed/timeout/invalid/unauthenticated; refreshes premium cache on success; emoji removed.

---

## Must Fix Before Launch

1. Next.js upgrade from `14.2.18` to patched `14.2.35+`
2. Set Stripe LIVE and production env vars
3. Verify Supabase production Site URL / Redirect URLs
4. Add privacy + terms pages
5. Run full golden-path smoke tests on the live app

## Should Fix Before Launch If Possible

1. Gate or remove noisy API-route logging in production
2. Fix footer subscribe button or remove it
3. Fix Module 1 story using untaught `khoshbakhtam`
4. Fix story-completion fire-and-forget save path
5. Fix XP exception-path rollback issue
6. Add LIMIT to leaderboard fallback query

### UX quick wins from Feb 26 audit (see `V0.1_LAUNCH_CHECKLIST.md` items 21-34)

7. Fix "FAQ" buttons to link to pricing page FAQ anchor or remove (`SummaryView.tsx`, `account/page.tsx`)
8. Fix CompletionView XP display: `xpGained ?? totalXp` -> `xpGained ?? 0` (`CompletionView.tsx`)
9. Remove PersianWordRush speed claim ("Speed increases as you progress") or implement it
10. Show password change success feedback on account page
11. Remove emojis from billing success, leaderboard footer, PersianWordRush
12. Unify branding to "Finglish" across all footers and metadata
13. Unify route labels: pick one name per route (Learn vs Modules, Dashboard vs Progress)

## After Launch / Ignore For Now

- OAuth
- Analytics expansion
- Subscription portal
- Cross-browser matrix
- Performance optimization
- Image compression
- Refactors and code cleanup
- New features
- Review game visual consistency (replace hardcoded hex colors with `primary`/`accent` tokens)
- ~~Fix billing success page to poll API instead of 2s timeout~~ Done
- Fix hardcoded module chain in CompletionView
- Fix static completion/summary copy to vary by lesson
- Fix LessonRunner game-load errors awarding XP

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

## Day 1 — Payment correctness (Done)

1. ~~Fix webhook missing-row behavior in `app/api/webhooks/route.ts`~~ Done
2. ~~Fix `check-premium` to return 5xx on real failures~~ Done
3. Verify checkout → webhook → `user_subscriptions` works in test mode

**Done when:** a new paying test user always gets a valid subscription row and premium access.

---

## Day 2 — Security blockers (Done)

1. ~~Gate `debug_user_id` behind development mode~~ Done
2. ~~Remove or dev-gate `CrashTestButton`~~ Done
3. Gate or remove noisy `console.log` calls in `app/api/leaderboard/route.ts` and `app/api/webhooks/route.ts`

**Done when:** production code has no intentional crash button and no debug data path.

---

## Day 3 — Platform security baseline

1. Upgrade Next.js to patched 14.x (`14.2.35+`)
2. Run `npm run build`
3. Run the app locally and verify auth, modules, lesson load, dashboard, paywall

**Done when:** app builds cleanly and the local golden path still works after the upgrade.

---

## Day 4 — Trust and conversion fixes (Done)

1. ~~Fix landing-page premium CTA so it goes to the correct pricing / payment path~~ Done (routes to `/pricing`)
2. ~~Fix pricing-page FAQ contradiction~~ Done (full pricing page rebuild; no contradictory copy)
3. Fix or remove the dead footer subscribe button
4. Add a real header/navigation to pricing if still missing
5. Fix "FAQ" buttons that go to `/pricing` instead of FAQ (`SummaryView.tsx`, `account/page.tsx`)
6. ~~Remove emojis from billing success~~ Done. Leaderboard footer and PersianWordRush remain.

**Done when:** top-of-funnel pages no longer make the product feel amateur or contradictory.

---

## Day 5 — Learning quality + UX quick wins

1. Fix Module 1 story using untaught `khoshbakhtam`
2. Verify stub modules (4-11) are not misleadingly exposed in the UI
3. If story completion is still fragile, fix the fire-and-forget save path
4. Fix CompletionView XP display (`xpGained ?? totalXp` -> `xpGained ?? 0`)
5. Remove PersianWordRush speed claim or implement speed scaling
6. Fix account page: show password change success feedback, fix fake streak data
7. Unify branding to "Finglish" across footers and metadata
8. Unify route labels (Learn/Modules -> one name, Dashboard/Progress -> one name)

**Done when:** the free learning path feels coherent, completion screens show correct data, and the app feels like one product.

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

## Post-Launch Product Improvements

After launch, prioritize these high-impact upgrades (see `MASTER_PROJECT_OPERATING_DOC.md` Product Improvement Audit and `V0.1_LAUNCH_CHECKLIST.md` items 35–40):

1. **Diaspora microcopy** (fastest, best differentiation) — Add 5–8 diaspora framing phrases: "Ready to chat with family?", "One step closer to talking with grandma", etc.
2. **Practice Your Weak Words** — Prominent dashboard CTA when user has hard words; default review to hard-words filter.
3. **Smarter lesson completion** — Session-level correct/incorrect tracking; vary completion copy by performance (excellent / solid / needs review).

---

## File Map for This Sprint

| Area | Files |
|------|-------|
| Payments | `app/api/checkout/route.ts`, `app/api/webhooks/route.ts`, `app/api/check-premium/route.ts`, `app/api/verify-checkout-session/route.ts`, `app/billing/success/page.tsx`, `lib/utils/subscription.ts` |
| Leaderboard security | `app/api/leaderboard/route.ts` |
| Root layout | `app/layout.tsx` |
| Landing / pricing trust | `app/page.tsx`, `app/pricing/page.tsx` |
| Curriculum / lesson quality | `lib/config/curriculum.ts`, `app/components/LessonRunner.tsx` |
| Production config | `ENV_VARS_REQUIRED.md`, Vercel dashboard, Supabase dashboard, Stripe dashboard |
