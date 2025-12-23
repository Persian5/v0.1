# FINAL ROUTE TO LAUNCH

**Total Steps**: 12
**Estimated Time**: 2-3 hours code changes + 1 hour testing

---

## Category Legend

- **(A) MUST FIX BEFORE LAUNCH** - Blocking. App is broken or insecure without this.
- **(B) SHOULD FIX BEFORE LAUNCH** - High risk. Likely to cause issues within first week.
- **(C) WEEK 1** - Important but can ship without. Fix in first week post-launch.

---

# (A) MUST FIX BEFORE LAUNCH

## Step 1: Fix Paywall Bypass on Module 3

**Category**: (A) MUST FIX

**File**: `lib/config/curriculum.ts` (line ~1847)

**Exact Change**: Add `requiresPremium: true,` after `available: true,` in Module 3 definition.

```diff
  {
    id: "module3",
    title: "Module 3: Family & Relationships",
    emoji: "👪",
    estimatedTime: "15 minutes",
    available: true,
+   requiresPremium: true,
    lessons: [
```

**Why**: Free users can currently access ALL Module 3 content without paying. 100% guaranteed revenue loss.

**Verify**:
```bash
npm run build  # Must pass
```
Then: Sign in with no subscription → Navigate to `/modules/module3/lesson1` → Premium lock modal appears.

---

## Step 2: Remove Hardcoded Personal Data from Leaderboard

**Category**: (A) MUST FIX

**File**: `app/api/leaderboard/route.ts` (lines 291-311)

**Exact Change**: Delete lines 291-311 entirely (the `currentUserInResults` block).

```diff
-    // CRITICAL: For the specific user in question, always query directly for comparison
-    // This helps identify if it's a query issue or database replication issue
-    const currentUserInResults = topUsers?.find((u: LeaderboardUser) => u.display_name === 'Armee E.' || u.id === '881a4bff-589f-46b8-b4ba-517cb6822e4c')
-    let directQueryResult = null
-    if (currentUserInResults) {
-      const { data: directCheck, error: directError } = await supabase
-        .from('user_profiles')
-        .select('total_xp, updated_at')
-        .eq('id', currentUserInResults.id)
-        .single()
-      
-      directQueryResult = {
-        directQueryXp: directCheck?.total_xp,
-        leaderboardXp: currentUserInResults.total_xp,
-        match: directCheck?.total_xp === currentUserInResults.total_xp
-      }
-      
-      console.log('🔍 CRITICAL: Direct XP check for Armee E.:', directQueryResult)
-    }
```

**Why**: Contains your personal UUID and display name. Exposes PII. Unprofessional.

**Verify**:
```bash
npm run build  # Must pass
grep -r "881a4bff" lib app components  # Returns nothing
```

---

## Step 3: Gate Debug Parameter Behind Development Mode

**Category**: (A) MUST FIX

**File**: `app/api/leaderboard/route.ts` (lines 251-289)

**Exact Change**: Wrap the debug block with `NODE_ENV` check.

```diff
-    // DEBUG: Always query current user directly for comparison (if user ID provided)
-    const debugUserId = searchParams.get('debug_user_id')
-    if (debugUserId) {
+    // DEBUG: Only in development mode
+    if (process.env.NODE_ENV === 'development') {
+      const debugUserId = searchParams.get('debug_user_id')
+      if (debugUserId) {
         // ... existing code unchanged ...
+      }
     }
```

**Why**: Anyone can query any user's XP via `/api/leaderboard?debug_user_id=<uuid>`. Information disclosure.

**Verify**:
```bash
npm run build  # Must pass
```
Then: Deploy to Vercel preview → Hit `/api/leaderboard?debug_user_id=any-uuid` → Response has no debug data.

---

## Step 4: Fix Direct SessionCache Null Access

**Category**: (A) MUST FIX

**File**: `lib/services/lesson-progress-service.ts` (line 228)

**Exact Change**: Replace unsafe direct access with null-safe pattern.

```diff
-      SmartAuthService['sessionCache']!.progress = updatedProgress
-      SmartAuthService.markProgressUpdated()
+      const sessionState = SmartAuthService.getSessionState()
+      if (sessionState.isReady) {
+        SmartAuthService.updateUserData({ progress: updatedProgress })
+      }
```

**Why**: If `sessionCache` is null during initialization, this throws `TypeError: Cannot set properties of null`. Crashes lesson completion.

**Verify**:
```bash
npm run build  # Must pass
```
Then: Complete a lesson → Completion screen loads without crash.

---

## Step 5: Verify Build Passes

**Category**: (A) MUST FIX

**Files**: None (verification step)

**Exact Change**: None - this is verification.

**Commands**:
```bash
npm run build
```

**Why**: All code changes above must compile.

**Verify**: Exit code 0, no build errors.

---

# (B) SHOULD FIX BEFORE LAUNCH

## Step 6: Add Rate Limiting to Module Access Check

**Category**: (B) SHOULD FIX

**File**: `app/api/check-module-access/route.ts`

**Exact Change**: Add rate limiting imports and handler.

```diff
  import { NextRequest, NextResponse } from "next/server"
  import { ModuleAccessService } from "@/lib/services/module-access-service"
  import { ModuleAccessQuerySchema, safeValidate } from "@/lib/utils/api-schemas"
+ import { withRateLimit } from "@/lib/middleware/rate-limit-middleware"
+ import { RATE_LIMITS } from "@/lib/services/rate-limiter"

  export async function GET(req: NextRequest) {
    try {
+     const rateLimitResult = await withRateLimit(req, {
+       config: RATE_LIMITS.CHECK_PREMIUM,
+       keyPrefix: 'check-module-access',
+       useIpFallback: false
+     })
+     if (!rateLimitResult.allowed) {
+       return rateLimitResult.response!
+     }
+
      // Input validation with Zod
```

**Why**: Attackers can probe premium status rapidly. Other similar routes have rate limiting.

**Risk if skipped**: DoS vulnerability. Low likelihood at launch traffic levels.

**Verify**:
```bash
npm run build  # Must pass
```

---

## Step 7: Add Rate Limiting to Dashboard API

**Category**: (B) SHOULD FIX

**File**: `app/api/dashboard/route.ts`

**Exact Change**: Add rate limiting (same pattern as Step 6).

```diff
  import { NextRequest, NextResponse } from 'next/server'
  import { createClient } from '@/lib/supabase/server'
  import { getModules } from '@/lib/config/curriculum'
  import { UserLessonProgress } from '@/lib/supabase/database'
+ import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
+ import { RATE_LIMITS } from '@/lib/services/rate-limiter'

  export async function GET(request: NextRequest) {
    try {
+     const rateLimitResult = await withRateLimit(request, {
+       config: RATE_LIMITS.CHECK_PREMIUM,
+       keyPrefix: 'dashboard',
+       useIpFallback: false
+     })
+     if (!rateLimitResult.allowed) {
+       return rateLimitResult.response!
+     }
+
      // Get Supabase client with server-side auth
```

**Why**: Dashboard fetches expensive data. No rate limiting allows DoS.

**Risk if skipped**: Same as Step 6. Low likelihood.

**Verify**:
```bash
npm run build  # Must pass
```

---

## Step 8: Run Smoke Test

**Category**: (B) SHOULD FIX

**Files**: None (verification step)

**Exact Tests**:

| # | Test | Steps | Pass Criteria |
|---|------|-------|---------------|
| 1 | Build | `npm run build` | Exit 0 |
| 2 | Homepage | Visit `/` | Page loads |
| 3 | Sign up | Create account | Verification email sent |
| 4 | Module 1 | Complete lesson 1 step | XP awarded |
| 5 | Module 2 paywall | Click Module 2 (free user) | Premium modal shows |
| 6 | Module 3 paywall | Click Module 3 (free user) | Premium modal shows |
| 7 | Leaderboard | Visit `/leaderboard` | Rankings display |
| 8 | Dashboard | Visit `/dashboard` | Stats display |

**Why**: Catch any regressions before real users hit them.

**Verify**: All 8 tests pass. Document any failures.

---

# (C) WEEK 1

## Step 9: Rename `module` Variable to Avoid Reserved Word

**Category**: (C) WEEK 1

**Files**: 
- `lib/services/lesson-progress-service.ts` (lines 424, 461, 497, 527, 575, 623)
- `lib/services/module-access-service.ts` (lines 50, 229)
- `lib/services/module-progress-service.ts` (lines 17, 49, 90, 106)
- `lib/services/vocabulary-service.ts` (lines 30, 91)
- `lib/utils/curriculum-lexicon.ts` (lines 188, 376, 416, 466)

**Exact Change**: Rename `module` → `curriculumModule` everywhere.

**Why**: ESLint warns: "Do not assign to the variable `module`" - it's reserved in Node.js.

**Risk if skipped**: Works fine. Just linter noise. No runtime risk.

**Verify**: `npm run lint` shows fewer warnings.

---

## Step 10: Remove Unused Variables

**Category**: (C) WEEK 1

**Files**: Multiple (195 instances from lint)

**Highest Impact**:
- `app/components/LessonRunner.tsx:20` - unused `ModuleProgressService` import
- `app/api/leaderboard/route.ts:24-25` - unused `cache` and `CACHE_TTL`
- All API routes with unused `request` parameter

**Exact Change**: Prefix unused params with `_` or remove unused imports.

```diff
- import { ModuleProgressService } from '@/lib/services/module-progress-service'
```

```diff
- export async function GET(request: NextRequest) {
+ export async function GET(_request: NextRequest) {
```

**Why**: Clean code. Reduces lint warnings from 429 to ~234.

**Risk if skipped**: None. Purely cosmetic.

**Verify**: `npm run lint` shows fewer warnings.

---

## Step 11: Add Missing useEffect Dependencies

**Category**: (C) WEEK 1

**File**: `app/components/LessonRunner.tsx`

**Lines**: 247, 359, 410, 603, 697, 780

**Exact Change**: Either add missing dependencies or add eslint-disable with explanation.

```diff
  useEffect(() => {
    loadLearnedCache(moduleId, lessonId)
- }, [])
+ }, [moduleId, lessonId])
```

Or with justification:
```diff
  useEffect(() => {
    loadLearnedCache(moduleId, lessonId)
+   // eslint-disable-next-line react-hooks/exhaustive-deps
+   // Intentionally run only on mount - params are from URL, stable for component lifetime
  }, [])
```

**Why**: Missing dependencies can cause stale closure bugs - effects use old values.

**Risk if skipped**: Potential bugs when navigating between lessons. Currently works because users don't navigate rapidly.

**Verify**: `npm run lint` shows 0 `react-hooks/exhaustive-deps` warnings for this file.

---

## Step 12: Remove force-dynamic from Client Component

**Category**: (C) WEEK 1

**File**: `app/dashboard/page.tsx` (line 3)

**Exact Change**: Delete the no-op export.

```diff
  "use client"

- export const dynamic = 'force-dynamic'
```

**Why**: `force-dynamic` only affects Server Components. In a `"use client"` file, it does nothing.

**Risk if skipped**: None. Just dead code.

**Verify**: `npm run build` still passes.

---

# Summary

| Step | Category | File(s) | Risk if Skipped |
|------|----------|---------|-----------------|
| 1 | (A) MUST | `lib/config/curriculum.ts` | **PAYWALL BYPASS** |
| 2 | (A) MUST | `app/api/leaderboard/route.ts` | PII exposure |
| 3 | (A) MUST | `app/api/leaderboard/route.ts` | Data leak |
| 4 | (A) MUST | `lib/services/lesson-progress-service.ts` | **CRASH** on lesson complete |
| 5 | (A) MUST | N/A | Broken deploy |
| 6 | (B) SHOULD | `app/api/check-module-access/route.ts` | DoS (low likelihood) |
| 7 | (B) SHOULD | `app/api/dashboard/route.ts` | DoS (low likelihood) |
| 8 | (B) SHOULD | N/A | Undiscovered bugs |
| 9 | (C) WEEK 1 | Multiple | None (linter noise) |
| 10 | (C) WEEK 1 | Multiple | None (linter noise) |
| 11 | (C) WEEK 1 | `LessonRunner.tsx` | Stale closure (rare) |
| 12 | (C) WEEK 1 | `app/dashboard/page.tsx` | None (dead code) |

---

# What Is NOT Included (Explicitly Excluded)

| Item | Why Excluded | Risk Accepted |
|------|--------------|---------------|
| Stripe live keys | Configuration, not code. Test keys work. | Can't collect real payments |
| Privacy policy page | Legal, not code. Not blocking web launch. | Possible legal exposure (low) |
| OAuth (Google/Apple) | Nice-to-have. Email auth works. | Higher signup friction |
| Error monitoring (Sentry) | Important but app won't crash without it. | No visibility into prod errors |
| Database backups | Supabase config, not code. | Data loss risk (Supabase has default backups) |
| Console.log cleanup (252 instances) | Doesn't break functionality. | Performance overhead, info in DevTools |
| 88 `any` type casts | TypeScript compiles. Runtime works. | Refactoring bugs (low) |
| Rate limiting on `/api/streak`, `/api/level` | Auth-protected, lightweight. | DoS (very low risk) |
| Leaderboard anon key TODO | Works with service role. | RLS bypass (controlled query) |

---

# Execution Order

```
(A) Steps 1-5: ~1 hour
    ↓
    npm run build ✓
    ↓
(B) Steps 6-8: ~30 minutes
    ↓
    Deploy to production
    ↓
(C) Steps 9-12: First week post-launch
```

---

# Final Checklist Before Deploy

- [ ] Step 1: Module 3 has `requiresPremium: true`
- [ ] Step 2: No `881a4bff` in codebase
- [ ] Step 3: Debug param gated
- [ ] Step 4: SessionCache access is null-safe
- [ ] Step 5: `npm run build` passes
- [ ] Step 6: Module access has rate limiting (optional but recommended)
- [ ] Step 7: Dashboard has rate limiting (optional but recommended)
- [ ] Step 8: Smoke test passes
- [ ] Stripe webhook URL configured in Stripe dashboard
- [ ] Environment variables set in Vercel

