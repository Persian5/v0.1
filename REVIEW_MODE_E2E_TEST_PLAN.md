# Review Mode Backend - End-to-End Test Plan

## Steps 95-100: Comprehensive Testing

### ✅ Pre-Testing Checklist

**Database Migration:**
- [ ] Run migration `20250102000000_review_xp_tracking.sql` in Supabase
- [ ] Verify columns exist: `review_xp_earned_today`, `review_xp_reset_at`, `timezone`
- [ ] Verify existing users have correct defaults (0, null, 'America/Los_Angeles')

---

## Step 95: End-to-End Test - All Games with All Filters

### Test 1: Memory Game

**Setup:**
1. Complete at least 1 lesson to have vocabulary
2. Navigate to `/review`
3. Click "Memory Game"
4. Select filter: "All Learned Words"

**Expected:**
- [ ] Filter modal appears
- [ ] Can select filter
- [ ] Navigates to `/review/memory-game?filter=all-learned`
- [ ] Game loads with vocabulary
- [ ] Cards display correctly (4x2 grid for 8 words)
- [ ] Can flip cards
- [ ] Correct matches work
- [ ] Wrong matches shake and lose life
- [ ] XP awarded (1 XP per correct match)
- [ ] Stats update correctly
- [ ] Exit button works

**Repeat for filters:**
- [ ] "Mastered Words"
- [ ] "Words to Review"

**Edge Cases:**
- [ ] No vocabulary available → Shows message
- [ ] Game over → Can play again
- [ ] XP cap reached → Shows message once

---

### Test 2: Unlimited Audio Definitions

**Setup:**
1. Navigate to `/review`
2. Click "Unlimited Audio Definitions"
3. Select filter: "All Learned Words"

**Expected:**
- [ ] Filter modal appears
- [ ] Can select filter
- [ ] Navigates to `/review/audio-definitions?filter=all-learned`
- [ ] Game loads with vocabulary
- [ ] Audio plays correctly
- [ ] Options display correctly
- [ ] Correct answer → Auto-advances to next question
- [ ] Wrong answer → Shows feedback, can retry
- [ ] Stats update (correct/wrong/streak)
- [ ] XP awarded (1 XP per correct)
- [ ] Unlimited mode works (cycles through vocabulary)
- [ ] Exit button works

**Repeat for filters:**
- [ ] "Mastered Words"
- [ ] "Words to Review"

**Edge Cases:**
- [ ] No vocabulary → Shows message
- [ ] XP cap reached → Shows message once
- [ ] Audio playback fails → Graceful fallback

---

### Test 3: Matching Marathon

**Setup:**
1. Navigate to `/review`
2. Click "Matching Marathon"
3. Select filter: "All Learned Words"

**Expected:**
- [ ] Filter modal appears
- [ ] Can select filter
- [ ] Navigates to `/review/matching-marathon?filter=all-learned`
- [ ] Game loads with vocabulary
- [ ] Round 1 starts with 3 pairs
- [ ] Can match pairs correctly
- [ ] Wrong match → Loses life
- [ ] Round completes → Advances to next round
- [ ] Difficulty increases (more pairs per round)
- [ ] Round counter increments
- [ ] XP awarded (1 XP per round)
- [ ] Exit button works

**Repeat for filters:**
- [ ] "Mastered Words"
- [ ] "Words to Review"

**Edge Cases:**
- [ ] No vocabulary → Shows message
- [ ] Game over → Can play again
- [ ] XP cap reached → Shows message once

---

### Test 4: Persian Word Rush

**Setup:**
1. Navigate to `/review`
2. Click "Persian Word Rush"
3. Select filter: "All Learned Words"

**Expected:**
- [ ] Filter modal appears
- [ ] Can select filter
- [ ] Navigates to `/review/word-rush?filter=all-learned`
- [ ] Game loads with vocabulary
- [ ] Words slide across screen
- [ ] Can select correct answer
- [ ] Correct answer → XP awarded
- [ ] Wrong answer → Loses life
- [ ] Combo system works
- [ ] Exit button works

**Repeat for filters:**
- [ ] "Mastered Words"
- [ ] "Words to Review"

**Edge Cases:**
- [ ] No vocabulary → Shows message
- [ ] Game over → Can play again
- [ ] XP cap reached → Shows message once

---

## Step 96: XP Cap Testing

### Test Scenarios:

**Setup:**
1. Ensure user has less than 1000 review XP today
2. Play review games until XP cap is reached

**Expected:**
- [ ] XP increases normally (1 XP per correct)
- [ ] When cap reached (1000/1000):
  - [ ] Message appears: "Daily review XP cap reached (1000/1000). You can continue playing, but no more XP will be awarded in review mode for today."
  - [ ] Message shows only once (not repeatedly)
  - [ ] Can continue playing (no XP awarded)
  - [ ] Correct sound still plays after cap
- [ ] Next day (after midnight user timezone):
  - [ ] XP resets to 0
  - [ ] Can earn XP again

**Edge Cases:**
- [ ] Timezone detection works correctly
- [ ] Reset happens at midnight user timezone (not UTC)
- [ ] Multiple games don't double-count XP

---

## Step 97: Performance Tracking Testing

### Test Scenarios:

**Setup:**
1. Play each review game type
2. Get some correct, some incorrect
3. Check database

**Expected:**
- [ ] All attempts tracked in `vocabulary_attempts`:
  - [ ] `game_type` correct (review-memory-game, review-audio-definitions, etc.)
  - [ ] `is_correct` accurate
  - [ ] `time_spent_ms` recorded
  - [ ] `context_data.reviewMode = true`
- [ ] Performance updates in `vocabulary_performance`:
  - [ ] `total_attempts` increments
  - [ ] `total_correct` / `total_incorrect` accurate
  - [ ] `consecutive_correct` updates correctly
  - [ ] `mastery_level` calculates correctly
- [ ] No remediation triggered (review mode attempts don't trigger remediation)

**Edge Cases:**
- [ ] Fast clicks don't create duplicate entries
- [ ] Browser back button doesn't double-track
- [ ] Multiple games simultaneously don't interfere

---

## Step 98: Filter System Testing

### Test Scenarios:

**All Learned Words Filter:**
- [ ] Returns all words with `total_attempts > 0`
- [ ] Sorted by `last_seen_at` DESC
- [ ] Works across all games

**Mastered Words Filter:**
- [ ] Returns words with `consecutive_correct >= 5` OR `mastery_level >= 5`
- [ ] Sorted by `updated_at` DESC
- [ ] Works across all games

**Words to Review Filter:**
- [ ] Returns words with `total_attempts >= 2`
- [ ] Sorted by error rate DESC (highest error rate first)
- [ ] Top 10-50 words (depending on game)
- [ ] Works across all games

**Edge Cases:**
- [ ] No words match filter → Shows message
- [ ] Filter persists in URL
- [ ] Browser back/forward works correctly
- [ ] Direct URL access with filter works

---

## Step 99: Performance & Edge Cases

### Performance Testing:

**Vocabulary Loading:**
- [ ] Large vocabulary sets (100+ words) load quickly
- [ ] No console errors
- [ ] No memory leaks after multiple games

**Game State:**
- [ ] Game state resets correctly on comeback
- [ ] No stale state between games
- [ ] Cleanup on unmount works

**Concurrent Operations:**
- [ ] Multiple XP awards don't race condition
- [ ] Database updates atomic
- [ ] UI updates smooth

### Edge Cases:

**Authentication:**
- [ ] Not logged in → Shows auth modal
- [ ] Email not verified → Shows verify modal
- [ ] Session expires → Handles gracefully

**Network Issues:**
- [ ] Offline → Shows error, can retry
- [ ] Slow connection → Loading states work
- [ ] API errors → Graceful fallback

**Browser:**
- [ ] Browser back button works
- [ ] Refresh preserves game state (if applicable)
- [ ] Mobile responsive (all games)
- [ ] Touch interactions work

---

## Step 100: Final Verification

### Complete Flow Test:

1. **New User Flow:**
   - [ ] Complete first lesson
   - [ ] Navigate to `/review`
   - [ ] See all games available
   - [ ] Select filter → Play game
   - [ ] XP awarded correctly
   - [ ] Performance tracked

2. **Returning User Flow:**
   - [ ] Login
   - [ ] Navigate to `/review`
   - [ ] See games with vocabulary count
   - [ ] Play multiple games
   - [ ] XP cap works
   - [ ] Exit and return → Games work correctly

3. **Cross-Game Flow:**
   - [ ] Play Memory Game
   - [ ] Exit → Return to `/review`
   - [ ] Play Audio Definitions
   - [ ] Exit → Return to `/review`
   - [ ] Play Matching Marathon
   - [ ] Exit → Return to `/review`
   - [ ] Play Word Rush
   - [ ] All games work correctly

### Database Verification:

- [ ] Check `user_profiles`:
  - [ ] `review_xp_earned_today` updates correctly
  - [ ] `review_xp_reset_at` set correctly
  - [ ] `timezone` set correctly (browser timezone)

- [ ] Check `vocabulary_performance`:
  - [ ] All words tracked correctly
  - [ ] Mastery calculations correct
  - [ ] SRS dates set correctly

- [ ] Check `vocabulary_attempts`:
  - [ ] All attempts logged
  - [ ] `reviewMode = true` in context_data
  - [ ] No duplicate entries

---

## Manual Test Checklist Summary

**Quick Smoke Test (5 minutes):**
1. Navigate to `/review`
2. Click "Memory Game"
3. Select "All Learned Words"
4. Play game, get 1 correct match
5. Verify XP awarded
6. Exit game
7. Check database: `review_xp_earned_today = 1`

**Full Test (30 minutes):**
- Test all 4 games
- Test all 3 filters
- Test XP cap
- Test performance tracking
- Test edge cases

**Production Readiness (1 hour):**
- Complete all above tests
- Test on mobile device
- Test across browsers
- Verify database integrity
- Check console for errors

---

## Known Issues / Notes

- Timezone calculation is simplified (may need refinement for DST)
- XP cap message shows once per session (may need to persist across refreshes)
- Game state resets on comeback (by design)

---

## Next Steps After Testing

1. Fix any bugs found
2. Optimize performance if needed
3. Add error boundaries
4. Add analytics tracking
5. Document user-facing features

