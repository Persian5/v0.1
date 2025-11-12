# Prioritized Action Plan - Launch Readiness

**Based on:** All issues from your comprehensive list  
**Target:** July 7, 2025 Launch  
**Approach:** Fix critical blockers first, then polish

---

## 🚨 **CRITICAL LAUNCH BLOCKERS** (Fix This Week)

These issues will prevent users from completing signup or core flows. Must fix immediately.

### 1. Email Verification Modal - Email Overflow (30 min)
**Issue:** Long emails overflow modal, go off screen  
**File:** `components/auth/AuthModal.tsx` (line 296)  
**Fix:** Add text wrapping/truncation with tooltip for full email

```typescript
// Line 296 - Replace with:
<p className="font-medium break-words px-4 text-sm sm:text-base">
  {email.length > 40 ? (
    <span title={email} className="truncate block">
      {email.substring(0, 40)}...
    </span>
  ) : (
    email
  )}
</p>
```

### 2. Resend Email Not Working in Signup Modal (1 hour)
**Issue:** Resend button in verify mode doesn't work after signup  
**File:** `components/auth/AuthModal.tsx` (line 194-212)  
**Problem:** Error handling clears success message, no user feedback  
**Fix:** Add success state and proper error display

```typescript
// Add success state
const [resendSuccess, setResendSuccess] = useState(false)

// Update handleResendVerification:
const handleResendVerification = async () => {
  setIsResendingVerification(true)
  setError(null)
  setResendSuccess(false)

  try {
    const { error } = await resendVerification(email)
    if (error) {
      setError(error)
    } else {
      setResendSuccess(true)
      setTimeout(() => setResendSuccess(false), 5000)
    }
  } catch (error) {
    setError('Failed to resend verification email')
  } finally {
    setIsResendingVerification(false)
  }
}

// Add success message display after line 300:
{resendSuccess && (
  <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-2 text-center">
    Verification email resent! Check your inbox.
  </div>
)}
```

### 3. Supabase Email Branding (2-3 hours)
**Issue:** Emails show "Supabase" branding, looks unprofessional  
**Files:** Supabase dashboard configuration  
**Fix:** Configure Resend SMTP in Supabase dashboard
- Go to Supabase Dashboard → Authentication → Email Templates
- Set up Resend SMTP (requires Resend account)
- Customize email templates with your branding
- Test verification and password reset emails

**Acceptance Criteria:**
- [ ] All emails from @iranopedia.com (or your domain)
- [ ] No "Supabase Auth" branding visible
- [ ] Professional email templates

### 4. Module 1 Complete - Premium Button Logic (1 hour)
**Issue:** After Module 1 completion, premium button disappears but logic blocks progression  
**File:** `app/modules/[moduleId]/[lessonId]/page.tsx` or module access service  
**Fix:** Ensure free users can access Module 2 Lesson 1 after completing Module 1

**Check:** `lib/services/module-access-service.ts` or similar - verify Module 2 access logic

---

## 🔴 **HIGH PRIORITY UX ISSUES** (Fix This Week)

These significantly impact user experience and should be fixed before launch.

### 5. Dashboard Logic - Mastered vs Review Overlap (2-3 hours)
**Issue:** Same words appear in both "mastered" and "review" lists  
**File:** Dashboard widgets or vocabulary service  
**Fix:** Ensure mutual exclusivity

**Thresholds:**
- **Mastered:** 90%+ success rate AND 5+ attempts
- **Review:** <70% success rate OR <3 attempts
- **Neither:** 70-90% success (in progress, not mastered, not needing review)

**Files to check:**
- `app/dashboard/page.tsx`
- `lib/services/vocabulary-tracking-service.ts`
- Dashboard widgets (WordsLearnedWidget, MasteredWordsWidget, HardWordsWidget)

### 6. Review Mode Logic - Locked After Learning Words (1 hour)
**Issue:** Review mode locked after learning 4 words in Lesson 1  
**Decision needed:** What's the unlock threshold?
- Option A: Unlock after X words learned (e.g., 10 words)
- Option B: Unlock after completing X lessons (e.g., Lesson 2)
- Option C: Always unlocked (current behavior might be intentional)

**File:** Review mode access check - likely in review page or service

### 7. Input Games - Suffix/Root Letter-by-Letter Feedback (2 hours)
**Issue:** Suffix/root games don't have letter-by-letter feedback like regular input  
**File:** `app/components/games/GrammarConcept.tsx` (line 570-609)  
**Current:** Has letter-by-letter display but may not be working correctly  
**Fix:** Ensure same visual feedback as `InputExercise.tsx` ValidatedLetterInput component

**Check:** Compare `GrammarConcept.tsx` letter validation with `InputExercise.tsx` line 179-253

### 8. Module/Lesson Completion XP Display (1 hour)
**Issue:** Shows "0 XP" or total XP instead of specific XP earned  
**Files:**
- `components/lesson/CompletionView.tsx` (line 152) - shows `xpGained ?? totalXp`
- `app/components/ModuleCompletion.tsx` (line 187) - shows `totalXpEarned` which is 0

**Fix:**
- **Lesson completion:** Already receives `xpGained` prop - ensure it's passed correctly from LessonRunner
- **Module completion:** Calculate actual XP earned in module (sum of all lesson XP)

**File to check:** `app/modules/[moduleId]/[lessonId]/page.tsx` - verify XP is passed to completion view

### 9. Content Issues - Parent Questions (1 hour)
**Issue:** "Mother is from Iran" / "Father is from Iran" - needs "my" or "your"  
**File:** `lib/config/curriculum.ts` - Module 3, parents practice lesson  
**Fix:** Update questions to be specific:
- "Is your mother from Iran?"
- "Is my father from Iran?"
- etc.

### 10. Content Issues - Khahar Matching Game (30 min)
**Issue:** Khahar matching game appears before it's introduced in siblings lesson  
**File:** `lib/config/curriculum.ts`  
**Fix:** Move khahar introduction earlier OR move matching game later

### 11. Content Issues - Text Sequence "I" Consistency (1 hour)
**Issue:** Sometimes says "I" twice, sometimes not - inconsistent  
**File:** `lib/config/curriculum.ts` - TextSequence steps  
**Fix:** Review all text sequences, standardize when "I" is needed

### 12. Module 2 Lesson 5 - Confusing Questions (1 hour)
**Issue:** Last couple questions very confusing  
**File:** `lib/config/curriculum.ts` - Module 2, Lesson 5  
**Fix:** Review and simplify/clarify questions

---

## 🟡 **MEDIUM PRIORITY POLISH** (Fix Next Week)

Important for polish but not blocking launch.

### 13. Access Control Messaging (2 hours)
**Issue:** Review games show confusing messages when not logged in  
**Files:** Review game pages/components  
**Fix:** Change messages to "Sign in to play" instead of "Unauthorized" or "Coming soon"

**Files to check:**
- Review game pages in `app/review/` or components
- Module access modals

### 14. 0 XP Display for Signed-Out Users (30 min)
**Issue:** Shows "0 XP" in corner when signed out  
**Decision needed:** Hide it or show with ghost state?  
**Recommendation:** Hide it - only show XP when logged in

**File:** XP display component (likely in header/navbar)

### 15. Dashboard Loading State Consistency (1 hour)
**Issue:** Dashboard has loading state, Account doesn't  
**Fix:** Add loading state to Account page OR remove from Dashboard if unnecessary

**Files:**
- `app/dashboard/page.tsx`
- `app/account/page.tsx`

### 16. Premium Button State - Free vs Premium (1 hour)
**Issue:** Premium button takes a second to switch to "Continue Module" for premium users  
**Fix:** Improve loading state or cache premium status

**Files:** Module page components, premium check service

### 17. Previous Step Button - Mobile Layout (1 hour)
**Issue:** Button takes up screen space on mobile, content should move down  
**File:** Lesson page or LessonRunner component  
**Fix:** Adjust mobile layout - move button or adjust spacing

### 18. Checkout - Email Required (30 min)
**Issue:** Can't checkout without signing up for email  
**Fix:** Add email field to checkout OR require signup before checkout

**File:** Checkout page or API

---

## 🟢 **CONTENT QUALITY** (Ongoing - Can Do in Parallel)

### 19. Grammar Concepts Content Overhaul (2-3 hours)
**Issue:** UI is good, content needs manual re-editing  
**File:** `lib/config/curriculum.ts` - Grammar concept steps  
**Action:** Review and rewrite all grammar concept content
- Keep UI/visuals as-is
- Replace all text content with better explanations
- Test with native speakers if possible

### 20. Missing Audio Files (2-4 hours)
**Issue:** Basic audios missing (Bob, Sara, Amir, etc.) - not in vocab  
**Files:** 
- `public/audio/` directory
- `lib/config/curriculum.ts` - check which words need audio

**Action:**
1. Identify all missing audio files
2. Generate/record audio files
3. Add to `public/audio/`
4. Update curriculum.ts to reference audio files

### 21. Lesson Preview Images (2 hours)
**Issue:** All lessons use placeholder image  
**Files:** Lesson preview components  
**Action:** Create/select unique preview images for each lesson

**Files to check:**
- Module/lesson card components
- Lesson preview components

---

## 🔵 **POST-LAUNCH IMPROVEMENTS** (After Launch)

### 22. Review Mode - Khoobi Wrong Leads to Shoma Review (2 hours)
**Issue:** Getting khoobi wrong triggers review of shoma - needs revamp  
**File:** Review mode logic or vocabulary tracking  
**Note:** This is a deeper architectural issue - may need review algorithm changes

### 23. Phonetic Spelling Hints in Flashcards (1-2 hours)
**Issue:** Better phonetic spelling needed in flashcard hints  
**File:** Flashcard component  
**Action:** Improve phonetic accuracy and formatting

### 24. Dynamic Summary Pages - XP, Words, Skills (2 hours)
**Issue:** Completion pages need dynamic content (XP, words learned, skills mastered)  
**Files:**
- `components/lesson/CompletionView.tsx`
- `app/components/ModuleCompletion.tsx`

**Action:** Calculate and display:
- Specific XP earned
- Words learned in lesson/module
- Skills mastered

### 25. SEO for Pages (3-4 hours)
**Action:** Add meta tags, descriptions, Open Graph tags to all pages

### 26. Legal Pages (4-6 hours)
- Privacy Policy
- Terms of Service
- Refund Policy
- Link in footer

### 27. Analytics Implementation (4-6 hours)
**Events to track:**
- Lesson start
- Lesson complete
- Step wrong/right
- Checkout complete
- Review game plays

---

## 📋 **WEEKLY EXECUTION PLAN**

### **Week 1 (This Week) - Critical Fixes**
**Day 1-2:**
- [ ] Fix email modal overflow (#1)
- [ ] Fix resend email functionality (#2)
- [ ] Set up Resend SMTP for Supabase (#3)
- [ ] Fix Module 1 completion premium logic (#4)

**Day 3-4:**
- [ ] Fix dashboard mastered/review overlap (#5)
- [ ] Fix input games letter-by-letter feedback (#7)
- [ ] Fix completion XP display (#8)
- [ ] Fix content issues (parents, khahar, text sequences) (#9, #10, #11)

**Day 5:**
- [ ] Fix Module 2 Lesson 5 confusing questions (#12)
- [ ] Test all fixes
- [ ] Document any remaining issues

### **Week 2 - Polish & Content**
**Day 1-2:**
- [ ] Access control messaging (#13)
- [ ] XP display for signed-out users (#14)
- [ ] Dashboard/Account loading consistency (#15)
- [ ] Premium button state (#16)
- [ ] Mobile layout fixes (#17)

**Day 3-4:**
- [ ] Grammar concepts content overhaul (#19)
- [ ] Missing audio files (#20)
- [ ] Lesson preview images (#21)

**Day 5:**
- [ ] Review mode unlock logic decision (#6)
- [ ] Checkout email requirement (#18)
- [ ] Final testing

### **Week 3 - Pre-Launch**
- [ ] SEO implementation
- [ ] Legal pages
- [ ] Analytics setup
- [ ] Final content review
- [ ] Mobile QA
- [ ] Performance audit

---

## 🎯 **SUCCESS METRICS**

**Before Launch:**
- [ ] All critical blockers fixed
- [ ] All high-priority UX issues resolved
- [ ] Content quality acceptable (grammar concepts, questions)
- [ ] Email branding professional
- [ ] No broken user flows

**Launch Readiness:**
- [ ] Signup → Email verification → Lesson completion flow works
- [ ] Payment flow works
- [ ] Review mode accessible
- [ ] Dashboard shows accurate data
- [ ] Mobile responsive

---

## 📝 **NOTES**

1. **Grammar Concepts:** Keep UI, replace content - can be done in parallel with other work
2. **Review Mode Logic:** Need decision on unlock threshold before implementing
3. **XP Display:** Need to verify XP calculation and passing through components
4. **Content Issues:** Many are quick fixes in curriculum.ts - batch these together
5. **Email Branding:** Requires external service setup (Resend) - may need help

---

**Next Steps:**
1. Start with Critical Launch Blockers (#1-4)
2. Move to High Priority UX Issues (#5-12)
3. Polish and content in parallel
4. Post-launch improvements can wait

