# PHASE 5: Audio-Meaning Unified Distractor Engine

## ✅ Implementation Complete

### Changes Made

#### 1. Feature Flag Added
- **File**: `lib/flags.ts`
- **Flag**: `USE_LEARNED_VOCAB_IN_AUDIO_MEANING: true` (enabled for testing)
- **Purpose**: Gates the new unified distractor logic

#### 2. AudioMeaning.tsx Updated
- **File**: `app/components/games/AudioMeaning.tsx`
- **Changes**:
  - Added `learnedSoFar?: LearnedSoFar` prop
  - Updated shuffling logic in `useEffect` to check flag
  - When flag is ON:
    - Calls `WordBankService.generateWordBank()` with semantic distractor strategy
    - Filters by `learnedVocabIds` (when `USE_LEARNED_VOCAB_IN_WORDBANK` also ON)
    - Generates exactly 4 options (1 correct + 3 distractors)
    - Extracts vocabulary IDs and shuffles for display
  - When flag is OFF:
    - Uses old manual distractor logic (unchanged)
  - Added debug logging when `LOG_WORDBANK` is true

#### 3. LessonRunner.tsx Updated
- **File**: `app/components/LessonRunner.tsx`
- **Changes**:
  - Added `learnedSoFar={learnedCache[idx]}` prop to `AudioMeaning` component
  - Passes pre-computed learned vocabulary state to enable filtering

### Backward Compatibility

✅ **With flag OFF**: Behavior is 100% identical to old implementation
✅ **With flag ON**: Uses unified WordBankService with semantic distractors

### Safety Validations

1. ✅ Correct answer always present (ensured by WordBankService)
2. ✅ No crashes with tiny learned vocab (WordBankService has fallback logic)
3. ✅ Semantic distractors (uses `distractorStrategy: 'semantic'`)
4. ✅ Learned-vocab filtering (when both flags enabled)

### Testing Instructions

With both flags enabled:
- `USE_LEARNED_VOCAB_IN_WORDBANK: true`
- `USE_LEARNED_VOCAB_IN_AUDIO_MEANING: true`
- `LOG_WORDBANK: true`

Run Module 1, Lesson 1 and check console for:

```
[AUDIO MEANING - UNIFIED WORDBANK] {
  stepType: 'audio-meaning',
  learnedVocabIds: [...],
  learnedVocabCount: X,
  vocabularyBankSize: Y,
  usingUnifiedWordBank: true
}

[WORDBANK INPUT] {
  expectedTranslation: undefined,
  vocabularyBankSize: Y,
  sequence: [correctVocabId],
  learnedVocabIdsCount: X
}

[WORDBANK LEARNED FILTER] or [WORDBANK LEARNED FILTER - FALLBACK]
```

### Expected Behavior

- **Early steps**: Small learned vocab, may see fallback to full bank
- **Later steps**: Larger learned vocab, filtering applied, semantic distractors
- **Distractors**: Should be from same semantic group as correct answer
- **Options**: Always exactly 4 (1 correct + 3 distractors)

### Comparison Mode

To compare old vs new behavior:
1. Set `USE_LEARNED_VOCAB_IN_AUDIO_MEANING: false`
2. Refresh and test same steps
3. Distractors will use old manual logic (from `props.distractors`)

## Next Steps

- Test with various lessons to validate distractor quality
- Monitor console logs for fallback frequency
- Adjust semantic groupings if needed in `lib/config/semantic-groups.ts`

