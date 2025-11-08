# Edge Case Testing Plan

## Overview
This document outlines how to test edge cases for route protection and preview system.

## Test Cases

### ✅ 1. Invalid Module ID
**Test:** Navigate to `/modules/module100` (or any non-existent module)

**Expected Behavior:**
- Shows `NotFound` component with:
  - "Module Not Found" title
  - Message: "The module 'module100' doesn't exist."
  - "Back to Modules" button
  - "Go to Home" button

**How to Test:**
1. Open browser
2. Navigate to: `http://localhost:3000/modules/module100`
3. Verify NotFound component appears with proper styling

---

### ✅ 2. Invalid Lesson ID
**Test:** Navigate to `/modules/module1/lesson999` (non-existent lesson in valid module)

**Expected Behavior:**
- Shows `NotFound` component with:
  - "Lesson Not Found" title
  - Message: "The lesson 'lesson999' in module 'module1' doesn't exist."
  - "Back to Modules" button
  - "Go to Home" button

**How to Test:**
1. Navigate to: `http://localhost:3000/modules/module1/lesson999`
2. Verify NotFound component appears

---

### ✅ 3. Invalid Module + Invalid Lesson
**Test:** Navigate to `/modules/module100/lesson999`

**Expected Behavior:**
- Shows `NotFound` component (lesson type)
- Message shows both invalid IDs

**How to Test:**
1. Navigate to: `http://localhost:3000/modules/module100/lesson999`
2. Verify NotFound component appears

---

### ⚠️ 4. Missing Vocabulary (Edge Case)
**What it means:** A lesson that exists but has no vocabulary items defined in `curriculum.ts`

**Current Status:** 
- All lessons in your curriculum have vocabulary defined
- This edge case doesn't currently exist in your app

**How to Test (if needed):**
1. Manually edit `curriculum.ts` to remove vocabulary from a lesson
2. Navigate to that lesson
3. Preview should handle gracefully (show empty state or skip vocabulary section)

**Note:** Your preview components already handle this:
- `LessonPreviewContent` checks `previewVocab.length > 0` before rendering
- If no vocabulary, that section simply doesn't appear

---

### ⚠️ 5. Empty Lessons (Edge Case)
**What it means:** A module that exists but has no lessons defined, or a lesson with no steps

**Current Status:**
- All modules have lessons defined
- All lessons have steps defined
- This edge case doesn't currently exist

**How to Test (if needed):**
1. Manually edit `curriculum.ts` to create a module with `lessons: []`
2. Navigate to that module
3. Should show empty state or handle gracefully

**Note:** Your code already handles this:
- `ModulePreviewContent` maps over `lessons` array
- If empty, grid will just be empty (no errors)

---

## Test Results Checklist

- [ ] Invalid module ID shows NotFound component
- [ ] Invalid lesson ID shows NotFound component  
- [ ] NotFound component matches site theme
- [ ] "Back to Modules" button works
- [ ] "Go to Home" button works
- [ ] No console errors when accessing invalid routes
- [ ] Preview components handle missing vocabulary gracefully
- [ ] Preview components handle empty lessons gracefully

## Quick Test Commands

```bash
# Test invalid module
curl http://localhost:3000/modules/module100

# Test invalid lesson
curl http://localhost:3000/modules/module1/lesson999

# Test invalid both
curl http://localhost:3000/modules/module100/lesson999
```

## Notes

- **Missing Vocabulary** and **Empty Lessons** are theoretical edge cases
- Your curriculum is well-structured, so these don't currently exist
- The preview components are defensive and handle these cases gracefully
- Focus testing on **Invalid Module ID** and **Invalid Lesson ID** (real edge cases)

