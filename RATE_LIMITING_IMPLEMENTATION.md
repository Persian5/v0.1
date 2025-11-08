# API Rate Limiting Implementation

## ✅ COMPLETED

**Implementation Date:** 2025-01-08  
**Approach:** Sliding window rate limiter with in-memory storage  
**Status:** Production-ready (4/5 endpoints protected)

---

## 📊 PROTECTED ENDPOINTS

| Endpoint | Limit | Window | Priority | Status |
|----------|-------|--------|----------|--------|
| `/api/checkout` | 3 requests | 5 minutes | 🔴 HIGH | ✅ Protected |
| `/api/check-module-access` | 30 requests | 1 minute | 🟡 MEDIUM | ✅ Protected |
| `/api/user-stats` | 10 requests | 1 minute | 🟡 MEDIUM | ✅ Protected |
| `/api/check-premium` | 20 requests | 1 minute | 🟢 LOW | ✅ Protected |
| `/api/webhooks` | N/A | N/A | 🔴 HIGH | ✅ Stripe Signature (sufficient) |

---

## 🏗️ ARCHITECTURE

### **Core Components:**

1. **`lib/services/rate-limiter.ts`**
   - Sliding window algorithm
   - In-memory Map storage
   - Automatic cleanup (every 60 seconds)
   - Per-user and per-IP tracking

2. **`lib/middleware/rate-limit-middleware.ts`**
   - Next.js middleware wrapper
   - Extracts user ID or IP address
   - Returns 429 responses with `Retry-After` headers
   - Adds rate limit headers to all responses

### **Rate Limit Headers:**
- `X-RateLimit-Limit`: Max requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: ISO timestamp when limit resets
- `Retry-After`: Seconds until retry (429 responses only)

---

## 🧪 TESTING

### **Manual Testing:**

**Test 1: Checkout Rate Limit (3 req/5min)**
```bash
# In browser console (authenticated):
for (let i = 0; i < 5; i++) {
  fetch('/api/checkout', { method: 'POST' })
    .then(r => r.json())
    .then(console.log)
}
# Expected: First 3 succeed, 4th and 5th return 429
```

**Test 2: Module Access Rate Limit (30 req/min)**
```bash
# Rapid navigation test:
for (let i = 0; i < 35; i++) {
  fetch('/api/check-module-access?moduleId=module2')
    .then(r => r.json())
    .then(console.log)
}
# Expected: First 30 succeed, remaining return 429
```

**Test 3: Dashboard Stats Rate Limit (10 req/min)**
```bash
# Refresh spam test:
for (let i = 0; i < 15; i++) {
  fetch('/api/user-stats')
    .then(r => r.json())
    .then(console.log)
}
# Expected: First 10 succeed, remaining return 429
```

### **Expected 429 Response:**
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again in 45 seconds.",
  "retryAfter": 45
}
```

### **Response Headers (All Requests):**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 2025-01-08T12:35:00.000Z
```

---

## 🔧 CONFIGURATION

### **Adjusting Limits:**

Edit `lib/services/rate-limiter.ts`:

```typescript
export const RATE_LIMITS = {
  CHECKOUT: { maxRequests: 3, windowMs: 5 * 60 * 1000 },        // 3/5min
  MODULE_ACCESS: { maxRequests: 30, windowMs: 60 * 1000 },      // 30/min
  USER_STATS: { maxRequests: 10, windowMs: 60 * 1000 },         // 10/min
  CHECK_PREMIUM: { maxRequests: 20, windowMs: 60 * 1000 },      // 20/min
} as const
```

---

## 🚀 UPGRADE PATH

### **When to Upgrade to Redis:**

✅ **Current (In-Memory) is sufficient when:**
- Single Vercel instance handles traffic
- MVP/testing phase
- < 1000 users

❌ **Upgrade to Redis when:**
- Multiple Vercel instances (horizontal scaling)
- Need persistent rate limits across deployments
- > 1000 concurrent users
- Need distributed rate limiting

### **Recommended: Upstash Redis**
- Serverless-friendly
- Free tier: 10k requests/day
- Global replication
- < 5 lines of code to integrate

---

## 🔍 MONITORING

### **What to Monitor:**

1. **Rate Limit Store Size**
   ```typescript
   console.log('Rate limiter size:', rateLimiter.getSize())
   ```

2. **429 Response Rate**
   - Normal: < 1% of requests
   - Warning: 1-5% of requests
   - Alert: > 5% of requests (may indicate legitimate user issues)

3. **Endpoint-Specific Patterns**
   - **Checkout**: Should rarely hit limit (3/5min is generous)
   - **Module Access**: May hit limit during testing
   - **User Stats**: May hit limit with aggressive refreshing

---

## 🐛 TROUBLESHOOTING

### **Issue: User gets 429 unexpectedly**

**Cause:** Legitimate user behavior exceeds limit  
**Fix:** Increase limit in `RATE_LIMITS` config

### **Issue: Rate limits reset on deployment**

**Cause:** In-memory storage clears on new deployment  
**Fix:** This is expected behavior; upgrade to Redis if persistence needed

### **Issue: Rate limit not working**

**Cause:** User ID extraction failing  
**Debug:**
```typescript
// In rate-limit-middleware.ts, add logging:
console.log('Rate limit identifier:', identifier)
```

---

## 📈 METRICS (TO IMPLEMENT)

### **Future Enhancements:**

- [ ] Log all 429 responses to monitoring service
- [ ] Alert on unusual rate limit patterns
- [ ] Dashboard for rate limit metrics
- [ ] Per-endpoint usage analytics
- [ ] Automatic limit adjustment based on usage

---

## ✅ CHECKLIST

- [x] Create rate limiter service with sliding window
- [x] Create middleware for Next.js routes
- [x] Protect `/api/checkout` (HIGH RISK)
- [x] Protect `/api/check-module-access` (MEDIUM RISK)
- [x] Protect `/api/user-stats` (MEDIUM RISK)
- [x] Protect `/api/check-premium` (LOW RISK)
- [x] Add proper HTTP 429 responses
- [x] Add rate limit headers
- [x] Add retry-after headers
- [x] Document implementation
- [x] Document testing procedures
- [ ] Test in production sandbox
- [ ] Monitor for false positives

---

**Implementation Complete ✅**  
**Ready for Production Testing**

