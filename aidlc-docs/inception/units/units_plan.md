# Units Plan - Iranopedia Persian Academy

**Date:** November 3, 2025  
**Role:** Software Architect  
**Reference:** `/aidlc-docs/inception/epics_and_user_stories.md`

---

## Overview

This document organizes the 52 user stories from the epics document into 7 implementable units. Each unit corresponds to one epic and groups related functionality, dependencies, and architectural decisions.

---

## Unit Structure

Each unit document contains:
1. **Unit Overview** - Purpose, scope, business value
2. **Related User Stories** - All stories from the epic with status updated to "Planned"
3. **Technical Architecture** - High-level design decisions
4. **Dependencies** - What this unit depends on and what depends on it
5. **Data Models** - Database tables and schemas
6. **API Endpoints** - If applicable
7. **Key Components** - React components, services, utilities
8. **Security Considerations** - Authentication, authorization, data protection
9. **Testing Strategy** - Unit tests, integration tests, E2E tests
10. **Implementation Notes** - Technical details, gotchas, best practices

---

## Units Mapping

| Unit ID | Unit Name | Epic | Stories | Story Points | Status |
|---------|-----------|------|---------|--------------|--------|
| **UNIT-001** | Authentication | EP-001 | 7 | 21 | Planned |
| **UNIT-002** | Lessons Engine | EP-002 | 11 | 55 | Planned |
| **UNIT-003** | XP & Progress Tracking | EP-003 | 9 | 34 | Planned |
| **UNIT-004** | Payments | EP-004 | 7 | 21 | Planned |
| **UNIT-005** | Leaderboard | EP-005 | 3 | 8 | Planned |
| **UNIT-006** | Dashboard | EP-006 | 7 | 21 | Planned |
| **UNIT-007** | Review Mode | EP-007 | 8 | 34 | Planned |

**Total:** 52 stories, 194 story points

---

## Unit Files

```
/aidlc-docs/inception/units/
├── units_plan.md (this file)
├── unit-auth.md
├── unit-lessons.md
├── unit-xp-progress.md
├── unit-payments.md
├── unit-leaderboard.md
├── unit-dashboard.md
└── unit-review-mode.md
```

---

## Implementation Order (Critical Path)

### Phase 1: Foundation (Weeks 1-2)
**Priority:** Critical - Nothing works without these

1. **UNIT-001: Authentication** (21 points)
   - User registration, login, logout
   - Session management
   - Account settings
   - **Deliverable:** Users can create accounts and log in

2. **UNIT-003: XP & Progress** (34 points)
   - XP award system (idempotent)
   - Progress tracking
   - Lesson status management
   - **Deliverable:** XP and progress work correctly

### Phase 2: Core Product (Weeks 3-5)
**Priority:** Critical - Primary value delivery

3. **UNIT-002: Lessons Engine** (55 points)
   - All 8 game types
   - Lesson navigation
   - Audio playback
   - Step completion
   - **Deliverable:** Users can complete lessons

### Phase 3: Monetization (Week 6)
**Priority:** Critical - Revenue generation

4. **UNIT-004: Payments** (21 points)
   - Stripe integration
   - Subscription tiers
   - Paywall enforcement
   - **Deliverable:** Users can purchase subscriptions

### Phase 4: Engagement (Weeks 7-8)
**Priority:** High - Retention and motivation

5. **UNIT-007: Review Mode** (34 points)
   - 4 review games
   - Daily XP cap
   - Vocabulary filtering
   - **Deliverable:** Users can practice unlimited vocabulary

6. **UNIT-006: Dashboard** (21 points)
   - User stats
   - Progress overview
   - Quick actions
   - **Deliverable:** Users see their progress at a glance

### Phase 5: Social (Week 9)
**Priority:** Medium - Social motivation

7. **UNIT-005: Leaderboard** (8 points)
   - Global top 100
   - User ranking
   - **Deliverable:** Users can compete on leaderboard

---

## Cross-Unit Dependencies

```
UNIT-001 (Auth)
  ├─> UNIT-003 (XP/Progress) - Requires user identity
  │     ├─> UNIT-002 (Lessons) - Requires progress tracking
  │     │     └─> UNIT-007 (Review Mode) - Requires completed lessons
  │     ├─> UNIT-006 (Dashboard) - Requires progress data
  │     └─> UNIT-005 (Leaderboard) - Requires XP data
  └─> UNIT-004 (Payments) - Requires user identity
        └─> UNIT-002 (Lessons) - Paywall enforcement
```

**Critical Path:** UNIT-001 → UNIT-003 → UNIT-002 → UNIT-007

**Parallel Tracks (can work simultaneously):**
- UNIT-004 (Payments) can start after UNIT-001
- UNIT-006 (Dashboard) can start after UNIT-003
- UNIT-005 (Leaderboard) can start after UNIT-003

---

## Technical Stack by Unit

### UNIT-001: Authentication
- **Frontend:** React components, forms, validation
- **Backend:** Supabase Auth
- **Services:** SmartAuthService, auth-service
- **Database:** `auth.users` (managed by Supabase), `user_profiles`
- **Security:** JWT tokens, RLS policies

### UNIT-002: Lessons Engine
- **Frontend:** LessonRunner, game components (8 types)
- **Backend:** Supabase for progress storage
- **Services:** LessonProgressService, VocabularyService, AudioService, WordBankService
- **Database:** `user_lesson_progress`, `vocabulary_attempts`
- **Assets:** Audio files (MP3), graphics

### UNIT-003: XP & Progress Tracking
- **Frontend:** XP display, progress bars, animations
- **Backend:** Supabase for XP transactions
- **Services:** XpService, LessonProgressService
- **Database:** `user_xp_transactions`, `user_lesson_progress`, `user_profiles.total_xp`
- **Gamification:** Streaks, levels, idempotent XP

### UNIT-004: Payments
- **Frontend:** Pricing page, modals
- **Backend:** Stripe API, webhook handling
- **Services:** ModuleAccessService
- **Database:** `user_subscriptions`
- **Security:** Webhook signature verification, server-side checks

### UNIT-005: Leaderboard
- **Frontend:** Leaderboard component, ranking display
- **Backend:** Supabase queries
- **Services:** None (direct database queries)
- **Database:** `user_profiles` (query by `total_xp`)
- **Performance:** Indexed queries, caching

### UNIT-006: Dashboard
- **Frontend:** Dashboard page, stats widgets
- **Backend:** Supabase for stats aggregation
- **Services:** VocabularyTrackingService
- **Database:** `user_profiles`, `vocabulary_performance`, `user_lesson_progress`
- **UI:** Cards, charts, quick actions

### UNIT-007: Review Mode
- **Frontend:** 4 review game components
- **Backend:** Supabase for tracking
- **Services:** ReviewSessionService, VocabularyTrackingService, WordBankService
- **Database:** `user_profiles` (review XP cap), `vocabulary_performance`, `vocabulary_attempts`
- **Gamification:** Daily XP cap (1000), lives system

---

## Shared Components & Services

### Shared Across All Units
- **Supabase Client:** Database connection
- **RLS Policies:** Row-level security
- **Error Handling:** Consistent error messages
- **Loading States:** Spinners, skeletons
- **Responsive Design:** Mobile + desktop

### Shared UI Components
- **Button** (shadcn/ui)
- **Card** (shadcn/ui)
- **Dialog/Modal** (shadcn/ui)
- **Progress Bar** (shadcn/ui)
- **Avatar** (shadcn/ui)
- **Badge** (shadcn/ui)

### Shared Services
- **Supabase Client:** `lib/supabase/client.ts`, `lib/supabase/server.ts`
- **Auth Service:** `lib/services/smart-auth-service.ts`
- **Error Logger:** Console logs (future: Sentry)
- **Analytics:** Vercel Analytics (future: PostHog)

---

## Data Model Overview

### Core Tables
1. **`user_profiles`** (UNIT-001, 003, 005, 006)
   - User identity, XP, display name, timezone
   - Used by: Auth, XP, Leaderboard, Dashboard

2. **`user_subscriptions`** (UNIT-004)
   - Stripe subscription data
   - Used by: Payments, Lessons (paywall)

3. **`user_xp_transactions`** (UNIT-003)
   - XP award history (idempotent)
   - Used by: XP tracking, audit trail

4. **`user_lesson_progress`** (UNIT-002, 003, 006)
   - Lesson completion status
   - Used by: Lessons, Progress, Dashboard

5. **`vocabulary_performance`** (UNIT-002, 006, 007)
   - Per-word mastery tracking
   - Used by: Lessons, Dashboard, Review Mode

6. **`vocabulary_attempts`** (UNIT-002, 007)
   - Per-word attempt history
   - Used by: Lessons, Review Mode (analytics)

### Relationships
- `user_profiles.id` → Foreign key in all user-specific tables
- `user_lesson_progress.user_id` → `user_profiles.id`
- `user_xp_transactions.user_id` → `user_profiles.id`
- `vocabulary_performance.user_id` → `user_profiles.id`

---

## Security Considerations by Unit

### UNIT-001: Authentication
- Password hashing (handled by Supabase)
- JWT token security
- Email verification
- HTTPS only

### UNIT-002: Lessons Engine
- RLS: Users can only access their own progress
- Input validation (word bank answers)
- Audio file access control (public for now)

### UNIT-003: XP & Progress
- Idempotent XP awards (prevent double-awarding)
- Server-side XP validation
- RLS on XP transactions

### UNIT-004: Payments
- Webhook signature verification (critical!)
- Server-side premium checks (not client-side)
- Stripe keys server-only (never exposed to client)
- RLS on subscriptions

### UNIT-005: Leaderboard
- Only show public profile data
- No sensitive information exposed
- RLS on user profiles

### UNIT-006: Dashboard
- RLS: Users see only their own stats
- Aggregated data calculated server-side

### UNIT-007: Review Mode
- RLS: Users see only their vocabulary data
- Daily XP cap enforced server-side

---

## Performance Considerations

### UNIT-001: Authentication
- Session caching (JWT tokens)
- Minimize auth checks (cache results)

### UNIT-002: Lessons Engine
- Audio preloading
- Component memoization (React.memo)
- Lazy loading of game components

### UNIT-003: XP & Progress
- XP transaction batching (future)
- Progress calculation caching
- Optimistic UI updates

### UNIT-004: Payments
- Webhook processing (async, don't block UI)
- Premium status caching

### UNIT-005: Leaderboard
- Database index on `total_xp`
- Query top 100 only (limit results)
- Caching (refresh every 5-10 minutes)

### UNIT-006: Dashboard
- Aggregate queries (not N+1)
- Stats caching (refresh on page load)

### UNIT-007: Review Mode
- Word bank caching (LRU cache, 100 entries)
- Vocabulary filtering server-side

---

## Testing Strategy by Unit

### UNIT-001: Authentication
- **Unit:** Form validation, password requirements
- **Integration:** Supabase Auth API
- **E2E:** Signup → login → logout flow

### UNIT-002: Lessons Engine
- **Unit:** WordBankService (already has tests)
- **Integration:** Game logic, answer validation
- **E2E:** Complete full lesson flow

### UNIT-003: XP & Progress
- **Unit:** XP calculation, idempotency
- **Integration:** XP award → database update
- **E2E:** Earn XP → see header update

### UNIT-004: Payments
- **Unit:** Premium check logic
- **Integration:** Stripe API, webhook processing
- **E2E:** Purchase subscription → access premium content

### UNIT-005: Leaderboard
- **Unit:** Ranking calculation
- **Integration:** Database query performance
- **E2E:** View leaderboard, see own rank

### UNIT-006: Dashboard
- **Unit:** Stats calculation (words learned, mastered)
- **Integration:** Dashboard widgets
- **E2E:** Complete lesson → see stats update

### UNIT-007: Review Mode
- **Unit:** Daily XP cap logic
- **Integration:** Review games, vocabulary tracking
- **E2E:** Play all 4 games, hit XP cap

---

## Implementation Guidelines

### Code Organization
```
/app/
  components/       # React components
    games/         # UNIT-002 game components
    review/        # UNIT-007 review components
  modules/         # UNIT-002 lesson pages
  account/         # UNIT-001 account pages
  review/          # UNIT-007 review pages
  pricing/         # UNIT-004 pricing page
  api/             # UNIT-004 Stripe routes

/components/
  auth/            # UNIT-001 auth components
  ui/              # Shared UI components

/lib/
  services/        # All business logic services
  supabase/        # Database clients
  types.ts         # TypeScript interfaces
  utils/           # Shared utilities

/hooks/            # Custom React hooks
```

### Naming Conventions
- **Components:** PascalCase (e.g., `LessonRunner`, `AudioMeaning`)
- **Services:** PascalCase class (e.g., `XpService`, `LessonProgressService`)
- **Hooks:** camelCase with `use` prefix (e.g., `useSmartXp`, `useProgress`)
- **Files:** kebab-case (e.g., `xp-service.ts`, `lesson-runner.tsx`)
- **Database tables:** snake_case (e.g., `user_profiles`, `user_xp_transactions`)

### TypeScript Standards
- Strict mode enabled
- No `any` types (use `unknown` and type guards)
- Interfaces over types (consistency)
- Explicit return types on functions

### React Patterns
- Functional components only (no classes)
- Hooks for state management
- Props drilling minimized (use context for global state)
- Memoization for expensive calculations (useMemo, useCallback)

### Database Patterns
- RLS policies on ALL tables
- Server-side queries for security-sensitive operations
- Client-side queries for read-only data
- Idempotent operations (unique constraints, upserts)

---

## Risk Mitigation

### UNIT-001: Authentication
**Risk:** Email deliverability issues  
**Mitigation:** Test thoroughly, use Resend with proper SPF/DKIM

### UNIT-002: Lessons Engine
**Risk:** Audio playback failures  
**Mitigation:** Fallback messages, error handling, format testing

### UNIT-003: XP & Progress
**Risk:** XP double-awarding due to race conditions  
**Mitigation:** Database idempotency constraints, stepUid system

### UNIT-004: Payments
**Risk:** Webhook failures or duplicates  
**Mitigation:** Signature verification, idempotent operations, retries

### UNIT-005: Leaderboard
**Risk:** Performance degradation with many users  
**Mitigation:** Indexed queries, caching, limit results

### UNIT-006: Dashboard
**Risk:** Slow queries with large datasets  
**Mitigation:** Aggregated queries, database indexes, caching

### UNIT-007: Review Mode
**Risk:** Daily XP cap bypassed  
**Mitigation:** Server-side enforcement, timezone handling

---

## Deployment Checklist by Unit

### UNIT-001: Authentication
- [ ] Supabase Auth configured
- [ ] Email templates created (Resend)
- [ ] RLS policies enabled
- [ ] Session timeout configured

### UNIT-002: Lessons Engine
- [ ] Audio files uploaded to /public/audio/
- [ ] Curriculum data finalized
- [ ] All game types tested
- [ ] Mobile responsive verified

### UNIT-003: XP & Progress
- [ ] XP transactions table created
- [ ] Idempotency constraints applied
- [ ] Progress tracking tested end-to-end

### UNIT-004: Payments
- [ ] Stripe LIVE keys configured (currently sandbox)
- [ ] Webhook endpoint registered with Stripe
- [ ] Premium access checks tested
- [ ] Legal docs complete (Privacy Policy, Terms)

### UNIT-005: Leaderboard
- [ ] Database indexes on total_xp
- [ ] Leaderboard UI tested with 100+ users

### UNIT-006: Dashboard
- [ ] All stats calculations tested
- [ ] Dashboard widgets responsive
- [ ] Data refreshes correctly

### UNIT-007: Review Mode
- [ ] All 4 games tested
- [ ] Daily XP cap enforced
- [ ] Timezone handling verified

---

## Success Criteria

Each unit is considered complete when:
1. ✅ All user stories implemented with acceptance criteria met
2. ✅ Unit tests passing (where applicable)
3. ✅ Integration tests passing
4. ✅ Manual testing completed
5. ✅ Code reviewed
6. ✅ Documentation updated
7. ✅ Deployed to production
8. ✅ Monitored for errors (first 24 hours)

---

## Next Steps

1. ✅ Create units plan (this document)
2. ⏳ Create individual unit files (7 files)
3. ⏳ Review and validate with stakeholder
4. ⏳ Begin implementation (follow critical path)
5. ⏳ Track progress and update status

---

**End of Units Plan**




