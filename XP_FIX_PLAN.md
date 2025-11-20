# 🛠️ XP SYSTEM UNIFICATION & FIX PLAN

**Goal:** Eliminate all XP bugs, unify lesson/review XP systems, and ensure 100% data integrity before launch.
**Estimated Time:** 10-14 hours
**Strategy:** Fix critical data corruption issues first, then unify architecture, then polish UX.

---

## 🚨 PHASE 1: CRITICAL FIXES (Stop the Bleeding)
**Focus:** Prevent double counting, race conditions, and UI bouncing.
**Time:** 2-3 Hours

### **Step 1.1: Fix Double Optimistic Updates**
**Issue:** `useXp.addXp` calls `SmartAuthService.addUserXp` (optimistic) AND `XpService.awardXpOnce` calls `addXpOptimistic` (optimistic).
**Solution:**
1.  Modify `hooks/use-xp.ts`: Remove the call to `SmartAuthService.addUserXp` inside `addXp`.
2.  Modify `hooks/use-smart-xp.ts`: Remove the call to `SmartAuthService.addUserXp` inside `addXp`.
3.  Ensure `XpService.awardXpOnce` is the *only* place triggering the optimistic update for lessons.

### **Step 1.2: Fix Reconciliation Race Condition**
**Issue:** `awardXpOnce` reads `currentXp`, compares, then sets. A race condition exists between reading and setting.
**Solution:**
1.  Modify `lib/services/xp-service.ts`: In `awardXpOnce`, stop reading `SmartAuthService.getUserXp()`.
2.  Use the atomic `newXp` returned directly from the RPC call.
3.  Call `SmartAuthService.setXpDirectly(newXp)` unconditionally if `granted` is true or `newXp` is returned.

### **Step 1.3: Add Debouncing to Lesson XP**
**Issue:** Rapid clicks trigger multiple RPC calls before cache is set.
**Solution:**
1.  Modify `app/components/LessonRunner.tsx`: Add `isAwardingXp` ref.
2.  Wrap `createStepXpHandler` logic in a check: `if (isAwardingXp.current) return`.
3.  Set `isAwardingXp.current = true` at start, `false` at end (finally block).

---

## 🏗️ PHASE 2: UNIFY REVIEW XP (Architecture)
**Focus:** Bring Review XP into the robust transaction/idempotency system used by Lessons.
**Time:** 4-5 Hours

### **Step 2.1: Update Database Schema for Review XP**
**Issue:** Review XP bypasses `user_xp_transactions` and has no idempotency.
**Solution:**
1.  Create migration: `unify_xp_transactions.sql`.
2.  Update `award_step_xp_idem` RPC to handle "review" source types generically.
3.  Ensure `idempotency_key` constraint works for review IDs (e.g., `review:memory:timestamp`).

### **Step 2.2: Migrate Review Service to Unified RPC**
**Issue:** `ReviewSessionService` manually updates `user_profiles`.
**Solution:**
1.  Modify `lib/services/review-session-service.ts`.
2.  Replace direct DB update with `XpService.awardXpOnce()`.
3.  Generate unique idempotency keys for review actions (e.g., `review:${gameType}:${timestamp}:${vocabId}`).
4.  Pass `source: 'review-game'` to the unified service.

### **Step 2.3: Enforce Daily Cap via Transactions**
**Issue:** Daily cap uses a separate column `review_xp_earned_today`.
**Solution:**
1.  Modify `ReviewSessionService.canAwardReviewXp`:
2.  Calculate today's review XP by querying `user_xp_transactions` where `source` starts with `review-` and `created_at` is today.
3.  Remove reliance on `review_xp_earned_today` column for logic (keep for now as backup, delete in Phase 4).

---

## 📊 PHASE 3: DATA CONSISTENCY & UX
**Focus:** Ensure Dashboard, Leaderboard, and Daily Goals all match.
**Time:** 2-3 Hours

### **Step 3.1: Unify Daily Goal Calculation**
**Issue:** Daily goal ignores Review XP because it wasn't in transactions.
**Solution:**
1.  Modify `lib/services/daily-goal-service.ts`.
2.  Ensure `getXpEarnedToday` queries *all* `user_xp_transactions`, regardless of source (or filter if specific rules apply).
3.  Since Phase 2 put Review XP into transactions, this should "just work" but needs verification.

### **Step 3.2: Fix Persian Word Rush XP**
**Issue:** Regular mode awards 0 XP; Review mode bypasses safety.
**Solution:**
1.  Modify `app/components/games/PersianWordRush.tsx`.
2.  Implement `onXpStart` prop pattern for Regular mode.
3.  Update Review mode to use the new `ReviewSessionService` (which now uses unified RPC).

### **Step 3.3: Loading States & UI Feedback**
**Issue:** No visual feedback during XP awarding calculation.
**Solution:**
1.  Modify `LessonRunner.tsx` and Game components.
2.  Show a subtle loading spinner or disable "Continue" buttons while XP transaction is pending.

---

## 🧹 PHASE 4: CLEANUP (Technical Debt)
**Focus:** Remove dead code and deprecated methods to prevent future regressions.
**Time:** 2 Hours

### **Step 4.1: Remove Deprecated Methods**
**Solution:**
1.  Delete `SmartAuthService.addUserXp` (old optimistic-only method).
2.  Delete `SmartAuthService.refreshXpFromDb` (replaced by atomic returns).

### **Step 4.2: Consolidate Hooks**
**Solution:**
1.  Deprecate `useXp` hook.
2.  Migrate all components to `useSmartXp` (rename to `useXp` final).
3.  Ensure hook is Read-Only for XP value, and Write-Only via `XpService` methods.

### **Step 4.3: Database Cleanup**
**Solution:**
1.  Create migration to drop `review_xp_earned_today` column from `user_profiles`.
2.  Drop `review_xp_reset_at` column (no longer needed if calculating from transactions).

---

## ✅ READY FOR IMPLEMENTATION?
I am ready to start with **Phase 1**.
1.  Fix double counting in hooks.
2.  Fix race condition in service.
3.  Add debouncing in LessonRunner.

**Awaiting your confirmation.**

