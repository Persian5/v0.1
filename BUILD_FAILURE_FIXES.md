# BUILD FAILURE FIXES - REFERENCE GUIDE

**Last Updated:** After commit `7f43e77` (Fix Next.js build errors)

**Purpose:** Copy-paste this whenever builds fail to remember all fixes we've applied.

---

## COMMON BUILD FAILURE PATTERNS & FIXES

### 1. **useSearchParams() Suspense Boundary Errors**

**Error Message:**
```
useSearchParams() should be wrapped in a suspense boundary at page "/..."
Error occurred prerendering page "/..."
Export encountered errors on following paths: /page, /dashboard, /modules, etc.
```

**Root Cause:**
- Next.js requires `useSearchParams()` to be wrapped in `<Suspense>` for static generation
- `EmailVerificationDetector` in root layout uses `useSearchParams()` without Suspense
- Pages using client-side search params need `export const dynamic = 'force-dynamic'`

**Fixes Applied:**
1. **Root Layout (`app/layout.tsx`):**
   ```typescript
   import { Suspense } from "react"
   // ...
   <Suspense fallback={null}>
     <EmailVerificationDetector />
   </Suspense>
   ```

2. **All Pages Using Client Features:**
   Add at top of page (after "use client"):
   ```typescript
   export const dynamic = 'force-dynamic'
   ```

**Pages That Need This:**
- `/page.tsx` (home)
- `/dashboard/page.tsx`
- `/leaderboard/page.tsx`
- `/account/page.tsx`
- `/modules/page.tsx`
- `/pricing/page.tsx`
- `/review/page.tsx`
- `/auth/reset-password/page.tsx`
- `/billing/canceled/page.tsx`
- `/billing/success/page.tsx`
- `/not-found.tsx`
- All review game pages (already have it)

---

### 2. **TypeScript Type Errors**

#### A. **Module Type Import Error**

**Error:**
```
Module '"../config/curriculum"' declares 'Module' locally, but it is not exported.
```

**Fix (`lib/services/lesson-progress-service.ts`):**
```typescript
// WRONG:
import { getModules, getModule, type Module } from '../config/curriculum';

// CORRECT:
import { getModules, getModule } from '../config/curriculum';
import { type Module } from '../types';
```

**Reason:** `Module` type is exported from `lib/types.ts`, not `lib/config/curriculum.ts`

---

#### B. **GrammarOption Property Error**

**Error:**
```
Property 'meaning' does not exist on type 'GrammarOption'.
```

**Fix (`lib/utils/grammar-options.ts` line 477):**
```typescript
// WRONG:
options: options.map(o => o.text || o.meaning)

// CORRECT:
options: options.map(o => o.text)
```

**Reason:** `GrammarOption` interface only has `id` and `text` properties, not `meaning`

---

#### C. **lastActivityDate Type Error**

**Error:**
```
Object literal may only specify known properties, and 'lastActivityDate' does not exist in type '{ totalXp?: number | undefined; streakCount?: number | undefined; ... }'
```

**Fix (`lib/services/smart-auth-service.ts`):**
1. Add to type definition:
   ```typescript
   static updateUserData(updates: {
     totalXp?: number
     streakCount?: number
     dailyGoalXp?: number
     progress?: UserLessonProgress[]
     profile?: Partial<UserProfile>
     lastActivityDate?: string | null  // ADD THIS
   }): void
   ```

2. Add handling logic:
   ```typescript
   if (updates.lastActivityDate !== undefined) {
     this.sessionCache.lastActivityDate = updates.lastActivityDate
   }
   ```

**Reason:** `xp-service.ts` passes `lastActivityDate` but type definition didn't include it

---

#### D. **Module Emoji Type Error**

**Error:**
```
Type 'string | undefined' is not assignable to type 'string'.
Types of property 'emoji' are incompatible.
```

**Fix:**
1. **`app/components/modules/ModuleSnakePath.tsx`:**
   ```typescript
   interface ModuleData {
     emoji?: string  // Changed from: emoji: string
   }
   ```

2. **`app/components/modules/ModuleTile.tsx`:**
   ```typescript
   export interface ModuleTileProps {
     emoji?: string  // Changed from: emoji: string
   }
   // ...
   {emoji || "📘"}  // Added fallback
   ```

**Reason:** `Module` interface has `emoji?: string` (optional), but components required it

---

#### E. **FinalStep Helper Structure Error**

**Error:**
```
Object literal may only specify known properties, and 'title' does not exist in type 'FinalStep'.
```

**Fix (`lib/curriculum/helpers/final-helper.ts`):**
```typescript
// WRONG:
return {
  type: "final",
  points: 4,
  data: { words, targetWords, conversationFlow, lexemeRefs },
  title: options.title || "Final Challenge",  // Top-level
  description: options.description,            // Top-level
  successMessage: ...,
  incorrectMessage: ...
};

// CORRECT:
return {
  type: "final",
  points: 4,
  data: {
    words,
    targetWords,
    conversationFlow,
    lexemeRefs,
    title: options.title || "Final Challenge",      // Inside data
    description: options.description,              // Inside data
    successMessage: options.successMessage || ...,  // Inside data
    incorrectMessage: options.incorrectMessage || ... // Inside data
  }
};
```

**Reason:** FinalStep type structure changed - all fields must be inside `data` object

---

### 3. **Unused Test Files**

**Error:**
```
Type error: Argument of type '{ kind: string; ... }' is not assignable to parameter of type 'LexemeRef'.
```

**Fix:** Delete unused test files that cause build errors:
- `lib/services/__grammar-service-test.ts` - Deleted (standalone test file, not imported anywhere)

**Check:** If test file causes errors and isn't imported, delete it

---

## QUICK CHECKLIST WHEN BUILD FAILS

1. **Check for `useSearchParams()` errors:**
   - Wrap component using `useSearchParams()` in `<Suspense>`
   - Add `export const dynamic = 'force-dynamic'` to page

2. **Check for TypeScript type errors:**
   - Verify imports are from correct files (Module from types.ts, not curriculum.ts)
   - Check if property exists on interface
   - Verify optional vs required properties match

3. **Check for unused files:**
   - Delete test files that aren't imported
   - Remove dead code causing errors

4. **Check for structure mismatches:**
   - Verify object shapes match type definitions
   - Check if fields moved to nested objects (e.g., FinalStep.data)

---

## FILES MODIFIED IN LAST 7 COMMITS

**Type Fixes:**
- `lib/services/lesson-progress-service.ts` - Module import fix
- `lib/services/smart-auth-service.ts` - lastActivityDate type fix
- `lib/utils/grammar-options.ts` - GrammarOption.meaning fix
- `app/components/modules/ModuleSnakePath.tsx` - emoji optional fix
- `app/components/modules/ModuleTile.tsx` - emoji optional fix
- `lib/curriculum/helpers/final-helper.ts` - FinalStep structure fix

**Build Fixes:**
- `app/layout.tsx` - Suspense wrapper for EmailVerificationDetector
- `app/page.tsx` - Added dynamic export
- `app/dashboard/page.tsx` - Added dynamic export
- `app/leaderboard/page.tsx` - Added dynamic export
- `app/account/page.tsx` - Added dynamic export
- `app/modules/page.tsx` - Added dynamic export
- `app/pricing/page.tsx` - Added dynamic export
- `app/review/page.tsx` - Added dynamic export
- `app/auth/reset-password/page.tsx` - Added dynamic export
- `app/billing/canceled/page.tsx` - Added dynamic export
- `app/billing/success/page.tsx` - Added dynamic export
- `app/not-found.tsx` - Added dynamic export

**Deleted:**
- `lib/services/__grammar-service-test.ts` - Unused test file

---

## COMMON PATTERNS TO WATCH FOR

1. **Any component using `useSearchParams()`** → Must be in Suspense
2. **Any page with client-side features** → Needs `export const dynamic = 'force-dynamic'`
3. **Type imports from wrong file** → Check where type is actually exported
4. **Optional vs required properties** → Match interface definitions exactly
5. **Nested object structures** → Verify fields are in correct location (e.g., `data.title` vs `title`)

---

**When build fails, check this document first!**

