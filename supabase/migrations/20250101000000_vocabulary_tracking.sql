-- ============================================================================
-- VOCABULARY TRACKING SYSTEM (MVP - Launch Ready)
-- ============================================================================
-- Purpose: Track user performance on vocabulary words for review mode
-- Design: Simple, matches existing schema, easy to enhance post-launch
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────
-- TABLE: vocabulary_performance
-- Tracks per-user, per-word mastery and spaced repetition data
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vocabulary_performance (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  vocabulary_id       text NOT NULL,  -- e.g., "salam", "chetori" (matches curriculum)
  word_text           text NOT NULL,  -- e.g., "Hello" (for UI display)
  
  -- Performance counters
  total_attempts      int NOT NULL DEFAULT 0 CHECK (total_attempts >= 0),
  total_correct       int NOT NULL DEFAULT 0 CHECK (total_correct >= 0),
  total_incorrect     int NOT NULL DEFAULT 0 CHECK (total_incorrect >= 0),
  consecutive_correct int NOT NULL DEFAULT 0 CHECK (consecutive_correct >= 0),
  
  -- Mastery & review
  mastery_level       smallint NOT NULL DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 5),
  last_seen_at        timestamptz,
  next_review_at      timestamptz,
  
  -- Metadata
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  
  -- Unique constraint: one row per user per word
  UNIQUE (user_id, vocabulary_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_vocab_perf_user_next_review 
  ON public.vocabulary_performance (user_id, next_review_at) 
  WHERE next_review_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vocab_perf_user_consecutive 
  ON public.vocabulary_performance (user_id, consecutive_correct DESC);

CREATE INDEX IF NOT EXISTS idx_vocab_perf_user_mastery 
  ON public.vocabulary_performance (user_id, mastery_level ASC);

-- ──────────────────────────────────────────────────────────────────────────
-- TABLE: vocabulary_attempts
-- Detailed log of every vocabulary practice attempt (for analytics)
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vocabulary_attempts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  vocabulary_id    text NOT NULL,  -- matches curriculum IDs
  
  -- Context
  game_type        text NOT NULL,  -- 'flashcard', 'quiz', 'audio-sequence', etc.
  module_id        text,           -- e.g., "module1"
  lesson_id        text,           -- e.g., "lesson1"
  step_uid         text,           -- e.g., "v2-flashcard-salam"
  
  -- Result
  is_correct       boolean NOT NULL,
  time_spent_ms    int CHECK (time_spent_ms IS NULL OR time_spent_ms >= 0),
  
  -- Additional context (flexible JSONB for future expansion)
  context_data     jsonb,
  
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_vocab_attempts_user_time 
  ON public.vocabulary_attempts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vocab_attempts_user_vocab 
  ON public.vocabulary_attempts (user_id, vocabulary_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vocab_attempts_vocab_global 
  ON public.vocabulary_attempts (vocabulary_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vocab_attempts_context_gin 
  ON public.vocabulary_attempts USING gin (context_data);

-- ──────────────────────────────────────────────────────────────────────────
-- TRIGGER: Auto-update updated_at on vocabulary_performance
-- ──────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vocab_perf_updated_at ON public.vocabulary_performance;
CREATE TRIGGER trigger_vocab_perf_updated_at
  BEFORE UPDATE ON public.vocabulary_performance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ──────────────────────────────────────────────────────────────────────────
-- RLS POLICIES: vocabulary_performance
-- ──────────────────────────────────────────────────────────────────────────
ALTER TABLE public.vocabulary_performance ENABLE ROW LEVEL SECURITY;

-- Users can view their own performance
CREATE POLICY "Users can view own vocabulary performance"
  ON public.vocabulary_performance
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own performance
CREATE POLICY "Users can insert own vocabulary performance"
  ON public.vocabulary_performance
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own performance
CREATE POLICY "Users can update own vocabulary performance"
  ON public.vocabulary_performance
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────────────────
-- RLS POLICIES: vocabulary_attempts
-- ──────────────────────────────────────────────────────────────────────────
ALTER TABLE public.vocabulary_attempts ENABLE ROW LEVEL SECURITY;

-- Users can view their own attempts
CREATE POLICY "Users can view own vocabulary attempts"
  ON public.vocabulary_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own attempts
CREATE POLICY "Users can insert own vocabulary attempts"
  ON public.vocabulary_attempts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────────────────
-- VIEW: global_vocabulary_stats (optional - for analytics dashboard)
-- Aggregates performance across all users
-- ──────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.global_vocabulary_stats AS
SELECT
  vocabulary_id,
  COUNT(DISTINCT user_id) as total_users_seen,
  COUNT(*) as total_attempts,
  ROUND(AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) * 100, 2) as avg_accuracy_percent,
  -- Simple difficulty score: lower accuracy + more attempts = harder word
  ROUND((1.0 - AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END)) * LN(1 + COUNT(*))::numeric, 2) as difficulty_score,
  MAX(created_at) as last_attempted_at
FROM public.vocabulary_attempts
GROUP BY vocabulary_id;

-- No RLS on view (read-only, aggregated data)

-- ============================================================================
-- MIGRATION COMPLETE
-- Next steps:
-- 1. Run this migration in Supabase
-- 2. Implement VocabularyTrackingService (TypeScript)
-- 3. Integrate with game components
-- ============================================================================

