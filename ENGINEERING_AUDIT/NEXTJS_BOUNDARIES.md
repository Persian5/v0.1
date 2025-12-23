# NEXT.JS BOUNDARIES

This document identifies App Router boundary mistakes: server/client misuse, browser API access in server context, environment variable issues, and data leakage.

---

## 1. Client Components Using Browser APIs Correctly

The codebase correctly guards browser API usage with `typeof window` checks in most places.

### Correct Patterns Found:

**File**: `lib/services/smart-auth-service.ts` (line 464)
```typescript
private static setupMidnightCheck(): void {
  if (typeof window === 'undefined') return
  // ... uses setInterval
}
```

**File**: `lib/services/xp-service.ts` (line 351)
```typescript
if (typeof window !== 'undefined' && localStorage.getItem(cacheKey)) {
```

**Status**: No immediate issues found for browser API access in server context.

---

## 2. Services Imported in Both Server and Client Contexts

### Potential Issue: Database Service in Client

**File**: `lib/supabase/database.ts`

**Issue**: This file imports from `./client` (browser client) but also has functions called from server routes.

```typescript
import { supabase } from './client'
import { createClient } from './server'
```

The file uses the browser client (`supabase`) for most operations, but some are called from server routes expecting server-side execution.

**Usage in server routes**:
- `app/api/dashboard/route.ts` does NOT use `DatabaseService` - it creates its own server client (correct)
- `lib/services/lesson-progress-service.ts` uses `DatabaseService` which uses browser client

**Risk**: When `LessonProgressService.markLessonCompleted` is called, it uses `DatabaseService` which imports the browser Supabase client. If this is ever called from a Server Component or API route, it could fail or behave unexpectedly.

**Current Status**: All calls to `LessonProgressService` appear to be from client components (LessonRunner). Not currently broken but fragile.

---

## 3. Force-Dynamic on Client Components

### Pattern Found in Multiple Files

**File**: `app/dashboard/page.tsx` (line 3)

```typescript
"use client"

export const dynamic = 'force-dynamic'
```

**Issue**: `export const dynamic = 'force-dynamic'` is a Next.js route segment config option for **Server Components and API routes**, not client components. In a `"use client"` file, this export has no effect.

**Files with this pattern**:
- `app/dashboard/page.tsx`
- `app/leaderboard/page.tsx` (if present)

**Minimal Fix**: Remove the unused export or move it to a `layout.tsx` file if you need the parent route to be dynamic.

```diff
"use client"

-export const dynamic = 'force-dynamic'

import { usePathname } from "next/navigation"
```

---

## 4. Environment Variables

### NEXT_PUBLIC Variables

All client-accessible env vars correctly use `NEXT_PUBLIC_` prefix:

```typescript
// lib/supabase/client.ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Server-Only Variables Correctly Isolated

**File**: `app/api/webhooks/route.ts` (lines 10-15)

```typescript
const must = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;
```

**Status**: Server-only variables (`STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are only accessed in API routes. No leakage to client.

---

## 5. Data Leakage from Server Routes

### Leaderboard Debug Parameter

**File**: `app/api/leaderboard/route.ts` (lines 251-289)

```typescript
const debugUserId = searchParams.get('debug_user_id')
if (debugUserId) {
  const { data: debugUser, error: debugError } = await supabase
    .from('user_profiles')
    .select('id, display_name, total_xp, updated_at')
    .eq('id', debugUserId)
    .single()
  
  console.log('🔍 Direct user XP query (debug):', { ... })
}
```

**Issue**: Any user can query any other user's XP and `updated_at` by passing `?debug_user_id=<uuid>`.

**Minimal Fix**:
```typescript
if (process.env.NODE_ENV === 'development' && debugUserId) {
  // ... debug logic
}
```

---

### Debug Response in Leaderboard

**File**: `app/api/leaderboard/route.ts` (lines 337-350)

```typescript
...(process.env.NODE_ENV === 'development' && {
  _debug: {
    supabaseUrl: supabaseUrl.substring(0, 30) + '...',
    queryResult: topUsers?.map((u: LeaderboardUser) => ({ ... })),
    queryError: (topError as { message?: string } | null)?.message || null,
    directQueryComparison: directQueryResult
  }
})
```

**Status**: Already gated behind `NODE_ENV === 'development'`. Good.

---

## 6. Server Actions Not Used (Opportunity)

The codebase uses API routes for mutations instead of Server Actions. This is fine but worth noting:

**Current pattern**:
```typescript
// Client calls API route
const response = await fetch('/api/daily-goal', {
  method: 'POST',
  body: JSON.stringify({ goal: newGoal })
})
```

**Alternative with Server Actions**:
```typescript
// lib/actions/daily-goal.ts
'use server'
export async function updateDailyGoal(goal: number) {
  // Direct database access
}
```

**Status**: Not a bug. Current approach works.

---

## 7. Cookies Access Pattern

### Correct Usage

**File**: `lib/supabase/server.ts`

```typescript
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  // ...
}
```

**File**: `app/api/webhooks/route.ts`

```typescript
import { headers } from 'next/headers'
// ...
const sig = headers().get("stripe-signature")
```

**Status**: Correct usage of `cookies()` and `headers()` in server context.

---

## 8. Client Component in Server Component Tree

### Correct Pattern

**File**: `app/layout.tsx`

The root layout correctly wraps client providers around server content:

```typescript
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          <SmartAuthProvider>  {/* Client component */}
            {children}
          </SmartAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**Status**: No issues with component tree structure.

---

## Summary

| Issue | Severity | File | Status |
|-------|----------|------|--------|
| `force-dynamic` in client component | Low | `app/dashboard/page.tsx` | No-op, remove |
| Debug param data leak | Medium | `app/api/leaderboard/route.ts` | Needs fix |
| DatabaseService client/server mix | Low | `lib/supabase/database.ts` | Works currently, fragile |
| Browser API guards | N/A | Multiple | Correct |
| Env var isolation | N/A | Multiple | Correct |
| Debug response gating | N/A | `app/api/leaderboard/route.ts` | Correct |

---

## Minimal Fixes

### Fix 1: Remove No-Op Export

**File**: `app/dashboard/page.tsx`

```diff
"use client"

-export const dynamic = 'force-dynamic'
```

---

### Fix 2: Gate Debug Parameter

**File**: `app/api/leaderboard/route.ts` (line 251)

```diff
-const debugUserId = searchParams.get('debug_user_id')
-if (debugUserId) {
+if (process.env.NODE_ENV === 'development') {
+  const debugUserId = searchParams.get('debug_user_id')
+  if (debugUserId) {
```

And add closing brace at line 290:
```diff
    })
+  }
}
```

