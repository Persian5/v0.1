# DANGERS: Security & Stability Risks

## Critical Severity

### 1. Leaderboard Uses Service Role Key (Data Leak Risk)

**File**: `app/api/leaderboard/route.ts` (lines 131-136)
**Issue**: Uses `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS entirely.
```typescript
const supabase = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // DANGER: bypasses RLS
  { auth: { persistSession: false } }
)
```

**Risk**: If query ever changes to include sensitive fields, they bypass RLS protection. The comment says "TODO: Switch to anon key + RLS policy after migration is applied".

**Recommended Fix**:
1. Create RLS policy for anonymous SELECT on `user_profiles`:
   ```sql
   CREATE POLICY "Anyone can read display_name and total_xp" ON user_profiles
   FOR SELECT USING (true)
   ```
2. Switch to anon key: `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Remove service role key from this route

**Current Mitigation**: Explicit column selection (`id, display_name, total_xp, created_at`) prevents accidental data exposure.

---

### 2. No Rate Limiting on Module Access Check

**File**: `app/api/check-module-access/route.ts`
**Issue**: No rate limiting applied, unlike `/api/check-premium` which has it.

**Risk**: Attacker can probe module access at high rate, potentially causing DB load or extracting user state.

**Recommended Fix**:
```typescript
import { withRateLimit, addRateLimitHeaders } from "@/lib/middleware/rate-limit-middleware"
import { RATE_LIMITS } from "@/lib/services/rate-limiter"

// Inside GET handler:
const rateLimitResult = await withRateLimit(req, {
  config: RATE_LIMITS.CHECK_PREMIUM, // reuse same config
  keyPrefix: 'check-module-access',
  useIpFallback: false
})
if (!rateLimitResult.allowed) return rateLimitResult.response!
```

---

### 3. Dashboard API Route Has No Rate Limiting

**File**: `app/api/dashboard/route.ts`
**Issue**: No rate limiting on dashboard data fetching.

**Risk**: Expensive queries (vocabulary performance, progress) can be hammered to exhaust DB connections.

**Recommended Fix**: Add rate limiting with moderate limit (30 req/min).

---

## High Severity

### 4. XP Idempotency Key in LocalStorage (Client-Controllable)

**File**: `lib/services/xp-service.ts` (lines 350-361)
```typescript
const cacheKey = `xp-${userId}-${idempotencyKey}`
if (typeof window !== 'undefined' && localStorage.getItem(cacheKey)) {
  return { granted: false, reason: 'cached' }
}
```

**Risk**: User can clear localStorage and potentially re-trigger XP awards. However, the database constraint prevents actual duplicate awards.

**Current Mitigation**: Database has unique constraint on `(user_id, idempotency_key)`. The localStorage check is UX optimization only; the real protection is server-side.

**Severity Note**: LOW actual risk because DB constraint enforces idempotency regardless of client state.

---

### 5. No Webhook Replay Protection (Timing Attack)

**File**: `app/api/webhooks/route.ts`
**Issue**: Stripe signature verification is present, but no timestamp validation to prevent replay attacks.

**Current Code**: `stripe.webhooks.constructEvent(body, sig, secret)` does include timestamp validation internally (rejects events older than 5 minutes by default).

**Severity Note**: MITIGATED by Stripe SDK default behavior. No action needed.

---

### 6. Unauthenticated Leaderboard Access

**File**: `app/api/leaderboard/route.ts`
**Issue**: Leaderboard is fully public (no auth check).

**Risk**: Any user can enumerate all users with XP > 0. Only exposes `display_name` and `xp`.

**Current Mitigation**:
- Only "safe" fields exposed (`display_name`, `total_xp`)
- Rate limiting in place (60 req/min)
- XSS sanitization on display names

**Severity Note**: By design - leaderboards are typically public. LOW risk.

---

## Medium Severity

### 7. In-Memory Rate Limiting (Not Distributed)

**File**: `lib/services/rate-limiter.ts`
**Issue**: Rate limits stored in process memory, not Redis/distributed store.

**Risk**: If running multiple Vercel function instances, rate limits don't sync across instances. Attacker could bypass by hitting different instances.

**Current Mitigation**: Vercel's single-region deployment means most requests hit same instance. Good enough for launch.

**Post-Launch Fix**: Migrate to Redis-backed rate limiting (Upstash) for horizontal scaling.

---

### 8. Optimistic XP Updates Without Rollback UI

**File**: `lib/services/smart-auth-service.ts` (lines 586-604)
```typescript
static addXpOptimistic(amount: number, source: string): void {
  if (!this.sessionCache) return
  const oldXp = this.sessionCache.totalXp
  this.sessionCache.totalXp += amount
  // ...
}
```

**Risk**: If database write fails, UI shows incorrect XP until page refresh.

**Current Mitigation**: `awardXpOnce` in `xp-service.ts` does rollback on error (lines 390-398).

**Severity Note**: Mitigated. The optimistic update is reversed if DB returns error.

---

### 9. Debug Logging in Leaderboard API

**File**: `app/api/leaderboard/route.ts` (lines 252-289)
```typescript
const debugUserId = searchParams.get('debug_user_id')
if (debugUserId) {
  // Direct user XP query...
}
```

**Risk**: Debug parameter allows querying specific user's XP by ID. This is data exposure.

**Recommended Fix**: Remove or gate behind `process.env.NODE_ENV === 'development'`:
```typescript
if (process.env.NODE_ENV === 'development' && debugUserId) {
  // ...
}
```

---

### 10. Story Completion Guard Only in Ref

**File**: `app/components/LessonRunner.tsx` (line 97)
```typescript
const storyCompleteGuardRef = useRef(false);
```

**Risk**: If component re-mounts (unlikely but possible), ref resets and story could be marked complete twice.

**Current Mitigation**: XP idempotency prevents duplicate awards. Lesson completion is also idempotent (upsert on `user_lesson_progress`).

**Severity Note**: LOW. Multiple safeguards prevent actual data corruption.

---

## Low Severity (Awareness Only)

### 11. Console Logging in Production

**Files**: Multiple service files
**Issue**: Extensive `console.log` and `console.warn` statements throughout codebase.

**Risk**: Performance impact from logging, potential info disclosure in browser console.

**Recommended Fix**: Use `safeTelemetry` wrapper consistently (already exists in `lib/utils/telemetry-safe.ts`).

---

### 12. No CSRF Protection on API Routes

**Files**: All `app/api/*/route.ts`
**Issue**: Next.js API routes don't have built-in CSRF protection.

**Current Mitigation**:
- All mutation routes require auth (checked via cookies)
- Stripe webhook uses signature verification
- `SameSite=Lax` cookies (Supabase default)

**Severity Note**: Modern browsers with SameSite cookies provide sufficient protection. LOW risk.

---

### 13. Email in Session Metadata (PII)

**File**: `app/api/checkout/route.ts` (line 76)
```typescript
customer_email: user.email ?? undefined,
```

**Risk**: User email sent to Stripe. This is expected behavior for subscription services.

**Severity Note**: Normal. Stripe requires customer email for receipts. No action needed.

---

## Summary Table

| Issue | Severity | Status | Action |
|-------|----------|--------|--------|
| Leaderboard service role key | Critical | Needs Fix | Switch to anon key + RLS |
| No rate limit on module access | Critical | Needs Fix | Add rate limiting |
| No rate limit on dashboard | Critical | Needs Fix | Add rate limiting |
| XP localStorage cache | High | Mitigated | DB constraint handles |
| Webhook replay | High | Mitigated | Stripe SDK handles |
| Public leaderboard | High | By Design | Acceptable |
| In-memory rate limiting | Medium | Acceptable | Post-launch Redis |
| Optimistic XP updates | Medium | Mitigated | Rollback exists |
| Debug logging in leaderboard | Medium | Needs Fix | Gate behind dev |
| Story completion ref | Medium | Mitigated | Multiple safeguards |
| Console logging | Low | Awareness | Use safeTelemetry |
| No CSRF | Low | Mitigated | SameSite cookies |
| Email to Stripe | Low | By Design | Expected |

