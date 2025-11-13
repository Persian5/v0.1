# Step UID System v3 - Production Stable

## 🎯 **What Changed**

Upgraded from v2 (fallback-based) to v3 (strict content-based) UID generation.

## ✅ **The Fix: Zero Index Fallbacks**

### **Before (v2 - BROKEN):**
- Steps could fall back to `stepIndex` if content was missing
- Inserting new steps in the middle → ALL subsequent steps got new UIDs
- Users got duplicate XP for steps they already completed

### **After (v3 - PRODUCTION STABLE):**
- **NO index fallbacks** - throws errors if content is missing
- UIDs are **100% content-based** (vocabulary ID, prompt, sequence, etc.)
- Inserting new steps → existing steps keep identical UIDs ✅
- **Future-proof**: Add steps anywhere without breaking existing progress

---

## 📋 **Key Changes**

### **1. Version Bump: v2 → v3**
```typescript
export const UID_VERSION = 'v3'
```
- All existing user progress will be invalidated (one-time reset)
- After this, UIDs will be stable forever

### **2. Strict Validation**
Every step type now **requires** content identifiers:

| Step Type | Required Data | UID Format |
|-----------|--------------|------------|
| `flashcard` | `vocabularyId` | `v3-flashcard-{vocabId}` |
| `quiz` | `vocabularyId` OR `prompt+correct` | `v3-quiz-{vocabId}` or `v3-quiz-{hash}` |
| `input` | `vocabularyId` OR `answer` | `v3-input-{vocabId}` or `v3-input-{answer}` |
| `matching` | `words[]` | `v3-matching-{hash}` |
| `audio-sequence` | `sequence[]` | `v3-audio-seq-{hash}` |
| `text-sequence` | `finglishText` | `v3-text-seq-{text}` |
| `grammar-intro` | `conceptId` | `v3-grammar-intro-{conceptId}` |
| `grammar-fill-blank` | `conceptId + exercises[]` | `v3-grammar-fill-blank-{conceptId}-{hash}` |

### **3. Error Messages**
If content is missing, you'll see:
```
Error: [module1/lesson3] Flashcard step 5 missing vocabularyId - required for stable UID
```

This **forces proper curriculum data** - no silent fallbacks.

---

## 🔒 **Guarantees**

### ✅ **1. Insert Steps Anywhere**
```typescript
// Before v3:
steps = [step1, step2, step3] → UIDs: [v2-flashcard-0, v2-quiz-1, v2-input-2]
// Insert new step:
steps = [step1, NEW, step2, step3] → UIDs: [v2-flashcard-0, v2-new-1, v2-quiz-2❌, v2-input-3❌]
// BROKEN: step2 and step3 got NEW UIDs!

// After v3:
steps = [step1, step2, step3] → UIDs: [v3-flashcard-salam, v3-quiz-chetori, v3-input-man]
// Insert new step:
steps = [step1, NEW, step2, step3] → UIDs: [v3-flashcard-salam✅, v3-new-X, v3-quiz-chetori✅, v3-input-man✅]
// STABLE: Existing steps keep identical UIDs!
```

### ✅ **2. Reorder Steps**
Content-based UIDs survive reordering:
```typescript
steps = [flashcard-salam, quiz-chetori] → [quiz-chetori, flashcard-salam]
// UIDs stay the same: v3-quiz-chetori, v3-flashcard-salam
```

### ✅ **3. Modify Step Content**
Changing non-identifier content doesn't affect UIDs:
```typescript
// Change quiz options (but keep prompt+correct):
{ prompt: "What is Salam?", options: ["Hello", "Bye"], correct: 0 }
// UID stays: v3-quiz-{hash of "What is Salam?-0"}

// Change grammar description (but keep conceptId):
{ conceptId: "ezafe-connector", description: "NEW TEXT" }
// UID stays: v3-grammar-intro-ezafe-connector
```

---

## 🚀 **What This Means For You**

### **Forever Flexible:**
1. ✅ Add new steps anywhere in any lesson
2. ✅ Reorder steps without breaking progress
3. ✅ Add new modules/lessons
4. ✅ Change non-identifier content (descriptions, options, etc.)
5. ✅ Users never lose progress or get duplicate XP

### **One-Time Cost:**
- Bumping to v3 invalidates all v2 UIDs
- Users will re-earn XP for previously completed steps
- **Only happens ONCE** (during this upgrade)
- After v3, UIDs are stable forever

---

## 📊 **Testing**

After upgrade:
1. **Check console** for any UID generation errors
2. **Complete a lesson** - verify no duplicate XP
3. **Insert a new step** in curriculum - verify existing steps unchanged
4. **Reorder steps** - verify progress still works

---

## 🛡️ **Future-Proof Checklist**

When adding new steps, ensure:
- [ ] `flashcard` has `vocabularyId`
- [ ] `quiz` has `vocabularyId` OR (`prompt` + `correct`)
- [ ] `input` has `vocabularyId` OR `answer`
- [ ] `matching` has `words[]` array
- [ ] `audio-sequence` has `sequence[]` array
- [ ] `text-sequence` has `finglishText`
- [ ] `grammar-*` steps have `conceptId`

If you see an error, it means you're missing required data. Fix the curriculum data, don't fall back to index!

---

## ✅ **Summary**

**v3 = Production Stable UIDs**
- Zero index fallbacks
- 100% content-based
- Insert/reorder-proof
- Future-proof for all curriculum changes
- One-time reset (v2→v3), then stable forever

