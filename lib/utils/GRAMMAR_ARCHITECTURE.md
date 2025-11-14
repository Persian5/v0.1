# Grammar System Architecture & Requirements

**Last Updated**: Phase 5 Complete  
**Purpose**: Guide for adding new grammar modes/types and understanding the system

---

## 📋 SYSTEM OVERVIEW

The grammar system uses a **3-step sequence**:
1. **grammar-intro** - Explains the concept
2. **grammar-fill-blank** - Practice with fill-in-the-blank exercises
3. *(grammar-transformation removed)*

---

## 🏗️ CORE ARCHITECTURE

### File Structure

```
lib/types.ts                          # Type definitions (MUST update for new modes)
lib/config/curriculum.ts              # Curriculum content (MUST update for new steps)
lib/utils/grammar-options.ts          # Option generator (MUST update for new blank types)
lib/utils/curriculum-lexicon.ts       # Caching layer (MAY need update for new grammar types)
app/components/games/GrammarFillBlank.tsx  # Main component (MAY need update for new modes)
app/components/LessonRunner.tsx       # Step router (MUST update for new step types)
lib/utils/step-uid.ts                 # UID generator (MUST update for new step types)
```

---

## ➕ ADDING A NEW GRAMMAR MODE/BLANK TYPE

### Example: Adding "prefix" blank type

#### 1. **Update Types** (`lib/types.ts`)

```typescript
// In GrammarFillBlankStep['data']['exercises'][0]['blanks'][0]
type: 'suffix' | 'word' | 'connector' | 'prefix'  // ← ADD 'prefix'

// In generateGrammarOptions function signature
blankType: 'suffix' | 'connector' | 'word' | 'prefix'  // ← ADD 'prefix'
```

**Required**: Update ALL type definitions that reference blank types.

---

#### 2. **Update Option Generator** (`lib/utils/grammar-options.ts`)

Add handling in `generateGrammarOptions()`:

```typescript
// After line 158 (connector section), add:
} else if (blankType === 'prefix') {
  // NEW MODE: Prefix blank logic
  const prefixPool = learnedSoFar?.prefixes && learnedSoFar.prefixes.length > 0
    ? learnedSoFar.prefixes
    : ['na-', 'be-', 'mi-']; // Fallback: hardcoded list
  
  for (const prefix of prefixPool) {
    if (prefix.toLowerCase() !== correctAnswer.toLowerCase() && options.length < 4) {
      options.push({
        id: `prefix-${prefix}`,
        text: prefix  // e.g., "na-"
      });
    }
  }
} else {
```

**Required**:
- Add `prefixes?: string[]` to `LearnedSoFar` interface
- Add prefix pool logic
- Add prefix to `prefix` variable (line 83)
- Update display text logic if needed

---

#### 3. **Update Component** (`app/components/games/GrammarFillBlank.tsx`)

Add detection logic:

```typescript
// After line 95, add:
const isCurrentBlankPrefix = currentBlank?.type === 'prefix'

// After line 102, add:
const isPrefixBased = (hasMultipleBlanks && isCurrentBlankPrefix) || 
                      (!hasMultipleBlanks && currentExercise.prefixOptions && currentExercise.prefixOptions.length > 0)

// In handleSelectOption (line 381), add:
if (blankBeingAnswered?.type === 'prefix' || isPrefixBased) {
  selectedText = selectedOption.text  // Prefixes don't need dash removal
}
```

**Required**:
- Add prefix detection
- Add text extraction logic (if different from words)
- Update option filtering if needed

---

#### 4. **Update Caching** (`lib/utils/curriculum-lexicon.ts`)

If prefixes are introduced in grammar steps:

```typescript
// In buildCurriculumLexicon(), add:
prefixIntroductions: {
  [moduleId: string]: {
    [lessonId: string]: {
      [stepIndex: number]: string[]
    }
  }
}

// In buildLearnedCache(), add:
currentPrefixes: string[]
// And track prefix introductions
```

**Required**: Only if prefixes are introduced via grammar steps (not vocabulary).

---

#### 5. **Update Step UID** (`lib/utils/step-uid.ts`)

Add to step type union:

```typescript
// In deriveStepUid(), add case:
case 'grammar-fill-blank':
  // Already handles all blank types, no change needed
```

**Required**: Usually no change needed (grammar-fill-blank handles all blank types).

---

#### 6. **Update LessonRunner** (`app/components/LessonRunner.tsx`)

Usually no change needed - `GrammarFillBlank` handles all blank types dynamically.

**Required**: Only if you add a completely new step type (not just a new blank type).

---

#### 7. **Update Curriculum** (`lib/config/curriculum.ts`)

Add new grammar step:

```typescript
{
  type: "grammar-fill-blank",
  points: 1,
  data: {
    conceptId: "prefix-na",
    label: "FILL IN THE PREFIX",
    exercises: [
      {
        sentence: "___merci",
        translation: "No thank you",
        blanks: [
          {
            index: 0,
            type: "prefix",  // ← NEW TYPE
            correctAnswer: "na"
          }
        ]
      }
    ]
  }
}
```

**Required**: Add grammar step with new blank type.

---

## 🔧 ADDING A NEW GRAMMAR STEP TYPE (Not Blank Type)

### Example: Adding "grammar-multiple-choice"

#### 1. **Update Types** (`lib/types.ts`)

```typescript
export interface GrammarMultipleChoiceStep extends BaseStep {
  type: 'grammar-multiple-choice';
  data: {
    conceptId: string;
    question: string;
    options: Array<{ id: string; text: string; correct: boolean }>;
    // ... other fields
  };
}

// Add to union:
export type LessonStep = 
  | WelcomeStep
  | FlashcardStep
  | GrammarFillBlankStep
  | GrammarMultipleChoiceStep  // ← ADD
  | ...
```

---

#### 2. **Create Component** (`app/components/games/GrammarMultipleChoice.tsx`)

Create new component following `GrammarFillBlank.tsx` pattern:

```typescript
export interface GrammarMultipleChoiceProps {
  question: string;
  options: Array<{ id: string; text: string; correct: boolean }>;
  conceptId?: string;
  moduleId?: string;
  lessonId?: string;
  stepIndex?: number;
  learnedSoFar?: LearnedSoFar;  // ← Use same learnedSoFar structure
  onComplete: (correct: boolean) => void;
  // ...
}
```

**Required**:
- Accept `learnedSoFar` prop (for future filtering)
- Accept `moduleId`, `lessonId`, `stepIndex` (for tracking)
- Call `GrammarTrackingService.logGrammarAttempt()` on answer
- Use `deriveStepUid()` for XP idempotency

---

#### 3. **Update LessonRunner** (`app/components/LessonRunner.tsx`)

Add rendering case:

```typescript
// After GrammarFillBlank case, add:
) : step.type === 'grammar-multiple-choice' ? (
  <GrammarMultipleChoice
    question={(step as GrammarMultipleChoiceStep).data.question}
    options={(step as GrammarMultipleChoiceStep).data.options}
    conceptId={(step as GrammarMultipleChoiceStep).data.conceptId}
    moduleId={moduleId}
    lessonId={lessonId}
    stepIndex={idx}
    learnedSoFar={learnedCache[idx]}  // ← Pass learned cache
    onComplete={handleItemComplete}
    onXpStart={createStepXpHandler()}
  />
```

**Required**:
- Import component
- Add rendering case
- Pass `learnedSoFar` from `learnedCache[idx]`
- Pass tracking props (`moduleId`, `lessonId`, `stepIndex`)

---

#### 4. **Update Step UID** (`lib/utils/step-uid.ts`)

Add case:

```typescript
case 'grammar-multiple-choice':
  return deriveContentBasedUid(step, stepIndex, moduleId, lessonId);
```

**Required**: Add case for new step type.

---

#### 5. **Update Caching** (`lib/utils/curriculum-lexicon.ts`)

Usually no change needed unless new step type introduces vocabulary/suffixes/connectors.

**Required**: Only if step introduces new vocab/suffixes/connectors.

---

## 📝 LEARNED-SO-FAR REQUIREMENTS

### What Gets Tracked

1. **Vocabulary IDs** (`vocabIds: string[]`)
   - All vocab from previous modules + lessons + current lesson
   - Vocab introduced by steps up to current step
   - **Source**: `buildLearnedCache()` in `curriculum-lexicon.ts`

2. **Suffixes** (`suffixes: string[]`)
   - Only suffixes explicitly taught in grammar steps
   - **Source**: `suffixIntroductions` map in lexicon
   - **NOT inferred** from vocabulary words

3. **Connectors** (`connectors: string[]`)
   - Connectors from lesson vocabulary OR grammar steps
   - **Source**: `connectorIntroductions` map in lexicon

### How It Works

```typescript
// In LessonRunner.tsx:
const learnedCache = buildLearnedCache(moduleId, lessonId, steps, curriculumLexicon)

// learnedCache[stepIndex] = {
//   vocabIds: ['salam', 'khodafez', 'man', ...],  // All learned so far
//   suffixes: ['am', 'i', 'e'],                    // Only grammar-taught
//   connectors: ['va', 'ham']                      // From vocab or grammar
// }

// Pass to component:
<GrammarFillBlank
  learnedSoFar={learnedCache[idx]}  // ← Pre-computed for this step
  // ...
/>
```

**Required**: Always pass `learnedCache[stepIndex]` to grammar components.

---

## 🎯 SEMANTIC GROUP FILTERING

### When to Use

- **Word blanks only** (not suffix/connector)
- When you want semantically coherent distractors
- Example: Pronoun blank → only show pronouns

### How to Add

#### Option 1: Explicit in Curriculum

```typescript
{
  index: 1,
  type: "word",
  correctAnswer: "shoma",
  expectedSemanticGroup: "pronouns"  // ← Explicit
}
```

#### Option 2: Auto-Detection (Currently Disabled)

Auto-detection was disabled to prevent single-option banks. To re-enable:

```typescript
// In GrammarFillBlank.tsx, line 132:
if (!finalSemanticGroup && blankType === 'word') {
  const correctVocab = lessonVocabulary.find(v =>
    v.id.toLowerCase() === correctAnswer.toLowerCase() ||
    v.finglish?.toLowerCase() === correctAnswer.toLowerCase()
  )
  
  const group = correctVocab?.semanticGroup
  if (group) {
    const groupMembers = lessonVocabulary.filter(v => v.semanticGroup === group)
    if (groupMembers.length >= 4) {  // ← Threshold: 4+ members
      finalSemanticGroup = group
    }
  }
}
```

**Required**: 
- Add `expectedSemanticGroup` to blank/exercise in curriculum
- Ensure semantic group exists in `semantic-groups.ts`
- Ensure threshold ≥3 matches (for 4+ total options)

---

## 🔄 OPTION GENERATION FLOW

### For Word Blanks

```
1. Start with ALL lessonVocabulary (from learnedSoFar.vocabIds)
   ↓
2. Filter out connectors (va, ham, vali)
   ↓
3. Filter out correct answer
   ↓
4. Filter by learnedSoFar.vocabIds (if provided)
   ↓
5. Filter by semantic group (if expectedSemanticGroup provided AND ≥3 matches)
   ↓
6. Select 3 distractors (random from remaining)
   ↓
7. Add correct answer → 4 total options
   ↓
8. Shuffle (word blanks only)
```

### For Suffix Blanks

```
1. Use learnedSoFar.suffixes (if provided) OR hardcoded list
   ↓
2. Filter out correct answer
   ↓
3. Select up to 3 distractors
   ↓
4. Add correct answer → 4 total options
   ↓
5. NO shuffle (suffix blanks stay in order)
```

### For Connector Blanks

```
1. Use learnedSoFar.connectors (if provided) OR hardcoded list
   ↓
2. Filter out correct answer
   ↓
3. Select up to 3 distractors
   ↓
4. Add correct answer → 4 total options
   ↓
5. NO shuffle (connector blanks stay in order)
```

---

## ✅ CHECKLIST: Adding New Grammar Mode

- [ ] **Types** (`lib/types.ts`)
  - [ ] Add blank type to union (if new blank type)
  - [ ] Add step type to union (if new step type)
  - [ ] Add step interface (if new step type)

- [ ] **Option Generator** (`lib/utils/grammar-options.ts`)
  - [ ] Add blank type handling
  - [ ] Add to `LearnedSoFar` interface (if needed)
  - [ ] Add prefix logic (line 83)
  - [ ] Add display text logic

- [ ] **Component** (`app/components/games/GrammarFillBlank.tsx` or new component)
  - [ ] Add blank type detection
  - [ ] Add text extraction logic
  - [ ] Update option filtering

- [ ] **Caching** (`lib/utils/curriculum-lexicon.ts`)
  - [ ] Add to lexicon structure (if grammar-introduced)
  - [ ] Update `buildLearnedCache()` (if needed)

- [ ] **Step UID** (`lib/utils/step-uid.ts`)
  - [ ] Add case (if new step type)

- [ ] **LessonRunner** (`app/components/LessonRunner.tsx`)
  - [ ] Add rendering case (if new step type)
  - [ ] Pass `learnedSoFar` prop

- [ ] **Curriculum** (`lib/config/curriculum.ts`)
  - [ ] Add grammar step with new type

- [ ] **Semantic Groups** (`lib/config/semantic-groups.ts`)
  - [ ] Add semantic group (if using semantic filtering)

---

## 🚫 COMMON MISTAKES TO AVOID

1. **Don't forget to update types** - TypeScript will catch this, but double-check unions
2. **Don't skip learnedSoFar prop** - Always pass `learnedCache[idx]` to components
3. **Don't hardcode vocab lists** - Use `learnedSoFar.vocabIds` for word blanks
4. **Don't forget prefix logic** - Update `prefix` variable in generator (line 83)
5. **Don't shuffle suffix/connector** - Only shuffle word blanks
6. **Don't forget semantic threshold** - Need ≥3 matches for semantic filter
7. **Don't skip step UID** - Always add case for new step types
8. **Don't forget tracking props** - Always pass `moduleId`, `lessonId`, `stepIndex`

---

## 📚 KEY CONCEPTS

### Learned-So-Far Rules

- **Vocab**: All previous modules + lessons + current lesson + step-introduced
- **Suffixes**: Only from grammar steps (not inferred)
- **Connectors**: From vocab OR grammar steps
- **NO reviewVocabulary**: Ignored per user rules

### Option Prefixes

- **Suffixes**: `suffix-*` (e.g., `suffix-am`)
- **Words**: `word-*` (e.g., `word-shoma`)
- **Connectors**: `conn-*` (e.g., `conn-ham`)
- **New types**: Follow pattern `{type}-*`

### Filtering Order

1. Connectors/correct answer (always first)
2. Learned vocab filter (if learnedSoFar provided)
3. Semantic filter (if expectedSemanticGroup AND ≥3 matches)
4. Fallback to all learned vocab (if <3 semantic matches)

---

## 🔍 DEBUGGING

All grammar components have comprehensive logging. Check console for:
- `📚 [GrammarFillBlank]` - Component state
- `🚀 [generateGrammarOptions]` - Generator entry
- `🔍 [generateGrammarOptions]` - Filter stages
- `✅ [generateGrammarOptions]` - Final options
- `🎯 [GrammarFillBlank]` - Option selection
- `🔍 [checkCurrentBlank]` - Correctness checks

---

## 📖 EXAMPLES

See existing grammar steps in `lib/config/curriculum.ts`:
- Module 1, Lesson 3: Ezafe connector (suffix + word blanks)
- Module 2, Lesson 1: Adjective suffixes (suffix blanks)
- Module 2, Lesson 5: Connectors (connector + word blanks)

---

**Questions?** Check the inline comments in each file for specific implementation details.

