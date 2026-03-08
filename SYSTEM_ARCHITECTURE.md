# System Architecture

**Reference document.** For daily priorities, see `MASTER_PROJECT_OPERATING_DOC.md`.

---

## Data Flow

```
curriculum.ts (content) --> Services (business logic) --> React Components (UI) --> Supabase (persistence)
```

1. **Content:** All lessons, vocabulary, and structure in `lib/config/curriculum.ts`
2. **Services:** Business logic in `lib/services/*.ts` (static methods, error handling, Supabase calls)
3. **Components:** React components consume data via props and service calls
4. **Storage:** Supabase (primary), localStorage (XP cache, animation timestamps only)
5. **Routing:** Dynamic navigation based on user progress via `LessonProgressService`

---

## Services

| Service | File | Purpose |
|---------|------|---------|
| SmartAuthService | `lib/services/smart-auth-service.ts` | Cached auth state, session management, XP cache, progress cache |
| LessonProgressService | `lib/services/lesson-progress-service.ts` | Lesson completion, sequential access, navigation (getFirstAvailableLesson, getNextSequentialLesson) |
| XpService | `lib/services/xp-service.ts` | XP awards (idempotent via stepUid v2), formatting, level calculation |
| ModuleAccessService | `lib/services/module-access-service.ts` | Premium/prerequisite checks for module access |
| VocabularyTrackingService | `lib/services/vocabulary-tracking-service.ts` | Word mastery, SRS scheduling, remediation, hard words |
| VocabularyProgressService | `lib/services/vocabulary-progress-service.ts` | Practice vocabulary from completed lessons |
| ReviewSessionService | `lib/services/review-session-service.ts` | Review game vocabulary, daily XP cap (1000), timezone management |
| WordBankService | `lib/services/word-bank-service.ts` | Distractor generation for games (wrong answers that look plausible) |
| DailyGoalService | `lib/services/daily-goal-service.ts` | Daily XP goal tracking |
| GrammarService | `lib/services/grammar-service.ts` | Grammar form resolution for vocabulary |
| OnboardingService | `lib/services/onboarding-service.ts` | Onboarding preferences |
| AuthService | `lib/services/auth-service.ts` | Low-level auth helpers |
| DatabaseService | `lib/supabase/database.ts` | Direct Supabase queries (used by other services) |

---

## Authentication (Active)

- **Provider:** Supabase Auth (email/password)
- **Session:** Managed by `SmartAuthService` with client-side caching
- **Protection:** `AuthGuard` component wraps protected routes; `LessonRouteGuard` wraps completion/summary routes
- **Email verification:** Required before accessing lessons; auto-polling detection
- **OAuth:** Not implemented (deferred)

---

## Payments (Active)

- **Provider:** Stripe (currently sandbox; LIVE setup is a launch blocker)
- **Model:** Beta: $0.99 first month, then $9.99/month. Module 1 free; Full Access unlocks Modules 2–11.
- **Flow:** `/api/checkout` creates Stripe Checkout session --> Stripe hosted page --> `/api/webhooks` handles events --> `user_subscriptions` table updated
- **Access check:** `ModuleAccessService.canAccessModule()` (server) and `/api/check-module-access` (API) check `requiresPremium` flag + `user_subscriptions` table
- **UI:** `PremiumLockModal` shown when access denied

---

## Lesson System

**Step types:** `welcome`, `flashcard`, `quiz`, `input`, `matching`, `audio-meaning`, `audio-sequence`, `text-sequence`, `grammar-fill-blank`, `grammar-concept`, `story-conversation`, `final`

**Flow:** `LessonRunner.tsx` orchestrates steps sequentially. Each step type has a game component in `app/components/games/`. Steps are defined in `curriculum.ts` per lesson.

**Extensibility:** Add new step type by: (1) define type in `lib/types.ts`, (2) create game component, (3) add case in `LessonRunner`, (4) use in curriculum.

---

## Review System

- **Hub:** `/review` -- shows available games, checks vocabulary availability
- **Games:** Memory, Audio Definitions, Matching Marathon, Word Rush (each under `/review/[gameId]`)
- **Vocabulary source:** `ReviewSessionService.getVocabularyForFilter()` --> `VocabularyTrackingService` --> `vocabulary_performance` table
- **Filters:** `all-learned`, `mastered`, `hard-words`
- **XP:** 1 XP per correct answer, 1000/day cap, timezone-aware reset

---

## Database

See `database_schema.md` for full schema and `rls_policies.md` for RLS policies.

**Key tables:** `user_profiles`, `user_lesson_progress`, `user_xp_transactions`, `vocabulary_performance`, `vocabulary_attempts`, `user_subscriptions`

**Key RPCs:** `award_xp_unified()`, `update_streak()`

---

## File Organization

```
app/
  page.tsx                          # Landing page
  layout.tsx                        # Root layout (SmartAuthProvider, ConditionalHeader)
  dashboard/page.tsx                # User dashboard
  leaderboard/page.tsx              # Full leaderboard
  modules/page.tsx                  # Module list
  modules/[moduleId]/page.tsx       # Module detail (lesson list)
  modules/[moduleId]/[lessonId]/
    page.tsx                        # Lesson page (LessonRunner)
    completion/page.tsx             # Post-lesson completion
    summary/page.tsx                # Lesson summary
  review/
    page.tsx                        # Review hub
    layout.tsx                      # Shared review layout
    audio-definitions/page.tsx      # Game routes
    memory-game/page.tsx
    matching-marathon/page.tsx
    word-rush/page.tsx
  billing/                          # Payment success/cancel pages
  api/
    checkout/route.ts               # Stripe checkout session
    webhooks/route.ts               # Stripe webhook handler
    check-premium/route.ts          # Premium status check
    check-module-access/route.ts    # Module access check
    leaderboard/route.ts            # Leaderboard data
    dashboard/route.ts              # Dashboard stats
    streak/route.ts                 # Streak data
    level/route.ts                  # Level data
  components/
    LessonRunner.tsx                # Core lesson orchestration
    games/*.tsx                     # Game components
    review/*.tsx                    # Review game wrappers
    dashboard/*.tsx                 # Dashboard widgets

components/
  auth/                             # AuthProvider, AuthModal, AuthGuard
  ui/                               # shadcn/ui components
  routes/LessonRouteGuard.tsx       # Route protection
  PremiumLockModal.tsx              # Paywall modal
  lesson/CompletionView.tsx         # Lesson completion
  onboarding/OnboardingModal.tsx    # Onboarding flow
  errors/                           # Error boundaries
  layout/                           # ConditionalHeader, AppHeader

lib/
  config/
    curriculum.ts                   # ALL lesson content (single source of truth)
    curriculum-helpers.ts           # Step builder helpers
    semantic-groups.ts              # Vocabulary semantic groupings
  services/*.ts                     # All business logic (see Services table above)
  supabase/
    client.ts                       # Supabase client
    database.ts                     # DatabaseService
  utils/                            # Helpers (subscription, rate-limit, greeting, etc.)
  types.ts                          # TypeScript interfaces
  curriculum/helpers/               # Per-step-type curriculum helpers

hooks/                              # React hooks (useLevel, useStreak, useDailyGoal, etc.)
supabase/migrations/                # Database migrations (NEVER delete)
```
