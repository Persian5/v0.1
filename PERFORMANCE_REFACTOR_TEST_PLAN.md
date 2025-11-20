# Performance Refactor Test Plan (PHASE PERFORMANCE-ONLY)

## What Changed

**File:** `app/components/LessonRunner.tsx`

**Changes:**
- Replaced `getVocabTaughtUpToStep()` step-rescanning logic with `learnedCache` lookup
- Changed from O(n) step scanning → O(1) cache lookup + O(n) ID mapping
- Uses `curriculumLexicon.allVocabMap` to convert IDs back to `VocabularyItem[]`

**Expected Behavior:**
- **IDENTICAL** vocabulary should be returned at every step
- No changes to word bank generation, distractors, or game rendering
- No changes to review vocab, remediation, or quiz logic

---

## Manual Test Protocol

### Test 1: Module 1, Lesson 1 (Simple Early Lesson)

**Why:** Simple flashcard + audio-meaning flow. Good baseline.

**Steps:**
1. Navigate to Module 1, Lesson 1
2. Start the lesson from step 0
3. At each step, verify:
   - Flashcards show correct word (not future vocab)
   - Audio-meaning options show only learned words as distractors
   - No console errors
   - No unexpected vocab appears

**Expected Result:**
- Step 0: No vocab learned yet (empty or base vocab)
- Step 1+: Each flashcard/audio-meaning only references vocab introduced up to that step
- Word banks (if any) should NOT include future vocab

---

### Test 2: Module 1, Lesson 3 (Grammar-Heavy)

**Why:** Contains grammar fill-in-the-blank steps. Tests `learnedSoFar` integration.

**Steps:**
1. Navigate to Module 1, Lesson 3
2. Progress through the lesson
3. At each grammar step, verify:
   - Grammar options show only learned suffixes/connectors
   - Word banks for grammar examples show only learned vocab
   - Distractors are semantically appropriate
   - No future vocab appears in examples

**Expected Result:**
- Grammar steps show progressively more options as suffixes are introduced
- Vocab used in grammar examples is restricted to learned-so-far
- No console errors or rendering issues

---

### Test 3: Module 2, Lesson with AudioSequence/TextSequence

**Why:** Word bank generation is critical. Tests `allVocab` filtering.

**Steps:**
1. Navigate to Module 2, find a lesson with AudioSequence or TextSequence
2. Play through the lesson
3. At each sequence step, verify:
   - Word bank shows correct words (sequence vocab + learned vocab)
   - Word bank does NOT show future vocab from later in the lesson
   - Distractors are semantically appropriate
   - No duplicate words or missing words

**Expected Result:**
- Word banks contain:
  - All words needed for the correct answer
  - Semantic distractors from learned vocab
  - NO words from future steps
- Sequence completion works identically to before

---

## Performance Verification

**Before:**
- `getVocabTaughtUpToStep()` scanned steps 0→idx on every call
- Called on every render when `idx` changes

**After:**
- `getVocabTaughtUpToStep()` does O(1) lookup into `learnedCache[idx]`
- Maps IDs using pre-built `curriculumLexicon.allVocabMap`

**How to Verify:**
1. Open browser DevTools → Performance tab
2. Record a lesson playthrough
3. Look for reduced CPU time in React render cycles
4. Compare before/after profiles (if available)

**Expected:** Slightly faster renders when stepping through lessons, especially in grammar-heavy lessons.

---

## Regression Checklist

### Core Functionality
- [ ] Flashcard steps show correct vocab
- [ ] Audio-meaning distractors are appropriate
- [ ] Audio-sequence word banks are correct
- [ ] Text-sequence word banks are correct
- [ ] Matching game shows correct pairs
- [ ] Quiz steps render correctly

### Remediation System
- [ ] Failed quiz questions trigger remediation
- [ ] Remediation quiz distractors are appropriate
- [ ] Remediation flashcards show correct vocab

### Grammar System
- [ ] Grammar fill-in-the-blank shows learned suffixes only
- [ ] Grammar examples use learned vocab only
- [ ] Grammar progression feels natural

### Edge Cases
- [ ] First step of lesson (no vocab learned yet)
- [ ] Last step of lesson (all vocab learned)
- [ ] Lessons with review vocab
- [ ] Lessons with story/conversation steps

---

## Rollback Criteria

**If ANY of the following occur, rollback immediately:**
1. Word banks show future vocab before it's introduced
2. Console errors related to vocab lookup
3. Missing words in sequence games
4. Grammar options show unlearned suffixes
5. Remediation system breaks

**Rollback Command:**
```bash
git checkout HEAD~1 app/components/LessonRunner.tsx
```

---

## Success Criteria

✅ **Pass:** All manual tests show identical behavior
✅ **Pass:** No console errors
✅ **Pass:** Performance profile shows reduced CPU time (optional)
✅ **Pass:** No user-facing changes in lesson flow

❌ **Fail:** Any vocabulary appears before it should
❌ **Fail:** Word banks missing words
❌ **Fail:** Console errors

---

## Notes

- This is a **performance-only** refactor
- No feature changes
- No new `learnedSoFar` integrations
- `allVocab`, `WordBankService`, and game components remain unchanged
- Review mode, matching, and audio-meaning remain unchanged


