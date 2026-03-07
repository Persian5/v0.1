# PERFORMANCE TRAPS

This document identifies expensive rerenders, unbounded queries, large bundles, and performance anti-patterns.

---

## 1. Large Components (Bundle Size)

### Component Line Counts

| Component | Lines | Bundle Impact |
|-----------|-------|---------------|
| `lib/config/curriculum.ts` | 2,576 | Loaded on every lesson page |
| `lib/services/word-bank-service.ts` | 1,547 | Loaded during lessons |
| `app/components/LessonRunner.tsx` | 1,395 | Core lesson component |
| `lib/services/smart-auth-service.ts` | 1,340 | Loaded on every page |
| `app/page.tsx` | 1,203 | Homepage |
| `app/components/games/GrammarFillBlank.tsx` | 1,065 | Game component |
| `components/auth/AuthModal.tsx` | 1,012 | Auth modal |

### Curriculum File Impact

**File**: `lib/config/curriculum.ts`

**Issue**: All 11 modules with all lessons (even unavailable ones) are bundled into every page that imports any curriculum function.

```typescript
import { getLesson, getModule } from '@/lib/config/curriculum'
```

**Impact**: ~2,500+ lines of lesson content loaded even when user is on Module 1 Lesson 1.

**Minimal Fix (No Code Change for Launch)**: 
Post-launch, split into dynamic imports:
```typescript
// Future: Dynamic module loading
const module1 = await import('@/lib/config/modules/module1')
```

---

## 2. Unbounded Queries

### 2.1 Leaderboard Full Table Scan

**File**: `app/api/leaderboard/route.ts` (lines 164-180)

```typescript
const queryResult = await supabase
  .rpc('get_all_users_for_leaderboard')
```

**RPC Function** fetches ALL users with XP > 0, then sorts and paginates in memory.

**Current Mitigation** (lines 221-224):
```typescript
// Sort by XP (in memory since RPC returns all users)
const sortedUsers = (topUsers || []).sort((a, b) => b.total_xp - a.total_xp)

// Paginate in memory
const paginatedUsers = sortedUsers.slice(offset, offset + limit)
```

**Risk**: As user base grows, this fetches thousands of rows for every leaderboard request.

**Minimal Fix**: Add LIMIT to the RPC function or query:

```sql
-- In Supabase migration
CREATE OR REPLACE FUNCTION get_all_users_for_leaderboard()
RETURNS TABLE(...) AS $$
BEGIN
  RETURN QUERY
  SELECT ...
  FROM user_profiles
  WHERE total_xp > 0
  ORDER BY total_xp DESC
  LIMIT 1000;  -- Cap at top 1000 users
END;
$$ LANGUAGE plpgsql;
```

---

### 2.2 Vocabulary Performance Full Fetch

**File**: `lib/services/vocabulary-tracking-service.ts` (line 412)

```typescript
static async getAllLearnedWords(userId: string): Promise<VocabularyPerformance[]> {
```

Fetches ALL vocabulary performance records for a user. No limit.

**Risk**: Power users with 500+ words could have slow dashboard loads.

**Current Mitigation**: Results are cached for 5 minutes.

**Minimal Fix**: Add pagination or limit:
```typescript
.limit(500) // Reasonable maximum for dashboard display
```

---

### 2.3 XP Transactions Fetch for Daily Calculation

**File**: `app/api/dashboard/route.ts` (lines 95-103)

```typescript
const { data: xpTransactionsData, error: xpError } = await supabaseServer
  .from('user_xp_transactions')
  .select('amount')
  .eq('user_id', user.id)
  .gte('created_at', todayStartISO)
```

**Issue**: Fetches all transactions from today. If user earns XP 100 times in a day, fetches 100 rows.

**Status**: Acceptable for launch. Power users earning 100+ XP transactions per day are extreme edge case.

**Post-Launch Fix**: Use aggregation function:
```sql
SELECT SUM(amount) FROM user_xp_transactions WHERE user_id = $1 AND created_at >= $2
```

---

### 2.4 Lesson Progress Full Fetch

**File**: `lib/supabase/database.ts` (lines 338-352)

```typescript
let query = supabase
  .from('user_lesson_progress')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: true })
```

**Issue**: Fetches ALL lesson progress records. With 11 modules x 14 lessons = 154 potential rows.

**Status**: 154 rows is acceptable. No fix needed.

---

## 3. Expensive Re-renders

### 3.1 LessonRunner State Changes

**File**: `app/components/LessonRunner.tsx`

**Issue**: Single component with 15+ state variables. Any state change re-renders entire 1,395-line component including all children.

```typescript
const [idx, setIdx] = useState(0)
const [remediationQueue, setRemediationQueue] = useState<string[]>([])
const [isInRemediation, setIsInRemediation] = useState(false)
const [remediationStep, setRemediationStep] = useState<'flashcard' | 'quiz'>('flashcard')
// ... 10+ more state variables
```

**Impact**: During lesson, every step change triggers full re-render.

**Minimal Fix (No Change for Launch)**:
Post-launch, extract state management to `useReducer` or context to prevent unnecessary child re-renders.

---

### 3.2 Dashboard Widget Cascade

**File**: `app/dashboard/page.tsx`

Each dashboard widget receives data from parent:

```typescript
<WelcomeCard firstName={firstName} />
<ResumeLearning nextLesson={dashboard.nextLesson} />
<DailyGoalIndicator goal={dashboard.dailyGoalXp} progress={dashboard.dailyGoalProgress} />
```

**Status**: Props are primitives/objects, React will skip re-render if props don't change. Acceptable.

---

### 3.3 useMemo Usage

**File**: `app/dashboard/page.tsx` (line 83)

```typescript
const firstName = useMemo(() => {
  const cachedProfile = SmartAuthService.getCachedProfile()
  // ...
}, [user])
```

**Status**: Correctly memoized. Good.

---

### 3.4 useCallback Usage in LessonRunner

**File**: `app/components/LessonRunner.tsx` (line 83)

```typescript
const replaceUserName = useCallback((text: string): string => {
  return text.replace(/{userFirstName}/g, userFirstName)
}, [userFirstName])
```

**Status**: Correctly memoized. Good.

---

## 4. Memory Leaks

### 4.1 setInterval Without Cleanup

**File**: `lib/services/smart-auth-service.ts` (lines 471-478)

```typescript
this.midnightCheckInterval = setInterval(() => {
  if (this.shouldInvalidateCacheForNewDay()) {
    this.clearDailyStats()
  }
}, 60 * 1000) // Check every minute
```

**Cleanup exists** (line 765):
```typescript
if (this.midnightCheckInterval) {
  clearInterval(this.midnightCheckInterval)
  this.midnightCheckInterval = null
}
```

**Status**: Cleanup exists but only called on signOut. If SmartAuthService is re-initialized, old interval may remain.

**Current Mitigation**: Line 466 checks before creating:
```typescript
if (this.midnightCheckInterval) {
  clearInterval(this.midnightCheckInterval)
}
```

**Status**: Safe.

---

### 4.2 Event Listeners

**File**: `lib/services/sync-service.ts` (lines 143-144)

```typescript
window.addEventListener('online', updateOnlineStatus)
window.addEventListener('offline', updateOnlineStatus)
```

**Issue**: No cleanup function. Listeners persist for app lifetime.

**Impact**: Low - these are global app-level listeners. Not a problem for SPA.

---

### 4.3 Audio Elements

**File**: `lib/services/audio-service.ts`

Audio elements created and cleaned up properly:

```typescript
audio.remove() // Cleanup
```

**Status**: Safe.

---

## 5. Synchronous Heavy Operations

### 5.1 Curriculum Lexicon Build

**File**: `lib/utils/curriculum-lexicon.ts`

```typescript
export function getCurriculumLexicon(): CurriculumLexicon {
  if (cachedLexicon) return cachedLexicon
  cachedLexicon = buildLexicon(getModules())
  return cachedLexicon
}
```

**Issue**: `buildLexicon` iterates through all curriculum data synchronously. First call is expensive.

**Current Mitigation**: Result is cached. Only runs once per session.

**Status**: Acceptable.

---

### 5.2 WordBank Generation

**File**: `lib/services/word-bank-service.ts`

Complex distractor generation with multiple array operations:

```typescript
static generateDistractors(...): DistractorResult {
  // 500+ lines of distractor logic
}
```

**Impact**: Called during lesson step rendering. Could cause frame drops on slow devices.

**Status**: Acceptable for launch. Monitor in production.

---

## 6. Network Waterfalls

### 6.1 Dashboard Data Fetch (Fixed)

**File**: `app/api/dashboard/route.ts`

All dashboard data fetched in parallel:

```typescript
const [progress, stats, profile] = await Promise.all([
  // Fetch lesson progress
  // Fetch vocabulary stats
  // Fetch user profile
])
```

**Status**: Already optimized with parallel fetching. Good.

---

### 6.2 Lesson Page Auth + Access Check

**File**: `app/modules/[moduleId]/[lessonId]/page.tsx` (lines 104-200)

```typescript
const { user, isEmailVerified, isReady } = await SmartAuthService.initializeSession()
// ... sequential checks
const access = await ModuleAccessService.canAccessModule(moduleId)
```

**Issue**: Auth initialization waits, THEN access check happens.

**Current Mitigation**: SmartAuthService caches session, so initialization is fast on subsequent checks.

**Status**: Acceptable. First load may be slow, subsequent loads are cached.

---

## 7. Image Optimization

**File**: `next.config.mjs`

```typescript
images: {
  unoptimized: true
}
```

**Issue**: Image optimization disabled. All images served at original size.

**Impact**: Could be slow on mobile if large images are used.

**Current Content**: App uses emoji for most visual content, minimal images.

**Status**: Acceptable for launch. Re-enable optimization post-launch if images are added.

---

## 8. API Route Cold Starts

### Force-Dynamic Routes

All API routes use:
```typescript
export const dynamic = 'force-dynamic'
```

**Impact**: Routes cannot be cached at CDN level. Every request hits function.

**Status**: Required for authenticated routes. Acceptable.

---

## Summary Table

| Issue | Severity | Impact | Status |
|-------|----------|--------|--------|
| Curriculum bundle size | Medium | Slow initial load | Post-launch split |
| Leaderboard unbounded query | High | Degrades with users | Add LIMIT |
| Vocabulary full fetch | Medium | Power user slowdown | Add LIMIT |
| XP transactions daily fetch | Low | Edge case | Post-launch aggregate |
| LessonRunner re-renders | Medium | Frame drops | Post-launch refactor |
| setInterval cleanup | Low | Memory | Already handled |
| Curriculum lexicon build | Low | First-call cost | Already cached |
| WordBank generation | Low | Frame drops | Monitor |
| Image optimization disabled | Low | Mobile data | Re-enable if needed |

---

## Minimal Fixes (Launch Safe)

### Fix 1: Add Leaderboard Query Limit

**File**: `supabase/migrations/` (new migration)

```sql
CREATE OR REPLACE FUNCTION get_all_users_for_leaderboard()
RETURNS TABLE(
  id uuid,
  display_name text,
  total_xp integer,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.display_name, p.total_xp, p.created_at
  FROM user_profiles p
  WHERE p.total_xp > 0
  ORDER BY p.total_xp DESC
  LIMIT 500;  -- Top 500 only
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### Fix 2: Add Vocabulary Fetch Limit

**File**: `lib/services/vocabulary-tracking-service.ts`

In relevant queries, add:
```typescript
.limit(500)
```

---

## What NOT to Change for Launch

| Item | Reason |
|------|--------|
| Curriculum bundle | Works, needs careful refactor |
| LessonRunner structure | Works, needs careful refactor |
| Image optimization | Minimal images currently |
| API cold starts | Required for auth |
| Lexicon caching | Already cached |

