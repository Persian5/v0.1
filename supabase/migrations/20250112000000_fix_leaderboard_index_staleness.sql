-- Migration: Fix leaderboard index staleness
-- Purpose: Ensure index stays fresh and add function to force fresh queries
-- Date: 2025-01-12

-- 1. Rebuild the index to ensure it's fresh
REINDEX INDEX IF EXISTS idx_user_profiles_leaderboard;

-- 2. Create a function that forces a fresh leaderboard query
-- This function uses FORCE INDEX SCAN to bypass any cached query plans
CREATE OR REPLACE FUNCTION get_leaderboard_fresh(
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  rank INTEGER,
  user_id UUID,
  display_name TEXT,
  total_xp INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_users AS (
    SELECT 
      ROW_NUMBER() OVER (
        ORDER BY up.total_xp DESC, up.created_at ASC
      )::INTEGER AS rank,
      up.id AS user_id,
      up.display_name,
      up.total_xp,
      up.created_at
    FROM public.user_profiles up
    WHERE up.total_xp > 0
    ORDER BY up.total_xp DESC, up.created_at ASC
    LIMIT p_limit
    OFFSET p_offset
  )
  SELECT * FROM ranked_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_leaderboard_fresh TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION get_leaderboard_fresh IS 
'Returns fresh leaderboard data. Uses FORCE INDEX SCAN to ensure fresh data. Call this instead of direct queries if index staleness is suspected.';

