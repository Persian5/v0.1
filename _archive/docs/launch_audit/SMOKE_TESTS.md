# SMOKE TESTS: Launch Day Manual Test Plan

## Pre-Test Setup

1. Use incognito/private browser window
2. Clear any existing localStorage
3. Have Stripe Dashboard open in separate tab
4. Have Supabase Dashboard open in separate tab
5. Have production URL ready: `https://yourdomain.com`

---

## Test 1: Free User Flow (Unauthenticated to Module 1 Complete)

### 1.1 Homepage Load
- [ ] Visit homepage
- [ ] Page loads in < 3 seconds
- [ ] No console errors
- [ ] "Start Learning" or "Preview Lesson" button visible

### 1.2 Signup Flow
- [ ] Click "Start Learning"
- [ ] Auth modal appears
- [ ] Fill in: email, password (8+ chars), first name, last name
- [ ] Click "Sign Up"
- [ ] See "Check your email for verification" message
- [ ] Check email inbox (may be in spam)
- [ ] Click verification link
- [ ] Redirected to app (or verification success page)

### 1.3 Onboarding
- [ ] Onboarding modal appears after verification
- [ ] Select learning goal (e.g., "Reconnect with heritage")
- [ ] Skip or complete level selection
- [ ] Skip or complete focus selection
- [ ] See welcome/tour screens
- [ ] Complete onboarding

### 1.4 First Lesson (Module 1)
- [ ] Redirected to dashboard or modules page
- [ ] Navigate to `/modules`
- [ ] Module 1 shows as accessible (not locked)
- [ ] Click on Module 1
- [ ] Module page shows lessons
- [ ] Lesson 1 is accessible
- [ ] Click Lesson 1
- [ ] Lesson loads with welcome screen
- [ ] Click "Start Lesson"

### 1.5 Complete Lesson Steps
- [ ] Flashcard step: flip all cards, continue
- [ ] Quiz step: answer correctly, see XP animation
- [ ] Matching step: complete matches
- [ ] Final challenge: complete
- [ ] See completion screen with XP earned
- [ ] Click "View Summary" or "Next Lesson"

### 1.6 XP Verification
- [ ] Open Supabase Dashboard > Table Editor > `user_profiles`
- [ ] Find your test user by email
- [ ] Verify `total_xp` matches displayed XP
- [ ] Check `user_xp_transactions` table has entries for this user

### 1.7 Premium Paywall Test
- [ ] Navigate to `/modules`
- [ ] Click on Module 2
- [ ] Premium lock modal should appear
- [ ] "Subscribe" button visible
- [ ] Close modal
- [ ] Verify cannot access Module 2 lessons directly via URL (`/modules/module2/lesson1`)

---

## Test 2: Paid User Flow (Payment Success)

### 2.1 Initiate Checkout
- [ ] From Module 2 premium modal, click "Subscribe"
- [ ] OR navigate to `/pricing` and click "Subscribe"
- [ ] Redirected to Stripe Checkout page
- [ ] See $4.99/month price
- [ ] See your email pre-filled

### 2.2 Complete Payment
- [ ] Enter test card: `4242 4242 4242 4242`
- [ ] Any future expiry date
- [ ] Any CVC
- [ ] Any name
- [ ] Click "Subscribe"
- [ ] Wait for redirect (may take 2-5 seconds)

### 2.3 Post-Payment Verification
- [ ] Redirected to `/billing/success`
- [ ] See "Welcome to Premium" message
- [ ] Wait for "Processing" to complete (webhook processing)
- [ ] Click "Start Learning Now"

### 2.4 Stripe Dashboard Verification
- [ ] Open Stripe Dashboard > Payments
- [ ] See successful payment
- [ ] Open Customers > find your email
- [ ] See active subscription

### 2.5 Supabase Verification
- [ ] Open Supabase > `user_subscriptions` table
- [ ] Find row with your `user_id`
- [ ] Verify `status` = `'active'`
- [ ] Verify `plan_type` = `'premium'`
- [ ] Verify `stripe_subscription_id` is set

### 2.6 Premium Access Verification
- [ ] Navigate to `/modules`
- [ ] Click on Module 2
- [ ] Module 2 page loads (no paywall)
- [ ] Click on Lesson 1
- [ ] Lesson loads successfully
- [ ] Complete at least one step to verify XP awards

---

## Test 3: Payment Cancellation Flow

### 3.1 Cancel During Checkout
- [ ] Sign in as non-premium user
- [ ] Click "Subscribe" on Module 2
- [ ] Reach Stripe Checkout page
- [ ] Click "< Back" or close tab
- [ ] Verify redirected to `/billing/canceled`
- [ ] See cancellation message
- [ ] Verify no charge in Stripe Dashboard

### 3.2 Subscription Cancellation (Post-Purchase)
**Note**: Requires Stripe Customer Portal or manual cancellation in Stripe Dashboard.

- [ ] In Stripe Dashboard > Customers > find test user
- [ ] Click on subscription
- [ ] Cancel subscription
- [ ] Set to cancel at period end
- [ ] Verify webhook received (check Vercel function logs or Stripe webhook logs)
- [ ] In Supabase, verify `cancel_at_period_end` = `true`

---

## Test 4: Lesson Completion & Progress Persistence

### 4.1 Complete Lesson, Leave, Return
- [ ] Sign in and start a lesson (not yet completed)
- [ ] Complete half the steps
- [ ] Close browser tab entirely
- [ ] Re-open browser, sign in
- [ ] Navigate to same lesson
- [ ] **Expected**: Lesson restarts from beginning (progress is per-session, completion is persistent)

### 4.2 Complete Lesson, Verify Persistence
- [ ] Complete entire lesson
- [ ] See completion screen
- [ ] Navigate to `/modules`
- [ ] Verify lesson shows as completed (checkmark or green state)
- [ ] Sign out
- [ ] Sign in again
- [ ] Navigate to `/modules`
- [ ] Verify lesson still shows as completed

### 4.3 Sequential Unlocking
- [ ] Complete Module 1 Lesson 1
- [ ] Navigate to modules page
- [ ] Verify Lesson 2 is now accessible
- [ ] Verify Lesson 3 is still locked
- [ ] Attempt direct URL to Lesson 3 (`/modules/module1/lesson3`)
- [ ] **Expected**: Lock screen or redirect to modules

---

## Test 5: Edge Cases

### 5.1 No Network (Offline)
- [ ] Sign in and navigate to lesson
- [ ] Open DevTools > Network > Offline mode
- [ ] Try to complete a step
- [ ] **Expected**: Error message, no crash
- [ ] Disable offline mode
- [ ] Refresh page
- [ ] **Expected**: Lesson reloads normally

### 5.2 Refresh Mid-Lesson
- [ ] Start a lesson
- [ ] Complete 2-3 steps
- [ ] Press Ctrl+R / Cmd+R to refresh
- [ ] **Expected**: Lesson restarts from beginning
- [ ] No error in console
- [ ] XP already earned is NOT re-awarded (idempotency)

### 5.3 Back Button During Lesson
- [ ] Start a lesson
- [ ] Complete 2 steps
- [ ] Press browser back button
- [ ] **Expected**: Navigate away from lesson (to modules or previous page)
- [ ] No crash
- [ ] XP not duplicated

### 5.4 Multiple Tabs
- [ ] Sign in on Tab 1
- [ ] Navigate to lesson on Tab 1
- [ ] Open same lesson on Tab 2 (same browser, same session)
- [ ] Complete step on Tab 1
- [ ] Complete same step on Tab 2
- [ ] **Expected**: XP awarded once only (idempotency)
- [ ] Check Supabase `user_xp_transactions` - should have single entry

### 5.5 Token Expiry (Long Session)
- [ ] Sign in
- [ ] Leave tab open for 60+ minutes
- [ ] Return and try to perform action (complete step, navigate)
- [ ] **Expected**: Token auto-refreshes, action succeeds
- [ ] If token refresh fails, auth modal should appear

---

## Test 6: Review Mode Games

### 6.1 Access Review Mode
- [ ] Complete at least one lesson (to have vocabulary)
- [ ] Navigate to `/review`
- [ ] See available game modes

### 6.2 Play Each Game
- [ ] Audio Definitions: Click play, select answer
- [ ] Memory Game: Flip cards, find matches
- [ ] Matching Marathon: Match pairs
- [ ] Word Rush: Type answers quickly
- [ ] Verify each game awards XP (1 XP per correct)
- [ ] Verify XP cap (1000/day for review)

### 6.3 Empty Vocabulary State
- [ ] Create new user with no completed lessons
- [ ] Navigate to `/review`
- [ ] **Expected**: Message indicating no vocabulary available
- [ ] No crash

### 6.4 Filter Selection
- [ ] Complete lessons to have vocabulary
- [ ] Open review game
- [ ] Click filter button
- [ ] Select "Hard Words" or "Mastered Words"
- [ ] Verify game uses filtered vocabulary

---

## Test 7: Dashboard Accuracy

### 7.1 Stats Display
- [ ] Navigate to `/dashboard`
- [ ] Verify XP matches account XP
- [ ] Verify streak count displays
- [ ] Verify daily goal progress displays

### 7.2 Leaderboard Widget
- [ ] Dashboard shows leaderboard widget
- [ ] Your name appears with correct XP
- [ ] Top 3 users display correctly

### 7.3 Resume Learning
- [ ] Complete some lessons (not all)
- [ ] Navigate to dashboard
- [ ] "Resume Learning" or "Continue" shows next lesson
- [ ] Click it, verify navigates to correct lesson

---

## Test 8: Mobile Responsiveness

### 8.1 Responsive Layout
- [ ] Open DevTools > Toggle device toolbar
- [ ] Select iPhone 12 (or similar)
- [ ] Navigate through all pages:
  - Homepage
  - Modules
  - Lesson
  - Dashboard
  - Account
  - Review
- [ ] Verify no horizontal scroll
- [ ] Verify buttons are tappable (min 44px)
- [ ] Verify text is readable

### 8.2 Real Device Test
- [ ] Open production URL on actual phone
- [ ] Complete signup on phone
- [ ] Complete one lesson on phone
- [ ] Verify all touch interactions work

---

## Test Results Template

```
Date: ___________
Tester: ___________
Browser: ___________
Device: ___________

Test 1: Free User Flow
  1.1 Homepage Load: [ ] Pass [ ] Fail - Notes: ___
  1.2 Signup Flow: [ ] Pass [ ] Fail - Notes: ___
  1.3 Onboarding: [ ] Pass [ ] Fail - Notes: ___
  1.4 First Lesson: [ ] Pass [ ] Fail - Notes: ___
  1.5 Complete Steps: [ ] Pass [ ] Fail - Notes: ___
  1.6 XP Verification: [ ] Pass [ ] Fail - Notes: ___
  1.7 Premium Paywall: [ ] Pass [ ] Fail - Notes: ___

Test 2: Paid User Flow
  2.1 Initiate Checkout: [ ] Pass [ ] Fail - Notes: ___
  2.2 Complete Payment: [ ] Pass [ ] Fail - Notes: ___
  2.3 Post-Payment: [ ] Pass [ ] Fail - Notes: ___
  2.4 Stripe Verify: [ ] Pass [ ] Fail - Notes: ___
  2.5 Supabase Verify: [ ] Pass [ ] Fail - Notes: ___
  2.6 Premium Access: [ ] Pass [ ] Fail - Notes: ___

Test 3: Payment Cancel
  3.1 Cancel Checkout: [ ] Pass [ ] Fail - Notes: ___
  3.2 Subscription Cancel: [ ] Pass [ ] Fail - Notes: ___

Test 4: Progress Persistence
  4.1 Leave/Return: [ ] Pass [ ] Fail - Notes: ___
  4.2 Complete/Verify: [ ] Pass [ ] Fail - Notes: ___
  4.3 Sequential Unlock: [ ] Pass [ ] Fail - Notes: ___

Test 5: Edge Cases
  5.1 Offline: [ ] Pass [ ] Fail - Notes: ___
  5.2 Refresh: [ ] Pass [ ] Fail - Notes: ___
  5.3 Back Button: [ ] Pass [ ] Fail - Notes: ___
  5.4 Multiple Tabs: [ ] Pass [ ] Fail - Notes: ___
  5.5 Token Expiry: [ ] Pass [ ] Fail - Notes: ___

Test 6: Review Mode
  6.1 Access: [ ] Pass [ ] Fail - Notes: ___
  6.2 Games: [ ] Pass [ ] Fail - Notes: ___
  6.3 Empty State: [ ] Pass [ ] Fail - Notes: ___
  6.4 Filters: [ ] Pass [ ] Fail - Notes: ___

Test 7: Dashboard
  7.1 Stats: [ ] Pass [ ] Fail - Notes: ___
  7.2 Leaderboard: [ ] Pass [ ] Fail - Notes: ___
  7.3 Resume: [ ] Pass [ ] Fail - Notes: ___

Test 8: Mobile
  8.1 Responsive: [ ] Pass [ ] Fail - Notes: ___
  8.2 Real Device: [ ] Pass [ ] Fail - Notes: ___

OVERALL: [ ] Ready to Launch [ ] Has Blockers
Blockers (if any): ___________________________________
```

---

## Critical Launch Blockers (Must Pass)

If any of these fail, DO NOT LAUNCH:

1. Test 1.2 - Signup Flow (users can't sign up)
2. Test 2.2 - Complete Payment (revenue blocked)
3. Test 2.5 - Supabase Verify (webhook not working)
4. Test 1.7 - Premium Paywall (free users accessing paid content)
5. Test 4.2 - Progress Persistence (data loss)

---

## Post-Launch Monitoring

After launch, monitor for first 24 hours:

1. **Stripe Dashboard**: Watch for failed payments, disputes
2. **Supabase Dashboard**: Watch for high query counts, connection errors
3. **Vercel Dashboard**: Watch for function errors, high latency
4. **Support Email**: Respond within 4 hours to payment issues
5. **Social Media**: Watch for user complaints

---

## Rollback Plan

If critical issues discovered post-launch:

1. **Payment Issues**: Disable Subscribe button (update `/pricing/page.tsx`)
2. **Auth Issues**: Enable maintenance mode (add banner to layout)
3. **Data Corruption**: Restore from Supabase PITR backup
4. **Complete Failure**: Rollback to previous Vercel deployment

