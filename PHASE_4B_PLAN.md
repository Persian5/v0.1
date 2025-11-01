# Phase 4B: Dashboard Widgets

## 🎯 Goal
Add user-facing dashboard widgets that show progress and motivate learning.

## 📋 Tasks

### 1. Words Learned Counter
- **Location:** Dashboard (main page)
- **Data Source:** `vocabulary_performance` table
- **Logic:** Count distinct `vocabulary_id` where `total_attempts > 0`
- **Display:** "X words learned"

### 2. Hard Words Section
- **Location:** Dashboard widget
- **Data Source:** `VocabularyTrackingService.getWeakWords(userId, limit: 10)`
- **Logic:** Query words with lowest `mastery_level` or highest `total_incorrect / total_attempts`
- **Display:** List of 5-10 words with "Practice" button

### 3. Mastered Words Count
- **Location:** Dashboard widget
- **Data Source:** `VocabularyTrackingService.getMasteredWords(userId)`
- **Logic:** Count where `mastery_level >= 5` or `consecutive_correct >= 5`
- **Display:** "X words mastered"

### 4. Rename "Practice" → "Review Mode"
- **Location:** Dashboard button
- **Change:** Update text and route name
- **File:** `app/practice/page.tsx` → `app/review/page.tsx` (or keep same, just rename button)

## 🗂️ Files to Modify

### New Files:
- `app/components/dashboard/StatsWidget.tsx` - Main stats component
- `app/components/dashboard/HardWordsWidget.tsx` - Weak words list

### Modified Files:
- `app/page.tsx` - Add widgets to dashboard
- `app/practice/page.tsx` - Rename button/link

## 🔧 Implementation Order

1. **Create StatsWidget** (Words Learned + Mastered)
2. **Create HardWordsWidget** (Weak words list)
3. **Add to Dashboard** (Integrate widgets)
4. **Rename Practice** (Button text + route)

## ⏱️ Estimated Time: 2-3 hours

