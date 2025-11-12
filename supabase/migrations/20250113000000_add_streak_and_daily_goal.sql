-- Migration: Add streak system and daily goal fields to user_profiles
-- Purpose: Enable streak tracking (any XP = streak) and daily goal system (default 50 XP)
-- Date: 2025-01-13
-- Related: DASHBOARD_ACCOUNT_REVAMP_IMPLEMENTATION_PLAN.md
-- 
-- IMPROVEMENTS APPLIED:
-- 1. Use DATE instead of TIMESTAMPTZ for streak fields (simpler, timezone conversion handled in trigger)
-- 2. Automatic streak updates via trigger on XP transactions
-- 3. Optimized initialization query with JOIN
-- 4. Corrected index column order
-- 5. Transaction-wrapped for safety

BEGIN;

-- ============================================================================
-- STEP 1: Add Streak Fields (using DATE type)
-- ============================================================================

-- Add streak_count: Consecutive days user earned XP. Resets if no activity for 1 day (timezone-aware)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS streak_count INTEGER NOT NULL DEFAULT 0 
CHECK (streak_count >= 0);

COMMENT ON COLUMN public.user_profiles.streak_count IS 'Consecutive days user earned XP. Resets if no activity for 1 day (timezone-aware). Any XP earned = streak maintained.';

-- Add last_activity_date: Last date (user timezone) user earned XP. Used for streak calculation
-- Using DATE type - simpler for day comparisons, timezone conversion handled in trigger function
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS last_activity_date DATE;

COMMENT ON COLUMN public.user_profiles.last_activity_date IS 'Last date (user timezone) user earned XP. Used for streak calculation. NULL if user has never earned XP. Stored as DATE in user timezone.';

-- Add last_streak_date: Last date (user timezone) streak was incremented. Prevents double-counting
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS last_streak_date DATE;

COMMENT ON COLUMN public.user_profiles.last_streak_date IS 'Last date (user timezone) streak was incremented. Prevents double-counting on same day. NULL if streak has never been incremented. Stored as DATE in user timezone.';

-- ============================================================================
-- STEP 2: Add Daily Goal Field
-- ============================================================================

-- Add daily_goal_xp: User's daily XP goal. Default 50, editable in account settings
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS daily_goal_xp INTEGER NOT NULL DEFAULT 50 
CHECK (daily_goal_xp > 0 AND daily_goal_xp <= 1000);

COMMENT ON COLUMN public.user_profiles.daily_goal_xp IS 'User''s daily XP goal. Default 50, editable in account settings. Range: 1-1000 XP.';

-- ============================================================================
-- STEP 3: Add Indexes for Performance (corrected column order)
-- ============================================================================

-- Index for streak queries (filter on last_activity_date first, then id)
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_activity 
ON public.user_profiles(last_activity_date, id) 
WHERE last_activity_date IS NOT NULL;

-- Index for streak leaderboard queries (if needed in future)
CREATE INDEX IF NOT EXISTS idx_user_profiles_streak_count 
ON public.user_profiles(streak_count DESC) 
WHERE streak_count > 0;

-- ============================================================================
-- STEP 4: Initialize Existing Users (optimized with JOIN)
-- ============================================================================

-- Initialize streak fields for existing users using efficient JOIN instead of subquery
-- Set last_activity_date based on first XP transaction (if exists)
-- Set streak_count to 0 (fresh start for all users)
-- Set daily_goal_xp to 50 (default)

UPDATE public.user_profiles p
SET 
  streak_count = 0,
  daily_goal_xp = 50,
  last_activity_date = t.first_xp_date
FROM (
  SELECT user_id, MIN(created_at)::date AS first_xp_date
  FROM public.user_xp_transactions
  GROUP BY user_id
) t
WHERE p.id = t.user_id
AND (p.last_activity_date IS NULL OR p.streak_count IS NULL OR p.daily_goal_xp IS NULL);

-- For users with no XP transactions, set defaults
UPDATE public.user_profiles
SET 
  streak_count = 0,
  daily_goal_xp = 50,
  last_activity_date = NULL
WHERE id NOT IN (
  SELECT DISTINCT user_id 
  FROM public.user_xp_transactions
)
AND (last_activity_date IS NULL OR streak_count IS NULL OR daily_goal_xp IS NULL);

-- ============================================================================
-- STEP 5: Database Functions for Calculations
-- ============================================================================

-- Function: Calculate level from total XP
-- Logic: Level 1: 0-100, Level 2: 101-250, Level 3: 251-500, Level 4: 501-1000, Level 5+: +500 per level
CREATE OR REPLACE FUNCTION public.calculate_level(p_total_xp INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_level INTEGER;
BEGIN
  IF p_total_xp < 100 THEN
    v_level := 1;
  ELSIF p_total_xp < 250 THEN
    v_level := 2;
  ELSIF p_total_xp < 500 THEN
    v_level := 3;
  ELSIF p_total_xp < 1000 THEN
    v_level := 4;
  ELSE
    -- Level 5+: 1000 + (n-4) * 500
    -- Formula: level = 4 + CEIL((xp - 1000) / 500.0)
    v_level := 4 + CEIL((p_total_xp - 1000) / 500.0);
  END IF;
  
  RETURN v_level;
END;
$$;

COMMENT ON FUNCTION public.calculate_level IS 'Calculates user level from total XP. Level 1: 0-100, Level 2: 101-250, Level 3: 251-500, Level 4: 501-1000, Level 5+: +500 per level.';

-- Function: Calculate XP needed for next level
-- Note: If user is exactly at level boundary, they need 1 XP to reach next level
CREATE OR REPLACE FUNCTION public.xp_to_next_level(p_total_xp INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_current_level INTEGER;
  v_next_level_xp INTEGER;
  v_remaining INTEGER;
BEGIN
  v_current_level := public.calculate_level(p_total_xp);
  
  -- Calculate XP threshold for next level
  IF v_current_level = 1 THEN
    v_next_level_xp := 100;
  ELSIF v_current_level = 2 THEN
    v_next_level_xp := 250;
  ELSIF v_current_level = 3 THEN
    v_next_level_xp := 500;
  ELSIF v_current_level = 4 THEN
    v_next_level_xp := 1000;
  ELSE
    -- Level 5+: 1000 + (level - 4) * 500
    v_next_level_xp := 1000 + (v_current_level - 4) * 500;
  END IF;
  
  -- Calculate remaining XP needed
  -- If exactly at boundary, need 1 XP to cross threshold
  v_remaining := GREATEST(1, v_next_level_xp - p_total_xp);
  
  -- If already at or past next level threshold, return 0 (shouldn't happen with correct level calc)
  IF p_total_xp >= v_next_level_xp THEN
    RETURN 0;
  END IF;
  
  RETURN v_remaining;
END;
$$;

COMMENT ON FUNCTION public.xp_to_next_level IS 'Calculates remaining XP needed to reach next level. Returns minimum 1 if at boundary, 0 if already at/past next level.';

-- ============================================================================
-- STEP 6: Streak Update Function (timezone-aware)
-- ============================================================================

-- Function: Update streak for user when XP is awarded
-- Automatically called by trigger on user_xp_transactions INSERT
-- Handles timezone conversion: converts server time to user's timezone, then extracts date
CREATE OR REPLACE FUNCTION public.update_streak(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_timezone TEXT;
  v_today_user_tz DATE;
  v_last_activity DATE;
  v_current_streak INTEGER;
BEGIN
  -- Get user's timezone (default to 'America/Los_Angeles' if not set)
  SELECT COALESCE(timezone, 'America/Los_Angeles') INTO v_user_timezone
  FROM public.user_profiles
  WHERE id = p_user_id;
  
  -- Convert current timestamp to user's timezone and extract date
  -- Using AT TIME ZONE to convert UTC to user timezone, then casting to DATE
  SELECT (NOW() AT TIME ZONE v_user_timezone)::DATE INTO v_today_user_tz;
  
  -- Get current streak state
  SELECT last_activity_date, streak_count
  INTO v_last_activity, v_current_streak
  FROM public.user_profiles
  WHERE id = p_user_id;
  
  -- Initialize if never had activity
  IF v_last_activity IS NULL THEN
    UPDATE public.user_profiles
    SET 
      streak_count = 1,
      last_activity_date = v_today_user_tz,
      last_streak_date = v_today_user_tz,
      updated_at = NOW()
    WHERE id = p_user_id;
    RETURN;
  END IF;
  
  -- Streak broken: last activity was more than 1 day ago
  IF v_last_activity < v_today_user_tz - 1 THEN
    UPDATE public.user_profiles
    SET 
      streak_count = 1,
      last_activity_date = v_today_user_tz,
      last_streak_date = v_today_user_tz,
      updated_at = NOW()
    WHERE id = p_user_id;
    RETURN;
  END IF;
  
  -- Continue streak: last activity was yesterday
  IF v_last_activity = v_today_user_tz - 1 THEN
    UPDATE public.user_profiles
    SET 
      streak_count = COALESCE(v_current_streak, 0) + 1,
      last_activity_date = v_today_user_tz,
      last_streak_date = v_today_user_tz,
      updated_at = NOW()
    WHERE id = p_user_id;
    RETURN;
  END IF;
  
  -- Already updated today: do nothing (prevents double-counting)
  -- v_last_activity = v_today_user_tz
  NULL;
END;
$$;

COMMENT ON FUNCTION public.update_streak IS 'Updates user streak when XP is awarded. Timezone-aware: converts server time to user timezone before date comparison. Automatically called by trigger.';

-- ============================================================================
-- STEP 7: Trigger Function for Automatic Streak Updates
-- ============================================================================

-- Trigger function: Called automatically when XP transaction is inserted
CREATE OR REPLACE FUNCTION public.trigger_update_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update streak for the user who earned XP
  PERFORM public.update_streak(NEW.user_id);
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.trigger_update_streak IS 'Trigger function that automatically updates user streak when XP transaction is inserted. Ensures streaks stay in sync.';

-- Create trigger: Automatically update streak on XP award
DROP TRIGGER IF EXISTS trg_update_streak ON public.user_xp_transactions;

CREATE TRIGGER trg_update_streak
AFTER INSERT ON public.user_xp_transactions
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_streak();

COMMENT ON TRIGGER trg_update_streak ON public.user_xp_transactions IS 'Automatically updates user streak whenever XP is awarded. Ensures consistency without application code changes.';

-- ============================================================================
-- STEP 8: Database Function for Daily XP Calculation (Optimized)
-- ============================================================================

-- Function: Calculate XP earned today in user's timezone
-- Uses PostgreSQL timezone conversion for efficient server-side filtering
CREATE OR REPLACE FUNCTION public.get_xp_earned_today(p_user_id UUID, p_timezone TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_today_user_tz DATE;
  v_start_of_today_utc TIMESTAMP WITH TIME ZONE;
  v_end_of_today_utc TIMESTAMP WITH TIME ZONE;
  v_total_xp INTEGER;
BEGIN
  -- Get today's date in user's timezone
  SELECT (NOW() AT TIME ZONE p_timezone)::DATE INTO v_today_user_tz;
  
  -- Calculate start of today in user timezone, converted to UTC
  -- Start: 00:00:00 in user timezone
  v_start_of_today_utc := (v_today_user_tz::text || ' 00:00:00')::timestamp AT TIME ZONE p_timezone;
  
  -- Calculate end of today in user timezone, converted to UTC
  -- End: 23:59:59.999 in user timezone
  v_end_of_today_utc := (v_today_user_tz::text || ' 23:59:59.999')::timestamp AT TIME ZONE p_timezone;
  
  -- Sum XP transactions that occurred today (in user timezone)
  SELECT COALESCE(SUM(amount), 0) INTO v_total_xp
  FROM public.user_xp_transactions
  WHERE user_id = p_user_id
    AND created_at >= v_start_of_today_utc
    AND created_at <= v_end_of_today_utc;
  
  RETURN v_total_xp;
END;
$$;

COMMENT ON FUNCTION public.get_xp_earned_today IS 'Calculates total XP earned today in user timezone. Efficient server-side filtering using PostgreSQL timezone conversion.';

-- ============================================================================
-- STEP 9: Verify RLS Policies
-- ============================================================================

-- Note: Existing RLS policy "Users can update own profile" should already allow
-- updating streak_count, last_activity_date, last_streak_date, and daily_goal_xp
-- because it uses: auth.uid() = id
-- The trigger function uses SECURITY DEFINER to bypass RLS (needed for automatic updates)
-- No additional RLS policy needed

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary:
-- ✅ Added streak_count, last_activity_date (DATE), last_streak_date (DATE) fields
-- ✅ Added daily_goal_xp field with constraints
-- ✅ Added performance indexes (corrected column order)
-- ✅ Optimized initialization query with JOIN
-- ✅ Created calculate_level() and xp_to_next_level() functions
-- ✅ Created update_streak() function with timezone awareness
-- ✅ Created trigger for automatic streak updates
-- ✅ All wrapped in transaction for safety
-- ✅ All fields have proper comments and constraints
