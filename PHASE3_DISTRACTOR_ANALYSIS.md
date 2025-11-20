# PHASE 3: Global Distractor Analysis

## Diagnostic Scan Results

| Step Type | File | Current Distractor Logic | Inputs | Problems | Should Centralize (Yes/No) |
|-----------|------|-------------------------|--------|----------|----------------------------|
| **audio-meaning** | `AudioMeaning.tsx` | **Manual deduplication + replacement**<br/>- Receives `distractors: string[]` prop<br/>- Combines with `vocabularyId` → shuffles<br/>- Deduplicates by normalized English text<br/>- Replaces duplicates from `vocabularyBank`<br/>- Ensures exactly 4 options | `vocabularyId` (correct answer)<br/>`distractors: string[]` (vocab IDs)<br/>`vocabularyBank: VocabularyItem[]`<br/>Uses `WordBankService.normalizeVocabEnglish()` | ❌ **Hardcoded logic**<br/>❌ **No learnedState filtering**<br/>❌ **Duplicate replacement logic scattered**<br/>❌ **No semantic group awareness**<br/>❌ **Inconsistent with other step types** | **YES** |
| **audio-sequence** | `AudioSequence.tsx` | **Centralized via WordBankService**<br/>- Calls `WordBankService.generateWordBank()`<br/>- Uses `distractorStrategy: 'semantic'`<br/>- Maps display keys to vocab IDs | `sequence: string[]` (vocab IDs)<br/>`expectedTranslation?: string`<br/>`vocabularyBank: VocabularyItem[]`<br/>`maxWordBankSize?: number` | ✅ **Already centralized**<br/>⚠️ **Doesn't use learnedState** (uses full vocabularyBank) | **PARTIAL**<br/>(Add learnedState filtering) |
| **final** | `FinalChallenge.tsx` | **No distractor generation**<br/>- Uses `words: WordItem[]` prop directly<br/>- Shuffles display order only<br/>- No filtering or generation | `words: WordItem[]` (from curriculum)<br/>`targetWords: string[]`<br/>`conversationFlow?: {...}` | ⚠️ **No learnedState filtering**<br/>⚠️ **Words come from curriculum, not filtered** | **YES**<br/>(Filter words by learnedState) |
| **grammar-fill-blank** | `GrammarFillBlank.tsx` | **Centralized via grammar-options.ts**<br/>- Calls `generateGrammarOptions()`<br/>- Passes `learnedSoFar` prop<br/>- Supports suffix/word/connector blanks | `exercises: {...}`<br/>`learnedSoFar: LearnedSoFar`<br/>`vocabularyBank: VocabularyItem[]` | ✅ **Already centralized**<br/>✅ **Uses learnedState**<br/>⚠️ **Still uses old `reviewVocabulary` param** | **PARTIAL**<br/>(Remove reviewVocabulary param) |
| **input** | `InputExercise.tsx` | **No distractors**<br/>- Single text input<br/>- No options or word bank | `question: string`<br/>`answer: string`<br/>`vocabularyId?: string` | N/A (no distractors) | **NO** |
| **matching** | `MatchingGame.tsx` | **No distractor generation**<br/>- Uses `words` and `slots` props directly<br/>- Shuffles display order only<br/>- No filtering or generation | `words: {id, text, slotId}[]`<br/>`slots: {id, text}[]`<br/>`vocabularyBank?: VocabularyItem[]` | ⚠️ **No learnedState filtering**<br/>⚠️ **Words/slots come from curriculum** | **YES**<br/>(Filter words/slots by learnedState) |
| **story-conversation** | `StoryConversation.tsx` | **No distractor generation**<br/>- Uses `choices` from step data<br/>- No filtering or generation | `step.data.choices: StoryChoice[]`<br/>`step.data.exchanges: StoryExchange[]` | ⚠️ **No learnedState filtering** | **YES**<br/>(Filter choices by learnedState) |
| **text-sequence** | `TextSequence.tsx` | **Centralized via WordBankService**<br/>- Calls `WordBankService.generateWordBank()`<br/>- Uses `distractorStrategy: 'semantic'`<br/>- Validates with semantic units | `finglishText: string`<br/>`expectedTranslation: string`<br/>`vocabularyBank: VocabularyItem[]`<br/>`maxWordBankSize?: number` | ✅ **Already centralized**<br/>⚠️ **Doesn't use learnedState** (uses full vocabularyBank) | **PARTIAL**<br/>(Add learnedState filtering) |
| **quiz** | `Quiz.tsx` | **No distractor generation**<br/>- Uses `options: string[]` prop directly<br/>- Shuffles display order only<br/>- No filtering or generation | `prompt: string`<br/>`options: string[]`<br/>`correct: number` | ⚠️ **No learnedState filtering**<br/>⚠️ **Options come from curriculum** | **YES**<br/>(Filter options by learnedState) |
| **reverse-quiz** | `Quiz.tsx` (same component) | **No distractor generation**<br/>- Uses `Quiz` component<br/>- Same as quiz above | `prompt: string`<br/>`options: string[]`<br/>`correct: number` | ⚠️ **No learnedState filtering**<br/>⚠️ **Options come from curriculum** | **YES**<br/>(Filter options by learnedState) |
| **word-bank-service** | `word-bank-service.ts` | **Centralized distractor engine**<br/>- `generateWordBank()` main function<br/>- `generateSemanticDistractors()`<br/>- `generateRandomDistractors()`<br/>- Filters by semantic groups<br/>- Removes redundant distractors | `expectedTranslation: string`<br/>`vocabularyBank: VocabularyItem[]`<br/>`sequenceIds?: string[]`<br/>`maxSize?: number`<br/>`distractorStrategy?: 'semantic' \| 'random'` | ⚠️ **Doesn't use learnedState**<br/>⚠️ **Uses full vocabularyBank**<br/>✅ **Semantic filtering works**<br/>✅ **Redundant distractor removal** | **YES**<br/>(Add learnedState parameter) |
| **grammar-options** | `grammar-options.ts` | **Centralized grammar distractor engine**<br/>- `generateGrammarOptions()` main function<br/>- Filters by `learnedSoFar.vocabIds`<br/>- Semantic group filtering<br/>- Suffix/connector/word support | `blankType: 'suffix' \| 'connector' \| 'word'`<br/>`correctAnswer: string`<br/>`lessonVocabulary: VocabularyItem[]`<br/>`reviewVocabulary?: string[]` (legacy)<br/>`customDistractors?: string[]`<br/>`config?: { learnedSoFar, expectedSemanticGroup }` | ✅ **Uses learnedState**<br/>⚠️ **Still accepts `reviewVocabulary` param** (legacy)<br/>⚠️ **Uses `lessonVocabulary` instead of learnedState vocab** | **PARTIAL**<br/>(Remove reviewVocabulary, use learnedState vocab only) |

## Summary

### ✅ Already Centralized (Partial)
- **audio-sequence**: Uses WordBankService (needs learnedState)
- **text-sequence**: Uses WordBankService (needs learnedState)
- **grammar-fill-blank**: Uses grammar-options.ts (needs cleanup)

### ❌ Needs Centralization
- **audio-meaning**: Manual deduplication logic scattered
- **final**: No filtering, uses curriculum words directly
- **matching**: No filtering, uses curriculum words/slots directly
- **quiz**: No filtering, uses curriculum options directly
- **reverse-quiz**: Same as quiz
- **story-conversation**: No filtering, uses curriculum choices directly

### 🔧 Central Services Need Enhancement
- **word-bank-service.ts**: Add `learnedState` parameter
- **grammar-options.ts**: Remove `reviewVocabulary` param, use learnedState vocab only

## Key Findings

1. **Inconsistent Input Sources**:
   - Some use `vocabularyBank` (full lesson vocab)
   - Some use `distractors: string[]` prop (hardcoded IDs)
   - Some use curriculum data directly (no filtering)

2. **No Learned State Awareness**:
   - Only `grammar-fill-blank` uses `learnedSoFar`
   - All others use full `vocabularyBank` or curriculum props
   - This causes future vocab to appear in earlier steps

3. **Duplicate Logic**:
   - `AudioMeaning.tsx` has manual deduplication
   - `WordBankService` has deduplication
   - `grammar-options.ts` has deduplication
   - Should be unified

4. **Semantic Group Usage**:
   - `WordBankService` uses semantic groups ✅
   - `grammar-options.ts` uses semantic groups ✅
   - `AudioMeaning.tsx` does NOT use semantic groups ❌

5. **Missing learnedState Integration**:
   - Only `grammar-fill-blank` passes `learnedSoFar`
   - All other step types need to filter by learnedState
   - `WordBankService` needs `learnedState` parameter

## Recommended Centralization Strategy

1. **Create unified distractor service** (`lib/services/distractor-service.ts`)
   - Accept `learnedState` parameter
   - Use semantic groups
   - Handle deduplication
   - Support all step types

2. **Update WordBankService**:
   - Add `learnedState?: LearnedSoFar` parameter
   - Filter `vocabularyBank` by `learnedState.vocabIds`

3. **Update grammar-options.ts**:
   - Remove `reviewVocabulary` parameter
   - Use `learnedState.vocabIds` only

4. **Refactor step components**:
   - `AudioMeaning.tsx` → Use distractor service
   - `Quiz.tsx` / `ReverseQuiz.tsx` → Filter options by learnedState
   - `MatchingGame.tsx` → Filter words/slots by learnedState
   - `FinalChallenge.tsx` → Filter words by learnedState
   - `StoryConversation.tsx` → Filter choices by learnedState

