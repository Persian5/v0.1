# 🚀 6-DAY CURSOR SPRINT PLAN

**Goal:** Maximize AI assistance to complete critical launch blockers  
**Constraint:** 6 days until Cursor plan expires  
**Focus:** Tasks that benefit MOST from AI (code, architecture, complex logic)

---

## 📅 DAY-BY-DAY BREAKDOWN

### **DAY 1: Grammar Forms Database + Tracking** ⚡ HIGHEST PRIORITY
**Why:** Foundation for everything else. AI excels at database design + migrations.

**Tasks:**
1. ✅ Create `grammar_forms_performance` table (track root + suffix + composite)
2. ✅ Create `grammar_forms_attempts` table (detailed logging)
3. ✅ Update `TrackingService` to log grammar forms separately
4. ✅ Migration file + RLS policies

**Deliverable:** Database ready to track "khoobam", "khoobi", "neestam", etc.

**Time:** 4-6 hours with AI

---

### **DAY 2: Review Games Grammar Forms Support** 🎮 CRITICAL FEATURE
**Why:** Users can't review grammar forms without this. Complex logic = AI excels.

**Tasks:**
1. ✅ Update `ReviewSessionService.getVocabularyForFilter()` to include grammar forms
2. ✅ Generate grammar forms dynamically from learned base words + suffixes
3. ✅ Update `ReviewAudioDefinitions` to handle `LexemeRef`
4. ✅ Update other review games (Memory, Matching, Word Rush)

**Deliverable:** Review games can review "khoobam", "khoobi", etc.

**Time:** 6-8 hours with AI

---

### **DAY 3: Module 2 Structure Setup** 📚 CONTENT FOUNDATION
**Why:** You'll rebuild content manually, but AI sets up the structure/patterns.

**Tasks:**
1. ✅ Audit Module 2 lessons in curriculum.ts
2. ✅ Ensure all use LexemeRef patterns (not hardcoded vocab)
3. ✅ Fix any broken step types
4. ✅ Standardize vocabulary definitions

**Deliverable:** Module 2 structure ready, you fill in content manually

**Time:** 3-4 hours with AI (you do content separately)

---

### **DAY 4: Module 3 Structure Setup** 📚 CONTENT FOUNDATION
**Why:** Same as Day 3, but for Module 3.

**Tasks:**
1. ✅ Audit Module 3 lessons in curriculum.ts
2. ✅ Ensure all use LexemeRef patterns
3. ✅ Fix any broken step types
4. ✅ Standardize vocabulary definitions

**Deliverable:** Module 3 structure ready, you fill in content manually

**Time:** 3-4 hours with AI (you do content separately)

---

### **DAY 5: Code Cleanup Sprint** 🧹 TECHNICAL DEBT
**Why:** AI excels at refactoring. Do this while you have AI help.

**Tasks:**
1. ✅ Remove dead code (unused imports, commented code)
2. ✅ Fix obvious bugs (console errors, type errors)
3. ✅ Add critical comments (complex logic explanations)
4. ✅ Standardize patterns (consistent helper usage)
5. ✅ Fix any remaining React hooks violations

**Deliverable:** Cleaner, more maintainable codebase

**Time:** 4-6 hours with AI

---

### **DAY 6: Critical Bug Fixes + Testing** 🐛 STABILITY
**Why:** Fix anything broken from Days 1-5. AI helps debug.

**Tasks:**
1. ✅ Test grammar forms tracking end-to-end
2. ✅ Test review games with grammar forms
3. ✅ Fix any breaking changes
4. ✅ Update documentation (README, comments)
5. ✅ Commit everything with clear messages

**Deliverable:** Stable codebase ready for manual content work

**Time:** 4-6 hours with AI

---

## 🎯 WHAT TO SKIP (DO MANUALLY LATER)

- ❌ Manual testing of onboarding flow (you can do this)
- ❌ UI polish (you can do this)
- ❌ Content writing for modules 2/3 (you do this manually)
- ❌ Leaderboard improvements (post-launch)
- ❌ Dashboard polish (post-launch)

---

## 📊 SUCCESS METRICS

**By end of Day 6, you should have:**
- ✅ Grammar forms tracked in database
- ✅ Review games support grammar forms
- ✅ Module 2/3 structure ready (you fill content)
- ✅ Cleaner codebase (no obvious technical debt)
- ✅ All critical bugs fixed

**What you'll do manually after:**
- Fill in Module 2/3 content
- Test onboarding flow
- UI polish
- Manual QA testing

---

## 🚨 CRITICAL: FOCUS ON AI-ASSISTABLE TASKS

**AI is GREAT at:**
- Database schema design
- Complex logic (review games, tracking)
- Code refactoring
- Bug fixing
- Pattern standardization

**AI is NOT needed for:**
- Content writing (you do this)
- Manual testing (you do this)
- UI design decisions (you do this)

---

## 💡 PRO TIPS

1. **Commit after each day** - Don't lose work
2. **Test incrementally** - Don't wait until Day 6
3. **Ask AI to explain** - If something is unclear, ask
4. **Don't over-engineer** - MVP is fine, polish later
5. **Document as you go** - Comments help future you

---

## 🔄 IF YOU GET STUCK

**Day 1-2:** Focus on grammar forms tracking (foundation)
**Day 3-4:** If stuck, skip to Day 5 (cleanup is always valuable)
**Day 5-6:** Fix anything broken, don't add new features

**Remember:** 6 days of AI help > perfect code. Get it working, polish later.


