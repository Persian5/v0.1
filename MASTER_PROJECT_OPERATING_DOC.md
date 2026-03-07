# Master Project Operating Document

**Learn Persian by Iranopedia** -- Control center for v0.1 launch.

Last updated: February 25, 2026

---

## What I Should Focus On Right Now

### Top 3 priorities (in order)

1. **Fix the 5 critical code bugs** (items 1-5 in `V0.1_LAUNCH_CHECKLIST.md`)
   - These are small, targeted changes (most under 15 minutes each)
   - Start with: Module 3 `requiresPremium: true` in `lib/config/curriculum.ts`
   - Then: leaderboard personal data removal in `app/api/leaderboard/route.ts`
   - Full list and exact file/line references in the checklist

2. **Get Stripe LIVE + deploy to Vercel production**
   - Cannot launch without real payments and a live URL
   - Depends on critical fixes being done first (so the deploy is clean)

3. **Smoke test the golden path on the live URL**
   - Signup --> email verify --> Module 1 lesson --> complete --> dashboard --> paywall --> payment --> premium lesson
   - Fix only what breaks this path

### What is blocked

- Real payments: blocked until Stripe LIVE keys are set in Vercel
- Production testing: blocked until Vercel deploy is done
- Legal pages: blocked until you write minimal privacy/terms text (can be very short)

### What to ignore right now

- OAuth (Google/Apple sign-in)
- Analytics and tracking
- Feedback forms
- Subscription management page
- Cross-browser testing matrix
- Image compression
- Code refactoring / cleanup
- New features
- Normalizing paywall hook (`useModuleAccess`) -- works fine as-is for launch

### What must happen before launch

1. 5 critical code fixes
2. Stripe LIVE mode
3. Vercel production deploy with correct env vars
4. Supabase production URLs (site URL + redirect URLs)
5. Privacy policy + terms of service pages
6. One full smoke test pass on live URL

---

## Current Launch Goal

Ship v0.1: a working Persian learning app where users can sign up, complete Module 1 for free, pay $4.99/month for Modules 2+, and have their progress saved to their account. Review games work. Leaderboard works. No crashes on the golden path.

---

## App Status Summary

### Working
- Supabase auth (email/password, verification, sessions)
- Onboarding flow
- All lesson types and game components
- XP system (idempotent, Supabase-backed)
- Streak tracking
- Lesson progress and sequential unlocking
- Review games (4 modes) with vocabulary filters and daily XP cap
- Dashboard with stats widgets
- Leaderboard with rate limiting and caching
- Paywall system (ModuleAccessService + PremiumLockModal)
- Stripe checkout (sandbox)
- Mobile responsive layouts
- Content: Module 1 (4 lessons), Module 2 (7 lessons), Module 3 (content exists)

### Must fix (5 critical items)
See `V0.1_LAUNCH_CHECKLIST.md` items 1-5.

### Not started
- Stripe LIVE mode
- Vercel production deploy
- Privacy/terms pages
- Production smoke test

---

## v0.1 Scope

### In scope
- Account-based golden path: signup --> learn --> pay --> continue
- Module 1 free, Module 2+ paid ($4.99/month)
- 4 review games
- Dashboard, leaderboard, streak
- Basic legal pages

### Out of scope
- OAuth, analytics, feedback forms, subscription management, email sequences, offline mode, advanced QA, performance optimization, new features

---

## 14-Day Sprint

See `LAUNCH_14DAY.md` for the full sequenced plan.

Summary:
- Days 1-3: Critical code fixes
- Days 4-5: Stripe LIVE + Vercel deploy
- Days 6-8: Smoke test in production
- Days 9-10: Legal pages + polish
- Days 11-12: Buffer for bugs
- Days 13-14: Launch

---

## Critical Blockers (5 items)

| # | Blocker | File | Est. time |
|---|---------|------|-----------|
| 1 | Module 3 missing `requiresPremium` | `lib/config/curriculum.ts` | 5 min |
| 2 | Leaderboard exposes personal data + debug param | `app/api/leaderboard/route.ts` | 10 min |
| 3 | `sessionCache` null crash on lesson completion | `lib/services/lesson-progress-service.ts` | 15 min |
| 4 | Webhook doesn't create missing subscription row | `app/api/webhooks/route.ts` | 30 min |
| 5 | Leaderboard uses service role key (bypasses RLS) | `app/api/leaderboard/route.ts` | 30 min |

---

## Architecture Summary

See `SYSTEM_ARCHITECTURE.md` for full details.

**Stack:** Next.js 14 + Supabase + Stripe + Vercel + Tailwind + shadcn/ui

**Data flow:** `curriculum.ts` --> Services --> React Components --> Supabase

**Key principle:** All content in `curriculum.ts`, all logic in services, all storage in Supabase. No hardcoded paths, no direct localStorage for business data.

---

## Development Rules & Guardrails

See `DEVELOPMENT_RULES.md` for full rules.

**Top safety rules:**
- Never change auth or payment logic without explicit approval
- Never expose service role key or Stripe secret key to client
- Never hardcode lesson paths
- All data through service layer
- All content in `curriculum.ts`
- During incidents: no refactors, no new features, no migrations

**Rollback:** Vercel Deployments > Previous deployment > Promote to Production

---

## Key File Map

| Area | Files |
|------|-------|
| Content | `lib/config/curriculum.ts` |
| Auth | `components/auth/AuthProvider.tsx`, `AuthModal.tsx`, `AuthGuard.tsx`, `lib/services/smart-auth-service.ts` |
| Payments | `app/api/checkout/route.ts`, `app/api/webhooks/route.ts`, `lib/utils/subscription.ts` |
| Paywall | `lib/services/module-access-service.ts`, `app/api/check-module-access/route.ts`, `components/PremiumLockModal.tsx` |
| Lessons | `app/components/LessonRunner.tsx`, `app/components/games/*.tsx` |
| Review | `app/review/page.tsx`, `app/components/review/*.tsx` |
| Dashboard | `app/dashboard/page.tsx`, `app/components/dashboard/*.tsx` |
| Leaderboard | `app/api/leaderboard/route.ts`, `app/leaderboard/page.tsx` |
| XP | `lib/services/xp-service.ts` |
| Progress | `lib/services/lesson-progress-service.ts` |
| Database | `database_schema.md`, `rls_policies.md`, `supabase/migrations/` |
| Config | `ENV_VARS_REQUIRED.md`, `vercel.json`, `.env.example` |

---

## Environment & Deployment

See `ENV_VARS_REQUIRED.md` for the full list.

**Production deploy steps:**
1. Set env vars in Vercel (Supabase URL/keys, Stripe live keys, webhook secret)
2. Set Supabase Site URL and Redirect URLs to production domain
3. Create Stripe live webhook pointing to `https://yourdomain.com/api/webhooks`
4. Push to main branch (Vercel auto-deploys)
5. Verify build, then smoke test

**Verification after deploy:**
- No test keys (`sk_test_`, `whsec_test_`) in production env vars
- `?debug_user_id=xxx` returns nothing on leaderboard API
- Free user cannot access Module 2 or 3
- Stripe checkout creates `user_subscriptions` row

---

## Pre-Launch Smoke Tests

**Critical path (must pass):**
1. Homepage loads
2. Signup with email + password works
3. Email verification completes
4. Module 1 Lesson 1 loads and can be completed
5. XP appears on dashboard
6. Module 2 shows paywall for free user
7. Module 3 shows paywall for free user
8. Stripe checkout completes (live)
9. Premium user can access Module 2
10. Log out and log back in: progress persists
11. Review games load and award XP

---

## What Was Archived and Why

All archived files are in `_archive/docs/`. Nothing was lost. Useful information from every file was extracted into the active docs before archiving.

| Archived file/folder | Why archived | What was rescued |
|----------------------|-------------|-----------------|
| `FINAL_ROUTE_TO_LAUNCH.md` | July 7 launch plan; date is 10 months past | Must-fix items (items 1-5 in checklist), smoke test list |
| `FUTURE_PROMPTS.md` | Prompt templates and checklists | Safety warnings added to DEVELOPMENT_RULES.md, rollback procedure in this doc, pre-release checklist in LAUNCH_14DAY.md |
| `ENGINEERING_AUDIT/` (6 files) | Detailed code audit | 13 prioritized issues; critical/high items added to V0.1_LAUNCH_CHECKLIST.md |
| `LAUNCH_AUDIT/` (8 files) | Pre-launch audit | "Ready" confirmations (in checklist), dangers (in checklist), smoke tests (in this doc + LAUNCH_14DAY.md), config steps (in this doc) |
| `planning/` (4 files) | Inception-phase vision and discovery docs | No new action items; purely historical context |
| `aidlc-docs/` (12 files) | AIDLC inception planning (epics, units, user stories) | No new action items; purely historical context |

**Also deleted (permanently):**
- `public/.DS_Store` (macOS metadata)
- `check_review_xp_analysis.sql` (one-off SQL script)
- `public/placeholder.jpg`, `placeholder-user.jpg`, `placeholder-logo.png` (unused placeholders)
- `public/tehran.png`, `worldmap.png`, `tehran-silhouette.svg`, `carpet-border.svg`, `girih-tile.svg` (unused cultural assets, not referenced in code)
- `public/icons/nowruz.svg`, `pistachio.svg`, `teacup.svg` (unused icons)
- `tests/` (empty directory)

---

## Active Documents

### Daily operating docs (check these regularly)
| Doc | Purpose |
|-----|---------|
| `MASTER_PROJECT_OPERATING_DOC.md` | This file. Control center. Start here. |
| `V0.1_LAUNCH_CHECKLIST.md` | Single source of truth for what's done, what's broken, what's deferred |
| `LAUNCH_14DAY.md` | Day-by-day sprint plan with dependencies |

### Reference docs (consult when needed)
| Doc | Purpose |
|-----|---------|
| `DEVELOPMENT_RULES.md` | Coding standards and safety rules |
| `SYSTEM_ARCHITECTURE.md` | Architecture, services, file organization |
| `database_schema.md` | Database schema |
| `rls_policies.md` | Row Level Security policies |
| `LOCAL_DEV_SETUP.md` | Local development setup |
| `ENV_VARS_REQUIRED.md` | Required environment variables |
| `README.md` | Repo readme |
