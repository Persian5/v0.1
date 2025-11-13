# Grammar System Audit Report
**Date:** November 13, 2025  
**Status:** Phase 1 - Audit Complete

---

## Executive Summary

- **Total grammar-concept steps found:** 5
- **Steps already converted to new system:** 1 (ezafe-connector)
- **Steps requiring conversion:** 4
- **Modules affected:** Module 1, Module 2, Module 3
- **Total lessons affected:** 5 lessons

---

## 1. Grammar Concepts Inventory

### ✅ Already Converted
| ConceptID | Module | Lesson | Current Status |
|-----------|--------|--------|----------------|
| `ezafe-connector` | Module 1 | Lesson 3 | ✅ Converted to 3-step sequence (grammar-intro + 2x grammar-fill-blank) |

### 🔴 Requires Conversion
| ConceptID | Module | Lesson | XP | Location (Line) |
|-----------|--------|--------|----|----|
| `verb-contraction` | Module 1 | Lesson 3: "Questions: Chi & Chiye" | 2 XP | ~Line 868 |
| `adjective-suffixes` | Module 2 | Lesson 1: "Adjective Suffixes –am & –i" | 2 XP | ~Line 1481 |
| `connectors-placement` | Module 2 | Lesson 5: "Connectors: va, ham, vali" | 0 XP | ~Line 2334 |
| `possession-suffixes` | Module 3 | Lesson 2: "My & Your" | 3 XP | ~Line 3324 |

---

## 2. Lesson Distribution Analysis

### Module 1: Greetings & Politeness
- **Lesson 3** (Questions: Chi & Chiye) 
  - ✅ `ezafe-connector` - Converted
  - 🔴 `verb-contraction` - Needs conversion
  - **Issue:** 2 grammar concepts in 1 lesson (OVERLOAD)

### Module 2: Responses & Feelings
- **Lesson 1** (Adjective Suffixes –am & –i)
  - 🔴 `adjective-suffixes` - Needs conversion
  - **Marked:** `grammarLesson: true`

- **Lesson 5** (Connectors: va, ham, vali)
  - 🔴 `connectors-placement` - Needs conversion
  - **Note:** 0 XP (possibly placeholder)

### Module 3: Personal Info
- **Lesson 2** (My & Your)
  - 🔴 `possession-suffixes` - Needs conversion
  - **Marked:** `grammarLesson: true`

---

## 3. Current Grammar Concepts - Content Overview

### 1. verb-contraction
- **Current Location:** Module 1, Lesson 3
- **XP:** 2
- **Context:** Appears after learning "chi" (what)
- **Vocabulary prerequisites:** chi, esme, shoma, chiye
- **Likely teaches:** How "chi" + "ye" → "chiye" (what is)
- **🚩 VERIFICATION NEEDED:** Research verb contraction rules in Persian

### 2. adjective-suffixes
- **Current Location:** Module 2, Lesson 1
- **XP:** 2
- **Context:** First lesson in Module 2, dedicated grammar lesson
- **Vocabulary prerequisites:** khoob, khoobam, khoobi
- **Teaches:** -am (I am) and -i (you are) suffixes for adjectives
- **Example:** khoob → khoobam (I am good), khoob → khoobi (you are good)
- **🚩 VERIFICATION NEEDED:** Ensure this is distinct from noun possession

### 3. connectors-placement
- **Current Location:** Module 2, Lesson 5
- **XP:** 0 (likely placeholder)
- **Context:** After learning va (and), ham (also), vali (but)
- **Vocabulary prerequisites:** va, ham, vali
- **Teaches:** Where to place connectors in sentences
- **Example:** "Iran ___ Amrika" → "Iran va Amrika"
- **🚩 VERIFICATION NEEDED:** Is this a syntax rule or just practice?

### 4. possession-suffixes
- **Current Location:** Module 3, Lesson 2
- **XP:** 3
- **Context:** Dedicated grammar lesson
- **Vocabulary prerequisites:** esm, esmam, esmet, hast, in
- **Teaches:** -am (my) and -et (your) suffixes for nouns
- **Example:** esm → esmam (my name), esm → esmet (your name)
- **🚩 VERIFICATION NEEDED:** Distinguish from adjective suffixes

---

## 4. Vocabulary Prerequisites Analysis

### ezafe-connector (Module 1, Lesson 3) ✅
- **Required vocab:** esm, man, shoma
- **Status:** All learned in Lesson 1-2
- **✅ Dependencies satisfied**

### verb-contraction (Module 1, Lesson 3) 🔴
- **Required vocab:** chi, chiye, esme, shoma
- **Status:** chi learned in same lesson, chiye is the grammar concept itself
- **⚠️ Potential issue:** Teaching contraction while introducing the words

### adjective-suffixes (Module 2, Lesson 1) ✅
- **Required vocab:** khoob (base adjective)
- **Status:** khoob learned in same lesson before grammar
- **✅ Dependencies satisfied**

### connectors-placement (Module 2, Lesson 5) ✅
- **Required vocab:** va, ham, vali
- **Status:** All learned in same lesson before grammar
- **✅ Dependencies satisfied**

### possession-suffixes (Module 3, Lesson 2) ✅
- **Required vocab:** esm
- **Status:** Learned in Module 1
- **✅ Dependencies satisfied**

---

## 5. Issues Identified

### 🔴 Critical Issues
1. **Multiple grammar in one lesson:** Module 1, Lesson 3 has both `ezafe-connector` AND `verb-contraction`
2. **Missing content:** `connectors-placement` has 0 XP (might be incomplete)
3. **Unclear distinction:** `adjective-suffixes` vs `possession-suffixes` - are these the same suffixes in different contexts?

### ⚠️ Moderate Issues
1. **Grammar density:** Module 2 has 2 grammar lessons out of 7
2. **Missing spacing:** Some grammar concepts appear back-to-back without vocabulary lessons between
3. **Vocabulary timing:** `verb-contraction` teaches contraction while introducing the words

### ✅ Strengths
1. **Good progression:** Basic → intermediate → advanced generally flows well
2. **Vocabulary integration:** Most grammar appears after relevant vocabulary is learned
3. **Clear focus:** Each grammar concept targets one specific rule

---

## 6. Grammar Concepts Requiring Conversion

Total: **4 concepts**

1. ✅ verb-contraction
2. ✅ adjective-suffixes
3. ✅ connectors-placement
4. ✅ possession-suffixes

---

## 7. Recommended Next Steps

### Immediate Actions (Before Conversion)
1. **Research all 4 grammar concepts** on Persian language websites
2. **Clarify suffixes:** Are adjective -am/-i and possession -am/-et the same or different?
3. **Verify verb-contraction:** Is "chi + ye → chiye" actually a contraction or just a compound word?
4. **Determine connectors-placement content:** What should this teach (0 XP suggests it's incomplete)?

### Conversion Priority
1. **Priority 1:** `adjective-suffixes` (Module 2, Lesson 1) - clear, well-positioned
2. **Priority 2:** `possession-suffixes` (Module 3, Lesson 2) - clear, well-positioned
3. **Priority 3:** `verb-contraction` (Module 1, Lesson 3) - needs vocabulary timing fix
4. **Priority 4:** `connectors-placement` (Module 2, Lesson 5) - needs content clarification

### Reordering Strategy
1. **Remove one grammar from Module 1, Lesson 3** (either ezafe or verb-contraction)
2. **Space out Module 2 grammar** (lessons 1 and 5 → add buffer lessons)
3. **Add 1-2 vocabulary lessons between grammar concepts**

---

## Questions for Native Speaker (You)

### About verb-contraction:
1. Is "chi + ye → chiye" actually a verb contraction, or is it just a compound word?
2. Should this be taught as a grammar rule, or just learned as vocabulary?
3. What's the actual linguistic term for this in Persian?

### About adjective vs possession suffixes:
1. Are -am/-i for adjectives the SAME suffixes as -am/-et for nouns?
2. If yes, should we teach them together or separately?
3. If no, what's the difference between "khoobam" (I am good) and "esmam" (my name)?

### About connectors-placement:
1. What should this grammar concept actually teach?
2. Is there a specific rule for where connectors go in sentences?
3. Or is this just practice/reinforcement of connector usage?

### Content Quality:
1. Are there any Persian grammar concepts missing from the curriculum?
2. Should we add more advanced concepts (e.g., past tense, plurals)?
3. What's the most important grammar for conversational Persian?

---

## Next Phase Preview

**Phase 2: Research & Content Creation**
- Research each grammar concept on Persian websites
- Write new grammar-intro content (simple explanations)
- Create fill-blank exercises (suffix-only and suffix+word)
- Map optimal placement for each concept
- Create final conversion plan

---

**Audit completed by:** AI Assistant  
**Verification required by:** Native Persian Speaker (User)  
**Status:** Awaiting user feedback before proceeding to Phase 2

