# EXECUTIVE SUMMARY: Technical Risks (30-Day Window)

This document identifies engineering risks that could cause bugs, crashes, or outages within the first 30 days of production operation.

---

## Critical Severity (Will Cause Outages)

### 1. Missing RPC Function Fallback in Leaderboard

**File**: `app/api/leaderboard/route.ts` (lines 164-180)

**Risk**: If `get_all_users_for_leaderboard` RPC function is not deployed or fails, the fallback logic attempts `set_config` RPC which will also fail, causing 500 errors.

```typescript
const queryResult = await supabase
  .rpc('get_all_users_for_leaderboard')
  .then(async (result) => {
    // If RPC doesn't exist, fall back to direct query with session variable
    if (result.error?.code === 'PGRST202') {
      try {
        await supabase.rpc('set_config', { ... }) // Also fails if not deployed
```

**Impact**: Leaderboard page crashes for all users.

**Likelihood**: High if database migrations are not applied correctly.

---

### 2. Direct SessionCache Access (Private Property Violation)

**File**: `lib/services/lesson-progress-service.ts` (line 228)

**Risk**: Directly mutates private `sessionCache` property bypassing class encapsulation.

```typescript
SmartAuthService['sessionCache']!.progress = updatedProgress
```

**Impact**: If `sessionCache` is null (which happens during initialization), this throws `TypeError: Cannot set properties of null`. Crashes lesson completion flow.

**Likelihood**: Medium - occurs during race conditions between auth initialization and lesson completion.

---

### 3. Webhook Missing User ID Recovery

**File**: `app/api/webhooks/route.ts` (lines 135-148)

**Risk**: For subscription update events, if no `user_subscriptions` row exists for the customer, webhook silently skips without creating one.

```typescript
if (!row) {
  console.warn("No user_subscriptions row for customer", customerId);
  return NextResponse.json({ received: true }, { status: 200 });
}
```

**Impact**: User pays but never gets premium access if `checkout.session.completed` webhook failed to create the initial row.

**Likelihood**: Low but catastrophic - depends on webhook delivery order.

---

## High Severity (Will Cause Bugs)

### 4. Race Condition in XP Award with Optimistic Update

**File**: `lib/services/xp-service.ts` (lines 363-369)

**Risk**: Optimistic update happens BEFORE database confirmation. If two tabs call simultaneously, both show XP gain but only one succeeds.

```typescript
// Optimistic UI update - show XP immediately (only for new awards)
try {
  const { SmartAuthService } = await import('./smart-auth-service')
  SmartAuthService.addXpOptimistic(amount, source)
} catch (error) {
  console.warn('Failed optimistic update:', error)
}
// ... then later calls DB
```

**Impact**: UI shows incorrect XP until page refresh when duplicate is rejected.

**Mitigation Note**: Database constraint prevents actual duplicates. UI will self-correct after ~5 seconds sync.

---

### 5. `any` Type Casting in Smart Auth Service Dashboard Cache

**File**: `lib/services/smart-auth-service.ts` (lines 1081-1082, 1091-1093, 1145-1146, 1209-1211)

**Risk**: Dashboard cache stored via unsafe `as any` casting, bypassing TypeScript.

```typescript
delete (this.sessionCache as any).dashboardCache
```

```typescript
;(this.sessionCache as any).dashboardCache = {
  data,
  cachedAt: Date.now()
}
```

**Impact**: No compile-time checks. If cache structure changes, runtime errors occur.

**Likelihood**: Medium during refactoring.

---

### 6. setTimeout Used Without Cleanup in Components

**File**: `lib/services/lesson-progress-service.ts` (line 246)

**Risk**: Promise-based timeout doesn't cancel if component unmounts.

```typescript
new Promise<boolean>(resolve => setTimeout(() => {
  // ...
  resolve(false)
}, 2000))
```

**Impact**: Memory leak if user navigates away during lesson completion. Not a crash but degrades performance over time.

---

### 7. Module 3 Missing `requiresPremium` Flag (PAYWALL BYPASS)

**File**: `lib/config/curriculum.ts` (line ~1847)

**Risk**: Module 3 definition lacks `requiresPremium: true` property.

```typescript
{
  id: "module3",
  title: "Module 3: Family & Relationships",
  // ... no requiresPremium field
  available: true,
  lessons: [
```

**Impact**: Free users can access Module 3 content without paying.

**Likelihood**: 100% - this is a configuration bug, not a runtime issue.

---

## Medium Severity (May Cause Issues)

### 8. In-Memory Rate Limiting Doesn't Scale

**File**: `lib/services/rate-limiter.ts` (lines 29-32)

**Risk**: Rate limit state stored in process memory, not shared across Vercel function instances.

```typescript
if (typeof setInterval !== 'undefined') {
  this.cleanupInterval = setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL_MS)
}
```

**Impact**: Attackers can bypass rate limits by hitting different function instances. Unlikely at low traffic but becomes exploitable under load.

---

### 9. Hardcoded Personal Debug Data in Production Code

**File**: `app/api/leaderboard/route.ts` (line 293)

**Risk**: Contains developer's personal user ID and name in production code.

```typescript
const currentUserInResults = topUsers?.find((u: LeaderboardUser) => 
  u.display_name === 'Armee E.' || u.id === '881a4bff-589f-46b8-b4ba-517cb6822e4c'
)
```

**Impact**: Exposes PII, looks unprofessional, and adds unnecessary DB queries for every leaderboard request.

---

### 10. Missing Error Boundary on LessonRunner

**File**: `app/components/LessonRunner.tsx`

**Risk**: 1,395 line component with complex state. Any unhandled error crashes entire lesson experience.

**Current State**: Parent `LessonPageContent` has `PageErrorBoundary`, but errors in game sub-components can still propagate up.

**Impact**: White screen during lessons if any game component throws.

---

### 11. Console Logging in Production (139 instances)

**Files**: 26 files in `/lib` directory

**Risk**: Extensive console.log usage leaks internal state to browser console.

**Impact**: Performance overhead, potential information disclosure, noisy debugging.

**Example files with highest counts**:
- `lib/services/smart-auth-service.ts`: 22 console statements
- `lib/services/lesson-progress-service.ts`: 12 console statements
- `lib/services/xp-service.ts`: 11 console statements

---

## Summary Table

| Risk | Severity | Likelihood | File |
|------|----------|------------|------|
| Missing RPC fallback | Critical | High | `app/api/leaderboard/route.ts` |
| Direct sessionCache access | Critical | Medium | `lib/services/lesson-progress-service.ts` |
| Webhook user recovery | Critical | Low | `app/api/webhooks/route.ts` |
| XP optimistic race | High | Medium | `lib/services/xp-service.ts` |
| Dashboard cache `any` | High | Medium | `lib/services/smart-auth-service.ts` |
| setTimeout no cleanup | High | Low | `lib/services/lesson-progress-service.ts` |
| Module 3 paywall bypass | High | 100% | `lib/config/curriculum.ts` |
| In-memory rate limits | Medium | Low | `lib/services/rate-limiter.ts` |
| Debug data in prod | Medium | N/A | `app/api/leaderboard/route.ts` |
| Missing error boundary | Medium | Medium | `app/components/LessonRunner.tsx` |
| Console logging | Medium | N/A | Multiple |

