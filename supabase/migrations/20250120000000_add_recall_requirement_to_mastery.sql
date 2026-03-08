-- Migration: Add Recall Requirement to Mastery Classification
-- Purpose: Require at least one correct recall-based attempt (input, text-sequence, final)
--          for a word to be classified as 'mastered' in the user_word_mastery view.
-- Date: 2025-01-20
-- Related: Word mastery trust fix - prevents flashcard/recognition-only farming
--
-- WHAT CHANGES:
-- 1. 'mastered' status now requires an EXISTS check on vocabulary_attempts
--    for a correct attempt with game_type IN ('input', 'text-sequence', 'final')
-- 2. Mutual exclusivity check in 'hard' status updated to match
-- 3. No table schema changes
-- 4. No index changes (vocabulary_attempts already indexed by user_id)

BEGIN;

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
  --             AND at least one correct recall-based attempt (input/text-sequence/final)
  -- 3. Hard: (accuracy < 70% OR consecutive_correct < 2) AND total_attempts >= 2 AND NOT mastered
  -- 4. Learning: Everything else (in progress)
  CASE
    -- Unclassified: Not enough attempts
    WHEN p.total_attempts < 3 THEN 'unclassified'
    
    -- Mastered: High accuracy + consistency + minimum attempts + recall verification
    WHEN p.consecutive_correct >= 5 
         AND p.total_attempts >= 3
         AND (p.total_correct::numeric / p.total_attempts::numeric * 100) >= 90
         AND EXISTS (
           SELECT 1 FROM public.vocabulary_attempts a
           WHERE a.user_id = p.user_id
             AND a.vocabulary_id = p.vocabulary_id
             AND a.is_correct = true
             AND a.game_type IN ('input', 'text-sequence', 'final')
         )
    THEN 'mastered'
    
    -- Hard: Low accuracy OR recent struggle (AND not mastered)
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
           AND EXISTS (
             SELECT 1 FROM public.vocabulary_attempts a
             WHERE a.user_id = p.user_id
               AND a.vocabulary_id = p.vocabulary_id
               AND a.is_correct = true
               AND a.game_type IN ('input', 'text-sequence', 'final')
           )
         )
    THEN 'hard'
    
    -- Learning: In progress (not mastered, not hard, has enough attempts)
    ELSE 'learning'
  END AS status,
  
  -- Calculated: Mastery confidence score (0-100)
  -- Formula: (accuracy * 0.6) + (streak_ratio * 30) + (attempt_weight * 10)
  ROUND(
    (
      LEAST((p.total_correct::numeric / NULLIF(p.total_attempts, 0)::numeric * 100), 100) * 0.6 +
      LEAST((p.consecutive_correct::numeric / 5.0), 1.0) * 30 +
      LEAST((p.total_attempts::numeric / 5.0), 1.0) * 10
    )::numeric,
    1
  ) AS mastery_confidence,
  
  -- Calculated: Effective mastery level (with decay)
  CASE
    WHEN p.last_correct_at IS NULL THEN GREATEST(0, p.mastery_level - 1)
    WHEN p.last_correct_at < NOW() - INTERVAL '14 days' THEN GREATEST(0, p.mastery_level - 1)
    ELSE p.mastery_level
  END AS effective_mastery_level

FROM public.vocabulary_performance p;

COMMENT ON VIEW public.user_word_mastery IS 'Mastery status view with recall requirement: accuracy thresholds (90% for mastered, <70% for hard), mutual exclusivity, unclassified bucket (<3 attempts), confidence scoring, and recall verification (requires correct input/text-sequence/final attempt for mastered). Single source of truth for all mastery queries.';

COMMIT;
