# PHASE 4 — generateGrammarOptions MODIFICATION COMPLETE

**Status**: ✅ Implemented  
**Backward Compatibility**: ✅ 100% preserved  
**Curriculum Changes**: ❌ None (as required)  
**Gameplay Changes**: ❌ None (as required)

---

## FILE MODIFIED

### `lib/utils/grammar-options.ts`

**Lines Changed**: 18 lines modified + 6 lines added = 24 lines total

---

## CHANGES SUMMARY

### 1. New Interface: `LearnedSoFar` (Lines 25-32)

```typescript
export interface LearnedSoFar {
  vocabIds?: string[]
  suffixes?: string[]
  connectors?: string[]
}
```

**Purpose**: Type definition for optional learned-so-far parameter

---

### 2. Updated Function Signature (Lines 45-52)

**Before**:
```typescript
export function generateGrammarOptions(
  blankType: 'suffix' | 'connector' | 'word',
  correctAnswer: string,
  lessonVocabulary: VocabularyItem[],
  reviewVocabulary?: string[],
  customDistractors?: string[]
): GrammarOption[]
```

**After**:
```typescript
export function generateGrammarOptions(
  blankType: 'suffix' | 'connector' | 'word',
  correctAnswer: string,
  lessonVocabulary: VocabularyItem[],
  reviewVocabulary?: string[],
  customDistractors?: string[],
  learnedSoFar?: LearnedSoFar  // ← NEW: Optional parameter
): GrammarOption[]
```

**Backward Compatibility**: ✅ 100% preserved (parameter is optional)

---

### 3. Suffix Distractor Logic (Lines 65-78)

**Before**:
```typescript
// Suffix distractors: common suffixes
const commonSuffixes = ['am', 'i', 'e', 'et', 'esh', 'ye'];
for (const suffix of commonSuffixes) {
  if (suffix.toLowerCase() !== correctAnswer.toLowerCase() && options.length < 4) {
    options.push({
      id: `suffix-${suffix}`,
      text: `-${suffix}`
    });
  }
}
```

**After**:
```typescript
// PHASE 4: Use learned suffixes if provided, else fallback to hardcoded
const suffixPool = learnedSoFar?.suffixes && learnedSoFar.suffixes.length > 0
  ? learnedSoFar.suffixes                     // ← Use learned suffixes
  : ['am', 'i', 'e', 'et', 'esh', 'ye'];     // ← Fallback: hardcoded list

for (const suffix of suffixPool) {
  if (suffix.toLowerCase() !== correctAnswer.toLowerCase() && options.length < 4) {
    options.push({
      id: `suffix-${suffix}`,
      text: `-${suffix}`
    });
  }
}
```

**Logic**:
- ✅ If `learnedSoFar.suffixes` provided AND non-empty → use it
- ✅ Else → fallback to hardcoded list `['am', 'i', 'e', 'et', 'esh', 'ye']`
- ✅ Zero behavior change when `learnedSoFar` is absent

---

### 4. Connector Distractor Logic (Lines 79-92)

**Before**:
```typescript
// Connector distractors: other connectors
const connectors = ['vali', 'va', 'ham'];
for (const connector of connectors) {
  if (connector.toLowerCase() !== correctAnswer.toLowerCase() && options.length < 4) {
    options.push({
      id: `conn-${connector}`,
      text: connector
    });
  }
}
```

**After**:
```typescript
// PHASE 4: Use learned connectors if provided, else fallback to hardcoded
const connectorPool = learnedSoFar?.connectors && learnedSoFar.connectors.length > 0
  ? learnedSoFar.connectors                   // ← Use learned connectors
  : ['vali', 'va', 'ham'];                   // ← Fallback: hardcoded list

for (const connector of connectorPool) {
  if (connector.toLowerCase() !== correctAnswer.toLowerCase() && options.length < 4) {
    options.push({
      id: `conn-${connector}`,
      text: connector
    });
  }
}
```

**Logic**:
- ✅ If `learnedSoFar.connectors` provided AND non-empty → use it
- ✅ Else → fallback to hardcoded list `['vali', 'va', 'ham']`
- ✅ Zero behavior change when `learnedSoFar` is absent

---

### 5. Word Distractor Logic (Lines 93-167)

**Before**:
```typescript
// Filter out connectors and the correct answer
const connectorWords = ['vali', 'va', 'ham'];
const availableVocab = lessonVocabulary.filter(vocab => 
  !connectorWords.includes(vocab.id.toLowerCase()) &&
  vocab.id.toLowerCase() !== correctAnswer.toLowerCase() &&
  vocab.finglish.toLowerCase() !== correctAnswer.toLowerCase()
);
```

**After**:
```typescript
// Filter out connectors and the correct answer
const connectorWords = ['vali', 'va', 'ham'];
let availableVocab = lessonVocabulary.filter(vocab => 
  !connectorWords.includes(vocab.id.toLowerCase()) &&
  vocab.id.toLowerCase() !== correctAnswer.toLowerCase() &&
  vocab.finglish.toLowerCase() !== correctAnswer.toLowerCase()
);

// PHASE 4: If learnedSoFar provided, filter to only learned vocab IDs
if (learnedSoFar?.vocabIds && learnedSoFar.vocabIds.length > 0) {
  const learnedSet = new Set(learnedSoFar.vocabIds.map(id => id.toLowerCase()));
  availableVocab = availableVocab.filter(vocab => 
    learnedSet.has(vocab.id.toLowerCase())
  );
}
```

**Logic**:
- ✅ Start with full `lessonVocabulary` (minus connectors + correct answer)
- ✅ If `learnedSoFar.vocabIds` provided AND non-empty → filter to only those IDs
- ✅ Else → use full `lessonVocabulary` (existing behavior)
- ✅ Zero behavior change when `learnedSoFar` is absent

---

## BACKWARD COMPATIBILITY VERIFICATION

| Scenario | Before Phase 4 | After Phase 4 | Compatible? |
|----------|---------------|---------------|-------------|
| Called without `learnedSoFar` | Uses hardcoded suffixes | Uses hardcoded suffixes | ✅ Yes |
| Called without `learnedSoFar` | Uses hardcoded connectors | Uses hardcoded connectors | ✅ Yes |
| Called without `learnedSoFar` | Uses full lesson vocab | Uses full lesson vocab | ✅ Yes |
| Called with empty `learnedSoFar.suffixes` | N/A | Falls back to hardcoded | ✅ Yes |
| Called with empty `learnedSoFar.connectors` | N/A | Falls back to hardcoded | ✅ Yes |
| Called with empty `learnedSoFar.vocabIds` | N/A | Uses full lesson vocab | ✅ Yes |

**Result**: ✅ **100% backward compatible**

---

## WHAT WAS NOT CHANGED (AS REQUIRED)

- ❌ NO changes to `GrammarFillBlank.tsx` (Phase 5)
- ❌ NO changes to `LessonRunner.tsx` (Phase 5)
- ❌ NO changes to `curriculum.ts` (Phase 5)
- ❌ NO changes to any other components
- ❌ NO gameplay behavior changes
- ❌ NO grammar tracking changes

---

## HOW IT WORKS (EXAMPLE)

### Example 1: Suffix blank WITHOUT learnedSoFar (existing behavior)
```typescript
generateGrammarOptions('suffix', 'am', vocabulary)
// Returns: [{ id: 'suffix-am', text: '-am' }, { id: 'suffix-i', text: '-i' }, ...]
// Uses hardcoded: ['am', 'i', 'e', 'et', 'esh', 'ye']
```

### Example 2: Suffix blank WITH learnedSoFar (new behavior, Phase 5)
```typescript
generateGrammarOptions('suffix', 'am', vocabulary, undefined, undefined, {
  suffixes: ['am', 'i']  // Only learned suffixes
})
// Returns: [{ id: 'suffix-am', text: '-am' }, { id: 'suffix-i', text: '-i' }]
// Uses learned: ['am', 'i'] only
```

### Example 3: Word blank WITHOUT learnedSoFar (existing behavior)
```typescript
generateGrammarOptions('word', 'salam', vocabulary)
// Returns: [{ id: 'word-salam', text: 'Salam' }, { id: 'word-khodafez', text: 'Khodafez' }, ...]
// Uses ALL lesson vocabulary
```

### Example 4: Word blank WITH learnedSoFar (new behavior, Phase 5)
```typescript
generateGrammarOptions('word', 'salam', vocabulary, undefined, undefined, {
  vocabIds: ['salam', 'khodafez']  // Only learned vocab
})
// Returns: [{ id: 'word-salam', text: 'Salam' }, { id: 'word-khodafez', text: 'Khodafez' }]
// Uses ONLY learned vocab: ['salam', 'khodafez']
```

---

## DIFFS

**Modified**: `lib/utils/grammar-options.ts`
- Added: 6 lines (interface + parameter)
- Modified: 18 lines (suffix/connector/word logic)
- Total: 24 lines changed

**Created**: `PHASE_4_GENERATOR_MODIFICATION.md` (this file)

**Linter**: ✅ No errors

---

## TESTING NOTES

**What to test**:
1. ✅ Existing grammar steps still work (no `learnedSoFar` passed)
2. ✅ Options still generated correctly
3. ✅ Hardcoded suffixes/connectors still used
4. ✅ Full lesson vocab still used

**What NOT to test yet** (Phase 5):
- ❌ Passing `learnedSoFar` to the function (not wired up yet)
- ❌ Filtered distractors (not active yet)
- ❌ Dynamic option generation (not triggered yet)

---

## NEXT STEPS (PHASE 5)

**NOT YET IMPLEMENTED** (awaiting approval):
- Wire `learnedSoFar` from `GrammarFillBlank` to `generateGrammarOptions`
- Update curriculum steps that use `generateGrammarOptions` to pass `learnedSoFar`
- Test learned filtering in action
- Verify no empty word banks

**Estimated**: Small, surgical changes to activate the system

---

## PHASE 4 COMPLETE

**Status**: Ready for approval  
**Awaiting**: User confirmation to proceed to Phase 5

