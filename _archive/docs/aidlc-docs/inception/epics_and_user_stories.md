# Epics and User Stories - Iranopedia Persian Academy

**Date:** November 3, 2025  
**Role:** Product Manager  
**Version:** 1.0  
**Reference:** `/planning/vision-usecase.md`

---

## Table of Contents

1. [Epic EP-001: Authentication](#epic-ep-001-authentication)
2. [Epic EP-002: Lessons Engine](#epic-ep-002-lessons-engine)
3. [Epic EP-003: XP / Progress Tracking](#epic-ep-003-xp--progress-tracking)
4. [Epic EP-004: Payments](#epic-ep-004-payments)
5. [Epic EP-005: Leaderboard](#epic-ep-005-leaderboard)
6. [Epic EP-006: Dashboard](#epic-ep-006-dashboard)
7. [Epic EP-007: Review Mode](#epic-ep-007-review-mode)

---

## User Personas Reference

**Primary Personas:**
- **Sara (24):** Diaspora reconnector, wants to talk to grandparents
- **Amir (38):** Heritage parent, teaching kids Persian
- **Emily (29):** Curious traveler, preparing for Iran trip

**Secondary Personas:**
- **Reza (42):** Adult re-learning childhood language
- **Michael (31):** Non-Iranian partner learning for family
- **Guest:** Anonymous visitor exploring the app

---

## Epic EP-001: Authentication

**Description:** User authentication and account management using Supabase Auth

**Business Value:** Enable secure user accounts for progress tracking, XP accumulation, and subscription management

**Dependencies:** None (foundation for all other epics)

**Estimated Story Points:** 21

---

### US-001: User Registration with Email/Password

**As a** guest visitor  
**I want to** create an account with my email and password  
**So that** I can save my progress and access my lessons from any device

**Priority:** Critical  
**Status:** In-Scope  
**Epic:** EP-001  
**Story Points:** 3

**Acceptance Criteria:**
1. Registration form includes email, password, and password confirmation fields
2. Email validation: Must be valid email format
3. Password validation: Minimum 8 characters, at least one letter and one number
4. Password and confirm password must match
5. Display error messages for invalid inputs
6. On successful registration:
   - Create user account in Supabase Auth
   - Create user profile in `user_profiles` table
   - Send verification email to user
   - Redirect to onboarding or first lesson
7. Show loading state during registration process
8. Handle errors gracefully (email already exists, network errors, etc.)
9. Mobile responsive design

---

### US-002: User Login

**As a** registered user  
**I want to** log in with my email and password  
**So that** I can access my saved progress and continue learning

**Priority:** Critical  
**Status:** In-Scope  
**Epic:** EP-001  
**Story Points:** 2

**Acceptance Criteria:**
1. Login form includes email and password fields
2. Validate email format and password not empty
3. On successful login:
   - Authenticate user via Supabase Auth
   - Create session with JWT token
   - Redirect to dashboard or last visited lesson
4. On failed login:
   - Display error message ("Invalid email or password")
   - Do not reveal which field is incorrect (security)
5. Show loading state during login process
6. "Forgot password?" link visible
7. "Don't have an account? Sign up" link visible
8. Remember session across browser sessions (unless user logs out)
9. Mobile responsive design

---

### US-003: User Logout

**As a** logged-in user  
**I want to** log out of my account  
**So that** I can secure my account when using a shared device

**Priority:** High  
**Status:** In-Scope  
**Epic:** EP-001  
**Story Points:** 1

**Acceptance Criteria:**
1. Logout button/link accessible from account menu or header
2. On logout:
   - Clear user session (Supabase Auth sign out)
   - Clear local storage/cached data
   - Redirect to homepage or login page
3. Show confirmation ("You've been logged out")
4. No authentication required to access homepage/pricing
5. After logout, attempting to access protected pages redirects to login

---

### US-004: Password Reset Flow

**As a** user who forgot my password  
**I want to** reset my password via email  
**So that** I can regain access to my account

**Priority:** High  
**Status:** In-Scope  
**Epic:** EP-001  
**Story Points:** 5

**Acceptance Criteria:**
1. "Forgot password?" link on login page goes to password reset page
2. Password reset form includes email field
3. On submit:
   - Send password reset email via Supabase Auth
   - Display success message ("Check your email for reset link")
   - Do not reveal if email exists in system (security)
4. Reset email includes:
   - Link to password reset confirmation page
   - Link expires after 1 hour
   - Sender is from app domain (proper email config)
5. Password reset confirmation page:
   - Validates reset token
   - Shows new password and confirm password fields
   - Same password validation as registration (8+ chars, letter+number)
6. On successful reset:
   - Update password in Supabase Auth
   - Display success message
   - Redirect to login page
7. Handle expired or invalid tokens with clear error messages
8. Mobile responsive design

**Technical Notes:**
- Requires Resend email configuration (currently not set up - launch blocker)

---

### US-005: Email Verification

**As a** newly registered user  
**I want to** verify my email address  
**So that** the platform knows I'm a real person and can send me important updates

**Priority:** Medium  
**Status:** In-Scope  
**Epic:** EP-001  
**Story Points:** 3

**Acceptance Criteria:**
1. On registration, send verification email via Supabase Auth
2. Verification email includes:
   - Welcome message
   - Verification link
   - Link expires after 24 hours
3. User can still access app without verification (soft requirement)
4. Banner/notice displayed if email not verified
5. "Resend verification email" option available
6. On clicking verification link:
   - Validate token
   - Mark email as verified in Supabase
   - Display success message
   - Redirect to app
7. Handle expired or invalid tokens
8. Mobile responsive email template

**Technical Notes:**
- Requires Resend email configuration

---

### US-006: Session Management

**As a** logged-in user  
**I want** my session to persist across browser tabs and refreshes  
**So that** I don't have to log in every time I visit the app

**Priority:** High  
**Status:** In-Scope  
**Epic:** EP-001  
**Story Points:** 2

**Acceptance Criteria:**
1. JWT token stored securely (httpOnly cookie preferred)
2. Session persists across:
   - Browser refreshes
   - New tabs
   - Browser restarts (until explicit logout)
3. Token refresh handled automatically by Supabase
4. Protected routes redirect to login if no valid session
5. Session expires after 7 days of inactivity
6. On expired session:
   - Redirect to login
   - Display message ("Session expired, please log in again")
   - Remember intended destination (redirect after login)
7. Auth state checks are server-side (secure)

---

### US-007: Account Settings Page

**As a** logged-in user  
**I want to** view and edit my account settings  
**So that** I can update my profile information

**Priority:** Medium  
**Status:** In-Scope  
**Epic:** EP-001  
**Story Points:** 5

**Acceptance Criteria:**
1. Account settings page accessible from user menu
2. Display fields:
   - Email (read-only or with change email flow)
   - Display name (editable)
   - First name (editable)
   - Last name (editable)
3. Save button to update profile
4. On save:
   - Validate inputs (no empty display name)
   - Update `user_profiles` table in Supabase
   - Show success message
   - Reflect changes immediately in UI
5. Change password option (links to password change flow)
6. Account deletion option (future - out of scope for V1)
7. Show loading state while saving
8. Handle errors gracefully
9. Mobile responsive design

---

## Epic EP-002: Lessons Engine

**Description:** Core lesson delivery system with multiple game types and progression

**Business Value:** Primary product value - teaches Persian through engaging, gamified lessons

**Dependencies:** EP-001 (Authentication), EP-003 (XP/Progress Tracking)

**Estimated Story Points:** 55

---

### US-008: Lesson Navigation and Structure

**As a** learner  
**I want to** navigate through lessons in a structured way  
**So that** I can progressively build my Persian skills

**Priority:** Critical  
**Status:** In-Scope  
**Epic:** EP-002  
**Story Points:** 5

**Acceptance Criteria:**
1. Module overview page shows all lessons in a module
2. Lessons displayed with:
   - Lesson number and title
   - Status (locked, available, in-progress, completed)
   - XP potential
   - Preview of what will be learned
3. Locked lessons display lock icon and "Complete previous lessons to unlock"
4. Available lessons have "Start" button
5. In-progress lessons have "Continue" button
6. Completed lessons have checkmark and "Review" option
7. Clicking lesson starts at first incomplete step (or beginning if reviewing)
8. Lesson progress bar shows completion percentage
9. Back button returns to module overview (with confirmation if mid-lesson)
10. Mobile responsive design

---

### US-009: Welcome Step (Lesson Introduction)

**As a** learner  
**I want to** see a lesson introduction before starting  
**So that** I know what I'm about to learn and why it's useful

**Priority:** High  
**Status:** In-Scope  
**Epic:** EP-002  
**Story Points:** 2

**Acceptance Criteria:**
1. Welcome step displays:
   - Lesson title
   - Learning objectives (3-5 bullet points)
   - Estimated time
   - Cultural context or motivation
2. Persian-themed visual design (carpet borders, geometric patterns)
3. "Start Lesson" button to proceed to first game
4. No XP awarded for welcome step (0 points)
5. Can skip welcome on repeated visits (show "Skip intro" option)
6. Mobile responsive layout

---

### US-010: Flashcard Game

**As a** learner  
**I want to** review vocabulary flashcards with audio  
**So that** I can learn pronunciation and meaning of Persian words

**Priority:** Critical  
**Status:** In-Scope  
**Epic:** EP-002  
**Story Points:** 3

**Acceptance Criteria:**
1. Flashcard displays:
   - Finglish (romanized Persian)
   - English translation
   - Persian script (Farsi)
   - Phonetic pronunciation guide
2. Audio play button (auto-play on card load)
3. Card flip animation (front: Finglish, back: English)
4. Navigation buttons: "Previous" and "Next"
5. Progress indicator (e.g., "3 / 8 cards")
6. "Continue" button after all cards reviewed
7. Audio playback works on mobile and desktop
8. XP awarded after completing all flashcards (2-5 points per step)
9. Beautiful card design with Persian motifs
10. Mobile responsive

---

### US-011: Audio-Meaning Game

**As a** learner  
**I want to** listen to Persian audio and select the correct English meaning  
**So that** I can improve my listening comprehension

**Priority:** Critical  
**Status:** In-Scope  
**Epic:** EP-002  
**Story Points:** 5

**Acceptance Criteria:**
1. Audio auto-plays on step load
2. Play button allows replaying audio (unlimited times)
3. Display 4 answer choices (English translations)
4. Answer choices are:
   - 1 correct answer
   - 3 semantic distractors (similar meanings or from same category)
   - Randomized order (not always first option correct)
5. On answer selection:
   - Correct: Green highlight, success sound, +XP animation
   - Incorrect: Red highlight, error sound, show correct answer
6. After answering:
   - Show "Continue" button to next step
   - Allow replaying audio to hear again
7. XP awarded only on correct answer (2-5 points)
8. Idempotent XP (already-answered questions don't re-award XP)
9. Track vocabulary attempt for analytics
10. Mobile responsive (large touch targets)

---

### US-012: Text-Sequence Game (Word Bank)

**As a** learner  
**I want to** build Persian sentences by selecting words from a word bank  
**So that** I can practice sentence structure and word order

**Priority:** Critical  
**Status:** In-Scope  
**Epic:** EP-002  
**Story Points:** 8

**Acceptance Criteria:**
1. Display prompt in English (e.g., "How do you say: Hello, how are you?")
2. Word bank contains:
   - All words needed for correct answer
   - 5-8 distractor words (semantic similarity)
   - Randomized order
   - Total 7-13 words
3. User taps words to build sentence in answer area
4. Can remove words by tapping them in answer area
5. Progress counter shows semantic units selected (e.g., "2 / 3 phrases selected")
6. On submit:
   - Validate answer (normalize punctuation, handle synonyms)
   - Correct: Green highlight, success sound, +XP
   - Incorrect: Red highlight, show correct answer, can retry
7. Handle phrase detection (don't split "how are you" into separate words)
8. Capitalize first word automatically
9. XP awarded on first correct answer only (idempotent)
10. Track per-word correctness for analytics
11. Mobile responsive (easy tapping, no accidental selections)

**Technical Notes:**
- Uses WordBankService for word bank generation
- Handles synonyms (e.g., "hello" / "hi" / "salam" are equivalent)

---

### US-013: Audio-Sequence Game (Word Bank with Audio)

**As a** learner  
**I want to** listen to Persian audio and build the sentence using a word bank  
**So that** I can connect spoken Persian to written form

**Priority:** Critical  
**Status:** In-Scope  
**Epic:** EP-002  
**Story Points:** 8

**Acceptance Criteria:**
1. Audio auto-plays on step load
2. Play button allows unlimited replays
3. Display instruction: "Build what you hear"
4. Word bank contains:
   - All correct words (Finglish)
   - 5-8 distractors
   - Total 7-13 words
5. Same interaction as US-012 (Text-Sequence)
6. Progress counter shows semantic units
7. Validation matches audio to text (handles pronunciation variations)
8. On correct answer:
   - Show English translation
   - Award XP (idempotent)
9. Track per-word correctness
10. Mobile responsive

---

### US-014: Matching Game

**As a** learner  
**I want to** match Persian words to English translations  
**So that** I can reinforce vocabulary connections

**Priority:** Critical  
**Status:** In-Scope  
**Epic:** EP-002  
**Story Points:** 5

**Acceptance Criteria:**
1. Display 4-8 pairs of cards (Persian on left, English on right)
2. User taps one Persian card, then one English card to match
3. On correct match:
   - Cards disappear or lock with green highlight
   - Success sound
   - Track as correct
4. On incorrect match:
   - Cards shake/red highlight
   - Cards deselect after 1 second
   - Track as incorrect
5. Lives system: 3 lives, lose 1 per incorrect match
6. Game ends when:
   - All pairs matched (success) OR
   - Lives run out (failure)
7. On success:
   - Award XP (sum of all pairs' XP values)
   - Show success animation
   - "Continue" button
8. On failure:
   - No XP awarded
   - "Try Again" button (resets game)
9. Track per-pair correctness for analytics
10. Mobile responsive (large touch targets)

---

### US-015: Story Conversation Game

**As a** learner  
**I want to** participate in a text-message style conversation in Persian  
**So that** I can practice real-world conversational scenarios

**Priority:** Critical  
**Status:** In-Scope  
**Epic:** EP-002  
**Story Points:** 8

**Acceptance Criteria:**
1. Display conversation as text messages (iMessage style)
2. Story character messages appear automatically (sequential reveal)
3. At choice points:
   - User sees 2-3 Persian response options (Finglish)
   - Each option shows English translation on tap/hover
4. On selecting response:
   - User message appears in conversation thread
   - Story continues based on choice
5. Correct path:
   - Green highlight on choice
   - Success sound
   - Story progresses naturally
6. Incorrect path:
   - Red highlight on choice
   - Error sound
   - Can retry the choice
7. XP awarded once at story completion (sum of all choices)
8. Track per-exchange correctness
9. Cultural context notes displayed at key moments
10. Mobile responsive (feels like real texting)

---

### US-016: Final Challenge

**As a** learner  
**I want to** complete a multi-step final challenge at the end of a lesson  
**So that** I can demonstrate mastery of what I learned

**Priority:** High  
**Status:** In-Scope  
**Epic:** EP-002  
**Story Points:** 5

**Acceptance Criteria:**
1. Final challenge is a series of 3-5 questions mixing game types
2. Questions pull from vocabulary learned in current lesson
3. Lives system: 3 lives total for entire challenge
4. On incorrect answer:
   - Lose 1 life
   - Show correct answer
   - Can proceed to next question
5. On completing all questions with lives remaining:
   - Award bonus XP (10-20 points)
   - Show success animation with confetti
   - Display lesson completion summary
6. On losing all lives before completion:
   - No XP awarded
   - "Try Again" button restarts challenge
7. Track overall correctness and vocabulary usage
8. Mobile responsive

---

### US-017: Lesson Completion and Summary

**As a** learner  
**I want to** see a summary when I complete a lesson  
**So that** I can celebrate my progress and see what I learned

**Priority:** High  
**Status:** In-Scope  
**Epic:** EP-002  
**Story Points:** 3

**Acceptance Criteria:**
1. On lesson completion, display summary page:
   - Total XP earned (with animation)
   - Words learned count
   - Lesson completion checkmark
   - Time spent
2. Display 3-5 key vocabulary words learned
3. Cultural insight or fun fact about Persian language/culture
4. Call-to-action buttons:
   - "Next Lesson" (if available)
   - "Review Lesson" (replay lesson)
   - "Back to Modules" (module overview)
5. Success sound and confetti animation
6. Update lesson status to "completed" in database
7. Unlock next lesson if this was blocking
8. Mobile responsive

---

### US-018: Audio Playback System

**As a** learner  
**I want** all Persian audio to play clearly and reliably  
**So that** I can learn correct pronunciation

**Priority:** Critical  
**Status:** In-Scope  
**Epic:** EP-002  
**Story Points:** 3

**Acceptance Criteria:**
1. Audio files stored in `/public/audio/` (MP3 format)
2. Audio player component:
   - Play button with loading state
   - Visual feedback when playing (animated icon)
   - Error handling (file not found, playback failed)
3. Audio works on:
   - Desktop (Chrome, Firefox, Safari)
   - Mobile (iOS Safari, Android Chrome)
4. Auto-play works where appropriate (respect user preferences)
5. Multiple audio files don't overlap (stop previous before playing new)
6. Audio loading doesn't block UI
7. Fallback for unsupported browsers
8. Volume control (system default, no custom slider needed)

---

## Epic EP-003: XP / Progress Tracking

**Description:** Experience points system and progress visualization

**Business Value:** Gamification that drives engagement, retention, and completion

**Dependencies:** EP-001 (Authentication)

**Estimated Story Points:** 34

---

### US-019: XP Award System (Idempotent)

**As a** learner  
**I want** to earn XP for completing steps and lessons  
**So that** I feel rewarded for my progress and stay motivated

**Priority:** Critical  
**Status:** In-Scope  
**Epic:** EP-003  
**Story Points:** 5

**Acceptance Criteria:**
1. XP awarded for:
   - Correct answers in games (2-10 points per step)
   - Lesson completion bonuses
   - Review mode games (1 point per correct answer, capped at 1000/day)
2. XP awards are idempotent:
   - Use `stepUid` format: `v2-moduleId-lessonId-gameType-stepIndex`
   - Already-answered questions don't re-award XP
   - Store in `user_xp_transactions` with `idempotency_key`
3. XP transaction includes:
   - `user_id`
   - `amount` (positive integer)
   - `source` (e.g., "lesson", "review-audio-definitions")
   - `lesson_id` (if applicable)
   - `idempotency_key` (stepUid)
   - `metadata` (JSON with game details)
4. Update `user_profiles.total_xp` on award
5. Handle race conditions (multiple tabs, rapid clicking)
6. Rollback on errors
7. Log all XP transactions for audit trail

**Technical Notes:**
- Uses XpService.awardStepXp() method
- Database constraint enforces idempotency

---

### US-020: XP Display in Header

**As a** learner  
**I want** to see my current XP in the app header  
**So that** I always know my progress and feel motivated

**Priority:** High  
**Status:** In-Scope  
**Epic:** EP-003  
**Story Points:** 2

**Acceptance Criteria:**
1. XP count displayed in app header (top-right)
2. Format: Number with icon (e.g., "127 XP" with star icon)
3. Updates in real-time when XP awarded
4. Clicking XP opens dashboard/profile page
5. On XP award:
   - CountUp animation (old value → new value)
   - Green flash or glow effect
   - Optional success sound (can be muted)
6. Mobile responsive (smaller on mobile, still visible)
7. Handles large numbers (1,000+ formatted as "1,234")

---

### US-021: XP Animation on Award

**As a** learner  
**I want** to see a celebration animation when I earn XP  
**So that** I feel immediate satisfaction and reward

**Priority:** Medium  
**Status:** In-Scope  
**Epic:** EP-003  
**Story Points:** 3

**Acceptance Criteria:**
1. On XP award (correct answer):
   - "+X XP" text appears at answer location
   - Text floats upward with fade-out animation
   - Green color with glow effect
2. Header XP count counts up smoothly (not instant jump)
3. Optional confetti burst for large XP awards (>10 points)
4. Animation duration: 1-2 seconds (doesn't block progression)
5. Can proceed to next step before animation completes
6. Animations work on mobile (performance optimized)
7. Already-completed steps show XP count but no animation

**Technical Notes:**
- Uses Framer Motion for animations

---

### US-022: Progress Bars and Percentages

**As a** learner  
**I want** to see progress bars showing my lesson completion  
**So that** I know how far I've progressed and feel motivated to continue

**Priority:** High  
**Status:** In-Scope  
**Epic:** EP-003  
**Story Points:** 3

**Acceptance Criteria:**
1. Progress bar displayed:
   - During lesson (top of screen, fixed position)
   - On module overview (per lesson)
2. Progress calculation:
   - Completed steps / total steps * 100
   - Updates after each step completion
3. Visual design:
   - Thin bar (4-6px height)
   - Green fill for completed
   - Gray for remaining
   - Smooth animation on update
4. Percentage text shown on hover/tap (e.g., "67% complete")
5. Module overview shows:
   - Overall module progress
   - Individual lesson progress
6. Progress persists (stored in database)
7. Mobile responsive

---

### US-023: Lesson Status (Locked, Available, In-Progress, Completed)

**As a** learner  
**I want** lesson statuses to clearly indicate what I can do  
**So that** I understand my learning path and what's next

**Priority:** Critical  
**Status:** In-Scope  
**Epic:** EP-003  
**Story Points:** 5

**Acceptance Criteria:**
1. Lesson status types:
   - **Locked:** Previous lessons not completed, gray with lock icon
   - **Available:** Ready to start, bright/highlighted, "Start" button
   - **In-Progress:** Started but not finished, partial progress bar, "Continue" button
   - **Completed:** Finished, green checkmark, "Review" button
2. Status calculation logic:
   - Locked if `progress_percent < 100` for any previous lesson in module
   - Available if unlocked and `progress_percent = 0`
   - In-Progress if `0 < progress_percent < 100`
   - Completed if `progress_percent = 100`
3. Visual distinction clear at a glance
4. Clicking locked lesson shows tooltip: "Complete previous lessons first"
5. Status updates in real-time after lesson completion
6. Module 1 Lesson 1 always available (never locked)
7. Status persists in `user_lesson_progress` table

---

### US-024: Module Progression and Unlocking

**As a** learner  
**I want** modules and lessons to unlock progressively  
**So that** I build skills in a logical order

**Priority:** High  
**Status:** In-Scope  
**Epic:** EP-003  
**Story Points:** 3

**Acceptance Criteria:**
1. Module unlocking rules:
   - Module 1: Always unlocked (free)
   - Module 2+: Requires premium subscription OR previous module 100% complete
2. Lesson unlocking rules:
   - First lesson in module: Unlocked if module is unlocked
   - Subsequent lessons: Unlocked when previous lesson is completed
3. Paywall for Module 2+ if user is not premium:
   - Show lock icon on module
   - Clicking shows "Upgrade to Premium" modal
   - Modal links to pricing page
4. Premium users see all modules unlocked
5. Cannot skip ahead (sequential unlocking only)
6. Clear visual indication of locked vs. unlocked content
7. Unlock celebration animation (optional, low priority)

**Technical Notes:**
- Uses ModuleAccessService.hasAccess() for premium check

---

### US-025: Daily Streak Tracking

**As a** learner  
**I want** to maintain a daily streak for consecutive days of learning  
**So that** I'm motivated to practice every day

**Priority:** Medium  
**Status:** In-Scope  
**Epic:** EP-003  
**Story Points:** 5

**Acceptance Criteria:**
1. Streak counter displayed on dashboard
2. Streak calculation:
   - Increment by 1 if user completes at least 1 lesson step today
   - Reset to 0 if user misses a day (no activity)
   - Timezone-aware (uses user's timezone or browser timezone)
3. "Days in a row" display (e.g., "🔥 7 days")
4. Visual celebration when reaching milestones (7, 30, 100 days)
5. Streak freeze option (future - allow 1 missed day without breaking streak)
6. Streak persists in database (`user_profiles.streak_count` - future schema)
7. Daily reminder notification (future - requires email or push)

**Technical Notes:**
- Requires tracking `last_activity_date` in user profile
- Timezone stored in `user_profiles.timezone`

---

### US-026: Level System

**As a** learner  
**I want** to level up as I earn XP  
**So that** I have long-term goals and milestones to celebrate

**Priority:** Low  
**Status:** In-Scope (Basic Implementation)  
**Epic:** EP-003  
**Story Points:** 3

**Acceptance Criteria:**
1. Level calculation based on total XP:
   - Level 1: 0-100 XP
   - Level 2: 101-250 XP
   - Level 3: 251-500 XP
   - Level 4: 501-1000 XP
   - Level 5+: +500 XP per level
2. Display current level on dashboard and profile
3. Progress bar showing XP to next level (e.g., "75 / 250 XP to Level 3")
4. Level-up animation when reaching new level:
   - Modal or overlay
   - "Level Up!" message with new level number
   - Confetti animation
5. No gameplay unlocks tied to levels (content gated by lesson progression only)
6. Levels are purely motivational/cosmetic

**Technical Notes:**
- Calculate level from `total_xp` (no separate level field needed)

---

### US-027: Achievement Badges (Future / Out of Scope for V1)

**As a** learner  
**I want** to earn achievement badges for milestones  
**So that** I have collectibles and feel accomplished

**Priority:** Low  
**Status:** Out-of-Scope (V2 Feature)  
**Epic:** EP-003  
**Story Points:** 8

**Acceptance Criteria:**
- Complete Module 1 badge
- 7-day streak badge
- 100 words learned badge
- 1000 XP earned badge
- First lesson completed badge

**Deferred to V2 due to time constraints.**

---

## Epic EP-004: Payments

**Description:** Stripe subscription management and premium access control

**Business Value:** Primary revenue stream - converts free users to paying customers

**Dependencies:** EP-001 (Authentication), EP-003 (Progress Tracking)

**Estimated Story Points:** 21

---

### US-028: Pricing Page

**As a** visitor or free user  
**I want** to view pricing tiers and benefits  
**So that** I can decide which plan suits my needs

**Priority:** Critical  
**Status:** In-Scope  
**Epic:** EP-004  
**Story Points:** 3

**Acceptance Criteria:**
1. Pricing page displays 3 tiers:
   - **Free:** Module 1, basic features, $0
   - **Basic:** Modules 2-5, $4.99/month or $49.99/year (save 17%)
   - **Pro:** Modules 6-10, advanced features, $14.99/month or $149.99/year
   - **Family:** All Pro features + 5 profiles, $25.99/month or $259.99/year
2. Each tier shows:
   - Price (monthly and annual)
   - Feature list (bulleted)
   - "Choose Plan" or "Get Started" button
3. Free tier highlights "Currently Selected" if user is on free plan
4. Comparison table (optional) showing features across tiers
5. FAQ section answering common questions:
   - Can I cancel anytime? (Yes)
   - Do you offer refunds? (7-day money-back guarantee)
   - Can I switch plans? (Yes, anytime)
6. Social proof: User testimonials (if available)
7. Call-to-action: "Start Free" or "Upgrade Now"
8. Mobile responsive (stacked cards on mobile, table on desktop)

---

### US-029: Stripe Checkout Integration

**As a** user  
**I want** to securely purchase a subscription  
**So that** I can access premium content

**Priority:** Critical  
**Status:** In-Scope  
**Epic:** EP-004  
**Story Points:** 5

**Acceptance Criteria:**
1. Clicking "Choose Plan" on pricing page:
   - Redirects to Stripe Checkout (hosted page)
   - Passes correct price ID for selected tier
   - Includes user email pre-filled
   - Metadata includes `supabase_user_id`
2. Stripe Checkout page:
   - Secure (HTTPS)
   - Accepts credit/debit cards
   - Validates payment information
   - Shows subscription details (price, billing cycle)
3. On successful payment:
   - Stripe fires `checkout.session.completed` webhook
   - Redirect to success page (`/billing/success`)
4. On cancelled/failed payment:
   - Redirect to cancelled page (`/billing/canceled`)
   - User can retry from pricing page
5. Test mode (sandbox) for development
6. Live mode ready for production (requires live Stripe keys)

**Technical Notes:**
- Uses `/api/checkout` route
- Requires `STRIPE_SECRET_KEY` and `STRIPE_PRICE_ID` env vars

---

### US-030: Webhook Handling (Subscription Events)

**As the** system  
**I want** to process Stripe webhook events  
**So that** user subscriptions stay in sync

**Priority:** Critical  
**Status:** In-Scope  
**Epic:** EP-004  
**Story Points:** 5

**Acceptance Criteria:**
1. Webhook endpoint: `/api/webhooks`
2. Verify webhook signature using `STRIPE_WEBHOOK_SECRET`
3. Handle events:
   - `checkout.session.completed`: Create subscription in database
   - `customer.subscription.updated`: Update subscription status
   - `customer.subscription.deleted`: Cancel subscription
4. On `checkout.session.completed`:
   - Extract `supabase_user_id` from metadata
   - Upsert `user_subscriptions` table:
     - `user_id`
     - `stripe_customer_id`
     - `stripe_subscription_id`
     - `plan_type` (Basic, Pro, Family)
     - `status` (active)
     - `current_period_end`
5. On `customer.subscription.updated`:
   - Update `status`, `current_period_end`, `cancel_at_period_end`
6. On `customer.subscription.deleted`:
   - Update `status` to "cancelled"
7. Idempotent operations (handle duplicate webhook deliveries)
8. Return 200 OK on success, 400/500 on errors
9. Log all webhook events for debugging

**Technical Notes:**
- Uses Stripe Node.js SDK
- Uses Supabase Service Role Key for database writes

---

### US-031: Premium Access Checks

**As a** free user  
**I want** to be prevented from accessing premium content  
**So that** the paywall is enforced

**Priority:** Critical  
**Status:** In-Scope  
**Epic:** EP-004  
**Story Points:** 3

**Acceptance Criteria:**
1. Premium check function: `hasPremiumAccess(user_id)`
2. Returns true if:
   - User has active subscription (`status = 'active'`)
   - Subscription period has not ended (`current_period_end > now()`)
3. Returns false otherwise
4. Premium checks performed:
   - Server-side (secure, cannot be bypassed)
   - On module access (Module 2+ requires premium)
   - On lesson access (if module requires premium)
5. If user lacks access:
   - Redirect to pricing page or show paywall modal
   - Display message: "Upgrade to Premium to access this content"
6. Module 1 always accessible (even for free users)
7. Cache premium status (refresh on subscription change)

**Technical Notes:**
- Uses ModuleAccessService.hasAccess()
- Query: `SELECT * FROM user_subscriptions WHERE user_id = X AND status = 'active'`

---

### US-032: Payment Success Page

**As a** user who just subscribed  
**I want** to see a confirmation page after payment  
**So that** I know my subscription is active and can start learning

**Priority:** High  
**Status:** In-Scope  
**Epic:** EP-004  
**Story Points:** 2

**Acceptance Criteria:**
1. Success page (`/billing/success`) displays:
   - Success message: "Welcome to Premium!"
   - Checkmark icon or success animation
   - Subscription details (plan, price, next billing date)
   - Call-to-action: "Start Learning" (links to Module 2 or dashboard)
2. Verify subscription is active (query database)
3. If subscription not yet active:
   - Show processing message
   - Auto-refresh every 5 seconds until active
4. Email confirmation sent (welcome email)
5. Mobile responsive

**Technical Notes:**
- Webhook may take 1-2 seconds to process, so allow for delay

---

### US-033: Payment Cancelled Page

**As a** user who cancelled checkout  
**I want** to see a clear message  
**So that** I know what happened and can retry if desired

**Priority:** High  
**Status:** In-Scope  
**Epic:** EP-004  
**Story Points:** 1

**Acceptance Criteria:**
1. Cancelled page (`/billing/canceled`) displays:
   - Message: "Payment was cancelled"
   - Explanation: "No charges were made to your account"
   - Call-to-action: "Try Again" (links back to pricing page)
   - Alternative: "Continue with Free Plan" (links to Module 1)
2. No subscription created in database
3. Mobile responsive

---

### US-034: Module Paywall Modal

**As a** free user  
**I want** to see a paywall modal when I try to access premium content  
**So that** I understand why I'm blocked and can upgrade

**Priority:** High  
**Status:** In-Scope  
**Epic:** EP-004  
**Story Points:** 3

**Acceptance Criteria:**
1. Modal triggered when free user clicks locked module or lesson
2. Modal displays:
   - Lock icon
   - Title: "Premium Content"
   - Message: "Unlock Modules 2-10 with Premium"
   - Benefits list (3-5 bullet points)
   - Pricing: "$4.99/month"
   - Buttons: "Upgrade Now" (to pricing page), "Maybe Later" (close modal)
3. Modal overlay dims background
4. Clicking outside modal or "X" button closes modal
5. "Upgrade Now" redirects to pricing page with pre-selected tier
6. Mobile responsive (full-screen on small screens)

**Technical Notes:**
- Uses PremiumLockModal component (already implemented)

---

## Epic EP-005: Leaderboard

**Description:** Global leaderboard showing top learners by XP

**Business Value:** Social motivation and competition drives engagement

**Dependencies:** EP-001 (Authentication), EP-003 (XP Tracking)

**Estimated Story Points:** 8

---

### US-035: Global Leaderboard (Top 100 by XP)

**As a** learner  
**I want** to see a leaderboard of top learners  
**So that** I can compete and feel motivated to earn more XP

**Priority:** Medium  
**Status:** In-Scope  
**Epic:** EP-005  
**Story Points:** 5

**Acceptance Criteria:**
1. Leaderboard page displays top 100 users by `total_xp`
2. Each entry shows:
   - Rank (1-100)
   - User display name (or "Anonymous" if not set)
   - Total XP
   - Optional: Avatar/profile picture (future)
3. Current user's entry highlighted (even if outside top 100)
4. If user not in top 100, show:
   - User's rank below top 100 list
   - Format: "Your rank: #245 with 567 XP"
5. Leaderboard updates in real-time (or refreshes on page load)
6. Ties handled by earliest achiever (who reached that XP first)
7. Pagination or infinite scroll for viewing all ranks (optional)
8. Mobile responsive (table or list view)

**Technical Notes:**
- Query: `SELECT display_name, total_xp FROM user_profiles ORDER BY total_xp DESC LIMIT 100`
- Add index on `total_xp` for performance

---

### US-036: User Ranking Display

**As a** learner  
**I want** to see my current rank  
**So that** I know where I stand compared to others

**Priority:** Low  
**Status:** In-Scope  
**Epic:** EP-005  
**Story Points:** 2

**Acceptance Criteria:**
1. User's rank displayed on:
   - Dashboard/profile page
   - Leaderboard page (highlighted)
2. Format: "Rank #X" with rank icon/badge
3. Rank updates when XP changes
4. For users with 0 XP: "Unranked" (not displayed in leaderboard)
5. Clicking rank links to leaderboard page

**Technical Notes:**
- Calculate rank: `SELECT COUNT(*) + 1 FROM user_profiles WHERE total_xp > user.total_xp`

---

### US-037: Friend Leaderboards (Future / Out of Scope)

**As a** learner  
**I want** to see a leaderboard of my friends  
**So that** I can compete with people I know

**Priority:** Low  
**Status:** Out-of-Scope (V2 Feature)  
**Epic:** EP-005  
**Story Points:** 8

**Acceptance Criteria:**
- Add friends functionality
- Filter leaderboard to show only friends
- Friend challenges and direct competition

**Deferred to V2 - requires friend system implementation.**

---

## Epic EP-006: Dashboard

**Description:** User dashboard showing progress, stats, and quick actions

**Business Value:** Central hub for user engagement and retention

**Dependencies:** EP-001 (Authentication), EP-003 (Progress Tracking)

**Estimated Story Points:** 21

---

### US-038: Dashboard Overview Page

**As a** learner  
**I want** to see a dashboard with my progress and stats  
**So that** I can track my learning journey at a glance

**Priority:** High  
**Status:** In-Scope  
**Epic:** EP-006  
**Story Points:** 5

**Acceptance Criteria:**
1. Dashboard accessible from account menu or "Dashboard" link
2. Top section displays:
   - Welcome message: "Welcome back, [Name]!"
   - Total XP (large, prominent)
   - Current level
   - Streak (if implemented)
3. Quick stats cards:
   - Words Learned
   - Mastered Words
   - Modules Completed
4. Call-to-action:
   - "Continue Learning" button (links to next available lesson)
5. Recent activity section (optional, low priority)
6. Mobile responsive (stacked on mobile, grid on desktop)

---

### US-039: Words Learned Counter

**As a** learner  
**I want** to see how many words I've learned  
**So that** I can track my vocabulary growth

**Priority:** High  
**Status:** In-Scope  
**Epic:** EP-006  
**Story Points:** 2

**Acceptance Criteria:**
1. "Words Learned" stat displayed on dashboard
2. Calculation: Count of unique `vocabulary_id` in `vocabulary_performance` where `total_attempts > 0`
3. Format: Number (e.g., "47 words learned")
4. Updates in real-time after lessons
5. Clicking stat shows detailed vocabulary list (future)

**Technical Notes:**
- Query: `SELECT COUNT(DISTINCT vocabulary_id) FROM vocabulary_performance WHERE user_id = X AND total_attempts > 0`

---

### US-040: Mastered Words Counter

**As a** learner  
**I want** to see how many words I've mastered  
**So that** I can celebrate my progress

**Priority:** High  
**Status:** In-Scope  
**Epic:** EP-006  
**Story Points:** 2

**Acceptance Criteria:**
1. "Mastered Words" stat displayed on dashboard
2. Calculation: Count of `vocabulary_id` in `vocabulary_performance` where `consecutive_correct >= 5` OR `mastery_level >= 5`
3. Format: Number (e.g., "23 words mastered")
4. Updates in real-time
5. Clicking shows list of mastered words (future)

**Technical Notes:**
- Query: `SELECT COUNT(*) FROM vocabulary_performance WHERE user_id = X AND (consecutive_correct >= 5 OR mastery_level >= 5)`

---

### US-041: Hard Words Section

**As a** learner  
**I want** to see my hardest words  
**So that** I can focus on improving weak areas

**Priority:** High  
**Status:** In-Scope  
**Epic:** EP-006  
**Story Points:** 3

**Acceptance Criteria:**
1. "Words to Review" section on dashboard
2. Display 5-10 hardest words based on error rate:
   - Calculate: `total_incorrect / total_attempts`
   - Filter: `total_attempts >= 2` (min attempts to qualify)
   - Sort: Highest error rate first
3. Each word shows:
   - Word text (Finglish)
   - English translation
   - Error rate percentage (e.g., "67% incorrect")
4. Clicking word links to review mode with that word
5. If no hard words: "Great job! No words to review."
6. Mobile responsive (list view)

**Technical Notes:**
- Query calculates error rate dynamically
- Limit to top 5-10 words

---

### US-042: Continue Learning CTA

**As a** learner  
**I want** a prominent "Continue Learning" button on my dashboard  
**So that** I can quickly resume my lessons

**Priority:** Critical  
**Status:** In-Scope  
**Epic:** EP-006  
**Story Points:** 2

**Acceptance Criteria:**
1. "Continue Learning" button prominently displayed
2. Button links to:
   - Last in-progress lesson (if any)
   - OR next available lesson
   - OR first lesson of next module
3. Button shows:
   - Text: "Continue Learning" or "Start Next Lesson"
   - Module and lesson title (e.g., "Module 2, Lesson 3")
4. Visual design: Large, colorful, impossible to miss
5. Mobile responsive

**Technical Notes:**
- Uses LessonProgressService.getFirstAvailableLesson()

---

### US-043: Module Overview on Dashboard

**As a** learner  
**I want** to see my progress across all modules  
**So that** I can navigate to specific lessons easily

**Priority:** Medium  
**Status:** In-Scope  
**Epic:** EP-006  
**Story Points:** 5

**Acceptance Criteria:**
1. Module overview section shows all modules
2. Each module displays:
   - Module title
   - Progress bar (% of lessons completed)
   - Number of lessons completed / total
   - "Continue" or "Start" button
3. Locked modules show lock icon and "Upgrade" prompt
4. Clicking module goes to module detail page
5. Mobile responsive (stacked cards)

---

### US-044: Streak Display on Dashboard

**As a** learner  
**I want** to see my current streak on the dashboard  
**So that** I'm motivated to maintain it

**Priority:** Low  
**Status:** In-Scope (If Streak Implemented)  
**Epic:** EP-006  
**Story Points:** 2

**Acceptance Criteria:**
1. Streak counter displayed with fire emoji (🔥)
2. Format: "🔥 7 days" or "7-day streak"
3. Milestone celebrations (7, 30, 100 days)
4. Warning if streak at risk (no activity today)
5. Clicking streak shows streak history (future)

**Technical Notes:**
- Depends on US-025 (Streak Tracking)

---

## Epic EP-007: Review Mode

**Description:** Spaced repetition and review games for vocabulary retention

**Business Value:** Increases retention and long-term learning outcomes

**Dependencies:** EP-001 (Authentication), EP-002 (Lessons), EP-003 (Progress)

**Estimated Story Points:** 34

---

### US-045: Review Hub / Navigation

**As a** learner  
**I want** to access multiple review game modes  
**So that** I can practice vocabulary in different ways

**Priority:** High  
**Status:** In-Scope  
**Epic:** EP-007  
**Story Points:** 3

**Acceptance Criteria:**
1. Review hub page displays 4 game mode cards:
   - Audio Definitions
   - Memory Game
   - Word Rush
   - Matching Marathon
2. Each card shows:
   - Game title
   - Description (1-2 sentences)
   - Icon/illustration
   - "Play" button
3. Header shows daily review XP progress:
   - "Review XP Today: 245 / 1000"
   - Progress bar (green fill)
4. When cap reached (1000 XP):
   - Show message: "Daily review XP cap reached. You can continue playing, but no more XP will be awarded in review mode for today."
   - Games still playable (for practice)
5. Navigation link: "Review Mode" in main menu
6. Mobile responsive (stacked cards)

---

### US-046: Vocabulary Filter Selection

**As a** learner  
**I want** to choose which words to review  
**So that** I can focus on specific vocabulary sets

**Priority:** High  
**Status:** In-Scope  
**Epic:** EP-007  
**Story Points:** 3

**Acceptance Criteria:**
1. Before starting game, show filter modal:
   - "All Learned Words"
   - "Mastered Words" (consecutive_correct >= 5)
   - "Words to Review" (hard words, high error rate)
2. Display count for each filter (e.g., "All Learned Words (47)")
3. User selects one filter, clicks "Start Game"
4. Game loads with vocabulary from selected filter
5. Filter selection persists for session (same filter for multiple games)
6. Can change filter from review hub
7. Mobile responsive (full-screen modal on small screens)

---

### US-047: Audio Definitions Game (Review)

**As a** learner  
**I want** to play an unlimited audio definition game  
**So that** I can practice listening comprehension

**Priority:** High  
**Status:** In-Scope  
**Epic:** EP-007  
**Story Points:** 5

**Acceptance Criteria:**
1. Audio auto-plays on question load
2. Play button allows unlimited replays
3. Display 4 answer choices (English translations)
4. Always 4 unique choices (no duplicates)
5. Choices shuffle once per new question (not on incorrect)
6. Lives system: 3 lives
7. On correct answer:
   - Green highlight, success sound
   - +1 XP (if under daily cap)
   - Auto-advance to next question after 1 second
8. On incorrect answer:
   - Red highlight, lose 1 life
   - Show correct answer
   - Stays on same question for retry
9. Game ends when lives run out
10. Game over screen shows:
    - Correct / total count
    - XP earned
    - "Play Again" or "Back to Review"
11. Vocabulary selection based on filter
12. Track attempts (no remediation triggered in review mode)
13. Responsive UI with Iran flag colors (green, red, white)

**Technical Notes:**
- Similar to lesson audio-meaning, but unlimited questions
- Different styling (arcade theme with flag colors)

---

### US-048: Memory Game (Review)

**As a** learner  
**I want** to play a memory matching game  
**So that** I can practice vocabulary recall

**Priority:** High  
**Status:** In-Scope  
**Epic:** EP-007  
**Story Points:** 8

**Acceptance Criteria:**
1. Round-by-round progression:
   - Round 1: 2 pairs
   - Round 2: 3 pairs
   - Round 3-7: 4-8 pairs
   - Round 8+: 8 pairs (max)
2. Preview phase (3 seconds):
   - All cards face-up
   - Countdown: "3... 2... 1... Start!"
   - Non-interactive
3. Game phase:
   - Cards face-down
   - Click to reveal, click second to match
   - Correct match: Cards lock, +1 XP
   - Incorrect match: Cards flip back, lose 1 life
4. Lives: 3 per round, reset each round
5. Round completion: Auto-advance to next round
6. Game over: All lives lost
7. Session stats:
   - Correct / total (cumulative, not per round)
   - XP earned
   - Round reached
8. Grid layout:
   - 2 pairs: 2x2
   - 3-5 pairs: 3x2 or 4x2
   - 6-8 pairs: 4x4
9. Card sizing: Larger for 6+ pairs (responsive)
10. Responsive design with green/red color scheme

**Technical Notes:**
- Fisher-Yates shuffle for card positions
- Track all matches for analytics (correct only, not incorrect guesses)

---

### US-049: Word Rush Game (Future / Placeholder)

**As a** learner  
**I want** to play a timed word rush game  
**So that** I can practice quick recall

**Priority:** Low  
**Status:** In-Scope (Basic Implementation)  
**Epic:** EP-007  
**Story Points:** 5

**Acceptance Criteria:**
1. Fast-paced game: Match as many words as possible in 60 seconds
2. Display Persian word (Finglish)
3. Multiple choice: 4 English translations
4. On correct: +1 point, next word immediately
5. On incorrect: -1 life (3 lives total), next word
6. Timer countdown: 60 → 0 seconds
7. Game ends when timer runs out OR lives lost
8. Final score: Correct answers count
9. Leaderboard for Word Rush scores (future)

---

### US-050: Matching Marathon Game (Review)

**As a** learner  
**I want** to play an unlimited matching game  
**So that** I can practice vocabulary connections

**Priority:** High  
**Status:** In-Scope  
**Epic:** EP-007  
**Story Points:** 5

**Acceptance Criteria:**
1. Round-by-round game:
   - Start with 2 pairs
   - Increase by 1 pair each round
   - Max 8 pairs per round
2. Each round:
   - Display Persian (left) and English (right) cards
   - User taps one from each side to match
   - Correct match: Cards disappear, +1 XP
   - Incorrect match: Red shake, lose 1 life
3. Lives: 3 per round, reset each round
4. Round completion:
   - When all pairs matched
   - Auto-advance to next round
5. Game over: All lives lost
6. Session stats: Correct matches, rounds completed, XP earned
7. Responsive design

---

### US-051: Daily Review XP Cap (1000 XP)

**As a** learner  
**I want** my review mode XP capped at 1000/day  
**So that** the system encourages variety and prevents grinding

**Priority:** High  
**Status:** In-Scope  
**Epic:** EP-007  
**Story Points:** 3

**Acceptance Criteria:**
1. Track `review_xp_earned_today` in `user_profiles`
2. Track `review_xp_reset_at` (timestamp of last reset)
3. Reset logic:
   - If `review_xp_reset_at` is yesterday (in user's timezone), reset to 0
   - Timezone stored in `user_profiles.timezone` (defaults to browser timezone)
4. On review game correct answer:
   - If `review_xp_earned_today < 1000`: Award 1 XP, increment counter
   - If `review_xp_earned_today >= 1000`: Award 0 XP, show cap message
5. Cap message shows once per session when reached:
   - "Daily review XP cap reached (1000/1000). You can continue playing, but no more XP will be awarded in review mode for today."
6. User can continue playing games after cap (for practice)
7. Lesson XP is NOT rate-limited (unlimited XP from lessons)

**Technical Notes:**
- Uses ReviewSessionService.awardReviewXp()
- Timezone management: `initializeUserTimezone()` called on app load

---

### US-052: Review Session Tracking

**As the** system  
**I want** to track review game sessions  
**So that** we can analyze review behavior and improve the experience

**Priority:** Medium  
**Status:** In-Scope  
**Epic:** EP-007  
**Story Points:** 2

**Acceptance Criteria:**
1. Track in `user_profiles`:
   - `review_xp_earned_today` (integer)
   - `review_xp_reset_at` (timestamp)
   - `timezone` (string, e.g., "America/Los_Angeles")
2. Track in `vocabulary_attempts`:
   - Game type (e.g., "review-audio-definitions")
   - Correct/incorrect per word
   - Context data (JSON)
3. Aggregate analytics:
   - Most-played review game
   - Average session length
   - Review XP trends over time

---

## Summary

**Total User Stories:** 52 (45 In-Scope, 7 Out-of-Scope)

**Total Story Points (In-Scope):** 194 points

**Epic Breakdown:**
- EP-001 Authentication: 7 stories, 21 points
- EP-002 Lessons Engine: 11 stories, 55 points
- EP-003 XP / Progress: 9 stories, 34 points (3 out-of-scope)
- EP-004 Payments: 7 stories, 21 points
- EP-005 Leaderboard: 3 stories, 8 points (1 out-of-scope)
- EP-006 Dashboard: 7 stories, 21 points
- EP-007 Review Mode: 8 stories, 34 points

**Implementation Priority:**
1. EP-001 (Authentication) - Foundation
2. EP-003 (XP/Progress) - Core gamification
3. EP-002 (Lessons) - Primary value
4. EP-004 (Payments) - Revenue
5. EP-006 (Dashboard) - Engagement
6. EP-007 (Review Mode) - Retention
7. EP-005 (Leaderboard) - Social motivation

---

**End of Epics and User Stories Document**

*This document serves as the product backlog for V1 launch. Stories will be broken down into tasks during sprint planning.*
