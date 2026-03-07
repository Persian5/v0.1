# MASTER ROUTE TO LAUNCH

**Total Steps: 6**
**Estimated Time: 1-2 hours**

These are the ONLY code changes required before launch. Everything else is configuration, content verification, or nice-to-have.

---

## Step 1: Fix Paywall Bypass on Module 3

**File**: `lib/config/curriculum.ts`

**Line**: ~1847 (Module 3 definition)

**Current Code**:
```typescript
{
  id: "module3",
  title: "Module 3: Family & Relationships",
  description: "Describe your family...",
  emoji: "👪",
  estimatedTime: "15 minutes",
  available: true,
  lessons: [
```

**Problem**: Module 3 is missing `requiresPremium: true`. The `ModuleAccessService.canAccessModule()` at line 62 defaults missing `requiresPremium` to `false`. This means FREE users can access Module 3 content without paying.

**Exact Change**: Add `requiresPremium: true,` after `available: true,`

**Minimum Acceptable**: Add the single line. Do not refactor anything else.

**Verify**:
1. Run `npm run build` (should pass)
2. Sign in as a user with NO subscription
3. Navigate to `/modules/module3/lesson1`
4. **Expected**: Premium lock modal appears
5. **Failure**: Lesson loads without paywall

---

## Step 2: Remove Hardcoded Personal User ID from Leaderboard

**File**: `app/api/leaderboard/route.ts`

**Lines**: 291-311

**Current Code**:
```typescript
// CRITICAL: For the specific user in question, always query directly for comparison
// This helps identify if it's a query issue or database replication issue
const currentUserInResults = topUsers?.find((u: LeaderboardUser) => u.display_name === 'Armee E.' || u.id === '881a4bff-589f-46b8-b4ba-517cb6822e4c')
let directQueryResult = null
if (currentUserInResults) {
  const { data: directCheck, error: directError } = await supabase
    .from('user_profiles')
    .select('total_xp, updated_at')
    .eq('id', currentUserInResults.id)
    .single()
  // ... more debug code ...
}
```

**Problem**: Contains your personal user ID (`881a4bff-589f-46b8-b4ba-517cb6822e4c`) and display name (`Armee E.`). This is debug code that exposes personal data and looks unprofessional.

**Exact Change**: Delete lines 291-311 entirely (the entire `currentUserInResults` block including the `console.log`).

**Minimum Acceptable**: Delete these 21 lines. The leaderboard will still function correctly.

**Verify**:
1. Run `npm run build` (should pass)
2. `grep -r "881a4bff" .` returns no results
3. `grep -r "Armee E" .` returns no results (except LAUNCH_AUDIT docs)
4. Visit `/leaderboard` - should load without errors

---

## Step 3: Gate Debug User ID Parameter Behind Development Mode

**File**: `app/api/leaderboard/route.ts`

**Lines**: 251-289

**Current Code**:
```typescript
// DEBUG: Always query current user directly for comparison (if user ID provided)
const debugUserId = searchParams.get('debug_user_id')
if (debugUserId) {
  // Direct single-user query...
  console.log('🔍 Direct user XP query (debug):', { ... })
}
```

**Problem**: Anyone can query `/api/leaderboard?debug_user_id=<any-uuid>` to get any user's XP and updated_at timestamp. This is information disclosure.

**Exact Change**: Wrap the entire block with `process.env.NODE_ENV === 'development'`:

```typescript
// DEBUG: Always query current user directly for comparison (if user ID provided)
if (process.env.NODE_ENV === 'development') {
  const debugUserId = searchParams.get('debug_user_id')
  if (debugUserId) {
    // ... existing code unchanged ...
  }
}
```

**Minimum Acceptable**: Add the outer `if` condition. Do not refactor the inner code.

**Verify**:
1. Run `npm run build` (should pass)
2. Deploy to Vercel preview (NODE_ENV=production in Vercel)
3. Visit `https://preview-url/api/leaderboard?debug_user_id=881a4bff-589f-46b8-b4ba-517cb6822e4c`
4. **Expected**: Response contains NO `_debug` object and no direct query results
5. **Failure**: Response contains debug data

---

## Step 4: Add Rate Limiting to Module Access Check

**File**: `app/api/check-module-access/route.ts`

**Lines**: 1-42 (entire file needs modification at top)

**Current Code**:
```typescript
import { NextRequest, NextResponse } from "next/server"
import { ModuleAccessService } from "@/lib/services/module-access-service"
import { ModuleAccessQuerySchema, safeValidate } from "@/lib/utils/api-schemas"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    // Input validation with Zod
    // ... no rate limiting ...
```

**Problem**: No rate limiting. Attackers can probe premium status rapidly. Other similar routes (`/api/check-premium`) have rate limiting.

**Exact Change**: Add rate limiting after the `try {` line:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { ModuleAccessService } from "@/lib/services/module-access-service"
import { ModuleAccessQuerySchema, safeValidate } from "@/lib/utils/api-schemas"
import { withRateLimit } from "@/lib/middleware/rate-limit-middleware"
import { RATE_LIMITS } from "@/lib/services/rate-limiter"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    // Rate limit module access checks
    const rateLimitResult = await withRateLimit(req, {
      config: RATE_LIMITS.CHECK_PREMIUM,
      keyPrefix: 'check-module-access',
      useIpFallback: false
    })
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    // Input validation with Zod
    // ... rest unchanged ...
```

**Minimum Acceptable**: Add the 4 imports and 8 lines of rate limiting code. Reuse existing `RATE_LIMITS.CHECK_PREMIUM` config (20 req/min).

**Verify**:
1. Run `npm run build` (should pass)
2. Use curl to hit endpoint 25 times rapidly:
   ```bash
   for i in {1..25}; do curl -s "http://localhost:3000/api/check-module-access?moduleId=module2" | head -c 50; echo; done
   ```
3. **Expected**: After ~20 requests, response changes to `{"error":"Too many requests"...}` with 429 status
4. **Failure**: All 25 requests return 200

---

## Step 5: Add Rate Limiting to Dashboard API

**File**: `app/api/dashboard/route.ts`

**Lines**: 1-15 (add imports and rate limit at top of handler)

**Current Code**:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getModules } from '@/lib/config/curriculum'
import { UserLessonProgress } from '@/lib/supabase/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get Supabase client with server-side auth
```

**Problem**: Dashboard fetches expensive data (progress, vocabulary stats, XP transactions). No rate limiting allows DoS via rapid requests.

**Exact Change**: Add rate limiting (same pattern as Step 4):

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getModules } from '@/lib/config/curriculum'
import { UserLessonProgress } from '@/lib/supabase/database'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { RATE_LIMITS } from '@/lib/services/rate-limiter'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Rate limit dashboard requests
    const rateLimitResult = await withRateLimit(request, {
      config: RATE_LIMITS.CHECK_PREMIUM,
      keyPrefix: 'dashboard',
      useIpFallback: false
    })
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    // Get Supabase client with server-side auth
```

**Minimum Acceptable**: Add imports and rate limiting block. Use existing config.

**Verify**:
1. Run `npm run build` (should pass)
2. Sign in and hit `/api/dashboard` 25 times rapidly
3. **Expected**: 429 after ~20 requests
4. **Failure**: All requests succeed

---

## Step 6: Verify Build and Run Smoke Test

**Files**: None (verification step)

**Commands**:
```bash
# 1. Build check
npm run build

# 2. Start local server
npm run dev

# 3. Manual smoke test checklist
```

**Smoke Test Checklist**:

| Test | Steps | Expected |
|------|-------|----------|
| Build passes | `npm run build` exits 0 | No errors |
| Homepage loads | Visit `/` | Page renders |
| Sign up works | Create new account | Email sent |
| Module 1 accessible | Complete lesson 1 step | XP awarded |
| Module 2 paywall | Click Module 2 (free user) | Premium modal |
| Module 3 paywall | Click Module 3 (free user) | Premium modal |
| Leaderboard loads | Visit `/leaderboard` | Rankings show |
| Dashboard loads | Visit `/dashboard` | Stats show |

**Minimum Acceptable**: All 8 tests pass.

**Verify**: Document any failures for immediate fix.

---

## Summary

| Step | File | Change Type | Risk if Skipped |
|------|------|-------------|-----------------|
| 1 | `lib/config/curriculum.ts` | Add 1 line | **PAYWALL BYPASS** - Free users access paid content |
| 2 | `app/api/leaderboard/route.ts` | Delete 21 lines | Personal data exposed, unprofessional |
| 3 | `app/api/leaderboard/route.ts` | Add 2 lines | User data queryable by anyone |
| 4 | `app/api/check-module-access/route.ts` | Add 10 lines | DoS vulnerability |
| 5 | `app/api/dashboard/route.ts` | Add 10 lines | DoS vulnerability |
| 6 | N/A | Verification | Unknown bugs in production |

**Total Lines Changed**: ~44 lines
**Total Lines Deleted**: ~21 lines

---

## What Is NOT Included (And Why)

| Item | Why Excluded |
|------|--------------|
| Stripe live keys | Configuration, not code. App works with test keys. |
| Privacy policy | Legal nicety, not code blocker. Can add post-launch. |
| OAuth providers | Nice-to-have, email auth works fine for web launch. |
| Error monitoring | Important but won't crash the app if missing. |
| Database backups | Supabase config, not code change. |
| Module 2-3 content verification | Content exists and renders; manual testing is separate. |
| Rate limiting on other routes | Lower risk; `/api/streak`, `/api/level`, `/api/daily-goal` are auth-protected and lightweight. |

