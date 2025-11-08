-- Migration: Add onboarding fields to user_profiles
-- Purpose: Store user onboarding preferences (learning goal, current level, primary focus)
-- Date: 2025-01-03

-- Add learning_goal column (why user is learning Persian)
-- Values: 'heritage', 'travel', 'family', 'academic', 'fun'
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS learning_goal TEXT;

-- Add current_level column (user's declared proficiency level)
-- Values: 'beginner', 'few_words', 'basic_conversation', 'intermediate'
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS current_level TEXT;

-- Add primary_focus column (what user wants to focus on)
-- Values: 'speaking', 'reading', 'writing', 'all'
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS primary_focus TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.user_profiles.learning_goal IS 'User declared reason for learning Persian. Values: heritage, travel, family, academic, fun. Set during onboarding.';
COMMENT ON COLUMN public.user_profiles.current_level IS 'User declared current proficiency level. Values: beginner, few_words, basic_conversation, intermediate. Set during onboarding (optional).';
COMMENT ON COLUMN public.user_profiles.primary_focus IS 'User declared primary learning focus. Values: speaking, reading, writing, all. Set during onboarding (optional).';

-- Note: All columns are nullable to support:
-- 1. Existing users (who haven't completed onboarding)
-- 2. Users who skip optional onboarding steps
-- 3. Backward compatibility with existing data

