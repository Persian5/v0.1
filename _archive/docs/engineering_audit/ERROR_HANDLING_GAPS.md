# ERROR HANDLING GAPS

This document identifies crash risks from null/undefined assumptions, missing loading states, and uncaught thrown errors.

---

## 1. Null/Undefined Assumptions

### 1.1 Non-Null Assertion on sessionCache

**File**: `lib/services/lesson-progress-service.ts` (line 228)

```typescript
SmartAuthService['sessionCache']!.progress = updatedProgress
```

**Risk**: If `sessionCache` is null (auth not initialized), this throws `TypeError: Cannot set properties of null`.

**Trigger**: User completes lesson before `SmartAuthService.initializeSession()` completes.

**Minimal Fix**:
```typescript
const sessionState = SmartAuthService.getSessionState()
if (sessionState.isReady) {
  SmartAuthService.updateUserData({ progress: updatedProgress })
}
```

---

### 1.2 Optional Chaining Missing on User Metadata

**File**: `app/components/LessonRunner.tsx` (line 80)

```typescript
const userFirstName = user?.user_metadata?.first_name || 'Friend'
```

**Status**: Correctly uses optional chaining. Safe.

---

### 1.3 Single Query Assumptions

**File**: `lib/supabase/database.ts` (line 67)

```typescript
const { data: profile, error } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', user.id)
  .single()  // Throws if row not found
```

**Handling** (lines 69-106):

```typescript
if (error && error.code === 'PGRST116') {
  // Profile doesn't exist, create it
  // ...
}
```

**Status**: Correctly handles "not found" case.

---

### 1.4 MaybeSingle vs Single Inconsistency

**File**: `lib/supabase/database.ts` (line 247)

```typescript
.maybeSingle() // Use maybeSingle() instead of single() to handle missing profiles gracefully
```

Good - this won't throw if profile doesn't exist.

**But**: Other places use `.single()` without the same care:

**File**: `lib/services/vocabulary-tracking-service.ts` (line 263)

```typescript
.single()
```

**Following line 265**:
```typescript
if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
```

**Status**: Correctly handles not-found case. Safe.

---

### 1.5 Non-Null Assertion on Stripe Types

**File**: `app/api/webhooks/route.ts` (lines 114-117)

```typescript
current_period_end: (sub as any).current_period_end
  ? new Date((sub as any).current_period_end * 1000).toISOString()
  : null,
cancel_at_period_end: (sub as any).cancel_at_period_end ?? false,
```

**Risk**: Uses `as any` to access Stripe subscription properties that may not exist on all subscription states.

**Status**: Handles null with ternary. Safe.

---

### 1.6 Array Index Access Without Bounds Check

**File**: `app/components/games/AudioMeaning.tsx` (line 331)

```typescript
const replaceIndex = duplicatesToReplace.length > 0 
  ? duplicatesToReplace.shift()!.originalIndex 
  : shuffledOptions.length + optionsMap.size
```

**Risk**: `shift()!` uses non-null assertion. If array is empty after length check (race condition), this throws.

**Actual Risk**: Very low - length check is synchronous with shift.

---

## 2. Missing Loading States

### 2.1 Dashboard Page

**File**: `app/dashboard/page.tsx` (lines 78-80)

```typescript
const [dashboard, setDashboard] = useState<DashboardData | null>(null)
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
```

**Rendering** (around line 200):
```typescript
if (isLoading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
    </div>
  )
}
```

**Status**: Has loading state. Safe.

---

### 2.2 Lesson Page

**File**: `app/modules/[moduleId]/[lessonId]/page.tsx` (lines 68-79)

```typescript
const [appState, setAppState] = useState<{
  isLoading: boolean
  isAuthenticated: boolean
  isAccessible: boolean | null
  // ...
}>({
  isLoading: true,
  // ...
})
```

**Status**: Has loading state. Safe.

---

### 2.3 Review Mode Pages

**File**: `app/review/page.tsx`

**Check**: Uses `isLoading` state.

**Status**: All review pages have loading states.

---

### 2.4 Widgets Without Individual Loading

**File**: `app/components/dashboard/WordsNeedingPractice.tsx`

```typescript
if (isLoading) {
  return <div>...</div>
}
```

**Status**: Has loading state. Safe.

---

## 3. Uncaught Thrown Errors

### 3.1 Grammar Service Throws Without Boundary

**File**: `lib/services/grammar-service.ts` (lines 108-110, 137-139, 148-150)

```typescript
if (!baseVocab) {
  throw new Error(
    `[GrammarService] Base vocabulary "${ref}" not found in curriculum. ` +
```

**Caller**: `app/components/LessonRunner.tsx` uses `require()` to load GrammarService:

```typescript
const { GrammarService } = require('@/lib/services/grammar-service');
```

**Risk**: If curriculum data is malformed, this throws and crashes LessonRunner.

**Protection**: LessonRunner is wrapped in `PageErrorBoundary`:

**File**: `app/modules/[moduleId]/[lessonId]/page.tsx` (lines 688-690)

```typescript
return (
  <PageErrorBoundary>
    <LessonPageContent />
  </PageErrorBoundary>
)
```

**Status**: Protected by error boundary. Safe.

---

### 3.2 Step UID Throws for Invalid Steps

**File**: `lib/utils/step-uid.ts` (multiple locations)

```typescript
throw new Error(`[${location}] Flashcard step ${stepIndex} missing vocabularyId - required for stable UID`)
```

**Risk**: If lesson content is malformed (missing vocabularyId), this crashes during XP award.

**Caller Context**: Called from LessonRunner's `handleStepComplete`.

**Protection**: Same error boundary covers this.

**Status**: Protected by error boundary. Safe.

---

### 3.3 Supabase Client Throws on Missing Env Vars

**File**: `lib/supabase/client.ts` (lines 7-12)

```typescript
if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}
```

**Risk**: If env vars not set, entire app crashes on load.

**Status**: This is correct behavior - fail fast on misconfiguration.

---

### 3.4 DatabaseService Throws on Errors

**File**: `lib/supabase/database.ts` (multiple locations)

```typescript
throw new Error(`Failed to fetch user profile: ${error.message}`)
throw new Error(`Failed to update user profile: ${error.message}`)
throw new Error(`Failed to fetch user XP: ${error.message}`)
```

**Callers**: Various services call DatabaseService methods.

**Example Caller**: `lib/services/lesson-progress-service.ts`

```typescript
try {
  await DatabaseService.markLessonCompleted(currentUser.id, moduleId, lessonId)
} catch (error) {
  console.error('Failed to mark lesson completed in database:', error)
  return { success: false, dbUpdated: false, cacheUpdated: false }
}
```

**Status**: Callers catch and handle. Safe.

---

### 3.5 API Routes Return 500 on Uncaught Errors

**File**: `app/api/leaderboard/route.ts` (lines 367-374)

```typescript
} catch (error) {
  console.error('Leaderboard API error:', error)
  
  // NEVER expose stack traces or sensitive errors to client
  return NextResponse.json(
    { error: 'An unexpected error occurred. Please try again later.' },
    { status: 500 }
  )
}
```

**Status**: Top-level catch in API routes. Safe.

---

### 3.6 Webhook Missing Try-Catch for Sub-Retrieval

**File**: `app/api/webhooks/route.ts` (lines 106-122)

```typescript
if (subId) {
  try {
    const sub = await stripe.subscriptions.retrieve(subId);
    // ...
  } catch (e) {
    console.warn("Subscription not retrievable yet; will rely on later events.", subId);
  }
}
```

**Status**: Has try-catch. Safe.

---

## 4. Error Boundaries Coverage

### Root Level

**File**: `app/layout.tsx`

```typescript
<ClientRootBoundary>
  {/* ... */}
</ClientRootBoundary>
```

**Status**: Has root error boundary.

---

### Page Level

**File**: `app/modules/[moduleId]/[lessonId]/page.tsx`

```typescript
<PageErrorBoundary>
  <LessonPageContent />
</PageErrorBoundary>
```

**Status**: Lesson pages have error boundary.

---

### Widget Level

**File**: `app/dashboard/page.tsx`

```typescript
<WidgetErrorBoundary>
  <LeaderboardWidget />
</WidgetErrorBoundary>
```

**Status**: Dashboard widgets have error boundary.

---

### Missing Boundary: Game Components

**Files**: `app/components/games/*.tsx`

**Issue**: Individual game components (Quiz, Flashcard, MatchingGame, etc.) don't have their own error boundaries. If a game crashes, it takes down the entire LessonRunner.

**Current Protection**: PageErrorBoundary catches everything, but gives generic error message instead of allowing user to skip broken step.

**Minimal Fix**: Wrap game rendering in LessonRunner with GameErrorBoundary:

```typescript
// In LessonRunner's renderCurrentStep
return (
  <GameErrorBoundary onError={() => handleStepComplete(true)}>
    <Quiz {...props} />
  </GameErrorBoundary>
)
```

---

## 5. Promise Rejection Handling

### 5.1 Unhandled Promise in useEffect

**File**: `app/dashboard/page.tsx` (lines 97-155)

```typescript
useEffect(() => {
  if (!user?.id) {
    setIsLoading(false)
    return
  }
  
  fetchDashboardData()
}, [user?.id, pathname])
```

**Risk**: If `fetchDashboardData()` throws, it's unhandled.

**Inside fetchDashboardData**:
```typescript
try {
  // ...
} catch (err) {
  setError('Failed to load dashboard')
  console.error('Dashboard fetch error:', err)
} finally {
  setIsLoading(false)
}
```

**Status**: Has try-catch. Safe.

---

### 5.2 Async Event Handlers

**File**: `components/auth/SmartAuthProvider.tsx` (line 58)

```typescript
useEffect(() => {
  initializeSession()
}, [])
```

**initializeSession** (lines 81-103):
```typescript
const initializeSession = async () => {
  try {
    // ...
  } catch (error) {
    console.error('Failed to initialize session:', error)
    setIsReady(true)
  }
}
```

**Status**: Has try-catch. Safe.

---

## Summary Table

| Issue | Severity | File | Status |
|-------|----------|------|--------|
| sessionCache null assertion | High | `lib/services/lesson-progress-service.ts` | **Needs fix** |
| Array shift null assertion | Low | `app/components/games/AudioMeaning.tsx` | Acceptable |
| Grammar service throws | Medium | `lib/services/grammar-service.ts` | Protected by boundary |
| Step UID throws | Medium | `lib/utils/step-uid.ts` | Protected by boundary |
| Supabase env throws | Low | `lib/supabase/client.ts` | Correct behavior |
| Missing game error boundary | Medium | `app/components/LessonRunner.tsx` | Enhancement |
| API route error handling | N/A | All API routes | Safe |
| Promise rejection | N/A | Multiple | All have try-catch |

---

## Required Fixes

### 1. SessionCache Null Assertion

**File**: `lib/services/lesson-progress-service.ts` (line 228)

```diff
-SmartAuthService['sessionCache']!.progress = updatedProgress
-SmartAuthService.markProgressUpdated()
+const sessionState = SmartAuthService.getSessionState()
+if (sessionState.isReady) {
+  SmartAuthService.updateUserData({ progress: updatedProgress })
+}
```

### 2. Game Error Boundary (Enhancement, Not Required for Launch)

**File**: `app/components/LessonRunner.tsx`

Wrap each game component render with error boundary that allows skipping broken steps.

