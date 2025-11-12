-- Migration: Improve Word Mastery Algorithm
-- Purpose: Add accuracy thresholds, mutual exclusivity, unclassified bucket, and SQL view
-- Date: 2025-01-13
-- Related: WORD_MASTERY_ALGORITHM_RESEARCH.md, WORD_MASTERY_REFINEMENTS_ANALYSIS.md
-- 
-- IMPROVEMENTS:
-- 1. Add last_correct_at column for decay system (future)
-- 2. Create SQL view with improved mastery logic (single source of truth)
-- 3. Backfill last_correct_at from vocabulary_attempts
-- 4. Update trigger to maintain last_correct_at

BEGIN;

-- ============================================================================
-- STEP 1: Add last_correct_at Column
-- ============================================================================

-- Add column for tracking last correct answer (enables decay system)
ALTER TABLE public.vocabulary_performance
ADD COLUMN IF NOT EXISTS last_correct_at TIMESTAMPTZ;

COMMENT ON COLUMN public.vocabulary_performance.last_correct_at IS 'Last timestamp when word was answered correctly. Used for decay system (mastery degrades after inactivity).';

-- ============================================================================
-- STEP 2: Backfill last_correct_at from vocabulary_attempts
-- ============================================================================

-- For existing records, find the most recent correct attempt
UPDATE public.vocabulary_performance p
SET last_correct_at = (
  SELECT MAX(created_at)
  FROM public.vocabulary_attempts a
  WHERE a.user_id = p.user_id
    AND a.vocabulary_id = p.vocabulary_id
    AND a.is_correct = true
)
WHERE p.last_correct_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.vocabulary_attempts a
    WHERE a.user_id = p.user_id
      AND a.vocabulary_id = p.vocabulary_id
      AND a.is_correct = true
  );

-- ============================================================================
-- STEP 3: Update Trigger to Maintain last_correct_at
-- ============================================================================

-- Create function to update last_correct_at on correct answers
CREATE OR REPLACE FUNCTION public.update_last_correct_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update last_correct_at if this is a correct answer
  -- Note: This trigger runs on vocabulary_performance updates
  -- We need to check if total_correct increased (indicating correct answer)
  -- However, we can't easily detect this in the trigger, so we'll handle it in application code
  -- For now, this function exists for future use
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: We'll update last_correct_at in application code (VocabularyTrackingService)
-- This is more reliable than trying to detect correct answers in a trigger

-- ============================================================================
-- STEP 4: Create SQL View with Improved Mastery Logic
-- ============================================================================

-- View: user_word_mastery
-- Single source of truth for word mastery status
-- Implements: accuracy thresholds, mutual exclusivity, unclassified bucket

CREATE OR REPLACE VIEW public.user_word_mastery AS
SELECT
  -- Base fields
  p.user_id,
  p.vocabulary_id,
  p.word_text,
  p.total_attempts,
  p.total_correct,
  p.total_incorrect,
  p.consecutive_correct,
  p.mastery_level,
  p.last_seen_at,
  p.last_correct_at,
  p.next_review_at,
  p.created_at,
  p.updated_at,
  
  -- Calculated: Accuracy percentage (0-100)
  CASE 
    WHEN p.total_attempts > 0 
    THEN ROUND((p.total_correct::numeric / p.total_attempts::numeric * 100)::numeric, 1)
    ELSE 0.0
  END AS accuracy,
  
  -- Calculated: Error rate (0-100)
  CASE 
    WHEN p.total_attempts > 0 
    THEN ROUND((p.total_incorrect::numeric / p.total_attempts::numeric * 100)::numeric, 1)
    ELSE 0.0
  END AS error_rate,
  
  -- Calculated: Mastery status
  -- Logic: 
  -- 1. Unclassified: <3 attempts (not enough data)
  -- 2. Mastered: consecutive_correct >= 5 AND accuracy >= 90% AND total_attempts >= 3
  -- 3. Hard: (accuracy < 70% OR consecutive_correct < 2) AND total_attempts >= 2 AND NOT mastered
  -- 4. Learning: Everything else (in progress)
  CASE
    -- Unclassified: Not enough attempts
    WHEN p.total_attempts < 3 THEN 'unclassified'
    
    -- Mastered: High accuracy + consistency + minimum attempts
    -- Note: total_attempts >= 3 already checked above, so division is safe
    WHEN p.consecutive_correct >= 5 
         AND p.total_attempts >= 3
         AND (p.total_correct::numeric / p.total_attempts::numeric * 100) >= 90 
    THEN 'mastered'
    
    -- Hard: Low accuracy OR recent struggle (AND not mastered)
    -- Note: total_attempts >= 2 already checked, so division is safe
    WHEN p.total_attempts >= 2 
         AND (
           (p.total_correct::numeric / p.total_attempts::numeric * 100) < 70 
           OR p.consecutive_correct < 2
         )
         AND NOT (
           -- Exclude words that meet mastered criteria (mutual exclusivity)
           p.consecutive_correct >= 5 
           AND p.total_attempts >= 3
           AND (p.total_correct::numeric / p.total_attempts::numeric * 100) >= 90
         )
    THEN 'hard'
    
    -- Learning: In progress (not mastered, not hard, has enough attempts)
    ELSE 'learning'
  END AS status,
  
  -- Calculated: Mastery confidence score (0-100)
  -- Formula: (accuracy * 0.6) + (streak_ratio * 30) + (attempt_weight * 10)
  -- Used for analytics and future personalization
  ROUND(
    (
      -- Accuracy component (60% weight)
      LEAST((p.total_correct::numeric / NULLIF(p.total_attempts, 0)::numeric * 100), 100) * 0.6 +
      -- Streak ratio component (30% weight) - normalized to 0-1, capped at 1
      LEAST((p.consecutive_correct::numeric / 5.0), 1.0) * 30 +
      -- Attempt weight component (10% weight) - normalized to 0-1, capped at 1
      LEAST((p.total_attempts::numeric / 5.0), 1.0) * 10
    )::numeric,
    1
  ) AS mastery_confidence,
  
  -- Calculated: Effective mastery level (with decay)
  -- If last_correct_at is NULL or >14 days ago, reduce mastery_level by 1
  -- This enables decay system (can be enhanced later)
  CASE
    WHEN p.last_correct_at IS NULL THEN GREATEST(0, p.mastery_level - 1)
    WHEN p.last_correct_at < NOW() - INTERVAL '14 days' THEN GREATEST(0, p.mastery_level - 1)
    ELSE p.mastery_level
  END AS effective_mastery_level

FROM public.vocabulary_performance p;

COMMENT ON VIEW public.user_word_mastery IS 'Mastery status view with improved algorithm: accuracy thresholds (90% for mastered, <70% for hard), mutual exclusivity, unclassified bucket (<3 attempts), and confidence scoring. Single source of truth for all mastery queries.';

-- ============================================================================
-- STEP 5: Create Indexes for View Queries
-- ============================================================================

-- Index for filtering by status (used in dashboard queries)
CREATE INDEX IF NOT EXISTS idx_vocab_perf_user_status 
ON public.vocabulary_performance (user_id, total_attempts, consecutive_correct)
WHERE total_attempts > 0;

-- Index for last_correct_at (used in decay queries)
CREATE INDEX IF NOT EXISTS idx_vocab_perf_last_correct 
ON public.vocabulary_performance (user_id, last_correct_at DESC)
WHERE last_correct_at IS NOT NULL;

-- ============================================================================
-- STEP 6: Grant Permissions
-- ============================================================================

-- Grant SELECT on view to authenticated users
GRANT SELECT ON public.user_word_mastery TO authenticated;
GRANT SELECT ON public.user_word_mastery TO anon;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary:
-- ✅ Added last_correct_at column (enables decay system)
-- ✅ Backfilled last_correct_at from vocabulary_attempts
-- ✅ Created user_word_mastery view (single source of truth)
-- ✅ Implemented improved mastery logic:
--    - Mastered: consecutive_correct >= 5 AND accuracy >= 90% AND attempts >= 3
--    - Hard: (accuracy < 70% OR consecutive_correct < 2) AND attempts >= 2 AND NOT mastered
--    - Unclassified: attempts < 3
--    - Learning: Everything else
-- ✅ Added mutual exclusivity (mastered words excluded from hard)
-- ✅ Added mastery_confidence score (for analytics)
-- ✅ Added effective_mastery_level (with decay)
-- ✅ Created indexes for performance
-- ✅ All wrapped in transaction for safety

