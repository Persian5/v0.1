-- Migration: Add leaderboard performance index
-- Purpose: Speed up leaderboard queries (ORDER BY total_xp DESC, created_at ASC)
-- Security: No sensitive data, read-only optimization
-- Date: 2025-01-04

-- Index for fast leaderboard queries
-- Supports: ORDER BY total_xp DESC, created_at ASC (tie-breaker)
-- Performance: O(log n) instead of O(n) for sorting
CREATE INDEX IF NOT EXISTS idx_user_profiles_leaderboard
  ON public.user_profiles(total_xp DESC, created_at ASC);

-- Add comment for documentation
COMMENT ON INDEX public.idx_user_profiles_leaderboard IS 'Leaderboard performance index. Speeds up queries sorting by XP (desc) with created_at tie-breaker (asc). Created: 2025-01-04';

-- Note: This index will be used automatically by queries like:
-- SELECT * FROM user_profiles WHERE total_xp > 0 ORDER BY total_xp DESC, created_at ASC LIMIT 100

