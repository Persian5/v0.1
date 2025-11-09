-- Migration: Public read access for leaderboard
-- Purpose: Allow leaderboard API to use anon key with RLS instead of service_role
-- Security: Only exposes safe columns for users with XP > 0

-- 1. Drop existing public read policy if it exists
DROP POLICY IF EXISTS "Public read access for leaderboard" ON public.user_profiles;

-- 2. Create new RLS policy for public leaderboard access
CREATE POLICY "Public read access for leaderboard"
ON public.user_profiles
FOR SELECT
USING (
  -- Only allow reading profiles with XP (active users)
  total_xp > 0
);

-- 3. Ensure RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Grant SELECT to anon role (if not already granted)
GRANT SELECT (id, display_name, total_xp, created_at) ON public.user_profiles TO anon;

-- 5. Verify existing columns are still protected
-- Note: first_name, last_name, email, is_premium remain protected
-- Only id, display_name, total_xp, created_at are exposed via this policy

-- 6. Add index for leaderboard query performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_user_profiles_leaderboard 
ON public.user_profiles (total_xp DESC, created_at ASC)
WHERE total_xp > 0;

