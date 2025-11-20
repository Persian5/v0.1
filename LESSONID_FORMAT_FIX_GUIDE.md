# 📋 lessonId Format Fix Guide

## 🎯 What is `lessonId`?

The `lessonId` field in `VocabularyItem` is a **metadata field** that tracks which lesson a vocabulary word was first introduced in.

**Type Definition:**
```typescript
interface VocabularyItem {
  id: string;           // e.g., "salam"
  en: string;          // English meaning
  fa: string;          // Persian script
  finglish: string;    // Latin transliteration
  phonetic: string;    // Pronunciation guide
  lessonId: string;    // "module1-lesson1" ← THIS FIELD
  audio?: string;
  semanticGroup?: string;
}
```

---

## 🔍 Where is `lessonId` Used?

### 1. **Module Filtering** (CRITICAL)
**File:** `lib/services/vocabulary-progress-service.ts` (Line 151)

```typescript
// Filter vocabulary by module
if (config.moduleOnly) {
  filtered = filtered.filter(vocab => vocab.lessonId.startsWith(config.moduleOnly!));
}
```

**What it does:** Filters vocabulary to only show words from a specific module (e.g., `"module3"`)

**Current Problem:** 
- Module 3 vocab has `lessonId: "lesson2"` instead of `"module3-lesson2"`
- Filter `vocab.lessonId.startsWith("module3")` will **FAIL** ❌
- Words won't be included in module-specific vocabulary lists

**Impact:** ⚠️ **HIGH** - Breaks module filtering functionality

---

### 2. **Grammar Sequence Building**
**File:** `lib/services/persian-grammar-service.ts` (Lines 84, 107, 118, etc.)

```typescript
// When building grammar sequences, preserves lessonId from original vocab
result.push({
  id: `${currentId}_possessive`,
  originalId: currentId,
  en: possessiveForm,
  fa: currentVocab.fa,
  finglish: currentVocab.finglish,
  phonetic: currentVocab.phonetic,
  lessonId: currentVocab.lessonId  // ← Preserved from original
});
```

**What it does:** When building grammar sequences (like "esme man" → "My name"), preserves the original `lessonId` for tracking

**Current Problem:**
- Inconsistent format makes it harder to track vocabulary origin
- Analytics queries may fail or produce incorrect results

**Impact:** ⚠️ **MEDIUM** - Affects analytics and vocabulary origin tracking

---

### 3. **Database Analytics** (Context Tracking)
**File:** `lib/services/vocabulary-tracking-service.ts` (Line 130)

```typescript
// When storing vocabulary attempts to database
await supabase
  .from('vocabulary_attempts')
  .insert({
    user_id: userId,
    vocabulary_id: vocabularyId,
    game_type: gameType,
    is_correct: isCorrect,
    time_spent_ms: timeSpentMs,
    module_id: moduleId,      // ← Separate field
    lesson_id: lessonId,      // ← Separate field (from lesson context, not vocab.lessonId)
    step_uid: stepUid,
    context_data: contextData
  })
```

**What it does:** Stores which module/lesson the attempt happened in (separate from `vocab.lessonId`)

**Note:** The database uses `module_id` and `lesson_id` from the **lesson context** (passed from `LessonRunner`), NOT from `vocab.lessonId`. So this is **NOT directly affected** by the format issue.

**Impact:** ✅ **LOW** - Database uses separate fields from lesson context

---

### 4. **Vocabulary Service Lookups**
**File:** `lib/services/vocabulary-service.ts`

```typescript
static getLessonVocabulary(moduleId: string, lessonId: string): VocabularyItem[] {
  const lesson = getLesson(moduleId, lessonId);
  return lesson?.vocabulary || [];
}
```

**What it does:** Gets vocabulary from a specific lesson

**Current Problem:** None - This function doesn't use `vocab.lessonId`, it uses the lesson's vocabulary array directly

**Impact:** ✅ **NONE** - Not affected

---

## 🚨 Current Inconsistencies

### Module 1 & 2: ✅ CORRECT FORMAT
```typescript
lessonId: "module1-lesson1"  ✅
lessonId: "module1-lesson2"  ✅
lessonId: "module2-lesson1"  ✅
lessonId: "module2-lesson5"  ✅
```

### Module 3: ❌ INCORRECT FORMAT
```typescript
// Lesson 2 vocabulary (4 entries)
lessonId: "lesson2"  ❌ Should be "module3-lesson2"

// Lesson 3 vocabulary (2 entries)
lessonId: "lesson3"  ❌ Should be "module3-lesson3"

// Lesson 5 vocabulary (2 entries)
lessonId: "lesson5"  ❌ Should be "module3-lesson5"
```

**Total entries to fix:** 8 vocabulary entries

---

## 🔧 What Needs to be Fixed

### Files to Modify:
1. **`lib/config/curriculum.ts`** - Fix 8 vocabulary entries in Module 3

### Specific Locations:

#### Module 3, Lesson 2 (4 entries) - Lines 3463, 3471, 3479, 3487
```typescript
// Line 3463
{ id: "esmam", ..., lessonId: "lesson2" }  ❌

// Line 3471
{ id: "esmet", ..., lessonId: "lesson2" }  ❌

// Line 3479
{ id: "hast", ..., lessonId: "lesson2" }  ❌

// Line 3487
{ id: "in", ..., lessonId: "lesson2" }  ❌
```

#### Module 3, Lesson 3 (2 entries) - Lines 3755, 3763
```typescript
// Line 3755
{ id: "madar", ..., lessonId: "lesson3" }  ❌

// Line 3763
{ id: "pedar", ..., lessonId: "lesson3" }  ❌
```

#### Module 3, Lesson 5 (2 entries) - Lines 4147, 4155
```typescript
// Line 4147
{ id: "baradar", ..., lessonId: "lesson5" }  ❌

// Line 4155
{ id: "khahar", ..., lessonId: "lesson5" }  ❌
```

---

## ⚠️ Impact Analysis

### What WILL Break if Not Fixed:

1. **Module Filtering** ❌
   - `VocabularyProgressService.filterVocabulary()` with `moduleOnly: "module3"` will return **empty array**
   - Practice games that filter by module won't include Module 3 vocabulary
   - Review mode may not show Module 3 words correctly

2. **Analytics Queries** ⚠️
   - Any code that parses `lessonId` expecting `module{X}-lesson{Y}` format will fail
   - Module-based vocabulary statistics may be incorrect

3. **Code Consistency** ⚠️
   - Other parts of codebase expect `module{X}-lesson{Y}` format
   - Future features may break if format is inconsistent

### What WON'T Break:

1. **Database Tracking** ✅
   - Database uses separate `module_id` and `lesson_id` fields from lesson context
   - Not directly affected by `vocab.lessonId` format

2. **Lesson Vocabulary Lookups** ✅
   - `VocabularyService.getLessonVocabulary()` doesn't use `vocab.lessonId`
   - Uses lesson's vocabulary array directly

3. **Step Rendering** ✅
   - Steps reference vocabulary by `vocabularyId` (the `id` field), not `lessonId`
   - Not affected by format inconsistency

---

## ✅ Recommended Fix Strategy

### Step 1: Fix All 8 Entries
Change all Module 3 vocabulary entries from:
```typescript
lessonId: "lesson2"  →  lessonId: "module3-lesson2"
lessonId: "lesson3"  →  lessonId: "module3-lesson3"
lessonId: "lesson5"  →  lessonId: "module3-lesson5"
```

### Step 2: Verify No Other Issues
Search for any other uses of `lessonId` that might expect the format:
```bash
grep -r "lessonId" --include="*.ts" --include="*.tsx"
```

### Step 3: Test Module Filtering
After fix, test that Module 3 vocabulary filtering works:
```typescript
// Should return Module 3 vocabulary
const module3Vocab = VocabularyProgressService.getVocabularyForPractice({
  moduleOnly: "module3"
});
```

---

## 📊 Risk Assessment

**Risk Level:** 🟡 **MEDIUM**

**Why Medium:**
- ✅ Most functionality uses `vocabularyId` (the `id` field), not `lessonId`
- ⚠️ Module filtering WILL break if not fixed
- ⚠️ Analytics may be affected
- ✅ Database tracking is separate (not affected)
- ✅ Lesson rendering is not affected

**Fix Complexity:** 🟢 **LOW**
- Simple find-and-replace in 8 locations
- No code logic changes needed
- No database migrations needed
- No breaking changes to existing functionality

---

## 🎯 Summary

**What `lessonId` Does:**
- Tracks which lesson vocabulary was first introduced in
- Used for module filtering (`startsWith("module3")`)
- Used for analytics and vocabulary origin tracking
- Preserved when building grammar sequences

**Current Problem:**
- Module 3 has 8 vocabulary entries with wrong format (`"lesson2"` instead of `"module3-lesson2"`)

**Impact:**
- ⚠️ Module filtering will break
- ⚠️ Analytics may be incorrect
- ✅ Database tracking not affected
- ✅ Lesson rendering not affected

**Fix:**
- Change 8 entries from `"lesson{X}"` to `"module3-lesson{X}"`
- Low risk, simple fix
- No code changes needed beyond curriculum.ts

---

**CONFIRMATION: Analysis-only. No code modified.**

