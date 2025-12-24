# Future Prompts Library

> **Purpose**: Battle-tested prompts for maintaining the Persian language learning app post-launch.
> **Created**: December 24, 2024
> **Stack**: Next.js 14 App Router, TypeScript, Supabase (RLS), Stripe, Vercel

---

## Table of Contents

1. [Adding New Lesson Content Safely](#1-adding-new-lesson-content-safely)
2. [Debugging Production-Only Errors](#2-debugging-production-only-errors)
3. [Adding a New Game/Question Type](#3-adding-a-new-gamequestion-type)
4. [Performance Optimization](#4-performance-optimization)
5. [Security Hardening & Abuse Prevention](#5-security-hardening--abuse-prevention)
6. [Database Schema Changes & Migrations](#6-database-schema-changes--migrations)
7. [Feature Additions](#7-feature-additions)
8. [Refactoring Large Files Safely](#8-refactoring-large-files-safely)
9. [Incident Response & Hotfixes](#9-incident-response--hotfixes)
10. [Pre-Release Validation](#10-pre-release-validation)

---

## 1. Adding New Lesson Content Safely

### When to Use
- Adding a new lesson to an existing module
- Adding a new module with lessons
- Adding vocabulary to existing lessons

### Prompt

```
You are helping add new lesson content to a Persian language learning app.

**Context:**
- Next.js 14 App Router with TypeScript
- All lesson content lives in lib/config/curriculum.ts
- Vocabulary is created via createVocabulary() helper in lib/config/vocabulary-builder.ts
- Lesson steps use helpers from lib/config/curriculum-helpers.ts
- Sequential unlocking: lessons unlock after previous lesson completion

**ALLOWED files to modify:**
- lib/config/curriculum.ts (add lessons/modules here)
- lib/config/vocabulary-builder.ts (only if new vocab patterns needed)
- public/audio/ (add new audio files)

**FORBIDDEN:**
- Do NOT modify any service files in lib/services/
- Do NOT modify any component files in app/components/
- Do NOT change module access logic or premium gates
- Do NOT modify database schema

**Task: Add [DESCRIBE YOUR LESSON HERE]**

**Step-by-step:**
1. First, read lib/config/curriculum.ts to understand the existing structure
2. Read lib/config/curriculum-helpers.ts to see available step types
3. Create vocabulary items using createVocabulary() pattern
4. Add lesson steps using helpers: flashcard(), vocabQuiz(), input(), audioMeaning(), audioSequence(), textSequence(), matching(), final()
5. Ensure all vocabulary IDs are unique and follow pattern: [word]-[lesson#] or [word]
6. Add lesson to the correct module's lessons array
7. Set requiresPremium: true if this is module 3+

**Required outputs:**
1. The exact code changes to lib/config/curriculum.ts
2. List of audio files needed (format: /audio/[word].mp3)
3. Summary of vocabulary count and step count

**Verification checklist:**
- [ ] npm run build passes
- [ ] npm run lint passes
- [ ] Navigate to the new lesson in browser
- [ ] Complete lesson start to finish
- [ ] Verify XP is awarded
- [ ] Verify lesson shows as completed in dashboard

**If something breaks:**
- Revert changes to lib/config/curriculum.ts
- Run: git checkout lib/config/curriculum.ts
```

---

## 2. Debugging Production-Only Errors

### When to Use
- Error appears in Vercel logs but not locally
- Users report issues you cannot reproduce
- Supabase errors in production

### Prompt

```
You are debugging a production-only error in a Next.js App Router application.

**Context:**
- Next.js 14 App Router, deployed on Vercel
- Supabase backend with RLS policies enabled
- Environment variables differ between dev and prod
- Some routes use 'force-dynamic' export

**Error description:**
[PASTE THE EXACT ERROR FROM VERCEL LOGS HERE]

**When it happens:**
[DESCRIBE: which page, what user action, authenticated vs guest]

**ALLOWED investigation:**
- Read any file in the codebase
- Check environment variable usage
- Analyze Supabase RLS policies in rls_policies.md
- Check database schema in database_schema.md

**FORBIDDEN:**
- Do NOT make changes yet - diagnosis only
- Do NOT modify auth logic without explicit approval
- Do NOT modify payment/Stripe logic

**Step-by-step investigation:**
1. Identify the file and line from the error stack trace
2. Check if the error involves:
   - Supabase client (lib/supabase/client.ts vs lib/supabase/server.ts)
   - Missing environment variables
   - RLS policy blocking access
   - Null/undefined assumptions
   - Server vs client boundary issues
3. Check if 'use client' / 'use server' directives are correct
4. Check if window/localStorage is accessed on server
5. Compare env vars in .env.local vs Vercel dashboard

**Required outputs:**
1. Root cause analysis (exact file + line + reason)
2. Proposed fix (minimal diff)
3. Why this doesn't happen locally
4. Verification steps for the fix

**Verification checklist:**
- [ ] Fix reproduced locally (if possible)
- [ ] npm run build passes
- [ ] Deploy to Vercel preview branch
- [ ] Test the specific user flow that triggered error
- [ ] Check Vercel logs for 30 minutes post-deploy

**If fix doesn't work:**
- Revert via Vercel dashboard (Deployments > ... > Rollback)
- Or: git revert [commit] && git push
```

---

## 3. Adding a New Game/Question Type

### When to Use
- Creating a new interactive lesson step type
- Adding a new review game mode

### Prompt

```
You are adding a new game/question type to a Persian language learning app.

**Context:**
- Existing game components in app/components/games/
- Step types defined in lib/types.ts
- Curriculum helpers in lib/config/curriculum-helpers.ts
- Word bank generation in lib/services/word-bank-service.ts
- XP rewards defined in lib/services/xp-service.ts

**New game type: [DESCRIBE THE GAME]**

**ALLOWED files to modify:**
- lib/types.ts (add new step type interface)
- app/components/games/[NewGame].tsx (create new component)
- lib/config/curriculum-helpers.ts (add helper function)
- app/components/LessonRunner.tsx (add rendering case)
- lib/services/xp-service.ts (add XP reward if needed)

**FORBIDDEN:**
- Do NOT modify existing game components (except imports)
- Do NOT change XP values for existing activities
- Do NOT modify auth or payment logic
- Do NOT change database schema

**Step-by-step:**
1. Read lib/types.ts to understand existing step type patterns
2. Read 2-3 existing game components to understand patterns:
   - Props: vocabularyItem, onComplete, onXpStart, onVocabTrack
   - Audio playback via AudioService
   - Animation patterns with framer-motion
3. Define the new step type interface in lib/types.ts
4. Create the game component following existing patterns
5. Add helper function in lib/config/curriculum-helpers.ts
6. Add rendering case in LessonRunner.tsx switch statement
7. Add XP reward type if needed

**Component requirements:**
- Must accept onComplete callback and call it when done
- Must handle vocabulary tracking via onVocabTrack
- Must be responsive (mobile-first)
- Must handle loading/error states
- Must follow existing animation patterns

**Required outputs:**
1. New type definition in lib/types.ts
2. New component file app/components/games/[Name].tsx
3. Helper function in lib/config/curriculum-helpers.ts
4. LessonRunner.tsx case addition
5. Example usage in curriculum

**Verification checklist:**
- [ ] npm run build passes
- [ ] npm run lint passes
- [ ] Component renders without errors
- [ ] Completes and awards XP
- [ ] Works on mobile viewport
- [ ] Keyboard/screen reader accessible
- [ ] Audio plays correctly (if applicable)

**If something breaks:**
- Remove the new component file
- Revert changes to LessonRunner.tsx, types.ts, curriculum-helpers.ts
```

---

## 4. Performance Optimization

### When to Use
- Dashboard or lesson pages load slowly
- Bundle size is too large
- Unnecessary re-renders observed

### Prompt

```
You are optimizing performance in a Next.js App Router application.

**Context:**
- Next.js 14 App Router with client/server components
- Heavy components: LessonRunner.tsx (1300+ LOC), curriculum.ts (2500+ LOC)
- Services use in-memory caching (SmartAuthService)
- Supabase queries should use proper indexes

**Target area: [SPECIFY: bundle size / render performance / API speed / specific page]**

**ALLOWED optimizations:**
- Add React.memo() to pure components
- Add useMemo/useCallback where dependencies are stable
- Lazy load heavy components with dynamic imports
- Optimize Supabase queries (add .select() columns, add .limit())
- Move client components to server where possible

**FORBIDDEN:**
- Do NOT change component behavior or features
- Do NOT modify auth flow
- Do NOT change payment logic
- Do NOT remove error handling
- Do NOT change API response shapes

**Step-by-step:**
1. Identify the bottleneck:
   - For bundle: run `npm run build` and check .next/analyze (if enabled)
   - For renders: add console.log to suspect components
   - For API: check Supabase dashboard for slow queries
2. Propose optimization with minimal diff
3. Measure before/after

**Safe optimization patterns:**
- dynamic(() => import('./HeavyComponent'), { ssr: false })
- React.memo(Component) for list items
- useMemo for expensive computations
- useCallback for handlers passed to children
- Add .select('id, name') instead of .select('*')

**Required outputs:**
1. Before/after metrics (load time, bundle size, or render count)
2. Exact files and changes
3. Explanation of why this is safe

**Verification checklist:**
- [ ] npm run build passes
- [ ] No TypeScript errors
- [ ] Feature still works exactly the same
- [ ] Lighthouse score same or better
- [ ] Test on mobile device

**If performance degrades:**
- Revert the specific optimization
- Some optimizations (memo) can hurt if props change frequently
```

---

## 5. Security Hardening & Abuse Prevention

### When to Use
- Suspected XP farming or cheating
- Rate limiting needed
- RLS policy gaps found
- API abuse detected

### Prompt

```
You are hardening security for a gamified learning app with payments.

**Context:**
- Supabase with RLS policies (see rls_policies.md)
- Stripe webhooks for payments
- XP system with idempotency keys
- Rate limiting in lib/services/rate-limiter.ts
- API routes in app/api/

**Security concern: [DESCRIBE THE ISSUE]**

**ALLOWED modifications:**
- lib/services/rate-limiter.ts (adjust limits)
- lib/middleware/rate-limit-middleware.ts
- app/api/*/route.ts (add validation, rate limiting)
- Supabase RLS policies (via SQL in Supabase dashboard)

**FORBIDDEN:**
- Do NOT change core auth flow
- Do NOT modify Stripe webhook verification
- Do NOT remove existing security measures
- Do NOT expose service role key to client

**Security checklist to review:**
1. All API routes check authentication
2. All Supabase queries use RLS (not service role) where possible
3. XP awards use idempotency keys
4. Lesson completion is verified server-side
5. Rate limiting on sensitive endpoints
6. Input validation on all user inputs

**Step-by-step:**
1. Identify the attack vector
2. Check existing protections
3. Propose minimal fix that blocks the attack
4. Ensure legitimate users aren't affected

**Required outputs:**
1. Exact vulnerability description
2. Proposed fix with code
3. Test case to verify fix works
4. Test case to verify legitimate use still works

**Verification checklist:**
- [ ] Attack vector is blocked
- [ ] Legitimate user flow still works
- [ ] npm run build passes
- [ ] No new errors in logs
- [ ] Rate limits don't affect normal usage

**If security fix causes issues:**
- Can temporarily increase rate limits
- Check if RLS is too restrictive
- Add logging to understand blocked requests
```

---

## 6. Database Schema Changes & Migrations

### When to Use
- Adding a new feature requiring new tables/columns
- Fixing schema issues
- Adding indexes for performance

### Prompt

```
You are making database schema changes for a Supabase PostgreSQL database.

**Context:**
- Supabase PostgreSQL with RLS enabled
- Schema documented in database_schema.md
- RLS policies documented in rls_policies.md
- TypeScript types in lib/supabase/database.ts
- Production database has real user data

**Schema change needed: [DESCRIBE THE CHANGE]**

**ALLOWED:**
- Add new tables
- Add new columns (with defaults for existing rows)
- Add indexes
- Add RLS policies
- Update lib/supabase/database.ts types

**FORBIDDEN:**
- Do NOT drop tables
- Do NOT drop columns with data
- Do NOT modify existing column types without migration plan
- Do NOT disable RLS
- Do NOT use service role key in client code

**Step-by-step:**
1. Read database_schema.md to understand current schema
2. Write migration SQL (additive changes only)
3. Write RLS policy for new tables/columns
4. Update TypeScript types in lib/supabase/database.ts
5. Test in Supabase local or staging first

**Migration SQL template:**
-- Add column (safe - has default)
ALTER TABLE table_name 
ADD COLUMN new_column TEXT DEFAULT 'value';

-- Add table
CREATE TABLE new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own data" ON new_table
  FOR ALL USING (auth.uid() = user_id);

-- Add index
CREATE INDEX idx_table_column ON table_name(column_name);

**Required outputs:**
1. Migration SQL (copy-paste ready for Supabase SQL editor)
2. Updated TypeScript types for lib/supabase/database.ts
3. Updated database_schema.md documentation
4. Updated rls_policies.md if new policies added

**Verification checklist:**
- [ ] Run migration in Supabase staging first
- [ ] Verify RLS works (test as authenticated user)
- [ ] Update TypeScript types
- [ ] npm run build passes
- [ ] App still works with schema change
- [ ] Existing data is not affected

**If migration fails:**
- Additive changes are safe to retry
- For column additions with issues:
  ALTER TABLE table_name DROP COLUMN new_column;
- For new tables:
  DROP TABLE new_table;
```

---

## 7. Feature Additions

### When to Use
- Adding new dashboard widgets
- Extending streak/XP features
- Adding leaderboard features

### Prompt

```
You are adding a new feature to the Persian language learning app.

**Context:**
- Dashboard at app/dashboard/page.tsx
- Dashboard widgets in app/components/dashboard/
- Services in lib/services/ (XpService, StreakService, etc.)
- Hooks in hooks/ (useXp, useStreak, useLevel, etc.)
- API routes in app/api/

**New feature: [DESCRIBE THE FEATURE]**

**ALLOWED modifications:**
- app/components/dashboard/ (new widgets)
- app/dashboard/page.tsx (add widget)
- lib/services/ (extend existing services)
- hooks/ (new hooks)
- app/api/ (new endpoints)

**FORBIDDEN:**
- Do NOT modify auth flow
- Do NOT modify payment/Stripe logic
- Do NOT change XP calculation formulas
- Do NOT change lesson progression logic
- Do NOT modify LessonRunner.tsx

**Step-by-step:**
1. Understand existing patterns:
   - Read similar dashboard widget
   - Read similar service
   - Read similar hook
2. Create new service method if needed
3. Create new API route if server data needed
4. Create new hook for state management
5. Create new widget component
6. Add widget to dashboard

**Component patterns to follow:**
- Use skeleton loading states
- Handle error states gracefully
- Use SmartAuthService for cached data when possible
- Follow existing Tailwind styling
- Mobile-responsive design

**Required outputs:**
1. New/modified service methods
2. New API route (if needed)
3. New hook (if needed)
4. New widget component
5. Dashboard integration

**Verification checklist:**
- [ ] npm run build passes
- [ ] npm run lint passes
- [ ] Widget renders on dashboard
- [ ] Loading state shows skeleton
- [ ] Error state is handled
- [ ] Works on mobile
- [ ] Data refreshes correctly

**If feature breaks dashboard:**
- Remove widget from dashboard/page.tsx
- Widget is isolated, won't affect other components
```

---

## 8. Refactoring Large Files Safely

### When to Use
- LessonRunner.tsx is too large (1300+ LOC)
- curriculum.ts needs organization
- Service files are getting unwieldy

### Prompt

```
You are refactoring a large file in a production Next.js application.

**Context:**
- Production app with real users
- No test coverage for most files
- Cannot afford breaking changes

**File to refactor: [SPECIFY FILE PATH]**

**ALLOWED refactoring:**
- Extract helper functions to new files
- Extract sub-components to new files
- Extract types to separate type files
- Add barrel exports (index.ts)

**FORBIDDEN:**
- Do NOT change any external interfaces (props, return types)
- Do NOT change behavior
- Do NOT rename exported functions/components
- Do NOT change import paths in other files (yet)

**Safe refactoring strategy:**
1. PHASE 1: Extract to new files, keep originals as re-exports
2. PHASE 2: (Later) Update imports across codebase
3. PHASE 3: (Later) Remove re-exports

**Step-by-step:**
1. Identify extraction candidates (functions used only internally)
2. Create new file with extracted code
3. Import back into original file
4. Re-export from original file (maintains backward compatibility)
5. Verify build passes after each extraction

**Example safe extraction:**
// Before: app/components/LessonRunner.tsx (1300 LOC)

// After:
// app/components/lesson-runner/hooks/useLessonState.ts
// app/components/lesson-runner/utils/stepResolvers.ts
// app/components/LessonRunner.tsx (now 800 LOC, imports above)

**Required outputs:**
1. List of extractions with file paths
2. Each new file
3. Updated original file with imports
4. Verify no external interface changes

**Verification checklist:**
- [ ] npm run build passes after EACH extraction
- [ ] npm run lint passes
- [ ] All lesson types still work
- [ ] No TypeScript errors
- [ ] Git diff shows only file moves, no logic changes

**If refactor breaks something:**
- Revert the specific extraction
- Extraction is isolated, won't cascade
- git checkout [original-file]
```

---

## 9. Incident Response & Hotfixes

### When to Use
- Production is down or broken
- Users cannot complete lessons
- Payment flow is broken
- Auth is broken

### Prompt

```
INCIDENT RESPONSE - PRODUCTION ISSUE

**Severity: [CRITICAL / HIGH / MEDIUM]**
**Issue: [DESCRIBE WHAT IS BROKEN]**
**Impact: [WHO IS AFFECTED, HOW MANY USERS]**
**Started: [WHEN DID THIS START]**

**Context:**
- Production on Vercel
- Supabase database
- Stripe for payments

**IMMEDIATE ACTIONS (in order):**

1. **ASSESS** (2 minutes max)
   - Is it affecting all users or some?
   - Is it a specific page or feature?
   - Check Vercel logs: vercel.com/[team]/[project]/logs
   - Check Supabase logs: supabase.com dashboard

2. **COMMUNICATE** (if needed)
   - Update status page / social media
   - "We're aware of [issue] and working on it"

3. **IDENTIFY ROOT CAUSE**
   [PASTE ERROR LOGS HERE]

**ALLOWED hotfix actions:**
- Revert to last known good deployment (Vercel dashboard)
- Disable specific feature via environment variable
- Add error boundary to prevent cascade
- Fix obvious null/undefined issues

**FORBIDDEN during incident:**
- Major refactors
- New features
- Database migrations
- Auth changes

**Hotfix process:**
1. Create hotfix branch: git checkout -b hotfix/[issue]
2. Make MINIMAL fix
3. Test locally
4. Push and deploy to preview
5. Verify fix in preview
6. Merge to main
7. Monitor for 30 minutes

**Quick rollback options:**
- Vercel: Dashboard > Deployments > Previous > "..." > Promote to Production
- Git: git revert HEAD && git push

**Required outputs:**
1. Root cause
2. Hotfix code (minimal)
3. Verification that fix works
4. Post-mortem notes

**Post-incident:**
- [ ] Document what happened
- [ ] Document root cause
- [ ] Create ticket for proper fix
- [ ] Add monitoring/alerting if needed
```

---

## 10. Pre-Release Validation

### When to Use
- Before deploying to production
- After major changes
- Before launch day

### Prompt

```
You are validating a release before deployment to production.

**Context:**
- Next.js 14 App Router on Vercel
- Supabase with RLS
- Stripe payments
- Solo founder - cannot afford rollbacks

**VALIDATION CHECKLIST:**

**1. Build Validation**
Run and verify:
npm run build
npm run lint
npm run typecheck (or tsc --noEmit)

All must pass with zero errors.

**2. Critical User Flows (Manual Test)**

FREE USER FLOW:
- [ ] Landing page loads
- [ ] Sign up works
- [ ] Email verification works
- [ ] Module 1, Lesson 1 accessible
- [ ] Can complete a lesson
- [ ] XP is awarded
- [ ] Dashboard shows progress
- [ ] Module 2+ shows premium lock

PREMIUM USER FLOW:
- [ ] Payment flow works (Stripe test mode)
- [ ] Webhook updates subscription
- [ ] Premium modules unlock
- [ ] Can complete premium lesson

AUTH EDGE CASES:
- [ ] Sign out works
- [ ] Sign back in shows progress
- [ ] Password reset works

**3. Database Verification**
Check Supabase dashboard:
- [ ] No failed queries in logs
- [ ] RLS policies active
- [ ] No service role key exposure

**4. Environment Variables**
Verify in Vercel:
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY (not NEXT_PUBLIC_)
- [ ] STRIPE_SECRET_KEY (not NEXT_PUBLIC_)
- [ ] STRIPE_WEBHOOK_SECRET
- [ ] All match production values

**5. Security Checks**
- [ ] grep -r "SUPABASE_SERVICE_ROLE" shows only in app/api/
- [ ] grep -r "STRIPE_SECRET" shows only in app/api/
- [ ] No console.log with sensitive data

**Required outputs:**
1. Build log (success)
2. Lint log (success)
3. Manual test results (all boxes checked)
4. Ready/Not Ready verdict

**If NOT ready:**
List specific blockers and required fixes before deploy.

**Go/No-Go Decision:**
- All checklist items must pass
- Any Critical issue = NO GO
- Any High issue = discuss, likely NO GO
- Medium/Low issues = document and proceed with monitoring
```

---

## Quick Reference

| Situation | Use Prompt # |
|-----------|--------------|
| Adding new Persian words/lessons | 1 |
| Error only in production | 2 |
| New game mechanic needed | 3 |
| App is slow | 4 |
| Suspected cheating | 5 |
| Need new database table | 6 |
| New dashboard feature | 7 |
| File too big to manage | 8 |
| PRODUCTION IS DOWN | 9 |
| About to deploy | 10 |

---

## Emergency Contacts & Resources

- **Vercel Dashboard**: vercel.com/dashboard
- **Supabase Dashboard**: supabase.com/dashboard
- **Stripe Dashboard**: dashboard.stripe.com
- **Rollback Command**: `git revert HEAD && git push`
- **Vercel Rollback**: Deployments > Select previous > Promote to Production

---

*Last updated: December 24, 2024*

