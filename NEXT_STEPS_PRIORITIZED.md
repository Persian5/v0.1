# SENIOR DEV NEXT STEPS - Priority Order (Development Focus)

**Date:** Current Session  
**Status:** Wednesday tasks completed ✅  
**Next Focus:** Code fixes + security + UX improvements  
**Note:** Stripe LIVE & Legal docs deferred until launch readiness

---

## 🔒 **TIER 1: SECURITY & DATA INTEGRITY (Do This First)**

### **Task 1.1: Protect Completion Routes**
**Time:** 2 hours  
**Status:** 🔴 **HIGH PRIORITY - DO NOW**  
**Why:** Users can access `/completion` directly without completing lesson = broken UX

**Current State:**
- `app/modules/[moduleId]/[lessonId]/completion/page.tsx` exists
- No route guard - accessible via direct URL
- Shows completion page even if lesson not completed

**Implementation:**
```typescript
// Add to completion/page.tsx useEffect
1. Check if lesson is completed (LessonProgressService.getLessonProgress)
2. If not completed → redirect to lesson page
3. Add loading state during check
4. Handle edge cases (lesson doesn't exist, etc.)
```

**Files to Modify:**
- `app/modules/[moduleId]/[lessonId]/completion/page.tsx`

**Acceptance:**
- [ ] Direct URL access requires completed lesson
- [ ] Redirects to lesson page if not completed
- [ ] No blank/broken completion pages

**Risk if skipped:** Users see completion page without completing = confusion, broken UX

---

### **Task 1.2: Protect Summary Routes**
**Time:** 2 hours  
**Status:** 🔴 **HIGH PRIORITY - DO NOW**  
**Why:** Users can access `/summary` directly = unauthorized access

**Current State:**
- `app/modules/[moduleId]/[lessonId]/summary/page.tsx` exists
- No route guard - accessible via direct URL
- No premium paywall check

**Implementation:**
```typescript
// Add to summary/page.tsx useEffect
1. Check lesson access (ModuleAccessService.canAccessModule)
2. Check if lesson completed (or at least started)
3. If premium lesson + no access → show PremiumLockModal
4. If lesson doesn't exist → redirect to modules page
```

**Files to Modify:**
- `app/modules/[moduleId]/[lessonId]/summary/page.tsx`

**Acceptance:**
- [ ] Direct URL access requires lesson access
- [ ] Premium lessons show paywall modal
- [ ] No unauthorized access to summaries

**Risk if skipped:** Users can bypass paywall, see premium content = revenue loss

---

## 🐛 **TIER 2: CRITICAL BUG FIXES (Do This Next)**

### **Task 2.1: Fix Word Bank Validation Bugs**
**Time:** 1 hour  
**Status:** 🟡 **MEDIUM PRIORITY - DO NOW**  
**Why:** "Your" → "You" normalization breaks validation, incomplete phrases accepted

**Current Issues:**
- Issue #31: "Your" normalized to "You" (should stay "Your")
- Issue #33: Audio sequence accepts incomplete answers (missing words)

**Implementation:**
```typescript
// Fix in lib/services/word-bank-service.ts
1. Review normalizeVocabEnglish() - don't normalize "Your" → "You"
2. Fix validateUserAnswer() - require ALL words in phrase
3. Ensure phrase matching requires complete structure
```

**Files to Modify:**
- `lib/services/word-bank-service.ts`
- `app/components/games/AudioSequence.tsx` (validation logic)

**Acceptance:**
- [ ] "Your" stays as "Your" in word bank
- [ ] Incomplete phrases rejected (e.g., missing "you")
- [ ] Validation matches exact phrase structure

**Risk if skipped:** Users can pass with incomplete answers = broken learning

---

## 🎯 **TIER 3: USER EXPERIENCE IMPROVEMENTS (Do This Week)**

### **Task 3.1: Fix Email Verification Flow**
**Time:** 2 hours  
**Status:** 🟡 **MEDIUM PRIORITY**  
**Why:** Users need to manually refresh after verifying = poor UX

**Current State:**
- Email verification works (`app/auth/verify/page.tsx`)
- But: No polling for verification status
- User must manually refresh after clicking link

**Implementation:**
```typescript
// Add to AuthModal.tsx or verify/page.tsx
1. Poll Supabase auth state every 2-3 seconds when in verify mode
2. Auto-detect when email_confirmed_at becomes non-null
3. Auto-close modal and redirect when verified
4. Show loading state during polling
```

**Files to Modify:**
- `components/auth/AuthModal.tsx` (add polling)
- `app/auth/verify/page.tsx` (auto-refresh logic)

**Acceptance:**
- [ ] Modal auto-updates when email verified
- [ ] Verification link auto-signs user in
- [ ] No manual refresh needed

**Risk if skipped:** Poor UX, users confused about verification status

---

### **Task 3.2: Fix Supabase Email Branding**
**Time:** 3 hours  
**Status:** 🟡 **MEDIUM PRIORITY**  
**Why:** Professional emails improve trust, reduces spam folder rate (doesn't require LIVE mode)

**Current State:**
- Emails come from Supabase default sender
- "Supabase Auth" branding visible
- Unprofessional appearance

**Implementation:**
```typescript
// Configure in Supabase Dashboard
1. Set up Resend SMTP in Supabase dashboard (Settings → Auth → Email Templates)
2. Configure custom email templates:
   - Email verification template
   - Password reset template
   - Welcome email template
3. Set from address: noreply@iranopedia.com
4. Customize HTML templates (brand colors, logo)
5. Test email delivery (works on sandbox)
```

**Acceptance:**
- [ ] All auth emails come from @iranopedia.com
- [ ] No "Supabase Auth" branding visible
- [ ] Professional email templates

**Risk if skipped:** Lower trust, emails may go to spam

---

## 📊 **TIER 4: DASHBOARD & UX POLISH (Can Do Later)**

### **Task 4.1: Fix Dashboard Logic**
**Time:** 3 hours  
**Status:** 🟢 **LOW PRIORITY**  
**Why:** Dashboard shows overlap in "mastered" vs "review" lists

**Current Issue:**
- Same words appear in both lists
- Thresholds unclear

**Implementation:**
```typescript
// Fix in dashboard widgets
1. Review "mastered" calculation (HardWordsWidget)
2. Review "review" calculation (MasteredWordsWidget)
3. Set clear thresholds:
   - Mastered: 90%+ success, 5+ attempts
   - Review: <70% success OR <3 attempts
4. Ensure mutual exclusivity (can't be in both)
```

**Files to Modify:**
- `app/components/dashboard/MasteredWordsWidget.tsx`
- `app/components/dashboard/HardWordsWidget.tsx`
- `lib/services/vocabulary-tracking-service.ts` (if needed)

**Acceptance:**
- [ ] No word appears in both "mastered" and "review"
- [ ] Thresholds make sense (not too strict/loose)
- [ ] Dashboard reflects accurate performance

**Risk if skipped:** Confusing UX, but doesn't break core functionality

---

### **Task 4.2: Remove Dashboard Manual Refresh**
**Time:** 1 hour  
**Status:** 🟢 **LOW PRIORITY**  
**Why:** Better UX - auto-refresh is smoother

**Current State:**
- Dashboard has manual refresh button
- Already auto-refreshes on focus

**Implementation:**
```typescript
// Remove refresh button
// Ensure auto-refresh on page load works
```

**Files to Modify:**
- `app/dashboard/page.tsx`

**Acceptance:**
- [ ] Dashboard auto-refreshes on open
- [ ] No manual refresh button

**Risk if skipped:** Minor UX issue, doesn't break anything

---

### **Task 4.3: Fix Module Completion Flow**
**Time:** 1 hour  
**Status:** 🟢 **LOW PRIORITY**  
**Why:** Module 1 completion should show premium modal for Module 2

**Current State:**
- ModuleCompletion component exists
- May show "Next Module" button even if Module 2 is premium

**Implementation:**
```typescript
// Fix in ModuleCompletion component
1. Check if next module is premium
2. Show PremiumLockModal instead of "Next Module" button
3. Only show "Next Module" if Module 2 is free
```

**Files to Modify:**
- `app/components/ModuleCompletion.tsx`

**Acceptance:**
- [ ] Module 1 completion shows premium modal for Module 2
- [ ] Clear upgrade path
- [ ] No confusion/redirect loop

**Risk if skipped:** Users confused about premium upgrade path

---

## 🎨 **TIER 5: POLISH & OPTIMIZATION (Nice to Have)**

### **Task 5.1: Fix Access Control Messaging**
**Time:** 2 hours  
**Status:** 🟢 **LOW PRIORITY**  
**Why:** Clear messaging improves conversion

**Current Issues:**
- "Coming soon" → should be "Sign in to play"
- "Unauthorized" → should be premium upgrade modal

**Files to Modify:**
- Various components (review games, premium modules)

**Acceptance:**
- [ ] Clear "Sign in" messaging on locked features
- [ ] Premium modal is clear and actionable
- [ ] No confusing "Unauthorized" messages

---

### **Task 5.2: Add Confirm Password Field**
**Time:** 30 minutes  
**Status:** 🟢 **LOW PRIORITY**  
**Why:** Prevents typos in password, standard UX

**Files to Modify:**
- `components/auth/AuthModal.tsx`

**Acceptance:**
- [ ] Confirm password field present
- [ ] Validation works (match/mismatch)
- [ ] Clear error messages

---

### **Task 5.3: Fix Loading State Consistency**
**Time:** 1 hour  
**Status:** 🟢 **LOW PRIORITY**  
**Why:** Consistent UX across pages

**Files to Modify:**
- `app/account/page.tsx` (add loading state)
- Or remove Dashboard loading if unnecessary

**Acceptance:**
- [ ] Consistent loading states across pages
- [ ] Skeleton UI for better UX
- [ ] No confusing "blank" states

---

### **Task 5.4: Fix Hardcoded Name**
**Time:** 30 minutes  
**Status:** 🟢 **LOW PRIORITY**  
**Why:** Personalization improves UX

**Files to Modify:**
- Find texting game component
- Replace hardcoded name with `user.display_name` or `user.email`

**Acceptance:**
- [ ] Texting game uses actual user name
- [ ] Works for all users
- [ ] No placeholder/hardcoded values

---

## 🚀 **RECOMMENDED EXECUTION ORDER (Development Focus)**

### **This Week - Security & Critical Fixes (5 hours)**

**Day 1: Route Protection**
- [ ] Protect completion routes (2 hours) - **HIGH PRIORITY**
- [ ] Protect summary routes (2 hours) - **HIGH PRIORITY**

**Day 2: Bug Fixes**
- [ ] Fix word bank validation bugs (1 hour) - **MEDIUM PRIORITY**

**Total: 5 hours**

---

### **Next Week - UX Improvements (5 hours)**

**Day 1: Email Flow**
- [ ] Fix email verification flow (2 hours) - **MEDIUM PRIORITY**
- [ ] Fix email branding (3 hours) - **MEDIUM PRIORITY**

**Total: 5 hours**

---

### **Week 3 - Dashboard Polish (5 hours)**

**Day 1-2: Dashboard Fixes**
- [ ] Fix dashboard logic (3 hours) - **LOW PRIORITY**
- [ ] Remove manual refresh (1 hour) - **LOW PRIORITY**
- [ ] Fix module completion flow (1 hour) - **LOW PRIORITY**

**Total: 5 hours**

---

### **Week 4 - Final Polish (4 hours)**

**Day 1: UX Improvements**
- [ ] Fix access control messaging (2 hours) - **LOW PRIORITY**
- [ ] Add confirm password field (30 min) - **LOW PRIORITY**
- [ ] Fix loading state consistency (1 hour) - **LOW PRIORITY**
- [ ] Fix hardcoded name (30 min) - **LOW PRIORITY**

**Total: 4 hours**

---

## 📋 **MY RECOMMENDATION (As Your Boss)**

### **This Week Focus (5 hours) - Security First**
**Do Now:**
1. ✅ Route protection (completion + summary) - **4 hours**
2. ✅ Word bank validation bug fix - **1 hour**

**Why:** Security issues affect all users, even during testing. Fix these before friends/family test.

---

### **Next Week Focus (5 hours) - UX Polish**
**Do Next:**
1. ✅ Email verification flow - **2 hours**
2. ✅ Email branding - **3 hours**

**Why:** Better UX during testing = better feedback from friends/family.

---

### **Defer Until Launch Ready**
- **Stripe LIVE** - Keep on sandbox until ready for real payments
- **Legal Docs** - Last minute, couple hours max (you said you don't care about timing)

---

## 🎯 **CRITICAL DECISIONS NEEDED**

1. **Email Domain:** Do you own iranopedia.com? Need to set up DNS records for Resend.
2. **Testing:** Do you want to fix route protection first so friends/family can't break things?

---

## ⚠️ **WHAT YOU CAN SKIP (For Now)**

Based on your planning docs, these can wait:
- Mobile UX fixes (Task 4.1) - Works on mobile already
- Component separation (Task 4.2) - Not breaking anything
- Lesson preview images (Task 4.4) - Placeholders work fine
- Performance audit (Task 5.1) - Can do post-launch
- Word rush UI fixes (Task 5.3) - Not critical

**Focus on security + bugs first, polish later.**

---

## 📊 **SUCCESS METRICS**

**This Week Deliverables:**
- [ ] All routes protected
- [ ] Critical bugs fixed

**Next Week Deliverables:**
- [ ] Email verification smooth
- [ ] Professional email templates

**Launch Readiness (Later):**
- [ ] Stripe LIVE (when ready) ✅
- [ ] Legal docs (last minute) ✅
- [ ] Security hardened ✅
- [ ] Critical bugs fixed ✅

---

**Next Step:** Start with route protection (completion + summary routes). These are security issues that affect testing.

