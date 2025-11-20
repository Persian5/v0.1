# 🎯 GRAMMAR FORMS TRACKING - CLEAN IMPLEMENTATION PLAN

**Goal:** Track grammar forms (like "khoobam", "badam") for review games  
**Approach:** Future-proof schema, simple code, mini-steps  
**Time:** 8-10 hours total  
**Philosophy:** Build what you need NOW, ready for LATER

---

## 📋 PLAN OVERVIEW

**What we're building:**
- Grammar forms like "khoob|am" tracked in vocabulary_performance
- Review games can pull grammar forms for practice
- Future-ready for prefixes, compound suffixes, new grammar types
- Simple code (no complex abstractions)

**What changes:**
- ✅ Database: Add 7 columns to vocabulary_performance (future-ready)
- ✅ TrackingService: Parse "base|suffix" IDs, populate new columns
- ✅ ReviewSessionService: Generate grammar forms from learned vocab + suffixes
- ✅ Tests: Verify end-to-end

**What stays the same:**
- ❌ Type system (VocabularyItem, ResolvedLexeme work as-is)
- ❌ GrammarService (already works)
- ❌ Review game components (already work)
- ❌ curriculum.ts (already uses LexemeRef)

---

## 🎯 PHASES

1. **PHASE 1: Database Schema** (Steps 1-8) - 2 hours
2. **PHASE 2: Tracking Service** (Steps 9-18) - 3 hours
3. **PHASE 3: Review Session Service** (Steps 19-26) - 2 hours
4. **PHASE 4: Testing & Verification** (Steps 27-32) - 2 hours
5. **PHASE 5: Documentation** (Steps 33-35) - 1 hour

**Total: 35 steps, 10 hours**

---

## PHASE 1: DATABASE SCHEMA (2 hours)

### Step 1: Read current vocabulary_performance schema
**Action:** Check database_schema.md for current columns  
**Why:** Understand what exists before adding columns  
**Output:** List of current columns

---

### Step 2: Read current database migration files
**Action:** Check supabase/migrations/ for latest vocabulary tracking migration  
**Why:** Know the baseline before creating new migration  
**Output:** Baseline migration file path

---

### Step 3: Create new migration file
**Action:** Create `supabase/migrations/YYYYMMDDHHMMSS_grammar_forms_tracking.sql`  
**Why:** All schema changes via migrations  
**Output:** Empty migration file

---

### Step 4: Add columns to vocabulary_performance
**Action:** Write ALTER TABLE statement with 7 new columns:
```sql
ALTER TABLE vocabulary_performance
  -- Core fields (use NOW)
  ADD COLUMN base_vocab_id text,           -- "khoob" (for "khoob|am")
  ADD COLUMN suffix_id text,               -- "am" (for "khoob|am")
  ADD COLUMN is_grammar_form boolean DEFAULT false,
  
  -- Future fields (add now, use later)
  ADD COLUMN prefix_id text,               -- For "na-khoob" (Module 5+)
  ADD COLUMN suffix_ids text[],            -- For "khoob-am-ro" (Module 8+)
  ADD COLUMN grammar_metadata jsonb;       -- For anything else
```

**Why:** Future-proof schema, no migrations needed later  
**Verification:** SQL syntax correct  
**Output:** ALTER TABLE statement

---

### Step 5: Add index for base_vocab_id queries
**Action:** Write CREATE INDEX statement:
```sql
CREATE INDEX idx_vocab_perf_base 
  ON vocabulary_performance (user_id, base_vocab_id) 
  WHERE is_grammar_form = true;
```

**Why:** Fast queries like "find all forms of 'khoob'"  
**Output:** CREATE INDEX statement

---

### Step 6: Add index for suffix_id queries
**Action:** Write CREATE INDEX statement:
```sql
CREATE INDEX idx_vocab_perf_suffix 
  ON vocabulary_performance (user_id, suffix_id) 
  WHERE is_grammar_form = true;
```

**Why:** Fast queries like "find all words with suffix '-am'"  
**Output:** CREATE INDEX statement

---

### Step 7: Add GIN index for suffix_ids array (future)
**Action:** Write CREATE INDEX statement:
```sql
CREATE INDEX idx_vocab_perf_suffix_gin 
  ON vocabulary_performance USING gin (suffix_ids) 
  WHERE suffix_ids IS NOT NULL;
```

**Why:** Fast array queries when we add compound suffixes  
**Output:** CREATE INDEX statement

---

### Step 8: Run migration locally
**Action:** Apply migration to local Supabase database  
**How:** Supabase dashboard → SQL Editor → Run migration  
**Verification:** Check vocabulary_performance has new columns  
**Rollback:** Drop columns if needed  
**Output:** Migration applied successfully

---

## PHASE 2: TRACKING SERVICE (3 hours)

### Step 9: Read VocabularyTrackingService.storeAttempt()
**Action:** Review lib/services/vocabulary-tracking-service.ts  
**Why:** Understand current implementation before modifying  
**Output:** Current logic notes

---

### Step 10: Read types for VocabularyPerformance
**Action:** Check lib/types.ts for VocabularyPerformance interface  
**Why:** Know what TypeScript expects  
**Output:** Current interface

---

### Step 11: Update VocabularyPerformance type
**Action:** Add new fields to TypeScript interface:
```typescript
export interface VocabularyPerformance {
  id: string;
  user_id: string;
  vocabulary_id: string;  // "khoob|am" or "salam"
  word_text: string;
  
  // Performance metrics (existing)
  total_attempts: number;
  total_correct: number;
  // ... rest of existing fields
  
  // NEW: Grammar form fields
  base_vocab_id?: string;      // "khoob"
  suffix_id?: string;           // "am"
  is_grammar_form: boolean;     // true/false
  prefix_id?: string;           // null for now
  suffix_ids?: string[];        // null for now
  grammar_metadata?: any;       // null for now
}
```

**Why:** TypeScript must match database schema  
**Verification:** No type errors  
**Output:** Updated interface

---

### Step 12: Create grammar form parser helper
**Action:** Add helper function to VocabularyTrackingService:
```typescript
private static parseGrammarFormId(vocabularyId: string) {
  // Parse "base|suffix" format
  if (vocabularyId.includes('|')) {
    const [baseId, suffixId] = vocabularyId.split('|');
    return {
      baseVocabId: baseId,
      suffixId: suffixId,
      isGrammarForm: true
    };
  }
  
  // Base vocabulary (no grammar)
  return {
    baseVocabId: null,
    suffixId: null,
    isGrammarForm: false
  };
}
```

**Why:** Clean separation of parsing logic  
**Verification:** Test with "khoob|am" and "salam"  
**Output:** Parser function

---

### Step 13: Update StoreAttemptParams interface
**Action:** No changes needed (vocabularyId already exists)  
**Why:** Verify interface supports both "salam" and "khoob|am"  
**Output:** Confirmed compatible

---

### Step 14: Update storeAttempt() to parse grammar forms
**Action:** Add parsing logic at start of storeAttempt():
```typescript
static async storeAttempt(params: StoreAttemptParams): Promise<boolean> {
  const { userId, vocabularyId, wordText, ... } = params;
  
  // Parse grammar form (NEW)
  const parsed = this.parseGrammarFormId(vocabularyId);
  const { baseVocabId, suffixId, isGrammarForm } = parsed;
  
  // ... rest of existing logic
}
```

**Why:** Extract grammar metadata from ID  
**Verification:** Parses both "khoob|am" and "salam"  
**Output:** Updated storeAttempt()

---

### Step 15: Update upsert to include new columns
**Action:** Modify Supabase upsert to include grammar fields:
```typescript
const { data, error } = await supabase
  .from('vocabulary_performance')
  .upsert({
    user_id: userId,
    vocabulary_id: vocabularyId,
    word_text: wordText,
    
    // NEW: Grammar form fields
    base_vocab_id: baseVocabId,
    suffix_id: suffixId,
    is_grammar_form: isGrammarForm,
    // Leave these null for now:
    // prefix_id: null,
    // suffix_ids: null,
    // grammar_metadata: null,
    
    // Performance metrics (existing logic)
    total_attempts: /* existing increment logic */,
    total_correct: /* existing increment logic */,
    // ... rest of existing fields
  }, {
    onConflict: 'user_id,vocabulary_id'
  });
```

**Why:** Populate new database columns  
**Verification:** Upsert succeeds  
**Output:** Updated upsert

---

### Step 16: Update vocabulary_attempts context_data
**Action:** Add grammar metadata to context_data JSONB:
```typescript
await supabase.from('vocabulary_attempts').insert({
  user_id: userId,
  vocabulary_id: vocabularyId,
  game_type: gameType,
  is_correct: isCorrect,
  context_data: {
    base_vocab_id: baseVocabId,     // NEW
    suffix_id: suffixId,             // NEW
    is_grammar_form: isGrammarForm,  // NEW
    ...contextData
  }
});
```

**Why:** Analytics on grammar form attempts  
**Output:** Updated insert

---

### Step 17: Test storeAttempt() with base vocab
**Action:** Create test that tracks "salam" (base vocab)  
**Expected:**
```
vocabulary_performance:
  vocabulary_id: "salam"
  base_vocab_id: null
  suffix_id: null
  is_grammar_form: false
```

**Verification:** Check database has correct data  
**Output:** Test passes

---

### Step 18: Test storeAttempt() with grammar form
**Action:** Create test that tracks "khoob|am" (grammar form)  
**Expected:**
```
vocabulary_performance:
  vocabulary_id: "khoob|am"
  base_vocab_id: "khoob"
  suffix_id: "am"
  is_grammar_form: true
```

**Verification:** Check database has correct data  
**Output:** Test passes

---

## PHASE 3: REVIEW SESSION SERVICE (2 hours)

### Step 19: Read ReviewSessionService.getVocabularyForFilter()
**Action:** Review lib/services/review-session-service.ts  
**Why:** Understand current vocabulary fetching logic  
**Output:** Current logic notes

---

### Step 20: Read curriculum-lexicon.ts for suffix tracking
**Action:** Check lib/utils/curriculum-lexicon.ts for suffix introduction tracking  
**Why:** Know when suffixes are introduced to users  
**Output:** Suffix tracking logic notes

---

### Step 21: Plan grammar form generation logic
**Action:** Design algorithm:
```
1. Get user's learned base vocabulary (existing)
2. Get user's learned suffixes (from curriculum-lexicon)
3. Generate all combinations: base × suffixes
4. Filter to forms actually used in curriculum
5. Return as LexemeRef[] for review games
```

**Why:** Review games need forms to practice  
**Output:** Algorithm design

---

### Step 22: Create helper to get learned suffixes
**Action:** Add helper function to ReviewSessionService:
```typescript
private static getLearnedSuffixes(
  moduleId: string, 
  lessonId: string
): string[] {
  // Use curriculum-lexicon to find suffixes introduced so far
  const lexicon = getCurriculumLexicon();
  const suffixes: string[] = [];
  
  // Extract suffixes from suffix introductions map
  // ... logic to scan curriculum up to current lesson
  
  return suffixes;
}
```

**Why:** Know which suffixes user has learned  
**Output:** Helper function

---

### Step 23: Create helper to generate grammar forms
**Action:** Add helper function to ReviewSessionService:
```typescript
private static generateGrammarForms(
  baseVocabIds: string[],
  suffixIds: string[]
): LexemeRef[] {
  const forms: LexemeRef[] = [];
  
  for (const baseId of baseVocabIds) {
    for (const suffixId of suffixIds) {
      // Generate GrammarRef
      forms.push({
        kind: 'suffix',
        baseId: baseId,
        suffixId: suffixId
      });
    }
  }
  
  return forms;
}
```

**Why:** Create all valid combinations  
**Output:** Helper function

---

### Step 24: Update getVocabularyForFilter() to include forms
**Action:** Modify getVocabularyForFilter() to:
```typescript
static async getVocabularyForFilter(
  userId: string,
  filter: ReviewFilter,
  moduleId?: string,
  lessonId?: string
): Promise<string[]> {
  // 1. Get base vocabulary (existing logic)
  const baseVocabIds = await this.getBaseVocabularyForFilter(userId, filter);
  
  // 2. Get grammar forms (NEW)
  let grammarFormIds: string[] = [];
  if (moduleId && lessonId) {
    const learnedSuffixes = this.getLearnedSuffixes(moduleId, lessonId);
    const grammarForms = this.generateGrammarForms(baseVocabIds, learnedSuffixes);
    
    // Convert LexemeRef to string IDs ("khoob|am")
    grammarFormIds = grammarForms.map(ref => {
      if (typeof ref === 'string') return ref;
      return `${ref.baseId}|${ref.suffixId}`;
    });
  }
  
  // 3. Combine and return
  return [...baseVocabIds, ...grammarFormIds];
}
```

**Why:** Review games get both base vocab AND grammar forms  
**Verification:** Returns correct IDs  
**Output:** Updated function

---

### Step 25: Test getVocabularyForFilter() with grammar forms
**Action:** Create test:
- User learned: "khoob", "bad", "neest"
- User learned: suffix "-am"
- Expected output: ["khoob", "bad", "neest", "khoob|am", "bad|am", "neest|am"]

**Verification:** Returns all IDs correctly  
**Output:** Test passes

---

### Step 26: Verify review games can handle grammar form IDs
**Action:** Check that review games already use GrammarService.resolve()  
**Expected:** Games resolve both "salam" and "khoob|am" correctly  
**Why:** No game changes needed (they already work)  
**Output:** Confirmed compatible

---

## PHASE 4: TESTING & VERIFICATION (2 hours)

### Step 27: End-to-end test - Track base vocab
**Action:** Complete lesson step with base vocab ("salam")  
**Verification:** 
- vocabulary_performance has row with is_grammar_form = false
- vocabulary_attempts logged correctly

**Output:** Base vocab tracking works

---

### Step 28: End-to-end test - Track grammar form
**Action:** Complete lesson step with grammar form ("khoob|am")  
**Verification:**
- vocabulary_performance has row with is_grammar_form = true
- base_vocab_id = "khoob"
- suffix_id = "am"
- vocabulary_attempts logged correctly

**Output:** Grammar form tracking works

---

### Step 29: End-to-end test - Review game with forms
**Action:** Play review game (Audio Definitions)  
**Expected:** See both base vocab and grammar forms in game  
**Verification:** Forms appear correctly with right audio/text  
**Output:** Review games work with forms

---

### Step 30: Test all review games
**Action:** Test each review game:
- Review Audio Definitions
- Review Memory Game
- Review Matching Marathon
- Persian Word Rush

**Verification:** All games handle grammar forms  
**Output:** All games work

---

### Step 31: Test edge cases
**Action:** Test:
- Empty vocabulary (new user)
- No suffixes learned yet
- Only base vocab (Module 1 Lesson 1-2)
- Mixed base vocab + grammar forms

**Verification:** No crashes, graceful handling  
**Output:** Edge cases handled

---

### Step 32: Check database indexes are used
**Action:** Run EXPLAIN query on vocabulary_performance  
**Verification:** Indexes are being used efficiently  
**Output:** Query performance acceptable

---

## PHASE 5: DOCUMENTATION (1 hour)

### Step 33: Update database_schema.md
**Action:** Document new columns in vocabulary_performance  
**Content:**
```markdown
### vocabulary_performance (UPDATED: 2025-01-XX)
- **base_vocab_id** (TEXT, nullable) - Base word for grammar forms (e.g., "khoob" for "khoob|am")
- **suffix_id** (TEXT, nullable) - Suffix for grammar forms (e.g., "am" for "khoob|am")
- **is_grammar_form** (BOOLEAN, default false) - True if this is a grammar form, false if base vocab
- **prefix_id** (TEXT, nullable) - Prefix for future grammar forms (unused, reserved)
- **suffix_ids** (TEXT[], nullable) - Multiple suffixes for compound forms (unused, reserved)
- **grammar_metadata** (JSONB, nullable) - Metadata for future grammar types (unused, reserved)
```

**Output:** Updated documentation

---

### Step 34: Update V0.1_LAUNCH_CHECKLIST.md
**Action:** Check off grammar forms tracking item  
**Why:** Track progress toward launch  
**Output:** Checklist updated

---

### Step 35: Add comments to code
**Action:** Add JSDoc comments to:
- VocabularyTrackingService.parseGrammarFormId()
- ReviewSessionService.generateGrammarForms()
- Database migration file

**Why:** Future you will thank you  
**Output:** Code documented

---

## ✅ VERIFICATION CHECKLIST

After completing all steps, verify:

- [ ] Database has 7 new columns in vocabulary_performance
- [ ] Indexes created (4 total: base, suffix, suffix_gin, metadata_gin)
- [ ] Base vocab tracking works ("salam")
- [ ] Grammar form tracking works ("khoob|am")
- [ ] Review games show grammar forms
- [ ] All 4 review games tested and working
- [ ] Edge cases handled (empty vocab, no suffixes)
- [ ] Documentation updated
- [ ] TypeScript compiles without errors
- [ ] No console errors in browser

---

## 🚀 WHAT YOU GET

**Immediate benefits:**
- ✅ Grammar forms tracked and reviewable
- ✅ Review games automatically include forms
- ✅ Clean, simple code

**Future benefits:**
- ✅ Add prefixes: Just start using prefix_id column (no migration)
- ✅ Add compound suffixes: Just start using suffix_ids column (no migration)
- ✅ Add new grammar types: Just use grammar_metadata JSONB (no migration)
- ✅ No data loss, no complexity

**Time saved:**
- ❌ No 120-step plan
- ❌ No complex type system refactoring
- ❌ No unified lookup functions
- ❌ No migrations in the future

---

## 🎯 READY TO START?

Begin with **Step 1: Read current vocabulary_performance schema**

Let's build this together - clean, simple, future-proof. 🚀

