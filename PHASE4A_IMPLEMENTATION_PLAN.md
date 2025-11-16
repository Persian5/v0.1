# PHASE 4A: Implementation Plan
## Quiz.tsx + FinalChallenge.tsx Unified Distractor Engine

---

## COMPONENT 1: Quiz.tsx

### A) Required New Props

**File**: `app/components/games/Quiz.tsx`

**Add to `QuizProps` interface** (after line 26):
```typescript
learnedSoFar?: LearnedSoFar; // PHASE 4A: Learned vocabulary state for filtering
vocabularyBank?: VocabularyItem[]; // PHASE 4A: All vocabulary for WordBankService lookup
```

**Import additions** (top of file):
```typescript
import { FLAGS } from "@/lib/flags";
import { WordBankService } from "@/lib/services/word-bank-service";
import { type LearnedSoFar } from "@/lib/utils/curriculum-lexicon";
import { type VocabularyItem } from "@/lib/types";
```

**Note**: Both props are **optional** to maintain backward compatibility.

---

### B) Required Changes to LessonRunner.tsx

**File**: `app/components/LessonRunner.tsx`

**Location**: Lines 912-922 (quiz step rendering)

**Current code**:
```typescript
<Quiz
  key={generateQuizKey(step as QuizStep, quizAttemptCounter)}
  prompt={(step as QuizStep).data.prompt}
  options={(step as QuizStep).data.options}
  correct={(step as QuizStep).data.correct}
  points={step.points}
  onComplete={(wasCorrect) => handleItemComplete(wasCorrect)}
  onXpStart={createStepXpHandler()}
  vocabularyId={extractVocabularyFromFailedQuiz(step)}
  onVocabTrack={createVocabularyTracker()}
/>
```

**Change to**:
```typescript
<Quiz
  key={generateQuizKey(step as QuizStep, quizAttemptCounter)}
  prompt={(step as QuizStep).data.prompt}
  options={(step as QuizStep).data.options}
  correct={(step as QuizStep).data.correct}
  points={step.points}
  learnedSoFar={learnedCache[idx]} // PHASE 4A: Pass learned vocabulary state
  vocabularyBank={allCurriculumVocab} // PHASE 4A: Pass vocabulary bank for lookup
  onComplete={(wasCorrect) => handleItemComplete(wasCorrect)}
  onXpStart={createStepXpHandler()}
  vocabularyId={extractVocabularyFromFailedQuiz(step)}
  onVocabTrack={createVocabularyTracker()}
/>
```

**Also update ReverseQuiz** (lines 924-934) with same props:
```typescript
<Quiz
  // ... existing props ...
  learnedSoFar={learnedCache[idx]} // PHASE 4A: Pass learned vocabulary state
  vocabularyBank={allCurriculumVocab} // PHASE 4A: Pass vocabulary bank for lookup
  // ... rest of props ...
/>
```

---

### C) Exact Unified WordBankService Call

**File**: `app/components/games/Quiz.tsx`

**Location**: Inside `useEffect` or `useMemo` that runs when `options`, `correct`, `learnedSoFar`, or `vocabularyBank` change

**Implementation**:
```typescript
// PHASE 4A: Generate unified options when flag is ON
if (FLAGS.USE_LEARNED_VOCAB_IN_QUIZ && learnedSoFar && vocabularyBank && vocabularyBank.length > 0) {
  const wordBankResult = WordBankService.generateWordBank({
    expectedTranslation: undefined, // Quiz doesn't have translation context
    vocabularyBank,
    sequenceIds: correctVocabId ? [correctVocabId] : undefined,
    maxSize: options.length, // Match current option count (usually 4)
    distractorStrategy: 'semantic',
    learnedVocabIds: FLAGS.USE_LEARNED_VOCAB_IN_WORDBANK && learnedSoFar
      ? learnedSoFar.vocabIds
      : undefined,
  });
  
  // Extract unified options: correctWords[0] + distractors
  const unifiedOptions = [
    wordBankResult.correctWords[0],
    ...wordBankResult.distractors
  ].slice(0, options.length);
  
  // Update shuffledOptions state with unified options
  // (see section E for full transformation logic)
}
```

---

### D) How to Extract correctAnswer vocabularyId

**File**: `app/components/games/Quiz.tsx`

**Step 1: Extract correct answer text**
```typescript
const correctAnswerText = Array.isArray(options) && typeof options[0] === 'string'
  ? options[correct] // correct is index into string array
  : (options as QuizOption[]).find(opt => opt.correct)?.text;
```

**Step 2: Look up vocabulary ID from vocabularyBank**
```typescript
// Normalize correct answer text for comparison
const normalizedCorrectText = WordBankService.normalizeVocabEnglish(correctAnswerText || '').toLowerCase();

// Find vocabulary item by English translation
const correctVocab = vocabularyBank.find(v => {
  const normalizedVocabEn = WordBankService.normalizeVocabEnglish(v.en).toLowerCase();
  return normalizedVocabEn === normalizedCorrectText;
});

const correctVocabId = correctVocab?.id;
```

**Fallback strategy**:
- If `vocabularyId` prop is provided → use it directly
- If lookup fails → fall back to old behavior (flag OFF path)
- Log warning if lookup fails but flag is ON

**Code location**: Before WordBankService call, inside flag check

---

### E) Transform Curriculum Options → Unified Options Array

**File**: `app/components/games/Quiz.tsx`

**Current state**: `shuffledOptions` is `QuizOption[]` with `{ text: string, correct: boolean }`

**New unified state**: Same format, but text comes from WordBankService

**Transformation logic**:
```typescript
// After WordBankService call (section C)
const unifiedOptions: QuizOption[] = unifiedOptionsText.map((text, index) => ({
  text: text, // English text from WordBankService
  correct: index === 0 // First option is always correct (from correctWords[0])
}));

// Shuffle for display (preserve correct flag)
const shuffledUnified = shuffle(unifiedOptions);

// Update state
setShuffledOptions(shuffledUnified);
```

**Integration point**: Replace existing `shuffledOptions` useMemo (lines 71-79) with conditional logic:
- **Flag ON**: Use unified options from WordBankService
- **Flag OFF**: Use existing logic (convert string[] to QuizOption[], shuffle)

---

### F) Backward Compatibility (Flag OFF)

**File**: `app/components/games/Quiz.tsx`

**Strategy**: Wrap all new logic in flag check

**Implementation**:
```typescript
const shuffledOptions = useMemo(() => {
  // PHASE 4A: Unified distractor path (flag ON)
  if (FLAGS.USE_LEARNED_VOCAB_IN_QUIZ && learnedSoFar && vocabularyBank && vocabularyBank.length > 0) {
    // ... unified WordBankService logic (sections C, D, E) ...
    return shuffledUnified;
  }
  
  // OLD BEHAVIOR: Flag OFF or missing dependencies
  // Convert string[] to QuizOption[] if needed
  const formattedOptions: QuizOption[] = Array.isArray(options) && typeof options[0] === 'string'
    ? (options as string[]).map((opt, i) => ({ text: opt, correct: i === correct }))
    : options as QuizOption[];

  // Fisher-Yates shuffle for proper randomization
  return shuffle(formattedOptions);
}, [optionsHash, learnedSoFar, vocabularyBank, FLAGS.USE_LEARNED_VOCAB_IN_QUIZ]); // Add new deps
```

**Key points**:
- ✅ Old behavior preserved when flag is OFF
- ✅ Old behavior preserved when `learnedSoFar` or `vocabularyBank` missing
- ✅ Old behavior preserved when vocabulary lookup fails
- ✅ No breaking changes to existing props

---

### G) Risks, Edge Cases, Mitigation

#### Risk 1: Vocabulary ID Lookup Fails
**Scenario**: Correct answer text doesn't match any vocabulary item
**Impact**: Quiz breaks, no options generated
**Mitigation**:
- Fall back to old behavior immediately
- Log warning: `console.warn('[QUIZ] Vocabulary lookup failed, using curriculum options')`
- Ensure `correctVocabId` is checked before WordBankService call

#### Risk 2: WordBankService Returns Empty Options
**Scenario**: Filtered vocab bank too small, fallback fails
**Impact**: Quiz has no options
**Mitigation**:
- Check `wordBankResult.correctWords.length > 0` before using
- Fall back to old behavior if empty
- WordBankService already has fallback logic, but add defensive check

#### Risk 3: Options Count Mismatch
**Scenario**: WordBankService returns different number of options than curriculum
**Impact**: UI breaks, correct index wrong
**Mitigation**:
- Use `.slice(0, options.length)` to match curriculum count
- Ensure exactly `options.length` options (usually 4)
- Preserve correct answer as first option before shuffle

#### Risk 4: Correct Answer Not in Unified Options
**Scenario**: Shuffle removes correct answer
**Impact**: Quiz impossible to pass
**Mitigation**:
- Always include correct answer: `[correctWords[0], ...distractors]`
- After shuffle, verify correct answer present
- If missing, force correct answer into first position

#### Risk 5: ReverseQuiz Uses Same Component
**Scenario**: ReverseQuiz also uses Quiz component
**Impact**: Both quiz types affected
**Mitigation**:
- Same logic applies to both
- ReverseQuiz options are Persian text, not English
- **NEED TO HANDLE**: ReverseQuiz may need different lookup (by Finglish, not English)
- **DECISION NEEDED**: Should ReverseQuiz use unified engine? (Assume YES for now)

#### Risk 6: Remediation Quiz Uses Same Component
**Scenario**: Remediation generates dynamic Quiz (line 835)
**Impact**: Remediation quiz also affected
**Mitigation**:
- Remediation quiz already has `vocabularyId` prop
- Use `vocabularyId` directly if available (skip lookup)
- Fall back to old behavior if `vocabularyId` missing

---

### H) Migration Checklist (Flag → Permanent)

**Phase 1: Testing with Flag**
- [ ] Add `USE_LEARNED_VOCAB_IN_QUIZ: false` to `lib/flags.ts`
- [ ] Test all quiz steps with flag OFF (verify old behavior)
- [ ] Test all quiz steps with flag ON (verify new behavior)
- [ ] Test remediation quiz with flag ON/OFF
- [ ] Test reverse-quiz with flag ON/OFF

**Phase 2: Validation**
- [ ] Verify vocabulary lookup works for all quiz steps
- [ ] Verify WordBankService returns correct options
- [ ] Verify correct answer always present
- [ ] Verify option count matches curriculum
- [ ] Verify semantic distractors are appropriate

**Phase 3: Cleanup**
- [ ] Remove flag check (make unified path default)
- [ ] Remove old path code (keep only unified logic)
- [ ] Remove `options` and `correct` props (if curriculum still provides, keep for now)
- [ ] Update TypeScript types if needed
- [ ] Remove flag from `lib/flags.ts`

**Phase 4: Documentation**
- [ ] Update component JSDoc comments
- [ ] Document vocabulary lookup strategy
- [ ] Document fallback behavior

---

### I) Testing Plan

#### Unit Tests (New File: `tests/quiz-unified-distractors.test.ts`)

**Test 1: Vocabulary ID Lookup**
```typescript
describe('Quiz vocabulary ID lookup', () => {
  it('should find vocab ID from correct answer text', () => {
    // Mock vocabularyBank with "Hello" → "salam"
    // Call lookup function
    // Assert returns "salam"
  });
  
  it('should handle normalized text matching', () => {
    // Test "Hello" matches "hello", "Hello ", etc.
  });
  
  it('should fallback when lookup fails', () => {
    // Test returns undefined when no match
  });
});
```

**Test 2: Unified Options Generation**
```typescript
describe('Quiz unified options generation', () => {
  it('should generate exactly 4 options', () => {
    // Mock WordBankService result
    // Assert options.length === 4
  });
  
  it('should include correct answer', () => {
    // Assert correctWords[0] in options
  });
  
  it('should use semantic distractors', () => {
    // Assert distractors from same semantic group
  });
});
```

**Test 3: Flag OFF Behavior**
```typescript
describe('Quiz flag OFF behavior', () => {
  it('should use curriculum options when flag OFF', () => {
    // Set flag OFF
    // Assert uses props.options directly
  });
});
```

#### Integration Tests

**Test 1: End-to-End Quiz Flow**
- Navigate to Module 1, Lesson 1, Quiz step
- Verify options appear
- Verify correct answer works
- Verify incorrect answers show feedback

**Test 2: Learned Vocab Filtering**
- Complete Lesson 1 (learn vocab)
- Navigate to Lesson 2, Quiz step
- Verify options only include learned vocab (when flag ON)
- Verify fallback to full vocab if filtered too small

**Test 3: Remediation Quiz**
- Trigger remediation
- Verify remediation quiz uses unified engine (when flag ON)
- Verify vocabularyId prop works correctly

**Test 4: ReverseQuiz**
- Navigate to reverse-quiz step
- Verify Persian options work correctly
- Verify vocabulary lookup by Finglish (not English)

---

## COMPONENT 2: FinalChallenge.tsx

### A) Required New Props

**File**: `app/components/games/FinalChallenge.tsx`

**Add to `FinalChallengeProps` interface** (after line 36):
```typescript
learnedSoFar?: LearnedSoFar; // PHASE 4A: Learned vocabulary state for filtering
vocabularyBank?: VocabularyItem[]; // PHASE 4A: All vocabulary for WordBankService lookup
```

**Import additions** (top of file):
```typescript
import { FLAGS } from "@/lib/flags";
import { WordBankService } from "@/lib/services/word-bank-service";
import { type LearnedSoFar } from "@/lib/utils/curriculum-lexicon";
import { type VocabularyItem } from "@/lib/types";
```

**Note**: Both props are **optional** to maintain backward compatibility.

---

### B) Required Changes to LessonRunner.tsx

**File**: `app/components/LessonRunner.tsx`

**Location**: Lines 958-968 (final step rendering)

**Current code** (need to read exact):
```typescript
<FinalChallenge
  key={`final-${idx}`}
  words={(step as FinalStep).data.words}
  targetWords={(step as FinalStep).data.targetWords}
  // ... other props ...
/>
```

**Change to**:
```typescript
<FinalChallenge
  key={`final-${idx}`}
  words={(step as FinalStep).data.words}
  targetWords={(step as FinalStep).data.targetWords}
  conversationFlow={(step as FinalStep).data.conversationFlow}
  learnedSoFar={learnedCache[idx]} // PHASE 4A: Pass learned vocabulary state
  vocabularyBank={allCurriculumVocab} // PHASE 4A: Pass vocabulary bank for filtering
  // ... rest of props ...
/>
```

---

### C) Exact Unified WordBankService Call

**File**: `app/components/games/FinalChallenge.tsx`

**Location**: Inside `enhancedWords` useMemo (lines 52-79) or new useMemo

**Implementation**:
```typescript
// PHASE 4A: Filter words by learnedState when flag is ON
if (FLAGS.USE_LEARNED_VOCAB_IN_FINAL_CHALLENGE && learnedSoFar && vocabularyBank && vocabularyBank.length > 0) {
  // Build expected translation from targetWords
  const expectedTranslation = conversationFlow?.expectedPhrase 
    || targetWords
        .map(id => words.find(w => w.id === id)?.translation)
        .filter(Boolean)
        .join(' ');
  
  const wordBankResult = WordBankService.generateWordBank({
    expectedTranslation,
    vocabularyBank,
    sequenceIds: conversationFlow?.persianSequence || targetWords,
    maxSize: words.length, // Match word bank size
    distractorStrategy: 'semantic',
    learnedVocabIds: FLAGS.USE_LEARNED_VOCAB_IN_WORDBANK && learnedSoFar
      ? learnedSoFar.vocabIds
      : undefined,
  });
  
  // Extract correct word IDs and distractor word IDs
  const correctWordIds = new Set(
    wordBankResult.wordBankItems
      .filter(item => item.isCorrect && item.vocabularyId)
      .map(item => item.vocabularyId!)
  );
  
  // Filter words: keep correct words + learned distractors
  const filteredWords = words.filter(word => 
    correctWordIds.has(word.id) || // Always include correct words
    (learnedSoFar.vocabIds?.includes(word.id) && !correctWordIds.has(word.id)) // Include learned distractors
  );
  
  return filteredWords;
}
```

**Note**: This approach **filters** existing words rather than generating new ones, preserving word bank structure.

---

### D) How to Extract correctAnswer vocabularyId

**File**: `app/components/games/FinalChallenge.tsx`

**Not needed**: FinalChallenge doesn't need vocabulary ID lookup because:
- `targetWords` already contains vocabulary IDs
- `conversationFlow.persianSequence` already contains vocabulary IDs
- Words array already has `id` field matching vocabulary IDs

**Action**: Use `targetWords` or `conversationFlow.persianSequence` directly as `sequenceIds` in WordBankService call.

---

### E) Transform Curriculum Words → Filtered Words Array

**File**: `app/components/games/FinalChallenge.tsx`

**Current state**: `enhancedWords` useMemo (lines 52-79) filters by `conversationFlow` but doesn't filter by learnedState

**New unified state**: Same `WordItem[]` format, but filtered by learnedState

**Transformation logic**:
```typescript
const enhancedWords = useMemo(() => {
  // PHASE 4A: Filter by learnedState when flag is ON
  if (FLAGS.USE_LEARNED_VOCAB_IN_FINAL_CHALLENGE && learnedSoFar && vocabularyBank && vocabularyBank.length > 0) {
    // ... WordBankService call (section C) ...
    return filteredWords; // Filtered by learnedState
  }
  
  // OLD BEHAVIOR: Flag OFF or missing dependencies
  if (!conversationFlow) {
    return words; // Use original words if no conversation flow
  }
  
  // Existing conversationFlow filtering logic (preserve)
  const conversationWords: WordItem[] = [];
  const usedWordIds = new Set<string>();
  
  // Add words needed for the conversation sequence
  conversationFlow.persianSequence.forEach(seqId => {
    const originalWord = words.find(w => w.id === seqId);
    if (originalWord && !usedWordIds.has(seqId)) {
      conversationWords.push(originalWord);
      usedWordIds.add(seqId);
    }
  });
  
  // Add remaining words as distractors (avoiding duplicates)
  words.forEach(word => {
    if (!usedWordIds.has(word.id)) {
      conversationWords.push(word);
      usedWordIds.add(word.id);
    }
  });
  
  return conversationWords;
}, [words, conversationFlow, targetWords, learnedSoFar, vocabularyBank, FLAGS.USE_LEARNED_VOCAB_IN_FINAL_CHALLENGE]);
```

**Key points**:
- ✅ Preserves existing `conversationFlow` logic when flag OFF
- ✅ Filters words by learnedState when flag ON
- ✅ Always includes correct words (from `targetWords` or `persianSequence`)
- ✅ Only includes learned distractors

---

### F) Backward Compatibility (Flag OFF)

**File**: `app/components/games/FinalChallenge.tsx`

**Strategy**: Wrap new logic in flag check, preserve existing `enhancedWords` logic

**Implementation**: See section E above

**Key points**:
- ✅ Old behavior preserved when flag is OFF
- ✅ Old behavior preserved when `learnedSoFar` or `vocabularyBank` missing
- ✅ Existing `conversationFlow` logic still works
- ✅ No breaking changes to existing props

---

### G) Risks, Edge Cases, Mitigation

#### Risk 1: Filtered Words Too Small
**Scenario**: After filtering, word bank has fewer words than slots
**Impact**: Final challenge impossible to complete
**Mitigation**:
- Always include all correct words (from `targetWords` or `persianSequence`)
- Check `filteredWords.length >= targetWords.length` before using
- Fall back to old behavior if filtered too small
- WordBankService fallback should handle this, but add defensive check

#### Risk 2: Correct Words Missing from Filtered Bank
**Scenario**: Correct words not in learnedState (shouldn't happen, but defensive)
**Impact**: Final challenge impossible to complete
**Mitigation**:
- **Force include**: Always add correct words even if not in learnedState
- Check `targetWords.every(id => filteredWords.some(w => w.id === id))`
- If missing, add them explicitly

#### Risk 3: ConversationFlow vs TargetWords Mismatch
**Scenario**: `conversationFlow.persianSequence` doesn't match `targetWords`
**Impact**: Wrong words marked as correct
**Mitigation**:
- Prefer `conversationFlow.persianSequence` if present (more specific)
- Fall back to `targetWords` if `conversationFlow` missing
- Log warning if both present but don't match

#### Risk 4: Word Bank Size Mismatch
**Scenario**: Filtered word bank has different size than original
**Impact**: UI layout breaks, validation fails
**Mitigation**:
- Preserve original word bank size (filter, don't generate)
- Ensure `filteredWords.length <= words.length`
- If filtered too small, fall back to old behavior

#### Risk 5: Shuffle Breaks Correct Sequence
**Scenario**: Shuffling removes correct words from bank
**Impact**: User can't complete challenge
**Mitigation**:
- Shuffle only affects **display order**, not word availability
- All correct words remain in bank (just shuffled)
- Validation uses `targetWords`/`persianSequence`, not display order

---

### H) Migration Checklist (Flag → Permanent)

**Phase 1: Testing with Flag**
- [ ] Add `USE_LEARNED_VOCAB_IN_FINAL_CHALLENGE: false` to `lib/flags.ts`
- [ ] Test all final challenges with flag OFF (verify old behavior)
- [ ] Test all final challenges with flag ON (verify new behavior)
- [ ] Test with `conversationFlow` present
- [ ] Test with `conversationFlow` missing (uses `targetWords`)

**Phase 2: Validation**
- [ ] Verify correct words always present in filtered bank
- [ ] Verify word bank size is reasonable (not too small)
- [ ] Verify learned vocab filtering works correctly
- [ ] Verify fallback to full vocab when filtered too small

**Phase 3: Cleanup**
- [ ] Remove flag check (make unified path default)
- [ ] Remove old path code (keep only unified logic)
- [ ] Update TypeScript types if needed
- [ ] Remove flag from `lib/flags.ts`

**Phase 4: Documentation**
- [ ] Update component JSDoc comments
- [ ] Document filtering strategy
- [ ] Document fallback behavior

---

### I) Testing Plan

#### Unit Tests (New File: `tests/final-challenge-unified-distractors.test.ts`)

**Test 1: Word Filtering**
```typescript
describe('FinalChallenge word filtering', () => {
  it('should filter words by learnedState', () => {
    // Mock learnedState with vocab IDs
    // Mock words array
    // Call filtering logic
    // Assert only learned words included
  });
  
  it('should always include correct words', () => {
    // Test correct words included even if not in learnedState
  });
  
  it('should preserve word bank size', () => {
    // Assert filteredWords.length <= words.length
  });
});
```

**Test 2: WordBankService Integration**
```typescript
describe('FinalChallenge WordBankService integration', () => {
  it('should call WordBankService with correct params', () => {
    // Mock WordBankService
    // Call filtering logic
    // Assert WordBankService called with expectedTranslation, sequenceIds
  });
  
  it('should use conversationFlow.persianSequence if present', () => {
    // Test prefers conversationFlow over targetWords
  });
});
```

**Test 3: Flag OFF Behavior**
```typescript
describe('FinalChallenge flag OFF behavior', () => {
  it('should use original words when flag OFF', () => {
    // Set flag OFF
    // Assert uses props.words directly (with conversationFlow filtering)
  });
});
```

#### Integration Tests

**Test 1: End-to-End Final Challenge Flow**
- Navigate to Module 1, Lesson 1, Final Challenge
- Verify word bank appears
- Verify correct sequence validation works
- Verify incorrect sequence shows feedback

**Test 2: Learned Vocab Filtering**
- Complete Lesson 1 (learn vocab)
- Navigate to Lesson 1, Final Challenge
- Verify word bank only includes learned vocab (when flag ON)
- Verify correct words always present

**Test 3: ConversationFlow vs TargetWords**
- Test final challenge with `conversationFlow` present
- Test final challenge with `conversationFlow` missing
- Verify both paths work correctly

---

## GLOBAL CONSIDERATIONS

### Feature Flags Required

**File**: `lib/flags.ts`

**Add**:
```typescript
USE_LEARNED_VOCAB_IN_QUIZ: false, // PHASE 4A: Use WordBankService for quiz distractors
USE_LEARNED_VOCAB_IN_FINAL_CHALLENGE: false, // PHASE 4A: Filter final challenge words by learnedState
```

### Shared Dependencies

Both components need:
- `FLAGS` import
- `WordBankService` import
- `LearnedSoFar` type import
- `VocabularyItem` type import

### LessonRunner Changes Summary

**File**: `app/components/LessonRunner.tsx`

**Changes**:
1. **Quiz step** (line ~912): Add `learnedSoFar={learnedCache[idx]}` and `vocabularyBank={allCurriculumVocab}`
2. **ReverseQuiz step** (line ~924): Add same props
3. **FinalChallenge step** (line ~958): Add `learnedSoFar={learnedCache[idx]}` and `vocabularyBank={allCurriculumVocab}`

**No other changes needed** - `learnedCache` and `allCurriculumVocab` already exist.

---

## IMPLEMENTATION ORDER

1. **Add feature flags** to `lib/flags.ts`
2. **Update Quiz.tsx** props and imports
3. **Update FinalChallenge.tsx** props and imports
4. **Update LessonRunner.tsx** to pass new props
5. **Implement Quiz.tsx unified logic** (sections C, D, E)
6. **Implement FinalChallenge.tsx unified logic** (sections C, E)
7. **Add debug logging** (behind `LOG_WORDBANK` flag)
8. **Test with flags OFF** (verify old behavior)
9. **Test with flags ON** (verify new behavior)
10. **Create unit tests**
11. **Create integration tests**

---

## APPROVAL CHECKLIST

Before implementation, confirm:
- [ ] Vocabulary ID lookup strategy for Quiz is acceptable
- [ ] Filtering approach for FinalChallenge is acceptable (filter vs generate)
- [ ] Feature flag names are acceptable
- [ ] Backward compatibility strategy is acceptable
- [ ] Risk mitigation strategies are acceptable
- [ ] Testing plan is sufficient

---

**END OF PLAN**

