# STATIC ANALYSIS REPORT

Generated: December 22, 2025

---

## Summary

| Check | Status | Count |
|-------|--------|-------|
| TypeScript Compilation | PASS | 0 errors |
| ESLint Warnings | WARN | 429 warnings |
| `@typescript-eslint/no-explicit-any` | WARN | 88 instances |
| `@typescript-eslint/no-unused-vars` | WARN | 195 instances |
| `react-hooks/exhaustive-deps` | WARN | 37 instances |
| TODO/FIXME Comments | INFO | 4 instances |
| `@ts-ignore/@ts-nocheck` | PASS | 0 instances |
| `eslint-disable` | INFO | 1 instance |
| `console.log/warn` | WARN | 252 instances |
| Largest file | INFO | 2,576 lines |

---

## 1. Lint Results (npm run lint)

### Overview

- **Total warnings**: 429
- **Errors**: 0
- **Command**: `npm run lint` (uses `next lint`)

### Warning Categories

| Rule | Count | Severity |
|------|-------|----------|
| `@typescript-eslint/no-unused-vars` | 195 | Low |
| `@typescript-eslint/no-explicit-any` | 88 | Medium |
| `react-hooks/exhaustive-deps` | 37 | High |
| `@next/next/no-assign-module-variable` | 20 | Low |
| `react/no-unescaped-entities` | 8 | Low |
| `@typescript-eslint/no-require-imports` | 6 | Low |
| `prefer-const` | 4 | Low |

---

## 2. TypeScript Compilation (tsc --noEmit)

**Status**: PASS

```bash
$ npx tsc --noEmit
# No errors
```

TypeScript compilation succeeds with no type errors.

---

## 3. Top 20 Largest Files by LOC

| Rank | File | Lines | Risk |
|------|------|-------|------|
| 1 | `lib/config/curriculum.ts` | 2,576 | High - content file, acceptable |
| 2 | `lib/services/word-bank-service.ts` | 1,547 | High - complex logic |
| 3 | `app/components/LessonRunner.tsx` | 1,395 | High - needs refactor |
| 4 | `lib/services/smart-auth-service.ts` | 1,340 | High - needs refactor |
| 5 | `app/page.tsx` | 1,203 | Medium - homepage |
| 6 | `app/components/games/GrammarFillBlank.tsx` | 1,065 | Medium |
| 7 | `components/auth/AuthModal.tsx` | 1,012 | Medium |
| 8 | `app/components/games/PersianWordRush.tsx` | 861 | Medium |
| 9 | `lib/services/lesson-progress-service.ts` | 858 | Medium |
| 10 | `lib/services/vocabulary-tracking-service.ts` | 854 | Medium |
| 11 | `components/onboarding/OnboardingModal.tsx` | 853 | Medium |
| 12 | `app/components/games/AudioSequence.tsx` | 758 | Medium |
| 13 | `app/modules/[moduleId]/[lessonId]/page.tsx` | 695 | Medium |
| 14 | `app/components/review/ReviewMemoryGame.tsx` | 675 | Medium |
| 15 | `app/components/games/GrammarConcept.tsx` | 663 | Medium |
| 16 | `lib/services/__tests__/word-bank-service.test.ts` | 631 | Low - test file |
| 17 | `lib/utils/curriculum-lexicon.ts` | 612 | Medium |
| 18 | `app/components/games/StoryConversation.tsx` | 574 | Medium |
| 19 | `app/components/games/FinalChallenge.tsx` | 566 | Medium |
| 20 | `app/components/games/AudioMeaning.tsx` | 563 | Medium |

**Total codebase**: 44,295 lines across lib/app/components

---

## 4. TODO/FIXME Comments

| File | Line | Comment | Priority |
|------|------|---------|----------|
| `lib/services/error-logging-service.ts` | 4 | `TODO: Integrate with Sentry/LogRocket in production` | High |
| `lib/services/error-logging-service.ts` | 61 | `// TODO: Integrate with Sentry` | High |
| `lib/services/error-logging-service.ts` | 64 | `// TODO: Integrate with LogRocket` | High |
| `app/api/leaderboard/route.ts` | 130 | `// TODO: Switch to anon key + RLS policy after migration is applied` | Critical |

### Why These Matter

1. **Sentry/LogRocket**: No production error visibility. When bugs occur in production, you won't know.
2. **Leaderboard anon key**: Currently uses service role key which bypasses RLS. Security risk.

### Minimal Fixes

**For Sentry** (post-launch priority):
```typescript
// Install: npm install @sentry/nextjs
// In lib/services/error-logging-service.ts
import * as Sentry from '@sentry/nextjs'
Sentry.captureException(error)
```

**For leaderboard** (launch-blocking):
```typescript
// Create RLS policy allowing SELECT on user_profiles for leaderboard fields
// Then switch from SUPABASE_SERVICE_ROLE_KEY to NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## 5. @ts-ignore/@ts-nocheck/@ts-expect-error

**Status**: PASS - None found

No TypeScript safety bypasses in the codebase.

---

## 6. eslint-disable Comments

| File | Line | Rule Disabled | Reason |
|------|------|---------------|--------|
| `components/routes/LessonRouteGuard.tsx` | 316 | `react-hooks/exhaustive-deps` | Intentional dependency exclusion |

### Why This Matters

Disabling exhaustive-deps can cause stale closure bugs. However, this is a common pattern when intentionally excluding dependencies.

### Minimal Fix

Review the specific useEffect at line 316 to ensure excluded deps are intentional:
```typescript
// components/routes/LessonRouteGuard.tsx:316
// Verify: Are all excluded dependencies truly static?
```

---

## 7. console.log/warn Statements

**Total**: 252 instances across lib/app/components

### Top Files by Console Statements

| File | Count | Impact |
|------|-------|--------|
| `lib/utils/grammar-options.ts` | 11 | Debug noise |
| `lib/services/smart-auth-service.ts` | ~15 | Performance, info leak |
| `lib/services/lesson-progress-service.ts` | ~12 | Performance |
| `lib/services/xp-service.ts` | ~10 | Performance |
| `lib/supabase/database.ts` | ~6 | Performance |

### Sample Production console.log Statements

```typescript
// lib/supabase/database.ts:195
console.log('DatabaseService.updateUserProfile called with:', { userId, updates })

// lib/services/review-session-service.ts:341
console.log(`✅ Review XP awarded: ${xpToAward} XP via unified service`)

// lib/utils/grammar-options.ts:154
console.log('🚀 [generateGrammarOptions] Function Called:', { ... })
```

### Why This Matters

1. **Performance**: Console operations are synchronous and slow
2. **Information disclosure**: Internal state visible in browser DevTools
3. **Noise**: Makes debugging harder when needed

### Minimal Fix

Use the existing `safeTelemetry` wrapper consistently:

```typescript
// lib/utils/telemetry-safe.ts exists
import { safeTelemetry } from '@/lib/utils/telemetry-safe'

// Instead of:
console.log('Message:', data)

// Use:
safeTelemetry(() => console.log('Message:', data))
```

Or, conditionally log:
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('Debug:', data)
}
```

---

## 8. @typescript-eslint/no-explicit-any (88 instances)

### High-Impact Files

| File | Line(s) | Usage | Risk |
|------|---------|-------|------|
| `lib/utils/step-uid.ts` | 86-245 | Step data access | High - all step types cast to any |
| `lib/services/smart-auth-service.ts` | 61,115,1001,1082,1092,1145,1210 | Event data, cache | Medium |
| `lib/services/auth-service.ts` | 60,97,196,223,263 | Error catching | Low |
| `app/api/webhooks/route.ts` | 77,114-176,186 | Stripe types | Medium |
| `lib/services/vocabulary-tracking-service.ts` | 47,60,74,277,328 | Database types | Medium |

### Example High-Risk `any`

**File**: `lib/utils/step-uid.ts` (line 86)

```typescript
const vocabId = (step as any).data?.vocabularyId
```

**Why it matters**: If step type changes, no compile-time error. Runtime crashes instead.

**Minimal fix**:
```typescript
// Define step data interfaces
interface FlashcardStepData {
  vocabularyId: string
}

// Use type guard
function isFlashcardStep(step: LessonStep): step is FlashcardStep {
  return step.type === 'flashcard' && 'data' in step
}
```

---

## 9. react-hooks/exhaustive-deps (37 instances)

### High-Risk Locations

| File | Line | Missing Deps |
|------|------|--------------|
| `app/components/LessonRunner.tsx` | 247 | `learnedCache`, `lessonId`, `moduleId` |
| `app/components/LessonRunner.tsx` | 359 | `steps` |
| `app/components/LessonRunner.tsx` | 410 | `completeRemediation`, `generateRemediationQuiz` |
| `app/components/LessonRunner.tsx` | 603 | `safeFindVocabularyById` |
| `app/components/LessonRunner.tsx` | 697 | `step` |
| `app/components/LessonRunner.tsx` | 780 | `replaceUserName`, `step` |

### Why This Matters

Missing dependencies can cause stale closures - the effect uses old values of state/props.

**Example bug scenario**:
```typescript
// Line 247: useEffect with missing moduleId dependency
useEffect(() => {
  loadLearnedCache(moduleId, lessonId) // Uses stale moduleId!
}, [])  // Missing moduleId, lessonId
```

If user navigates from module1 to module2, the effect won't re-run with the new moduleId.

### Minimal Fix

Either add dependencies or suppress with comment explaining why:
```typescript
// Option 1: Add dependencies
useEffect(() => {
  loadLearnedCache(moduleId, lessonId)
}, [moduleId, lessonId])

// Option 2: Suppress with reason
useEffect(() => {
  loadLearnedCache(moduleId, lessonId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // Intentionally run only on mount - moduleId/lessonId from URL params are stable
}, [])
```

---

## 10. @typescript-eslint/no-unused-vars (195 instances)

### Categories

| Pattern | Count | Impact |
|---------|-------|--------|
| Unused function parameters | ~80 | Low - often intentional (destructuring) |
| Unused imports | ~60 | Low - dead code |
| Unused variables | ~55 | Low - dead code |

### Example Cleanup (API Routes)

```typescript
// app/api/dashboard/route.ts:12
export async function GET(request: NextRequest) {  // 'request' unused
```

**Minimal fix**: Prefix with underscore
```typescript
export async function GET(_request: NextRequest) {
```

---

## 11. @next/next/no-assign-module-variable (20 instances)

### Files Affected

- `lib/services/lesson-progress-service.ts` (6 instances)
- `lib/services/module-access-service.ts` (2 instances)
- `lib/services/module-progress-service.ts` (4 instances)
- `lib/services/vocabulary-service.ts` (2 instances)
- `lib/utils/curriculum-lexicon.ts` (4 instances)

### Example

```typescript
// lib/services/lesson-progress-service.ts:424
const module = getModule(moduleId)  // 'module' is reserved in Node.js
```

### Minimal Fix

Rename variable:
```typescript
const curriculumModule = getModule(moduleId)
```

---

## Priority Fix List

### Critical (Fix Before Launch)

| Issue | File | Line | Fix |
|-------|------|------|-----|
| Leaderboard TODO (anon key) | `app/api/leaderboard/route.ts` | 130 | Switch to anon key + RLS |

### High (Fix Week 1)

| Issue | File | Line | Fix |
|-------|------|------|-----|
| Missing deps in LessonRunner | `app/components/LessonRunner.tsx` | 247,359,410 | Add deps or suppress with reason |
| Error logging integration | `lib/services/error-logging-service.ts` | 4,61,64 | Add Sentry |
| step-uid any casts | `lib/utils/step-uid.ts` | 86-245 | Add type guards |

### Medium (Fix Month 1)

| Issue | Count | Fix |
|-------|-------|-----|
| Unused variables | 195 | Prefix with `_` or remove |
| console.log in production | 252 | Use safeTelemetry wrapper |
| `no-explicit-any` | 88 | Add proper types |

### Low (Technical Debt)

| Issue | Count | Fix |
|-------|-------|-----|
| `no-assign-module-variable` | 20 | Rename `module` → `curriculumModule` |
| `no-require-imports` | 6 | Convert to dynamic import |
| Large files (>500 LOC) | 20 | Refactor when touching |

---

## Commands to Run

```bash
# Verify TypeScript compilation
npx tsc --noEmit

# Run lint
npm run lint

# Count specific issues
npm run lint 2>&1 | grep "no-explicit-any" | wc -l
npm run lint 2>&1 | grep "no-unused-vars" | wc -l

# Find console statements
grep -rn "console\.\(log\|warn\)" --include="*.ts" --include="*.tsx" lib app components | wc -l

# Find TODO/FIXME
grep -rn "TODO\|FIXME" --include="*.ts" --include="*.tsx" lib app components
```

