# UNIT-007: Review Mode

**Status:** Planned  
**Epic:** EP-007  
**Story Points:** 34  
**Priority:** High - Retention driver

---

## Unit Overview

### Purpose
Provide unlimited practice through 4 fun review game modes with spaced repetition and daily XP cap.

### Scope
- Review hub with 4 game mode cards
- Vocabulary filter selection (all, mastered, hard words)
- Audio Definitions game
- Memory Game (round-by-round)
- Word Rush game
- Matching Marathon game
- Daily review XP cap (1000 XP)
- Review session tracking

### Business Value
- Increases retention (reason to return daily)
- Reinforces learning (spaced repetition)
- Unlimited practice without content creation
- Differentiates from competitors (engaging review)

### Out of Scope (V1)
- Custom vocabulary sets
- Timed challenges
- Multiplayer modes

---

## Related User Stories

### US-045: Review Hub / Navigation
**Status:** Planned → Implemented  
**Priority:** High  
**Story Points:** 3

**Acceptance Criteria:**
1. Review hub displays 4 game mode cards: Audio Definitions, Memory Game, Word Rush, Matching Marathon
2. Each card: Title, description, icon, "Play" button
3. Header shows daily review XP progress: "Review XP Today: 245 / 1000"
4. When cap reached: Show message
5. Games still playable after cap (for practice)
6. Navigation link: "Review Mode" in main menu
7. Mobile responsive (stacked cards)

**Implementation:**
- Page: `app/review/page.tsx`
- Component: Review hub with game cards

---

### US-046: Vocabulary Filter Selection
**Status:** Planned → Implemented  
**Priority:** High  
**Story Points:** 3

**Acceptance Criteria:**
1. Before starting game, show filter modal: "All Learned Words", "Mastered Words", "Words to Review" (hard words)
2. Display count for each filter
3. User selects one, clicks "Start Game"
4. Game loads with vocabulary from selected filter
5. Filter persists for session
6. Can change filter from review hub
7. Mobile responsive (full-screen modal)

**Implementation:**
- Modal component before game start
- Filter stored in URL params or state

---

### US-047: Audio Definitions Game (Review)
**Status:** Planned → Implemented  
**Priority:** High  
**Story Points:** 5

**Acceptance Criteria:**
1. Audio auto-plays, play button for replays
2. 4 answer choices (English), always 4 unique
3. Choices shuffle once per question
4. Lives: 3 lives
5. Correct: Green, success sound, +1 XP (if under cap), auto-advance
6. Incorrect: Red, lose 1 life, stays on question for retry
7. Game ends when lives lost
8. Game over: Show correct/total, XP earned, "Play Again"/"Back to Review"
9. Vocabulary based on filter
10. Track attempts (no remediation in review mode)
11. Responsive UI with Iran flag colors

**Implementation:**
- Page: `app/review/audio-definitions/page.tsx`
- Component: `app/components/review/ReviewAudioDefinitions.tsx`
- Service: `ReviewSessionService.awardReviewXp()`

---

### US-048: Memory Game (Review)
**Status:** Planned → Implemented  
**Priority:** High  
**Story Points:** 8

**Acceptance Criteria:**
1. Round-by-round: 2 pairs → 3 → ... → 8 pairs max
2. Preview phase (3 seconds): All cards face-up, countdown "3...2...1...Start!"
3. Game phase: Cards face-down, click to match
4. Correct: Lock, +1 XP
5. Incorrect: Flip back, lose 1 life
6. Lives: 3 per round, reset each round
7. Round completion: Auto-advance to next round
8. Game over: All lives lost
9. Session stats: Correct/total, XP earned, rounds completed
10. Grid layout: 2x2, 3x2, 4x4 (responsive)
11. Vocabulary based on filter

**Implementation:**
- Page: `app/review/memory-game/page.tsx`
- Component: `app/components/review/ReviewMemoryGame.tsx`
- Tracking: Correct matches only (not incorrect guesses)

---

### US-049: Word Rush Game
**Status:** Planned → Basic Implementation  
**Priority:** Low  
**Story Points:** 5

**Acceptance Criteria:**
1. Fast-paced: Match words in 60 seconds
2. Display Persian (Finglish)
3. 4 English translations
4. Correct: +1 point, next word
5. Incorrect: -1 life, next word
6. Lives: 3 total
7. Timer: 60 → 0 seconds
8. Game ends: Timer runs out OR lives lost
9. Final score: Correct answers count

**Implementation:**
- Page: `app/practice/word-rush/page.tsx`
- Component: `app/components/games/WordRush.tsx`

---

### US-050: Matching Marathon Game
**Status:** Planned → Implemented  
**Priority:** High  
**Story Points:** 5

**Acceptance Criteria:**
1. Round-by-round: Start with 2 pairs, increase by 1 each round
2. Each round: Persian left, English right cards
3. Correct: Cards disappear, +1 XP
4. Incorrect: Red shake, lose 1 life
5. Lives: 3 per round, reset each round
6. Round completion: Auto-advance
7. Game over: All lives lost
8. Session stats: Correct matches, rounds completed, XP earned

**Implementation:**
- Page: `app/review/matching-marathon/page.tsx`
- Component: `app/components/review/ReviewMatchingMarathon.tsx`

---

### US-051: Daily Review XP Cap (1000 XP)
**Status:** Planned → Implemented  
**Priority:** High  
**Story Points:** 3

**Acceptance Criteria:**
1. Track `review_xp_earned_today` in `user_profiles`
2. Track `review_xp_reset_at` (timestamp)
3. Reset logic: If `review_xp_reset_at` is yesterday (user's timezone), reset to 0
4. On review correct answer:
   - If `< 1000`: Award 1 XP, increment counter
   - If `>= 1000`: Award 0 XP, show cap message once
5. Cap message: "Daily review XP cap reached (1000/1000). You can continue playing."
6. User can keep playing after cap
7. Lesson XP NOT rate-limited

**Implementation:**
- Service: `ReviewSessionService.awardReviewXp()`
- Timezone: `user_profiles.timezone`
- Function: `initializeUserTimezone()` on app load

---

### US-052: Review Session Tracking
**Status:** Planned → Implemented  
**Priority:** Medium  
**Story Points:** 2

**Acceptance Criteria:**
1. Track in `user_profiles`: `review_xp_earned_today`, `review_xp_reset_at`, `timezone`
2. Track in `vocabulary_attempts`: Game type, correct/incorrect, context data
3. Aggregate analytics: Most-played game, avg session length, review XP trends

**Implementation:**
- Already tracking in database
- Analytics queries (future dashboard)

---

## Technical Architecture

### Pages
```
/app/review/
  page.tsx                      # Review hub
  audio-definitions/page.tsx    # Audio game
  memory-game/page.tsx          # Memory game
  word-rush/page.tsx            # Word rush game
  matching-marathon/page.tsx    # Matching marathon
```

### Components
```
/app/components/review/
  ReviewAudioDefinitions.tsx
  ReviewMemoryGame.tsx
  ReviewWordRush.tsx
  ReviewMatchingMarathon.tsx
```

### Services
```
/lib/services/
  review-session-service.ts         # Daily XP cap, timezone
  vocabulary-tracking-service.ts    # Attempt tracking
  word-bank-service.ts              # Word bank generation
```

---

## Data Models

### `user_profiles` (Review XP)
```sql
review_xp_earned_today integer NOT NULL DEFAULT 0,
review_xp_reset_at timestamptz,
timezone text NOT NULL DEFAULT 'America/Los_Angeles'
```

---

## Dependencies

### Depends On
- **UNIT-002 (Lessons):** Requires completed lessons for vocabulary
- **UNIT-003 (XP/Progress):** For XP tracking

---

## Security Considerations

### XP Cap Enforcement
- Server-side enforcement (not client-side)
- Timezone handling prevents exploits

### RLS
- Users see only their own review data

---

## Testing Strategy

### E2E Tests
1. Play all 4 games
2. Hit XP cap (1000 XP)
3. Verify no more XP awarded
4. Verify games still playable

---

## Implementation Notes

### Current Status
- ✅ All 4 games implemented
- ✅ Daily XP cap working
- ✅ Vocabulary filtering working
- ✅ Review hub complete
- ⚠️ Minor polish needed

### Remaining Work
- None (all review games functional)

---

## Success Criteria

UNIT-007 is complete when:
1. ✅ All 4 games work
2. ✅ Daily XP cap enforced
3. ✅ Vocabulary filtering works
4. ✅ Review hub accessible
5. ✅ Mobile responsive

---

**End of UNIT-007: Review Mode**
