# XP Flow Test - Manual Verification

## Test 1: NEW Step (Should Award XP)
**Setup:**
1. Open Module 1, Lesson 1
2. Note current XP (e.g., 16387)
3. Find a step you haven't completed yet

**Steps:**
1. Complete the step correctly
2. Watch console logs
3. Watch XP number in header

**Expected Logs:**
```
⚡ Optimistic: 16387 → 16389 (+2)
✅ XP awarded: 2 (quiz) - module1:lesson1:v2-quiz-abc123
✅ Tracked salam: correct
```

**Expected UI:**
- XP number goes from 16387 → 16389 **and stays at 16389** ✅
- Success sound plays ✅
- No reconciliation log ✅

**Result:** PASS / FAIL

---

## Test 2: ALREADY-DONE Step (Cached - Should NOT Award XP)
**Setup:**
1. Complete a step (e.g., first flashcard)
2. Go back to the same step
3. Complete it again

**Steps:**
1. Complete the step correctly
2. Watch console logs
3. Watch XP number in header

**Expected Logs:**
```
⏭️ XP already earned (cached): module1:lesson1:v2-flashcard-salam
Step already completed: v2-flashcard-salam (reason: cached)
✅ Tracked salam: correct
```

**Expected UI:**
- **NO optimistic update log** ✅
- **NO reconciliation log** ✅
- XP number **stays the same** (e.g., 16389 → 16389) ✅
- Success sound plays ✅

**Result:** PASS / FAIL

---

## Test 3: ALREADY-DONE Step (Cache Miss - Edge Case)
**Setup:**
1. Complete a step fully
2. Open DevTools → Application → Local Storage
3. Find and delete the key: `xp-<userId>-module1:lesson1:v2-flashcard-salam`
4. Go back and complete the same step again

**Steps:**
1. Complete the step correctly
2. Watch console logs
3. Watch XP number in header

**Expected Logs:**
```
⚡ Optimistic: 16389 → 16391 (+2)
🔄 XP reconciled: 16391 → 16389
Step already completed: v2-flashcard-salam (reason: already_awarded)
✅ Tracked salam: correct
```

**Expected UI:**
- XP number goes 16389 → 16391 → 16389 (brief flicker) ⚠️
- Success sound plays ✅
- This is **acceptable** for the edge case of cleared cache ✅

**Result:** PASS / FAIL

---

## Summary
- **Test 1 (NEW):** Must show XP increase and stay
- **Test 2 (CACHED):** Must show NO flicker, NO logs
- **Test 3 (CACHE MISS):** Brief flicker acceptable

