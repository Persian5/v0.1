# LessonRunner Component - Complete System Map

**Analysis Date**: 2025-01-XX  
**File**: `app/components/LessonRunner.tsx`  
**Lines**: 1-1070  
**Status**: ANALYSIS-ONLY MODE (No code modifications)

---

## 1. HIGH-LEVEL SUMMARY

### What LessonRunner Is Responsible For

**LessonRunner** is the core orchestration component that manages the entire lesson execution lifecycle. It:

- **Renders** lesson steps sequentially (flashcards, quizzes, input exercises, matching games, grammar steps, audio exercises, story conversations)
- **Tracks** user progress through steps (`idx` state)
- **Manages** remediation system (extra practice for words answered incorrectly 2+ times)
- **Awards XP** idempotently (prevents duplicate XP on back button)
- **Tracks vocabulary** performance for review mode
- **Handles** lesson completion (marks complete, syncs XP, navigates to completion page)
- **Manages** story lesson completion (bypasses normal flow)
- **Coordinates** with parent component via callbacks (`onProgressChange`, `onViewChange`, `onStepChange`)

### Inputs (Props)

```typescript
interface LessonRunnerProps {
  steps: LessonStep[]                    // Array of lesson steps to execute
  moduleId: string                       // Current module identifier
  lessonId: string                       // Current lesson identifier
  lessonData?: Lesson                     // Full lesson data (for story detection)
  xp: number                             // Current XP total (from parent)
  addXp: (amount, source, metadata?) => void  // Callback to add XP (optimistic)
  progress?: number                       // Current progress percentage (0-100)
  onProgressChange?: (progress: number) => void  // Callback to update progress
  currentView?: string                    // Current view type (for parent state)
  onViewChange?: (view: string) => void   // Callback to update view type
  onSaveState?: (state) => void           // Callback to save lesson state
  onStepChange?: (current, total) => void // Callback to track step changes
}
```

### Outputs

- **Renders** appropriate step component based on `step.type`
- **Calls** callbacks to update parent state (progress, view, step tracking)
- **Navigates** to completion page when lesson finishes
- **Triggers** XP awards via `XpService.awardXpOnce()`
- **Stores** vocabulary attempts via `VocabularyTrackingService`

### The Entire Lesson Lifecycle

```
1. Component mounts with steps array
2. Initialize state (idx=0, remediation queues empty)
3. Build curriculum lexicon cache (once)
4. Build learned cache (once per lesson)
5. Render step[idx] component
6. User interacts with step
7. Step calls onComplete/onContinue handler
8. Handler evaluates answer (correct/incorrect)
9. If incorrect → track vocabulary attempt
10. If 2+ incorrect attempts → add to remediation queue
11. Award XP (idempotent check)
12. Track vocabulary performance
13. Advance to next step OR start remediation
14. Repeat steps 5-13 until idx >= steps.length
15. When idx >= steps.length → trigger lesson completion
16. Mark lesson complete in database
17. Sync XP to server
18. Navigate to completion page
```

---

## 2. SECTION-BY-SECTION BREAKDOWN

### **REGION 1: Imports (Lines 1-32)**

**Purpose**: Import all dependencies

**Key Imports**:
- **React hooks**: `useState`, `useEffect`, `useRef`, `useTransition`, `useMemo`, `useCallback`
- **Step components**: Flashcard, Quiz, InputExercise, MatchingGame, FinalChallenge, LessonIntro, GrammarIntro, GrammarFillBlank, AudioMeaning, AudioSequence, StoryConversation, TextSequence
- **Types**: All step types from `@/lib/types`
- **Services**: XpService, LessonProgressService, VocabularyService, VocabularyTrackingService, PhraseTrackingService, ModuleProgressService, SyncService, WordBankService, SmartAuthService
- **Utils**: `deriveStepUid`, `verifyLessonCompletionInCache`, `safeTelemetry`, `getCurriculumLexicon`, `buildLearnedCache`
- **Auth**: `useAuth` hook
- **Router**: `useRouter` from Next.js

**Dependencies**: 32 imports total

---

### **REGION 2: Props Interface & Component Declaration (Lines 34-62)**

**Purpose**: Define component interface and destructure props

**Structure**:
- Interface defines all props with types
- Component receives props via destructuring
- No default values (all optional props use `?`)

---

### **REGION 3: State Initialization (Lines 63-77)**

**Purpose**: Initialize all React state and refs

**State Variables**:

| State | Type | Purpose |
|-------|------|---------|
| `idx` | `number` | Current step index (0-based) |
| `remediationQueue` | `string[]` | Vocabulary IDs needing remediation |
| `isInRemediation` | `boolean` | Whether currently in remediation mode |
| `remediationStep` | `'flashcard' \| 'quiz'` | Current remediation step type |
| `remediationStartIdx` | `number \| null` | Step index where remediation started (for return) |
| `pendingRemediation` | `string[]` | Vocabulary IDs queued for remediation after current step |
| `incorrectAttempts` | `Record<string, number>` | Counter of incorrect attempts per vocabulary ID |
| `quizAttemptCounter` | `number` | Counter to force Quiz re-render on retry |
| `storyCompleted` | `boolean` | Flag to prevent lesson completion logic for stories |
| `isNavigating` | `boolean` | Guard to prevent rapid back button clicks |
| `showXp` | `boolean` | Track XP animation state (unused?) |

**Refs**:
- `stateRef`: DOM ref for custom event listener (`go-back` event)
- `remediationQueueRef`: Ref mirror of `remediationQueue` state
- `pendingRemediationRef`: Ref mirror of `pendingRemediation` state
- `remediationTriggeredRef`: Set of vocabulary IDs that already triggered remediation (prevents duplicates)
- `currentStepTrackedRef`: Set of vocabulary IDs tracked on current step (prevents retry counting)

**Hooks**:
- `router`: Next.js router instance
- `isPending`, `startTransition`: React transition for navigation
- `user`: Auth user object (for idempotent XP)

---

### **REGION 4: Ref Synchronization Effects (Lines 88-94)**

**Purpose**: Keep refs in sync with state for closure consistency

**Effects**:
- Sync `remediationQueueRef.current` with `remediationQueue` state
- Sync `pendingRemediationRef.current` with `pendingRemediation` state

**Why**: Refs are used in closures (like `createVocabularyTracker`) that need latest state without re-creating callbacks

---

### **REGION 5: Vocabulary Data Preparation (Lines 96-103)**

**Purpose**: Load vocabulary data for lesson

**Data Sources**:
- `currentLessonVocab`: Vocabulary from current lesson (via `getLessonVocabulary`)
- `reviewVocab`: Review vocabulary for this lesson (via `VocabularyService.getReviewVocabulary`)
- `allCurriculumVocab`: ALL vocabulary across entire curriculum (for vocabulary extraction from quizzes)

**Why**: Different vocab sets used for different purposes:
- `currentLessonVocab`: Lesson-specific content
- `reviewVocab`: Word banks for games
- `allCurriculumVocab`: Vocabulary extraction (can find any word mentioned in any quiz)

---

### **REGION 6: Caching Layer (Lines 105-115)**

**Purpose**: Pre-compute curriculum data to eliminate repeated scans

**Cache 1: Curriculum Lexicon** (Line 110)
- Built ONCE (module-scoped, memoized)
- Contains: all vocabulary, module vocab, lesson vocab, suffix introductions, connector introductions
- Used for: O(1) vocabulary lookups

**Cache 2: Learned Cache** (Lines 113-115)
- Built ONCE per lesson (memoized, depends on moduleId, lessonId, steps, curriculumLexicon)
- Contains: learned-so-far snapshot for each step index
- Structure: `{ [stepIndex]: { vocabIds: string[], suffixes: string[], connectors: string[] } }`
- Used for: Grammar components (GrammarFillBlank) to know what vocab/suffixes/connectors are available at each step

**Performance Impact**: Eliminates 10-100x curriculum scans per lesson

---

### **REGION 7: Vocabulary Helper Functions (Lines 121-142)**

**Purpose**: Get vocabulary taught up to current step

**Function: `getVocabTaughtUpToStep`** (Lines 123-137)
- **Input**: `stepIndex: number`
- **Output**: `VocabularyItem[]`
- **Logic**:
  1. Get vocab IDs from `learnedCache[stepIndex].vocabIds`
  2. Map IDs to `VocabularyItem` objects using `curriculumLexicon.allVocabMap`
  3. Return array of vocabulary items
- **Performance**: O(1) lookup + O(n) map (much faster than scanning curriculum)

**Derived Values** (Lines 140-142):
- `vocabTaughtSoFar`: Vocabulary taught up to current step (`idx`)
- `allVocab`: `vocabTaughtSoFar + reviewVocab` (for word banks)
- `allVocabForExtraction`: `allCurriculumVocab` (for vocabulary extraction)

---

### **REGION 8: Remediation Quiz Generator (Lines 144-171)**

**Purpose**: Generate remediation quizzes with stable, memoized options

**Function: `generateRemediationQuiz`** (Lines 148-171)
- **Type**: `useMemo` hook (memoized function factory)
- **Input**: `vocabularyId: string`
- **Output**: `{ prompt: string, options: QuizOption[] } | null`
- **Logic**:
  1. Check cache first (Map keyed by vocabularyId)
  2. If not cached:
     - Find vocabulary item via `VocabularyService.findVocabularyById`
     - Generate prompt via `VocabularyService.generateQuizPrompt`
     - Generate options via `VocabularyService.generateQuizOptions` (deterministic=true for stable order)
     - Cache result
  3. Return cached or new quiz data
- **Why Memoized**: Prevents re-generating quizzes on every render
- **Deterministic**: Same vocabulary ID always gets same 4 distractors (stable order)

**Dependency**: `allVocabForExtraction` (only recreates cache when vocabulary changes)

---

### **REGION 9: Custom Event Listener (Lines 173-193)**

**Purpose**: Handle "go-back" custom event from step components

**Effect** (Lines 174-193):
- Listens for `go-back` event on `stateRef.current` element
- Event detail contains `{ stepIndex: number }`
- Handler:
  - Sets `idx` to `stepIndex`
  - Exits remediation mode
  - Clears remediation queues
- Cleanup: Removes event listener on unmount

**Why**: Allows step components to trigger navigation back to specific step

---

### **REGION 10: Progress & View Tracking Effect (Lines 195-217)**

**Purpose**: Update parent component when step changes

**Effect** (Lines 196-217):
- **Dependencies**: `idx`, `steps.length`, `onProgressChange`, `onViewChange`, `onStepChange`, `steps`, `isInRemediation`
- **Logic**:
  1. Calculate progress: `Math.min(100, Math.round((idx / steps.length) * 100))`
  2. Call `onProgressChange(progressValue)` if provided and not in remediation
  3. Call `onViewChange(steps[idx].type)` if provided and not past end
  4. Call `onStepChange(displayStep, steps.length)` if provided (1-indexed for display)
  5. Clear `currentStepTrackedRef` (allows new tracking on new step)

**Why**: Keeps parent component in sync with current step state

---

### **REGION 11: Lesson Completion Effect (Lines 219-305)**

**Purpose**: Handle lesson completion when `idx >= steps.length`

**Effect** (Lines 220-305):
- **Trigger**: `idx >= steps.length && !isInRemediation && !storyCompleted`
- **Logic** (async IIFE):
  
  **PHASE 1: Mark Lesson Complete** (Lines 236-249)
  - Call `LessonProgressService.markLessonCompleted(moduleId, lessonId)`
  - Returns `{ success: boolean, dbUpdated: boolean, cacheUpdated: boolean, error?: string }`
  - **CRITICAL**: If DB write failed → show alert, return early (don't navigate)
  
  **PHASE 2: Cache Verification** (Lines 251-278)
  - If cache not updated → verify manually via `verifyLessonCompletionInCache`
  - If verification fails → refresh progress from DB via `SmartAuthService.refreshProgressFromDb`
  - Logs warnings but continues (non-blocking)
  
  **PHASE 3: XP Sync** (Lines 280-291)
  - Call `SyncService.forceSyncNow()` to flush XP to server
  - Wrapped in try-catch (non-critical, don't block on failure)
  - Logs success/warning but continues
  
  **PHASE 4: Navigation** (Lines 293-302)
  - Use `startTransition` for non-blocking navigation
  - Navigate to `/modules/${moduleId}/${lessonId}/completion?xp=${xp}`
  - Only navigates if lesson was successfully marked complete

**Dependencies**: `idx`, `steps.length`, `isInRemediation`, `storyCompleted`, `lessonData`, `moduleId`, `lessonId`, `router`, `xp`, `user`

**Critical Path**: DB write failure → alert → return (no navigation)

---

### **REGION 12: Route Prefetching Effect (Lines 307-312)**

**Purpose**: Prefetch completion route when 80% done

**Effect** (Lines 308-312):
- **Trigger**: `idx / steps.length >= 0.8`
- **Action**: `router.prefetch('/modules/${moduleId}/${lessonId}/completion?xp=${xp}')`
- **Why**: Avoids blank screen while Next.js chunk loads

---

### **REGION 13: Scroll Management Effect (Lines 314-327)**

**Purpose**: Scroll to top when step changes

**Effect** (Lines 315-327):
- **Trigger**: `idx`, `isInRemediation`, `remediationStep` change
- **Action**: Scroll window to top (with mobile fallbacks)
- **Retry**: Calls `scrollTop()` twice (immediate + next tick) for WebKit browsers

---

### **REGION 14: Remediation Safety Checks (Lines 329-356)**

**Purpose**: Skip remediation if vocabulary/quiz generation fails

**Effect 1: Vocabulary Check** (Lines 331-342)
- **Trigger**: `isInRemediation && remediationQueue.length > 0`
- **Logic**: If vocabulary not found → exit remediation mode, clear queue
- **Why**: Prevents infinite remediation loop if vocabulary ID invalid

**Effect 2: Quiz Generation Check** (Lines 346-356)
- **Trigger**: `isInRemediation && remediationQueue.length > 0 && remediationStep === 'quiz'`
- **Logic**: If quiz generation fails → call `completeRemediation()` to skip
- **Why**: Prevents render error if quiz can't be generated

**Critical**: These MUST be before early returns (React hooks rule)

---

### **REGION 15: XP Handler Factory (Lines 362-404)**

**Purpose**: Create idempotent XP handler for each step

**Function: `createStepXpHandler`** (Lines 364-404)
- **Returns**: `() => Promise<boolean>`
- **Logic**:
  1. Get current step: `steps[idx]`
  2. Check user exists: `if (!user?.id) return false`
  3. Derive step UID: `deriveStepUid(currentStep, idx, moduleId, lessonId)`
  4. Get XP reward: `XpService.getStepXp(currentStep)`
  5. Award XP idempotently: `XpService.awardXpOnce({ userId, moduleId, lessonId, stepUid, amount, source, metadata })`
  6. Return `result.granted` (true = new XP, false = already completed)

**Idempotency**: Database enforces once-per-step via step UID
**Note**: Does NOT call `addXp` prop (XP already handled by `awardXpOnce`)

**Why Factory**: Creates new handler for each step (captures current `idx`)

---

### **REGION 16: Vocabulary Tracker Factory (Lines 406-538)**

**Purpose**: Create vocabulary tracking handler with remediation logic

**Function: `createVocabularyTracker`** (Lines 408-538)
- **Returns**: `(vocabularyId, wordText, isCorrect, timeSpentMs?) => Promise<void>`
- **Memoized**: `useCallback` (depends on `idx`, `steps`, `user?.id`, `moduleId`, `lessonId`, `isInRemediation`, `incorrectAttempts`)

**Logic Flow**:

1. **Retry Prevention** (Lines 419-450)
   - Check if vocabulary already tracked on current step: `currentStepTrackedRef.current.has(stepKey)`
   - If tracked → log retry blocked, still track to DB (analytics), return early
   - Mark step as tracked: `currentStepTrackedRef.current.add(stepKey)`

2. **Vocabulary Lookup** (Lines 458-461)
   - Find vocabulary item: `safeFindVocabularyById(vocabularyId)`
   - Normalize word text: `WordBankService.normalizeVocabEnglish(vocabItem.en)`

3. **Database Tracking** (Lines 469-485)
   - Always track to database: `VocabularyTrackingService.storeAttempt({ userId, vocabularyId, wordText, gameType, isCorrect, timeSpentMs, moduleId, lessonId, stepUid, contextData })`
   - Fire-and-forget (`.catch()` logs error)
   - Invalidate dashboard cache: `SmartAuthService.invalidateDashboardStats()`

4. **Remediation Logic** (Lines 491-536)
   - **Skip if in remediation**: Reset counter to 0, return
   - **If incorrect**:
     - Increment counter: `incorrectAttempts[vocabularyId] + 1`
     - If counter >= 2 AND not already triggered → add to `pendingRemediation` queue
     - Mark as triggered: `remediationTriggeredRef.current.add(vocabularyId)`
   - **If correct**: Log success, counter unchanged
   - **localStorage tracking**: `VocabularyService.recordCorrectAnswer/recordIncorrectAnswer` (backwards compatibility)

**Key Behavior**: Remediation triggered at 2+ incorrect attempts (soft threshold)

---

### **REGION 17: Early Returns (Lines 540-555)**

**Purpose**: Guard against invalid states

**Return 1** (Lines 545-547):
- **Condition**: `idx >= steps.length && !isInRemediation && !storyCompleted`
- **Action**: Return `null`
- **Why**: Lesson completion handled by effect, not render

**Return 2** (Lines 552-555):
- **Condition**: `!step` (step is undefined)
- **Action**: Log warning, return `null`
- **Why**: Edge case during navigation

---

### **REGION 18: Step Navigation Function (Lines 557-578)**

**Purpose**: Advance to next step or start remediation

**Function: `next`** (Lines 557-578)
- **Logic**:
  1. Save state: `onSaveState({ progress, currentStep: idx })` if provided and not in remediation
  2. Check pending remediation:
     - If `pendingRemediation.length > 0` AND not in remediation:
       - Move pending → remediation queue
       - Set `isInRemediation = true`
       - Set `remediationStep = 'flashcard'`
       - Save `remediationStartIdx = idx`
       - Return early (don't advance step)
  3. Scroll to top
  4. Advance step: `setIdx(i => i + 1)`

**Key Behavior**: Remediation starts AFTER user gets current question right (not immediately)

---

### **REGION 19: Deprecated Remediation Handler (Lines 580-589)**

**Purpose**: Backwards compatibility (deprecated function)

**Function: `handleRemediationNeeded`** (Lines 584-589)
- **Status**: DEPRECATED
- **Action**: Logs warning, returns early
- **Why**: Remediation now handled by `createVocabularyTracker`

---

### **REGION 20: Remediation Completion Function (Lines 591-629)**

**Purpose**: Complete current remediation step and advance

**Function: `completeRemediation`** (Lines 593-629)
- **Logic**:
  - **If `remediationStep === 'flashcard'`**: Move to quiz step (`setRemediationStep('quiz')`)
  - **If `remediationStep === 'quiz'`**:
    - Remove first word from queue: `remediationQueue.slice(1)`
    - **If queue empty**:
      - Exit remediation mode
      - Reset remediation step to 'flashcard'
      - Return to step AFTER remediation started: `setIdx(remediationStartIdx + 1)`
      - Reset `remediationStartIdx = null`
    - **If queue not empty**: Start next word (flashcard again)

**Guard**: Prevents double completion (checks queue length before processing)

---

### **REGION 21: Story Completion Handler (Lines 631-647)**

**Purpose**: Handle story lesson completion (bypasses normal flow)

**Function: `handleStoryComplete`** (Lines 632-647)
- **Logic**:
  1. Set `storyCompleted = true` (prevents lesson completion effect)
  2. Update progress to 100%
  3. Mark lesson complete (fire-and-forget)
  4. Navigate to completion route

**Why**: Story lessons have different completion flow (goes to module completion, not lesson completion)

---

### **REGION 22: Vocabulary Lookup Helpers (Lines 649-658)**

**Purpose**: Find vocabulary items by ID

**Function: `findVocabularyById`** (Lines 650-652)
- **Logic**: `VocabularyService.findVocabularyById(vocabId)`

**Function: `safeFindVocabularyById`** (Lines 655-658)
- **Logic**: Handles undefined input, calls `findVocabularyById`

---

### **REGION 23: Quiz Key Generator (Lines 660-663)**

**Purpose**: Generate stable keys for Quiz components

**Function: `generateQuizKey`** (Lines 661-663)
- **Input**: `step`, `attemptCounter`
- **Output**: `quiz-${idx}-${prompt.slice(0,20)}-${attemptCounter}`
- **Why**: Forces Quiz re-render on retry (incrementing `quizAttemptCounter` creates new key)

---

### **REGION 24: Vocabulary Extraction Helpers (Lines 665-714)**

**Purpose**: Extract vocabulary ID from step for tracking

**Function: `extractVocabularyFromFailedQuiz`** (Lines 666-674)
- **Logic**:
  - If `step.type === 'quiz'`: Use `VocabularyService.extractVocabularyFromQuiz(quizStep.data, allVocabForExtraction)`
  - Otherwise: Use `getStepVocabularyId(step)`

**Function: `getStepVocabularyId`** (Lines 677-714)
- **Logic**:
  - **Flashcard**: Return `step.data.vocabularyId`
  - **Quiz**: Search prompt/options for vocabulary words
  - **Input**: Match answer with vocabulary
  - **Other**: Return `undefined`

**Why**: Different step types store vocabulary ID differently

---

### **REGION 25: Legacy XP Handler Factory (Lines 716-740)**

**Purpose**: Create XP handlers for legacy components (DEPRECATED?)

**Function: `createXpHandler`** (Lines 717-740)
- **Input**: `activityType` (string)
- **Returns**: `() => void`
- **Logic**:
  1. Map activity type to reward type
  2. Get XP reward: `XpService.getReward(rewardType)`
  3. Call `addXp(xpReward.amount, xpReward.source, metadata)`

**Note**: This calls `addXp` prop (optimistic update), unlike `createStepXpHandler` which uses `XpService.awardXpOnce` (idempotent)

**Status**: Still used by some components? Check usage.

---

### **REGION 26: Generic Completion Handler (Lines 742-762)**

**Purpose**: Handle step completion for all components except Flashcard

**Function: `handleItemComplete`** (Lines 743-762)
- **Input**: `wasCorrect: boolean = true`
- **Logic**:
  - **If in remediation**:
    - If correct → `completeRemediation()`
    - If incorrect → do nothing (let user retry)
  - **If not in remediation**:
    - If correct → reset quiz counter, call `next()`
    - If incorrect → increment quiz counter (forces Quiz re-render)

**Key Behavior**: Only advances on correct answers

---

### **REGION 27: Back Button Handler (Lines 764-783)**

**Purpose**: Navigate to previous step

**Function: `handleBackButton`** (Lines 765-783)
- **Guards**: Prevents action if `isNavigating || showXp || isPending`
- **Logic**:
  1. Set `isNavigating = true`
  2. If `idx > 0`: `setIdx(idx - 1)`
  3. Clear pending remediation
  4. Reset guard after 300ms

**Why**: Prevents rapid clicks during animations

---

### **REGION 28: Remediation Rendering (Lines 785-837)**

**Purpose**: Render remediation content (flashcard or quiz)

**Condition**: `isInRemediation && remediationQueue.length > 0`

**Logic**:
1. Get current word: `remediationQueue[0]`
2. Find vocabulary item
3. If not found → return `null` (useEffect will clean up)
4. **If `remediationStep === 'flashcard'`**:
   - Render `<Flashcard>` with `onContinue={() => completeRemediation()}`
5. **If `remediationStep === 'quiz'`**:
   - Generate quiz: `generateRemediationQuiz(currentWord)`
   - If generation fails → return `null` (useEffect will clean up)
   - Render `<Quiz>` with `onComplete={(wasCorrect) => handleItemComplete(wasCorrect)}`

**Key Props Passed**:
- `onXpStart={createStepXpHandler()}`
- `onVocabTrack={createVocabularyTracker()}`
- `label`: "QUICK REVIEW" or "PRACTICE AGAIN"

---

### **REGION 29: Main Step Rendering (Lines 839-1069)**

**Purpose**: Render current step based on `step.type`

**Structure**: Large switch statement rendering different components

**Step Types Handled**:

1. **`welcome`** (Lines 860-881)
   - Component: `<LessonIntro>`
   - Props: title, description, objectives, images, mission text
   - Handler: `onStart={next}`

2. **`flashcard`** (Lines 882-896)
   - Component: `<Flashcard>`
   - Props: front, back, vocabularyItem, points
   - Handler: `onContinue={() => handleItemComplete(true)}`
   - Key: `flashcard-${idx}-${vocabularyId}`

3. **`quiz`** (Lines 897-908)
   - Component: `<Quiz>`
   - Props: prompt, options, correct, points, vocabularyId
   - Handler: `onComplete={(wasCorrect) => handleItemComplete(wasCorrect)}`
   - Key: `generateQuizKey(step, quizAttemptCounter)`

4. **`reverse-quiz`** (Lines 909-920)
   - Component: `<Quiz>` (same as quiz)
   - Props: Same as quiz
   - Handler: Same as quiz

5. **`input`** (Lines 921-931)
   - Component: `<InputExercise>`
   - Props: question, answer, points, vocabularyId
   - Handler: `onComplete={(wasCorrect) => handleItemComplete(wasCorrect)}`
   - Key: `input-${idx}`

6. **`matching`** (Lines 932-942)
   - Component: `<MatchingGame>`
   - Props: words, slots, points, vocabularyBank
   - Handler: `onComplete={handleItemComplete}`
   - Key: `matching-${idx}`

7. **`final`** (Lines 943-956)
   - Component: `<FinalChallenge>`
   - Props: words, targetWords, title, description, successMessage, incorrectMessage, conversationFlow, points
   - Handler: `onComplete={handleItemComplete}`

8. **`grammar-intro`** (Lines 957-1003)
   - Component: `<GrammarIntro>`
   - Props: title, description, rule, visualType, visualData, points
   - Handler: `onComplete={handleItemComplete}`
   - Key: `grammar-intro-${idx}`

9. **`grammar-fill-blank`** (Lines 1004-1018)
   - Component: `<GrammarFillBlank>`
   - Props: exercises, conceptId, moduleId, lessonId, stepIndex, label, subtitle, points, **learnedSoFar**
   - Handler: `onComplete={handleItemComplete}`
   - Key: `grammar-fill-blank-${idx}`
   - **CRITICAL**: Receives `learnedCache[idx]` (pre-computed learned-so-far)

10. **`audio-meaning`** (Lines 1019-1030)
    - Component: `<AudioMeaning>`
    - Props: vocabularyId, distractors, vocabularyBank, points, autoPlay
    - Handler: `onContinue={() => handleItemComplete(true)}`
    - Key: `audio-meaning-${idx}`

11. **`audio-sequence`** (Lines 1031-1044)
    - Component: `<AudioSequence>`
    - Props: sequence, vocabularyBank, points, autoPlay, expectedTranslation, targetWordCount, maxWordBankSize
    - Handler: `onContinue={() => handleItemComplete(true)}`
    - Key: `audio-sequence-${idx}`

12. **`text-sequence`** (Lines 1045-1056)
    - Component: `<TextSequence>`
    - Props: finglishText, expectedTranslation, vocabularyBank, points, maxWordBankSize
    - Handler: `onContinue={() => handleItemComplete(true)}`
    - Key: `idx`

13. **`story-conversation`** (Lines 1057-1064)
    - Component: `<StoryConversation>`
    - Props: step, onComplete, onXpStart, addXp
    - Handler: `onComplete={handleStoryComplete}` (bypasses normal flow)
    - Key: `story-conversation-${idx}-${storyId}`

**Common Props Passed to All**:
- `onXpStart={createStepXpHandler()}` (idempotent XP)
- `onVocabTrack={createVocabularyTracker()}` (vocabulary tracking + remediation)
- `points={step.points}`

**UI Elements**:
- Back button (Lines 846-856): Renders if `idx > 0`, calls `handleBackButton`
- Hidden state element (Line 841): `<div id="lesson-runner-state" ref={stateRef}>` for custom events

---

## 3. FLOW DIAGRAM (TEXT-BASED)

```
┌─────────────────────────────────────────────────────────────────┐
│ COMPONENT MOUNT                                                 │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. Initialize State                                             │
│    - idx = 0                                                     │
│    - remediationQueue = []                                      │
│    - isInRemediation = false                                     │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Build Caches                                                 │
│    - curriculumLexicon (once, memoized)                         │
│    - learnedCache (once per lesson, memoized)                    │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Load Vocabulary Data                                          │
│    - currentLessonVocab                                          │
│    - reviewVocab                                                 │
│    - allCurriculumVocab                                          │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Render Step[idx]                                             │
│    - Switch on step.type                                         │
│    - Render appropriate component                                │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. User Interacts                                                │
│    - Answers question                                            │
│    - Clicks continue                                             │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Step Calls Handler                                            │
│    - onComplete(wasCorrect)                                     │
│    - onContinue()                                                │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Handler Evaluates Answer                                      │
│    - handleItemComplete(wasCorrect)                              │
│    - createVocabularyTracker()(vocabId, wordText, isCorrect)     │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. Track Vocabulary                                              │
│    - Store attempt to database                                   │
│    - If incorrect: increment incorrectAttempts[vocabId]        │
│    - If incorrectAttempts[vocabId] >= 2:                         │
│      → Add to pendingRemediation queue                           │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. Award XP                                                      │
│    - createStepXpHandler()()                                    │
│    - Derive step UID                                             │
│    - XpService.awardXpOnce() (idempotent)                        │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 10. Advance Step                                                 │
│     - If pendingRemediation.length > 0:                          │
│       → Start remediation (flashcard → quiz)                    │
│     - Else:                                                      │
│       → next() → setIdx(idx + 1)                                │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 11. Check Completion                                             │
│     - If idx >= steps.length:                                    │
│       → Trigger lesson completion effect                         │
│     - Else:                                                      │
│       → Loop back to step 4                                      │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 12. Lesson Completion                                            │
│     - Mark lesson complete (DB)                                  │
│     - Verify cache                                               │
│     - Sync XP                                                    │
│     - Navigate to completion page                                │
└─────────────────────────────────────────────────────────────────┘
```

### **Remediation Flow** (Sub-flow)

```
User answers incorrectly 2+ times
         │
         ▼
Add to pendingRemediation queue
         │
         ▼
User gets current question RIGHT
         │
         ▼
next() checks pendingRemediation
         │
         ▼
Start remediation mode
         │
         ▼
Render Flashcard (remediation)
         │
         ▼
User flips card → completeRemediation()
         │
         ▼
Move to Quiz step
         │
         ▼
Render Quiz (remediation)
         │
         ▼
User answers → handleItemComplete(wasCorrect)
         │
         ▼
If correct: completeRemediation()
         │
         ▼
Remove word from queue
         │
         ▼
If queue empty:
  → Exit remediation
  → Return to step AFTER remediation started
Else:
  → Start next word (flashcard again)
```

---

## 4. DEPENDENCY LIST

### **External Functions Imported**

#### **From `@/lib/services/xp-service`**
- `XpService.getStepXp(step)`: Get XP reward for step
- `XpService.awardXpOnce(options)`: Award XP idempotently (database enforces once-per-step)
- `XpService.getReward(rewardType)`: Get XP reward for activity type (legacy)

**Why LessonRunner depends on it**: XP system is centralized in service layer
**What breaks if malfunctioning**: Users don't earn XP, or earn duplicate XP

---

#### **From `@/lib/services/lesson-progress-service`**
- `LessonProgressService.markLessonCompleted(moduleId, lessonId)`: Mark lesson complete in DB + cache

**Why LessonRunner depends on it**: Progress tracking is centralized
**What breaks if malfunctioning**: Lessons don't mark complete, progress lost

---

#### **From `@/lib/services/vocabulary-service`**
- `VocabularyService.getReviewVocabulary(moduleId, lessonId)`: Get review vocabulary
- `VocabularyService.getAllCurriculumVocabulary()`: Get ALL curriculum vocabulary
- `VocabularyService.findVocabularyById(vocabId)`: Find vocabulary item by ID
- `VocabularyService.generateQuizPrompt(vocab)`: Generate quiz prompt
- `VocabularyService.generateQuizOptions(vocab, allVocab, deterministic)`: Generate quiz options
- `VocabularyService.extractVocabularyFromQuiz(quizData, allVocab)`: Extract vocabulary ID from quiz
- `VocabularyService.recordCorrectAnswer(vocabId)`: Record to localStorage (backwards compat)
- `VocabularyService.recordIncorrectAnswer(vocabId)`: Record to localStorage (backwards compat)

**Why LessonRunner depends on it**: Vocabulary operations centralized
**What breaks if malfunctioning**: Vocabulary lookups fail, remediation breaks, quiz generation fails

---

#### **From `@/lib/services/vocabulary-tracking-service`**
- `VocabularyTrackingService.storeAttempt(options)`: Store vocabulary attempt to database

**Why LessonRunner depends on it**: Vocabulary performance tracking
**What breaks if malfunctioning**: Review mode data missing, analytics incomplete

---

#### **From `@/lib/services/phrase-tracking-service`**
- (Imported but not used in LessonRunner)

---

#### **From `@/lib/services/module-progress-service`**
- (Imported but not used in LessonRunner)

---

#### **From `@/lib/services/sync-service`**
- `SyncService.forceSyncNow()`: Force sync XP to server

**Why LessonRunner depends on it**: XP sync on lesson completion
**What breaks if malfunctioning**: XP not synced immediately (will sync later, non-critical)

---

#### **From `@/lib/services/word-bank-service`**
- `WordBankService.normalizeVocabEnglish(text)`: Normalize vocabulary English text

**Why LessonRunner depends on it**: Vocabulary text normalization
**What breaks if malfunctioning**: Vocabulary tracking may have inconsistent text

---

#### **From `@/lib/services/smart-auth-service`**
- `SmartAuthService.refreshProgressFromDb()`: Refresh progress cache from database
- `SmartAuthService.invalidateDashboardStats()`: Invalidate dashboard cache

**Why LessonRunner depends on it**: Cache management for progress/dashboard
**What breaks if malfunctioning**: Stale cache, dashboard shows wrong stats

---

#### **From `@/lib/config/curriculum`**
- `getLessonVocabulary(moduleId, lessonId)`: Get vocabulary for lesson

**Why LessonRunner depends on it**: Lesson vocabulary data
**What breaks if malfunctioning**: Lesson vocabulary missing, word banks empty

---

#### **From `@/lib/utils/step-uid`**
- `deriveStepUid(step, stepIndex, moduleId, lessonId)`: Generate stable step UID

**Why LessonRunner depends on it**: XP idempotency (ensures same step = same UID)
**What breaks if malfunctioning**: Duplicate XP, or XP not awarded

---

#### **From `@/lib/utils/cache-verification`**
- `verifyLessonCompletionInCache(userId, moduleId, lessonId)`: Verify lesson completion in cache

**Why LessonRunner depends on it**: Cache consistency check
**What breaks if malfunctioning**: Cache inconsistency not detected

---

#### **From `@/lib/utils/telemetry-safe`**
- `safeTelemetry(callback)`: Safe telemetry logging (wrapped in try-catch)

**Why LessonRunner depends on it**: Safe logging (doesn't break app if logging fails)
**What breaks if malfunctioning**: Logging fails (non-critical)

---

#### **From `@/lib/utils/curriculum-lexicon`**
- `getCurriculumLexicon()`: Get or build global curriculum lexicon cache
- `buildLearnedCache(moduleId, lessonId, steps, lexicon)`: Build learned cache for lesson

**Why LessonRunner depends on it**: Performance optimization (eliminates curriculum scans)
**What breaks if malfunctioning**: Performance degrades, but functionality preserved

---

#### **From `@/components/auth/AuthProvider`**
- `useAuth()`: Get current user

**Why LessonRunner depends on it**: User ID needed for XP/vocabulary tracking
**What breaks if malfunctioning**: XP/vocabulary tracking fails (no user ID)

---

#### **From `next/navigation`**
- `useRouter()`: Next.js router

**Why LessonRunner depends on it**: Navigation to completion page
**What breaks if malfunctioning**: Can't navigate after lesson completion

---

### **Component Dependencies**

All step components are imported but LessonRunner doesn't call their internal functions - it only renders them and passes props.

---

## 5. DANGER ZONES

### **🔴 CRITICAL: Hook Order Dependency**

**Location**: Lines 88-356 (all hooks before early returns)

**Issue**: React hooks MUST be called in same order every render. Early returns break this rule.

**Current Protection**: All hooks are before early returns (lines 545-555)

**Risk**: If someone adds early return before hooks → React error

**Mitigation**: Comment at line 359: "CRITICAL: All hooks MUST be before early returns"

---

### **🔴 CRITICAL: Async Lesson Completion**

**Location**: Lines 220-305 (lesson completion effect)

**Issue**: Async IIFE in useEffect. Multiple triggers could cause race conditions.

**Current Protection**: 
- Guard: `idx >= steps.length && !isInRemediation && !storyCompleted`
- Early return if DB write fails

**Risk**: 
- If effect triggers twice → duplicate completion attempts
- If navigation happens before DB write → progress lost

**Mitigation**: 
- Guard prevents multiple triggers
- Early return prevents navigation on failure

---

### **🟡 MODERATE: Remediation State Management**

**Location**: Lines 64-68, 82-85, 567-574, 593-629

**Issue**: Multiple state variables control remediation flow:
- `remediationQueue` (state)
- `remediationQueueRef` (ref)
- `pendingRemediation` (state)
- `pendingRemediationRef` (ref)
- `isInRemediation` (state)
- `remediationStep` (state)
- `remediationStartIdx` (state)
- `remediationTriggeredRef` (ref)

**Risk**: State/ref desync, complex state transitions

**Mitigation**: 
- Refs synced via useEffect (lines 88-94)
- Functional updates used where needed (line 600)

---

### **🟡 MODERATE: Vocabulary Extraction Logic**

**Location**: Lines 665-714 (`extractVocabularyFromFailedQuiz`, `getStepVocabularyId`)

**Issue**: Heuristic-based vocabulary extraction (searches prompt/options for vocabulary words)

**Risk**: 
- May not find vocabulary ID if word not in vocabulary bank
- May find wrong vocabulary ID if multiple words match

**Mitigation**: 
- Falls back to `undefined` if not found
- Uses `allCurriculumVocab` for broader search

---

### **🟡 MODERATE: Quiz Key Generation**

**Location**: Lines 661-663 (`generateQuizKey`)

**Issue**: Key includes `prompt.slice(0, 20)` - if prompts are similar, keys may collide

**Risk**: Quiz component may not re-render on retry if keys collide

**Mitigation**: Also includes `idx` and `attemptCounter` for uniqueness

---

### **🟡 MODERATE: Retry Prevention Logic**

**Location**: Lines 419-450 (`currentStepTrackedRef`)

**Issue**: Uses ref to track vocabulary tracked on current step. Cleared when step changes (line 216).

**Risk**: 
- If step changes but vocabulary tracker called → may double-track
- If ref not cleared properly → retries blocked incorrectly

**Mitigation**: 
- Cleared in effect when `idx` changes (line 216)
- Uses `stepKey = ${vocabularyId}-${idx}` for uniqueness

---

### **🟡 MODERATE: Legacy XP Handler**

**Location**: Lines 716-740 (`createXpHandler`)

**Issue**: Calls `addXp` prop (optimistic update) instead of `XpService.awardXpOnce` (idempotent)

**Risk**: May award duplicate XP if component re-renders

**Status**: Still used? Check component usage.

---

### **🟢 LOW: Scroll Management**

**Location**: Lines 314-327

**Issue**: Scrolls to top on every step change (including remediation)

**Risk**: May scroll during animations (jarring UX)

**Mitigation**: Retry logic for WebKit browsers

---

### **🟢 LOW: Route Prefetching**

**Location**: Lines 307-312

**Issue**: Prefetches at 80% completion (may prefetch too early/late)

**Risk**: Wasted bandwidth if user doesn't complete

**Mitigation**: Non-blocking, only prefetches once

---

## 6. TESTING RECOMMENDATIONS

### **Functions That Should Become Pure (Post-Beta)**

1. **`getVocabTaughtUpToStep`** (Lines 123-137)
   - **Current**: Uses `learnedCache` and `curriculumLexicon` from closure
   - **Should be**: Pure function `(stepIndex, learnedCache, curriculumLexicon) => VocabularyItem[]`
   - **Why**: Easier to test, no dependency on component state

2. **`generateRemediationQuiz`** (Lines 148-171)
   - **Current**: Memoized factory function
   - **Should be**: Pure function `(vocabularyId, allVocab) => QuizData`
   - **Why**: Testable without React, cache can be external

3. **`extractVocabularyFromFailedQuiz`** (Lines 666-674)
   - **Current**: Uses `allVocabForExtraction` from closure
   - **Should be**: Pure function `(step, allVocab) => string | undefined`
   - **Why**: Testable with mock data

4. **`getStepVocabularyId`** (Lines 677-714)
   - **Current**: Uses `allVocab` from closure
   - **Should be**: Pure function `(step, allVocab) => string | undefined`
   - **Why**: Testable with mock steps/vocab

5. **`deriveStepUid`** (Already pure, imported)
   - **Status**: ✅ Already pure (external utility)

---

### **Logic That Needs Isolating (Post-Beta)**

1. **Remediation System** (Lines 64-68, 82-85, 567-574, 593-629)
   - **Isolation**: Extract to `useRemediation` hook or `RemediationManager` class
   - **Why**: Complex state management, easier to test in isolation
   - **Interface**: `{ queue, isActive, start, complete, next }`

2. **Vocabulary Tracking** (Lines 408-538)
   - **Isolation**: Extract to `useVocabularyTracking` hook
   - **Why**: Complex logic, database calls, remediation triggers
   - **Interface**: `(vocabId, wordText, isCorrect, timeSpentMs) => void`

3. **XP Awarding** (Lines 364-404)
   - **Isolation**: Already uses `XpService` (good), but handler factory could be hook
   - **Why**: Test XP logic without rendering components
   - **Interface**: `useStepXpHandler(step, idx, moduleId, lessonId) => () => Promise<boolean>`

4. **Lesson Completion** (Lines 220-305)
   - **Isolation**: Extract to `useLessonCompletion` hook
   - **Why**: Complex async flow, easier to test
   - **Interface**: `useLessonCompletion(moduleId, lessonId, xp, user) => { complete: () => Promise<void> }`

---

### **Sandbox for Testing**

**Create test utilities**:

1. **Mock Step Generator**
   ```typescript
   function createMockStep(type: StepType, overrides?: Partial<StepData>): LessonStep
   ```

2. **Mock Vocabulary Generator**
   ```typescript
   function createMockVocabulary(id: string, overrides?: Partial<VocabularyItem>): VocabularyItem
   ```

3. **Mock Curriculum Lexicon**
   ```typescript
   function createMockLexicon(vocab: VocabularyItem[]): CurriculumLexicon
   ```

4. **Mock Learned Cache**
   ```typescript
   function createMockLearnedCache(steps: LessonStep[], vocabPerStep: string[][]): LearnedCache
   ```

5. **Test Harness**
   ```typescript
   function renderLessonRunner(props: Partial<LessonRunnerProps>): RenderResult
   ```

**Test Scenarios**:

1. **Step Progression**
   - Start at step 0, advance through all steps
   - Verify `idx` increments
   - Verify progress updates
   - Verify step change callbacks called

2. **Remediation Flow**
   - Answer incorrectly 2 times → verify remediation queue
   - Answer correctly → verify remediation starts
   - Complete flashcard → verify moves to quiz
   - Complete quiz → verify returns to lesson step

3. **XP Awarding**
   - Complete step → verify XP awarded
   - Go back and complete again → verify XP NOT awarded (idempotent)
   - Verify step UID generation

4. **Vocabulary Tracking**
   - Answer correctly → verify attempt stored
   - Answer incorrectly → verify attempt stored
   - Answer incorrectly 2+ times → verify remediation triggered

5. **Lesson Completion**
   - Complete all steps → verify lesson marked complete
   - Verify navigation to completion page
   - Test DB write failure → verify alert shown, no navigation

6. **Edge Cases**
   - Empty steps array
   - Undefined step
   - Vocabulary not found
   - Quiz generation fails
   - User not authenticated

---

## 7. ARCHITECTURAL OBSERVATIONS

### **Strengths**

1. **Separation of Concerns**: Services handle business logic, components handle UI
2. **Idempotency**: XP system prevents duplicate awards
3. **Performance**: Caching layer eliminates repeated scans
4. **Type Safety**: Strong TypeScript types for steps
5. **Error Handling**: Guards against invalid states

### **Areas for Future Improvement**

1. **State Management**: Consider reducer pattern for complex state (remediation, tracking)
2. **Testing**: Extract pure functions for easier unit testing
3. **Error Boundaries**: Add error boundaries around step rendering
4. **Loading States**: Add loading states for async operations
5. **Accessibility**: Ensure all step components are accessible

---

## 8. FILE STATISTICS

- **Total Lines**: 1070
- **State Variables**: 11
- **Refs**: 5
- **Effects**: 9
- **Memoized Values**: 2 (curriculumLexicon, learnedCache)
- **Memoized Functions**: 2 (getVocabTaughtUpToStep, createVocabularyTracker)
- **Handler Functions**: 8
- **Step Types Handled**: 13
- **External Services**: 10
- **External Utils**: 5

---

## CONFIRMATION

**CONFIRMATION: No code was modified. All analysis-only rules were followed.**

This document is a complete read-only analysis of LessonRunner.tsx. No refactoring, optimization, or code changes were made. All observations are documented for future reference.


