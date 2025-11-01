-- Migration: Add review XP tracking columns to user_profiles
-- Purpose: Track daily review XP cap (1000 XP per 24-hour period, user timezone)
-- Date: 2025-01-02

-- Add review_xp_earned_today column (tracks XP earned in review games today)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS review_xp_earned_today INTEGER NOT NULL DEFAULT 0 CHECK (review_xp_earned_today >= 0);

-- Add review_xp_reset_at column (timestamp for when daily XP resets - midnight user timezone)
-- Stored as UTC, but represents midnight in user's timezone
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS review_xp_reset_at TIMESTAMP WITH TIME ZONE;

-- Add timezone column (user's timezone for daily reset calculation)
-- Defaults to 'America/Los_Angeles' (PST/PDT) but can be updated to browser timezone
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles';

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.review_xp_earned_today IS 'Daily counter for XP earned in review games. Resets at midnight user timezone. Max 1000 XP per day.';
COMMENT ON COLUMN public.user_profiles.review_xp_reset_at IS 'Timestamp (UTC) for when review_xp_earned_today resets (midnight user timezone). Calculated and updated by application layer.';
COMMENT ON COLUMN public.user_profiles.timezone IS 'User timezone (IANA timezone, e.g., "America/Los_Angeles"). Used for daily XP reset calculation. Defaults to browser timezone on first review game play.';

-- Note: review_xp_reset_at initialization will be handled by application layer
-- when user first plays review games (using browser timezone detection)

