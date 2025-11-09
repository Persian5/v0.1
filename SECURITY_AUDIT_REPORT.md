# Security Audit Report
**Date:** November 9, 2025  
**Scope:** Full-Codebase Security Analysis  
**Target:** Persian Learning App (Vercel + Supabase)  

---

## Executive Summary

This comprehensive security audit examined the entire codebase for critical, high, and medium-risk vulnerabilities across authentication, API security, data handling, and infrastructure configuration.

**Overall Risk Level:** MEDIUM-HIGH  
**Critical Issues:** 5  
**High Issues:** 8  
**Medium Issues:** 7  

**Key Findings:**
- Missing Next.js security headers (CSP, HSTS, X-Frame-Options)
- Missing global middleware for authentication and rate limiting
- Service role key used in public leaderboard API without proper justification
- Build configuration disables TypeScript and ESLint checks (masks potential issues)
- LocalStorage used for sensitive XP cache data (no encryption)
- Missing input validation on some API endpoints
- No CORS configuration specified

---

## Detailed Findings

| # | File | Line | Severity | Description | Fix Recommendation |
|---|------|------|----------|-------------|-------------------|
| 1 | `next.config.mjs` | 3-7 | **CRITICAL** | **TypeScript and ESLint disabled during builds** - `ignoreBuildErrors: true` and `ignoreDuringBuilds: true` mask type errors and linting issues that could expose vulnerabilities | Remove these flags. Fix all TypeScript errors and linting warnings. Use `skipLibCheck: true` in tsconfig.json for dependencies only. |
| 2 | `next.config.mjs` | ALL | **CRITICAL** | **Missing Next.js security headers** - No CSP, HSTS, X-Frame-Options, X-Content-Type-Options headers configured | Add security headers in next.config.mjs. See recommendation section below. |
| 3 | `app/api/leaderboard/route.ts` | 117-120 | **CRITICAL** | **Service role key used for public data** - Using `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for leaderboard data. While comments claim it's safe, this pattern is dangerous and creates attack surface | Refactor to use anon key with RLS policies. Create public read policy for `user_profiles` with only `display_name` and `total_xp` columns visible. Never use service role key in routes that don't strictly require it. |
| 4 | Missing | N/A | **CRITICAL** | **No global middleware.ts file** - No centralized authentication, rate limiting, or security header enforcement across all routes | Create `middleware.ts` at root to handle auth checks, rate limiting, and security headers globally. |
| 5 | `lib/services/xp-service.ts` | 346-358 | **CRITICAL** | **XP cache stored in localStorage without encryption** - Sensitive XP values and idempotency keys stored in plain text localStorage. User can manipulate cache values. | Implement encrypted cache or move to httpOnly cookies. Add server-side validation to reject XP values that don't match DB. Never trust client-side XP values. |
| 6 | `app/api/webhooks/route.ts` | 64-80 | **HIGH** | **Webhook signature verification happens after reading body** - While Stripe signature is verified, the body is read before verification completes. Best practice is to verify first. | Refactor to verify signature before any body processing. Consider using Next.js edge runtime for faster signature verification. |
| 7 | `app/api/leaderboard/route.ts` | 15-42 | **HIGH** | **In-memory rate limiting not production-ready** - Rate limiter uses in-memory Map which won't work across Vercel serverless instances. Each cold start resets limits. | Migrate to Vercel Edge Config, Upstash Redis, or Vercel KV for distributed rate limiting. Current implementation can be bypassed by triggering multiple cold starts. |
| 8 | `app/api/leaderboard/route.ts` | 12-13 | **HIGH** | **In-memory cache not production-ready** - Caching in serverless function memory doesn't persist across invocations. Cache will be cold on every new instance. | Use Vercel Data Cache API, Redis, or remove cache entirely (rely on Supabase indexes). Current implementation provides no real caching benefit. |
| 9 | `app/api/checkout/route.ts` | 82-96 | **HIGH** | **Stripe session creation without order validation** - No server-side validation that user should be allowed to create subscription (e.g., existing active subscription check) | Add server-side check: query `user_subscriptions` to verify user doesn't already have active subscription before creating new checkout session. |
| 10 | `supabase/migrations/create_award_step_xp_function.sql` | 66 | **HIGH** | **Database function uses SECURITY DEFINER** - Function runs with elevated privileges. While necessary here, SECURITY DEFINER functions are high-risk if not carefully audited. | Audit function for SQL injection risks. Consider adding rate limiting at DB level (e.g., max XP per minute per user). Monitor for abuse. |
| 11 | `lib/services/smart-auth-service.ts` | 346-358 | **HIGH** | **XP cache keys stored without version check** - If UID format changes, stale cache can cause XP duplication bugs | Already implemented `ensureXpCacheVersion()` - ensure this is called on app boot. Document cache versioning strategy. |
| 12 | `ENV_VARS_REQUIRED.md` | 9 | **HIGH** | **Service role key documented as required** - Increases risk of accidental exposure through misconfiguration or commits | Add `.env.example` with dummy values. Add git hooks to prevent `.env` commits. Document that service role key should ONLY be in Vercel environment variables, never in code. |
| 13 | `app/api/checkout/route.ts` | 92 | **HIGH** | **User email passed to Stripe without sanitization** - While Stripe validates emails, passing unsanitized user input directly is poor practice | Add email format validation before passing to Stripe. Use Zod or similar for validation. |
| 14 | `vercel.json` | ALL | **MEDIUM** | **No security configuration in vercel.json** - Missing rate limiting, allowed methods, security headers | Add Vercel Edge Config for rate limiting. Configure allowed HTTP methods per route. |
| 15 | `app/api/check-premium/route.ts` | 14-35 | **MEDIUM** | **Premium check has no caching** - Premium status is queried from DB on every request. Can cause performance issues and increases DB load. | Implement server-side caching (Redis/Vercel KV) with 1-5 minute TTL. Invalidate on subscription changes. |
| 16 | `lib/services/auth-service.ts` | 58-87 | **MEDIUM** | **Sign-in doesn't enforce rate limiting at service level** - While API routes have rate limiting, service can be called directly from server actions | Add rate limiting to service layer or ensure all calls go through rate-limited API routes. |
| 17 | `lib/services/auth-service.ts` | 158-190 | **MEDIUM** | **Password change doesn't enforce password strength** - No validation for password complexity, length, or common passwords | Add password strength validation. Require minimum 8 characters, mix of upper/lower/numbers. Consider using a password strength library. |
| 18 | `database_schema.md` | ALL | **MEDIUM** | **No documentation of RLS bypass patterns** - Unclear which operations use service role key vs anon key | Document all service role key usages. Create security matrix showing which operations bypass RLS and why. |
| 19 | `app/api/user-stats/route.ts` | 38-52 | **MEDIUM** | **Vocabulary stats query not optimized** - Fetching all vocabulary performance records for user without limit. Could cause performance issues for power users. | Add pagination or limit to top N records. Consider caching dashboard stats for 5-10 minutes. |
| 20 | `lib/supabase/client.ts` | 17-23 | **MEDIUM** | **Browser client config doesn't specify storage** - Default storage is localStorage which isn't secure for sensitive tokens | While Supabase handles this, explicitly configure `storage: cookieStorage` for better security. Requires server-side cookie setup. |

---

## Security Configuration Issues

### Missing Next.js Security Headers

**File:** `next.config.mjs`  
**Severity:** CRITICAL

No security headers configured. App is vulnerable to:
- Clickjacking (no X-Frame-Options)
- XSS attacks (no CSP)
- MIME sniffing (no X-Content-Type-Options)
- Protocol downgrade (no HSTS)

**Recommendation:**

```javascript
// next.config.mjs
const nextConfig = {
  // Remove these dangerous flags
  // eslint: { ignoreDuringBuilds: true },
  // typescript: { ignoreBuildErrors: true },
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com; frame-src https://js.stripe.com;",
          },
        ],
      },
    ]
  },
}
```

### Missing Global Middleware

**File:** `middleware.ts` (does not exist)  
**Severity:** CRITICAL

No global middleware for:
- Authentication enforcement
- Rate limiting across all routes
- Security header injection
- Request logging

**Recommendation:**

Create `middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Add security headers (redundant with next.config but ensures coverage)
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Rate limit all API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // TODO: Implement rate limiting
  }
  
  // Protect authenticated routes
  const protectedPaths = ['/dashboard', '/modules', '/account', '/leaderboard']
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )
  
  if (isProtectedPath) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => request.cookies.get(name)?.value,
          set: (name, value, options) => {
            response.cookies.set({ name, value, ...options })
          },
          remove: (name, options) => {
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## Database & RLS Issues

### RLS Policies - Generally Good ✅

**Analysis:** RLS policies are well-designed with proper user_id checks:
- All tables enforce `auth.uid() = user_id` checks
- No public write access
- No missing policies on sensitive tables

**Recommendations:**
1. Add public read policy for leaderboard data (display_name, total_xp only)
2. Add policy for review mode XP limits
3. Document all RLS bypass scenarios (service role usage)

### Database Triggers - SECURITY DEFINER Risk ⚠️

**Files:** 
- `database_schema.md` (lines 99-114)
- `supabase/migrations/create_award_step_xp_function.sql`

**Issue:** Two triggers and one RPC function use `SECURITY DEFINER`:
- `set_display_name()` - Auto-generates display names
- `sync_user_metadata()` - Syncs to auth.users
- `award_step_xp_idem()` - Awards XP with idempotency

**Risk Level:** MEDIUM

**Analysis:** 
- All three functions are necessary and appear secure
- No SQL injection vectors found (using parameterized inputs)
- Proper input validation exists

**Recommendations:**
1. Add rate limiting to `award_step_xp_idem` (e.g., max 100 XP awards per minute)
2. Add monitoring/logging for unusual patterns (same user calling function 1000x/minute)
3. Consider adding max XP per day cap at DB level

---

## Authentication & Session Security

### Session Handling - Good ✅

**Analysis:**
- Supabase handles JWT refresh automatically
- Tokens stored in httpOnly cookies (secure)
- Session persistence properly configured

**Recommendations:**
1. Add session timeout monitoring
2. Implement concurrent session limits (max 3 devices)
3. Add "Sign out all devices" feature

### Password Security - MEDIUM Risk ⚠️

**File:** `lib/services/auth-service.ts`

**Issues:**
- No password strength validation
- No check for common/compromised passwords
- No rate limiting on password changes

**Recommendations:**
1. Add zxcvbn or similar password strength checker
2. Integrate with HaveIBeenPwned API to block compromised passwords
3. Rate limit password changes (max 3 per hour)
4. Require re-authentication before password change

---

## API Security

### Rate Limiting - HIGH Risk ⚠️

**Current State:**
- Uses in-memory rate limiting (doesn't work in serverless)
- Each cold start resets rate limits
- Attackers can bypass by forcing new serverless instances

**Affected Endpoints:**
- `/api/checkout` - 3 req/5min (CRITICAL - payment fraud risk)
- `/api/leaderboard` - 60 req/min (in-memory, ineffective)
- `/api/check-premium` - 20 req/min
- `/api/module-access` - 50 req/min
- `/api/user-stats` - 10 req/min

**Recommendations:**

**Option 1: Upstash Redis (Recommended)**
```typescript
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis = Redis.fromEnv()
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"),
})

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")
  const { success } = await ratelimit.limit(ip ?? "anonymous")
  
  if (!success) {
    return new Response("Too Many Requests", { status: 429 })
  }
  
  // Your logic here
}
```

**Option 2: Vercel Edge Config**
- Use Vercel's built-in Edge Config for distributed state
- More expensive but no external dependencies

### Input Validation - MEDIUM Risk ⚠️

**Current State:**
- Some validation exists (`api-validation.ts`)
- Not consistently applied across all endpoints

**Missing Validation:**
- Email format in `/api/checkout`
- JSONB metadata in XP endpoints
- Display name length/content in profile updates

**Recommendations:**

Install Zod:
```bash
npm install zod
```

Example validation:
```typescript
import { z } from 'zod'

const CheckoutSchema = z.object({
  email: z.string().email().max(255),
  // Add other fields
})

export async function POST(req: Request) {
  const body = await req.json()
  
  try {
    const validated = CheckoutSchema.parse(body)
    // Use validated data
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid input' },
      { status: 400 }
    )
  }
}
```

---

## Client-Side Security

### LocalStorage Security - HIGH Risk ⚠️

**File:** `lib/services/xp-service.ts` (lines 346-358)

**Issue:** XP cache and idempotency keys stored in localStorage:
```typescript
localStorage.setItem(cacheKey, '1')  // XP award tracking
localStorage.setItem('xp-cache-version', XP_CACHE_VERSION)
```

**Risks:**
1. **XSS Vulnerability:** If XSS vulnerability exists, attacker can read/modify XP cache
2. **User Manipulation:** User can manually edit localStorage to claim XP already earned
3. **No Encryption:** Plain text storage of game state

**Current Mitigation:**
- Server validates all XP awards via `award_step_xp_idem` RPC
- Idempotency keys prevent duplicate awards
- Cache is only for UX optimization

**Recommendations:**
1. **Keep current implementation** (cache is already validated server-side)
2. Add integrity check: store HMAC of cache keys
3. Add client-side tampering detection
4. Document that localStorage cache is untrusted optimization only

### No dangerouslySetInnerHTML Usage ✅

**Analysis:** Grep search found zero instances of `dangerouslySetInnerHTML`. Good practice.

### No eval() or new Function() ✅

**Analysis:** No dynamic code execution found. Good practice.

---

## Dependency Security

### Package Versions - MEDIUM Risk ⚠️

**File:** `package.json`

**Analysis:**
- Using Next.js 14.2.18 (latest is 14.2.x - OK)
- Supabase packages up to date
- Stripe SDK up to date
- No obviously outdated packages

**Recommendations:**
1. Run `npm audit` to check for known vulnerabilities
2. Update to Next.js 15 once stable (includes better security features)
3. Enable Dependabot alerts on GitHub
4. Set up automated security updates

**Run these commands:**
```bash
npm audit
npm audit fix
```

---

## Infrastructure & Configuration

### Vercel Configuration - MEDIUM Risk ⚠️

**File:** `vercel.json`

**Current State:**
- Minimal configuration
- No security hardening
- No rate limiting configuration

**Recommendations:**

```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "next dev",
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 10,
      "memory": 1024
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

### Environment Variable Security ✅

**Analysis:**
- Service role key properly server-only
- No `NEXT_PUBLIC_` prefixes on secrets
- Documentation warns against committing secrets

**Recommendations:**
1. Create `.env.example` with dummy values
2. Add git hooks to prevent `.env` commits
3. Rotate all secrets before production launch

---

## Top 10 Most Severe Risks

### 1. 🔴 CRITICAL: Build Configuration Disables Error Checking
**File:** `next.config.mjs`  
**Impact:** Masks type errors and linting issues that could expose vulnerabilities  
**Fix:** Remove `ignoreBuildErrors` and `ignoreDuringBuilds` flags. Fix all errors.

### 2. 🔴 CRITICAL: Missing Security Headers
**File:** `next.config.mjs`  
**Impact:** App vulnerable to XSS, clickjacking, MIME sniffing attacks  
**Fix:** Add comprehensive security headers (see recommendations above)

### 3. 🔴 CRITICAL: No Global Middleware
**File:** Missing `middleware.ts`  
**Impact:** No centralized auth enforcement, rate limiting, or security controls  
**Fix:** Create middleware.ts with auth checks and rate limiting

### 4. 🔴 CRITICAL: Service Role Key in Public API
**File:** `app/api/leaderboard/route.ts`  
**Impact:** Bypasses RLS, creates attack surface if endpoint is compromised  
**Fix:** Use anon key with public RLS policy instead

### 5. 🔴 CRITICAL: LocalStorage XP Cache Unencrypted
**File:** `lib/services/xp-service.ts`  
**Impact:** Users can manipulate cache, potential XP exploits  
**Fix:** Add integrity checks or move to httpOnly cookies (though current server validation mitigates most risk)

### 6. 🟠 HIGH: In-Memory Rate Limiting Ineffective
**File:** `app/api/leaderboard/route.ts`, rate-limit middleware  
**Impact:** Rate limits can be bypassed, payment fraud risk on checkout endpoint  
**Fix:** Migrate to Upstash Redis or Vercel KV for distributed rate limiting

### 7. 🟠 HIGH: Stripe Checkout Without Order Validation
**File:** `app/api/checkout/route.ts`  
**Impact:** Users could create multiple subscriptions, billing issues  
**Fix:** Check for existing active subscription before creating checkout session

### 8. 🟠 HIGH: Database Function Uses SECURITY DEFINER
**File:** `create_award_step_xp_function.sql`  
**Impact:** If function has vulnerability, attackers have elevated privileges  
**Fix:** Add rate limiting, monitoring, and audit function for SQL injection

### 9. 🟠 HIGH: Password Change Without Strength Validation
**File:** `lib/services/auth-service.ts`  
**Impact:** Users can set weak passwords, account takeover risk  
**Fix:** Add password strength validation and check against compromised password databases

### 10. 🟡 MEDIUM: Premium Check Has No Caching
**File:** `app/api/check-premium/route.ts`  
**Impact:** Performance issues, increased DB load, DDoS vector  
**Fix:** Implement Redis caching with 1-5 minute TTL

---

## Practical Next Steps

### Phase 1: Critical Fixes (Week 1)
1. ✅ Add security headers to `next.config.mjs`
2. ✅ Create `middleware.ts` with auth enforcement
3. ✅ Remove `ignoreBuildErrors` and fix all TypeScript errors
4. ✅ Refactor leaderboard API to use anon key + RLS policy
5. ✅ Run `npm audit` and fix all critical/high vulnerabilities

### Phase 2: High Priority (Week 2)
1. ✅ Migrate to Upstash Redis for rate limiting
2. ✅ Add subscription validation to checkout endpoint
3. ✅ Implement password strength validation
4. ✅ Add caching to premium check endpoint
5. ✅ Add monitoring for database SECURITY DEFINER functions

### Phase 3: Hardening (Week 3)
1. ✅ Add Zod validation to all API endpoints
2. ✅ Implement session timeout and concurrent session limits
3. ✅ Add integrity checks to XP localStorage cache
4. ✅ Set up Dependabot and automated security updates
5. ✅ Create security documentation and incident response plan

### Phase 4: Pre-Launch (Week 4)
1. ✅ Rotate all API keys and secrets
2. ✅ Security pen-test by external auditor
3. ✅ Load testing with realistic traffic patterns
4. ✅ Set up monitoring and alerting for security events
5. ✅ Create backup and disaster recovery plan

---

## Additional Recommendations

### Security Monitoring

Set up monitoring for:
- Failed authentication attempts (>5 in 5 minutes)
- Unusual XP awards (>1000 XP in 1 minute)
- Webhook signature failures
- Rate limit breaches
- Database SECURITY DEFINER function calls

**Tools:**
- Sentry for error tracking
- Vercel Analytics for performance
- Supabase logs for database anomalies
- Custom alerting via Discord/Slack webhooks

### Security Testing

Before launch:
1. **Manual penetration testing:**
   - Try SQL injection on all endpoints
   - Test XSS in all user inputs (display names, etc.)
   - Test CSRF on state-changing operations
   - Test rate limiting bypasses

2. **Automated scanning:**
   - OWASP ZAP scan
   - npm audit
   - Dependabot alerts

3. **Load testing:**
   - Simulate 1000 concurrent users
   - Test rate limiting under load
   - Verify serverless functions scale properly

### Compliance Considerations

If handling user data from EU citizens:
- ✅ Privacy policy needed
- ✅ Cookie consent needed (if using analytics)
- ✅ Data export functionality needed (GDPR)
- ✅ Data deletion functionality needed (GDPR)

---

## Conclusion

**Overall Assessment:** The application has a solid foundation but requires immediate attention to critical infrastructure security (headers, middleware, rate limiting) before production launch.

**Key Strengths:**
- ✅ Well-designed RLS policies
- ✅ Proper use of Supabase auth with httpOnly cookies
- ✅ No XSS vectors found (no dangerouslySetInnerHTML)
- ✅ Input validation framework exists
- ✅ Idempotent XP system prevents duplication

**Key Weaknesses:**
- ❌ Missing security headers (critical for production)
- ❌ Missing global middleware (critical for auth enforcement)
- ❌ Rate limiting ineffective in serverless (payment fraud risk)
- ❌ Build configuration masks errors (technical debt)

**Recommendation:** Do NOT launch to production until Phase 1 critical fixes are complete. The app is not production-ready in its current state.

**Estimated Effort:** 2-3 weeks of focused security work to reach production-ready state.

---

**Report Generated:** November 9, 2025  
**Auditor:** Security Analysis AI  
**Next Review:** After Phase 1 fixes (1 week)

