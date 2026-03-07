# WHAT IS NOT READY

## Critical Missing (Launch Blockers)

### 1. Stripe Live Mode
- **Location**: `app/api/checkout/route.ts`, `app/api/webhooks/route.ts`
- **Status**: Currently test mode only (`sk_test_*`)
- **Required**: Switch `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` to live keys
- **Also Required**: Create production webhook endpoint in Stripe dashboard

### 2. Legal Pages
- **Missing Files**: `/app/privacy/page.tsx`, `/app/terms/page.tsx`
- **Why Blocking**: Legal requirement for subscription services
- **Also Missing**: Cookie consent banner, GDPR/CCPA data handling

### 3. OAuth Providers
- **Location**: `components/auth/AuthModal.tsx`
- **Missing**: Google OAuth, Apple OAuth buttons and integration
- **Impact**: Major friction for signups - diaspora users expect social auth

### 4. Production Deployment
- **Missing**: 
  - Custom domain configuration
  - Production environment variables verification
  - Database backup schedule
  - Rollback documentation

### 5. Monitoring/Alerting
- **Missing**: 
  - Error tracking (Sentry, LogRocket, etc.)
  - Uptime monitoring
  - Performance monitoring
  - Database query monitoring

### 6. Module 2-3 Content Verification
- **Location**: `lib/config/curriculum.ts`
- **Status**: Lessons exist but marked "needs verification" in checklist
- **Risk**: Premium users hitting incomplete content

---

## High Priority (Fix Week 1)

### 7. Account Management
- **Location**: `app/account/page.tsx`
- **Missing**:
  - Email change functionality
  - Account deletion (GDPR/CCPA requirement)
  - Subscription cancellation UI (currently relies on Stripe Customer Portal)

### 8. Customer Support
- **Missing**:
  - Support email (`support@iranopedia.com` referenced but not verified)
  - Contact form
  - FAQ page
  - Help documentation

### 9. Email Templates
- **Missing**:
  - Welcome email sequence
  - Payment confirmation
  - Trial expiration reminders
  - Cancellation confirmation

### 10. Analytics
- **Location**: `app/layout.tsx` - Vercel Analytics only
- **Missing**:
  - User behavior analytics (lesson completion rates)
  - Funnel tracking (signup -> lesson -> payment)
  - Business metrics dashboard

---

## Medium Priority (Fix Month 1)

### 11. Keyboard Navigation
- **Location**: All game components
- **Missing**: Keyboard shortcuts, focus management for desktop users

### 12. Cross-Browser Testing
- **Not Verified**: Safari, Firefox compatibility
- **Not Tested**: iOS Safari, Android Chrome

### 13. Performance Optimization
- **Missing**:
  - Bundle size analysis
  - Image optimization verification
  - Page load time benchmarks

### 14. Feedback Collection
- **Missing**:
  - Post-lesson rating system
  - Feature request collection
  - Bug reporting mechanism

---

## Infrastructure Gaps

### 15. Database Backups
- **Location**: Supabase dashboard
- **Status**: Not configured (checklist shows unchecked)
- **Risk**: Data loss with no recovery

### 16. CI/CD Pipeline
- **Status**: Not configured
- **Missing**:
  - Automated deployment from main branch
  - Staging environment
  - Automated tests before deploy

### 17. Rate Limiting on All Routes
- **Status**: Partial coverage
- **Missing Rate Limits**:
  - `/api/streak`
  - `/api/level`
  - `/api/daily-goal`
  - `/api/dashboard`
  - `/api/check-module-access`

---

## Content Gaps

### 18. Module 4-11 Content
- **Location**: `lib/config/curriculum.ts`
- **Status**: Module structures exist but marked `available: false`
- **Lessons Defined**: 0 filled lessons in Modules 4-11

### 19. Audio Content
- **Status**: Audio game types implemented but audio files not verified
- **Location**: `app/components/games/AudioMeaning.tsx`, `AudioSequence.tsx`

### 20. Grammar Concepts
- **Location**: `lib/config/grammar-concepts.ts`
- **Status**: Basic concepts defined, but coverage unclear

