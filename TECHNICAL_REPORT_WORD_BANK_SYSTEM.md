# Technical Report: Word Bank System & Vocabulary Tracking
**Generated:** 2024  
**Scope:** WordBankService, VocabularyTrackingService, AudioSequence, TextSequence  
**Phases:** 1-4 Complete

---

## 🔹 Summary of Completed Work

### Phase 1: Type System & Architecture Foundation
**Files Created/Modified:**
- `lib/types.ts`: Added `semanticGroup?: string` to `VocabularyItem` interface
- `lib/config/semantic-groups.ts`: New semantic group configuration system
- `lib/services/word-bank-service.ts`: Initial service skeleton (1,188 lines)
- `lib/services/vocabulary-tracking-service.ts`: Tracking interfaces and service (307 lines)

**Key Decisions:**
- Unified `WordBankItem` interface for all word bank generation
- Semantic groups stored in config file (not database) for maintainability
- Tracking service abstracted with TODO placeholders for Supabase integration
- Separation of concerns: normalization, matching, filtering, distractor generation

### Phase 2: WordBankService Core Logic
**Implementation Highlights:**
- **`normalizeVocabEnglish()`**: Handles slash-separated translations ("I / Me" → "I")
- **`expandContractions()`**: 20+ contractions supported (I'm → i am, you're → you are, etc.)
- **`normalizeForValidation()`**: Returns array of normalized variants for flexible matching
- **`extractSemanticUnitsFromExpected()`**: PRIMARY source for TextSequence - ensures all expected words appear
- **`matchWordsToVocabulary()`**: Smart phrase detection (3-word → 2-word → single words)
- **`detectPhrases()`**: Priority ordering prevents partial matches (e.g., "How are you" before "How are")

### Phase 3: Component Migration & Integration
**Files Migrated:**
- `app/components/games/AudioSequence.tsx`: Uses `WordBankService.generateWordBank()` (406 lines)
- `app/components/games/TextSequence.tsx`: Uses `WordBankService.generateWordBank()` (274 lines)

**Migration Details:**
- Replaced manual word bank generation with unified service calls
- Added `wordBankData` state for mapping display keys → vocabulary IDs
- Updated validation to use `WordBankService.normalizeForValidation()` for consistency
- Added semantic unit counting via `WordBankService.getSemanticUnits()`

### Phase 4: Advanced Filtering & Edge Cases
**Recent Enhancements:**
1. **Contextual Vocab Filtering** (lines 608-626, 774-794):
   - Filters vocab items already covered by matched phrases
   - Example: Skips "I do" (mikonam) when "live" (zendegi mikonam) is already matched
   - Applied in both `extractSemanticUnitsFromExpected()` and `matchWordsToVocabulary()`

2. **Sub-Phrase Filtering** (lines 255-354):
   - Detects sub-phrases within correct phrases (e.g., "you are" within "where are you")
   - Handles reversed word order for Persian→English translations
   - Filters distractors that are sub-phrases of correct answers
   - Prevents single-word components from multi-word phrases appearing separately

3. **Synonym Deduplication** (lines 377-422):
   - True synonym detection (hi/hello/salam only, not semantic group duplicates)
   - Prefers correct answer variant when multiple synonyms exist
   - Prevents duplicate greetings in word bank

4. **Slash-Variant Filtering** (lines 401-445):
   - Removes ALL slash-separated translations from distractors
   - Normalizes display text consistently ("I / Me" → "I")
   - Prevents "I/me" from appearing in word bank

5. **Curriculum Updates**:
   - Added `expectedTranslation` to all `audio-sequence` and `text-sequence` steps
   - Ensures semantic unit validation works consistently

**Current State:**
- WordBankService: 1,188 lines, fully functional
- VocabularyTrackingService: 307 lines, interfaces complete, Supabase TODO
- AudioSequence: Integrated, using word bank service
- TextSequence: Integrated, using word bank service
- Semantic groups: 8 groups defined, scalable configuration

---

## 🔹 Strengths / Wins

### Architecture Wins
1. **Unified Service Layer** (`WordBankService`)
   - ✅ Single source of truth for word bank generation
   - ✅ Consistent normalization across all game types
   - ✅ Easier to test and debug (centralized logic)
   - ✅ Reusable across future game types

2. **ExpectedTranslation-First Design**
   - ✅ `extractSemanticUnitsFromExpected()` prioritizes expected text over vocabulary matching
   - ✅ Guarantees all expected words appear in word bank (no missing words)
   - ✅ Falls back to vocabulary matching gracefully
   - ✅ Handles edge cases (missing vocab, contextual mappings)

3. **Semantic Group System** (`semantic-groups.ts`)
   - ✅ Centralized configuration (easy to extend)
   - ✅ 70/30 distractor strategy (same group / related groups)
   - ✅ Scalable: Adding new groups doesn't require code changes
   - ✅ Type-safe with const assertions

4. **Separation of Concerns**
   - ✅ Normalization: `normalizeVocabEnglish()`, `normalizeForValidation()`, `expandContractions()`
   - ✅ Matching: `matchWordsToVocabulary()`, `detectPhrases()`, `extractSemanticUnitsFromExpected()`
   - ✅ Filtering: Sub-phrase detection, contextual filtering, deduplication
   - ✅ Generation: Semantic distractors, random fallback

5. **Type Safety**
   - ✅ Comprehensive interfaces: `WordBankOptions`, `WordBankResult`, `WordBankItem`
   - ✅ TypeScript strict mode compliance
   - ✅ No `any` types in public APIs

### Performance Wins
1. **Single-Pass Processing**
   - ✅ Phrase detection runs once per `expectedTranslation`
   - ✅ Normalization cached within single generation call
   - ✅ No redundant vocabulary lookups

2. **Efficient Data Structures**
   - ✅ Uses `Set<string>` for O(1) membership checks
   - ✅ Uses `Map<string, WordBankItem[]>` for vocabulary lookups
   - ✅ Fisher-Yates shuffle for random ordering

3. **Component-Level Memoization**
   - ✅ `AudioSequence`: Word bank generated once in `useState` initializer
   - ✅ `TextSequence`: Word bank generated once in `useState` initializer
   - ✅ Prevents re-generation on every render

### Correctness Wins
1. **Phrase Detection Priority**
   - ✅ 3-word phrases detected before 2-word (prevents partial matches)
   - ✅ Order preserved: Matches phrases in sequence they appear
   - ✅ Handles contractions correctly ("I'm good" → "i am good")

2. **Normalization Consistency**
   - ✅ Same normalization functions used for display, matching, and validation
   - ✅ Handles punctuation, case, contractions, slashes uniformly
   - ✅ Synonym support (hi/hello/salam interchangeable)

3. **Edge Case Coverage**
   - ✅ Missing vocabulary items (fallback to expected word)
   - ✅ Contextual mappings (e.g., "your" → "shoma" displays as "Your")
   - ✅ Sub-phrase filtering (prevents "you are" when "where are you" is correct)
   - ✅ Slash-separated translations handled consistently

4. **Idempotency Ready**
   - ✅ `VocabularyTrackingService` designed with `attemptUid` for idempotency
   - ✅ Integrates with existing XP idempotency system (`stepUid`)

---

## 🔹 Weaknesses / Risks

### Architecture Concerns
1. **Service Size**
   - ⚠️ `WordBankService` is 1,188 lines (single file)
   - ⚠️ Multiple responsibilities: normalization, matching, filtering, generation
   - 💡 **Risk**: Harder to maintain, potential for merge conflicts
   - 💡 **Mitigation**: Consider splitting into `WordBankNormalizer`, `WordBankMatcher`, `WordBankGenerator`

2. **Static Class Design**
   - ⚠️ All methods are static (no instance state)
   - ⚠️ No dependency injection (harder to mock for testing)
   - 💡 **Risk**: Difficult to test in isolation
   - 💡 **Mitigation**: Could refactor to instance-based with dependency injection

3. **Hardcoded Contraction List** (lines 101-128)
   - ⚠️ 20+ contractions hardcoded in `expandContractions()`
   - ⚠️ Adding new contractions requires code changes
   - 💡 **Risk**: Not scalable for new languages or edge cases
   - 💡 **Mitigation**: Consider external configuration file

4. **Contextual Mapping Limitations** (lines 52-59)
   - ⚠️ `CONTEXTUAL_MAPPING` hardcoded with only 5 entries
   - ⚠️ No automatic detection of contextual relationships
   - 💡 **Risk**: Manual maintenance required for each new contextual case
   - 💡 **Mitigation**: Could add to vocabulary metadata (e.g., `contextualMappings` field)

5. **VocabularyTrackingService Not Integrated**
   - ⚠️ Service exists but no components call `recordAttempt()` yet
   - ⚠️ Supabase integration is TODO (lines 144-156)
   - 💡 **Risk**: Tracking system incomplete, not ready for analytics
   - 💡 **Mitigation**: Phase 5 priority

### Performance Concerns
1. **Word Bank Generation on Every Step**
   - ⚠️ `generateWordBank()` runs on component mount (not cached across steps)
   - ⚠️ For lessons with 15-20 steps, this could be 15-20 generations
   - 💡 **Risk**: Redundant computation if same vocabulary appears in multiple steps
   - 💡 **Mitigation**: Cache word banks by `(expectedTranslation, vocabularyBank)` key

2. **Multiple Normalization Passes**
   - ⚠️ Normalization happens multiple times per generation:
     - `normalizeVocabEnglish()` in correct item extraction
     - `normalizeForValidation()` in phrase detection
     - `normalizeCase()` in final assembly
   - 💡 **Risk**: Minor performance hit, but acceptable given clarity trade-off

3. **Array Operations in Hot Paths**
   - ⚠️ `detectPhrases()` uses nested loops (O(n²) for 3-word phrases)
   - ⚠️ `generateSemanticDistractors()` filters vocabulary multiple times
   - 💡 **Risk**: Could be slow with very large vocabulary banks (1000+ items)
   - 💡 **Mitigation**: Vocabulary banks are typically <100 items, acceptable for now

4. **No Memoization in Service Layer**
   - ⚠️ Service methods are pure but not memoized
   - ⚠️ Same input → same output, but recomputed every time
   - 💡 **Risk**: Redundant computation for identical inputs
   - 💡 **Mitigation**: Add `useMemo`-like caching in service or component layer

### Maintainability Concerns
1. **Semantic Group Configuration Manual**
   - ⚠️ New vocabulary items require manual addition to `semantic-groups.ts`
   - ⚠️ No validation that all vocabulary items have groups
   - 💡 **Risk**: Easy to forget to add groups for new vocab
   - 💡 **Mitigation**: Add validation script or auto-assign defaults

2. **Synonym Detection Hardcoded** (lines 395-398)
   - ⚠️ Greeting synonyms (hi/hello/salam) hardcoded in deduplication logic
   - ⚠️ Adding new synonym groups requires code changes
   - 💡 **Risk**: Not scalable for other synonym groups
   - 💡 **Mitigation**: Move to semantic group metadata (e.g., `synonymGroup: "greetings"`)

3. **Phrase Detection Limited to 2-3 Words**
   - ⚠️ `detectPhrases()` only handles 2-word and 3-word phrases
   - ⚠️ 4+ word phrases not detected automatically
   - 💡 **Risk**: Long phrases (e.g., "How do you say X in Persian?") won't match
   - 💡 **Mitigation**: Acceptable for now, but consider dynamic phrase length detection

4. **No Unit Tests**
   - ⚠️ No test coverage for `WordBankService` critical functions
   - ⚠️ Edge cases validated manually only
   - 💡 **Risk**: Regression risk on refactoring
   - 💡 **Mitigation**: High priority for Phase 5

### Correctness Risks
1. **Order Preservation in `extractSemanticUnitsFromExpected()`**
   - ⚠️ Complex logic to preserve order (lines 559-680)
   - ⚠️ Multiple `continue` statements and index tracking
   - 💡 **Risk**: Subtle bugs if phrase detection changes
   - 💡 **Mitigation**: Well-tested manually, but needs automated tests

2. **Sub-Phrase Reversal Logic** (lines 278-279)
   - ⚠️ Reverses ALL 2-word pairs (e.g., "where are" → "are where")
   - ⚠️ May filter out valid distractors that happen to be reversed
   - 💡 **Risk**: Over-filtering in edge cases
   - 💡 **Mitigation**: Only applied to sub-phrases of correct phrases (acceptable)

3. **Missing Vocabulary Fallback**
   - ⚠️ Falls back to raw expected word if vocabulary match fails (line 669)
   - ⚠️ No validation that expected word makes sense
   - 💡 **Risk**: Typos in `expectedTranslation` could produce invalid word bank items
   - 💡 **Mitigation**: Works as intended (guarantees expected words appear)

4. **Contraction Expansion Edge Cases**
   - ⚠️ `expandContractions()` handles 20+ cases but may miss edge cases
   - ⚠️ Order-dependent (longest first) could fail on nested contractions
   - 💡 **Risk**: Rare edge cases (e.g., "I'd've" → not handled)
   - 💡 **Mitigation**: Acceptable for Persian learning app (English contractions limited)

### Testing Gaps
1. **No Automated Tests**
   - ⚠️ Zero test coverage (no `*.test.ts` files found)
   - ⚠️ Manual testing only
   - 💡 **Impact**: High risk of regressions

2. **Edge Cases Not Systematically Tested**
   - ⚠️ Phrase detection with overlapping phrases
   - ⚠️ Synonym deduplication with multiple correct answers
   - ⚠️ Sub-phrase filtering with nested phrases
   - ⚠️ Normalization with edge punctuation (¿, ¡, etc.)

3. **Performance Not Benchmarked**
   - ⚠️ No metrics on word bank generation time
   - ⚠️ No load testing with large vocabulary banks

---

## 🔹 Recommended Next Steps

### Phase 5: Testing & Robustness (High Priority)

#### 5.1 Unit Tests for WordBankService
**Impact:** High | **Effort:** Medium  
**Files:** Create `lib/services/__tests__/word-bank-service.test.ts`

**Test Coverage:**
- Normalization functions (`normalizeVocabEnglish`, `expandContractions`, `normalizeForValidation`)
- Phrase detection (2-word, 3-word, overlapping phrases)
- Sub-phrase filtering (forward and reversed)
- Synonym deduplication (hi/hello/salam)
- Contextual filtering (vocab items covered by phrases)
- Distractor generation (semantic vs random)
- Edge cases (empty inputs, missing vocabulary, typos)

**Example Test Structure:**
```typescript
describe('WordBankService', () => {
  describe('normalizeVocabEnglish', () => {
    it('handles slash-separated translations', () => {
      expect(WordBankService.normalizeVocabEnglish('I / Me')).toBe('I');
    });
  });
  
  describe('extractSemanticUnitsFromExpected', () => {
    it('preserves order of expected translation', () => {
      const result = WordBankService.extractSemanticUnitsFromExpected(
        'Hello How are you',
        vocabularyBank
      );
      expect(result.map(u => u.wordText)).toEqual(['Hello', 'How are you']);
    });
  });
});
```

#### 5.2 Integration Tests for Game Components
**Impact:** High | **Effort:** Medium  
**Files:** Create `app/components/games/__tests__/AudioSequence.test.tsx`, `TextSequence.test.tsx`

**Test Coverage:**
- Word bank generation on mount
- User selection and removal
- Validation with semantic units
- XP awarding on correct answers
- Error handling for missing vocabulary

#### 5.3 Performance Benchmarking
**Impact:** Medium | **Effort:** Low  
**Tools:** Use `console.time()` or `performance.now()`

**Metrics:**
- Word bank generation time for typical vocabulary bank (50-100 items)
- Component render time with word bank
- Memory usage with large vocabulary banks

---

### Phase 6: VocabularyTrackingService Integration (High Priority)

#### 6.1 Supabase Schema Design
**Impact:** Critical | **Effort:** Medium  
**Files:** Create `supabase/migrations/XXXX_vocabulary_tracking.sql`

**Tables Needed:**
- `vocabulary_attempts`: Overall attempt records
- `vocabulary_word_attempts`: Per-word attempt records
- `vocabulary_performance`: Aggregated stats (materialized view or table)

**Schema Considerations:**
- Idempotency: `attempt_uid` unique constraint
- Indexes: `user_id`, `vocabulary_id`, `game_type`, `timestamp`
- RLS policies: Users can only see their own attempts

#### 6.2 Integrate Tracking in Game Components
**Impact:** High | **Effort:** Medium  
**Files:** `AudioSequence.tsx`, `TextSequence.tsx`, `Quiz.tsx`, `InputExercise.tsx`

**Implementation:**
```typescript
// In handleSubmit() after validation
await VocabularyTrackingService.recordAttempt({
  userId: user.id,
  timestamp: new Date().toISOString(),
  gameType: 'audio-sequence',
  moduleId,
  lessonId,
  stepIndex,
  attemptResult: {
    isCorrect: correct,
    words: wordAttempts, // Per-word breakdown
    totalWords: expectedWordCount,
    correctWords: correctCount,
    incorrectWords: incorrectCount
  },
  metadata: {
    stepUid: deriveStepUid(step, stepIndex),
    timeSpentMs: Date.now() - startTime
  }
});
```

#### 6.3 Review Mode Integration
**Impact:** High | **Effort:** High  
**Files:** Create `app/practice/review/page.tsx` (new review mode page)

**Features:**
- Query `getStrugglingWords()` for user
- Display flashcards for struggling words
- Track review attempts separately from lesson attempts
- Update mastery levels based on performance

---

### Phase 7: Service Architecture Refactoring (Medium Priority)

#### 7.1 Split WordBankService into Smaller Services
**Impact:** Medium | **Effort:** High  
**Target Structure:**
```
lib/services/word-bank/
  - normalizer.ts       // Normalization functions
  - matcher.ts          // Vocabulary matching logic
  - phrase-detector.ts  // Phrase detection
  - filter.ts           // Filtering logic
  - generator.ts         // Distractor generation
  - word-bank-service.ts // Orchestrator (thin wrapper)
```

**Benefits:**
- Easier to test individual components
- Clearer separation of concerns
- Reduced merge conflicts

#### 7.2 Configuration Externalization
**Impact:** Low | **Effort:** Medium  
**Files:** Create `lib/config/word-bank-config.ts`

**Move to Config:**
- Contraction mappings (from `expandContractions()`)
- Contextual mappings (from `CONTEXTUAL_MAPPING`)
- Synonym groups (currently hardcoded in deduplication)

---

### Phase 8: Advanced Features (Low Priority)

#### 8.1 Dynamic Phrase Length Detection
**Impact:** Low | **Effort:** High  
**Enhancement:** Support 4+ word phrases automatically

**Implementation:**
- Generalize `detectPhrases()` to handle N-word phrases
- Use dynamic programming or sliding window approach
- Limit to reasonable phrase length (e.g., max 5 words)

#### 8.2 Semantic Group Auto-Assignment
**Impact:** Low | **Effort:** Medium  
**Enhancement:** Automatically assign semantic groups based on vocabulary metadata

**Approach:**
- Add `autoSemanticGroup` field to `VocabularyItem`
- Use vocabulary category or lesson context to infer groups
- Fall back to manual assignment if ambiguous

#### 8.3 Word Bank Caching
**Impact:** Medium | **Effort:** Low  
**Enhancement:** Cache word banks by input hash

**Implementation:**
```typescript
private static wordBankCache = new Map<string, WordBankResult>();

static generateWordBank(options: WordBankOptions): WordBankResult {
  const cacheKey = this.getCacheKey(options);
  if (this.wordBankCache.has(cacheKey)) {
    return this.wordBankCache.get(cacheKey)!;
  }
  
  const result = this.generateWordBankInternal(options);
  this.wordBankCache.set(cacheKey, result);
  return result;
}
```

---

## 🔹 Optional: Example TODO List for Phase 5

### Week 1: Testing Foundation
- [ ] Create test file structure (`lib/services/__tests__/`)
- [ ] Write unit tests for normalization functions (20+ test cases)
- [ ] Write unit tests for phrase detection (10+ test cases)
- [ ] Write unit tests for filtering logic (15+ test cases)
- [ ] Set up Jest/Vitest testing framework (if not already)
- [ ] Add test coverage reporting

### Week 2: Integration & Tracking
- [ ] Design Supabase schema for vocabulary tracking
- [ ] Create migration file for vocabulary tracking tables
- [ ] Implement `VocabularyTrackingService.storeAttempt()` Supabase insert
- [ ] Implement `VocabularyTrackingService.isAttemptDuplicate()` idempotency check
- [ ] Integrate tracking calls in `AudioSequence.handleSubmit()`
- [ ] Integrate tracking calls in `TextSequence.handleSubmit()`
- [ ] Test tracking with real user flows

### Week 3: Performance & Optimization
- [ ] Add word bank generation caching (by input hash)
- [ ] Benchmark word bank generation (target: <50ms for 100-item vocabulary)
- [ ] Optimize `detectPhrases()` if needed (reduce nested loops)
- [ ] Add memoization in components if re-renders are costly
- [ ] Profile component render times with React DevTools

### Week 4: Documentation & Polish
- [ ] Document WordBankService public APIs
- [ ] Add JSDoc comments to all public methods
- [ ] Create architecture diagram (service interactions)
- [ ] Write developer guide for adding new game types
- [ ] Update semantic groups documentation

---

## 🔹 Top 3 Technical Priorities (Impact vs Effort)

### 1. 🥇 Unit Tests for WordBankService
**Impact:** ⭐⭐⭐⭐⭐ | **Effort:** ⭐⭐⭐  
**Quick Win Factor:** High (prevents future regressions)

**Why:**
- Current system has zero test coverage
- Complex logic (normalization, matching, filtering) is error-prone
- Manual testing is time-consuming and error-prone
- Foundation for future refactoring confidence

**Implementation:**
- Start with normalization functions (easiest, most critical)
- Add phrase detection tests (complex logic)
- Add filtering tests (edge cases)

**Time Estimate:** 2-3 days

---

### 2. 🥈 VocabularyTrackingService Supabase Integration
**Impact:** ⭐⭐⭐⭐⭐ | **Effort:** ⭐⭐⭐  
**Quick Win Factor:** High (unlocks analytics and review mode)

**Why:**
- Tracking service is designed but not integrated
- Critical for review mode feature (struggling words)
- Enables data-driven improvements (which words are hardest?)
- Required for user retention features

**Implementation:**
- Schema design: 1 day
- Supabase migration: 1 day
- Service implementation: 2 days
- Component integration: 2 days

**Time Estimate:** 5-6 days

---

### 3. 🥉 Word Bank Generation Caching
**Impact:** ⭐⭐⭐ | **Effort:** ⭐  
**Quick Win Factor:** Very High (easy win, immediate benefit)

**Why:**
- Word banks are regenerated on every step mount
- Same vocabulary + same expectedTranslation → same result
- Simple cache key: hash of inputs
- Significant performance improvement for long lessons

**Implementation:**
```typescript
// Add to WordBankService
private static cache = new Map<string, WordBankResult>();

private static getCacheKey(options: WordBankOptions): string {
  const parts = [
    options.expectedTranslation || '',
    options.sequenceIds?.join(',') || '',
    options.maxSize || 'default',
    options.distractorStrategy || 'semantic',
    // Hash vocabulary IDs (stable order)
    options.vocabularyBank.map(v => v.id).sort().join(',')
  ];
  return parts.join('|');
}
```

**Time Estimate:** 2-3 hours

---

## Appendix: Key File References

**Core Services:**
- `lib/services/word-bank-service.ts` (1,188 lines)
- `lib/services/vocabulary-tracking-service.ts` (307 lines)
- `lib/config/semantic-groups.ts` (84 lines)

**Game Components:**
- `app/components/games/AudioSequence.tsx` (406 lines)
- `app/components/games/TextSequence.tsx` (274 lines)

**Type Definitions:**
- `lib/types.ts` (VocabularyItem, LessonStep, etc.)

**Configuration:**
- `lib/config/curriculum.ts` (4,435 lines - all lesson steps)

---

**Report Generated:** 2024  
**Next Review:** After Phase 5 completion

