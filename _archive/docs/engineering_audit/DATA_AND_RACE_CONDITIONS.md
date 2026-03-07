# DATA AND RACE CONDITIONS

This document identifies double writes, non-idempotent mutations, stale state issues, race conditions, and missing atomicity with Supabase.

---

## 1. XP Award Race Condition (Optimistic Update)

### Issue

**File**: `lib/services/xp-service.ts` (lines 349-369)

XP is displayed optimistically BEFORE the database confirms the award. If two requests happen simultaneously (two tabs, double-click), both show the XP increase but only one succeeds.

```typescript
// Step 1: Check localStorage cache (client-side only)
const cacheKey = `xp-${userId}-${idempotencyKey}`
if (typeof window !== 'undefined' && localStorage.getItem(cacheKey)) {
  return { granted: false, reason: 'cached' }
}

// Step 2: Set cache BEFORE DB call
if (typeof window !== 'undefined') {
  localStorage.setItem(cacheKey, '1')
}

// Step 3: Optimistic update (BEFORE DB confirmation)
try {
  SmartAuthService.addXpOptimistic(amount, source)
} catch (error) {
  console.warn('Failed optimistic update:', error)
}

// Step 4: Database call (CAN STILL FAIL)
const { data, error } = await supabase.rpc('award_xp_unified', { ... })
```

**Race Scenario**:
1. Tab A checks localStorage - empty
2. Tab A sets localStorage
3. Tab A shows +10 XP optimistically
4. Tab B checks localStorage - sees cache, returns early (correct!)
5. Tab A's DB call succeeds

**Actual Protection**: The localStorage check at step 1-2 prevents duplicate optimistic updates in most cases. The database unique constraint prevents actual duplicate awards.

**Remaining Risk**: If user clears localStorage, they can trigger optimistic update for already-awarded XP. The UI shows +10 XP but DB rejects it. Rollback at line 391-397 corrects this:

```typescript
if (error) {
  // Rollback optimistic update
  SmartAuthService.addXpOptimistic(-amount, 'rollback')
  // Remove cache so user can retry
  localStorage.removeItem(cacheKey)
}
```

### Minimal Fix

**Status**: Already mitigated. The rollback mechanism corrects incorrect optimistic updates. No code change needed.

---

## 2. Lesson Completion Double Write

### Issue

**File**: `lib/services/lesson-progress-service.ts` (lines 103-199)

`markLessonCompleted` is called from LessonRunner when lesson finishes. If called twice (user rapidly clicks, component re-renders), it could write twice.

```typescript
static async markLessonCompleted(moduleId: string, lessonId: string): Promise<{
  success: boolean
  dbUpdated: boolean
  cacheUpdated: boolean
}> {
  // ... auth check ...
  
  // Write to database (UPSERT - safe for duplicates)
  const dbWriteResult = await retryWithExponentialBackoff(
    async () => {
      await DatabaseService.markLessonCompleted(currentUser.id, moduleId, lessonId)
      return true
    },
    // ...
  )
```

**Database Level Protection**:

**File**: `lib/supabase/database.ts` (lines 386-399)

```typescript
const { data, error } = await supabase
  .from('user_lesson_progress')
  .upsert({
    user_id: userId,
    module_id: moduleId,
    lesson_id: lessonId,
    status: 'completed',
    progress_percent: 100,
    completed_at: new Date().toISOString(),
    // ...
  })
```

The `upsert` operation is idempotent - calling it twice with same user/module/lesson updates the same row.

### Minimal Fix

**Status**: Already safe. Database upsert prevents duplicate rows.

---

## 3. Story Completion Guard (Component Level)

### Issue

**File**: `app/components/LessonRunner.tsx` (lines 96-97)

```typescript
// FIX 3: Story completion idempotency guard
const storyCompleteGuardRef = useRef(false);
```

This ref prevents double-processing of story completion. However, refs reset if component remounts.

**Usage** (around line 300-350 in handleStepComplete):
```typescript
if (storyCompleteGuardRef.current) {
  return // Already processed
}
storyCompleteGuardRef.current = true
// ... mark lesson complete
```

**Risk**: If LessonRunner component remounts (rare), the ref resets and completion could be processed twice.

**Actual Protection**: Database-level upsert prevents duplicate rows. XP idempotency prevents duplicate awards.

### Minimal Fix

**Status**: Already safe due to database-level protections. Ref is extra client-side optimization.

---

## 4. Vocabulary Performance Double Write

### Issue

**File**: `lib/services/vocabulary-tracking-service.ts` (lines 256-340)

`recordVocabularyAttempt` upserts vocabulary performance without client-side deduplication.

```typescript
static async recordVocabularyAttempt(params: RecordAttemptParams): Promise<void> {
  // ...
  
  // UPSERT performance record
  const updateData: any = {
    word_text: wordText,
    total_attempts: existingPerf.total_attempts + 1,
    total_correct: existingPerf.total_correct + (isCorrect ? 1 : 0),
    // ...
  }
  
  await supabase
    .from('vocabulary_performance')
    .update(updateData)
    .eq('id', existingPerf.id)
```

**Risk**: If called twice for same attempt, `total_attempts` increments twice.

**Current Mitigation**: The call site in LessonRunner tracks which steps have been processed via `currentStepTrackedRef`:

```typescript
const currentStepTrackedRef = useRef<Set<string>>(new Set())
// ...
if (currentStepTrackedRef.current.has(stepUid)) {
  return // Already tracked
}
currentStepTrackedRef.current.add(stepUid)
```

### Minimal Fix

**Status**: Protected by client-side ref. Database has no native idempotency key for this operation. Could add one for extra safety:

```sql
-- Add idempotency to vocabulary_attempts table
ALTER TABLE vocabulary_attempts ADD COLUMN idempotency_key TEXT UNIQUE;
```

But current client-side protection is sufficient for launch.

---

## 5. SmartAuthService Cache Staleness

### Issue

**File**: `lib/services/smart-auth-service.ts`

The service caches user progress, XP, and profile data. Multiple parts of the app can modify this data, leading to stale reads.

**Scenario**:
1. Dashboard loads, caches progress
2. User completes lesson in another tab
3. User returns to dashboard - sees stale progress

**Current Mitigation**: 

1. **Progress Update Marking** (line 1265-1278):
```typescript
static markProgressUpdated(): void {
  if (!this.sessionCache) return
  this.sessionCache.progressUpdatedAt = Date.now()
}
```

2. **Staleness Check** (used in LessonPageContent, line 34):
```typescript
const CACHE_STALENESS_THRESHOLD = 60_000 // 60 seconds
```

3. **Event Emission** (line 115):
```typescript
static emitEvent(eventType: SmartAuthEventType, data: any): void {
```

Progress updates emit events that UI components listen to.

### Minimal Fix

**Status**: Partially mitigated. Cross-tab staleness remains an issue. For launch, this is acceptable - user can refresh to see updated data.

---

## 6. Webhook Non-Idempotent Handling

### Issue

**File**: `app/api/webhooks/route.ts` (lines 96-101)

```typescript
// 1) Always seed a minimal row
await upsertSubscription({
  user_id: supabaseUserId,
  stripe_customer_id: customerId,
  plan_type: "premium",
  status: "active",
});
```

Stripe can send the same webhook multiple times (retry on failure). The `upsert` operation is idempotent based on `user_id,stripe_customer_id` conflict key.

**Current Protection** (line 53):
```typescript
{ onConflict: "user_id,stripe_customer_id" }
```

### Minimal Fix

**Status**: Already idempotent via upsert with conflict key.

---

## 7. Streak Update Race Condition

### Issue

**File**: `lib/services/streak-service.ts` (lines 78-81)

```typescript
console.log(`🔄 Calling update_streak RPC for user: ${userId}`)
const { data, error } = await supabase.rpc('update_streak', {
  p_user_id: userId
})
```

The streak is also updated by a database trigger when XP is awarded.

**File**: `supabase/migrations/20250113000000_add_streak_and_daily_goal.sql`

```sql
CREATE OR REPLACE FUNCTION update_streak(p_user_id uuid)
RETURNS void AS $$
-- ...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger calls update_streak when XP is inserted
```

**Risk**: If `update_streak` is called manually AND by trigger simultaneously, could have race condition.

**Actual Protection**: The `update_streak` function uses `SECURITY DEFINER` and PostgreSQL's row-level locking during the UPDATE statement prevents true race conditions.

### Minimal Fix

**Status**: PostgreSQL handles concurrent updates safely. No issue.

---

## 8. Direct SessionCache Mutation

### Critical Issue

**File**: `lib/services/lesson-progress-service.ts` (line 228)

```typescript
SmartAuthService['sessionCache']!.progress = updatedProgress
```

This directly accesses and mutates a private static property using bracket notation to bypass TypeScript.

**Risk**:
1. If `sessionCache` is null (not initialized), this throws `TypeError`
2. Bypasses any encapsulation in SmartAuthService
3. No event emission, so listeners don't know data changed

**Line 229 does emit event**:
```typescript
SmartAuthService.markProgressUpdated()
```

But this doesn't trigger `progress-updated` event.

### Minimal Fix

Add null check and use public method:

```typescript
// Instead of:
SmartAuthService['sessionCache']!.progress = updatedProgress

// Use:
if (SmartAuthService.getSessionState().isReady) {
  SmartAuthService.updateUserData({ progress: updatedProgress })
}
```

---

## 9. Non-Atomic Profile + Progress Creation

### Issue

**File**: `lib/supabase/database.ts` (lines 69-106)

When a new user signs up, profile creation and progress are handled separately:

```typescript
// Profile created
const { data: createdProfile, error: createError } = await supabase
  .from('user_profiles')
  .insert(newProfile)
  .select()
  .single()
```

Progress is created separately when first lesson is accessed.

**Risk**: If profile creation succeeds but subsequent operations fail, user is in partial state.

**Actual Impact**: Low. Profile is self-contained, and progress is created on-demand.

### Minimal Fix

**Status**: Acceptable for launch. True atomic transactions would require Supabase Edge Functions or raw SQL with transactions.

---

## Summary Table

| Issue | Severity | Status | File |
|-------|----------|--------|------|
| XP optimistic race | Medium | Mitigated (rollback) | `lib/services/xp-service.ts` |
| Lesson completion double write | Low | Safe (upsert) | `lib/supabase/database.ts` |
| Story completion ref | Low | Safe (DB protection) | `app/components/LessonRunner.tsx` |
| Vocab performance double write | Medium | Protected (client ref) | `lib/services/vocabulary-tracking-service.ts` |
| Cache staleness | Medium | Partially mitigated | `lib/services/smart-auth-service.ts` |
| Webhook idempotency | Low | Safe (upsert) | `app/api/webhooks/route.ts` |
| Streak race | Low | Safe (PostgreSQL) | `lib/services/streak-service.ts` |
| Direct sessionCache mutation | High | **Needs fix** | `lib/services/lesson-progress-service.ts` |
| Non-atomic creation | Low | Acceptable | `lib/supabase/database.ts` |

---

## Required Fix

### Direct SessionCache Mutation

**File**: `lib/services/lesson-progress-service.ts` (line 228)

```diff
-SmartAuthService['sessionCache']!.progress = updatedProgress
+const sessionState = SmartAuthService.getSessionState()
+if (sessionState.isReady) {
+  SmartAuthService.updateUserData({ progress: updatedProgress })
+}
```

This uses the public API instead of directly mutating private state, and handles the null case safely.

