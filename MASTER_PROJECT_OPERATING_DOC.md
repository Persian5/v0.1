# Master Project Operating Document

**Learn Persian by Iranopedia**  
**Role:** Daily control center for launch execution  
**Last updated:** February 26, 2026

---

## What I Should Focus On Right Now

### Top 3 priorities

1. **Platform and production readiness**
   - Upgrade Next.js to patched 14.x (14.2.35+)
   - Stripe LIVE (live keys, webhook, price ID for $0.99 intro / $9.99 monthly)
   - Vercel envs + Supabase production URLs

2. **Legal and validation**
   - Add `/privacy` and `/terms`
   - Full golden-path smoke test on live app

3. **Optional pre-launch**
   - Footer subscribe button (wire or remove)
   - Noisy API logging in production

### Completed (as of Feb 26, 2026)

- Webhook missing-row behavior and metadata checks (`app/api/webhooks/route.ts`)
- `check-premium` returns 5xx on real failures (`app/api/check-premium/route.ts`)
- `CrashTestButton` dev-gated (`app/layout.tsx`)
- Leaderboard `debug_user_id` dev-gated (`app/api/leaderboard/route.ts`)
- Landing-page premium CTA routes to `/pricing` (`app/page.tsx`)
- Pricing page rebuilt: $0.99 first month / $9.99 monthly, no contradictory copy (`app/pricing/page.tsx`)
- Review game fixes (empty states, timeSpentMs, Matching Marathon, mobile layout)

### What is blocked

- Real payments are blocked until Stripe LIVE is set up (and Stripe price reflects $0.99 intro / $9.99 monthly).
- Real production validation is blocked until Vercel deploy + Supabase production URLs are correct.

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

1. Upgrade Next.js to 14.2.35+ (see `V0.1_LAUNCH_CHECKLIST.md`)
2. Set Stripe LIVE and production env vars (price: $0.99 intro / $9.99 monthly)
3. Verify Supabase production URLs and Vercel deploy
4. Add `/privacy` and `/terms`
5. Run the full golden-path smoke test on the live app

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

### What is still untrusted / remaining

- Production payment unlock path (until Stripe LIVE and smoke test)
- Next.js version (upgrade to 14.2.35+)
- Leaderboard service-role usage (documented risk, not yet changed)
- Dead footer subscribe button

### UX audit findings (Feb 26)

A full UX audit identified 14 new items (see `V0.1_LAUNCH_CHECKLIST.md` items 21-34). Key themes:

**Trust-damaging issues:**
- "FAQ" buttons go to `/pricing` instead of an FAQ (`SummaryView.tsx`, `account/page.tsx`)
- CompletionView shows total account XP instead of earned XP when `xpGained` is 0 (`CompletionView.tsx`)
- ~~Billing success fakes verification with a 2s timeout~~ **Resolved:** Now polls `/api/verify-checkout-session` for real verification (`billing/success/page.tsx`)
- Account page streak is fake (XP > 20 = "Active") and password change shows no success feedback (`account/page.tsx`)
- PersianWordRush claims speed increases but speed is constant (`PersianWordRush.tsx`)

**Consistency issues:**
- Branding fragmented: "Finglish", "Iranopedia", "Persian Learning Platform" across the app
- Route labels inconsistent: `/modules` is "Learn" / "Modules" / "Start Learning"; `/dashboard` is "Dashboard" / "Progress"
- Review games use hardcoded hex colors (`#10B981`, `#E63946`, `#FAF8F3`) instead of `primary`/`accent` tokens
- Border-radius, shadow, and button styling are ad hoc with no shared scale
- Emojis in billing success, leaderboard footer, PersianWordRush (violates project rules)

**Content issues:**
- Completion copy is static for every lesson ("You mastered these essential greetings!")
- SummaryView next-lesson copy is hardcoded
- Module chain in CompletionView is hardcoded (`module1` -> `module2` -> `module3` -> `module4`)
- Game load errors in LessonRunner award XP and advance instead of showing an error

None of these block launch, but they collectively weaken product trust. Quick wins (FAQ fix, XP display fix, speed claim removal) should be done before launch. Visual consistency work (review game colors, branding unification) can be done during the buffer day or immediately post-launch.

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

| Rank | Issue | File / Path | Status |
|---|---|---|---|
| 1 | Next.js security upgrade to 14.2.35+ | `package.json` | Not started |
| 2 | Stripe LIVE not set (incl. $0.99 intro / $9.99 monthly) | Stripe + Vercel | Not started |
| 3 | Vercel + Supabase production config not verified | Vercel + Supabase | Not started |
| 4 | Privacy and Terms pages | `/privacy`, `/terms` | Not started |
| 5 | Golden-path smoke test not run on live app | Live app | Not started |

**Resolved:** Webhook behavior, check-premium 5xx, CrashTestButton, debug_user_id, landing CTA, pricing page contradiction.

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

## Product Improvement Audit (Post-Launch)

High-impact product improvements that make the app feel more intelligent and differentiated, without a full redesign. Target: diaspora teens and kids.

### 1. Personalized review / weak-word loop

**Goal:** Make review feel targeted to what the learner actually missed or is weakest on.

**Current state:**
- `VocabularyTrackingService` stores every attempt (correct/incorrect) in `vocabulary_attempts` and `vocabulary_performance`
- `user_word_mastery` SQL view classifies words: mastered, hard, learning, unclassified
- `getHardWords()`, `getWeakWords()`, `getDashboardStats()` exist
- Review games accept `filter`: `all-learned`, `mastered`, `hard-words`
- Dashboard has `WordsNeedingPractice` and `HardWordsWidget` linking to `/review?filter=hard-words`

**What exists:** Full data pipeline. Hard-words filter works. Dashboard surfaces weak words.

**Minimal implementation:**
- Add a prominent "Practice Your Weak Words" CTA on dashboard when user has hard words (e.g. in `ResumeLearning` or a new card when `hardWords.length > 0`)
- Default review hub to "Words to Review" (hard-words) when user has them, instead of requiring filter modal
- Optional: Add "Recently missed" (words incorrect in last 24h) if easy to query

**Files:** `app/dashboard/page.tsx`, `app/components/dashboard/ResumeLearning.tsx`, `app/review/page.tsx`, `app/components/review/ReviewFilterModal.tsx`

**Effort:** Low

**Impact:** High — users feel the app knows what they struggle with.

---

### 2. Smarter end-of-lesson feedback

**Goal:** Replace generic completion messaging with feedback based on actual lesson performance.

**Current state:**
- `CompletionView` shows static copy: "INCREDIBLE JOB!", "You mastered these essential greetings!", "You're making incredible progress!"
- `VocabularyTrackingService.storeAttempt()` is called per step (correct/incorrect) but no session-level aggregation
- Lesson completion navigates to completion page; no session stats passed

**What exists:** Per-step attempt data in DB. No session-level correct/incorrect/retry count in memory at completion time.

**Minimal implementation:**
- Add session-level counters in `LessonRunner`: `sessionCorrect`, `sessionIncorrect`, `sessionRetries` (refs, reset on lesson load)
- Increment in `createVocabularyTracker` and `createStepXpHandler` (when `result.granted` vs not)
- Pass `{ correct, incorrect, totalSteps }` to completion route via URL params or context
- `CompletionView` (or completion page) reads params and picks 2–3 states:
  - Excellent: 0–1 incorrect, high accuracy → "Nailed it! You're ready for the next lesson."
  - Solid: 2–4 incorrect → "Great progress! A few words to review."
  - Needs review: 5+ incorrect or low accuracy → "Tough lesson! Practice these words in Review Games."
- Add contextual CTA: "Review weak words" when needs review, "Next lesson" when excellent

**Files:** `app/components/LessonRunner.tsx`, `components/lesson/CompletionView.tsx`, `app/modules/[moduleId]/[lessonId]/completion/page.tsx`

**Effort:** Medium

**Impact:** High — completion feels intelligent, not generic.

---

### 3. Diaspora-specific product personality

**Goal:** Make the app feel uniquely built for Persian diaspora teens and kids.

**Current state:**
- Generic copy: "Master your Persian skills", "You mastered these essential greetings!", "Great work! Keep learning."
- Onboarding has `learning_goal`: heritage, travel, family, academic, fun
- Curriculum has family module, Nowruz in module descriptions (Module 10)
- Leaderboard footer: "for the diaspora" (one mention)
- Vision doc emphasizes grandparents, family, Nowruz — not yet in product copy

**What exists:** Onboarding learning_goal. Curriculum content (family, food). No diaspora framing in UI copy.

**Minimal implementation:**
- Add diaspora microcopy in 5–8 high-visibility spots:
  - Dashboard greeting: "Ready to chat with family?" when learning_goal is family/heritage
  - CompletionView: "One step closer to talking with grandma" or "Your family will be impressed"
  - Module completion: "You can now talk to your grandparents about..."
  - Review hub: "Strengthen the words you'll use with family"
  - Frontier screen: "Keep your Finglish sharp until more lessons drop"
- Add 2–3 cultural references: Nowruz, Yalda, family dinners (in module descriptions or completion)
- Use `learning_goal` from profile to personalize 1–2 CTAs

**Files:** `app/dashboard/page.tsx`, `components/lesson/CompletionView.tsx`, `app/components/ModuleCompletion.tsx`, `app/review/page.tsx`, `lib/config/curriculum.ts` (module descriptions)

**Effort:** Low–Medium

**Impact:** Medium–High — strong differentiation, emotional connection for diaspora users.

---

### Rankings

| Criterion | Winner | Reason |
|-----------|--------|--------|
| **Fastest win** | Diaspora personality | Copy changes only, no new logic |
| **Biggest retention impact** | Personalized review | Targeted practice increases stickiness |
| **Best differentiation** | Diaspora personality | Competitors feel generic; this feels "for us" |

### Single best thing to implement next

**Diaspora-specific microcopy** — Fastest, highest differentiation, no new architecture. Add 5–8 diaspora framing phrases across dashboard, completion, review, and frontier. Use `learning_goal` where available.

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
