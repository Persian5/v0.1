-- Migration: Add review XP tracking columns to user_profiles
-- Purpose: Track daily review XP cap (1000 XP per 24-hour period, user timezone)
-- Date: 2025-01-02

-- Add review_xp_earned_today column (tracks XP earned in review games today)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS review_xp_earned_today INTEGER NOT NULL DEFAULT 0 CHECK (review_xp_earned_today >= 0);

-- Add review_xp_reset_at column (timestamp for when daily XP resets - midnight user timezone)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS review_xp_reset_at TIMESTAMP WITH TIME ZONE;

-- Add timezone column (user's timezone for daily reset calculation)
-- Defaults to 'America/Los_Angeles' (PST/PDT) but can be updated to browser timezone
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles';

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.review_xp_earned_today IS 'Daily counter for XP earned in review games. Resets at midnight user timezone. Max 1000 XP per day.';
COMMENT ON COLUMN public.user_profiles.review_xp_reset_at IS 'Timestamp for when review_xp_earned_today resets (midnight user timezone). Used to detect if daily reset is needed.';
COMMENT ON COLUMN public.user_profiles.timezone IS 'User timezone (IANA timezone, e.g., "America/Los_Angeles"). Used for daily XP reset calculation.';

-- Initialize review_xp_reset_at for existing users (set to next midnight in their timezone)
-- Note: This is a best-effort initialization. For new users, it will be set when they first play review games.
UPDATE public.user_profiles
SET review_xp_reset_at = (
  -- Calculate next midnight in user's timezone
  -- For now, use default timezone, users can update later
  (CURRENT_DATE + INTERVAL '1 day')::timestamp AT TIME ZONE timezone
)
WHERE review_xp_reset_at IS NULL;

