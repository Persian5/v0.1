# UNIT-002: Lessons Engine

**Status:** Planned  
**Epic:** EP-002  
**Story Points:** 55  
**Priority:** Critical - Primary product value delivery

---

## Unit Overview

### Purpose
Deliver the core learning experience through interactive, gamified Persian lessons with multiple game types, progression mechanics, and cultural context.

### Scope
- Lesson navigation and structure
- Welcome step (lesson introduction)
- 8 game types: Flashcard, Audio-Meaning, Text-Sequence, Audio-Sequence, Matching, Story Conversation, Final Challenge
- Audio playback system
- Step completion and XP awards
- Lesson completion summaries

### Business Value
- **Primary value proposition** - teaches Persian through engaging games
- Drives user engagement and retention
- Differentiates from competitors (Duolingo doesn't have Persian)
- Cultural authenticity through content and design

### Out of Scope (V1)
- Adaptive difficulty based on performance
- Hints or skip options
- Speech recognition for pronunciation
- Writing practice (Persian script)

---

## Related User Stories

### US-008: Lesson Navigation and Structure
**Status:** Planned → Implemented  
**Priority:** Critical  
**Story Points:** 5

**As a** learner  
**I want to** navigate through lessons in a structured way  
**So that** I can progressively build my Persian skills

**Acceptance Criteria:**
1. Module overview page shows all lessons in a module
2. Lessons displayed with: Number, title, status, XP potential, preview
3. Locked lessons display lock icon
4. Available lessons have "Start" button
5. In-progress lessons have "Continue" button
6. Completed lessons have checkmark and "Review" option
7. Clicking lesson starts at first incomplete step
8. Lesson progress bar shows completion percentage
9. Back button with confirmation if mid-lesson
10. Mobile responsive design

**Implementation:**
- Component: `app/modules/[moduleId]/page.tsx`
- Dynamic routing via Next.js App Router
- Uses `LessonProgressService.getFirstAvailableLesson()`

---

### US-009: Welcome Step (Lesson Introduction)
**Status:** Planned → Implemented  
**Priority:** High  
**Story Points:** 2

**As a** learner  
**I want to** see a lesson introduction  
**So that** I know what I'm about to learn

**Acceptance Criteria:**
1. Welcome step displays: Title, objectives, time, cultural context
2. Persian-themed visual design
3. "Start Lesson" button to proceed
4. No XP awarded (0 points)
5. Can skip on repeated visits
6. Mobile responsive

**Implementation:**
- Component: Part of `LessonRunner` with type: 'welcome'
- Data: Defined in `lib/config/curriculum.ts`

---

### US-010: Flashcard Game
**Status:** Planned → Implemented  
**Priority:** Critical  
**Story Points:** 3

**As a** learner  
**I want to** review vocabulary flashcards with audio  
**So that** I can learn pronunciation and meaning

**Acceptance Criteria:**
1. Displays: Finglish, English, Farsi, phonetic guide
2. Audio play button (auto-play on load)
3. Card flip animation
4. Previous/Next navigation
5. Progress indicator (e.g., "3 / 8 cards")
6. "Continue" after all cards reviewed
7. Audio works on mobile and desktop
8. XP awarded after completing all (2-5 points)
9. Persian motifs in design
10. Mobile responsive

**Implementation:**
- Component: `app/components/games/Flashcard.tsx`
- Audio: `AudioService.playVocabularyAudio()`
- Animation: Framer Motion

---

### US-011: Audio-Meaning Game
**Status:** Planned → Implemented  
**Priority:** Critical  
**Story Points:** 5

**As a** learner  
**I want to** listen to Persian audio and select correct meaning  
**So that** I can improve listening comprehension

**Acceptance Criteria:**
1. Audio auto-plays on load
2. Play button for unlimited replays
3. 4 answer choices (English)
4. 1 correct + 3 semantic distractors
5. Randomized order
6. Correct: Green highlight, success sound, +XP
7. Incorrect: Red highlight, error sound, show correct
8. "Continue" button after answering
9. XP awarded on correct only (idempotent)
10. Track vocabulary attempt
11. Mobile responsive

**Implementation:**
- Component: `app/components/games/AudioMeaning.tsx`
- Service: `WordBankService` for distractors
- Tracking: `VocabularyTrackingService.storeAttempt()`

---

### US-012: Text-Sequence Game (Word Bank)
**Status:** Planned → Implemented  
**Priority:** Critical  
**Story Points:** 8

**As a** learner  
**I want to** build Persian sentences from a word bank  
**So that** I can practice sentence structure

**Acceptance Criteria:**
1. Display English prompt
2. Word bank: Correct words + 5-8 distractors, total 7-13 words
3. Tap words to build sentence
4. Remove words by tapping in answer area
5. Progress counter shows semantic units
6. Submit validates answer (normalize punctuation, synonyms)
7. Correct: Green, success sound, +XP
8. Incorrect: Red, show correct, can retry
9. Phrase detection (don't split multi-word phrases)
10. Capitalize first word automatically
11. Track per-word correctness
12. Mobile responsive

**Implementation:**
- Component: `app/components/games/TextSequence.tsx`
- Service: `WordBankService.generateWordBank()`
- Validation: `WordBankService.validateUserAnswer()`
- Tracking: `VocabularyTrackingService.storeAttempt()` per word

**Technical Notes:**
- Handles synonyms (e.g., "hello" / "hi" / "salam")
- Smart phrase detection
- Capitalization normalization

---

### US-013: Audio-Sequence Game
**Status:** Planned → Implemented  
**Priority:** Critical  
**Story Points:** 8

**As a** learner  
**I want to** listen to Persian audio and build sentence  
**So that** I connect spoken Persian to written form

**Acceptance Criteria:**
1. Audio auto-plays
2. Play button for unlimited replays
3. Display "Build what you hear"
4. Word bank: Correct words + distractors
5. Same interaction as Text-Sequence
6. Progress counter shows semantic units
7. Validation matches audio to text
8. On correct: Show English translation, award XP
9. Track per-word correctness
10. Mobile responsive

**Implementation:**
- Component: `app/components/games/AudioSequence.tsx`
- Same `WordBankService` as Text-Sequence
- Audio: `AudioService.playVocabularyAudio()`

---

### US-014: Matching Game
**Status:** Planned → Implemented  
**Priority:** Critical  
**Story Points:** 5

**As a** learner  
**I want to** match Persian words to English translations  
**So that** I can reinforce vocabulary connections

**Acceptance Criteria:**
1. Display 4-8 pairs (Persian left, English right)
2. Tap one from each side to match
3. Correct: Green, success sound, cards disappear
4. Incorrect: Red shake, cards deselect after 1 sec
5. Lives: 3 lives, lose 1 per incorrect
6. Game ends: All matched (success) OR lives lost (failure)
7. Success: Award XP, success animation, "Continue"
8. Failure: No XP, "Try Again" (resets)
9. Track per-pair correctness
10. Mobile responsive

**Implementation:**
- Component: `app/components/games/Matching.tsx`
- Tracking: `VocabularyTrackingService.storeAttempt()` per pair
- UID: `stepUid` for idempotent XP

---

### US-015: Story Conversation Game
**Status:** Planned → Implemented  
**Priority:** Critical  
**Story Points:** 8

**As a** learner  
**I want to** participate in text-message style conversation  
**So that** I can practice real-world scenarios

**Acceptance Criteria:**
1. Display as iMessage-style conversation
2. Story character messages appear sequentially
3. At choice points: 2-3 Persian response options
4. Each option shows English on tap/hover
5. On selection: User message appears, story continues
6. Correct path: Green highlight, success sound, story progresses
7. Incorrect: Red highlight, error sound, can retry
8. XP awarded once at story completion (sum of all choices)
9. Track per-exchange correctness
10. Cultural context notes at key moments
11. Mobile responsive (feels like texting)

**Implementation:**
- Component: `app/components/games/StoryConversation.tsx`
- Design: Centered title, 60/20/20 split (conversation/context/tips)
- Sticky choice buttons at bottom
- Tracking: Per-exchange correctness

---

### US-016: Final Challenge
**Status:** Planned → Implemented  
**Priority:** High  
**Story Points:** 5

**As a** learner  
**I want to** complete a final challenge  
**So that** I can demonstrate mastery

**Acceptance Criteria:**
1. Series of 3-5 questions mixing game types
2. Questions from current lesson vocabulary
3. Lives: 3 lives total
4. Incorrect: Lose 1 life, show correct, proceed to next
5. Complete with lives: Bonus XP (10-20 points), confetti
6. Lose all lives: No XP, "Try Again" restarts
7. Track overall correctness
8. Mobile responsive

**Implementation:**
- Component: `app/components/games/FinalChallenge.tsx`
- Tracking: `VocabularyTrackingService.storeAttempt()`
- Animation: canvas-confetti

---

### US-017: Lesson Completion and Summary
**Status:** Planned → Implemented  
**Priority:** High  
**Story Points:** 3

**As a** learner  
**I want to** see a summary when I complete a lesson  
**So that** I can celebrate progress

**Acceptance Criteria:**
1. Display: Total XP (animated), words learned, completion checkmark, time spent
2. Show 3-5 key vocabulary words
3. Cultural insight or fun fact
4. CTAs: "Next Lesson", "Review Lesson", "Back to Modules"
5. Success sound and confetti
6. Update lesson status to "completed"
7. Unlock next lesson
8. Mobile responsive

**Implementation:**
- Component: `ModuleCompletion.tsx`
- Service: `LessonProgressService.markLessonCompleted()`
- Animation: CountUpXP, confetti

---

### US-018: Audio Playback System
**Status:** Planned → Implemented  
**Priority:** Critical  
**Story Points:** 3

**As a** learner  
**I want** all Persian audio to play clearly  
**So that** I can learn correct pronunciation

**Acceptance Criteria:**
1. Audio files in `/public/audio/` (MP3)
2. Play button with loading state
3. Visual feedback when playing
4. Error handling
5. Works on desktop (Chrome, Firefox, Safari) and mobile (iOS, Android)
6. Auto-play where appropriate
7. No overlap (stop previous before new)
8. Audio loading doesn't block UI
9. Fallback for unsupported browsers

**Implementation:**
- Service: `lib/services/audio-service.ts`
- Method: `AudioService.playVocabularyAudio(id)`
- Format: MP3 files named by vocabulary ID
- Playback: HTML5 Audio API

---

## Technical Architecture

### Frontend Components

```
/app/components/
  LessonRunner.tsx              # Orchestrates lesson flow
  LessonHeader.tsx              # Header with XP, progress
  ModuleCompletion.tsx          # Lesson completion summary
  CountUpXP.tsx                 # XP animation component
  
  games/
    Flashcard.tsx               # US-010
    AudioMeaning.tsx            # US-011
    TextSequence.tsx            # US-012
    AudioSequence.tsx           # US-013
    Matching.tsx                # US-014
    StoryConversation.tsx       # US-015
    FinalChallenge.tsx          # US-016
```

### Services

```
/lib/services/
  lesson-progress-service.ts    # Progress tracking
  vocabulary-service.ts         # Vocabulary data
  vocabulary-tracking-service.ts # Per-word tracking
  audio-service.ts              # Audio playback
  xp-service.ts                 # XP awards
  word-bank-service.ts          # Word bank generation
```

### Key Functions

**LessonProgressService:**
- `getFirstAvailableLesson()` - Find next lesson
- `markLessonCompleted(moduleId, lessonId)` - Mark complete
- `getProgress(moduleId, lessonId)` - Get progress %

**VocabularyService:**
- `findVocabularyById(id)` - Get vocabulary item
- `getVocabularyForLesson(lessonId)` - Get all lesson vocab

**WordBankService:**
- `generateWordBank(expectedTranslation, sequenceIds, vocabIds)` - Generate word bank
- `validateUserAnswer(userWords, expectedTranslation, sequenceIds)` - Validate answer
- `clearCache()` - Clear LRU cache

**AudioService:**
- `playVocabularyAudio(vocabularyId)` - Play audio file

---

## Data Models

### `user_lesson_progress`
```sql
CREATE TABLE user_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  module_id text NOT NULL,
  lesson_id text NOT NULL,
  status text NOT NULL DEFAULT 'locked',
  progress_percent integer NOT NULL DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id, lesson_id)
);
```

### `vocabulary_attempts`
```sql
CREATE TABLE vocabulary_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  vocabulary_id text NOT NULL,
  game_type text NOT NULL,
  module_id text,
  lesson_id text,
  step_uid text,
  is_correct boolean NOT NULL,
  time_spent_ms integer,
  context_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Curriculum Data (Source of Truth)
```typescript
// lib/config/curriculum.ts
interface Lesson {
  id: string;
  title: string;
  steps: LessonStep[];
}

interface LessonStep {
  type: 'welcome' | 'flashcard' | 'audio-meaning' | 'text-sequence' | 
        'audio-sequence' | 'matching' | 'story-conversation' | 'final-challenge';
  points: number;
  data: StepData;
}
```

---

## Dependencies

### Depends On
- **UNIT-001 (Auth):** Requires authenticated user for progress tracking
- **UNIT-003 (XP/Progress):** Requires XP system for awarding points
- **Curriculum Data:** `lib/config/curriculum.ts` (already exists)
- **Audio Files:** `/public/audio/` directory (already exists)

### Depended On By
- **UNIT-007 (Review Mode):** Requires completed lessons for vocabulary pool
- **UNIT-006 (Dashboard):** Displays lesson progress stats
- **UNIT-004 (Payments):** Paywall enforcement on premium lessons

**Critical Path Position:** Core product value - must be stable before launch

---

## Security Considerations

### Input Validation
- Sanitize user input in word bank games (prevent XSS)
- Validate answer submissions server-side (future enhancement)

### RLS Policies
- Users can only access their own progress
- `user_lesson_progress` filtered by `user_id = auth.uid()`
- `vocabulary_attempts` filtered by `user_id = auth.uid()`

### XP Security
- XP awards are idempotent (stepUid prevents double-awarding)
- XP validation server-side via XpService

### Audio Files
- Audio files are public (in `/public/audio/`)
- No sensitive data in audio filenames
- Future: Could move to Supabase Storage with access control

---

## Testing Strategy

### Unit Tests
- ✅ WordBankService (7 tests already exist)
  - Phrase detection
  - Synonym handling
  - Sub-phrase filtering
  - Distractor generation
  - Answer validation
- Game component logic (future)
- Progress calculation

### Integration Tests
- Lesson flow: Start → Complete all steps → XP awarded → Progress updated
- Word bank generation: Curriculum → WordBankService → Valid word bank
- Audio playback: Click play → Audio loads → Audio plays
- XP idempotency: Complete step → Re-attempt → No duplicate XP

### E2E Tests
1. **Complete Lesson Flow:**
   - Start Module 1 Lesson 1
   - Complete all 8 game types
   - See lesson completion summary
   - XP awarded correctly
   - Next lesson unlocked

2. **Audio Games:**
   - Audio auto-plays
   - Can replay audio
   - Answer validation works
   - XP awarded on correct

3. **Word Bank Games:**
   - Word bank generated correctly (7-13 words)
   - Can build answer by selecting words
   - Answer validation works
   - Per-word tracking accurate

4. **Matching Game:**
   - Can match pairs
   - Lives system works
   - Game over on 3 incorrect
   - XP awarded on success

5. **Story Conversation:**
   - Story progresses on correct choices
   - Can retry incorrect choices
   - XP awarded at completion

### Manual Testing Checklist
- [ ] Complete Module 1 Lesson 1 end-to-end
- [ ] Test all 8 game types
- [ ] Verify audio playback on mobile (iOS Safari, Android Chrome)
- [ ] Verify audio playback on desktop (Chrome, Firefox, Safari)
- [ ] Test word bank games (no duplicates, correct sizing)
- [ ] Test matching game (lives system, game over)
- [ ] Test story conversation (choice buttons, progression)
- [ ] Verify XP awards are idempotent (back button, retry)
- [ ] Verify vocabulary tracking (per-word correctness)
- [ ] Test on small screen (iPhone SE)
- [ ] Test on large screen (iPad Pro, desktop)

---

## Implementation Notes

### Current Status
- ✅ All 8 game types implemented
- ✅ Lesson navigation and structure complete
- ✅ Audio playback system working
- ✅ XP award system idempotent
- ✅ Vocabulary tracking implemented
- ✅ WordBankService with unit tests
- ✅ Progress tracking functional

### Remaining Work (Before Launch)
1. **Testing (6 hours):**
   - Comprehensive manual testing on Module 1
   - Audio playback verification on mobile devices
   - Word bank edge cases (duplicates, sizing)
   - XP idempotency verification

2. **Polish (3 hours):**
   - Loading states for audio
   - Error messages for failed audio
   - Progress counter improvements
   - Mobile UX refinements

**Total Remaining: ~9 hours**

### Gotchas & Best Practices

**Gotcha #1: Audio Playback on Mobile**
- iOS Safari requires user interaction for audio (auto-play may fail)
- Solution: Show play button, don't rely solely on auto-play
- Test on real iOS devices, not just emulator

**Gotcha #2: Word Bank Duplicates**
- Early versions had duplicate words in word bank
- Solution: `WordBankService` now deduplicates and ensures 7-13 unique words
- Test edge cases (small vocabulary sets)

**Gotcha #3: XP Double-Awarding**
- Back button could re-award XP
- Solution: `stepUid` v2 system ensures idempotency
- Format: `v2-moduleId-lessonId-gameType-stepIndex`

**Gotcha #4: Phrase Detection**
- "how are you" was splitting into separate words
- Solution: Treat any vocabulary with space as a phrase
- Filter sub-words if phrase is in correct answer

**Best Practice #1: StepUid Consistency**
- All games must generate consistent stepUid
- Format must match across retries and sessions
- Test with back button and refresh

**Best Practice #2: Vocabulary Tracking**
- Track every attempt (correct and incorrect)
- Store context data (distractors, position, game type)
- Enable future analytics and adaptive learning

**Best Practice #3: Component Memoization**
- Use React.memo for expensive game components
- Use useMemo for word bank generation
- Avoid unnecessary re-renders during gameplay

**Best Practice #4: Error Boundaries**
- Wrap game components in error boundaries
- Graceful fallback if game fails to load
- Log errors for debugging

---

## Performance Considerations

### Audio Loading
- Preload audio files (future enhancement)
- Show loading state while audio loads
- Cache audio in browser (automatic via browser)

### Component Rendering
- Memoize expensive calculations (word bank, shuffling)
- Use React.memo on game components
- Lazy load game components (code splitting)

### Word Bank Generation
- LRU cache (100 entries) in WordBankService
- Cache key: `JSON.stringify({ expectedTranslation, sequenceIds, vocabIds })`
- Manual cache clear on curriculum changes

### Progress Updates
- Optimistic UI updates (show progress immediately)
- Debounce progress saves (batch updates)
- Use Supabase RLS for automatic filtering

---

## Monitoring & Observability

### Metrics to Track
- Lesson completion rate (% who finish lessons)
- Drop-off points (which steps users quit)
- Average time per lesson
- Average time per game type
- XP earned per lesson
- Vocabulary mastery rate

### Per-Game Metrics
- Audio-Meaning: Correct answer rate, replays per question
- Text-Sequence: Word bank correctness, time to complete
- Audio-Sequence: Same as text-sequence + audio replays
- Matching: Match accuracy, lives remaining
- Story Conversation: Correct path rate, retries per exchange
- Final Challenge: Pass rate, lives remaining

### Error Monitoring
- Audio playback failures (by browser, device)
- Word bank generation errors
- XP transaction failures
- Progress update failures
- Tracking service errors

### Analytics Events (Future)
- `lesson_started`
- `lesson_completed`
- `step_completed`
- `game_type_completed`
- `audio_played`
- `word_bank_generated`
- `answer_submitted`

---

## Deployment Checklist

- [ ] All audio files uploaded to `/public/audio/`
- [ ] Curriculum data finalized in `lib/config/curriculum.ts`
- [ ] All game components tested
- [ ] XP idempotency verified
- [ ] Vocabulary tracking tested
- [ ] WordBankService cache working
- [ ] Progress updates reliable
- [ ] Mobile audio playback verified (iOS Safari, Android Chrome)
- [ ] Desktop audio playback verified (Chrome, Firefox, Safari)
- [ ] RLS policies enabled on `user_lesson_progress` and `vocabulary_attempts`
- [ ] Error boundaries in place
- [ ] Loading states for all async operations
- [ ] Error messages user-friendly
- [ ] Module 1 fully tested end-to-end
- [ ] Performance optimized (memoization, caching)

---

## Success Criteria

UNIT-002 is complete when:
1. ✅ Users can navigate lesson structure
2. ✅ All 8 game types work correctly
3. ✅ Audio playback reliable on all platforms
4. ✅ XP awards are idempotent (no double-awarding)
5. ✅ Vocabulary tracking accurate (per-word correctness)
6. ✅ Word bank generation produces valid banks (7-13 words, no duplicates)
7. ✅ Progress tracking updates correctly
8. ✅ Lesson completion summaries display
9. ✅ Mobile responsive on iPhone and Android
10. ✅ No critical bugs in Module 1 lessons
11. ✅ Performance acceptable (no lag, smooth animations)
12. ✅ All E2E tests passing

---

**End of UNIT-002: Lessons Engine**
