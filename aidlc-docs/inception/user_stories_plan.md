# User Stories Plan - Iranopedia Persian Academy

**Date:** November 3, 2025  
**Role:** Product Manager  
**Reference:** `/planning/vision-usecase.md`

---

## User Story Planning Checklist

### 1. Epic Definition
- [ ] Define all 7 core epics
- [ ] Map epics to user personas (Sara, Amir, Emily, Reza, Michael)
- [ ] Prioritize epics (Must-Have, Should-Have, Could-Have, Won't-Have)
- [ ] Identify epic dependencies
- [ ] Estimate epic complexity

### 2. User Persona Mapping
- [ ] Sara (Diaspora Reconnector, 24) - Primary persona
- [ ] Amir (Heritage Parent, 38) - Primary persona
- [ ] Emily (Curious Traveler, 29) - Secondary persona
- [ ] Reza (Adult Re-learner, 42) - Secondary persona
- [ ] Michael (Non-Iranian Partner, 31) - Secondary persona
- [ ] Anonymous/Guest user - Supporting persona

### 3. User Story Template
**Format:** "As a [user type], I want [action], so that [benefit]"

**Components:**
- User type (persona or role)
- Action (feature or capability)
- Benefit (value delivered)
- Acceptance criteria (testable conditions)
- Status (In-Scope, Out-of-Scope, Future)
- Priority (Critical, High, Medium, Low)
- ID (US-001, US-002, etc.)

### 4. Acceptance Criteria Guidelines
- Must be specific and testable
- Use Given-When-Then format where appropriate
- Cover happy path and edge cases
- Include UI/UX requirements
- Specify data validation rules
- Define success metrics where relevant

### 5. Epic Breakdown

#### Epic 1: Authentication (EP-001)
- [ ] User registration with email/password
- [ ] User login
- [ ] Password reset flow
- [ ] Email verification
- [ ] Social OAuth (Google, Apple - future)
- [ ] Session management
- [ ] Logout

#### Epic 2: Lessons Engine (EP-002)
- [ ] Lesson navigation and structure
- [ ] Welcome step (lesson intro)
- [ ] Flashcard game
- [ ] Audio-meaning game
- [ ] Text-sequence game (word bank)
- [ ] Audio-sequence game (word bank)
- [ ] Matching game
- [ ] Story conversation game
- [ ] Final challenge
- [ ] Step completion and progression
- [ ] Audio playback
- [ ] XP awards per step
- [ ] Lesson completion

#### Epic 3: XP / Progress Tracking (EP-003)
- [ ] XP award system (idempotent)
- [ ] XP display (header, animations)
- [ ] Progress bars and percentages
- [ ] Lesson status (locked, available, in-progress, completed)
- [ ] Module progression
- [ ] Streaks (daily activity)
- [ ] Levels (XP milestones)
- [ ] Achievement badges (future)

#### Epic 4: Payments (EP-004)
- [ ] Pricing page
- [ ] Stripe checkout integration
- [ ] Subscription tiers (Basic, Pro, Family)
- [ ] Payment success/cancel pages
- [ ] Webhook handling (subscription events)
- [ ] Premium access checks
- [ ] Module paywall (Module 2+)
- [ ] Subscription management (future)
- [ ] Billing history (future)

#### Epic 5: Leaderboard (EP-005)
- [ ] Global leaderboard (top 100 by XP)
- [ ] User ranking
- [ ] Rank display on user profile
- [ ] Real-time updates
- [ ] Friend leaderboards (future)
- [ ] Weekly/monthly leaderboards (future)

#### Epic 6: Dashboard (EP-006)
- [ ] User profile page
- [ ] XP summary and display
- [ ] Words learned counter
- [ ] Mastered words counter
- [ ] Hard words section
- [ ] Continue learning CTA
- [ ] Module overview
- [ ] Streak display
- [ ] Recent activity (future)

#### Epic 7: Review Mode (EP-007)
- [ ] Review hub/navigation
- [ ] Vocabulary filter (all, mastered, hard words)
- [ ] Audio Definitions game
- [ ] Memory Game (pairs)
- [ ] Word Rush game
- [ ] Matching Marathon game
- [ ] Daily XP cap (1000 XP)
- [ ] Review session tracking
- [ ] Performance tracking (no remediation in review)

### 6. Cross-Cutting Concerns
- [ ] Responsive design (mobile + desktop)
- [ ] Loading states
- [ ] Error handling and messages
- [ ] Data persistence (Supabase)
- [ ] Caching strategies
- [ ] Performance optimization
- [ ] Security (RLS, auth checks)
- [ ] Analytics tracking
- [ ] SEO optimization

### 7. Out of Scope (V1)
- [ ] Native mobile apps (iOS, Android)
- [ ] Offline mode (full offline)
- [ ] Social sharing
- [ ] Forums/community features
- [ ] Live tutoring marketplace
- [ ] Speech recognition
- [ ] Writing practice (Persian script)
- [ ] Multiple user profiles (family accounts)
- [ ] Custom study plans

---

## Epic Priority Matrix

| Epic | Must-Have | Should-Have | Could-Have | Won't-Have (V1) |
|------|-----------|-------------|------------|-----------------|
| **EP-001: Authentication** | Email/password, Login, Logout | Password reset, Email verification | OAuth (Google, Apple) | Social login |
| **EP-002: Lessons Engine** | All game types, XP awards, Audio | Lesson progression, Completion | Hints, Skip options | Adaptive difficulty |
| **EP-003: XP / Progress** | XP display, Progress bars, Lesson status | Streaks, Levels | Achievement badges | Custom goals |
| **EP-004: Payments** | Stripe checkout, 3 tiers, Paywall | Success/cancel pages, Webhooks | Subscription management | Billing history, Invoices |
| **EP-005: Leaderboard** | Global top 100 | User ranking display | Friend leaderboards | Weekly/monthly boards |
| **EP-006: Dashboard** | XP, Words learned, Continue CTA | Mastered/hard words | Recent activity | Advanced analytics |
| **EP-007: Review Mode** | 4 game types, Daily XP cap | Vocabulary filters | Game difficulty progression | Unlimited XP mode |

---

## User Story Estimation

### Story Point Scale
- **1 point:** Trivial (1-2 hours) - Display data, simple UI
- **2 points:** Simple (2-4 hours) - Basic CRUD, simple logic
- **3 points:** Moderate (4-8 hours) - Complex UI, business logic
- **5 points:** Complex (8-16 hours) - Multiple components, integrations
- **8 points:** Very Complex (16-24 hours) - Major feature, multiple systems
- **13 points:** Epic (24+ hours) - Should be broken down further

### Total Story Points by Epic (Estimated)
- EP-001 Authentication: 21 points
- EP-002 Lessons Engine: 55 points
- EP-003 XP / Progress: 34 points
- EP-004 Payments: 21 points
- EP-005 Leaderboard: 8 points
- EP-006 Dashboard: 21 points
- EP-007 Review Mode: 34 points

**Total V1 Scope: ~194 story points**

---

## Dependency Map

```
EP-001 (Authentication)
  └─> EP-003 (XP/Progress) - Requires user identity
      └─> EP-002 (Lessons) - Requires progress tracking
          └─> EP-007 (Review Mode) - Requires completed lessons
      └─> EP-006 (Dashboard) - Requires progress data
      └─> EP-005 (Leaderboard) - Requires XP data
  └─> EP-004 (Payments) - Requires user identity
      └─> EP-002 (Lessons) - Paywall enforcement
```

**Critical Path:** EP-001 → EP-003 → EP-002 → EP-007

---

## User Story Conventions

### ID Format
- **Epic ID:** EP-001, EP-002, etc.
- **User Story ID:** US-001, US-002, etc.
- **Task ID:** T-001, T-002, etc. (not included in this document)

### Status Values
- **In-Scope:** Included in V1 launch
- **Out-of-Scope:** Not included in V1 (future version)
- **Implemented:** Already built (mark in final document)

### Priority Values
- **Critical:** Launch blocker, must be completed
- **High:** Core functionality, necessary for MVP
- **Medium:** Important but not blocking
- **Low:** Nice-to-have, can be deferred

### Labels/Tags
- `authentication`
- `lessons`
- `gamification`
- `payments`
- `leaderboard`
- `dashboard`
- `review-mode`
- `mobile`
- `desktop`
- `backend`
- `frontend`
- `bug`
- `enhancement`

---

## User Story Quality Checklist

For each user story, verify:
- [ ] Follows "As a [user], I want [action], so that [benefit]" format
- [ ] User type is specific (not just "user")
- [ ] Action is clear and testable
- [ ] Benefit explains value/motivation
- [ ] Acceptance criteria are specific and testable
- [ ] Status is assigned (In-Scope or Out-of-Scope)
- [ ] Priority is assigned (Critical, High, Medium, Low)
- [ ] Epic is referenced (EP-001, etc.)
- [ ] Dependencies are noted if applicable
- [ ] Estimate is provided (story points)

---

## Next Steps

1. ✅ Create this user stories plan
2. ⏳ Review vision-usecase.md for complete context
3. ⏳ Create comprehensive epics and user stories document
4. ⏳ Validate stories against vision and personas
5. ⏳ Review with stakeholder (founder) for approval
6. ⏳ Use stories for development planning and sprint breakdown




