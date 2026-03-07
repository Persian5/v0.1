# UNIT-006: Dashboard

**Status:** Planned  
**Epic:** EP-006  
**Story Points:** 21  
**Priority:** High - Engagement and retention

---

## Unit Overview

### Purpose
Provide users with a centralized view of their learning progress, stats, and quick actions.

### Scope
- Dashboard overview with stats
- Words learned counter
- Mastered words counter
- Hard words section (words to review)
- Continue learning CTA
- Module overview
- Streak display (if implemented)

### Business Value
- Central hub for user engagement
- Increases retention (users see progress)
- Motivates continued learning (stats gamification)
- Quick access to next lesson (reduces friction)

### Out of Scope (V1)
- Recent activity timeline
- Advanced analytics dashboard
- Social features (share progress)

---

## Related User Stories

### US-038: Dashboard Overview Page
**Status:** Planned → Partially Implemented  
**Priority:** High  
**Story Points:** 5

**Acceptance Criteria:**
1. Dashboard accessible from account menu
2. Top section: "Welcome back, [Name]!", Total XP, Level, Streak
3. Quick stats cards: Words Learned, Mastered Words, Modules Completed
4. CTA: "Continue Learning" button
5. Recent activity section (optional)
6. Mobile responsive (stacked on mobile, grid on desktop)

**Implementation:**
- Page: `app/account/page.tsx` (or `/dashboard`)
- Components: Stats cards, quick actions

---

### US-039: Words Learned Counter
**Status:** Planned → Implemented  
**Priority:** High  
**Story Points:** 2

**Acceptance Criteria:**
1. Display "Words Learned" on dashboard
2. Calculation: Count unique `vocabulary_id` where `total_attempts > 0`
3. Format: Number (e.g., "47 words learned")
4. Updates in real-time
5. Clicking shows detailed list (future)

**Implementation:**
- Query: `SELECT COUNT(DISTINCT vocabulary_id) FROM vocabulary_performance WHERE user_id = X AND total_attempts > 0`
- API: `app/api/user-stats/route.ts`

---

### US-040: Mastered Words Counter
**Status:** Planned → Implemented  
**Priority:** High  
**Story Points:** 2

**Acceptance Criteria:**
1. Display "Mastered Words" on dashboard
2. Calculation: Count where `consecutive_correct >= 5` OR `mastery_level >= 5`
3. Format: Number (e.g., "23 words mastered")
4. Updates in real-time
5. Clicking shows list (future)

**Implementation:**
- Query: `SELECT COUNT(*) FROM vocabulary_performance WHERE user_id = X AND (consecutive_correct >= 5 OR mastery_level >= 5)`

---

### US-041: Hard Words Section
**Status:** Planned → Implemented  
**Priority:** High  
**Story Points:** 3

**Acceptance Criteria:**
1. "Words to Review" section on dashboard
2. Display 5-10 hardest words (highest error rate)
3. Calculation: `total_incorrect / total_attempts`, filter `total_attempts >= 2`
4. Each word shows: Finglish, English, error rate %
5. Clicking word links to review mode
6. If no hard words: "Great job! No words to review."
7. Mobile responsive

**Implementation:**
- Query calculates error rate dynamically
- Limit to top 5-10 words

---

### US-042: Continue Learning CTA
**Status:** Planned → Implemented  
**Priority:** Critical  
**Story Points:** 2

**Acceptance Criteria:**
1. "Continue Learning" button prominently displayed
2. Button links to: Last in-progress lesson OR next available
3. Shows: "Continue Learning" or "Start Next Lesson"
4. Displays module and lesson title
5. Visual design: Large, colorful, prominent
6. Mobile responsive

**Implementation:**
- Service: `LessonProgressService.getFirstAvailableLesson()`

---

### US-043: Module Overview on Dashboard
**Status:** Planned → Implemented  
**Priority:** Medium  
**Story Points:** 5

**Acceptance Criteria:**
1. Module overview section shows all modules
2. Each module: Title, progress bar, lessons completed/total, "Continue" or "Start"
3. Locked modules show lock icon and "Upgrade" prompt
4. Clicking module goes to module detail page
5. Mobile responsive (stacked cards)

**Implementation:**
- Fetches all modules from curriculum
- Queries progress for each module

---

### US-044: Streak Display on Dashboard
**Status:** Planned → Needs Implementation  
**Priority:** Low  
**Story Points:** 2

**Acceptance Criteria:**
1. Streak counter with fire emoji (🔥)
2. Format: "🔥 7 days" or "7-day streak"
3. Milestone celebrations (7, 30, 100 days)
4. Warning if streak at risk
5. Clicking shows streak history (future)

**Implementation:**
- Depends on US-025 (Streak Tracking)

---

## Technical Architecture

### Pages
```
/app/account/page.tsx       # Dashboard page
/app/dashboard/page.tsx     # Alternative dashboard route
```

### API Routes
```
/app/api/user-stats/route.ts  # Fetch dashboard stats
```

### Components
```
/app/components/
  DashboardStats.tsx          # Stats widgets
  DashboardModuleCard.tsx     # Module card
  HardWordsWidget.tsx         # Hard words section
```

---

## Data Models

### Dashboard Stats Query
```sql
-- Words Learned
SELECT COUNT(DISTINCT vocabulary_id) 
FROM vocabulary_performance 
WHERE user_id = $1 AND total_attempts > 0;

-- Mastered Words
SELECT COUNT(*) 
FROM vocabulary_performance 
WHERE user_id = $1 AND (consecutive_correct >= 5 OR mastery_level >= 5);

-- Hard Words
SELECT vocabulary_id, word_text, 
       (total_incorrect::float / NULLIF(total_attempts, 0)) as error_rate
FROM vocabulary_performance
WHERE user_id = $1 AND total_attempts >= 2
ORDER BY error_rate DESC
LIMIT 10;
```

---

## Dependencies

### Depends On
- **UNIT-003 (XP/Progress):** For XP, level, streak data
- **UNIT-002 (Lessons):** For vocabulary tracking
- **Vocabulary Performance Table:** For words learned/mastered/hard

---

## Security Considerations

### RLS
- Users can only see their own stats
- All queries filtered by `user_id = auth.uid()`

### Privacy
- No sensitive data exposed on dashboard
- Display names and stats only

---

## Testing Strategy

### Unit Tests
- Stats calculation logic
- Error rate calculation

### E2E Tests
- View dashboard
- Verify stats accurate
- Click "Continue Learning"
- Stats update after completing lesson

---

## Implementation Notes

### Current Status
- ✅ **US-039, US-040, US-041:** Implemented
- ✅ **US-042:** Implemented
- ⚠️ **US-038:** Partially implemented
- ⚠️ **US-043:** Partially implemented
- ❌ **US-044:** Needs streak tracking

### Remaining Work
1. Dashboard layout polish (2 hours)
2. Module overview widget (2 hours)
3. Streak display (depends on US-025)

**Total: ~4 hours (+ streak implementation)**

---

## Success Criteria

UNIT-006 is complete when:
1. ✅ Dashboard shows all stats
2. ✅ Words learned/mastered/hard accurate
3. ✅ "Continue Learning" works
4. ✅ Module overview displays
5. ✅ Streak displays (if implemented)
6. ✅ Mobile responsive

---

**End of UNIT-006: Dashboard**
