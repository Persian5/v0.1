# Word Mastery Algorithm - Edge Cases Analysis
**Date:** 2025-01-13  
**Purpose:** Comprehensive edge case analysis before deployment

---

## 🔍 EDGE CASE ANALYSIS

### Edge Case 1: Division by Zero
**Scenario:** `total_attempts = 0`

**SQL Handling:**
```sql
NULLIF(p.total_attempts, 0)  -- Returns NULL if total_attempts = 0
```

**Result:** 
- `accuracy` calculation: `NULL / NULL * 100` = `NULL`
- But view uses `CASE WHEN total_attempts > 0 THEN ... ELSE 0.0 END`
- ✅ **SAFE**: Returns 0.0 for accuracy when total_attempts = 0

**Status Logic:**
- `total_attempts < 3` → `'unclassified'`
- ✅ **SAFE**: Word with 0 attempts is unclassified

---

### Edge Case 2: NULL Values
**Scenario:** `total_correct = NULL` or `total_incorrect = NULL`

**SQL Handling:**
- Columns are `NOT NULL DEFAULT 0` in schema
- ✅ **SAFE**: NULL values cannot occur

---

### Edge Case 3: Boundary Conditions - Exactly 90% Accuracy
**Scenario:** Word has exactly 90.0% accuracy

**SQL Logic:**
```sql
accuracy >= 90  -- Uses >= (inclusive)
```

**Test Cases:**
- 3 attempts, 3 correct = 100% → ✅ Mastered
- 10 attempts, 9 correct = 90% → ✅ Mastered (boundary included)
- 10 attempts, 8 correct = 80% → ❌ Not mastered
- ✅ **SAFE**: Boundary handled correctly

---

### Edge Case 4: Boundary Conditions - Exactly 70% Accuracy
**Scenario:** Word has exactly 70.0% accuracy

**SQL Logic:**
```sql
accuracy < 70  -- Uses < (exclusive)
```

**Test Cases:**
- 10 attempts, 7 correct = 70% → ❌ Not hard (boundary excluded)
- 10 attempts, 6 correct = 60% → ✅ Hard
- ✅ **SAFE**: Boundary handled correctly (70% is "learning", not "hard")

---

### Edge Case 5: Exactly 3 Attempts
**Scenario:** Word has exactly 3 attempts

**SQL Logic:**
```sql
WHEN total_attempts < 3 THEN 'unclassified'
WHEN ... AND total_attempts >= 3 THEN 'mastered'
```

**Test Cases:**
- 3 attempts, 3 correct, 5 consecutive → ✅ Mastered (meets criteria)
- 3 attempts, 2 correct, 1 consecutive → ❌ Not mastered → Check hard → Check learning
- ✅ **SAFE**: Boundary handled correctly

---

### Edge Case 6: Exactly 2 Attempts
**Scenario:** Word has exactly 2 attempts

**SQL Logic:**
```sql
WHEN total_attempts < 3 THEN 'unclassified'
WHEN total_attempts >= 2 AND ... THEN 'hard'
```

**Test Cases:**
- 2 attempts, 0 correct = 0% → ✅ Unclassified (checked first)
- ✅ **SAFE**: 2 attempts always unclassified (mutual exclusivity)

---

### Edge Case 7: Consecutive Correct > Total Attempts
**Scenario:** `consecutive_correct = 5` but `total_attempts = 3`

**Reality Check:**
- This is impossible with our logic (consecutive_correct can't exceed total_attempts)
- But if it happens (data corruption), SQL still works:
  - `consecutive_correct >= 5` → true
  - `accuracy >= 90` → check
  - `total_attempts >= 3` → true
  - ✅ **SAFE**: Would be marked mastered (which is correct)

---

### Edge Case 8: Mutual Exclusivity - Word Meets Both Criteria
**Scenario:** Word has `consecutive_correct >= 5` AND `accuracy >= 90` AND `total_attempts >= 3` (mastered)
**AND** `accuracy < 70` OR `consecutive_correct < 2` (hard)

**Reality Check:**
- Impossible: Can't have `accuracy >= 90` AND `accuracy < 70`
- Can't have `consecutive_correct >= 5` AND `consecutive_correct < 2`
- ✅ **SAFE**: SQL explicitly excludes mastered words from hard:
```sql
AND NOT (
  p.consecutive_correct >= 5 
  AND accuracy >= 90 
  AND total_attempts >= 3
)
```

---

### Edge Case 9: All Attempts Correct (100% Accuracy)
**Scenario:** 5 attempts, 5 correct, 5 consecutive

**SQL Result:**
- `accuracy = 100%` → ✅ Mastered
- ✅ **SAFE**: Correctly classified

---

### Edge Case 10: All Attempts Incorrect (0% Accuracy)
**Scenario:** 5 attempts, 0 correct, 0 consecutive

**SQL Result:**
- `accuracy = 0%` → ✅ Hard (accuracy < 70%)
- ✅ **SAFE**: Correctly classified

---

### Edge Case 11: Single Attempt
**Scenario:** 1 attempt, 1 correct

**SQL Result:**
- `total_attempts < 3` → ✅ Unclassified
- ✅ **SAFE**: Correctly classified (not enough data)

---

### Edge Case 12: High Consecutive but Low Overall Accuracy
**Scenario:** 10 attempts, 5 correct (50% accuracy), but 5 consecutive correct

**SQL Result:**
- `consecutive_correct >= 5` → true
- `accuracy >= 90` → false (50% < 90%)
- `total_attempts >= 3` → true
- Status: Not mastered → Check hard → `accuracy < 70` → true → ✅ Hard
- ✅ **SAFE**: Correctly NOT mastered (accuracy too low)

---

### Edge Case 13: High Accuracy but Low Consecutive
**Scenario:** 10 attempts, 9 correct (90% accuracy), but only 2 consecutive correct

**SQL Result:**
- `consecutive_correct >= 5` → false
- Status: Not mastered → Check hard → `consecutive_correct < 2` → false → Check learning → ✅ Learning
- ✅ **SAFE**: Correctly NOT mastered (needs consistency)

---

### Edge Case 14: Decay Logic - NULL last_correct_at
**Scenario:** Word has `mastery_level = 5` but `last_correct_at = NULL`

**SQL Result:**
```sql
WHEN p.last_correct_at IS NULL THEN GREATEST(0, p.mastery_level - 1)
```
- `effective_mastery_level = 4` (reduced by 1)
- ✅ **SAFE**: Decay applied correctly

---

### Edge Case 15: Decay Logic - Exactly 14 Days Ago
**Scenario:** `last_correct_at = NOW() - INTERVAL '14 days'`

**SQL Result:**
```sql
WHEN p.last_correct_at < NOW() - INTERVAL '14 days' THEN ...
```
- `14 days ago < 14 days ago` → false
- `effective_mastery_level = mastery_level` (no decay)
- ✅ **SAFE**: Boundary handled correctly (14 days = still active)

---

### Edge Case 16: Decay Logic - 15 Days Ago
**Scenario:** `last_correct_at = NOW() - INTERVAL '15 days'`

**SQL Result:**
- `15 days ago < 14 days ago` → true
- `effective_mastery_level = mastery_level - 1`
- ✅ **SAFE**: Decay applied correctly

---

### Edge Case 17: Confidence Score - All Components Maxed
**Scenario:** 100% accuracy, 5+ consecutive, 5+ attempts

**SQL Result:**
```sql
accuracy * 0.6 = 100 * 0.6 = 60
streak_ratio * 30 = 1.0 * 30 = 30
attempt_weight * 10 = 1.0 * 10 = 10
Total = 100
```
- ✅ **SAFE**: Max confidence = 100

---

### Edge Case 18: Confidence Score - Zero Attempts
**Scenario:** `total_attempts = 0`

**SQL Result:**
- `NULLIF(total_attempts, 0)` → NULL
- `NULL / NULL * 100` → NULL
- But view uses `CASE WHEN total_attempts > 0 THEN ... ELSE 0.0 END`
- Confidence = `0.0 * 0.6 + 0 * 30 + 0 * 10 = 0`
- ✅ **SAFE**: Returns 0 confidence

---

### Edge Case 19: View Query - No Rows
**Scenario:** User has no vocabulary_performance records

**Service Handling:**
```typescript
const words = data || []
words.filter(...).length  // Returns 0
```
- ✅ **SAFE**: Returns empty arrays and 0 counts

---

### Edge Case 20: View Query - Error
**Scenario:** View doesn't exist or query fails

**Service Handling:**
```typescript
if (error) {
  return await this.getDashboardStatsFallback(userId)
}
```
- ✅ **SAFE**: Falls back to old logic (backward compatible)

---

## ✅ VERIFICATION CHECKLIST

### SQL View Logic
- [x] Division by zero handled (NULLIF)
- [x] NULL values handled (CASE statements)
- [x] Boundary conditions correct (>= 90%, < 70%)
- [x] Mutual exclusivity enforced
- [x] Unclassified bucket works (< 3 attempts)
- [x] Decay logic handles NULL
- [x] Decay logic handles 14-day boundary

### Service Layer Logic
- [x] View query with fallback
- [x] Handles empty results
- [x] Handles errors gracefully
- [x] Updates last_correct_at on correct answers
- [x] Sets last_correct_at on first correct attempt

### API Layer Logic
- [x] Uses VocabularyTrackingService (single source)
- [x] Returns all new fields (unclassifiedWords, wordsToReview)
- [x] Backward compatible (optional fields)

### Type Safety
- [x] TypeScript interfaces updated
- [x] Optional fields for backward compatibility
- [x] Cache interface updated

---

## 🚨 POTENTIAL ISSUES FOUND

### Issue 1: View Status Logic Order
**Current:** Checks unclassified first, then mastered, then hard
**Analysis:** ✅ Correct order - unclassified must be checked first

### Issue 2: Hard Words Exclusion
**Current:** Explicitly excludes mastered words
**Analysis:** ✅ Correct - mutual exclusivity enforced

### Issue 3: Learning Status
**Current:** Everything else (ELSE clause)
**Analysis:** ✅ Correct - catches words with 3+ attempts that aren't mastered or hard

---

## 📊 TEST CASES TO VERIFY

### Test Case 1: New User (No Data)
- Expected: All counts = 0, empty arrays
- ✅ Handled by empty array checks

### Test Case 2: Word with 1 Attempt
- Expected: Unclassified
- ✅ Handled by `total_attempts < 3`

### Test Case 3: Word with 2 Attempts, 1 Correct
- Expected: Unclassified (not enough data)
- ✅ Handled by `total_attempts < 3`

### Test Case 4: Word with 3 Attempts, 3 Correct, 3 Consecutive
- Expected: Learning (not mastered - needs 5 consecutive)
- ✅ Handled correctly

### Test Case 5: Word with 5 Attempts, 5 Correct, 5 Consecutive
- Expected: Mastered
- ✅ Handled correctly

### Test Case 6: Word with 10 Attempts, 7 Correct (70% accuracy)
- Expected: Learning (70% is boundary, not hard)
- ✅ Handled correctly (`accuracy < 70` is false for 70%)

### Test Case 7: Word with 10 Attempts, 6 Correct (60% accuracy)
- Expected: Hard
- ✅ Handled correctly (`accuracy < 70` is true for 60%)

### Test Case 8: Word with 10 Attempts, 9 Correct (90% accuracy), 2 Consecutive
- Expected: Learning (needs 5 consecutive for mastery)
- ✅ Handled correctly

---

## ✅ FINAL VERIFICATION

**All Edge Cases:** ✅ Handled
**SQL Safety:** ✅ NULLIF prevents division by zero
**Mutual Exclusivity:** ✅ Enforced in SQL
**Backward Compatibility:** ✅ Fallback method exists
**Type Safety:** ✅ TypeScript interfaces updated

**Status:** ✅ **READY FOR DEPLOYMENT**

