# Development Rules

**Reference document.** For daily priorities, see `MASTER_PROJECT_OPERATING_DOC.md`.

---

## Mandatory Anti-Patterns (never do these)

### 1. Hardcoded lesson references
```typescript
// BAD
router.push('/modules/module1/lesson1')

// GOOD
const nextLesson = LessonProgressService.getFirstAvailableLesson()
router.push(`/modules/${nextLesson.moduleId}/${nextLesson.lessonId}`)
```

### 2. Direct storage access
```typescript
// BAD
localStorage.getItem('user-lesson-progress')

// GOOD
LessonProgressService.getProgress()
XpService.addXp(amount, source)
```

### 3. Content duplication
```typescript
// BAD
const words = ["Salam", "Chetori", "Merci"]

// GOOD
import { getLessonVocabulary } from '@/lib/config/curriculum'
const vocabulary = getLessonVocabulary(moduleId, lessonId)
```

### 4. Non-scalable conditionals
```typescript
// BAD
if (moduleId === 'module1') { /* special logic */ }

// GOOD
const lesson = getLesson(moduleId, lessonId)
if (lesson.type === 'greetings') { /* type-based logic */ }
```

---

## Mandatory Patterns (always do these)

### Service layer
All data operations go through services in `lib/services/`. Static methods, try/catch, consistent return types.

**Current services:** SmartAuthService, LessonProgressService, XpService, ModuleAccessService, VocabularyTrackingService, VocabularyProgressService, ReviewSessionService, WordBankService, DailyGoalService, GrammarService, OnboardingService, DatabaseService

### Curriculum as source of truth
ALL lesson content lives in `lib/config/curriculum.ts`. No content in components.

### Dynamic navigation
ALL navigation uses `LessonProgressService.getFirstAvailableLesson()` or `getNextSequentialLesson()`. No hardcoded paths.

### Type safety
All data structures have TypeScript interfaces in `lib/types.ts`.

### Fallback safety
Every dynamic system has graceful fallbacks (default to module1/lesson1).

---

## Safety Rules (extracted from project history)

### Never do without explicit approval
- Change auth flow or session management
- Modify Stripe/payment logic
- Modify database schema without a migration
- Disable or modify RLS policies
- Change XP calculation formulas or lesson progression logic

### Never do at all
- Expose `SUPABASE_SERVICE_ROLE_KEY` to client (no `NEXT_PUBLIC_` prefix)
- Expose `STRIPE_SECRET_KEY` to client
- Drop tables or columns with data
- Remove existing security measures (rate limiting, input validation, XSS protection)
- Skip error handling in services
- Commit `.env` files or secrets

### During incidents
- No major refactors
- No new features
- No database migrations
- No auth changes
- Rollback: Vercel Deployments > Previous > Promote to Production

---

## File Organization

```
lib/
  config/curriculum.ts       # ALL lesson content
  services/*.ts              # ALL business logic
  types.ts                   # ALL TypeScript interfaces
  supabase/                  # Supabase client + database service

app/
  components/
    LessonRunner.tsx         # Core orchestration (handle with care)
    games/                   # Game components
    review/                  # Review game wrappers
    dashboard/               # Dashboard widgets
  modules/[moduleId]/[lessonId]/
    page.tsx                 # Dynamic lesson pages

components/
  auth/                      # Auth components
  ui/                        # shadcn/ui
  routes/                    # Route guards

hooks/                       # React hooks
```

---

## Code Quality

- Loading states for all async operations
- Error boundaries for component crashes
- Graceful degradation for network issues
- Minimize re-renders in LessonRunner
- Cache service responses where appropriate
