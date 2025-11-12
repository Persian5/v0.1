# Dashboard & Account Revamp - Comprehensive Implementation Plan

**Created:** 2025-01-13  
**Status:** Planning Phase  
**Estimated Total Time:** 40-60 hours  
**Priority:** High - Launch Blocker

---

## 📋 EXECUTIVE SUMMARY

This document outlines a comprehensive 150-step implementation plan to:
1. Separate Dashboard (learning hub) from Account (settings)
2. Implement real streak system (any XP = streak)
3. Add daily goal system (default 50 XP, editable)
4. Implement level system (calculate from XP)
5. Fix word mastery algorithm (mastered vs need improvement)
6. Enhance Dashboard with detailed analytics
7. Clean up Account to be settings-only
8. Ensure security, scalability, and no hardcoding

---

## 🔍 PHASE 0: DEEP ANALYSIS & RESEARCH SUMMARY

### Current State Analysis

#### Database Schema Status
✅ **Good:**
- `user_profiles.timezone` exists (needed for streak)
- `user_profiles.total_xp` exists
- `vocabulary_performance` table has all needed fields
- RLS policies are properly configured
- Indexes exist for performance

❌ **Missing:**
- `user_profiles.streak_count` (INTEGER, default 0)
- `user_profiles.last_activity_date` (TIMESTAMP WITH TIME ZONE)
- `user_profiles.daily_goal_xp` (INTEGER, default 50)
- `user_profiles.last_streak_date` (TIMESTAMP WITH TIME ZONE, nullable)

#### Current Algorithm Issues
**Problem:** All words showing as "need improvement"
- Current: `masteredWords = consecutive_correct >= 5 OR mastery_level >= 5`
- Issue: No accuracy threshold check
- Issue: "Hard words" includes words with only 1 attempt

**Fix Needed:**
- Mastered: `consecutive_correct >= 5` AND `accuracy >= 90%` AND `total_attempts >= 3`
- Need Improvement: `accuracy < 70%` OR (`consecutive_correct < 2` AND `total_attempts >= 2`)
- In Progress: Everything else (70-90% accuracy, 2-4 consecutive correct)

#### Security Analysis
✅ **Good:**
- RLS policies enforce user isolation
- All tables have proper `auth.uid() = user_id` checks
- XP idempotency prevents duplicate awards
- No direct database access from client

⚠️ **Needs Verification:**
- Streak calculation must be server-side only
- Daily goal updates must validate user ownership
- Level calculation must be server-side (prevent manipulation)

---

## 📊 RESEARCH FINDINGS SUMMARY

### Account Settings UI/UX Best Practices (20 Case Studies)
**Key Findings:**
1. **Clear Separation:** Settings should be distinct from progress/analytics
2. **Grouping:** Profile, Preferences, Security, Subscription, Danger Zone
3. **Confirmation Dialogs:** All destructive actions require confirmation
4. **Progressive Disclosure:** Advanced settings collapsed by default
5. **Visual Hierarchy:** Most-used settings at top, dangerous actions at bottom

### Dashboard UI/UX Best Practices (20 Case Studies)
**Key Findings:**
1. **Hero Section:** Large, prominent display of key metrics (streak, XP, level)
2. **Quick Actions:** 3-5 primary action buttons above the fold
3. **Widget Grid:** Responsive grid (1 col mobile, 2-3 cols desktop)
4. **Progressive Detail:** Summary cards → detailed views on click
5. **Visual Feedback:** Charts, graphs, progress bars for engagement

### User Engagement Best Practices (20 Case Studies)
**Key Findings:**
1. **Streak System:** Any activity = streak (simpler than quiz requirement)
2. **Daily Goals:** Default 50 XP, editable, visual progress bar
3. **Level System:** Clear thresholds, level-up celebrations
4. **Immediate Feedback:** Real-time updates, animations
5. **Social Proof:** Leaderboards, achievements (future)

### Word Mastery Algorithms (20 Case Studies)
**Key Findings:**
1. **Duolingo:** Word strength 0-5, based on consecutive correct + time since last review
2. **Memrise:** Mastery level 0-7, based on accuracy + review frequency
3. **Anki:** SRS algorithm (SM-2), adjusts intervals based on performance
4. **Best Practice:** Combine consecutive correct + accuracy + total attempts
5. **Threshold:** 90% accuracy + 5 consecutive correct = mastered

### Database Security Best Practices
**Key Findings:**
1. **RLS First:** Always use Row Level Security, never disable
2. **Server-Side Validation:** All calculations server-side
3. **Idempotency:** Prevent duplicate operations
4. **Audit Logging:** Track sensitive operations (reset progress, etc.)
5. **Rate Limiting:** Prevent abuse (already implemented)

---

## 🗂️ IMPLEMENTATION PLAN: 150 STEPS

### **PHASE 1: DATABASE SCHEMA UPDATES** (Steps 1-15)

#### Step 1: Create Migration File
- [ ] Create `supabase/migrations/20250113000000_add_streak_and_daily_goal.sql`
- [ ] Add header comments with purpose and date
- [ ] Document all changes

#### Step 2: Add Streak Fields to user_profiles
- [ ] Add `streak_count INTEGER NOT NULL DEFAULT 0 CHECK (streak_count >= 0)`
- [ ] Add `last_activity_date TIMESTAMP WITH TIME ZONE`
- [ ] Add `last_streak_date TIMESTAMP WITH TIME ZONE` (nullable)
- [ ] Add comments explaining each field

#### Step 3: Add Daily Goal Field
- [ ] Add `daily_goal_xp INTEGER NOT NULL DEFAULT 50 CHECK (daily_goal_xp > 0 AND daily_goal_xp <= 1000)`
- [ ] Add comment explaining default and constraints

#### Step 4: Add Indexes for Performance
- [ ] Create index on `(user_id, last_activity_date)` for streak queries
- [ ] Create index on `(user_id, streak_count DESC)` for leaderboard (if needed)

#### Step 5: Add Database Comments
- [ ] Comment on `streak_count`: "Consecutive days user earned XP. Resets if no activity for 1 day (timezone-aware)"
- [ ] Comment on `last_activity_date`: "Last date (user timezone) user earned XP. Used for streak calculation"
- [ ] Comment on `last_streak_date`: "Last date (user timezone) streak was incremented. Prevents double-counting"
- [ ] Comment on `daily_goal_xp`: "User's daily XP goal. Default 50, editable in account settings"

#### Step 6: Update TypeScript Types
- [ ] Update `lib/supabase/database.ts` UserProfile interface
- [ ] Add `streak_count: number`
- [ ] Add `last_activity_date: string | null`
- [ ] Add `last_streak_date: string | null`
- [ ] Add `daily_goal_xp: number`

#### Step 7: Verify RLS Policies
- [ ] Ensure `user_profiles` UPDATE policy allows updating streak fields
- [ ] Verify users can only update their own profile
- [ ] Test RLS policy: `auth.uid() = id`

#### Step 8: Create Database Function for Streak Calculation
- [ ] Create function `calculate_streak(p_user_id UUID, p_timezone TEXT)`
- [ ] Logic: Check if user earned XP today (any source)
- [ ] If yes and last_streak_date != today → increment streak
- [ ] If no XP today and last_activity_date < today → reset streak
- [ ] Return new streak count

#### Step 9: Create Database Function for Level Calculation
- [ ] Create function `calculate_level(p_total_xp INTEGER) RETURNS INTEGER`
- [ ] Logic: Level 1: 0-100, Level 2: 101-250, Level 3: 251-500, Level 4: 501-1000, Level 5+: +500 per level
- [ ] Return level number

#### Step 10: Create Database Function for XP to Next Level
- [ ] Create function `xp_to_next_level(p_total_xp INTEGER) RETURNS INTEGER`
- [ ] Calculate XP needed for next level
- [ ] Return remaining XP needed

#### Step 11: Test Migration Locally
- [ ] Run migration on local Supabase instance
- [ ] Verify all columns created correctly
- [ ] Verify constraints work (negative streak, invalid daily goal)
- [ ] Verify indexes created

#### Step 12: Update Existing Users
- [ ] Create migration script to initialize streak fields for existing users
- [ ] Set `last_activity_date` based on first XP transaction
- [ ] Set `streak_count` to 0 (fresh start)
- [ ] Set `daily_goal_xp` to 50 (default)

#### Step 13: Add Database Triggers (Optional)
- [ ] Consider trigger to auto-update `last_activity_date` on XP award
- [ ] OR handle in application layer (more control)

#### Step 14: Document Schema Changes
- [ ] Update `database_schema.md` with new fields
- [ ] Document all functions and their purposes
- [ ] Document constraints and indexes

#### Step 15: Security Audit - Database Layer
- [ ] Verify no SQL injection vulnerabilities
- [ ] Verify RLS policies prevent cross-user access
- [ ] Verify functions use SECURITY DEFINER correctly
- [ ] Test: User A cannot update User B's streak

---

### **PHASE 2: STREAK SERVICE IMPLEMENTATION** (Steps 16-35)

#### Step 16: Create StreakService File
- [ ] Create `lib/services/streak-service.ts`
- [ ] Add class `StreakService` with static methods
- [ ] Add proper TypeScript types

#### Step 17: Implement Timezone-Aware Date Comparison
- [ ] Create `getUserTimezone(userId: string): Promise<string>`
- [ ] Get timezone from `user_profiles.timezone`
- [ ] Fallback to 'America/Los_Angeles' if null

#### Step 18: Implement Get Current Date in User Timezone
- [ ] Create `getCurrentDateInTimezone(timezone: string): string`
- [ ] Format: 'YYYY-MM-DD' in user's timezone
- [ ] Use date-fns-tz or similar library

#### Step 19: Implement Check If User Earned XP Today
- [ ] Create `didUserEarnXpToday(userId: string): Promise<boolean>`
- [ ] Query `user_xp_transactions` for today's date (user timezone)
- [ ] Return true if any transactions exist

#### Step 20: Implement Update Streak Logic
- [ ] Create `updateStreak(userId: string): Promise<{ streakCount: number; wasIncremented: boolean }>`
- [ ] Get user timezone
- [ ] Get current date in user timezone
- [ ] Check if user earned XP today
- [ ] If yes and `last_streak_date != today` → increment streak
- [ ] If no XP today → check if streak should reset
- [ ] Update `last_activity_date` and `last_streak_date`
- [ ] Return new streak count

#### Step 21: Implement Streak Reset Logic
- [ ] Create `resetStreakIfNeeded(userId: string): Promise<boolean>`
- [ ] Check if `last_activity_date` is before today
- [ ] If yes → reset `streak_count` to 0
- [ ] Update `last_activity_date` to today (even if 0 XP)
- [ ] Return true if reset occurred

#### Step 22: Implement Get Current Streak
- [ ] Create `getCurrentStreak(userId: string): Promise<number>`
- [ ] First call `updateStreak()` to ensure accuracy
- [ ] Return `streak_count` from database

#### Step 23: Integrate Streak Update with XP Award
- [ ] Modify `XpService.awardStepXp()` to call `StreakService.updateStreak()`
- [ ] Call AFTER XP is successfully awarded
- [ ] Handle errors gracefully (don't fail XP award if streak fails)

#### Step 24: Add Streak Update to Review XP
- [ ] Modify `ReviewSessionService.awardReviewXp()` to update streak
- [ ] Ensure streak updates for review mode XP

#### Step 25: Add Streak Update to Lesson XP
- [ ] Ensure all lesson XP awards trigger streak update
- [ ] Verify `LessonRunner` calls streak update

#### Step 26: Create Streak API Endpoint
- [ ] Create `app/api/streak/route.ts`
- [ ] GET endpoint: Returns current streak
- [ ] POST endpoint: Manual streak update (for testing)
- [ ] Add authentication check
- [ ] Add rate limiting

#### Step 27: Add Streak Caching
- [ ] Add streak to `SmartAuthService` cache
- [ ] Cache key: `streak_${userId}`
- [ ] Invalidate on XP award
- [ ] TTL: 1 hour (or until next day)

#### Step 28: Create Streak Hook
- [ ] Create `hooks/use-streak.ts`
- [ ] Returns `{ streak: number; isLoading: boolean; error: Error | null }`
- [ ] Uses `SmartAuthService` cache
- [ ] Auto-refreshes on focus

#### Step 29: Test Streak Calculation Edge Cases
- [ ] Test: User earns XP at 11:59 PM, then again at 12:01 AM (next day)
- [ ] Test: User in different timezone than server
- [ ] Test: User misses one day (streak resets)
- [ ] Test: User earns XP multiple times same day (no double-count)

#### Step 30: Test Streak Security
- [ ] Test: User cannot manually set streak_count
- [ ] Test: User cannot update other user's streak
- [ ] Test: Streak calculation is server-side only

#### Step 31: Add Streak Milestone Celebrations
- [ ] Create `StreakService.checkMilestones(userId: string): Promise<string[]>`
- [ ] Check for milestones: 7, 30, 100 days
- [ ] Return array of milestone messages
- [ ] Store milestone notifications (future)

#### Step 32: Add Streak Analytics
- [ ] Track longest streak in `user_profiles` (future)
- [ ] Track total streak days (future)

#### Step 33: Document Streak Service
- [ ] Add JSDoc comments to all methods
- [ ] Document timezone handling
- [ ] Document edge cases

#### Step 34: Performance Testing
- [ ] Test streak update doesn't slow down XP awards
- [ ] Test database queries are optimized (use EXPLAIN)
- [ ] Test caching reduces database load

#### Step 35: Integration Testing
- [ ] Test streak updates when user earns XP from lessons
- [ ] Test streak updates when user earns XP from review
- [ ] Test streak resets when user misses a day
- [ ] Test streak persists across sessions

---

### **PHASE 3: DAILY GOAL SYSTEM** (Steps 36-50)

#### Step 36: Create DailyGoalService File
- [ ] Create `lib/services/daily-goal-service.ts`
- [ ] Add class `DailyGoalService` with static methods

#### Step 37: Implement Get Daily Goal
- [ ] Create `getDailyGoal(userId: string): Promise<number>`
- [ ] Get `daily_goal_xp` from `user_profiles`
- [ ] Return default 50 if null

#### Step 38: Implement Set Daily Goal
- [ ] Create `setDailyGoal(userId: string, goalXp: number): Promise<{ success: boolean; error?: string }>`
- [ ] Validate: `goalXp > 0 AND goalXp <= 1000`
- [ ] Update `user_profiles.daily_goal_xp`
- [ ] Verify user ownership (RLS should handle, but double-check)

#### Step 39: Implement Get Daily Goal Progress
- [ ] Create `getDailyGoalProgress(userId: string): Promise<{ earned: number; goal: number; percentage: number }>`
- [ ] Get daily goal from database
- [ ] Query `user_xp_transactions` for today's XP (user timezone)
- [ ] Calculate percentage
- [ ] Return progress object

#### Step 40: Implement Check If Daily Goal Met
- [ ] Create `isDailyGoalMet(userId: string): Promise<boolean>`
- [ ] Get progress
- [ ] Return `earned >= goal`

#### Step 41: Create Daily Goal API Endpoint
- [ ] Create `app/api/daily-goal/route.ts`
- [ ] GET: Returns current goal and progress
- [ ] PUT: Updates daily goal (with validation)
- [ ] Add authentication check
- [ ] Add rate limiting

#### Step 42: Add Daily Goal to Cache
- [ ] Cache daily goal in `SmartAuthService`
- [ ] Cache key: `daily_goal_${userId}`
- [ ] Invalidate on goal update

#### Step 43: Create Daily Goal Hook
- [ ] Create `hooks/use-daily-goal.ts`
- [ ] Returns `{ goal: number; progress: { earned: number; goal: number; percentage: number }; isLoading: boolean }`
- [ ] Auto-refreshes on XP award

#### Step 44: Integrate Daily Goal Check with XP Award
- [ ] After XP award, check if daily goal met
- [ ] Trigger celebration animation if met
- [ ] Store goal completion timestamp (future)

#### Step 45: Add Daily Goal Reset Logic
- [ ] Create `resetDailyGoalProgress(userId: string): Promise<void>`
- [ ] Called at midnight (user timezone)
- [ ] Reset daily XP counter (if tracking separately)
- [ ] Or calculate from transactions (no reset needed)

#### Step 46: Test Daily Goal Edge Cases
- [ ] Test: User sets goal to 0 (should fail validation)
- [ ] Test: User sets goal to 1001 (should fail validation)
- [ ] Test: User earns XP exactly at goal amount
- [ ] Test: User earns XP exceeding goal

#### Step 47: Test Daily Goal Security
- [ ] Test: User cannot set other user's goal
- [ ] Test: Goal validation is server-side
- [ ] Test: Goal updates require authentication

#### Step 48: Add Daily Goal Analytics
- [ ] Track days goal was met (future)
- [ ] Track average daily XP (future)

#### Step 49: Document Daily Goal Service
- [ ] Add JSDoc comments
- [ ] Document validation rules
- [ ] Document timezone handling

#### Step 50: Integration Testing
- [ ] Test daily goal updates from Account page
- [ ] Test daily goal progress updates on Dashboard
- [ ] Test daily goal resets at midnight
- [ ] Test daily goal persists across sessions

---

### **PHASE 4: LEVEL SYSTEM IMPLEMENTATION** (Steps 51-65)

#### Step 51: Create LevelService File
- [ ] Create `lib/services/level-service.ts`
- [ ] Add class `LevelService` with static methods

#### Step 52: Implement Calculate Level from XP
- [ ] Create `calculateLevel(totalXp: number): number`
- [ ] Logic: Level 1: 0-100, Level 2: 101-250, Level 3: 251-500, Level 4: 501-1000, Level 5+: +500 per level
- [ ] Use database function OR calculate client-side (server-side preferred)

#### Step 53: Implement Get XP to Next Level
- [ ] Create `getXpToNextLevel(totalXp: number): { current: number; next: number; remaining: number }`
- [ ] Calculate current level
- [ ] Calculate XP needed for next level
- [ ] Calculate remaining XP needed
- [ ] Return object

#### Step 54: Implement Get Level Progress Percentage
- [ ] Create `getLevelProgress(totalXp: number): number`
- [ ] Calculate percentage to next level
- [ ] Return 0-100

#### Step 55: Implement Check Level Up
- [ ] Create `checkLevelUp(oldXp: number, newXp: number): { leveledUp: boolean; newLevel: number | null }`
- [ ] Calculate old level and new level
- [ ] Return true if level increased
- [ ] Return new level number

#### Step 56: Create Level Up Animation Component
- [ ] Create `app/components/LevelUpAnimation.tsx`
- [ ] Shows "Level Up!" message
- [ ] Displays new level number
- [ ] Confetti animation
- [ ] Auto-dismisses after 3 seconds

#### Step 57: Integrate Level Up Check with XP Award
- [ ] Modify `XpService.awardStepXp()` to check for level up
- [ ] If level up → trigger animation
- [ ] Store level up event (future analytics)

#### Step 58: Create Level API Endpoint
- [ ] Create `app/api/level/route.ts`
- [ ] GET: Returns current level and progress
- [ ] Add authentication check

#### Step 59: Add Level to Cache
- [ ] Cache level calculation in `SmartAuthService`
- [ ] Cache key: `level_${userId}`
- [ ] Invalidate on XP award

#### Step 60: Create Level Hook
- [ ] Create `hooks/use-level.ts`
- [ ] Returns `{ level: number; xpToNext: { current, next, remaining }; progress: number; isLoading: boolean }`
- [ ] Auto-updates on XP changes

#### Step 61: Test Level Calculation
- [ ] Test: Level 1 at 0 XP
- [ ] Test: Level 2 at 101 XP
- [ ] Test: Level 3 at 251 XP
- [ ] Test: Level 4 at 501 XP
- [ ] Test: Level 5+ progression (+500 per level)

#### Step 62: Test Level Up Detection
- [ ] Test: User earns XP that crosses level threshold
- [ ] Test: User earns XP within same level
- [ ] Test: User earns large amount of XP (multiple levels)

#### Step 63: Test Level Security
- [ ] Test: Level calculation is server-side (or verified server-side)
- [ ] Test: User cannot manually set level
- [ ] Test: Level is always calculated from XP

#### Step 64: Document Level Service
- [ ] Add JSDoc comments
- [ ] Document level thresholds
- [ ] Document level up logic

#### Step 65: Integration Testing
- [ ] Test level displays correctly on Dashboard
- [ ] Test level up animation triggers
- [ ] Test level progress bar updates
- [ ] Test level persists across sessions

---

### **PHASE 5: FIX WORD MASTERY ALGORITHM** (Steps 66-85)

#### Step 66: Analyze Current Algorithm
- [ ] Review `VocabularyTrackingService.getDashboardStats()`
- [ ] Identify issues with current logic
- [ ] Document current thresholds

#### Step 67: Define New Mastered Criteria
- [ ] Mastered = `consecutive_correct >= 5` AND `accuracy >= 90%` AND `total_attempts >= 3`
- [ ] Document reasoning: Need consistency (5 correct) + high accuracy + enough data

#### Step 68: Define New "Need Improvement" Criteria
- [ ] Need Improvement = `accuracy < 70%` OR (`consecutive_correct < 2` AND `total_attempts >= 2`)
- [ ] Document reasoning: Low accuracy OR struggling with consistency

#### Step 69: Define "In Progress" Criteria
- [ ] In Progress = Everything else (70-90% accuracy, 2-4 consecutive correct)
- [ ] Document reasoning: Not mastered, not struggling

#### Step 70: Update VocabularyTrackingService.getDashboardStats()
- [ ] Modify `masteredWords` calculation
- [ ] Add accuracy calculation: `(total_correct / total_attempts) * 100`
- [ ] Apply new criteria: `consecutive_correct >= 5 AND accuracy >= 90 AND total_attempts >= 3`

#### Step 71: Update Hard Words Calculation
- [ ] Modify `hardWords` calculation
- [ ] Filter: `total_attempts >= 2` (minimum attempts)
- [ ] Calculate accuracy: `(total_correct / total_attempts) * 100`
- [ ] Filter: `accuracy < 70%` OR (`consecutive_correct < 2` AND `total_attempts >= 2`)
- [ ] Sort by error rate DESC (highest first)

#### Step 72: Create Get Words to Review Function
- [ ] Create `getWordsToReview(userId: string, limit: number): Promise<WeakWord[]>`
- [ ] Query words where `next_review_at <= NOW()` (SRS schedule)
- [ ] Return words due for review
- [ ] Limit results

#### Step 73: Update API Endpoint
- [ ] Update `app/api/user-stats/route.ts`
- [ ] Apply new mastered criteria
- [ ] Apply new hard words criteria
- [ ] Add `wordsToReview` field (SRS-based)

#### Step 74: Test Mastered Words Calculation
- [ ] Test: Word with 5 consecutive correct, 90% accuracy, 3+ attempts → mastered
- [ ] Test: Word with 5 consecutive correct, 85% accuracy → not mastered
- [ ] Test: Word with 4 consecutive correct, 95% accuracy → not mastered
- [ ] Test: Word with 6 consecutive correct, 100% accuracy, 2 attempts → not mastered (need 3+)

#### Step 75: Test Hard Words Calculation
- [ ] Test: Word with 50% accuracy, 4 attempts → hard word
- [ ] Test: Word with 1 consecutive correct, 3 attempts → hard word
- [ ] Test: Word with 1 attempt → not in hard words (need 2+)
- [ ] Test: Word with 80% accuracy, 5 consecutive correct → not hard word

#### Step 76: Test Edge Cases
- [ ] Test: Word with 0 attempts (should not appear in any category)
- [ ] Test: Word with 1 correct, 0 incorrect (100% accuracy, but only 1 attempt)
- [ ] Test: Word with division by zero (total_attempts = 0)

#### Step 77: Add Accuracy Calculation Helper
- [ ] Create `calculateAccuracy(totalCorrect: number, totalAttempts: number): number`
- [ ] Handle division by zero (return 0)
- [ ] Return percentage (0-100)

#### Step 78: Update VocabularyTrackingService Types
- [ ] Add `accuracy` field to `WeakWord` interface
- [ ] Ensure all functions return accuracy

#### Step 79: Update Dashboard Widgets
- [ ] Update `MasteredWordsWidget` to use new calculation
- [ ] Update `HardWordsWidget` to use new calculation
- [ ] Add `WordsToReviewWidget` (new widget)

#### Step 80: Test Performance
- [ ] Test: Query performance with new filters
- [ ] Test: Index usage (verify indexes are used)
- [ ] Test: Large datasets (1000+ words per user)

#### Step 81: Add Caching for Word Stats
- [ ] Cache mastered words count
- [ ] Cache hard words list
- [ ] Cache words to review
- [ ] Invalidate on vocabulary attempt

#### Step 82: Create WordsToReviewWidget Component
- [ ] Create `app/components/dashboard/WordsToReviewWidget.tsx`
- [ ] Display list of words due for review
- [ ] "Practice" button for each word
- [ ] Link to review mode with filter

#### Step 83: Update Dashboard Stats Interface
- [ ] Update `DashboardStats` interface
- [ ] Add `wordsToReview: WeakWord[]`
- [ ] Update API response

#### Step 84: Document Algorithm Changes
- [ ] Document new mastered criteria
- [ ] Document new hard words criteria
- [ ] Document reasoning for thresholds
- [ ] Update `DASHBOARD_DECISIONS.md`

#### Step 85: Integration Testing
- [ ] Test: Dashboard shows correct mastered count
- [ ] Test: Dashboard shows correct hard words
- [ ] Test: Dashboard shows words to review
- [ ] Test: Widgets update after vocabulary attempt

---

### **PHASE 6: DASHBOARD UI REVAMP** (Steps 86-110)

#### Step 86: Create Dashboard Hero Component
- [ ] Create `app/components/dashboard/DashboardHero.tsx`
- [ ] Display: Level badge (large), Total XP (large), Streak counter, Daily goal progress
- [ ] Responsive design (stacks on mobile)
- [ ] Use `use-level`, `use-xp`, `use-streak`, `use-daily-goal` hooks

#### Step 87: Create Quick Actions Component
- [ ] Create `app/components/dashboard/QuickActions.tsx`
- [ ] Buttons: Continue Learning, Practice Weak Words, Review Mode, Browse Modules
- [ ] Responsive grid (2x2 mobile, 4 columns desktop)
- [ ] Icon + text for each button

#### Step 88: Create Progress Overview Grid
- [ ] Create `app/components/dashboard/ProgressOverview.tsx`
- [ ] Grid: Words Learned, Mastered Words, Lessons Completed, Current Level
- [ ] Use existing widgets + new components
- [ ] Responsive (1 col mobile, 2 cols tablet, 4 cols desktop)

#### Step 89: Create Learning Stats Section
- [ ] Create `app/components/dashboard/LearningStats.tsx`
- [ ] Cards: Weekly XP Chart, Average Accuracy, Time Spent, XP Earned Today
- [ ] Use Chart.js or Recharts for graphs
- [ ] Responsive layout

#### Step 90: Create Weekly XP Chart Component
- [ ] Create `app/components/dashboard/WeeklyXpChart.tsx`
- [ ] Query `user_xp_transactions` for last 7 days
- [ ] Group by date (user timezone)
- [ ] Display bar chart or line chart
- [ ] Show XP earned per day

#### Step 91: Create Average Accuracy Component
- [ ] Create `app/components/dashboard/AverageAccuracyWidget.tsx`
- [ ] Calculate average accuracy from `vocabulary_performance`
- [ ] Display percentage with trend (up/down arrow)
- [ ] Show comparison to last week

#### Step 92: Create Time Spent Widget
- [ ] Create `app/components/dashboard/TimeSpentWidget.tsx`
- [ ] Sum `time_spent_ms` from `vocabulary_attempts` for today/week
- [ ] Display in hours/minutes
- [ ] Show comparison to previous period

#### Step 93: Create Recommendations Section
- [ ] Create `app/components/dashboard/Recommendations.tsx`
- [ ] Include: Hard Words Widget, Words to Review Widget, Upcoming Lessons Widget
- [ ] Responsive layout

#### Step 94: Create Upcoming Lessons Widget
- [ ] Create `app/components/dashboard/UpcomingLessonsWidget.tsx`
- [ ] Get next 3 lessons from `LessonProgressService`
- [ ] Display lesson cards with preview
- [ ] "Start Lesson" button for each

#### Step 95: Update Dashboard Page Layout
- [ ] Update `app/dashboard/page.tsx`
- [ ] Remove old layout
- [ ] Add: Hero, Quick Actions, Progress Overview, Learning Stats, Recommendations, Leaderboard
- [ ] Responsive spacing

#### Step 96: Add Loading States
- [ ] Add skeleton loaders for all widgets
- [ ] Use `isLoading` prop from hooks
- [ ] Smooth transitions

#### Step 97: Add Error States
- [ ] Add error boundaries for each section
- [ ] Display error messages gracefully
- [ ] Retry buttons

#### Step 98: Add Empty States
- [ ] Empty state for Hard Words (no hard words)
- [ ] Empty state for Words to Review (all caught up)
- [ ] Empty state for Upcoming Lessons (all completed)

#### Step 99: Add Animations
- [ ] Fade-in animations for widgets
- [ ] Stagger animations for grid items
- [ ] Use Framer Motion

#### Step 100: Test Dashboard Responsiveness
- [ ] Test on mobile (320px, 375px, 414px)
- [ ] Test on tablet (768px, 1024px)
- [ ] Test on desktop (1280px, 1920px)
- [ ] Test landscape orientation

#### Step 101: Test Dashboard Performance
- [ ] Test: Page load time < 3 seconds
- [ ] Test: Widgets load progressively
- [ ] Test: Caching reduces API calls
- [ ] Test: No layout shift (CLS)

#### Step 102: Add Dashboard Refresh Button
- [ ] Add manual refresh button
- [ ] Clears cache and refetches data
- [ ] Shows loading state during refresh

#### Step 103: Add Dashboard Auto-Refresh
- [ ] Auto-refresh on window focus
- [ ] Auto-refresh every 5 minutes (if tab active)
- [ ] Don't refresh if user is interacting

#### Step 104: Update Dashboard Header
- [ ] Change title to "Your Learning Hub"
- [ ] Update description
- [ ] Add user greeting (optional)

#### Step 105: Test Dashboard Accessibility
- [ ] Test: Keyboard navigation works
- [ ] Test: Screen reader compatibility
- [ ] Test: Color contrast (WCAG AA)
- [ ] Test: Focus indicators visible

#### Step 106: Add Dashboard Analytics
- [ ] Track: Dashboard views
- [ ] Track: Widget clicks
- [ ] Track: Action button clicks
- [ ] Track: Time spent on dashboard

#### Step 107: Document Dashboard Components
- [ ] Add JSDoc comments to all components
- [ ] Document props and usage
- [ ] Document responsive breakpoints

#### Step 108: Create Dashboard Storybook (Optional)
- [ ] Create Storybook stories for each widget
- [ ] Document component variations
- [ ] Visual regression testing

#### Step 109: Test Dashboard Edge Cases
- [ ] Test: User with 0 XP (new user)
- [ ] Test: User with no vocabulary learned
- [ ] Test: User with no lessons completed
- [ ] Test: User with very high XP (level 10+)

#### Step 110: Final Dashboard Polish
- [ ] Review all spacing and typography
- [ ] Ensure consistent colors (Iran flag theme)
- [ ] Add hover states
- [ ] Add transitions

---

### **PHASE 7: ACCOUNT PAGE CLEANUP** (Steps 111-130)

#### Step 111: Remove XP Display from Account
- [ ] Remove XP card from `app/account/page.tsx`
- [ ] Remove `useXp` hook import
- [ ] Remove `CountUpXP` component

#### Step 112: Remove Learning Stats from Account
- [ ] Remove "Learning Stats" card
- [ ] Remove "Learning Goals" card
- [ ] Remove `completedLessons` state
- [ ] Remove `LessonProgressService` import

#### Step 113: Remove Quick Actions from Account
- [ ] Remove "Quick Actions" card
- [ ] Remove "Browse Modules" button
- [ ] Remove "Continue Learning" button
- [ ] Remove "FAQ" button

#### Step 114: Create Profile Section
- [ ] Create `app/components/account/ProfileSection.tsx`
- [ ] Display: Display Name (editable), Email (read-only), Learning Preferences (editable)
- [ ] Form for editing display name
- [ ] Display learning goal, current level, primary focus

#### Step 115: Implement Display Name Editing
- [ ] Create `handleUpdateDisplayName(newName: string)` function
- [ ] Validate: Length, characters, uniqueness
- [ ] Update `user_profiles.display_name`
- [ ] Show success/error messages
- [ ] Update cache

#### Step 116: Create Learning Preferences Section
- [ ] Create `app/components/account/LearningPreferencesSection.tsx`
- [ ] Editable: Learning Goal, Current Level, Primary Focus
- [ ] Dropdown selects (same as onboarding)
- [ ] Save button with loading state

#### Step 117: Implement Learning Preferences Update
- [ ] Create `handleUpdatePreferences()` function
- [ ] Update `user_profiles` fields
- [ ] Validate values (match onboarding constraints)
- [ ] Show success/error messages

#### Step 118: Create Subscription Section
- [ ] Create `app/components/account/SubscriptionSection.tsx`
- [ ] Display: Premium status badge
- [ ] "Manage Subscription" button (links to Stripe Customer Portal)
- [ ] "Upgrade to Premium" button (if free user)
- [ ] Billing information (if premium)

#### Step 119: Implement Stripe Customer Portal Link
- [ ] Create API endpoint to generate Stripe Customer Portal session
- [ ] Return session URL
- [ ] Open in new tab
- [ ] Handle errors

#### Step 120: Create Security Section
- [ ] Create `app/components/account/SecuritySection.tsx`
- [ ] Change Password form (existing)
- [ ] Sign Out button (existing)
- [ ] Two-factor authentication (future placeholder)

#### Step 121: Create Danger Zone Section
- [ ] Create `app/components/account/DangerZoneSection.tsx`
- [ ] Collapsed by default
- [ ] Red border/warning styling
- [ ] Reset Progress button (existing functionality)
- [ ] Delete Account button (future)

#### Step 122: Update Account Page Layout
- [ ] Update `app/account/page.tsx`
- [ ] Remove all non-settings content
- [ ] Add: Profile Section, Learning Preferences, Subscription, Security, Danger Zone
- [ ] Update page title to "Account Settings"

#### Step 123: Update Account Page Header
- [ ] Change title to "Account Settings"
- [ ] Update description to "Manage your account and preferences"
- [ ] Remove user greeting (or keep minimal)

#### Step 124: Add Account Page Loading States
- [ ] Add loading state for profile data
- [ ] Add loading state for subscription status
- [ ] Skeleton loaders

#### Step 125: Add Account Page Error Handling
- [ ] Error boundaries for each section
- [ ] Error messages for failed updates
- [ ] Retry functionality

#### Step 126: Test Account Page Security
- [ ] Test: User cannot update other user's profile
- [ ] Test: Display name uniqueness validation
- [ ] Test: Learning preferences validation
- [ ] Test: Subscription status is read-only (except manage link)

#### Step 127: Test Account Page Functionality
- [ ] Test: Display name update works
- [ ] Test: Learning preferences update works
- [ ] Test: Change password works
- [ ] Test: Sign out works
- [ ] Test: Reset progress works

#### Step 128: Test Account Page Responsiveness
- [ ] Test on mobile
- [ ] Test on tablet
- [ ] Test on desktop
- [ ] Test form layouts

#### Step 129: Add Account Page Analytics
- [ ] Track: Account page views
- [ ] Track: Settings changes
- [ ] Track: Subscription management clicks

#### Step 130: Final Account Page Polish
- [ ] Review spacing and typography
- [ ] Ensure consistent styling
- [ ] Add hover states
- [ ] Add transitions

---

### **PHASE 8: TESTING & SECURITY AUDIT** (Steps 131-145)

#### Step 131: End-to-End Testing - Dashboard
- [ ] Test: User signs up → sees Dashboard with 0 stats
- [ ] Test: User completes lesson → Dashboard updates
- [ ] Test: User earns XP → Streak updates, Daily goal updates, Level updates
- [ ] Test: User views Dashboard → All widgets load correctly

#### Step 132: End-to-End Testing - Account
- [ ] Test: User updates display name → Changes persist
- [ ] Test: User updates learning preferences → Changes persist
- [ ] Test: User changes password → Can login with new password
- [ ] Test: User resets progress → All data cleared

#### Step 133: Security Testing - Streak System
- [ ] Test: User cannot manually set streak_count
- [ ] Test: User cannot update other user's streak
- [ ] Test: Streak calculation is server-side only
- [ ] Test: Timezone manipulation doesn't break streak

#### Step 134: Security Testing - Daily Goal
- [ ] Test: User cannot set invalid daily goal (0, negative, >1000)
- [ ] Test: User cannot update other user's goal
- [ ] Test: Goal validation is server-side

#### Step 135: Security Testing - Level System
- [ ] Test: Level is calculated from XP (not stored)
- [ ] Test: User cannot manually set level
- [ ] Test: Level calculation is server-side

#### Step 136: Security Testing - Word Mastery
- [ ] Test: User cannot access other user's vocabulary data
- [ ] Test: Word mastery calculation is server-side
- [ ] Test: RLS policies prevent cross-user access

#### Step 137: Performance Testing
- [ ] Test: Dashboard loads < 3 seconds
- [ ] Test: Account page loads < 2 seconds
- [ ] Test: API endpoints respond < 500ms
- [ ] Test: Database queries are optimized (use EXPLAIN)

#### Step 138: Load Testing
- [ ] Test: 100 concurrent users on Dashboard
- [ ] Test: 100 concurrent users updating streaks
- [ ] Test: Database handles high load
- [ ] Test: Caching reduces database load

#### Step 139: Edge Case Testing
- [ ] Test: User in different timezone
- [ ] Test: User crosses midnight (timezone-aware)
- [ ] Test: User with very high XP (level 20+)
- [ ] Test: User with 0 vocabulary learned

#### Step 140: Regression Testing
- [ ] Test: Existing features still work
- [ ] Test: Lesson completion still works
- [ ] Test: Review mode still works
- [ ] Test: XP awards still work

#### Step 141: Browser Compatibility Testing
- [ ] Test: Chrome (latest)
- [ ] Test: Safari (latest)
- [ ] Test: Firefox (latest)
- [ ] Test: Mobile Safari (iOS)
- [ ] Test: Chrome Mobile (Android)

#### Step 142: Accessibility Testing
- [ ] Test: Keyboard navigation
- [ ] Test: Screen reader compatibility
- [ ] Test: Color contrast (WCAG AA)
- [ ] Test: Focus indicators

#### Step 143: Database Migration Testing
- [ ] Test: Migration runs successfully on production-like data
- [ ] Test: Existing users' data is preserved
- [ ] Test: New fields have correct defaults
- [ ] Test: Rollback plan works (if needed)

#### Step 144: API Testing
- [ ] Test: All API endpoints return correct data
- [ ] Test: Authentication required for all endpoints
- [ ] Test: Rate limiting works
- [ ] Test: Error handling is consistent

#### Step 145: Final Security Audit
- [ ] Review all RLS policies
- [ ] Review all API endpoints for auth checks
- [ ] Review all user input validation
- [ ] Review all database functions for SQL injection
- [ ] Test: User cannot access other user's data
- [ ] Test: User cannot manipulate their own stats

---

### **PHASE 9: DEPLOYMENT & MONITORING** (Steps 146-150)

#### Step 146: Create Migration Script
- [ ] Test migration on staging environment
- [ ] Verify all data migrates correctly
- [ ] Document rollback procedure
- [ ] Create backup before migration

#### Step 147: Deploy to Production
- [ ] Run database migration
- [ ] Deploy code changes
- [ ] Verify deployment success
- [ ] Monitor error logs

#### Step 148: Post-Deployment Verification
- [ ] Test: Dashboard loads correctly
- [ ] Test: Account page loads correctly
- [ ] Test: Streak system works
- [ ] Test: Daily goal works
- [ ] Test: Level system works
- [ ] Test: Word mastery algorithm works

#### Step 149: Monitor Performance
- [ ] Monitor: Dashboard load times
- [ ] Monitor: API response times
- [ ] Monitor: Database query performance
- [ ] Monitor: Error rates

#### Step 150: User Communication
- [ ] Update changelog
- [ ] Send email to users (if needed)
- [ ] Update documentation
- [ ] Create support article for new features

---

## 🔒 SECURITY CHECKLIST

### Database Security
- [ ] All RLS policies enforce user isolation
- [ ] All database functions use SECURITY DEFINER correctly
- [ ] No SQL injection vulnerabilities
- [ ] All user input is validated
- [ ] All calculations are server-side

### API Security
- [ ] All endpoints require authentication
- [ ] All endpoints validate user ownership
- [ ] Rate limiting is enabled
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive info

### Client Security
- [ ] No sensitive data in client-side code
- [ ] No hardcoded secrets
- [ ] All API calls use HTTPS
- [ ] XSS protection on user-generated content

---

## 📈 SCALABILITY CHECKLIST

### Database
- [ ] Indexes exist for all frequent queries
- [ ] No N+1 query problems
- [ ] Database functions are optimized
- [ ] Connection pooling configured

### Caching
- [ ] Dashboard stats are cached
- [ ] Streak is cached
- [ ] Daily goal is cached
- [ ] Level is cached
- [ ] Cache invalidation is correct

### Code
- [ ] No hardcoded values (use constants)
- [ ] Services are stateless
- [ ] Components are reusable
- [ ] No tight coupling

---

## 🧪 TESTING CHECKLIST

### Unit Tests
- [ ] StreakService tests
- [ ] DailyGoalService tests
- [ ] LevelService tests
- [ ] VocabularyTrackingService tests (new algorithm)

### Integration Tests
- [ ] Dashboard page tests
- [ ] Account page tests
- [ ] API endpoint tests
- [ ] Database function tests

### E2E Tests
- [ ] User journey: Sign up → Dashboard → Complete lesson → See updates
- [ ] User journey: Account → Update settings → See changes
- [ ] Streak system: Earn XP → Streak updates
- [ ] Daily goal: Earn XP → Goal progress updates

---

## 📝 DOCUMENTATION CHECKLIST

- [ ] Update `database_schema.md`
- [ ] Update `DEVELOPMENT_RULES.md` (if needed)
- [ ] Update API documentation
- [ ] Create user guide for new features
- [ ] Document algorithm changes
- [ ] Document security considerations

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Database migration tested on staging
- [ ] Code changes tested on staging
- [ ] Backup created
- [ ] Rollback plan documented
- [ ] Monitoring set up
- [ ] Error tracking configured
- [ ] User communication prepared

---

## ⚠️ KNOWN RISKS & MITIGATION

### Risk 1: Streak Calculation Timezone Issues
**Mitigation:** Use user's stored timezone, test thoroughly with different timezones

### Risk 2: Performance Degradation
**Mitigation:** Add caching, optimize queries, use indexes

### Risk 3: Data Migration Issues
**Mitigation:** Test migration on production-like data, have rollback plan

### Risk 4: Breaking Existing Features
**Mitigation:** Comprehensive regression testing, feature flags (if needed)

---

## 📊 SUCCESS METRICS

### Dashboard Engagement
- Dashboard page views per user
- Time spent on dashboard
- Widget interaction rate
- Action button click rate

### Streak System
- Average streak length
- Users maintaining 7+ day streak
- Streak retention rate

### Daily Goal
- Users setting daily goals
- Daily goal completion rate
- Average daily XP earned

### Word Mastery
- Accuracy of mastered words list
- Reduction in false positives
- User satisfaction with recommendations

---

## 🎯 NEXT STEPS AFTER COMPLETION

1. **Analytics Implementation:** Track all new metrics
2. **A/B Testing:** Test different thresholds for word mastery
3. **User Feedback:** Collect feedback on new Dashboard
4. **Iteration:** Improve based on user behavior
5. **Future Features:** Achievements, badges, social features

---

**END OF IMPLEMENTATION PLAN**

**Total Steps: 150**  
**Estimated Time: 40-60 hours**  
**Priority: High - Launch Blocker**

