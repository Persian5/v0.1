# Grammar Forms Tracking Fixes - 10 Phase Plan

## Issues Identified

1. **Text Sequence**: Tracking base words (`esm`, `man`) instead of grammar form (`esm|e`)
2. **Audio Sequence**: Tracking base words (`salam`, `shoma`) instead of grammar form (`esm|e`)
3. **Reverse Quiz**: Missing `vocabularyId` warning for grammar forms (`esm|e`)
4. **Audio Meaning**: Shows "name" instead of "Name of" for `esm|e` (ezafe)

---

## PHASE 1: Fix GrammarService Ezafe Meaning
**File**: `lib/services/grammar-service.ts`  
**Issue**: Ezafe (`-e`) has empty `meaningPrefix`, so `esm|e` shows "name" instead of "Name of"  
**Fix**: Add special handling for ezafe suffix to append " of" to the English meaning  
**Lines**: ~145  
**Time**: 15 minutes

**Changes**:
- Check if `suffixId === 'e'` (ezafe)
- If ezafe, set `compositeEn = baseVocab.en + " of"` (capitalize first letter)
- Otherwise, use existing logic with `meaningPrefix`

---

## PHASE 2: Fix TextSequence Tracking - Use Resolved Lexemes
**File**: `app/components/games/TextSequence.tsx`  
**Issue**: `WordBankService.validateUserAnswer` returns base IDs from `wordBankItems.vocabularyId`  
**Fix**: When `lexemeSequence` is provided, prioritize tracking resolved grammar forms over WordBankService results  
**Lines**: ~411-437  
**Time**: 30 minutes

**Changes**:
- Check if `lexemeSequence` exists and has grammar forms
- If yes, track using `resolvedLexemes` directly (use `resolved.id` and `resolved.en`)
- Only use `WordBankService.validateUserAnswer` results for base vocabulary (not in `lexemeSequence`)
- Merge results: grammar forms from `resolvedLexemes`, base vocab from `validateUserAnswer`

---

## PHASE 3: Verify AudioSequence Tracking
**File**: `app/components/games/AudioSequence.tsx`  
**Issue**: Need to verify it's correctly using `resolved.id` for grammar forms  
**Fix**: Ensure all tracking paths use `resolved.id` (composite ID like `"esm|e"`)  
**Lines**: ~430-440  
**Time**: 20 minutes

**Changes**:
- Verify line 435 uses `resolved.id` (not `resolved.baseId`)
- Check if there are other tracking paths that might use base IDs
- Ensure `onVocabTrack` always receives composite ID for grammar forms

---

## PHASE 4: Fix WordBankService - Preserve Grammar Form IDs
**File**: `lib/services/word-bank-service.ts`  
**Issue**: `validateUserAnswer` returns `vocabularyId` from `wordBankItems`, which might be base IDs  
**Fix**: Ensure `wordBankItems` preserve grammar form IDs when matching against `expandedVocabularyBank`  
**Lines**: ~1488-1494  
**Time**: 45 minutes

**Changes**:
- In `validateUserAnswer`, check if `sequenceIds` contains grammar forms (IDs with `|`)
- When matching `wordBankItems` to expected units, prioritize grammar form IDs from `sequenceIds`
- Ensure `wordBankItems.vocabularyId` uses composite ID (`esm|e`) not base ID (`esm`)

---

## PHASE 5: Fix Quiz Reverse Mode - Resolve LexemeRef
**File**: `app/components/games/Quiz.tsx`  
**Issue**: `vocab-reverse` mode checks for `vocabularyId` but doesn't resolve `lexemeRef`  
**Fix**: Resolve `lexemeRef` to get composite ID (`esm|e`) for vocab-reverse mode  
**Lines**: ~160-170  
**Time**: 30 minutes

**Changes**:
- When `quizType === 'vocab-reverse'` and `lexemeRef` exists but `vocabularyId` is missing:
  - Use `resolvedLexeme.id` as `correctVocabId`
  - Use `resolvedLexeme` to find correct vocab in `vocabularyBank`
- Update warning message to check for `lexemeRef` before warning

---

## PHASE 6: Fix Quiz Prompt Generation for Grammar Forms
**File**: `app/components/games/Quiz.tsx`  
**Issue**: Prompt generation might not handle grammar forms correctly  
**Fix**: Ensure prompt uses `resolvedLexeme` when `lexemeRef` is provided  
**Lines**: ~86-110  
**Time**: 20 minutes

**Changes**:
- In prompt generation `useMemo`, check for `resolvedLexeme` first
- If `resolvedLexeme` exists, use `resolvedLexeme.finglish` or `resolvedLexeme.en` based on `quizType`
- Fallback to `vocabularyId` lookup if no `resolvedLexeme`

---

## PHASE 7: Test TextSequence with Grammar Forms
**Test**: Module 2 Lesson 1, Step 8 ("Esme Man")  
**Verify**: 
- Tracks `esm|e` (not `esm` and `man` separately)
- Tracks `man` as base vocab
- Both tracked correctly in `vocabulary_performance` table  
**Time**: 15 minutes

---

## PHASE 8: Test AudioSequence with Grammar Forms
**Test**: Module 2 Lesson 1, Step 2 ("Salam, esme shoma chiye")  
**Verify**:
- Tracks `esm|e` (not `esm` separately)
- Tracks `salam`, `shoma`, `chiye` as base vocab
- All tracked correctly  
**Time**: 15 minutes

---

## PHASE 9: Test Reverse Quiz with Grammar Forms
**Test**: Module 2 Lesson 1, Step 14 (vocab-reverse quiz for `esm|e`)  
**Verify**:
- No warning about missing `vocabularyId`
- Quiz displays correctly with Persian/Finglish options
- Tracks `esm|e` when answered correctly  
**Time**: 15 minutes

---

## PHASE 10: Test Audio Meaning with Grammar Forms
**Test**: Module 2 Lesson 1, Step 7 (`audioMeaning("esm|e")`)  
**Verify**:
- Displays "Name of" (not "name")
- Tracks `esm|e` correctly
- Audio plays correctly  
**Time**: 15 minutes

---

## Total Estimated Time: ~4 hours

## Dependencies
- Phase 1 must be done first (affects all other phases)
- Phases 2-6 can be done in parallel (different files)
- Phases 7-10 are testing phases (must be done after fixes)

## Success Criteria
✅ All grammar forms tracked with composite IDs (`esm|e`, not `esm`)  
✅ No warnings about missing `vocabularyId` for grammar forms  
✅ Ezafe shows correct meaning ("Name of" not "name")  
✅ All tests pass (Phases 7-10)

