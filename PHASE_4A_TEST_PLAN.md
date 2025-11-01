# Phase 4A Testing Plan - Per-Word Tracking & XP Fixes

## Test Environment
- **Branch:** `word-bank-fixes`
- **Database:** Supabase with `vocabulary_performance` and `vocabulary_attempts` tables
- **Module:** Module 1, Lessons 1-4

---

## ✅ Test 1: XP Flicker Fix

### Goal
Verify that completing an already-done step doesn't cause XP number to flicker up-then-down.

### Steps
1. Complete Module 1, Lesson 1 (all steps)
2. Note your current XP total
3. Go back to the lesson page
4. Complete the first step again
5. **Expected Result:**
   - ✅ Success sound plays (dopamine!)
   - ✅ XP number stays at same value (no +2 then -2)
   - ✅ Console shows: `⏭️ XP already earned (cached)` or `Step already completed`
   - ✅ No XP animation

### Console Check
```
Step already completed: v2-text-seq-salamchetori (reason: cached)
```

---

## ✅ Test 2: Per-Word Tracking (AudioSequence - Fully Correct)

### Goal
Verify correct per-word tracking when user gets all words right.

### Steps
1. Clear Supabase `vocabulary_attempts` table (optional, for clean test)
2. Complete Module 1, Lesson 2 → Audio sequence: "salam khosh amadid" (Hello, Welcome)
3. Select correct answer: "Hello" + "Welcome"
4. **Expected Result:**
   - ✅ Step marked correct
   - ✅ XP awarded
   - ✅ Success sound plays

### Supabase Validation
Query `vocabulary_attempts` for this step:
```sql
SELECT vocabulary_id, word_text, is_correct, game_type
FROM vocabulary_attempts
WHERE game_type = 'audio-sequence'
ORDER BY created_at DESC LIMIT 2;
```

**Expected:**
| vocabulary_id | word_text | is_correct | game_type |
|---------------|-----------|------------|-----------|
| salam         | Hello     | true       | audio-sequence |
| khosh_amadid  | Welcome   | true       | audio-sequence |

---

## ✅ Test 3: Per-Word Tracking (AudioSequence - Partially Correct)

### Goal
Verify accurate per-word tracking when user gets ONE word wrong.

### Steps
1. Go to Module 1, Lesson 2 → Audio sequence: "khoobam merci" (I'm good, Thank you)
2. Select incorrect answer: "I'm good" + "Goodbye" (wrong second word)
3. **Expected Result:**
   - ❌ Step marked incorrect
   - ❌ No XP awarded
   - ❌ No success sound

### Supabase Validation
Query `vocabulary_attempts` for this step:
```sql
SELECT vocabulary_id, word_text, is_correct, game_type
FROM vocabulary_attempts
WHERE game_type = 'audio-sequence'
ORDER BY created_at DESC LIMIT 2;
```

**Expected:**
| vocabulary_id | word_text | is_correct | game_type |
|---------------|-----------|------------|-----------|
| khoobam       | I'm good  | true       | audio-sequence |
| merci         | Thank you | false      | audio-sequence |

**🔥 KEY:** Even though overall answer is wrong, "I'm good" should be tracked as **correct** ✅

---

## ✅ Test 4: Per-Word Tracking (TextSequence - Fully Correct)

### Goal
Verify correct per-word tracking in TextSequence.

### Steps
1. Complete Module 1, Lesson 3 → Text sequence: "Salam, man khoobam" (Hello, I am good)
2. Select correct answer: "Hello" + "I" + "Am" + "Good"
3. **Expected Result:**
   - ✅ Step marked correct
   - ✅ XP awarded
   - ✅ Success sound plays

### Supabase Validation
Query `vocabulary_attempts` for this step:
```sql
SELECT vocabulary_id, word_text, is_correct, game_type
FROM vocabulary_attempts
WHERE game_type = 'text-sequence'
ORDER BY created_at DESC LIMIT 4;
```

**Expected:**
| vocabulary_id | word_text | is_correct | game_type |
|---------------|-----------|------------|-----------|
| salam         | Hello     | true       | text-sequence |
| man           | I         | true       | text-sequence |
| hastam        | Am        | true       | text-sequence |
| khoob         | Good      | true       | text-sequence |

---

## ✅ Test 5: Per-Word Tracking (TextSequence - Partially Correct)

### Goal
Verify accurate per-word tracking when user gets multiple words wrong.

### Steps
1. Go to Module 1, Lesson 4 → Text sequence: "Salam, esme shoma chiye?" (Hello, what is your name?)
2. Select incorrect answer: "Hello" + "What" + "Are" + "You"
3. **Expected Result:**
   - ❌ Step marked incorrect
   - ❌ No XP awarded

### Supabase Validation
Query `vocabulary_attempts` for this step:
```sql
SELECT vocabulary_id, word_text, is_correct, game_type
FROM vocabulary_attempts
WHERE game_type = 'text-sequence'
ORDER BY created_at DESC LIMIT 10;
```

**Expected (partial list):**
| vocabulary_id | word_text | is_correct | game_type |
|---------------|-----------|------------|-----------|
| salam         | Hello     | true       | text-sequence |
| esm           | Name      | false      | text-sequence |
| shoma         | Your      | false      | text-sequence |
| chiye         | What is   | false      | text-sequence |

**🔥 KEY:** "Hello" should be tracked as **correct** even though overall answer is wrong ✅

---

## ✅ Test 6: Time Tracking

### Goal
Verify `time_spent_ms` is accurately recorded.

### Steps
1. Complete any AudioSequence or TextSequence step
2. Take ~10 seconds to answer
3. **Expected Result:**
   - ✅ `time_spent_ms` in Supabase should be ~10000ms

### Supabase Validation
```sql
SELECT vocabulary_id, word_text, time_spent_ms, game_type
FROM vocabulary_attempts
ORDER BY created_at DESC LIMIT 5;
```

**Expected:**
- `time_spent_ms` should be > 0 and reasonable (e.g., 5000-15000ms for manual test)

---

## ✅ Test 7: Remediation (2+ Incorrect Trigger)

### Goal
Verify remediation only triggers after 2+ incorrect attempts.

### Steps
1. Go to Module 1, Lesson 2 → Quiz with word "chetori"
2. Answer incorrectly (1st attempt)
3. **Expected Result:**
   - ❌ No remediation step inserted yet
   - Console: `⚠️ First incorrect attempt for "chetori" (1/2 - no remediation yet)`
4. Continue lesson, encounter "chetori" again
5. Answer incorrectly (2nd attempt)
6. **Expected Result:**
   - ✅ Remediation step appears next
   - Console: `🎯 Remediation triggered for "chetori" (2 incorrect attempts)`

---

## ✅ Test 8: No XP for Remediation

### Goal
Verify remediation steps don't award XP.

### Steps
1. Complete a remediation flashcard or quiz
2. **Expected Result:**
   - ✅ Step completes
   - ✅ Success sound plays
   - ❌ No XP awarded
   - ❌ No XP animation

### Console Check
```
Remediation step completed (no XP awarded)
```

---

## ✅ Test 9: Synonym Handling (Hi/Hello/Salam)

### Goal
Verify synonyms are handled correctly in per-word validation.

### Steps
1. Complete Module 1, Lesson 1 → Text sequence: "Salam chetori"
2. Select: "Hi" + "How are you?" (instead of "Hello")
3. **Expected Result:**
   - ✅ Step marked correct
   - ✅ XP awarded
   - ✅ "salam" tracked as correct (even though user said "Hi" instead of "Hello")

---

## 🔍 Edge Cases to Test

### Edge Case 1: Empty Word Bank
- **Scenario:** Curriculum step with no `expectedTranslation` or `sequenceIds`
- **Expected:** Fallback to bulk tracking (no crash)

### Edge Case 2: User Completes Step Twice in Same Session
- **Scenario:** Complete step, go back, complete again
- **Expected:** XP only awarded once, no flicker

### Edge Case 3: Network Failure During XP Award
- **Scenario:** Disconnect internet, complete step
- **Expected:** Optimistic update shows, reconciles when reconnected

---

## 📊 Success Criteria

### All Tests Must Pass:
- ✅ No XP flicker for already-completed steps
- ✅ Per-word tracking accurate (not bulk)
- ✅ Time tracking present in all attempts
- ✅ Remediation triggers at 2+ incorrect
- ✅ No XP awarded for remediation
- ✅ Success sound plays for all correct answers (even already-completed)
- ✅ Synonyms handled correctly
- ✅ No console errors
- ✅ No TypeScript linter errors

---

## 🚀 Next Steps After Testing

Once all tests pass:
1. Merge `word-bank-fixes` → `main`
2. Deploy to Vercel
3. Smoke test in production
4. Move to **Phase 4B: Dashboard Widgets**

---

**Tested by:** [Your name]  
**Date:** [Test date]  
**Result:** [ ] PASS / [ ] FAIL  
**Notes:**

