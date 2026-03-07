# UNIT-003: XP & Progress Tracking

**Status:** Planned  
**Epic:** EP-003  
**Story Points:** 34  
**Priority:** Critical - Core gamification system

---

## Unit Overview

### Purpose
Provide motivating gamification mechanics through experience points (XP), progress visualization, streaks, and leveling to drive engagement and retention.

### Scope
- Idempotent XP award system with stepUid
- XP display and animations
- Progress bars and lesson status
- Module progression and unlocking
- Daily streak tracking
- Level system based on total XP
- Achievement badges (future)

### Business Value
- Increases engagement through gamification
- Motivates daily usage (streaks)
- Provides sense of progress and accomplishment
- Differentiates from boring traditional learning tools
- Drives retention and completion rates

### Out of Scope (V1)
- Achievement badges - Deferred to V2
- Custom study goals - Future feature
- Social sharing of progress - Future feature

---

## Related User Stories

### US-019: XP Award System (Idempotent)
**Status:** Planned → Implemented  
**Priority:** Critical  
**Story Points:** 5

**As a** learner  
**I want** to earn XP for completing steps and lessons  
**So that** I feel rewarded for my progress and stay motivated

**Acceptance Criteria:**
1. XP awarded for: Correct answers (2-10 points), lesson bonuses, review games (1 point, capped)
2. XP awards are idempotent:
   - Use `stepUid` format: `v2-moduleId-lessonId-gameType-stepIndex`
   - Already-answered questions don't re-award XP
   - Store in `user_xp_transactions` with `idempotency_key`
3. XP transaction includes: user_id, amount, source, lesson_id, idempotency_key, metadata
4. Update `user_profiles.total_xp` on award
5. Handle race conditions
6. Rollback on errors
7. Log all XP transactions

**Implementation:**
- Service: `XpService.awardStepXp(userId, stepUid, points, source, metadata)`
- Table: `user_xp_transactions`
- Constraint: UNIQUE(user_id, idempotency_key)
- UID Version: v2 (includes gameType for uniqueness)

**Technical Notes:**
- StepUid format ensures uniqueness across all game types
- Database constraint enforces idempotency
- Optimistic UI updates via `useSmartXp` hook

---

### US-020: XP Display in Header
**Status:** Planned → Implemented  
**Priority:** High  
**Story Points:** 2

**As a** learner  
**I want** to see my current XP in the header  
**So that** I always know my progress

**Acceptance Criteria:**
1. XP count displayed in app header (top-right)
2. Format: Number with icon (e.g., "127 XP" with star)
3. Updates in real-time when XP awarded
4. Clicking XP opens dashboard/profile
5. On XP award: CountUp animation, green flash
6. Mobile responsive (smaller on mobile)
7. Handles large numbers (1,000+ formatted)

**Implementation:**
- Component: `LessonHeader.tsx`
- Hook: `useSmartXp()` for real-time updates
- Animation: `CountUpXP.tsx` component

---

### US-021: XP Animation on Award
**Status:** Planned → Implemented  
**Priority:** Medium  
**Story Points:** 3

**As a** learner  
**I want** to see celebration animation when I earn XP  
**So that** I feel immediate satisfaction

**Acceptance Criteria:**
1. On XP award: "+X XP" text floats upward with fade
2. Header XP counts up smoothly
3. Optional confetti for large awards (>10 points)
4. Animation duration: 1-2 seconds
5. Can proceed before animation completes
6. Animations work on mobile
7. Already-completed steps show XP but no animation

**Implementation:**
- Component: `CountUpXP.tsx`
- Library: Framer Motion for animations
- Confetti: canvas-confetti library

---

### US-022: Progress Bars and Percentages
**Status:** Planned → Implemented  
**Priority:** High  
**Story Points:** 3

**As a** learner  
**I want** to see progress bars  
**So that** I know how far I've progressed

**Acceptance Criteria:**
1. Progress bar during lesson (top of screen, fixed)
2. Progress bar on module overview (per lesson)
3. Calculation: (completed steps / total steps) * 100
4. Visual: Thin bar (4-6px), green fill, gray remaining
5. Percentage text on hover (e.g., "67% complete")
6. Module overview shows overall module progress + individual lesson progress
7. Progress persists in database
8. Mobile responsive

**Implementation:**
- Component: shadcn/ui `Progress` component
- Hook: `useProgress()` for real-time updates
- Storage: `user_lesson_progress.progress_percent`

---

### US-023: Lesson Status (Locked, Available, In-Progress, Completed)
**Status:** Planned → Implemented  
**Priority:** Critical  
**Story Points:** 5

**As a** learner  
**I want** lesson statuses to clearly indicate what I can do  
**So that** I understand my learning path

**Acceptance Criteria:**
1. Lesson status types:
   - **Locked:** Gray with lock icon
   - **Available:** Bright/highlighted, "Start" button
   - **In-Progress:** Partial progress bar, "Continue" button
   - **Completed:** Green checkmark, "Review" button
2. Status calculation:
   - Locked if previous lessons incomplete
   - Available if unlocked and progress = 0%
   - In-Progress if 0% < progress < 100%
   - Completed if progress = 100%
3. Visual distinction clear
4. Clicking locked shows tooltip
5. Status updates in real-time
6. Module 1 Lesson 1 always available
7. Status persists in `user_lesson_progress`

**Implementation:**
- Service: `LessonProgressService.getProgress()`
- Table: `user_lesson_progress.status`
- Component: Module overview page

---

### US-024: Module Progression and Unlocking
**Status:** Planned → Implemented  
**Priority:** High  
**Story Points:** 3

**As a** learner  
**I want** modules and lessons to unlock progressively  
**So that** I build skills in logical order

**Acceptance Criteria:**
1. Module unlocking:
   - Module 1: Always unlocked (free)
   - Module 2+: Requires premium subscription
2. Lesson unlocking:
   - First lesson in module: Unlocked if module unlocked
   - Subsequent: Unlocked when previous completed
3. Paywall for Module 2+ if not premium:
   - Lock icon
   - "Upgrade to Premium" modal
   - Links to pricing page
4. Premium users see all modules unlocked
5. Cannot skip ahead (sequential only)
6. Clear visual indication
7. Optional unlock celebration

**Implementation:**
- Service: `ModuleAccessService.hasAccess()`
- Service: `LessonProgressService.getFirstAvailableLesson()`
- Modal: `PremiumLockModal.tsx`

---

### US-025: Daily Streak Tracking
**Status:** Planned → Needs Implementation  
**Priority:** Medium  
**Story Points:** 5

**As a** learner  
**I want** to maintain a daily streak  
**So that** I'm motivated to practice every day

**Acceptance Criteria:**
1. Streak counter displayed on dashboard
2. Streak calculation:
   - Increment if user completes ≥1 lesson step today
   - Reset to 0 if user misses a day
   - Timezone-aware
3. Display: "🔥 7 days"
4. Visual celebration at milestones (7, 30, 100 days)
5. Streak freeze option (future)
6. Persists in database
7. Daily reminder (future)

**Implementation:**
- Table: `user_profiles` (add `streak_count`, `last_activity_date`)
- Service: New `StreakService` or extend `LessonProgressService`
- Calculation: Compare `last_activity_date` with `now()` (timezone-aware)

**Technical Notes:**
- Requires schema update (add streak fields to `user_profiles`)
- Timezone stored in `user_profiles.timezone`

---

### US-026: Level System
**Status:** Planned → Partially Implemented  
**Priority:** Low  
**Story Points:** 3

**As a** learner  
**I want** to level up as I earn XP  
**So that** I have long-term goals

**Acceptance Criteria:**
1. Level calculation based on total XP:
   - Level 1: 0-100 XP
   - Level 2: 101-250 XP
   - Level 3: 251-500 XP
   - Level 4: 501-1000 XP
   - Level 5+: +500 XP per level
2. Display current level on dashboard and profile
3. Progress bar to next level (e.g., "75 / 250 XP to Level 3")
4. Level-up animation when reaching new level
5. No gameplay unlocks tied to levels (cosmetic only)
6. Levels purely motivational

**Implementation:**
- Calculate level from `total_xp` (no separate field)
- Function: `calculateLevel(totalXp)` in utility
- Display on dashboard

**Technical Notes:**
- Levels are calculated, not stored
- Simple formula keeps it maintainable

---

### US-027: Achievement Badges (Future)
**Status:** Planned → Out-of-Scope (V2)  
**Priority:** Low  
**Story Points:** 8

**As a** learner  
**I want** to earn achievement badges  
**So that** I have collectibles and feel accomplished

**Acceptance Criteria:**
- Complete Module 1 badge
- 7-day streak badge
- 100 words learned badge
- 1000 XP earned badge
- First lesson completed badge

**Deferred to V2 due to time constraints**

---

## Technical Architecture

### Frontend Components

```
/app/components/
  LessonHeader.tsx              # XP display in header
  CountUpXP.tsx                 # XP animation component
  
/components/
  ui/
    progress.tsx                # Progress bar (shadcn/ui)
```

### Services

```
/lib/services/
  xp-service.ts                 # XP award and calculation
  lesson-progress-service.ts    # Progress tracking
  module-access-service.ts      # Module unlocking logic
```

### Hooks

```
/hooks/
  use-smart-xp.ts               # XP state with optimistic updates
  use-xp.ts                     # Legacy XP hook
  use-progress.ts               # Progress state
  use-smart-progress.ts         # Progress with caching
```

### Key Functions

**XpService:**
- `awardStepXp(userId, stepUid, points, source, metadata)` - Award XP idempotently
- `getUserTotalXp(userId)` - Get user's total XP
- `ensureXpCacheVersion()` - Clear cache on UID version change
- `calculateLevel(totalXp)` - Calculate level from XP

**LessonProgressService:**
- `getProgress(userId, moduleId, lessonId)` - Get lesson progress
- `markLessonCompleted(userId, moduleId, lessonId)` - Mark complete
- `getFirstAvailableLesson(userId)` - Find next lesson

---

## Data Models

### `user_xp_transactions`
```sql
CREATE TABLE user_xp_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  amount integer NOT NULL,
  source text NOT NULL,
  lesson_id text,
  metadata jsonb,
  idempotency_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, idempotency_key) WHERE idempotency_key IS NOT NULL
);

CREATE INDEX idx_xp_transactions_lookup 
ON user_xp_transactions(user_id, source, lesson_id);
```

### `user_lesson_progress`
```sql
CREATE TABLE user_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  module_id text NOT NULL,
  lesson_id text NOT NULL,
  status text NOT NULL DEFAULT 'locked',
  progress_percent integer NOT NULL DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id, lesson_id)
);
```

### `user_profiles` (XP tracking)
```sql
-- Existing fields
total_xp integer NOT NULL DEFAULT 0,

-- Future streak fields (US-025)
streak_count integer NOT NULL DEFAULT 0,
last_activity_date date,
```

---

## Dependencies

### Depends On
- **UNIT-001 (Auth):** Requires `user_id` for XP tracking
- **Curriculum Data:** Lesson structure for progress calculation

### Depended On By
- **UNIT-002 (Lessons):** Awards XP on step completion
- **UNIT-005 (Leaderboard):** Uses `total_xp` for rankings
- **UNIT-006 (Dashboard):** Displays XP, progress, streaks
- **UNIT-007 (Review Mode):** Awards XP with daily cap

**Critical Path Position:** Must be implemented before UNIT-002 (Lessons)

---

## Security Considerations

### XP Security
- Idempotency enforced via database UNIQUE constraint
- StepUid format prevents manipulation
- Server-side XP validation (not client-side)
- RLS policies on `user_xp_transactions`

### RLS Policies
```sql
-- Users can read their own XP transactions
CREATE POLICY "Users can read own XP"
ON user_xp_transactions FOR SELECT
USING (auth.uid() = user_id);

-- Only service can insert XP (via service role)
CREATE POLICY "Service can insert XP"
ON user_xp_transactions FOR INSERT
WITH CHECK (true);
```

### Progress Security
- Users can only see their own progress
- RLS on `user_lesson_progress`
- Progress updates validated

---

## Testing Strategy

### Unit Tests
- StepUid generation (consistent format)
- Level calculation (correct levels for XP values)
- Progress percentage calculation
- Idempotency logic

### Integration Tests
- Award XP → Database insert → `total_xp` updated
- Award XP twice with same stepUid → Only one transaction
- Complete lesson → Progress updated to 100%
- Complete lesson → Next lesson unlocked

### E2E Tests
1. **XP Award Flow:**
   - Complete step → See XP animation
   - Check header XP updated
   - Verify database transaction created
   - Retry step → No duplicate XP

2. **Progress Tracking:**
   - Start lesson → Status changes to "in-progress"
   - Complete half → Progress bar at 50%
   - Complete all steps → Status "completed"
   - Next lesson unlocked

3. **Streak Tracking (when implemented):**
   - Complete lesson today → Streak = 1
   - Complete lesson tomorrow → Streak = 2
   - Skip a day → Streak resets to 0

### Manual Testing Checklist
- [ ] Complete lesson, verify XP awarded
- [ ] Back button during lesson, verify no duplicate XP
- [ ] Refresh page, verify XP persists
- [ ] Complete lesson on mobile, verify XP animation
- [ ] Check leaderboard updates with new XP
- [ ] Verify progress bars accurate
- [ ] Verify lesson unlocking works
- [ ] Test on different timezones (streak tracking)

---

## Implementation Notes

### Current Status
- ✅ **US-019 (XP Award System):** Implemented with v2 stepUid
- ✅ **US-020 (XP Display):** Implemented in header
- ✅ **US-021 (XP Animation):** Implemented with CountUpXP
- ✅ **US-022 (Progress Bars):** Implemented
- ✅ **US-023 (Lesson Status):** Implemented
- ✅ **US-024 (Module Unlocking):** Implemented
- ⚠️ **US-025 (Streak Tracking):** Needs implementation (5 hours)
- ⚠️ **US-026 (Level System):** Partially implemented
- ❌ **US-027 (Badges):** Out of scope for V1

### Remaining Work (Before Launch)
1. **Streak Tracking (5 hours):**
   - Add streak fields to `user_profiles`
   - Implement streak calculation logic
   - Display streak on dashboard
   - Test timezone handling

2. **Level System Polish (2 hours):**
   - Add level display to dashboard
   - Create level-up animation
   - Test level calculations

3. **Testing (3 hours):**
   - XP idempotency verification
   - Progress tracking edge cases
   - Streak timezone handling

**Total Remaining: ~10 hours**

### Gotchas & Best Practices

**Gotcha #1: StepUid Format**
- Must be consistent across all game types
- Early versions (v1) didn't include gameType, causing collisions
- v2 format: `v2-moduleId-lessonId-gameType-stepIndex`

**Gotcha #2: XP Cache Version**
- When stepUid format changes, old cached XP is invalid
- Solution: `XP_CACHE_VERSION` forces cache clear on format change
- Implement `ensureXpCacheVersion()` on app boot

**Gotcha #3: Timezone for Streaks**
- User's timezone must be accurate for streak calculation
- Can't rely on server timezone (users are global)
- Solution: Store timezone in `user_profiles.timezone`
- Initialize on signup or from browser

**Gotcha #4: Optimistic Updates**
- XP updates should feel instant (optimistic UI)
- But must reconcile with server state
- Solution: `useSmartXp` hook handles optimistic + reconciliation

**Best Practice #1: Idempotency Key**
- Always use stepUid as idempotency key
- Never generate random keys (not idempotent!)
- Ensure consistent generation across retries

**Best Practice #2: Progress Calculation**
- Calculate from curriculum (don't hardcode step counts)
- Handle dynamic lessons (variable step counts)
- Round to nearest integer (no decimals)

**Best Practice #3: Streak Celebrations**
- Celebrate milestones (7, 30, 100 days)
- Visual feedback (confetti, badge)
- Motivates continued engagement

**Best Practice #4: Level Display**
- Show both current level and progress to next
- "Level 3 - 175 / 500 XP to Level 4"
- Makes progress tangible

---

## Performance Considerations

### XP Transactions
- Single INSERT per XP award (fast)
- UNIQUE constraint enforces idempotency (no additional checks needed)
- Index on (user_id, idempotency_key) for fast lookups

### Progress Queries
- RLS automatically filters by user_id (uses index)
- Progress calculation is simple (no joins)
- Cache progress in React state (avoid repeated queries)

### Leaderboard Impact
- `total_xp` field is denormalized (fast queries)
- Updated on every XP transaction (trigger or application code)
- Index on `total_xp DESC` for fast leaderboard queries

### Optimistic Updates
- UI updates immediately (no waiting for database)
- Reconcile with server state after
- Smooth user experience

---

## Monitoring & Observability

### Metrics to Track
- Total XP awarded (per day, per user)
- Average XP per lesson
- XP sources (lesson vs. review mode)
- Streak distribution (how many users have 7+ day streaks)
- Level distribution (how many users at each level)
- XP transaction failures

### Analytics Events
- `xp_awarded` (amount, source, lesson_id)
- `level_up` (new_level, total_xp)
- `streak_milestone` (days)
- `lesson_completed` (xp_earned)
- `progress_updated` (lesson_id, percent)

### Error Monitoring
- XP transaction failures (constraint violations should not happen)
- Progress update failures
- Idempotency key collisions (investigate if occurs)

---

## Deployment Checklist

- [ ] `user_xp_transactions` table created with UNIQUE constraint
- [ ] `user_lesson_progress` table created
- [ ] RLS policies enabled on both tables
- [ ] Indexes created (user_id, idempotency_key, total_xp)
- [ ] XP cache version mechanism implemented
- [ ] StepUid v2 format applied to all game types
- [ ] Streak fields added to `user_profiles` (if implementing)
- [ ] Level calculation tested
- [ ] XP idempotency tested (retry, back button)
- [ ] Progress tracking tested (start, update, complete)
- [ ] Optimistic updates working (useSmartXp)
- [ ] Mobile XP animations working
- [ ] Streak calculation tested (timezone handling)

---

## Success Criteria

UNIT-003 is complete when:
1. ✅ XP awards are idempotent (no double-awarding)
2. ✅ XP displays in header and updates in real-time
3. ✅ XP animations work on correct answers
4. ✅ Progress bars display accurately
5. ✅ Lesson statuses correct (locked/available/in-progress/completed)
6. ✅ Module unlocking works (sequential, paywall for premium)
7. ✅ Streaks track accurately (if implemented)
8. ✅ Levels calculate correctly (if fully implemented)
9. ✅ All XP transactions logged in database
10. ✅ No XP duplication bugs
11. ✅ Performance is acceptable (no lag on XP award)
12. ✅ Mobile responsive (XP display, progress bars)

---

**End of UNIT-003: XP & Progress Tracking**
