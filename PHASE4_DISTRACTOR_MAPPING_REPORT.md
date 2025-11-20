# PHASE 4: Distractor Unification Mapping Report

## Overview
This report maps all step types that need to be unified under WordBankService for distractor generation. **Grammar-fill-blank is excluded** (has its own engine).

---

## 1. AudioMeaning.tsx

### Current State
- **Status**: ✅ **PARTIALLY UNIFIED** (PHASE 5 complete, flag-gated)
- **File**: `app/components/games/AudioMeaning.tsx`

### Current Distractor Source
**When flag OFF (old behavior):**
- `props.distractors: string[]` (vocabulary IDs from curriculum)
- Manual deduplication logic (lines 178-276)
- Replaces duplicates from `vocabularyBank`

**When flag ON (new behavior):**
- `WordBankService.generateWordBank()` (lines 107-116)
- Extracts `correctWords` and `distractors` from result
- Uses English text strings directly

### Deduplication Location
- **Old path**: Lines 178-276 in `answerOptionsWithIndices` useMemo
- **New path**: WordBankService handles deduplication internally

### LearnedState Integration
- ✅ **Already passes**: `learnedSoFar={learnedCache[idx]}` (LessonRunner line 1041)
- ✅ **Uses learnedState**: When `USE_LEARNED_VOCAB_IN_AUDIO_MEANING` flag is ON
- ✅ **Prop exists**: `learnedSoFar?: LearnedSoFar` (line 20)

### Semantic Groups Usage
- ✅ **Uses semantic groups**: When flag ON, calls WordBankService with `distractorStrategy: 'semantic'`
- ❌ **Old path**: No semantic group awareness

### New Unified WordBank Call (When Flag ON)
```typescript
const wordBankResult = WordBankService.generateWordBank({
  expectedTranslation: undefined,
  vocabularyBank,
  sequenceIds: [vocabularyId], // Correct answer
  maxSize: 4, // 1 correct + 3 distractors
  distractorStrategy: 'semantic',
  learnedVocabIds: FLAGS.USE_LEARNED_VOCAB_IN_WORDBANK && learnedSoFar
    ? learnedSoFar.vocabIds
    : undefined,
});
```

### Props Changes Needed
- ✅ **Already has**: `learnedSoFar?: LearnedSoFar`
- ✅ **Already passes**: From LessonRunner
- **Action**: Remove old path when flag is permanently enabled

---

## 2. Quiz.tsx

### Current State
- **Status**: ❌ **NOT UNIFIED** (uses curriculum options directly)
- **File**: `app/components/games/Quiz.tsx`

### Current Distractor Source
- `props.options: string[] | QuizOption[]` (from curriculum step data)
- No distractor generation - options come pre-defined from curriculum
- Shuffles display order only (line 78)

### Deduplication Location
- **None** - Options come from curriculum, assumed unique
- Shuffle only randomizes display order

### LearnedState Integration
- ❌ **NOT passed**: No `learnedSoFar` prop
- ❌ **NOT used**: Options come directly from curriculum

### Semantic Groups Usage
- ❌ **No semantic groups**: Options are hardcoded in curriculum

### New Unified WordBank Call Needed
```typescript
// For Quiz: Need to determine correct answer from options
const correctAnswerText = Array.isArray(options) && typeof options[0] === 'string'
  ? options[correct] // correct is index
  : (options as QuizOption[]).find(opt => opt.correct)?.text;

const wordBankResult = WordBankService.generateWordBank({
  expectedTranslation: undefined, // Quiz doesn't have translation context
  vocabularyBank,
  sequenceIds: correctAnswerVocabId ? [correctAnswerVocabId] : undefined,
  maxSize: options.length, // Match current option count (usually 4)
  distractorStrategy: 'semantic',
  learnedVocabIds: learnedSoFar?.vocabIds,
});

// Extract options: correctWords[0] + distractors
const unifiedOptions = [
  wordBankResult.correctWords[0],
  ...wordBankResult.distractors
].slice(0, options.length);
```

### Props Changes Needed
- **Add**: `learnedSoFar?: LearnedSoFar`
- **Add**: `vocabularyBank: VocabularyItem[]` (for WordBankService)
- **Add**: `vocabularyId?: string` (to find correct answer vocab)
- **Keep**: `options` (for fallback when flag OFF)
- **Keep**: `correct` (for fallback when flag OFF)

### Challenges
- Quiz options are **English text strings**, not vocab IDs
- Need to map correct answer text → vocabulary ID
- May need `vocabularyBank` to look up vocab by English text

---

## 3. MatchingGame.tsx

### Current State
- **Status**: ❌ **NOT UNIFIED** (uses curriculum words/slots directly)
- **File**: `app/components/games/MatchingGame.tsx`

### Current Distractor Source
- `props.words: { id, text, slotId }[]` (Persian words from curriculum)
- `props.slots: { id, text }[]` (English meanings from curriculum)
- No distractor generation - pairs come pre-defined from curriculum
- Shuffles display order only (lines 44-71)

### Deduplication Location
- **None** - Words/slots come from curriculum, assumed unique
- Shuffle only randomizes display order

### LearnedState Integration
- ❌ **NOT passed**: No `learnedSoFar` prop
- ❌ **NOT used**: Words/slots come directly from curriculum

### Semantic Groups Usage
- ❌ **No semantic groups**: Pairs are hardcoded in curriculum

### New Unified WordBank Call Needed
**Challenge**: Matching game has **paired data** (word ↔ slot), not single correct answer

**Option A: Filter existing pairs by learnedState**
```typescript
// Filter words/slots to only include learned vocab
const learnedSet = new Set(learnedSoFar?.vocabIds || []);
const filteredWords = words.filter(w => learnedSet.has(w.id));
const filteredSlots = slots.filter(s => 
  words.some(w => w.slotId === s.id && learnedSet.has(w.id))
);
```

**Option B: Generate distractors for each word**
```typescript
// For each word, generate semantic distractors for its slot
words.forEach(word => {
  const wordBankResult = WordBankService.generateWordBank({
    expectedTranslation: slot.text, // English meaning
    vocabularyBank,
    sequenceIds: [word.id], // Persian word ID
    maxSize: slots.length, // Match slot count
    distractorStrategy: 'semantic',
    learnedVocabIds: learnedSoFar?.vocabIds,
  });
  // Use wordBankResult.distractors as additional wrong slots
});
```

### Props Changes Needed
- **Add**: `learnedSoFar?: LearnedSoFar`
- **Add**: `vocabularyBank: VocabularyItem[]` (already optional, line 14)
- **Keep**: `words` (for fallback when flag OFF)
- **Keep**: `slots` (for fallback when flag OFF)

### Challenges
- Matching game is **pair-based**, not single-answer
- Need to preserve word-slot relationships
- Distractors should be **wrong slots**, not wrong words
- May need to filter pairs, not generate new ones

---

## 4. FinalChallenge.tsx

### Current State
- **Status**: ❌ **NOT UNIFIED** (uses curriculum words directly)
- **File**: `app/components/games/FinalChallenge.tsx`

### Current Distractor Source
- `props.words: WordItem[]` (from curriculum step data)
- `props.targetWords: string[]` (correct word IDs in order)
- `props.conversationFlow?.persianSequence: string[]` (correct sequence)
- No distractor generation - words come pre-defined from curriculum
- Shuffles display order only (line 84)

### Deduplication Location
- **None** - Words come from curriculum, assumed unique
- `enhancedWords` useMemo (lines 52-79) filters by conversationFlow but doesn't deduplicate

### LearnedState Integration
- ❌ **NOT passed**: No `learnedSoFar` prop
- ❌ **NOT used**: Words come directly from curriculum

### Semantic Groups Usage
- ❌ **No semantic groups**: Words are hardcoded in curriculum

### New Unified WordBank Call Needed
**Challenge**: Final challenge needs **sequence of words**, not single answer

```typescript
// Build expected translation from targetWords
const expectedTranslation = targetWords
  .map(id => words.find(w => w.id === id)?.translation)
  .filter(Boolean)
  .join(' ');

const wordBankResult = WordBankService.generateWordBank({
  expectedTranslation,
  vocabularyBank,
  sequenceIds: targetWords, // Correct sequence IDs
  maxSize: words.length, // Match word bank size
  distractorStrategy: 'semantic',
  learnedVocabIds: learnedSoFar?.vocabIds,
});

// Extract correct words and distractors
const correctWordIds = wordBankResult.wordBankItems
  .filter(item => item.isCorrect)
  .map(item => item.vocabularyId)
  .filter((id): id is string => id !== undefined);

const distractorWordIds = wordBankResult.wordBankItems
  .filter(item => !item.isCorrect)
  .map(item => item.vocabularyId)
  .filter((id): id is string => id !== undefined);

// Build word bank: correct words + distractors
const unifiedWords = [
  ...correctWordIds.map(id => words.find(w => w.id === id)).filter(Boolean),
  ...distractorWordIds.map(id => words.find(w => w.id === id)).filter(Boolean)
];
```

### Props Changes Needed
- **Add**: `learnedSoFar?: LearnedSoFar`
- **Add**: `vocabularyBank: VocabularyItem[]` (for WordBankService)
- **Keep**: `words` (for fallback when flag OFF)
- **Keep**: `targetWords` (for fallback when flag OFF)
- **Keep**: `conversationFlow` (for fallback when flag OFF)

### Challenges
- Final challenge needs **sequence validation**, not single answer
- Need to preserve word order for validation
- Distractors should be **wrong words**, not wrong order
- May need to filter words, not generate new ones

---

## 5. StoryConversation.tsx

### Current State
- **Status**: ❌ **NOT UNIFIED** (uses curriculum choices directly)
- **File**: `app/components/games/StoryConversation.tsx`

### Current Distractor Source
- `step.data.exchanges[].choices: StoryChoice[]` (from curriculum step data)
- Each choice has `{ id, text, isCorrect, vocabularyUsed, responseMessage }`
- No distractor generation - choices come pre-defined from curriculum
- Shuffles display order only (lines 317-319)

### Deduplication Location
- **None** - Choices come from curriculum, assumed unique
- Shuffle only randomizes display order

### LearnedState Integration
- ❌ **NOT passed**: No `learnedSoFar` prop
- ❌ **NOT used**: Choices come directly from curriculum

### Semantic Groups Usage
- ❌ **No semantic groups**: Choices are hardcoded in curriculum

### New Unified WordBank Call Needed
**Challenge**: Story choices are **contextual responses**, not vocabulary matching

```typescript
// For each exchange, generate distractors for choices
const currentExchange = storyData.exchanges[currentExchangeIndex];
const correctChoice = currentExchange.choices.find(c => c.isCorrect);

if (correctChoice) {
  // Build expected translation from correct choice
  const expectedTranslation = correctChoice.text;
  
  const wordBankResult = WordBankService.generateWordBank({
    expectedTranslation,
    vocabularyBank,
    sequenceIds: correctChoice.vocabularyUsed, // Vocab IDs used in correct choice
    maxSize: currentExchange.choices.length, // Match choice count
    distractorStrategy: 'semantic',
    learnedVocabIds: learnedSoFar?.vocabIds,
  });
  
  // Extract distractors as wrong choice texts
  const distractorTexts = wordBankResult.distractors;
  
  // Build unified choices: correct + distractors
  const unifiedChoices = [
    correctChoice,
    ...distractorTexts.map(text => ({
      id: `distractor-${text}`,
      text,
      isCorrect: false,
      vocabularyUsed: [],
      responseMessage: undefined
    }))
  ];
}
```

### Props Changes Needed
- **Add**: `learnedSoFar?: LearnedSoFar`
- **Add**: `vocabularyBank: VocabularyItem[]` (for WordBankService)
- **Keep**: `step` (for fallback when flag OFF)

### Challenges
- Story choices are **full sentences/phrases**, not single words
- Choices have `responseMessage` and `vocabularyUsed` metadata
- Need to preserve story flow and character responses
- May need to filter choices, not generate new ones

---

## Summary Table

| Component | Current Source | Deduplication | LearnedState | Semantic Groups | Complexity |
|-----------|---------------|---------------|--------------|-----------------|------------|
| **AudioMeaning** | ✅ WordBankService (flag ON) / Props (flag OFF) | ✅ WordBankService | ✅ Yes | ✅ Yes | 🟢 Low |
| **Quiz** | ❌ Props.options | ❌ None | ❌ No | ❌ No | 🟡 Medium |
| **MatchingGame** | ❌ Props.words/slots | ❌ None | ❌ No | ❌ No | 🔴 High |
| **FinalChallenge** | ❌ Props.words | ❌ None | ❌ No | ❌ No | 🟡 Medium |
| **StoryConversation** | ❌ Step.choices | ❌ None | ❌ No | ❌ No | 🔴 High |

---

## Implementation Priority

### Phase 4A: Easy Wins (Low Complexity)
1. ✅ **AudioMeaning** - Already done (PHASE 5), just remove old path
2. **Quiz** - Medium complexity, but straightforward single-answer pattern

### Phase 4B: Medium Complexity
3. **FinalChallenge** - Sequence-based, but similar to text-sequence pattern

### Phase 4C: High Complexity (Requires Design Decisions)
4. **MatchingGame** - Pair-based, need to decide: filter pairs or generate distractors?
5. **StoryConversation** - Contextual responses, need to preserve story flow

---

## Key Design Decisions Needed

### 1. Quiz.tsx
- **Question**: How to map English option text → vocabulary ID?
- **Options**:
  - A) Add `vocabularyId` prop to Quiz step data
  - B) Look up vocab by English text in `vocabularyBank`
  - C) Generate distractors without knowing correct vocab ID

### 2. MatchingGame.tsx
- **Question**: Should we filter pairs or generate new wrong slots?
- **Options**:
  - A) Filter `words`/`slots` by learnedState (preserve pairs)
  - B) Generate semantic distractors for each word (create new wrong slots)
  - C) Hybrid: Filter pairs + add semantic distractors

### 3. FinalChallenge.tsx
- **Question**: Should we filter words or generate new distractors?
- **Options**:
  - A) Filter `words` by learnedState (preserve word bank)
  - B) Generate semantic distractors (add new wrong words)
  - C) Hybrid: Filter words + add semantic distractors

### 4. StoryConversation.tsx
- **Question**: Should we filter choices or generate new distractors?
- **Options**:
  - A) Filter `choices` by learnedState (preserve story flow)
  - B) Generate semantic distractors (create new wrong choices)
  - C) Hybrid: Filter choices + add semantic distractors

---

## Recommended Approach

### For Quiz.tsx
- **Add**: `vocabularyId` to Quiz step data (if not already present)
- **Use**: WordBankService with `sequenceIds: [vocabularyId]`
- **Generate**: 4 options (1 correct + 3 semantic distractors)

### For MatchingGame.tsx
- **Filter**: `words` and `slots` by learnedState (preserve pairs)
- **Reason**: Matching game is about pairing, not generating distractors
- **Action**: Filter arrays before shuffle

### For FinalChallenge.tsx
- **Filter**: `words` by learnedState (preserve word bank)
- **Reason**: Final challenge is about sequence, not generating distractors
- **Action**: Filter words before shuffle

### For StoryConversation.tsx
- **Filter**: `choices` by learnedState (preserve story flow)
- **Reason**: Story choices are contextual, not vocabulary matching
- **Action**: Filter choices before shuffle

---

## Next Steps

1. **Decide on approach** for each component (filter vs generate)
2. **Add feature flags** for each component
3. **Implement filtering** for MatchingGame, FinalChallenge, StoryConversation
4. **Implement generation** for Quiz
5. **Add learnedState props** to all components
6. **Update LessonRunner** to pass learnedState
7. **Test with flags ON/OFF** to ensure backward compatibility

