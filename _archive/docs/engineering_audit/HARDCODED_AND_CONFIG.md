# HARDCODED AND CONFIG

This document identifies every hardcoded constant that should be configuration-driven: Stripe IDs, plan IDs, module IDs, URLs, limits, and magic numbers.

---

## 1. Module ID Strings

### First Module Special Case

**File**: `lib/services/lesson-progress-service.ts` (lines 342, 385)

```typescript
if (moduleId === 'module1' && lessonId === 'lesson1') {
  return true;
}
```

**File**: `lib/services/module-access-service.ts` (line 105)

```typescript
if (moduleId === 'module1') {
  return { prerequisitesComplete: true, missingPrerequisites: [] }
}
```

**Replacement**:
```typescript
// lib/config/constants.ts
export const CURRICULUM_CONSTANTS = {
  FIRST_MODULE_ID: 'module1',
  FIRST_LESSON_ID: 'lesson1',
} as const
```

---

### Module Numbering Assumption

**File**: `lib/utils/curriculum-lexicon.ts` (line 597)

```typescript
function isModuleBefore(moduleA: string, moduleB: string): boolean {
  // Extract module numbers: "module1" → 1, "module2" → 2
  const numA = parseInt(moduleA.replace('module', ''), 10)
  const numB = parseInt(moduleB.replace('module', ''), 10)
```

**Issue**: Assumes all module IDs follow `module{N}` pattern.

**Status**: Currently true for all modules. Document as assumption.

---

## 2. Personal Debug Data (Critical)

### User ID and Display Name

**File**: `app/api/leaderboard/route.ts` (line 293)

```typescript
const currentUserInResults = topUsers?.find((u: LeaderboardUser) => 
  u.display_name === 'Armee E.' || u.id === '881a4bff-589f-46b8-b4ba-517cb6822e4c'
)
```

**Replacement**: Delete this debug code entirely (see MASTER_ROUTE_TO_LAUNCH.md Step 2).

---

## 3. Rate Limiting Configuration

### Rate Limit Values

**File**: `lib/services/rate-limiter.ts` (lines 131-136)

```typescript
export const RATE_LIMITS = {
  CHECKOUT: { maxRequests: 3, windowMs: 5 * 60 * 1000 },        // 3 req per 5 minutes
  MODULE_ACCESS: { maxRequests: 50, windowMs: 60 * 1000 },      // 50 req per minute
  USER_STATS: { maxRequests: 10, windowMs: 60 * 1000 },         // 10 req per minute
  CHECK_PREMIUM: { maxRequests: 20, windowMs: 60 * 1000 },      // 20 req per minute
} as const
```

**Status**: Already extracted to constants. Good pattern.

---

### Cleanup Interval

**File**: `lib/services/rate-limiter.ts` (line 8)

```typescript
private CLEANUP_INTERVAL_MS = 60 * 1000 // 1 minute
```

**Status**: Already a class property. Good.

---

## 4. Cache TTL Values

### SmartAuthService Cache Durations

**File**: `lib/services/smart-auth-service.ts` (lines 91-98)

```typescript
private static readonly SESSION_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days
private static readonly INACTIVITY_TIMEOUT = 7 * 24 * 60 * 60 * 1000 // 7 days
private static readonly SYNC_INTERVALS = {
  active: 30 * 1000,    // 30 seconds during active use
  idle: 2 * 60 * 1000,  // 2 minutes when idle
  background: 10 * 60 * 1000 // 10 minutes when backgrounded
}
```

**Status**: Already extracted to class constants. Good.

---

### Dashboard Cache TTL

**File**: `lib/services/smart-auth-service.ts` (lines 1039, 1150)

```typescript
const TTL = 5 * 60 * 1000 // 5 minutes
```

**Issue**: TTL defined inline in two places.

**Replacement**:
```typescript
// At top of file
private static readonly DASHBOARD_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
```

---

### Vocabulary Cache Duration

**File**: `lib/services/vocabulary-progress-service.ts` (line 17)

```typescript
private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
```

**Status**: Already a class constant. Good.

---

### Lesson Page Staleness Threshold

**File**: `app/modules/[moduleId]/[lessonId]/page.tsx` (line 35)

```typescript
const CACHE_STALENESS_THRESHOLD = 60_000 // 60 seconds
```

**Status**: Already a named constant. Good.

---

## 5. SRS Scheduling

**File**: `lib/services/vocabulary-tracking-service.ts` (lines 92-99)

```typescript
const SRS_SCHEDULE = {
  0: 1 * 60 * 60 * 1000,          // 1 hour (new word)
  1: 8 * 60 * 60 * 1000,          // 8 hours (learning)
  2: 24 * 60 * 60 * 1000,         // 1 day (familiar)
  3: 3 * 24 * 60 * 60 * 1000,     // 3 days (known)
  4: 7 * 24 * 60 * 60 * 1000,     // 1 week (strong)
  5: 14 * 24 * 60 * 60 * 1000     // 2 weeks (mastered)
} as const
```

**Status**: Already a named constant with documentation. Good.

---

## 6. XP Values

### XP Rewards Configuration

**File**: `lib/services/xp-service.ts`

```typescript
export const XP_REWARDS = {
  flashcard: 5,
  quiz: 10,
  // ... etc
}
```

**Status**: Already exported configuration. Good.

---

### Daily Goal Default

**File**: `lib/supabase/database.ts` (line 24)

```typescript
daily_goal_xp: number // User's daily XP goal. Default 50, editable in account settings. Range: 1-1000 XP
```

The default of 50 is set in database schema, not code.

**File**: `lib/services/smart-auth-service.ts` (line 311)

```typescript
return this.sessionCache?.dailyGoalXp || 50
```

**Issue**: Default value (50) hardcoded in two places (database and code fallback).

**Replacement**:
```typescript
// lib/config/constants.ts
export const DEFAULTS = {
  DAILY_GOAL_XP: 50,
  MIN_DAILY_GOAL: 1,
  MAX_DAILY_GOAL: 1000,
}
```

---

## 7. Email and Support URLs

### Support Email

**File**: `app/billing/canceled/page.tsx`

Contains reference to `support@iranopedia.com` (from previous audit).

**Status**: Should be environment variable or config constant:
```typescript
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@iranopedia.com'
```

---

## 8. Retry Configuration

### Retry Delays

**File**: `lib/utils/retry-helpers.ts`

```typescript
// Uses exponential backoff with defaults
initialDelay: 100,
maxDelay: 2000,
factor: 2,
maxRetries: 3
```

**Status**: Passed as parameters, configurable. Good.

---

## 9. Timeout Values

### Lesson Completion Cache Timeout

**File**: `lib/services/lesson-progress-service.ts` (line 251)

```typescript
}, 2000))  // 2 second timeout
```

**Issue**: Magic number for timeout.

**Replacement**:
```typescript
const CACHE_UPDATE_TIMEOUT = 2000 // 2 seconds
```

---

### Auth Service Cooldown

**File**: `lib/services/auth-service.ts` (line 148)

```typescript
const COOLDOWN_MS = 5 * 60 * 1000 // 5 minutes
```

**Status**: Already a named constant. Good.

---

## 10. Daily Goal Fetch Window

**File**: `lib/services/daily-goal-service.ts` (line 154)

```typescript
const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000)
```

**Issue**: Magic number 25 hours.

**Replacement**:
```typescript
const DAILY_XP_FETCH_WINDOW_HOURS = 25 // Safety margin for timezone edge cases
const windowStart = new Date(Date.now() - DAILY_XP_FETCH_WINDOW_HOURS * 60 * 60 * 1000)
```

---

## 11. Sync Service Interval

**File**: `lib/services/sync-service.ts` (line 32)

```typescript
this.syncInterval = setInterval(() => {
  // ...
}, 5000);  // 5 second sync interval
```

**Issue**: Magic number.

**Replacement**:
```typescript
private static readonly SYNC_INTERVAL_MS = 5000
```

---

## 12. Plan Type Strings

### Subscription Plan Names

**File**: `app/api/webhooks/route.ts` (lines 99-100, 174)

```typescript
plan_type: "premium",
status: "active",
```

```typescript
plan_type: sub.status === "active" ? "premium" : "free",
```

**Issue**: Plan type strings hardcoded.

**Replacement**:
```typescript
// lib/config/constants.ts
export const PLAN_TYPES = {
  FREE: 'free',
  PREMIUM: 'premium',
} as const
```

---

## Summary: Constants to Extract

| Category | File | Value | Priority |
|----------|------|-------|----------|
| Module IDs | Multiple | `'module1'`, `'lesson1'` | Medium |
| Debug data | `app/api/leaderboard/route.ts` | Personal UUID | **Critical** |
| Cache TTL | `lib/services/smart-auth-service.ts` | 5 minutes inline | Low |
| Default goal | Multiple | `50` | Low |
| Timeout | `lib/services/lesson-progress-service.ts` | `2000` | Low |
| Sync interval | `lib/services/sync-service.ts` | `5000` | Low |
| Plan types | `app/api/webhooks/route.ts` | `'premium'`, `'free'` | Medium |

---

## Recommended Config File

Create `lib/config/constants.ts`:

```typescript
// lib/config/constants.ts

export const CURRICULUM_CONSTANTS = {
  FIRST_MODULE_ID: 'module1',
  FIRST_LESSON_ID: 'lesson1',
} as const

export const PLAN_TYPES = {
  FREE: 'free',
  PREMIUM: 'premium',
} as const

export const DEFAULTS = {
  DAILY_GOAL_XP: 50,
  MIN_DAILY_GOAL: 1,
  MAX_DAILY_GOAL: 1000,
  TIMEZONE: 'America/Los_Angeles',
} as const

export const TIMEOUTS = {
  CACHE_UPDATE_MS: 2000,
  SYNC_INTERVAL_MS: 5000,
  CACHE_STALENESS_MS: 60_000,
  DASHBOARD_CACHE_TTL_MS: 5 * 60 * 1000,
} as const

export const SUPPORT = {
  EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@iranopedia.com',
} as const
```

---

## What NOT to Change

These are correctly hardcoded or environment-driven:

| Item | Location | Status |
|------|----------|--------|
| Stripe keys | Env vars | Correct |
| Supabase URLs | Env vars | Correct |
| Rate limits | `lib/services/rate-limiter.ts` | Already constants |
| XP rewards | `lib/services/xp-service.ts` | Already exported |
| SRS schedule | `lib/services/vocabulary-tracking-service.ts` | Already constants |
| Session durations | `lib/services/smart-auth-service.ts` | Already class constants |

