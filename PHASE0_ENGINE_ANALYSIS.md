# PHASE 0: ENGINE ANALYSIS — COMPREHENSIVE DIAGNOSTIC REPORT

**Status**: Read-Only Analysis Complete  
**Purpose**: Map the entire lesson engine before any modifications  
**Risk Assessment**: Identify high-risk areas, tight coupling, duplicate logic

---

## 1. STEP-TYPE INVENTORY

### All Step Types (13 Total)

| Step Type | Defined In | Used In | XP Points | Risk Level |
|-----------|-----------|---------|-----------|------------|
| `welcome` | lib/types.ts:53 | LessonRunner:860 | 0 | LOW |
| `flashcard` | lib/types.ts:66 | LessonRunner:882 | 1 | LOW |
| `quiz` | lib/types.ts:78 | LessonRunner:897 | 2 | MEDIUM |
| `reverse-quiz` | lib/types.ts:88 | LessonRunner:909 | 2 | MEDIUM |
| `input` | lib/types.ts:98 | LessonRunner:921 | 2 | MEDIUM |
| `matching` | lib/types.ts:107 | LessonRunner:932 | 3 | MEDIUM |
| `final` | lib/types.ts:116 | LessonRunner:943 | 4 | HIGH |
| `grammar-intro` | lib/types.ts:140 | LessonRunner:993 | 1 | LOW |
| `grammar-fill-blank` | lib/types.ts:184 | LessonRunner:1004 | 1 | HIGH |
| `audio-meaning` | lib/types.ts:226 | LessonRunner:1019 | 2 | MEDIUM |
| `audio-sequence` | lib/types.ts:236 | LessonRunner:1029 | 3 | HIGH |
| `text-sequence` | lib/types.ts:248 | LessonRunner:1039 | 3 | HIGH |
| `story-conversation` | lib/types.ts:259 | LessonRunner:1049 | Variable | HIGH |

---

## STEP TYPE #1: `welcome`

**Defined In**: `lib/types.ts` lines 53-63

**Data Shape**:
```typescript
{
  title: string;
  description: string;
  data?: {
    objectives?: string[];
    lessonType?: string;
    sectionTitle?: string;
    sectionDescription?: string;
  };
}
```

**Component**: `WelcomeIntro.tsx`

**Depends On**:
- No service dependencies
- No distractor logic
- No word bank logic

**Interactions**:
- Renders lesson objectives
- Provides "Start" button to begin lesson
- Does NOT award XP (points: 0)

**Risk Areas**:
- **LOW RISK** — No complex logic, just display

---

## STEP TYPE #2: `flashcard`

**Defined In**: `lib/types.ts` lines 66-75

**Data Shape**:
```typescript
{
  // Legacy format (backward compatible)
  front?: string;
  back?: string;
  // New vocabulary-based format
  vocabularyId?: string;  // References vocabulary item
}
```

**Component**: `Flashcard.tsx`

**Depends On**:
- `VocabularyService.findVocabularyById()` — lookup vocab by ID
- Audio service (if vocabulary has audio field)

**Interactions**:
- Fetches vocabulary item by ID
- Displays front (Finglish) / back (English)
- Plays audio on tap
- Awards 1 XP on continue

**Risk Areas**:
- **LOW RISK** — Simple display logic
- Legacy format support (could be removed)

---

## STEP TYPE #3: `quiz` (Multiple Choice)

**Defined In**: `lib/types.ts` lines 78-85

**Data Shape**:
```typescript
{
  prompt: string;
  options: string[];  // Array of answer choices (Finglish or English)
  correct: number;    // Index of correct answer
}
```

**Component**: `Quiz.tsx`

**Depends On**:
- **NO distractor generation** (options are hardcoded in curriculum)
- `VocabularyService.findVocabularyById()` — for vocabulary tracking
- `shuffle()` utility (lib/utils.ts) — randomizes option order

**Interactions**:
- Renders multiple choice buttons
- Shuffles options on load (stable shuffle per attempt)
- Validates answer
- Awards 2 XP on correct
- Triggers remediation if incorrect

**Risk Areas**:
- **MEDIUM RISK** — Hardcoded options in curriculum means curriculum author must provide distractors
- Shuffle determinism depends on `quizAttemptCounter` (stable across retries)

---

## STEP TYPE #4: `reverse-quiz`

**Defined In**: `lib/types.ts` lines 88-95

**Data Shape**:
```typescript
{
  prompt: string;       // English prompt
  options: string[];    // Persian script options
  correct: number;      // Index of correct Persian option
}
```

**Component**: `Quiz.tsx` (same as regular quiz)

**Depends On**:
- Same as `quiz`
- Uses Persian script (`fa` field) instead of Finglish

**Interactions**:
- Identical to `quiz` but with Persian options
- **NOT CURRENTLY USED** in curriculum (no lessons use this type)

**Risk Areas**:
- **MEDIUM RISK** — Untested code path (no curriculum usage)
- May need testing if Persian script is added

---

## STEP TYPE #5: `input`

**Defined In**: `lib/types.ts` lines 98-104

**Data Shape**:
```typescript
{
  question: string;
  answer: string;
}
```

**Component**: `InputExercise.tsx`

**Depends On**:
- `VocabularyService.findVocabularyById()` — for vocabulary tracking
- Text normalization (toLowerCase, trim)

**Interactions**:
- User types answer
- Validates against expected answer (case-insensitive)
- Awards 2 XP on correct
- Triggers remediation if incorrect

**Risk Areas**:
- **MEDIUM RISK** — Strict text matching (typos = incorrect)
- No fuzzy matching or alternative answers

---

## STEP TYPE #6: `matching` (Drag and Drop)

**Defined In**: `lib/types.ts` lines 107-113

**Data Shape**:
```typescript
{
  words: { id: string; text: string; slotId: string }[];
  slots: { id: string; text: string }[];
}
```

**Component**: `MatchingGame.tsx`

**Depends On**:
- `vocabularyBank` prop (array of VocabularyItems)
- Drag-and-drop logic (react-dnd or custom)

**Interactions**:
- User drags words to slots
- Validates all matches
- Awards 3 XP on complete
- Tracks vocabulary for each matched pair

**Risk Areas**:
- **MEDIUM RISK** — Drag-and-drop UX can be finicky on mobile
- Vocabulary tracking logic per pair

---

## STEP TYPE #7: `final` (Final Challenge)

**Defined In**: `lib/types.ts` lines 116-137

**Data Shape**:
```typescript
{
  words: Array<{ id: string; text: string; translation: string }>;
  targetWords: string[];  // Correct order of word IDs
  title?: string;
  description?: string;
  successMessage?: string;
  incorrectMessage?: string;
  conversationFlow?: {
    description: string;
    expectedPhrase: string;
    persianSequence: string[];
  };
}
```

**Component**: `FinalChallenge.tsx`

**Depends On**:
- `ConversationFlowService` (if conversationFlow provided)
- Word bank display logic
- Order validation

**Interactions**:
- User arranges words in correct order
- Validates entire sequence
- Awards 4 XP on correct
- Uses conversation flow for contextual validation

**Risk Areas**:
- **HIGH RISK** — Complex validation logic
- Conversation flow adds contextual phrase matching (multi-word phrases)
- Order-sensitive (must match exact sequence)

---

## STEP TYPE #8: `grammar-intro`

**Defined In**: `lib/types.ts` lines 140-163

**Data Shape**:
```typescript
{
  conceptId: string;
  title: string;
  description: string;  // Big simple explanation
  rule: string;         // One-line rule
  visualType: 'tree' | 'comparison' | 'flow';
  visualData: {
    base?: string;
    transformations?: Array<{ label: string; result: string; meaning: string }>;
    before?: string;
    after?: string;
    steps?: string[];
  };
}
```

**Component**: `GrammarIntro.tsx`

**Depends On**:
- Grammar concepts registry (`lib/config/grammar-concepts.ts`)
- Visual rendering logic per visualType

**Interactions**:
- Displays grammar explanation
- Shows visual diagram (tree/comparison/flow)
- Awards 1 XP on continue
- **Does NOT teach vocabulary** (pure explanation)

**Risk Areas**:
- **LOW RISK** — Display-only component
- Visual rendering logic is self-contained

---

## STEP TYPE #9: `grammar-fill-blank`

**Defined In**: `lib/types.ts` lines 184-223

**Data Shape**:
```typescript
{
  conceptId: string;
  label?: string;
  subtitle?: string;
  exercises: Array<{
    sentence: string;
    translation: string;
    blankPosition?: number;  // DEPRECATED
    correctAnswer?: string;  // DEPRECATED
    blanks?: Array<{
      index: number;
      type: 'suffix' | 'word' | 'connector';
      correctAnswer: string;
      expectedSemanticGroup?: string;
    }>;
    expectedSemanticGroup?: string;
    suffixOptions?: Array<{ id: string; text: string; meaning?: string }>;
    wordOptions?: Array<{ id: string; text: string; meaning?: string }>;
    distractors?: Array<{ id: string; text: string; meaning?: string }>;
  }>;
}
```

**Component**: `GrammarFillBlank.tsx`

**Depends On**:
- **`generateGrammarOptions()`** (`lib/utils/grammar-options.ts`) — generates options dynamically
- **`learnedCache`** (from LessonRunner) — determines learned vocabulary
- `shuffle()` (for word blanks only, not suffixes)

**Interactions**:
- User fills blanks with suffixes, words, or connectors
- Validates each blank
- Awards 1 XP on correct
- **DYNAMIC OPTIONS** generated from learned vocabulary

**Risk Areas**:
- **HIGH RISK** — Most complex step type
- Multiple blank types (suffix/word/connector)
- Semantic filtering for word blanks
- Learned vocabulary cache dependency (tight coupling)
- Options can be hardcoded OR dynamically generated

---

## STEP TYPE #10: `audio-meaning`

**Defined In**: `lib/types.ts` lines 226-233

**Data Shape**:
```typescript
{
  vocabularyId: string;       // Target word to test
  distractors: string[];      // Vocabulary IDs for wrong answers
  autoPlay?: boolean;
}
```

**Component**: `AudioMeaning.tsx`

**Depends On**:
- **`vocabularyBank`** prop (array of VocabularyItems)
- **Distractor logic** in AudioMeaning component (deduplicated distractors)
- Audio service
- `shuffle()` utility

**Interactions**:
- Plays Persian audio
- User selects English meaning
- Validates answer
- Awards 2 XP on correct
- **Distractors provided manually** in curriculum

**Risk Areas**:
- **MEDIUM RISK** — Distractor deduplication logic (removes duplicate English meanings)
- Fallback to random distractors if provided distractors have duplicates
- Audio playback reliability

---

## STEP TYPE #11: `audio-sequence`

**Defined In**: `lib/types.ts` lines 236-245

**Data Shape**:
```typescript
{
  sequence: string[];            // Vocabulary IDs in order
  autoPlay?: boolean;
  expectedTranslation?: string;  // Custom phrase override
  targetWordCount?: number;      // Expected word count
  maxWordBankSize?: number;      // Max options (default: 12)
}
```

**Component**: `AudioSequence.tsx`

**Depends On**:
- **`WordBankService.generateWordBank()`** — generates word bank with distractors
- **`vocabularyBank`** prop
- Audio service (plays sequence)
- `shuffle()` utility (via WordBankService)

**Interactions**:
- Plays audio sequence
- User arranges English words in order
- Validates sequence order
- Awards 3 XP on correct
- **Word bank dynamically generated** with semantic distractors

**Risk Areas**:
- **HIGH RISK** — Word bank generation can fail (return empty [])
- Phrase detection logic (multi-word phrases vs single words)
- Semantic distractor generation
- Duplicate word handling (e.g., "your name and your father")

---

## STEP TYPE #12: `text-sequence`

**Defined In**: `lib/types.ts` lines 248-256

**Data Shape**:
```typescript
{
  finglishText: string;         // Persian text to display
  expectedTranslation: string;  // English translation to build
  maxWordBankSize?: number;     // Max options (default: 10)
}
```

**Component**: `TextSequence.tsx`

**Depends On**:
- **`WordBankService.generateWordBank()`** — generates word bank
- **`vocabularyBank`** prop
- `shuffle()` utility (via WordBankService)

**Interactions**:
- Displays Finglish text
- User arranges English words in order
- Validates sequence order
- Awards 3 XP on correct
- **Word bank dynamically generated** from expectedTranslation

**Risk Areas**:
- **HIGH RISK** — Same risks as audio-sequence
- Word bank extraction from expectedTranslation (tokenization)
- Phrase detection (keeps phrases like "how are you" together)
- Semantic distractor generation

---

## STEP TYPE #13: `story-conversation`

**Defined In**: `lib/types.ts` lines 259-304

**Data Shape**:
```typescript
{
  storyId: string;
  title: string;
  description: string;
  setting: string;
  characterName: string;
  characterEmoji: string;
  exchanges: StoryExchange[];
  successMessage?: string;
  requiresPersonalization?: boolean;
}
```

**Component**: `StoryConversation.tsx`

**Depends On**:
- `StoryProgressService` — tracks story progress
- Choice validation logic
- XP awarding per choice (variable XP)

**Interactions**:
- User has conversation with character
- Selects choices for each exchange
- Awards variable XP per choice (1 XP for correct first try)
- Tracks vocabulary used in choices

**Risk Areas**:
- **HIGH RISK** — Complex branching logic
- Variable XP system (different from other steps)
- Story progress tracking
- Multiple correct answers per exchange

---

## 2. DISTRACTOR GENERATOR DEPENDENCY MAP

### Step Types Using Distractors

| Step Type | Distractor Source | Functions | Fallback Behavior | Dependencies |
|-----------|------------------|-----------|-------------------|--------------|
| `quiz` | **Hardcoded** in curriculum | None (options provided) | N/A | None |
| `reverse-quiz` | **Hardcoded** in curriculum | None (options provided) | N/A | None |
| `audio-meaning` | **Hardcoded** IDs in curriculum | `AudioMeaning` component | Random vocab if duplicates | `vocabularyBank` |
| `audio-sequence` | **Dynamic** | `WordBankService.generateSemanticDistractors()` | Random vocab | `vocabularyBank` |
| `text-sequence` | **Dynamic** | `WordBankService.generateSemanticDistractors()` | Random vocab | `vocabularyBank` |
| `grammar-fill-blank` | **Dynamic** | `generateGrammarOptions()` | Random vocab | `learnedCache`, `vocabularyBank` |

---

### DISTRACTOR LOGIC #1: `audio-meaning`

**Location**: `AudioMeaning.tsx` lines 126-211

**How It Works**:
1. Curriculum provides `distractors: string[]` (vocabulary IDs)
2. Component builds answer options from vocabulary IDs
3. **Deduplication check** — removes duplicate English meanings
4. If duplicates found, replaces with random vocabulary from `vocabularyBank`
5. Shuffles options (stable shuffle per attempt)

**Input**:
- `vocabularyId`: Target word
- `distractors`: Array of vocabulary IDs
- `vocabularyBank`: All available vocabulary

**Output**:
- 4 options (1 correct + 3 distractors)
- Shuffled array

**Fallback**:
- If distractors have duplicates → replace with random vocabulary
- Always ensures 4 unique options

**Known Issues**:
- Duplicate English meanings can occur if curriculum provides bad distractors
- Fallback uses random vocabulary (not semantic)

**Dependencies**:
- `vocabularyBank` must be provided
- `shuffle()` from `lib/utils`
- `WordBankService.normalizeVocabEnglish()` for text normalization

---

### DISTRACTOR LOGIC #2: `WordBankService.generateSemanticDistractors()`

**Location**: `lib/services/word-bank-service.ts` lines 695-924

**How It Works**:
1. Takes correct words (WordBankItems)
2. Identifies semantic groups for each correct word
3. **70% semantic** — selects from same semantic group
4. **30% related** — selects from related groups (e.g., greetings → responses)
5. Filters out:
   - Duplicate English text
   - Synonym variants (e.g., "I / Me")
   - Sub-phrases (e.g., "good" if "I'm good" is correct)
6. Shuffles final distractor list

**Input**:
- `correctWords`: Array of WordBankItems (correct answers)
- `vocabularyBank`: All available vocabulary
- `targetCount`: Number of distractors needed

**Output**:
- Array of WordBankItems (distractors)

**Fallback**:
- If semantic matches < target → add random vocabulary
- If vocabulary bank exhausted → return fewer distractors

**Known Issues**:
- Can return empty [] if vocabulary bank is too small
- Semantic groups must be defined in `semantic-groups.ts`
- Related groups fallback can fail if no related groups defined

**Dependencies**:
- `getSemanticGroup()` from `semantic-groups.ts`
- `getRelatedGroups()` from `semantic-groups.ts`
- `shuffle()` from `lib/utils`
- `normalizeVocabEnglish()` for text normalization

---

### DISTRACTOR LOGIC #3: `generateGrammarOptions()`

**Location**: `lib/utils/grammar-options.ts` lines 138-458

**How It Works**:
1. Takes blank type (`suffix` / `word` / `connector`)
2. For **suffixes**: Uses hardcoded suffix list (`-am`, `-i`, `-e`, `-et`)
3. For **connectors**: Uses hardcoded connector list (`-e`, `-ye`)
4. For **words**: 
   - Semantic filtering (if `expectedSemanticGroup` provided)
   - Uses `learnedCache` to get vocabulary learned so far
   - Adds correct answer first
   - Adds custom distractors (if provided)
   - Fills remaining slots with random/semantic vocabulary
5. Always returns 4 options minimum

**Input**:
- `blankType`: Type of blank
- `correctAnswer`: Correct answer
- `lessonVocabulary`: Current lesson vocab
- `reviewVocabulary`: Review vocab IDs (optional)
- `customDistractors`: Manual distractors (optional)
- `config`: Additional config (semantic groups, etc.)

**Output**:
- Array of GrammarOptions (4+ options)

**Fallback**:
- If semantic matches < 3 → use all available vocabulary
- Always ensures minimum 4 options (3 distractors + 1 correct)

**Known Issues**:
- Semantic filtering can fail if vocabulary bank is too small
- Learned cache dependency (tight coupling with LessonRunner)
- Suffix/connector options are hardcoded (not dynamic)

**Dependencies**:
- `learnedCache` from LessonRunner
- `VocabularyService` for vocabulary lookup
- `getSemanticGroup()` from `semantic-groups.ts`

---

### DUPLICATE LOGIC ANALYSIS

**Where Distractor Logic Is Duplicated**:
1. `AudioMeaning` has custom deduplication logic (lines 126-211)
2. `WordBankService` has its own deduplication logic (lines 493-513)
3. `generateGrammarOptions()` has semantic filtering logic (lines 158-385)

**Risk**:
- **HIGH** — Three different implementations of similar logic
- Changes to one don't affect others
- Inconsistent behavior across step types

**Recommendation**:
- Centralize distractor generation in `WordBankService`
- Make `AudioMeaning` and `generateGrammarOptions()` use same service

---

## 3. WORD BANK GENERATION MAP

### Step Types Using Word Banks

| Step Type | Bank Source | Tokenizer | Can Return [] | Dependencies |
|-----------|------------|-----------|---------------|--------------|
| `audio-sequence` | `WordBankService` | N/A (uses vocab IDs) | **YES** | `vocabularyBank` |
| `text-sequence` | `WordBankService` | `extractSemanticUnitsFromExpected()` | **YES** | `vocabularyBank` |
| `grammar-fill-blank` | `generateGrammarOptions()` | N/A | **NO** (always 4+) | `learnedCache` |

---

### WORD BANK LOGIC #1: `WordBankService.generateWordBank()`

**Location**: `lib/services/word-bank-service.ts` lines 201-534

**Full Flow**:

**Step 1: Extract semantic units from expectedTranslation**
- For `text-sequence`: Tokenizes expectedTranslation into words/phrases
- For `audio-sequence`: Maps sequence IDs to English translations
- Uses `extractSemanticUnitsFromExpected()` (lines 546-694)

**Step 2: Match words to vocabulary bank**
- Identifies multi-word phrases (e.g., "how are you")
- Matches to vocabulary items if phrase exists
- Normalizes text (sentence case, removes punctuation)

**Step 3: Calculate word bank size**
- Dynamic sizing: 7-13 words based on correct word count
- Can be overridden with `maxWordBankSize`

**Step 4: Generate semantic distractors**
- Calls `generateSemanticDistractors()` (70% semantic, 30% related)
- Fills to target size

**Step 5: Remove redundant distractors**
- Filters out sub-phrases (e.g., "good" if "I'm good" is correct)
- Filters out synonym variants
- Deduplicates distractor text

**Step 6: Shuffle and return**
- Combines correct + distractors
- Shuffles using Fisher-Yates
- Returns `{ correctWords, distractors, allOptions, wordBankItems }`

**Tokenizer**: `extractSemanticUnitsFromExpected()`

**Location**: `lib/services/word-bank-service.ts` lines 546-694

**How It Works**:
1. Splits expectedTranslation by spaces
2. Detects multi-word phrases using `detectPhrases()`
3. Keeps phrases together if vocabulary item exists
4. Otherwise splits into single words
5. Normalizes to sentence case

**Phrase Detection**: `detectPhrases()`

**Location**: `lib/services/word-bank-service.ts` lines 893-990

**How It Works**:
1. Scans for 2-word, 3-word, 4-word phrases
2. Checks if phrase exists in vocabulary bank
3. Prioritizes longer phrases (4-word > 3-word > 2-word)
4. Returns array of detected phrases

**Why It Can Return []**:
1. If `vocabularyBank` is empty
2. If `expectedTranslation` is empty
3. If tokenization fails
4. If all distractors are filtered out

**Downstream Dependencies**:
- `AudioSequence` component (lines 64-70)
- `TextSequence` component (lines 48-58)
- Both components assume word bank is non-empty (no null checks)

---

### WORD BANK LOGIC #2: `generateGrammarOptions()`

**Location**: `lib/utils/grammar-options.ts` lines 138-458

**Full Flow** (for word blanks):

**Step 1: Build available vocabulary pool**
- Combines `lessonVocabulary` + review vocabulary
- Uses `learnedCache` to get vocabulary learned so far

**Step 2: Semantic filtering (optional)**
- If `expectedSemanticGroup` provided, filters by semantic group
- Requires minimum 3 semantic matches to use semantic filtering
- Otherwise uses all available vocabulary

**Step 3: Add correct answer**
- Adds correct answer first (always included)

**Step 4: Add custom distractors**
- Adds manually provided distractors (if any)

**Step 5: Fill remaining slots**
- Randomly selects from available vocabulary
- Ensures minimum 4 options (3 distractors + 1 correct)

**Step 6: Return (NO SHUFFLE)**
- Returns array of GrammarOptions
- **Shuffle happens in component** (GrammarFillBlank.tsx line 159-164)

**Why It CANNOT Return []**:
- Always adds correct answer first
- Always fills to minimum 4 options
- Uses fallback vocabulary if semantic filtering fails

**Downstream Dependencies**:
- `GrammarFillBlank` component (lines 138-273)
- Assumes minimum 4 options (no null checks)

---

## 4. "LEARNED VOCABULARY" SYSTEM AUDIT

### Current Implementation

**Centralized**: ✅ YES (mostly)

**Location**: `lib/utils/curriculum-lexicon.ts`

**Key Components**:

**1. Curriculum Lexicon** (lines 178-291)
- Scans entire curriculum ONCE
- Builds global vocabulary map
- Builds suffix introduction map
- Builds connector introduction map
- **Cached at module level** (no re-scanning)

**2. Learned Cache** (lines 301-348)
- Pre-computes learned vocabulary for each step index
- Builds incrementally (each step adds to previous)
- Includes:
  - `vocabIds`: All vocabulary IDs learned up to this step
  - `suffixes`: All suffixes introduced up to this step
  - `connectors`: All connectors introduced up to this step

**3. Base Vocabulary** (lines 353-401)
- Gets all vocabulary from previous modules + lessons
- Includes current lesson vocabulary
- Includes review vocabulary

**Used By**:
- `LessonRunner` (lines 110-116) — builds learned cache once per lesson
- `GrammarFillBlank` (receives `learnedSoFar` prop from LessonRunner)
- `generateGrammarOptions()` (uses `learnedCache` to filter vocabulary)

---

### Impact on Distractors

**Direct Impact**:
- `grammar-fill-blank` uses learned cache to filter word options
- Ensures only learned vocabulary appears as distractors
- Prevents future vocabulary from appearing

**Indirect Impact**:
- `audio-sequence` and `text-sequence` use `vocabularyBank` prop
- `vocabularyBank` is filtered by LessonRunner (lines 123-142)
- Filtering uses `getVocabTaughtUpToStep()` which uses learned cache

**Result**: All step types respect learned vocabulary boundaries

---

### Impact on Word Banks

**text-sequence**:
- Receives `vocabularyBank` from LessonRunner
- `vocabularyBank` filtered to vocabulary learned up to current step
- WordBankService generates distractors from this filtered bank

**audio-sequence**:
- Same as text-sequence
- Receives filtered `vocabularyBank`

**grammar-fill-blank**:
- Receives `learnedSoFar` prop directly
- Uses `learnedSoFar.vocabIds` to filter vocabulary
- Ensures only learned vocabulary appears in options

---

### Impact on Review

**Review Vocabulary**:
- `reviewVocabulary` field in lesson (line 38 in types.ts)
- Auto-generated from previous lessons using `generateCompleteReviewVocabulary()`
- Includes all vocabulary from previous lessons in module

**Used By**:
- LessonRunner (line 98) — gets review vocabulary
- Combined with current lesson vocabulary (line 141)
- Passed to all step components via `vocabularyBank` prop

---

### Scattered Logic Locations

**Centralized**:
- ✅ `curriculum-lexicon.ts` — main learned vocabulary logic
- ✅ `LessonRunner` — caches learned vocabulary per lesson

**Scattered**:
- ⚠️ `VocabularyService.getReviewVocabulary()` — auto-generates review vocabulary
- ⚠️ `VocabularyProgressService.extractVocabularyFromLessons()` — extracts learned vocabulary from completed lessons
- ⚠️ `WordBankService.generateWordBank()` — filters vocabulary bank (but receives pre-filtered bank)

**Recommendation**:
- Learned vocabulary logic is mostly centralized
- Review vocabulary auto-generation is good
- Minor duplication in `VocabularyProgressService` (for progress tracking, not step rendering)

---

### Assumptions

**Key Assumptions**:
1. Vocabulary is introduced in strict order (Module 1 before Module 2)
2. Lessons within module are completed sequentially
3. Review vocabulary includes ALL previous vocabulary (not selective)
4. Grammar concepts are introduced explicitly (not inferred)

**Where It Diverges**:
- ⚠️ Story lessons have empty vocabulary arrays (pure review)
- ⚠️ Review vocabulary can include words from skipped lessons (if user completed later lesson first)

---

## 5. CURRICULUM → ENGINE → UI FLOW MAP

### Complete Flow

```
curriculum.ts (data)
  ↓
app/modules/[moduleId]/[lessonId]/page.tsx (route handler)
  ↓
LessonRunner.tsx (orchestrator)
  ↓
Step Component (flashcard/quiz/etc)
  ↓
Game Logic (validation/scoring)
  ↓
Services (XP/Vocabulary/Progress)
  ↓
Database (Supabase)
```

---

### LAYER 1: Curriculum Data

**File**: `lib/config/curriculum.ts`

**Exports**:
- `curriculum`: Array of modules
- `getModule(moduleId)`: Get module by ID
- `getLesson(moduleId, lessonId)`: Get lesson by ID
- `getLessonSteps(moduleId, lessonId)`: Get lesson steps
- `getLessonVocabulary(moduleId, lessonId)`: Get lesson vocabulary
- `generateCompleteReviewVocabulary(moduleId, lessonNumber)`: Auto-generate review vocabulary

**Read By**:
- `LessonRunner` (imports `getLessonVocabulary`)
- Lesson page component (imports `getLessonSteps`)
- Services (import `getModule`, `getLesson`)

---

### LAYER 2: Route Handler

**File**: `app/modules/[moduleId]/[lessonId]/page.tsx`

**Responsibilities**:
- Get module/lesson params from URL
- Fetch lesson data
- Render LessonRunner
- Handle completion navigation
- Handle back button

**Key Code**:
```typescript
<LessonRunner 
  steps={getLessonSteps(moduleId, lessonId)} 
  moduleId={moduleId}
  lessonId={lessonId}
  lessonData={lesson}
  xp={xp}
  addXp={addXp}
  progress={progress}
  onProgressChange={setProgress}
  currentView={currentView}
  onViewChange={setCurrentView}
  onSaveState={(state) => setPreviousStates(prev => [...prev, state])}
  onStepChange={(current, total) => {
    setCurrentStep(current);
    setTotalSteps(total);
  }}
/>
```

---

### LAYER 3: Lesson Renderer

**File**: `app/components/LessonRunner.tsx`

**Responsibilities**:
- Iterate through lesson steps
- Build learned vocabulary cache
- Render appropriate component per step type
- Handle step progression
- Manage remediation queue
- Track XP and vocabulary
- Handle lesson completion

**Key Logic**:

**Step Iteration** (lines 63-73):
```typescript
const [idx, setIdx] = useState(0) // Current step index
const [remediationQueue, setRemediationQueue] = useState<string[]>([])
const [isInRemediation, setIsInRemediation] = useState(false)
```

**Learned Cache** (lines 110-116):
```typescript
const curriculumLexicon = useMemo(() => getCurriculumLexicon(), []);
const learnedCache: LearnedCache = useMemo(() => {
  return buildLearnedCache(moduleId, lessonId, steps, curriculumLexicon);
}, [moduleId, lessonId, steps, curriculumLexicon]);
```

**Vocabulary Bank** (lines 123-142):
```typescript
const getVocabTaughtUpToStep = useCallback((stepIndex: number): VocabularyItem[] => {
  const learnedVocabIds = learnedCache[stepIndex]?.vocabIds || [];
  // Map IDs to VocabularyItems
}, [learnedCache, curriculumLexicon.allVocabMap]);

const vocabTaughtSoFar = getVocabTaughtUpToStep(idx);
const allVocab = [...vocabTaughtSoFar, ...reviewVocab];
```

---

### LAYER 4: Step Renderer

**File**: `app/components/LessonRunner.tsx` (lines 839-1069)

**How It Chooses Component**:

Large switch statement based on `step.type`:

```typescript
{step.type === 'welcome' ? (
  <LessonIntro ... />
) : step.type === 'flashcard' ? (
  <Flashcard ... />
) : step.type === 'quiz' ? (
  <Quiz ... />
) : step.type === 'grammar-fill-blank' ? (
  <GrammarFillBlank ... />
) : ...}
```

**Data Passed**:
- Step-specific data (from `step.data`)
- Common props:
  - `points`: XP value
  - `onComplete`: Completion handler
  - `onXpStart`: XP animation trigger
  - `onVocabTrack`: Vocabulary tracking handler
  - `vocabularyBank`: Filtered vocabulary
  - `learnedSoFar`: Learned cache (for grammar steps)

---

### LAYER 5: Step Component

**Example**: `Quiz.tsx`

**Responsibilities**:
- Render UI for step type
- Handle user interaction
- Validate answer
- Trigger XP animation
- Track vocabulary performance
- Call completion handler

**Key Props**:
```typescript
{
  prompt: string;
  options: string[];
  correct: number;
  points: number;
  onComplete: (wasCorrect: boolean) => void;
  onXpStart: () => void;
  vocabularyId?: string;
  onVocabTrack?: (vocabId, wordText, isCorrect, timeMs) => void;
}
```

**Flow**:
1. Shuffle options on load
2. User selects answer
3. Validate answer (compare to `correct` index)
4. Show result (correct/incorrect)
5. Track vocabulary (if `vocabularyId` provided)
6. Show XP animation
7. Call `onComplete(wasCorrect)`
8. LessonRunner advances to next step

---

### LAYER 6: Helper Functions

**Audio Resolution**:
- Audio files resolved from `/audio/` directory
- Naming convention: `{vocabularyId}.mp3`
- Played via `<audio>` element

**Translation Resolution**:
- English translations from vocabulary items
- Finglish from vocabulary items
- Persian script from vocabulary items (`fa` field)

**Logic Before Rendering**:
1. Build learned vocabulary cache
2. Filter vocabulary bank
3. Generate remediation queue (if incorrect answers)
4. Calculate progress percentage

---

## 6. ALL GLOBAL HELPERS

### Core Utilities (`lib/utils.ts`)

**1. `shuffle<T>(array: T[]): T[]`**
- **Who calls**: AudioMeaning, Quiz, WordBankService, GrammarFillBlank
- **What it expects**: Array of any type
- **What it returns**: New shuffled array (non-mutating)
- **Risk**: LOW — Standard Fisher-Yates algorithm

**2. `cn(...inputs: ClassValue[]): string`**
- **Who calls**: All components (for Tailwind class merging)
- **What it expects**: Class names
- **What it returns**: Merged Tailwind classes
- **Risk**: NONE — UI-only helper

---

### Word Bank Service (`lib/services/word-bank-service.ts`)

**3. `WordBankService.normalizeVocabEnglish(enText: string): string`**
- **Who calls**: AudioMeaning, WordBankService, VocabularyService, Review components
- **What it expects**: English translation text
- **What it returns**: Normalized text (no punctuation, no slashes)
- **Risk**: LOW — Text normalization only

**4. `WordBankService.expandContractions(text: string): string`**
- **Who calls**: WordBankService (internal)
- **What it expects**: Text with contractions
- **What it returns**: Text with expanded contractions
- **Risk**: LOW — Text processing only

**5. `WordBankService.generateWordBank(options): WordBankResult`**
- **Who calls**: AudioSequence, TextSequence
- **What it expects**: expectedTranslation, vocabularyBank, sequenceIds, maxSize
- **What it returns**: { correctWords, distractors, allOptions, wordBankItems }
- **Risk**: **HIGH** — Can return empty [], complex phrase detection logic

**6. `WordBankService.generateSemanticDistractors(correct, vocab, count): WordBankItem[]`**
- **Who calls**: WordBankService.generateWordBank(), Review components
- **What it expects**: Correct words, vocabulary bank, target count
- **What it returns**: Array of distractor WordBankItems
- **Risk**: **HIGH** — Semantic filtering, can fail if vocab too small

**7. `WordBankService.shuffleArray<T>(array: T[]): T[]`**
- **Who calls**: WordBankService (internal)
- **What it expects**: Array to shuffle
- **What it returns**: Shuffled array
- **Risk**: LOW — Same as `shuffle()`

---

### Grammar Options (`lib/utils/grammar-options.ts`)

**8. `generateGrammarOptions(blankType, correctAnswer, vocab, reviewVocab, customDistractors, config): GrammarOption[]`**
- **Who calls**: GrammarFillBlank component
- **What it expects**: Blank type, correct answer, vocabulary, config
- **What it returns**: Array of GrammarOptions (4+ options)
- **Risk**: **HIGH** — Complex semantic filtering, tight coupling with learnedCache

---

### Vocabulary Service (`lib/services/vocabulary-service.ts`)

**9. `VocabularyService.findVocabularyById(id: string): VocabularyItem | undefined`**
- **Who calls**: All step components, LessonRunner, Review components
- **What it expects**: Vocabulary ID
- **What it returns**: VocabularyItem or undefined
- **Risk**: LOW — Simple lookup

**10. `VocabularyService.getAllCurriculumVocabulary(): VocabularyItem[]`**
- **Who calls**: LessonRunner, Review components
- **What it expects**: Nothing
- **What it returns**: All vocabulary items from curriculum
- **Risk**: LOW — Cached result

**11. `VocabularyService.getReviewVocabulary(moduleId, lessonId): VocabularyItem[]`**
- **Who calls**: LessonRunner
- **What it expects**: Module ID, lesson ID
- **What it returns**: Review vocabulary items
- **Risk**: LOW — Auto-generated from previous lessons

**12. `VocabularyService.generateQuizPrompt(vocab: VocabularyItem): string`**
- **Who calls**: LessonRunner (for remediation quizzes)
- **What it expects**: Vocabulary item
- **What it returns**: Quiz prompt string
- **Risk**: LOW — Text generation only

**13. `VocabularyService.generateQuizOptions(vocab, allVocab, deterministic): { text: string, correct: boolean }[]`**
- **Who calls**: LessonRunner (for remediation quizzes)
- **What it expects**: Target vocab, all vocab, deterministic flag
- **What it returns**: Array of quiz options
- **Risk**: MEDIUM — Distractor generation logic

---

### Curriculum Lexicon (`lib/utils/curriculum-lexicon.ts`)

**14. `getCurriculumLexicon(): CurriculumLexicon`**
- **Who calls**: LessonRunner
- **What it expects**: Nothing
- **What it returns**: Global curriculum lexicon (vocabulary map, suffix map, connector map)
- **Risk**: LOW — Cached result, scans curriculum once

**15. `buildLearnedCache(moduleId, lessonId, steps, lexicon): LearnedCache`**
- **Who calls**: LessonRunner
- **What it expects**: Module ID, lesson ID, steps, lexicon
- **What it returns**: Learned cache (pre-computed vocabulary per step)
- **Risk**: MEDIUM — Core caching logic, performance-critical

---

### Step UID (`lib/utils/step-uid.ts`)

**16. `deriveStepUid(moduleId, lessonId, stepIndex, stepType): string`**
- **Who calls**: LessonRunner, VocabularyTrackingService
- **What it expects**: Module ID, lesson ID, step index, step type
- **What it returns**: Unique step identifier
- **Risk**: LOW — ID generation only

---

### Semantic Groups (`lib/config/semantic-groups.ts`)

**17. `getSemanticGroup(vocabularyId: string): string | undefined`**
- **Who calls**: WordBankService, generateGrammarOptions
- **What it expects**: Vocabulary ID
- **What it returns**: Semantic group name (e.g., "greetings")
- **Risk**: LOW — Lookup only

**18. `getRelatedGroups(semanticGroup: string): string[]`**
- **Who calls**: WordBankService
- **What it expects**: Semantic group name
- **What it returns**: Array of related group names
- **Risk**: LOW — Lookup only

**19. `getVocabIdsInGroup(groupName: string): string[]`**
- **Who calls**: WordBankService
- **What it expects**: Semantic group name
- **What it returns**: Array of vocabulary IDs in that group
- **Risk**: LOW — Lookup only

---

## 7. HIGH-RISK AREAS

### RISK LEVEL 1: CRITICAL (Breakage Risk = VERY HIGH)

**1. Word Bank Generation**
- **Location**: `WordBankService.generateWordBank()`
- **Why High Risk**: 
  - Can return empty [] (breaks UI)
  - Complex phrase detection logic
  - Semantic distractor generation can fail
  - Tight coupling with vocabulary bank
- **Breakage Impact**: audio-sequence and text-sequence steps fail completely
- **Must Be Isolated**: YES — Add null checks, fallback distractors

**2. Learned Vocabulary Cache**
- **Location**: `curriculum-lexicon.ts` + `LessonRunner`
- **Why High Risk**:
  - Core caching layer affects ALL step types
  - Grammar steps directly depend on it
  - Changes break vocabulary filtering
- **Breakage Impact**: Wrong vocabulary appears in options (spoils future content)
- **Must Be Isolated**: YES — Add feature flags for cache behavior changes

**3. Grammar Fill-Blank Options**
- **Location**: `generateGrammarOptions()` + `GrammarFillBlank.tsx`
- **Why High Risk**:
  - Most complex step type
  - Multiple blank types (suffix/word/connector)
  - Semantic filtering can fail
  - Tight coupling with learned cache
- **Breakage Impact**: Grammar steps fail or show wrong options
- **Must Be Isolated**: YES — Add feature flags for option generation changes

---

### RISK LEVEL 2: HIGH (Breakage Risk = HIGH)

**4. Step Type Rendering**
- **Location**: `LessonRunner.tsx` lines 839-1069
- **Why High Risk**:
  - Single point of failure for ALL step types
  - Large switch statement (hard to maintain)
  - Props must match component interfaces exactly
- **Breakage Impact**: Entire lesson fails to render
- **Must Be Isolated**: MAYBE — Consider component registry pattern

**5. XP Idempotency**
- **Location**: `LessonRunner` + `XpService`
- **Why High Risk**:
  - XP must not duplicate on retry
  - Step UID generation must be stable
  - Database transactions must be idempotent
- **Breakage Impact**: Users get duplicate XP, progression breaks
- **Must Be Isolated**: YES — Don't touch without extensive testing

**6. Vocabulary Tracking**
- **Location**: `LessonRunner.handleVocabularyTracking()` + `VocabularyTrackingService`
- **Why High Risk**:
  - Tracks every answer (correct/incorrect)
  - Retry prevention logic must work
  - Remediation queue depends on it
- **Breakage Impact**: Remediation breaks, analytics corrupted
- **Must Be Isolated**: YES — Don't modify tracking logic

---

### RISK LEVEL 3: MEDIUM (Breakage Risk = MEDIUM)

**7. Distractor Deduplication**
- **Location**: AudioMeaning, WordBankService, generateGrammarOptions
- **Why Medium Risk**:
  - Duplicate logic in 3 places
  - Inconsistent behavior
  - Changes to one don't affect others
- **Breakage Impact**: Steps may show duplicate options
- **Must Be Isolated**: MAYBE — Centralize distractor logic

**8. Lesson Completion**
- **Location**: `LessonRunner.useEffect()` lines 220-303
- **Why Medium Risk**:
  - Complex async logic (DB writes, cache updates, navigation)
  - Must handle failures gracefully
  - Timing-sensitive (can double-trigger)
- **Breakage Impact**: Lesson not marked complete, navigation fails
- **Must Be Isolated**: YES — Add feature flags for completion logic changes

**9. Remediation System**
- **Location**: `LessonRunner` lines 64-95, 145-171, 720-836
- **Why Medium Risk**:
  - Refs + state combination (timing-sensitive)
  - Quiz generation depends on vocabulary bank
  - Can trigger infinite loops if broken
- **Breakage Impact**: Remediation doesn't trigger, or triggers infinitely
- **Must Be Isolated**: YES — Don't touch without testing

---

### TIGHTLY COUPLED AREAS

**1. LessonRunner ↔ Learned Cache**
- **Coupling**: LessonRunner builds cache, passes to grammar steps
- **Impact**: Changes to cache format break grammar steps
- **Recommendation**: Define stable interface for `learnedSoFar`

**2. WordBankService ↔ Vocabulary Bank**
- **Coupling**: WordBankService assumes vocabulary bank structure
- **Impact**: Changes to VocabularyItem interface break word banks
- **Recommendation**: Add TypeScript strict checks

**3. Step Components ↔ LessonRunner Props**
- **Coupling**: Each component expects specific props from LessonRunner
- **Impact**: Changes to prop structure break rendering
- **Recommendation**: Use prop types strictly, add runtime validation

**4. Curriculum ↔ Engine**
- **Coupling**: Engine assumes curriculum structure (vocabulary array, steps array, etc.)
- **Impact**: Changes to curriculum format break engine
- **Recommendation**: Define stable curriculum schema, add validation

---

### DUPLICATE LOGIC HOTSPOTS

**1. Distractor Generation**
- **Duplicated In**: AudioMeaning, WordBankService, generateGrammarOptions
- **Risk**: Inconsistent behavior
- **Recommendation**: Centralize in WordBankService

**2. Text Normalization**
- **Duplicated In**: WordBankService, VocabularyService, various components
- **Risk**: Inconsistent text matching
- **Recommendation**: Use single source of truth (WordBankService.normalizeVocabEnglish)

**3. Shuffle Logic**
- **Duplicated In**: lib/utils, WordBankService
- **Risk**: Low (both use Fisher-Yates)
- **Recommendation**: Use lib/utils.shuffle everywhere

**4. Vocabulary Lookup**
- **Duplicated In**: VocabularyService, curriculum-lexicon
- **Risk**: Low (both use same map)
- **Recommendation**: Use VocabularyService.findVocabularyById everywhere

---

## 8. WHAT MUST BE FLAGGED BEFORE CHANGING

### BEFORE TOUCHING WORD BANK GENERATION

**Flag**:
- ✅ Add feature flag: `enableNewWordBankLogic`
- ✅ Add null checks for empty word banks
- ✅ Add fallback distractor logic
- ✅ Test with small vocabulary banks (< 10 words)

**Why**:
- Word banks can return []
- Phrase detection is fragile
- Semantic filtering can fail

**Testing Required**:
- audio-sequence with 0 distractors
- text-sequence with multi-word phrases
- audio-sequence with duplicate words ("your name and your father")

---

### BEFORE TOUCHING LEARNED CACHE

**Flag**:
- ✅ Add feature flag: `enableNewLearnedCacheLogic`
- ✅ Verify cache format matches all consumers
- ✅ Test with empty lessons (no vocabulary)
- ✅ Test with review vocabulary

**Why**:
- Grammar steps depend on cache
- Vocabulary filtering depends on cache
- Changes break all step types

**Testing Required**:
- grammar-fill-blank with empty learned cache
- audio-sequence with only review vocabulary
- All step types in first lesson (minimal learned vocabulary)

---

### BEFORE TOUCHING GRAMMAR OPTIONS

**Flag**:
- ✅ Add feature flag: `enableNewGrammarOptionsLogic`
- ✅ Verify minimum 4 options always
- ✅ Test semantic filtering edge cases
- ✅ Test with empty vocabulary

**Why**:
- Grammar steps can break completely
- Semantic filtering is complex
- Learned cache dependency

**Testing Required**:
- grammar-fill-blank with 0 semantic matches
- grammar-fill-blank with custom distractors
- grammar-fill-blank with suffix/connector/word blanks

---

### BEFORE TOUCHING DISTRACTOR LOGIC

**Flag**:
- ✅ Add feature flag: `enableNewDistractorLogic`
- ✅ Add null checks for missing vocabulary
- ✅ Test deduplication edge cases
- ✅ Verify fallback behavior

**Why**:
- Duplicate logic in 3 places
- Changes must be coordinated
- Fallback logic is critical

**Testing Required**:
- audio-meaning with duplicate distractors
- audio-sequence with no semantic matches
- text-sequence with synonym distractors

---

### BEFORE TOUCHING STEP RENDERING

**Flag**:
- ✅ Add feature flag per step type: `enableNew{StepType}Rendering`
- ✅ Verify all prop interfaces match
- ✅ Test with missing props
- ✅ Add runtime prop validation

**Why**:
- Single point of failure
- All step types affected
- Hard to debug rendering issues

**Testing Required**:
- All 13 step types individually
- Step transitions (next/back)
- Remediation flow

---

## CONFIRMATION

✅ **No code was modified**  
✅ **All analysis-only rules were followed**  
✅ **Complete diagnostic report delivered**

---

## NEXT STEPS (FOR USER DECISION)

Based on this analysis, you should decide:

1. **Which areas are safe to refactor now?**
   - Recommendation: Distractor logic centralization (medium risk)

2. **Which step types need isolation?**
   - Recommendation: audio-sequence, text-sequence, grammar-fill-blank

3. **Where to insert feature flags?**
   - Recommendation: Word bank generation, learned cache, grammar options

4. **Which engine functions must be centralized first?**
   - Recommendation: Distractor generation, text normalization

5. **What is the real risk hotspot?**
   - **ANSWER: Word bank generation** — Can return [], breaks UI, no fallbacks

This diagnostic provides the foundation for safe, systematic refactoring.

