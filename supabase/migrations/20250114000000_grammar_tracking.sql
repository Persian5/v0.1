-- ============================================================================
-- GRAMMAR TRACKING SYSTEM
-- ============================================================================
-- Purpose: Track user performance on grammar concepts for analytics
-- Design: Simple logging, no XP/progress/streak modification
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────
-- TABLE: grammar_performance
-- Tracks per-user, per-concept aggregate performance
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.grammar_performance (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  concept_id          text NOT NULL,  -- e.g., "ezafe-connector", "connectors-placement"
  
  -- Performance counters (simple, no mastery levels)
  total_attempts      int NOT NULL DEFAULT 0 CHECK (total_attempts >= 0),
  total_correct       int NOT NULL DEFAULT 0 CHECK (total_correct >= 0),
  total_incorrect     int NOT NULL DEFAULT 0 CHECK (total_incorrect >= 0),
  
  -- Timestamps
  last_seen_at        timestamptz,
  last_correct_at     timestamptz,
  
  -- Metadata
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  
  -- Unique constraint: one row per user per concept
  UNIQUE (user_id, concept_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_grammar_perf_user_concept 
  ON public.grammar_performance (user_id, concept_id);

CREATE INDEX IF NOT EXISTS idx_grammar_perf_user_last_seen 
  ON public.grammar_performance (user_id, last_seen_at DESC)
  WHERE last_seen_at IS NOT NULL;

-- ──────────────────────────────────────────────────────────────────────────
-- TABLE: grammar_attempts
-- Detailed log of every grammar practice attempt (for analytics)
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.grammar_attempts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  concept_id       text NOT NULL,  -- e.g., "ezafe-connector"
  
  -- Context
  step_type        text NOT NULL,  -- 'grammar-intro', 'grammar-fill-blank'
  module_id        text,           -- e.g., "module1"
  lesson_id        text,           -- e.g., "lesson3"
  step_uid         text,           -- e.g., "v3-grammar-intro-ezafe-connector-abc123"
  
  -- Result
  is_correct       boolean NOT NULL,
  time_spent_ms    int CHECK (time_spent_ms IS NULL OR time_spent_ms >= 0),
  
  -- Additional context (flexible JSONB)
  context_data     jsonb,  -- e.g., {"exerciseIndex": 0, "blankType": "suffix"}
  
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_grammar_attempts_user_time 
  ON public.grammar_attempts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_grammar_attempts_user_concept 
  ON public.grammar_attempts (user_id, concept_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_grammar_attempts_concept_global 
  ON public.grammar_attempts (concept_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_grammar_attempts_context_gin 
  ON public.grammar_attempts USING gin (context_data);

-- ──────────────────────────────────────────────────────────────────────────
-- TRIGGER: Auto-update updated_at on grammar_performance
-- ──────────────────────────────────────────────────────────────────────────
CREATE TRIGGER trigger_grammar_perf_updated_at
  BEFORE UPDATE ON public.grammar_performance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ──────────────────────────────────────────────────────────────────────────
-- RLS POLICIES: grammar_performance
-- ──────────────────────────────────────────────────────────────────────────
ALTER TABLE public.grammar_performance ENABLE ROW LEVEL SECURITY;

-- Users can view their own performance
CREATE POLICY "Users can view own grammar performance"
  ON public.grammar_performance
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own performance
CREATE POLICY "Users can insert own grammar performance"
  ON public.grammar_performance
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own performance
CREATE POLICY "Users can update own grammar performance"
  ON public.grammar_performance
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────────────────
-- RLS POLICIES: grammar_attempts
-- ──────────────────────────────────────────────────────────────────────────
ALTER TABLE public.grammar_attempts ENABLE ROW LEVEL SECURITY;

-- Users can view their own attempts
CREATE POLICY "Users can view own grammar attempts"
  ON public.grammar_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own attempts
CREATE POLICY "Users can insert own grammar attempts"
  ON public.grammar_attempts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

