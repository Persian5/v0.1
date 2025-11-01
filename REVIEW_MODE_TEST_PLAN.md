# Review Mode Backend - Test Plan

## Phase 1: Database Foundation

### Step 2: Test Migration

**Manual Test Checklist:**

1. **Apply Migration:**
   - [ ] Connect to Supabase dashboard
   - [ ] Run migration: `20250102000000_review_xp_tracking.sql`
   - [ ] Verify no errors

2. **Verify Schema:**
   - [ ] Check `user_profiles` table has new columns:
     - `review_xp_earned_today` (INTEGER, default 0, NOT NULL)
     - `review_xp_reset_at` (TIMESTAMP WITH TIME ZONE, nullable)
     - `timezone` (TEXT, default 'America/Los_Angeles', NOT NULL)
   - [ ] Verify constraints: `review_xp_earned_today >= 0`

3. **Test Existing Data:**
   - [ ] Check existing users have `review_xp_earned_today = 0`
   - [ ] Check existing users have `timezone = 'America/Los_Angeles'`
   - [ ] Check existing users have `review_xp_reset_at = NULL`

4. **Test Constraints:**
   - [ ] Try to insert negative `review_xp_earned_today` → should fail
   - [ ] Try to insert NULL `timezone` → should fail
   - [ ] Try to insert NULL `review_xp_earned_today` → should fail

**Expected Results:**
- Migration runs without errors
- All columns exist with correct types and defaults
- Existing users have correct defaults
- Constraints work correctly

**Next Step:** If all pass → Proceed to Step 3 (VocabularyTrackingService updates)

---

## Phase 2: Service Layer - Vocabulary Fetching

### Step 3-4: Update VocabularyTrackingService

**Test Plan:** (Will be added as we implement)

---

## Phase 3: Service Layer - Review Session Service

### Step 5-20: ReviewSessionService

**Test Plan:** (Will be added as we implement)

