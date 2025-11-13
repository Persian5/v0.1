-- Grant execute permissions for streak functions
-- Run this if migration 20250113000000 was already applied without GRANT statements
-- 
-- SECURITY NOTE: These functions include auth.uid() validation to prevent
-- users from updating/querying other users' data

GRANT EXECUTE ON FUNCTION public.update_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_xp_earned_today(UUID, TEXT) TO authenticated;

