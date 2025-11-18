-- ============================================================================
-- GRAMMAR FORMS TRACKING - FUTURE-PROOF EXTENSION
-- ============================================================================
-- Purpose: Track grammar forms (like "khoob|am", "bad|am") for review mode
-- Design: Future-proof schema (add columns now, use later = no migrations)
-- Strategy: Simple code today, ready for complex grammar tomorrow
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────
-- PHASE 1: Add grammar form columns to vocabulary_performance
-- ──────────────────────────────────────────────────────────────────────────

-- Core fields (USE NOW for launch)
ALTER TABLE public.vocabulary_performance
  ADD COLUMN IF NOT EXISTS base_vocab_id text,           -- "khoob" (for "khoob|am")
  ADD COLUMN IF NOT EXISTS suffix_id text,               -- "am" (for "khoob|am")
  ADD COLUMN IF NOT EXISTS is_grammar_form boolean DEFAULT false NOT NULL;

-- Future fields (ADD NOW, use later - avoids migrations)
ALTER TABLE public.vocabulary_performance
  ADD COLUMN IF NOT EXISTS prefix_id text,               -- For "na-khoob" (Module 5+)
  ADD COLUMN IF NOT EXISTS suffix_ids text[],            -- For "khoob-am-ro" (Module 8+)
  ADD COLUMN IF NOT EXISTS grammar_metadata jsonb;       -- For anything else

-- ──────────────────────────────────────────────────────────────────────────
-- PHASE 2: Add indexes for efficient queries
-- ──────────────────────────────────────────────────────────────────────────

-- Index for queries like: "Find all forms of base word 'khoob'"
-- WHERE base_vocab_id = 'khoob' AND is_grammar_form = true
CREATE INDEX IF NOT EXISTS idx_vocab_perf_base 
  ON public.vocabulary_performance (user_id, base_vocab_id) 
  WHERE is_grammar_form = true;

-- Index for queries like: "Find all words with suffix '-am'"
-- WHERE suffix_id = 'am' AND is_grammar_form = true
CREATE INDEX IF NOT EXISTS idx_vocab_perf_suffix 
  ON public.vocabulary_performance (user_id, suffix_id) 
  WHERE is_grammar_form = true;

-- GIN index for array queries (when we add compound suffixes)
-- WHERE 'am' = ANY(suffix_ids)
CREATE INDEX IF NOT EXISTS idx_vocab_perf_suffix_gin 
  ON public.vocabulary_performance USING gin (suffix_ids) 
  WHERE suffix_ids IS NOT NULL;

-- GIN index for JSONB queries (when we add new grammar types)
-- WHERE grammar_metadata @> '{"type": "ezafe"}'
CREATE INDEX IF NOT EXISTS idx_vocab_perf_grammar_meta_gin 
  ON public.vocabulary_performance USING gin (grammar_metadata) 
  WHERE grammar_metadata IS NOT NULL;

-- ──────────────────────────────────────────────────────────────────────────
-- COMMENTS: Document the schema for future developers
-- ──────────────────────────────────────────────────────────────────────────

COMMENT ON COLUMN public.vocabulary_performance.base_vocab_id IS 
  'Base vocabulary word ID for grammar forms. Example: "khoob" for "khoob|am" (I am good). NULL for base vocabulary.';

COMMENT ON COLUMN public.vocabulary_performance.suffix_id IS 
  'Primary suffix ID for grammar forms. Example: "am" for "khoob|am" (I am good). NULL for base vocabulary or when using suffix_ids array.';

COMMENT ON COLUMN public.vocabulary_performance.is_grammar_form IS 
  'True if this is a grammar form (e.g., "khoob|am"), false if base vocabulary (e.g., "salam"). Defaults to false.';

COMMENT ON COLUMN public.vocabulary_performance.prefix_id IS 
  'Prefix ID for grammar forms (future use). Example: "na" for "na-khoob" (not good). Currently unused, reserved for future modules.';

COMMENT ON COLUMN public.vocabulary_performance.suffix_ids IS 
  'Array of suffix IDs for compound grammar forms (future use). Example: ["am", "ro"] for "khoob-am-ro". Currently unused, reserved for future modules.';

COMMENT ON COLUMN public.vocabulary_performance.grammar_metadata IS 
  'Flexible JSONB field for future grammar types (ezafe, plural, etc.). Currently unused, reserved for future extensions.';

-- ──────────────────────────────────────────────────────────────────────────
-- NOTES: How to use this schema
-- ──────────────────────────────────────────────────────────────────────────

-- CURRENT USAGE (for launch):
-- --------------------------------
-- Base vocabulary (e.g., "salam"):
--   vocabulary_id: "salam"
--   base_vocab_id: NULL
--   suffix_id: NULL
--   is_grammar_form: false
--
-- Grammar form (e.g., "khoob|am"):
--   vocabulary_id: "khoob|am"
--   base_vocab_id: "khoob"
--   suffix_id: "am"
--   is_grammar_form: true

-- FUTURE USAGE (no migration needed):
-- --------------------------------
-- Prefix form (e.g., "na-khoob"):
--   vocabulary_id: "na|khoob"
--   base_vocab_id: "khoob"
--   prefix_id: "na"
--   suffix_id: NULL
--   is_grammar_form: true
--
-- Compound suffix (e.g., "khoob-am-ro"):
--   vocabulary_id: "khoob|am|ro"
--   base_vocab_id: "khoob"
--   suffix_ids: ["am", "ro"]
--   suffix_id: NULL (deprecated when suffix_ids used)
--   is_grammar_form: true
--
-- Complex grammar (e.g., ezafe):
--   vocabulary_id: "esme|man"
--   base_vocab_id: "esm"
--   grammar_metadata: {"type": "ezafe", "connector": "e"}
--   is_grammar_form: true

-- ============================================================================
-- MIGRATION COMPLETE
-- Next steps:
-- 1. Update VocabularyTrackingService to populate new columns
-- 2. Update ReviewSessionService to generate grammar forms
-- 3. Test end-to-end with lessons + review games
-- ============================================================================

