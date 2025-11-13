# 🔍 DEEP DIVE: Why 100% Accuracy Words Appear in "Words to Review"

**Date:** 2025-01-13  
**Issue:** "Words to Review" shows 3 words, all with 100% accuracy  
**User Expectation:** Only struggling/bad words should appear in review  
**Current Behavior:** Time-based SRS schedule includes mastered words

---

## 🚨 ROOT CAUSE ANALYSIS

### **The Core Problem**

"Words to Review" uses **purely time-based filtering** without considering:
- ❌ Current accuracy percentage
- ❌ Mastery status (mastered vs. struggling)
- ❌ Whether the word actually needs review
- ❌ User's actual performance on the word

### **Current Algorithm Flow**

#### Step 1: SRS Schedule Calculation
```typescript
// lib/services/vocabulary-tracking-service.ts:321-325
private static calculateNextReview(masteryLevel: number): string {
  const delayMs = SRS_SCHEDULE[masteryLevel as keyof typeof SRS_SCHEDULE] || SRS_SCHEDULE[0]
  const nextReview = new Date(Date.now() + delayMs)
  return nextReview.toISOString()
}

// SRS Schedule (lines 84-91):
const SRS_SCHEDULE = {
  0: 1 * 60 * 60 * 1000,          // 1 hour (new word)
  1: 8 * 60 * 60 * 1000,          // 8 hours (learning)
  2: 24 * 60 * 60 * 1000,         // 1 day (familiar)
  3: 3 * 24 * 60 * 60 * 1000,     // 3 days (known)
  4: 7 * 24 * 60 * 60 * 1000,     // 1 week (strong)
  5: 14 * 24 * 60 * 60 * 1000     // 2 weeks (mastered)
}
```

**Problem:** `next_review_at` is calculated **only** based on `mastery_level`, not accuracy.

#### Step 2: Mastery Level Calculation
```typescript
// lib/services/vocabulary-tracking-service.ts:239-243
const newMasteryLevel = this.calculateMasteryLevel(
  current.mastery_level,
  newConsecutive,
  current.total_correct + (isCorrect ? 1 : 0)
)
```

**Key Issue:** `mastery_level` can be **low** even with **high accuracy**:
- A word answered correctly 3/3 times (100% accuracy) might still have `mastery_level = 0` or `1`
- This happens if the word was just learned (first attempt sets mastery_level to 0 or 1)
- Even with perfect accuracy, the word gets scheduled for review in 1-8 hours

#### Step 3: "Words to Review" Filter
```typescript
// lib/services/vocabulary-tracking-service.ts:605-613
const wordsToReview = words
  .filter(w => w.next_review_at && new Date(w.next_review_at) <= new Date())
  .sort((a, b) => {
    const aDate = a.next_review_at ? new Date(a.next_review_at).getTime() : 0
    const bDate = b.next_review_at ? new Date(b.next_review_at).getTime() : 0
    return aDate - bDate // Oldest review dates first
  })
  .slice(0, 10) // Top 10 words due for review
```

**Critical Gap:** This filter **ONLY** checks:
- ✅ `next_review_at <= NOW()` (time-based)
- ❌ **NO** accuracy check
- ❌ **NO** mastery status check
- ❌ **NO** "struggling" filter

---

## 📊 EXAMPLE SCENARIO (Why 100% Words Appear)

### Scenario: New Word, Perfect Performance

1. **User learns word "Salam"** (first time)
   - `total_attempts = 1`
   - `total_correct = 1`
   - `total_incorrect = 0`
   - `accuracy = 100%` ✅
   - `consecutive_correct = 1`
   - `mastery_level = 1` (because first attempt was correct)
   - `next_review_at = NOW() + 8 hours` (mastery_level 1 = 8 hours)

2. **8 hours later**
   - `next_review_at <= NOW()` ✅
   - Word appears in "Words to Review"
   - **But accuracy is still 100%** ❌

3. **User answers correctly again**
   - `total_attempts = 2`
   - `total_correct = 2`
   - `accuracy = 100%` ✅
   - `consecutive_correct = 2`
   - `mastery_level = 2` (increased)
   - `next_review_at = NOW() + 1 day`

4. **1 day later**
   - `next_review_at <= NOW()` ✅
   - Word appears in "Words to Review" again
   - **But accuracy is still 100%** ❌

**Result:** Perfect words keep appearing in review because SRS schedule is time-based, not performance-based.

---

## 🔍 WHAT THE ALGORITHM IS MISSING

### **1. Accuracy-Based Filtering**

**Current:** No accuracy check in "Words to Review"  
**Needed:** Exclude words with high accuracy (e.g., >= 90%)

```typescript
// MISSING: Filter by accuracy
.filter(w => {
  const accuracy = w.total_attempts > 0 
    ? (w.total_correct / w.total_attempts) * 100 
    : 0
  return accuracy < 90 // Only struggling words
})
```

### **2. Mastery Status Check**

**Current:** No check if word is "mastered"  
**Needed:** Exclude mastered words from review

```typescript
// MISSING: Check mastery status from SQL view
.filter(w => w.status !== 'mastered')
```

### **3. Minimum Attempts Threshold**

**Current:** Words with 1-2 attempts can appear  
**Needed:** Only review words with enough data (e.g., >= 3 attempts)

```typescript
// MISSING: Minimum attempts check
.filter(w => w.total_attempts >= 3)
```

### **4. Recent Performance Consideration**

**Current:** No check for recent struggles  
**Needed:** Prioritize words with recent incorrect answers

```typescript
// MISSING: Recent struggle check
.filter(w => {
  // Only review if:
  // - Low accuracy (< 70%)
  // - OR recent incorrect answer (last_seen_at shows struggle)
  return w.accuracy < 70 || w.consecutive_correct < 2
})
```

---

## 🎯 WHAT "WORDS TO REVIEW" SHOULD ACTUALLY DO

### **User's Expectation:**
> "I want words they are bad at are struggling to be reviewed"

### **Current Behavior:**
- Shows ALL words where `next_review_at <= NOW()`
- Includes 100% accuracy words
- Includes newly learned words (1-2 attempts)
- No distinction between struggling vs. mastered

### **Expected Behavior:**
- Show ONLY words that are **struggling**:
  - Accuracy < 70% OR
  - Consecutive correct < 2 OR
  - Recent incorrect answers
- Exclude words that are **mastered**:
  - Accuracy >= 90% AND
  - Consecutive correct >= 5 AND
  - Total attempts >= 3
- Prioritize by **urgency**:
  - Overdue words first
  - Low accuracy words first
  - Recent struggles first

---

## 📋 ALGORITHM COMPARISON

### **Current Algorithm (Broken)**
```typescript
wordsToReview = words
  .filter(w => w.next_review_at <= NOW())  // Time-based only
  .sort(by next_review_at ASC)
  .slice(0, 10)
```

**Result:** Includes 100% accuracy words ✅ (WRONG)

### **What It Should Be**
```typescript
wordsToReview = words
  .filter(w => {
    // Exclude mastered words
    if (w.status === 'mastered') return false
    
    // Only include struggling words
    const accuracy = w.total_attempts > 0 
      ? (w.total_correct / w.total_attempts) * 100 
      : 0
    
    return (
      w.next_review_at <= NOW() &&  // Due for review
      (
        accuracy < 70 ||              // Low accuracy
        w.consecutive_correct < 2 ||  // Recent struggle
        w.total_attempts < 3          // Not enough practice
      )
    )
  })
  .sort(by urgency: overdue > low accuracy > recent struggle)
  .slice(0, 10)
```

**Result:** Only struggling words ✅ (CORRECT)

---

## 🔧 WHY THIS HAPPENS

### **Root Cause:**
The SRS (Spaced Repetition System) is designed for **retention**, not **remediation**:
- SRS assumes: "Review words periodically to prevent forgetting"
- User expects: "Review words I'm struggling with"

### **Mismatch:**
- **SRS philosophy:** Even mastered words need periodic review (to maintain memory)
- **User expectation:** Only struggling words need review (to improve)

### **The Fix:**
Combine both approaches:
1. **Struggling words:** Always prioritize (low accuracy, recent mistakes)
2. **Mastered words:** Only review if overdue AND decay detected (not seen in 14+ days)

---

## 📊 DATA STRUCTURE ANALYSIS

### **What `user_word_mastery` View Provides:**
- ✅ `status`: 'mastered' | 'hard' | 'learning' | 'unclassified'
- ✅ `accuracy`: 0-100 percentage
- ✅ `consecutive_correct`: Streak count
- ✅ `total_attempts`: Attempt count
- ✅ `next_review_at`: SRS schedule

### **What "Words to Review" Currently Uses:**
- ✅ `next_review_at` (time-based)
- ❌ `status` (NOT USED)
- ❌ `accuracy` (NOT USED)
- ❌ `consecutive_correct` (NOT USED)

**Gap:** All the data exists, but the filter doesn't use it!

---

## 🎯 RECOMMENDED FIX (Analysis Only)

### **Option 1: Filter by Status**
```typescript
wordsToReview = words
  .filter(w => 
    w.next_review_at <= NOW() &&
    w.status !== 'mastered' &&  // Exclude mastered
    w.status !== 'unclassified'  // Exclude new words
  )
```

**Pros:** Simple, uses existing SQL view  
**Cons:** Still includes "learning" words that might be doing well

### **Option 2: Filter by Accuracy + Status**
```typescript
wordsToReview = words
  .filter(w => {
    if (w.status === 'mastered') return false
    if (w.accuracy >= 90 && w.total_attempts >= 3) return false
    return w.next_review_at <= NOW()
  })
```

**Pros:** More precise, excludes high-accuracy words  
**Cons:** More complex logic

### **Option 3: Prioritize Struggling Words**
```typescript
wordsToReview = words
  .filter(w => w.next_review_at <= NOW())
  .filter(w => {
    // Prioritize struggling words
    return w.status === 'hard' || 
           w.accuracy < 70 || 
           w.consecutive_correct < 2
  })
```

**Pros:** Focuses on struggling words  
**Cons:** Might miss words that need review but aren't "hard"

---

## 📝 SUMMARY

### **Why 100% Accuracy Words Appear:**
1. ✅ SRS schedule is **time-based** (not performance-based)
2. ✅ `next_review_at` calculated from `mastery_level` (not accuracy)
3. ✅ "Words to Review" filter **only checks time** (not accuracy/status)
4. ✅ New words with perfect performance still get scheduled for review

### **What's Missing:**
1. ❌ Accuracy check in filter (< 90% accuracy)
2. ❌ Mastery status check (exclude 'mastered')
3. ❌ Minimum attempts threshold (>= 3 attempts)
4. ❌ Prioritization by struggle (low accuracy first)

### **The Fix:**
Combine SRS schedule with performance-based filtering:
- Keep time-based scheduling (SRS)
- Add accuracy/status filtering (exclude mastered)
- Prioritize struggling words (low accuracy first)

---

**Conclusion:** The algorithm is working as designed (time-based SRS), but it doesn't match user expectations (performance-based review). The fix requires adding accuracy/status filters to exclude mastered words from "Words to Review".

