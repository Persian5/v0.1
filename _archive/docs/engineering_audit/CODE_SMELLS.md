# CODE SMELLS

This document catalogs code quality issues that increase maintenance burden and bug risk.

---

## 1. Overly Complex Functions (>150 LOC)

### LessonRunner Component (1,395 lines)

**File**: `app/components/LessonRunner.tsx`

**Issue**: Single component handling lesson flow, remediation, XP awards, step navigation, game rendering, and completion logic. Contains 15+ `useRef` hooks, 10+ `useState` hooks, and deeply nested callbacks.

```typescript
// Lines 63-98: Excessive state management in one component
const [idx, setIdx] = useState(0)
const [remediationQueue, setRemediationQueue] = useState<string[]>([])
const [isInRemediation, setIsInRemediation] = useState(false)
const [remediationStep, setRemediationStep] = useState<'flashcard' | 'quiz'>('flashcard')
const [remediationStartIdx, setRemediationStartIdx] = useState<number | null>(null)
const [pendingRemediation, setPendingRemediation] = useState<string[]>([])
const [incorrectAttempts, setIncorrectAttempts] = useState<Record<string, number>>({})
const [quizAttemptCounter, setQuizAttemptCounter] = useState(0)
const [storyCompleted, setStoryCompleted] = useState(false)
const [isNavigating, setIsNavigating] = useState(false)
const [showXp, setShowXp] = useState(false)
const stateRef = useRef<HTMLDivElement>(null);
// ... and 6 more refs below
```

**Recommendation**: Extract into smaller components: `LessonState` (reducer), `RemediationHandler`, `StepRenderer`, `CompletionHandler`.

---

### SmartAuthService (1,340 lines)

**File**: `lib/services/smart-auth-service.ts`

**Issue**: Monolithic service combining session management, caching, XP operations, progress tracking, event emitting, and dashboard data.

**Recommendation**: Split into `SessionService`, `CacheService`, `ProgressCacheService`, `EventEmitter`.

---

### WordBankService (1,547 lines)

**File**: `lib/services/word-bank-service.ts`

**Issue**: Complex distractor generation with many edge cases, making testing and modification difficult.

---

### curriculum.ts (2,576 lines)

**File**: `lib/config/curriculum.ts`

**Issue**: All lesson content in one file. Adding new lessons requires modifying a massive file.

**Recommendation**: Split into per-module files: `module1.ts`, `module2.ts`, etc.

---

## 2. Unsafe `any` Types

### SmartAuthService Event Listeners

**File**: `lib/services/smart-auth-service.ts` (lines 60-61, 115)

```typescript
interface SmartAuthEventListener {
  (eventType: SmartAuthEventType, data: any): void
}

static emitEvent(eventType: SmartAuthEventType, data: any): void {
```

**Issue**: Event data is untyped, allowing any shape. Listeners cannot safely access properties.

---

### XpService Metadata

**File**: `lib/services/xp-service.ts` (lines 344-345)

```typescript
metadata?: any
}): Promise<{ granted: boolean, reason?: string, error?: any, newXp?: number }> {
```

**Issue**: Metadata and error types are `any`, losing type information.

---

### VocabularyService Quiz Extraction

**File**: `lib/services/vocabulary-service.ts` (line 277, 340-341)

```typescript
static extractVocabularyFromQuiz(quizData: any, allVocab: VocabularyItem[]): string | undefined {
// ...
if (options.some((opt: any) => {
```

**Issue**: Quiz data is untyped despite known structure.

---

### Step UID Derivation (14 instances)

**File**: `lib/utils/step-uid.ts` (lines 86, 94-96, 109-110, 122, 127, 142, 150, 158, 167, 178, 200, 208, 216-217, 231-236, 245)

```typescript
const vocabId = (step as any).data?.vocabularyId
const lexemeRef = (step as any).data?.lexemeRef
const quizType = (step as any).data?.quizType || 'vocab-normal'
```

**Issue**: Every step type access uses `as any`, bypassing TypeScript.

**Recommendation**: Create typed step data interfaces and use type guards.

---

### Dashboard Cache Casting

**File**: `lib/services/smart-auth-service.ts` (lines 1081-1082, 1091-1093, 1145-1146)

```typescript
delete (this.sessionCache as any).dashboardCache
;(this.sessionCache as any).dashboardCache = { data, cachedAt: Date.now() }
const dashboardCache = (this.sessionCache as any).dashboardCache
```

**Issue**: Dashboard cache property not in interface, accessed via `any` cast.

---

## 3. Console Logging in Production Paths

**Total instances in `/lib`**: 139 across 26 files

### High-frequency files:

| File | Count |
|------|-------|
| `lib/services/smart-auth-service.ts` | 22 |
| `lib/services/lesson-progress-service.ts` | 12 |
| `lib/services/xp-service.ts` | 11 |
| `lib/utils/grammar-options.ts` | 11 |
| `lib/services/word-bank-service.ts` | 10 |

### Example production console.log:

**File**: `lib/services/xp-service.ts` (line 352)

```typescript
if (typeof window !== 'undefined' && localStorage.getItem(cacheKey)) {
  console.log(`⏭️ XP already earned (cached): ${idempotencyKey}`)
  return { granted: false, reason: 'cached' }
}
```

**Recommendation**: Use `safeTelemetry` wrapper consistently (already exists at `lib/utils/telemetry-safe.ts`).

---

## 4. TODO/FIXME Comments That Matter

### Leaderboard Service Role Key

**File**: `app/api/leaderboard/route.ts` (line 130)

```typescript
// TODO: Switch to anon key + RLS policy after migration is applied
```

**Impact**: Currently bypasses RLS, security risk.

---

### Error Logging Service Integration

**File**: `lib/services/error-logging-service.ts` (lines 4, 61, 64)

```typescript
* TODO: Integrate with Sentry/LogRocket in production
// TODO: Integrate with Sentry
// TODO: Integrate with LogRocket
```

**Impact**: No production error visibility.

---

## 5. Dead/Unreachable Code

### Unused `require()` in LessonRunner

**File**: `app/components/LessonRunner.tsx` (lines 630, 711)

```typescript
const { GrammarService } = require('@/lib/services/grammar-service');
```

**Issue**: Uses CommonJS `require()` inside React component. This works but is inconsistent with ES module imports used elsewhere. Also, GrammarService is imported at runtime only in specific cases, which could be handled with dynamic import.

---

### Unreachable Default in Step UID

**File**: `lib/utils/step-uid.ts` (lines 244-247)

```typescript
default:
  // Unknown step type - use type + hash of data
  const dataStr = JSON.stringify((step as any).data || {})
  console.warn(`Unknown step type: ${type} in ${location}, using content hash`)
```

**Issue**: If a new step type is added but not handled, this creates a non-stable UID. This is technically reachable but indicates incomplete exhaustive handling.

---

## 6. Duplicated Logic

### Premium Access Check (Multiple Files)

**Pattern duplicated in**:
- `lib/services/module-access-service.ts` (line 65)
- `lib/utils/subscription.ts` (line 40)
- `components/routes/LessonRouteGuard.tsx` (uses API call)
- `app/modules/[moduleId]/[lessonId]/page.tsx` (uses API call)

**Issue**: Premium check logic appears in multiple forms. Some use server-side check, others use API endpoint.

---

### Timezone Detection

**Pattern duplicated in**:
- `lib/services/review-session-service.ts` (lines 59-86)
- `lib/services/smart-auth-service.ts` (timezone cache)
- `app/api/dashboard/route.ts` (line 80)

```typescript
// review-session-service.ts
static detectBrowserTimezone(): string {
  if (typeof window !== 'undefined') {
    const cached = sessionStorage.getItem('browser_timezone')
    // ...
  }
}
```

**Recommendation**: Single `TimezoneService` that handles detection and caching.

---

### Loading State Pattern

**Pattern duplicated across 32 files** (all dashboard widgets, page components)

```typescript
const [isLoading, setIsLoading] = useState(true)
// ...
if (isLoading) {
  return <Loader2 className="animate-spin" />
}
```

**Recommendation**: Create a `LoadingWrapper` component or use Suspense boundaries.

---

## 7. Inconsistent Error Handling

### Some Services Throw, Others Return

**Throwing pattern** (`lib/supabase/database.ts`):
```typescript
if (error) {
  throw new Error(`Failed to fetch user profile: ${error.message}`)
}
```

**Return pattern** (`lib/services/xp-service.ts`):
```typescript
if (error) {
  return { granted: false, reason: 'error', error }
}
```

**Issue**: Callers must handle both patterns, increasing complexity.

---

## 8. Magic Strings/Numbers

### Module ID Strings

**File**: `lib/services/lesson-progress-service.ts` (lines 342, 385)

```typescript
if (moduleId === 'module1' && lessonId === 'lesson1') {
  return true;
}
```

**File**: `lib/services/module-access-service.ts` (lines 105)

```typescript
if (moduleId === 'module1') {
  return { prerequisitesComplete: true, missingPrerequisites: [] }
}
```

**Recommendation**: Define constants: `const FIRST_MODULE = 'module1'`, `const FIRST_LESSON = 'lesson1'`.

---

### Timeout Values

**File**: `lib/services/smart-auth-service.ts`

```typescript
private static readonly SESSION_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days
private static readonly INACTIVITY_TIMEOUT = 7 * 24 * 60 * 60 * 1000 // 7 days
private static readonly SYNC_INTERVALS = {
  active: 30 * 1000,    // 30 seconds during active use
  idle: 2 * 60 * 1000,  // 2 minutes when idle
  background: 10 * 60 * 1000 // 10 minutes when backgrounded
}
```

**Status**: Already extracted to constants. Good pattern.

---

## Summary by Category

| Category | Count | Severity |
|----------|-------|----------|
| Overly complex functions | 4 files >500 LOC | High |
| Unsafe `any` types | 20+ instances | Medium |
| Console logging | 139 instances | Low |
| TODO that matter | 4 instances | High |
| Dead/unreachable code | 2 patterns | Low |
| Duplicated logic | 4 patterns | Medium |
| Inconsistent error handling | 2 patterns | Medium |
| Magic strings | 5+ instances | Low |

