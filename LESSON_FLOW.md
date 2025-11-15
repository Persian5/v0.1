# Lesson Flow - Complete Lifecycle Documentation

**PHASE 1 — Reading LessonRunner, no code changes.**

This document explains how lessons work from start to finish, in plain English. No technical jargon, just the flow of what happens when a user learns.

---

## THE BIG PICTURE: What Happens in a Lesson

A lesson is like a guided tour through Persian phrases and grammar. You start at step 0, work through flashcards, quizzes, and exercises, and when you finish all steps, the lesson marks itself complete and you move on.

**The journey**: Start → Step 1 → Step 2 → ... → Step N → Complete → Next Lesson

But there's more happening behind the scenes: XP is being awarded, vocabulary is being tracked, and if you struggle with a word, you get extra practice (remediation).

---

## PART 1: THE LESSON LIFECYCLE (Start to Finish)

### When the Lesson Starts

**What happens first:**

1. **LessonRunner receives a list of steps** from the parent component
   - These steps come from the curriculum config
   - Each step has a type: flashcard, quiz, input, matching, grammar-intro, etc.

2. **Component initializes its memory**
   - Sets current step index to 0 (`idx = 0`)
   - Clears all remediation queues (empty arrays)
   - Sets remediation mode to OFF
   - Loads vocabulary data for this lesson

3. **Builds performance caches**
   - Scans entire curriculum ONCE to build a vocabulary lookup map
   - Pre-computes "learned so far" for each step (what vocab/suffixes/connectors are available at step 5, step 10, etc.)
   - This happens once and is reused (performance optimization)

4. **Renders the first step**
   - Looks at `steps[0]` to see what type it is
   - Renders the appropriate component (Flashcard, Quiz, etc.)
   - Passes the step data to that component

### During the Lesson (Step by Step)

**The main loop:**

1. **User sees current step** (`steps[idx]`)
   - Component renders based on step type
   - User interacts (flips card, answers quiz, types input, etc.)

2. **User completes the step**
   - Step component calls its completion handler
   - Handler receives whether answer was correct or not

3. **Answer evaluation happens**
   - If correct: XP is awarded, vocabulary is tracked, step advances
   - If incorrect: Vocabulary is still tracked, but step doesn't advance (user can retry)

4. **Vocabulary tracking fires**
   - Every answer (correct or wrong) is logged to database
   - If wrong answer: Counter increments for that vocabulary word
   - If counter reaches 2+: Word is added to "pending remediation" queue

5. **Step advances**
   - If answer was correct: Move to next step (`idx` increments)
   - If answer was wrong: Stay on same step, but increment retry counter (forces component to re-render with fresh state)

6. **Progress updates**
   - Parent component is notified: "You're now on step 5 of 20"
   - Progress bar updates: "25% complete"
   - View type updates: "Currently showing a quiz"

7. **Repeat until all steps done**
   - Loop continues until `idx >= steps.length`

### When the Lesson Ends

**Completion sequence:**

1. **User finishes last step**
   - `idx` becomes equal to `steps.length`
   - LessonRunner detects: "All steps complete"

2. **Lesson completion effect triggers** (async)
   - **PHASE 1**: Mark lesson complete in database
     - Calls `LessonProgressService.markLessonCompleted()`
     - Database writes: "User X completed module1/lesson2"
     - **CRITICAL**: If database write fails → show alert, DON'T navigate (let user retry)
   
   - **PHASE 2**: Verify cache consistency
     - Checks if progress cache was updated
     - If not → manually verify, refresh from database if needed
     - This prevents showing wrong progress after completion
   
   - **PHASE 3**: Sync XP to server
     - Calls `SyncService.forceSyncNow()` to flush XP immediately
     - Wrapped in try-catch (non-critical, won't block if it fails)
     - XP will sync later if this fails
   
   - **PHASE 4**: Navigate to completion page
     - Uses React transition for smooth navigation
     - Goes to `/modules/${moduleId}/${lessonId}/completion?xp=${xp}`
     - Only navigates if lesson was successfully saved

3. **Completion page shows**
   - Displays XP earned
   - Shows "Next Lesson" button
   - User can review or continue

---

## PART 2: STEP PROGRESSION (How Steps Advance)

### The Step Index (`idx`)

**What it is**: A number starting at 0 that tracks which step you're on.

**How it changes**:
- Starts at 0 (first step)
- Increments by 1 when you complete a step correctly
- Decrements by 1 when you click "Previous" button
- Can jump forward/backward if remediation intervenes

### Normal Step Progression

**Flow**:
```
Step 0 (Welcome) → User clicks "Let's Start" → idx becomes 1
Step 1 (Flashcard) → User flips card → idx becomes 2
Step 2 (Quiz) → User answers correctly → idx becomes 3
Step 3 (Input) → User types correctly → idx becomes 4
... continues until idx >= steps.length
```

**Key rule**: Steps only advance when answer is CORRECT.

**What happens on wrong answer**:
- Step does NOT advance (`idx` stays same)
- Quiz component gets new key (forces re-render with fresh state)
- User can retry immediately
- Vocabulary is still tracked (for analytics)

### Step Progression with Remediation

**What remediation is**: Extra practice for words you got wrong 2+ times.

**How it interrupts progression**:

1. **User answers incorrectly 2+ times**
   - Word is added to `pendingRemediation` queue
   - But step continues normally

2. **User gets current question RIGHT**
   - `next()` function checks: "Do I have pending remediation?"
   - If yes: Start remediation mode INSTEAD of advancing step
   - `idx` stays the same (we'll return here after remediation)

3. **Remediation happens**
   - Flashcard for the word
   - Quiz for the word
   - Can have multiple words in queue

4. **After remediation completes**
   - Return to step AFTER the one that triggered remediation
   - `idx` becomes `remediationStartIdx + 1`
   - Normal progression continues

**Example**:
```
Step 5 (Quiz) → User gets "salam" wrong twice → "salam" added to pending queue
Step 5 (Quiz) → User gets current question RIGHT → Remediation starts
Remediation: Flashcard "salam" → Quiz "salam" → Done
Return to Step 6 (next step after Step 5)
```

### Back Button Progression

**What happens when user clicks "Previous"**:

1. **Guard checks**: Is navigation already happening? Is XP animation showing?
   - If yes: Button is disabled, nothing happens

2. **If allowed**:
   - `idx` decrements by 1 (minimum 0)
   - Pending remediation queue is cleared (don't remediate words from previous steps)
   - Step re-renders with previous step's data

3. **XP handling**:
   - If user goes back and re-completes a step → XP handler checks database
   - Database says "already completed" → No duplicate XP awarded
   - This is why XP is idempotent (safe to go back)

**Important**: Going back doesn't undo vocabulary tracking. All attempts are logged for analytics.

---

## PART 3: XP AWARDING AND UPDATING

### How XP Works

**XP is awarded per step**, not per answer. You get XP when you complete a step, not when you answer correctly.

### The XP Awarding Flow

**Step 1: Step component calls XP handler**
- When user completes step, component calls `onXpStart()` handler
- Handler is created fresh for each step (captures current `idx`)

**Step 2: Handler derives step identifier**
- Creates stable step UID: `deriveStepUid(step, idx, moduleId, lessonId)`
- Example: `"v3-flashcard-salam"` or `"v3-quiz-3agmcd"`
- This UID is content-based (not position-based), so inserting new steps doesn't break existing progress

**Step 3: Get XP amount**
- Looks up XP reward for this step type: `XpService.getStepXp(step)`
- Returns: `{ amount: 5, source: "flashcard" }`

**Step 4: Award XP idempotently**
- Calls `XpService.awardXpOnce({ userId, moduleId, lessonId, stepUid, amount, source })`
- **What "idempotent" means**: Safe to call multiple times, only awards once
- Database checks: "Has this user already earned XP for this step UID?"
  - If NO: Insert XP transaction, update user's total XP, return `{ granted: true }`
  - If YES: Do nothing, return `{ granted: false, reason: "already_completed" }`

**Step 5: Optimistic UI update**
- XP service immediately updates UI cache (shows XP instantly)
- Then calls database RPC function
- If database fails → Rollback optimistic update

**Step 6: Return result**
- Handler returns `true` if XP was granted, `false` if already completed
- Component can use this to show/hide XP animation

### XP Update Paths

**Path 1: Normal completion** (first time)
- Step completes → Handler called → Database awards XP → UI updates

**Path 2: Back button + re-complete**
- User goes back → Re-completes step → Handler called → Database says "already completed" → No XP awarded → UI doesn't change

**Path 3: Remediation steps**
- Remediation flashcard/quiz also award XP
- Same idempotent system prevents duplicate XP
- Metadata includes `isRemediation: true` for analytics

**Path 4: Story lessons**
- Story completion awards XP differently (handled by StoryConversation component)
- Uses `addXp` prop directly (not idempotent handler)
- This might need fixing in future

### XP Sync to Server

**When XP syncs**:
- Immediately after lesson completion (via `SyncService.forceSyncNow()`)
- Also syncs periodically in background
- On app refresh/reload

**What syncs**:
- All XP transactions from `user_xp_transactions` table
- Updates `user_profiles.total_xp` field
- Ensures server has latest XP total

---

## PART 4: VOCABULARY TRACKING

### What Gets Tracked

**Every answer** (correct or wrong) is tracked:
- Vocabulary word ID
- Word text (normalized)
- Was answer correct?
- How long did user spend? (timeSpentMs)
- Which step was it? (stepIndex, stepUid)
- What game type? (flashcard, quiz, input, etc.)
- Is this remediation? (isRemediation flag)

### The Tracking Flow

**Step 1: Step component calls vocabulary tracker**
- When user answers, component calls `onVocabTrack(vocabularyId, wordText, isCorrect, timeSpentMs)`
- Tracker is created fresh for each step (captures current `idx`)

**Step 2: Retry prevention check**
- Checks: "Has this vocabulary word already been tracked on this step?"
- Uses `currentStepTrackedRef` (Set of `vocabularyId-stepIndex` keys)
- If already tracked → Still logs to database (analytics), but skips remediation logic
- If not tracked → Mark as tracked, continue

**Step 3: Lookup vocabulary item**
- Finds vocabulary item by ID: `VocabularyService.findVocabularyById(vocabularyId)`
- Normalizes word text: `WordBankService.normalizeVocabEnglish(vocabItem.en)`
- This ensures consistent text format in database

**Step 4: Store attempt to database**
- Calls `VocabularyTrackingService.storeAttempt({ userId, vocabularyId, wordText, gameType, isCorrect, timeSpentMs, moduleId, lessonId, stepUid, contextData })`
- Fire-and-forget (doesn't block UI if database is slow)
- Logs error if fails, but continues anyway

**Step 5: Update performance stats**
- Service updates `vocabulary_performance` table
- Increments counters (total attempts, correct attempts)
- Updates mastery level, next review date (SRS algorithm)
- Updates consecutive streak

**Step 6: Invalidate dashboard cache**
- Calls `SmartAuthService.invalidateDashboardStats()`
- Ensures dashboard shows latest stats when user visits it

**Step 7: Remediation logic** (if incorrect)
- If answer was wrong:
  - Increment `incorrectAttempts[vocabularyId]` counter
  - If counter >= 2 AND word not already triggered:
    - Mark as triggered (prevents duplicate remediation)
    - Add to `pendingRemediation` queue
- If answer was correct:
  - Counter stays same (doesn't reset)
  - Log success

**Step 8: localStorage tracking** (backwards compatibility)
- Also records to localStorage: `VocabularyService.recordCorrectAnswer/recordIncorrectAnswer`
- This is legacy code, might be removable later

### Vocabulary Tracking During Remediation

**Special behavior**:
- If currently in remediation mode:
  - Still tracks to database (analytics)
  - But resets counter to 0 (remediation is the "reset")
  - Doesn't trigger new remediation (can't remediate during remediation)

---

## PART 5: REMEDIATION TRIGGERING

### What Triggers Remediation

**The threshold**: 2+ incorrect attempts for the same vocabulary word.

**The flow**:

1. **User answers incorrectly (first time)**
   - Vocabulary tracker increments counter: `incorrectAttempts["salam"] = 1`
   - No remediation yet (need 2+)

2. **User answers incorrectly (second time)**
   - Vocabulary tracker increments counter: `incorrectAttempts["salam"] = 2`
   - Checks: Is counter >= 2? YES
   - Checks: Has this word already triggered remediation? NO
   - **Action**: Add "salam" to `pendingRemediation` queue
   - Mark word as triggered: `remediationTriggeredRef.current.add("salam")`

3. **User gets current question RIGHT**
   - `next()` function checks: "Do I have pending remediation?"
   - If yes: Start remediation mode
   - Move pending queue → active remediation queue
   - Set `isInRemediation = true`
   - Save current step index: `remediationStartIdx = idx`
   - Set remediation step to 'flashcard'
   - **Don't advance step** (return early)

4. **Remediation begins**
   - Render flashcard for first word in queue
   - User flips card → Calls `completeRemediation()`
   - Moves to quiz step: `setRemediationStep('quiz')`

5. **Quiz step**
   - Render quiz for same word
   - User answers → If correct: `completeRemediation()`
   - If wrong: Stay on quiz (can retry)

6. **After quiz completes**
   - Remove word from queue: `remediationQueue.slice(1)`
   - If queue empty:
     - Exit remediation mode
     - Return to step AFTER remediation started: `setIdx(remediationStartIdx + 1)`
   - If queue not empty:
     - Start next word (flashcard again)

### Remediation State Management

**State variables involved**:
- `remediationQueue`: Active words being remediated (array of vocabulary IDs)
- `pendingRemediation`: Words waiting to be remediated (queued after current step)
- `isInRemediation`: Boolean flag (are we in remediation mode?)
- `remediationStep`: 'flashcard' or 'quiz' (which step of remediation)
- `remediationStartIdx`: Step index where remediation started (for return)
- `incorrectAttempts`: Counter per vocabulary ID
- `remediationTriggeredRef`: Set of words that already triggered (prevents duplicates)

**Why so many variables?**
- Need to track: Which words need remediation? Which step of remediation? Where to return after?
- Need refs for closure consistency (used in callbacks)

### Remediation Safety Checks

**Check 1: Vocabulary exists**
- Before rendering remediation flashcard, checks if vocabulary item exists
- If not found → Exit remediation, clear queue (prevents infinite loop)

**Check 2: Quiz generation succeeds**
- Before rendering remediation quiz, checks if quiz can be generated
- If generation fails → Skip to next word (calls `completeRemediation()`)

**Check 3: Prevent duplicate remediation**
- Uses `remediationTriggeredRef` Set to track which words already triggered
- Prevents same word from triggering remediation multiple times

---

## PART 6: LESSON COMPLETION FIRING

### When Completion Triggers

**The trigger condition**: `idx >= steps.length && !isInRemediation && !storyCompleted`

**What this means**:
- User has completed all steps (`idx` reached the end)
- Not currently in remediation mode
- Not a story lesson (stories have special completion)

### The Completion Sequence

**Phase 1: Mark Lesson Complete** (CRITICAL - blocks on failure)

1. **Call database service**
   - `LessonProgressService.markLessonCompleted(moduleId, lessonId)`
   - This writes to database: "User X completed module1/lesson2"
   - Also updates progress cache

2. **Check result**
   - Returns: `{ success: boolean, dbUpdated: boolean, cacheUpdated: boolean, error?: string }`
   - **If DB write failed**:
     - Show alert: "Failed to save progress. Check internet and try again."
     - **STOP HERE** - Don't navigate, don't sync XP, don't do anything else
     - Let user retry completion

3. **If DB write succeeded**:
   - Continue to Phase 2

**Phase 2: Verify Cache Consistency** (Non-blocking)

1. **Check if cache was updated**
   - If `cacheUpdated === false`:
     - Try to verify cache manually: `verifyLessonCompletionInCache(userId, moduleId, lessonId)`
     - If verification fails:
       - Refresh progress from database: `SmartAuthService.refreshProgressFromDb()`
     - Log warnings but continue (non-critical)

2. **Why this matters**:
   - Cache inconsistency could show wrong progress
   - But lesson is already saved, so this is just cleanup

**Phase 3: Sync XP** (Non-critical)

1. **Force sync XP to server**
   - `SyncService.forceSyncNow()`
   - Wrapped in try-catch
   - If fails: Log warning, continue anyway
   - XP will sync later if this fails

2. **Why non-critical**:
   - Lesson completion is the important part
   - XP sync can happen in background

**Phase 4: Navigate** (Final step)

1. **Navigate to completion page**
   - Uses React transition: `startTransition(() => router.push(...))`
   - URL: `/modules/${moduleId}/${lessonId}/completion?xp=${xp}`
   - Only navigates if lesson was successfully saved (Phase 1 succeeded)

2. **Completion page shows**:
   - XP earned display
   - "Next Lesson" button
   - Lesson summary

### Story Lesson Completion (Special Case)

**What's different**: Story lessons bypass normal completion flow.

**Flow**:
1. StoryConversation component calls `handleStoryComplete()`
2. Sets `storyCompleted = true` (prevents normal completion effect from firing)
3. Updates progress to 100%
4. Marks lesson complete (fire-and-forget, doesn't wait)
5. Navigates directly to completion page

**Why special**: Story lessons go to module completion, not lesson completion (different UI flow).

---

## PART 7: HELPER FUNCTIONS THAT INFLUENCE LESSONRUNNER

### External Services (Called by LessonRunner)

#### **XpService** (`lib/services/xp-service.ts`)
- `getStepXp(step)`: Returns XP reward for step type
- `awardXpOnce(options)`: Awards XP idempotently (database enforces once-per-step)
- `getReward(rewardType)`: Legacy function for activity-specific rewards

**What it does**: Manages all XP logic, database writes, optimistic updates
**Influence**: Determines how much XP user earns, prevents duplicate XP

#### **LessonProgressService** (`lib/services/lesson-progress-service.ts`)
- `markLessonCompleted(moduleId, lessonId)`: Marks lesson complete in DB + cache

**What it does**: Writes lesson completion to database, updates progress cache
**Influence**: Critical for lesson completion - if this fails, lesson doesn't save

#### **VocabularyService** (`lib/services/vocabulary-service.ts`)
- `getReviewVocabulary(moduleId, lessonId)`: Gets review vocabulary for lesson
- `getAllCurriculumVocabulary()`: Gets ALL vocabulary across curriculum
- `findVocabularyById(vocabId)`: Finds vocabulary item by ID
- `generateQuizPrompt(vocab)`: Generates quiz prompt text
- `generateQuizOptions(vocab, allVocab, deterministic)`: Generates quiz options (4 distractors)
- `extractVocabularyFromQuiz(quizData, allVocab)`: Extracts vocabulary ID from quiz step
- `recordCorrectAnswer(vocabId)`: Records to localStorage (legacy)
- `recordIncorrectAnswer(vocabId)`: Records to localStorage (legacy)

**What it does**: All vocabulary lookups, quiz generation, vocabulary extraction
**Influence**: Determines what vocabulary is available, generates remediation quizzes

#### **VocabularyTrackingService** (`lib/services/vocabulary-tracking-service.ts`)
- `storeAttempt(params)`: Stores vocabulary attempt to database, updates performance stats

**What it does**: Logs every answer attempt, updates mastery levels, calculates next review dates
**Influence**: Powers review mode, analytics, SRS algorithm

#### **SyncService** (`lib/services/sync-service.ts`)
- `forceSyncNow()`: Forces immediate XP sync to server

**What it does**: Flushes XP transactions to server
**Influence**: Ensures server has latest XP (non-critical, can fail)

#### **SmartAuthService** (`lib/services/smart-auth-service.ts`)
- `refreshProgressFromDb()`: Refreshes progress cache from database
- `invalidateDashboardStats()`: Invalidates dashboard cache

**What it does**: Cache management for progress and dashboard
**Influence**: Ensures UI shows correct progress/stats

#### **WordBankService** (`lib/services/word-bank-service.ts`)
- `normalizeVocabEnglish(text)`: Normalizes vocabulary English text

**What it does**: Ensures consistent text format in database
**Influence**: Prevents duplicate vocabulary entries due to text variations

### External Utilities (Called by LessonRunner)

#### **deriveStepUid** (`lib/utils/step-uid.ts`)
- `deriveStepUid(step, stepIndex, moduleId, lessonId)`: Generates stable step UID

**What it does**: Creates content-based unique identifier for each step
**Influence**: Critical for XP idempotency - same step always gets same UID

**How it works**:
- Uses step type + content identifier (vocabulary ID, prompt hash, etc.)
- Never uses step index (so inserting steps doesn't break existing progress)
- Versioned (v3) - if logic changes, old UIDs still work

#### **getCurriculumLexicon** (`lib/utils/curriculum-lexicon.ts`)
- `getCurriculumLexicon()`: Gets or builds global curriculum lexicon cache

**What it does**: Pre-computes all vocabulary, suffixes, connectors from entire curriculum
**Influence**: Performance optimization - eliminates repeated curriculum scans

#### **buildLearnedCache** (`lib/utils/curriculum-lexicon.ts`)
- `buildLearnedCache(moduleId, lessonId, steps, lexicon)`: Builds learned cache for lesson

**What it does**: Pre-computes "learned so far" for each step index
**Influence**: Grammar components know what vocab/suffixes/connectors are available at each step

#### **verifyLessonCompletionInCache** (`lib/utils/cache-verification.ts`)
- `verifyLessonCompletionInCache(userId, moduleId, lessonId)`: Verifies lesson completion in cache

**What it does**: Checks if cache shows lesson as complete
**Influence**: Cache consistency check during lesson completion

#### **safeTelemetry** (`lib/utils/telemetry-safe.ts`)
- `safeTelemetry(callback)`: Safe logging wrapper

**What it does**: Wraps logging in try-catch (doesn't break app if logging fails)
**Influence**: Non-critical, just for debugging

#### **getLessonVocabulary** (`lib/config/curriculum.ts`)
- `getLessonVocabulary(moduleId, lessonId)`: Gets vocabulary for specific lesson

**What it does**: Returns vocabulary items for lesson
**Influence**: Determines what vocabulary is available in word banks

---

## PART 8: DANGER ZONES AND INVISIBLE BUG RISKS

### 🔴 CRITICAL: Async Lesson Completion Race Condition

**Location**: Lines 220-305 (lesson completion effect)

**The Risk**:
- Effect triggers when `idx >= steps.length`
- Effect contains async IIFE (immediately invoked function expression)
- If effect triggers twice (React strict mode, rapid state changes), two completion attempts could run simultaneously
- Both try to mark lesson complete → Database handles it, but navigation could happen twice

**Why it's dangerous**:
- User could see completion page twice
- Navigation could happen before DB write completes (if guard fails)
- Progress could be lost if navigation happens too early

**Current Protection**:
- Guard: `idx >= steps.length && !isInRemediation && !storyCompleted`
- Early return if DB write fails (prevents navigation)
- Uses `startTransition` for non-blocking navigation

**Invisible Bug Risk**:
- If React strict mode triggers effect twice → Two async functions run
- Both call `markLessonCompleted()` → Database handles (idempotent), but navigation could duplicate
- **Fix needed**: Add ref guard to prevent double-trigger

---

### 🔴 CRITICAL: Hook Order Dependency

**Location**: Lines 88-356 (all hooks before early returns)

**The Risk**:
- React hooks MUST be called in same order every render
- Early returns break hook order
- If someone adds early return before hooks → React error: "Rendered fewer hooks than expected"

**Why it's dangerous**:
- Breaks entire component
- Hard to debug (error message doesn't point to root cause)
- Easy to introduce accidentally

**Current Protection**:
- Comment at line 359: "CRITICAL: All hooks MUST be before early returns"
- All hooks are before early returns (lines 545-555)

**Invisible Bug Risk**:
- Future developer adds early return before hooks → Component breaks
- **Fix needed**: Consider extracting hooks to custom hook, or add ESLint rule

---

### 🟡 MODERATE: Remediation State Desync

**Location**: Lines 64-68, 82-85, 567-574, 593-629

**The Risk**:
- Multiple state variables control remediation:
  - `remediationQueue` (state)
  - `remediationQueueRef` (ref)
  - `pendingRemediation` (state)
  - `pendingRemediationRef` (ref)
  - `isInRemediation` (state)
  - `remediationStep` (state)
  - `remediationStartIdx` (state)
- State and refs could desync
- Complex state transitions (flashcard → quiz → next word → exit)

**Why it's dangerous**:
- Remediation could get stuck (infinite loop)
- User could see wrong step
- Progress could be lost

**Current Protection**:
- Refs synced via useEffect (lines 88-94)
- Functional updates used where needed (line 600)
- Safety checks in useEffects (lines 331-356)

**Invisible Bug Risk**:
- If state update fails silently → Ref has old value → Callback uses stale state
- **Fix needed**: Consider reducer pattern for remediation state

---

### 🟡 MODERATE: Vocabulary Extraction Heuristics

**Location**: Lines 665-714 (`extractVocabularyFromFailedQuiz`, `getStepVocabularyId`)

**The Risk**:
- Heuristic-based vocabulary extraction (searches prompt/options for vocabulary words)
- May not find vocabulary ID if word not in vocabulary bank
- May find wrong vocabulary ID if multiple words match

**Why it's dangerous**:
- Remediation might not trigger for words that need it
- Wrong vocabulary might get remediated
- Analytics could be wrong

**Current Protection**:
- Falls back to `undefined` if not found
- Uses `allCurriculumVocab` for broader search
- Logs warnings

**Invisible Bug Risk**:
- Quiz mentions word "salam" but vocabulary ID extraction fails → No remediation
- User struggles with word but never gets extra practice
- **Fix needed**: Require vocabulary ID in step data (don't rely on extraction)

---

### 🟡 MODERATE: Retry Prevention Logic

**Location**: Lines 419-450 (`currentStepTrackedRef`)

**The Risk**:
- Uses ref to track vocabulary tracked on current step
- Cleared when step changes (line 216)
- If step changes but vocabulary tracker called → May double-track or miss tracking

**Why it's dangerous**:
- Retries might not be tracked (analytics incomplete)
- Or retries might be double-tracked (wrong stats)

**Current Protection**:
- Cleared in effect when `idx` changes
- Uses `stepKey = ${vocabularyId}-${idx}` for uniqueness

**Invisible Bug Risk**:
- If step changes rapidly (user clicks back/forward) → Ref might not clear in time
- Vocabulary tracker might use stale ref → Wrong tracking behavior
- **Fix needed**: Use state instead of ref, or add debounce

---

### 🟡 MODERATE: Quiz Key Generation Collision

**Location**: Lines 661-663 (`generateQuizKey`)

**The Risk**:
- Key includes `prompt.slice(0, 20)` - first 20 characters of prompt
- If two quizzes have similar prompts → Keys might collide
- Component might not re-render on retry if keys collide

**Why it's dangerous**:
- Quiz component keeps old state on retry
- User sees wrong options or can't retry properly

**Current Protection**:
- Also includes `idx` and `attemptCounter` for uniqueness
- Should be unique enough

**Invisible Bug Risk**:
- If two quizzes in same lesson have identical first 20 chars → Keys collide
- **Fix needed**: Use full prompt hash, or include more unique data

---

### 🟢 LOW: Scroll Management Timing

**Location**: Lines 314-327

**The Risk**:
- Scrolls to top on every step change (including remediation)
- May scroll during animations (jarring UX)

**Why it's dangerous**:
- Poor user experience (content jumps)
- But doesn't break functionality

**Current Protection**:
- Retry logic for WebKit browsers
- Non-blocking

**Invisible Bug Risk**:
- None (just UX issue)

---

### 🟢 LOW: Route Prefetching Timing

**Location**: Lines 307-312

**The Risk**:
- Prefetches completion route at 80% completion
- May prefetch too early (wasted bandwidth) or too late (still slow)

**Why it's dangerous**:
- Wasted bandwidth if user doesn't complete
- But doesn't break functionality

**Current Protection**:
- Non-blocking, only prefetches once

**Invisible Bug Risk**:
- None (just performance optimization)

---

### 🟢 LOW: Legacy XP Handler

**Location**: Lines 716-740 (`createXpHandler`)

**The Risk**:
- Calls `addXp` prop (optimistic update) instead of `XpService.awardXpOnce` (idempotent)
- May award duplicate XP if component re-renders

**Status**: Still used? Check component usage.

**Invisible Bug Risk**:
- If used → Duplicate XP possible
- **Fix needed**: Replace with `createStepXpHandler` or verify not used

---

## PART 9: FLOW SUMMARY (Quick Reference)

### Normal Lesson Flow
```
1. Component mounts → idx = 0
2. Render step[0]
3. User completes step → Answer evaluated
4. If correct: Award XP → Track vocabulary → Advance to step[1]
5. If wrong: Track vocabulary → Stay on step[0] (retry)
6. Repeat steps 2-5 until idx >= steps.length
7. Lesson completion effect fires
8. Mark complete in DB → Sync XP → Navigate to completion page
```

### Remediation Flow
```
1. User answers incorrectly 2+ times → Word added to pendingRemediation
2. User gets current question RIGHT → Remediation starts
3. Render remediation flashcard → User flips → Move to quiz
4. Render remediation quiz → User answers → If correct: Remove from queue
5. If queue empty: Exit remediation → Return to step after remediation started
6. If queue not empty: Start next word (flashcard again)
```

### XP Awarding Flow
```
1. Step completes → Handler called
2. Derive step UID → Get XP amount
3. Call awardXpOnce() → Database checks: Already awarded?
4. If NO: Insert transaction → Update user XP → Return granted=true
5. If YES: Do nothing → Return granted=false
6. UI updates optimistically (shows XP immediately)
```

### Vocabulary Tracking Flow
```
1. User answers → Tracker called
2. Check retry prevention → Lookup vocabulary → Normalize text
3. Store attempt to database (fire-and-forget)
4. Update performance stats → Invalidate dashboard cache
5. If incorrect: Increment counter → If counter >= 2: Add to pending remediation
6. Record to localStorage (legacy)
```

### Lesson Completion Flow
```
1. idx >= steps.length → Completion effect fires
2. PHASE 1: Mark lesson complete in DB (BLOCKS on failure)
3. PHASE 2: Verify cache consistency (non-blocking)
4. PHASE 3: Sync XP to server (non-blocking, can fail)
5. PHASE 4: Navigate to completion page (only if Phase 1 succeeded)
```

---

## CONFIRMATION

**CONFIRMATION: No code was modified. All analysis-only rules were followed.**

This document explains the lesson lifecycle in plain English. No refactoring, optimization, or code changes were made. All observations are documented for understanding the system.

