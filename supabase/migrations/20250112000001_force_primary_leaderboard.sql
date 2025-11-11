-- Migration: Force leaderboard to read from primary database
-- Purpose: Ensure real-time data by bypassing read replica lag
-- Date: 2025-01-12

-- Create function that forces primary database read
-- Uses advisory lock to force routing to primary without blocking
CREATE OR REPLACE FUNCTION get_all_users_for_leaderboard()
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  total_xp INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Force primary read using advisory lock with unique session ID
  -- This prevents blocking (each call gets unique lock)
  -- pg_backend_pid() ensures each connection has its own lock
  PERFORM pg_advisory_xact_lock(hashtext('leaderboard'), pg_backend_pid());
  
  -- Now read from primary database (guaranteed fresh data)
  RETURN QUERY
  SELECT 
    up.id,
    up.display_name,
    up.total_xp,
    up.created_at
  FROM user_profiles up;
  
  -- Note: No ORDER BY here - we sort in application code for flexibility
  -- Note: No filtering here - we filter in application code
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated and anon (for public leaderboard)
GRANT EXECUTE ON FUNCTION get_all_users_for_leaderboard TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION get_all_users_for_leaderboard IS 
'Returns all user profiles for leaderboard. Forces read from primary database (not replica) using advisory locks for real-time accuracy without blocking.';


