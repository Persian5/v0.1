# Master Project Operating Document

**Learn Persian by Iranopedia**  
**Role:** Daily control center for launch execution  
**Last updated:** February 25, 2026

---

## What I Should Focus On Right Now

### Top 3 priorities

1. **Fix payment / premium-access correctness**
   - Webhook missing-row behavior
   - `check-premium` error semantics
   - `debug_user_id` production exposure

2. **Fix trust-destroying production issues**
   - Upgrade Next.js to a patched 14.x
   - Remove or dev-gate `CrashTestButton`
   - Fix landing-page premium CTA and pricing-page contradiction

3. **Get production-ready and validate the golden path**
   - Stripe LIVE
   - Vercel envs + Supabase URLs
   - Full smoke test on live app

### What is blocked

- Real payments are blocked until Stripe LIVE is set up.
- Real production validation is blocked until Vercel deploy + Supabase production URLs are correct.
- Launch trust is blocked until pricing / CTA contradictions are fixed.

### What to ignore right now

- OAuth
- Analytics expansion
- Feedback systems
- Customer portal
- Cross-browser matrix
- Big refactors
- New features
- Image optimization
- Dead-code cleanup that does not touch launch safety

### What must happen before launch

1. Fix the 4 critical technical blockers in `V0.1_LAUNCH_CHECKLIST.md`
2. Fix the 5 high-priority trust/security issues in `V0.1_LAUNCH_CHECKLIST.md`
3. Set Stripe LIVE and production env vars
4. Verify Supabase production URLs
5. Add `/privacy` and `/terms`
6. Run the full golden-path smoke test on the live app

---

## Current Launch Truth

### What this app actually is right now

A real account-based Persian learning app with:
- working auth
- real saved progress / XP / streaks
- working free Module 1 and premium modules behind a paywall
- 4 review games
- dashboard + leaderboard
- Stripe sandbox payments

### What is still untrusted

- production payment unlock path
- production premium-check semantics on backend failure
- production security posture (Next.js version, debug path, service-role usage)
- top-of-funnel trust/conversion flow (landing CTA, pricing contradiction, dead subscribe button)

---

## Current Launch Goal

Ship v0.1 where a real user can:
1. land on the site,
2. understand the value,
3. sign up,
4. complete free Module 1,
5. hit a clear premium gate,
6. pay successfully,
7. unlock premium content,
8. return later and keep their progress.

---

## Current Priority Blockers

| Rank | Issue | File / Path | Launch effect |
|---|---|---|---|
| 1 | Webhook missing-row behavior | `app/api/webhooks/route.ts` | Paid user can remain locked out |
| 2 | `check-premium` hides real failures | `app/api/check-premium/route.ts` | Valid premium user can be denied |
| 3 | Next.js security upgrade | `package.json` | Production security risk |
| 4 | `CrashTestButton` in production layout | `app/layout.tsx` | Preventable production crash risk |
| 5 | `debug_user_id` in production | `app/api/leaderboard/route.ts` | Privacy / trust risk |
| 6 | Landing premium CTA goes to `/modules` | `app/page.tsx` | Weakens conversion |
| 7 | Pricing page says everything is free | `app/pricing/page.tsx` | Trust / conversion damage |
| 8 | Stripe LIVE not set | Stripe + Vercel | No real launch |
| 9 | Vercel + Supabase production config not verified | Vercel + Supabase | Launch path may break in prod |
| 10 | Golden-path smoke test not run on live app | Live app | Launch risk unknown |

---

## What Was Archived and Why

Archived files are in `_archive/docs/`.

- Old launch docs were archived because their timelines and scope were stale.
- Audit docs were archived because their useful findings were moved into the active checklist.
- Inception / planning docs were archived because they were no longer daily operating documents.

Nothing disappeared randomly. Useful launch-critical information was pulled into:
- `V0.1_LAUNCH_CHECKLIST.md`
- `LAUNCH_14DAY.md`
- `MASTER_PROJECT_OPERATING_DOC.md`

---

## Active Documents

### Daily operating docs
- `MASTER_PROJECT_OPERATING_DOC.md`
- `V0.1_LAUNCH_CHECKLIST.md`
- `LAUNCH_14DAY.md`

### Reference docs
- `DEVELOPMENT_RULES.md`
- `SYSTEM_ARCHITECTURE.md`
- `database_schema.md`
- `rls_policies.md`
- `LOCAL_DEV_SETUP.md`
- `ENV_VARS_REQUIRED.md`
- `README.md`
