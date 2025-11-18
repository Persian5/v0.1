# Grammar Forms Tracking Analysis

## Current System

### Existing Tables
- `vocabulary_performance` - Tracks vocabulary words (e.g., "salam", "chetori")
- `vocabulary_attempts` - Logs individual attempts per user per word
- `grammar_performance` - Tracks CONCEPTS (e.g., "suffix-am") - analytics only
- `grammar_attempts` - Logs attempts on CONCEPTS - analytics only

### Current Tracking Logic
```typescript
// TrackingService logs to GrammarTrackingService with:
conceptId: `suffix-${resolved.grammar.suffixId}`  // e.g., "suffix-am"
```

**Problem:** Grammar forms (khoobam, badam) aren't tracked for review. Only concepts are tracked.

---

## What We Need

### Track Individual Grammar Forms for Review
- Forms like "khoobam", "badam", "neestam" need to be reviewable
- Review games query `vocabulary_performance` - forms should be there
- Same tracking needs: mastery, attempts, spaced repetition

---

## Architecture Decision ✅ **USE VOCABULARY TABLE**

### Option 1: Separate Tables ❌
- New `grammar_forms_performance` table
- **Problem:** Duplicates logic, review games need separate queries

### Option 2: Use vocabulary_performance ✅ **RECOMMENDED**
- Store grammar forms in `vocabulary_performance` with composite IDs
- Add metadata columns: `base_vocab_id`, `suffix_id`, `is_grammar_form`
- **Benefits:**
  - Unified review system (vocab + grammar forms together)
  - Review games already work (no changes needed)
  - Industry standard (Duolingo, Anki do this)
  - Simpler queries (one table)
  - Individual attempts already tracked in `vocabulary_attempts`

**Why This Works:**
- For review purposes, "khoobam" IS a vocabulary item (phrase to learn)
- Same tracking needs: mastery, attempts, spaced repetition
- Review games already query `vocabulary_performance` - forms appear automatically

---

## Implementation Plan

### Step 1: Create New Tables
- `grammar_forms_performance` (similar to vocabulary_performance)
- `grammar_forms_attempts` (similar to vocabulary_attempts)

### Step 2: Create New Service
- `GrammarFormsTrackingService` (similar to VocabularyTrackingService)
- Methods: `storeAttempt()`, `getUserGrammarForms()`, etc.

### Step 3: Update TrackingService
- Add logic to track forms separately from concepts
- When grammar form is used, track BOTH:
  - Concept (existing): "suffix-am"
  - Form (new): "khoobam"

### Step 4: Update Review Games
- `ReviewSessionService` queries `grammar_forms_performance`
- Generate forms dynamically from learned base words + suffixes

---

## Database Schema Changes

### Extend vocabulary_performance (ADD COLUMNS)
```sql
ALTER TABLE vocabulary_performance
  ADD COLUMN IF NOT EXISTS base_vocab_id text,      -- "khoob" for "khoobam"
  ADD COLUMN IF NOT EXISTS suffix_id text,         -- "am" for "khoobam"
  ADD COLUMN IF NOT EXISTS is_grammar_form boolean DEFAULT false;

-- Index for querying grammar forms by base word
CREATE INDEX IF NOT EXISTS idx_vocab_perf_base_vocab 
  ON vocabulary_performance (user_id, base_vocab_id) 
  WHERE is_grammar_form = true;

-- Index for querying grammar forms by suffix
CREATE INDEX IF NOT EXISTS idx_vocab_perf_suffix 
  ON vocabulary_performance (user_id, suffix_id) 
  WHERE is_grammar_form = true;
```

### vocabulary_attempts (NO CHANGES NEEDED)
- Already stores individual attempts per user per word
- `vocabulary_id` can store "khoobam" (composite ID)
- `context_data` JSONB can store base_vocab_id, suffix_id for analytics

---

## Migration Strategy

1. **Add columns to vocabulary_performance** (ALTER TABLE, no data migration)
2. **Keep existing tables** (grammar_performance stays for concept analytics)
3. **Update TrackingService** (track forms in vocabulary_performance)
4. **Review games automatically work** (they already query vocabulary_performance)

---

## Code Changes

### Migration File
- `supabase/migrations/YYYYMMDDHHMMSS_add_grammar_forms_to_vocab.sql` (ALTER TABLE)

### Modified Files
- `lib/services/tracking-service.ts` (track forms in VocabularyTrackingService)
- `lib/services/vocabulary-tracking-service.ts` (handle grammar forms)
- `lib/types.ts` (update VocabularyPerformance interface)

### No Changes Needed ✅
- `lib/services/review-session-service.ts` (already queries vocabulary_performance)
- Review game components (already use vocabulary_performance)

---

## Backward Compatibility

✅ **No breaking changes:**
- Existing `vocabulary_performance` rows unaffected (new columns nullable)
- Existing `grammar_performance` tables stay unchanged (concept analytics)
- Review games automatically include grammar forms (no code changes needed)

---

## Individual Attempts Tracking ✅

**Already Implemented:**
- `vocabulary_attempts` logs EVERY attempt per user per word
- This is industry standard (Duolingo, Anki, Memrise all do this)
- Used for:
  - Spaced repetition (when to review)
  - Analytics (error patterns, time spent)
  - Adaptive learning (weak words identification)

**For Grammar Forms:**
- Same system - each attempt on "khoobam" logged individually
- `vocabulary_id` = "khoobam" (composite ID)
- `context_data` can store base_vocab_id, suffix_id for analytics

---

## Next Steps

1. Create migration file (ALTER TABLE vocabulary_performance)
2. Update TrackingService (track forms in VocabularyTrackingService)
3. Update VocabularyTrackingService (handle grammar form metadata)
4. Test end-to-end (forms appear in review games automatically)

