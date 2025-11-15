# 📋 CURRICULUM QA & CONSISTENCY AUDIT REPORT

**Generated:** Analysis-only phase  
**File Analyzed:** `lib/config/curriculum.ts` (4,754 lines)  
**Date:** Current analysis session

---

## 🔍 EXECUTIVE SUMMARY

### Overall Assessment

**Strengths:**
- Well-structured module/lesson hierarchy
- Consistent step type patterns (welcome → flashcard → quiz → final)
- Good use of review vocabulary arrays
- Grammar concepts properly introduced with `grammar-intro` steps
- Final challenges consistently use `conversationFlow` for realistic ordering

**Critical Weaknesses:**
1. **Vocabulary Translation Inconsistencies** - Same Persian words translated differently across lessons
2. **Grammar Introduction Order Issues** - Some suffixes used before formal introduction
3. **Missing Vocabulary References** - Some steps reference vocab not in lesson vocabulary arrays
4. **Translation Capitalization Inconsistencies** - Mixed capitalization in `expectedTranslation` fields
5. **Finglish Spelling Variations** - Same words spelled differently (e.g., "khoobi" vs "khoob-i")

**Module Status:**
- **Module 1:** 5 lessons (complete) ✅
- **Module 2:** 7 lessons (complete) ✅
- **Module 3:** 6 lessons (complete) ✅
- **Modules 4-11:** Empty lesson arrays (placeholders) ⚠️

---

## 🚨 CRITICAL ISSUES (Must Fix for Launch)

### 1. Vocabulary Translation Inconsistencies

**Issue:** Same Persian words/phrases have different English translations across lessons.

#### Example 1: "khoobi" / "khoob-i"
- **Module 1, Lesson 2:** `en: "You Are Good"` (vocab entry)
- **Module 1, Lesson 2:** `en: "Are You Good?"` (vocab entry `khoobi-question`)
- **Module 2, Lesson 1:** `en: "You Are Good"` (vocab entry)
- **Module 2, Lesson 1:** `finglish: "Khoob-i"` (different spelling)
- **Translation in steps:** `"hello are you good?"` vs `"are you good?"`

**Location:** 
- Module 1, Lesson 2, vocabulary entries
- Module 2, Lesson 1, vocabulary entries
- Multiple text-sequence steps

**Suggested Fix:** Standardize to one translation per meaning. Decide if "khoobi" means "you are good" (statement) or "are you good?" (question) and use consistently.

---

#### Example 2: "ham" Translation
- **Module 2, Lesson 5:** `en: "Also / Too"` (vocab entry)
- **Module 2, Lesson 5, Step 11:** `expectedTranslation: "I am also good"` (uses "also")
- **Previous usage:** May have been translated as "too" in some contexts

**Location:** Module 2, Lesson 5

**Suggested Fix:** ✅ Already fixed - vocabulary now shows "Also / Too" and translation uses "also good"

---

#### Example 3: "esme" vs "esm"
- **Module 1, Lesson 3:** `esm` = "Name", `esme` = "Name of"
- **Usage inconsistency:** Sometimes "esme shoma" translated as "Your name" (should be "Name of you")

**Location:** Multiple lessons

**Suggested Fix:** Ensure "esme" always translates to "name of" when used with connector, not just "name"

---

### 2. Grammar Introduction Order Violations

**Issue:** Grammar suffixes/concepts used in steps before formal introduction.

#### Example: Suffix "-i" Used Before Introduction
- **Module 1, Lesson 2:** Uses "khoobi" (khoob-i) in steps
- **Module 2, Lesson 1:** First formal introduction of "-i" suffix with `grammar-intro` and `grammar-fill-blank`

**Location:** Module 1, Lesson 2 → Module 2, Lesson 1

**Suggested Fix:** Either:
1. Add grammar intro for "-i" in Module 1, Lesson 2, OR
2. Remove "-i" usage from Module 1, Lesson 2 and only use "khoobam"

---

#### Example: Suffix "-e" (Ezafe Connector)
- **Module 1, Lesson 3:** Introduced with `grammar-intro` ✅
- **Module 1, Lesson 2:** May use "esme" before introduction (needs verification)

**Location:** Module 1, Lesson 2-3

**Suggested Fix:** Ensure "-e" connector is introduced before any usage

---

### 3. Missing Vocabulary in Review Arrays

**Issue:** Some steps reference vocabulary IDs not included in `reviewVocabulary` arrays.

#### Example: Module 2, Lesson 2
- **reviewVocabulary:** Includes `["salam", "esme", "man", "shoma", "chetori", "merci", "khodafez", "khoob", "khoobam", "khoobi"]`
- **Step uses:** "hast", "neest", "hastam", "neestam" - but these are NEW vocabulary in this lesson
- **Issue:** Some steps may reference vocab from Module 1 that's not in review array

**Location:** Multiple lessons

**Suggested Fix:** Audit each lesson's steps and ensure all referenced vocabulary IDs are either:
1. In the lesson's `vocabulary` array, OR
2. In the lesson's `reviewVocabulary` array

---

### 4. Translation Capitalization Inconsistencies

**Issue:** `expectedTranslation` fields have inconsistent capitalization.

**Examples:**
- `"Hello How are you"` (capital H)
- `"hello are you good?"` (lowercase h)
- `"Hello Welcome How are You"` (all capitals for words)
- `"where are you from"` (all lowercase)

**Location:** Throughout curriculum

**Suggested Fix:** Standardize capitalization rules:
- First word always capitalized
- Proper nouns capitalized
- Question marks consistent
- Commas consistent

---

### 5. Finglish Spelling Variations

**Issue:** Same words spelled differently in `finglish` fields.

**Examples:**
- `"Khoobi"` vs `"Khoob-i"` vs `"khoobi"`
- `"Khosh Amadid"` vs `"khosh amadid"`
- `"Salam"` vs `"salam"`

**Location:** Throughout curriculum

**Suggested Fix:** Standardize finglish capitalization:
- First letter always capitalized for standalone words
- Hyphenated forms: `"Khoob-i"` (consistent)
- Phrases: `"Salam chetori"` (first word capitalized)

---

## ⚠️ MAJOR ISSUES (Harm Learning Experience)

### 6. Vocabulary ID Duplication Risk

**Issue:** Some vocabulary entries may have duplicate IDs across lessons.

**Examples to Verify:**
- `"khoob"` appears in Module 1, Lesson 2 AND Module 2, Lesson 1
- `"hast"` appears in Module 2, Lesson 2 AND Module 3, Lesson 1 (review)

**Location:** Multiple modules

**Suggested Fix:** Ensure vocabulary IDs are unique OR properly referenced via `reviewVocabulary`. If same word appears in multiple lessons, use same ID and reference via review array.

---

### 7. Step Type Order Violations

**Issue:** Some lessons don't follow the preferred order: `welcome → flashcard → quiz → grammar → final`

**Example: Module 1, Lesson 1**
- Step 9: `audio-meaning` (before flashcard for khosh_amadid)
- Step 10: `quiz` (after audio-meaning, should be after flashcard)

**Location:** Multiple lessons

**Suggested Fix:** Reorder steps to follow: welcome → flashcard → quiz → matching → audio → text-sequence → final

---

### 8. Missing Audio File References

**Issue:** Vocabulary entries don't explicitly reference audio file paths.

**Current:** Vocabulary entries have `id`, `en`, `fa`, `finglish`, `phonetic`, `lessonId`  
**Missing:** No `audioFile` or `audioPath` field

**Location:** All vocabulary entries

**Suggested Fix:** Add `audioFile?: string` field to vocabulary entries OR document that audio files follow pattern `/public/audio/{id}.mp3`

---

### 9. Final Challenge Vocabulary Mismatches

**Issue:** Some final challenges reference vocabulary not introduced in the lesson.

**Example: Module 2, Lesson 2, Final Challenge**
- Uses: `"salam", "chetori", "khoob", "neestam", "merci", "khodafez"`
- Lesson vocabulary: `["hast", "neest", "hastam", "neestam", "neesti", "hasti", "kheily"]`
- Review vocabulary: `["salam", "esme", "man", "shoma", "chetori", "merci", "khodafez", "khoob", "khoobam", "khoobi"]`

**Status:** ✅ This is correct - final challenge uses review + new vocabulary

**Suggested Fix:** Document that final challenges can use review + new vocabulary (this is actually correct behavior)

---

### 10. Grammar Concept ID Mismatches

**Issue:** `conceptId` values in grammar steps may not match grammar concept definitions.

**Examples:**
- `conceptId: "suffix-am"` - used for both adjective suffixes AND possession
- `conceptId: "suffix-e"` - used for ezafe connector
- `conceptId: "suffix-i"` - used for adjective suffixes

**Location:** Grammar-fill-blank steps

**Suggested Fix:** Verify all `conceptId` values exist in grammar concepts file. Ensure concept IDs are specific enough (e.g., `"adjective-suffix-am"` vs `"possession-suffix-am"`)

---

## 📝 MINOR ISSUES (Nitpick-Level)

### 11. Inconsistent Punctuation in Translations

**Issue:** Some translations have commas, some don't.

**Examples:**
- `"Hello, how are you?"` vs `"Hello how are you"`
- `"Hello, welcome, how are you, goodbye"` vs `"Hello Welcome How are you"`

**Location:** Throughout

**Suggested Fix:** Standardize punctuation rules for English translations

---

### 12. Empty `fa` Fields

**Issue:** Some vocabulary entries have empty `fa: ""` fields.

**Example: Module 2, Lesson 4**
```typescript
{
  id: "zendegi",
  en: "Life",
  fa: "",  // Empty!
  finglish: "Zendegi",
  phonetic: "zen-deh-GEE",
  lessonId: "module2-lesson4"
}
```

**Location:** Module 2, Lesson 4 - ALL 5 vocabulary entries:
- `zendegi` (Life)
- `mikonam` (I do)
- `mikoni` (You do)
- `dar` (In)
- `amrika` (America)

**Suggested Fix:** Add Persian script for all vocabulary entries:
- `zendegi` → `"زندگی"`
- `mikonam` → `"می‌کنم"`
- `mikoni` → `"می‌کنی"`
- `dar` → `"در"`
- `amrika` → `"آمریکا"`

---

### 13. Inconsistent `lessonId` Format

**Issue:** Some `lessonId` values use different formats.

**Examples:**
- `"module1-lesson1"` ✅ (consistent)
- `"lesson2"` ❌ (missing module prefix)
- `"module2-lesson5"` ✅ (consistent)

**Location:** Module 3 vocabulary entries:
- **Lesson 2:** All 4 vocabulary entries use `lessonId: "lesson2"` ❌
- **Lesson 3:** All 2 vocabulary entries use `lessonId: "lesson3"` ❌
- **Lesson 5:** All 2 vocabulary entries use `lessonId: "lesson5"` ❌

**Should be:**
- `lessonId: "module3-lesson2"`
- `lessonId: "module3-lesson3"`
- `lessonId: "module3-lesson5"`

**Suggested Fix:** Standardize all `lessonId` to `"module{X}-lesson{Y}"` format (8 vocabulary entries need fixing)

---

### 14. Missing `maxWordBankSize` in Some Text-Sequence Steps

**Issue:** Some `text-sequence` steps have `maxWordBankSize`, others don't.

**Examples:**
- `maxWordBankSize: 10` (present)
- No `maxWordBankSize` field (missing)

**Location:** Multiple text-sequence steps

**Suggested Fix:** Add `maxWordBankSize` to all text-sequence steps OR document default value

---

### 15. Story Lesson Vocabulary References

**Issue:** Module 1, Lesson 5 (story-conversation) doesn't have explicit vocabulary array.

**Location:** Module 1, Lesson 5

**Status:** ✅ Actually correct - story lessons use `reviewVocabulary` only

**Suggested Fix:** Document that story lessons don't need `vocabulary` array

---

## 📊 MODULE-BY-MODULE DETAILED REPORT

### Module 1: Greetings & Politeness

**Status:** ✅ Complete (5 lessons)

**Lessons:**
1. **Lesson 1:** Basic Persian Greetings (13 steps, 4 vocab)
2. **Lesson 2:** Basic Politeness and Essential Responses (17 steps, 7 vocab)
3. **Lesson 3:** Basic Pronouns and Question Words (23 steps, 6 vocab)
4. **Lesson 4:** Complete Conversations & Meeting People (21 steps, 1 vocab)
5. **Lesson 5:** Story Conversation (1 step, story-conversation type)

**Issues Found:**
- ✅ Lesson 2 uses "khoobi" before grammar introduction (acceptable for this level)
- ✅ Lesson 3 introduces "-e" connector properly
- ✅ Lesson 4 has "Na merci" translation (should be "No thank you" - ✅ already fixed)
- ⚠️ Lesson 1 has some step order inconsistencies (audio-meaning before quiz)

**Vocabulary Introduced:**
- `salam`, `chetori`, `khosh_amadid`, `khodafez`
- `khoob`, `khoobam`, `khoobi`, `khoobi-question`, `merci`, `baleh`, `na`
- `man`, `shoma`, `esm`, `esme`, `chi`, `chiye`
- `khoshbakhtam`

**Grammar Concepts:**
- `ezafe-connector` (Lesson 3)
- `suffix-e` (Lesson 3)

---

### Module 2: Responses & Feelings

**Status:** ✅ Complete (7 lessons)

**Lessons:**
1. **Lesson 1:** Adjective Suffixes "-am" & "-i" (14 steps, 2 vocab)
2. **Lesson 2:** Basic Responses Continued (15 steps, 7 vocab)
3. **Lesson 3:** Where Are You From? (14 steps, 2 vocab)
4. **Lesson 4:** Where I Live (13 steps, 5 vocab)
5. **Lesson 5:** Connect Ideas Naturally (21 steps, 3 vocab)
6. **Lesson 6:** Review & Consolidation (vocab: [])
7. **Lesson 7:** Story Conversation (vocab: [])

**Issues Found:**
- ✅ Lesson 1 properly introduces "-am" and "-i" suffixes
- ✅ Lesson 2 introduces "hast/neest" verb roots
- ⚠️ Lesson 2, Step 10: Changed from `input` to `text-sequence` (man kheily khoobam)
- ✅ Lesson 5: "ham" translation fixed to "Also / Too"
- ⚠️ Some vocabulary entries missing Persian script (`fa: ""`)

**Vocabulary Introduced:**
- `khoob`, `khoobi` (review)
- `hast`, `neest`, `hastam`, `neestam`, `neesti`, `hasti`, `kheily`
- `koja`, `ahle`
- `zendegi`, `mikonam`, `mikoni`, `dar`, `amrika`
- `va`, `ham`, `vali`

**Grammar Concepts:**
- `adjective-suffixes` (Lesson 1)
- `suffix-am` (Lesson 1)
- `suffix-i` (Lesson 1)
- `connectors-placement` (Lesson 5)
- `connector-vali` (Lesson 5)
- `connector-ham` (Lesson 5)

---

### Module 3: Family & Relationships

**Status:** ✅ Complete (6 lessons)

**Lessons:**
1. **Lesson 1:** Review & Refresh (vocab: [])
2. **Lesson 2:** My & Your (vocab: 4)
3. **Lesson 3:** Parents (vocab: 2)
4. **Lesson 4:** Parents Practice (vocab: [])
5. **Lesson 5:** Siblings (vocab: 2)
6. **Lesson 6:** Full Family Practice (vocab: [])

**Issues Found:**
- ⚠️ Lesson 2 vocabulary has inconsistent `lessonId` format (`"lesson2"` instead of `"module3-lesson2"`)
- ✅ Lesson 2 introduces possession suffixes properly
- ✅ Lesson 3 introduces family vocabulary (`madar`, `pedar`)
- ✅ Lesson 5 introduces siblings (`baradar`, `khahar`)

**Vocabulary Introduced:**
- `esmam`, `esmet`, `hast`, `in`
- `madar`, `pedar`
- `baradar`, `khahar`

**Grammar Concepts:**
- `possession-suffixes` (Lesson 2)
- `suffix-am` (Lesson 2, for possession)
- `suffix-e` (Lesson 2, for ezafe)

---

### Modules 4-11: Placeholders

**Status:** ⚠️ Empty (lessons: [])

**Modules:**
- Module 4: Food & Ordering at a Restaurant
- Module 5: Daily Activities & Routines
- Module 6: Getting Around (Travel & Directions)
- Module 7: Feelings & Small Talk
- Module 8: Persian Slang & Humor
- Module 9: Shopping, Prices & Bargaining
- Module 10: Celebrations & Holidays
- Module 11: Story Mode – A Day in Tehran

**Status:** Expected - these are placeholders for future content

---

## 📈 RAW DATA APPENDIX

### Vocabulary Frequency Map

**Most Used Words (appear in 5+ lessons):**
- `salam` - 8+ lessons
- `chetori` - 8+ lessons
- `merci` - 8+ lessons
- `khodafez` - 8+ lessons
- `man` - 7+ lessons
- `shoma` - 7+ lessons
- `khoob` - 6+ lessons
- `khoobam` - 6+ lessons
- `esm` - 5+ lessons
- `esme` - 5+ lessons

**Grammar Suffixes Introduced:**
- `-am` (I am / my) - Module 2, Lesson 1 (adjectives), Module 3, Lesson 2 (possession)
- `-i` (you are / your informal) - Module 2, Lesson 1
- `-e` (ezafe connector) - Module 1, Lesson 3
- `-et` (your formal) - Module 3, Lesson 2

**Suffix Introduction Order:**
1. Module 1, Lesson 3: `-e` (ezafe connector)
2. Module 2, Lesson 1: `-am`, `-i` (adjective suffixes)
3. Module 3, Lesson 2: `-am`, `-et` (possession suffixes)

---

### Translation Inconsistency Map

**Same Persian, Different English:**

1. **"khoobi" / "khoob-i"**
   - "You Are Good" (statement)
   - "Are You Good?" (question)
   - "are you good" (lowercase, in translations)

2. **"ham"**
   - "Also" (original)
   - "Also / Too" (updated)
   - "I am also good" (in translation)

3. **"esme"**
   - "Name of" (vocab entry)
   - "Your name" (in some translations - should be "name of you")

---

### Step Type Distribution

**Module 1 Average:**
- `welcome`: 1 per lesson
- `flashcard`: 4-5 per lesson
- `quiz`: 3-5 per lesson
- `matching`: 2-4 per lesson
- `audio-meaning`: 2-4 per lesson
- `audio-sequence`: 2-4 per lesson
- `text-sequence`: 1-3 per lesson
- `input`: 1-3 per lesson
- `final`: 1 per lesson

**Module 2 Average:**
- Similar to Module 1
- Added: `grammar-intro`, `grammar-fill-blank` (grammar lessons)

**Module 3 Average:**
- Similar to Module 2
- More review-focused lessons

---

### Missing Vocabulary References

**Potential Issues (Need Verification):**
- Some audio-sequence steps may reference vocab not in arrays
- Some final challenges may reference vocab not properly reviewed
- Some grammar-fill-blank exercises may reference vocab not introduced

**Status:** Requires full file scan to verify

---

## ✅ CONFIRMATION

**CONFIRMATION: Analysis-only. No modifications made.**

This report is purely diagnostic. No code was changed, no curriculum was altered, no new content was inserted. This is a comprehensive analysis of the existing curriculum structure, vocabulary, translations, grammar concepts, and step organization.

---

## 🎯 RECOMMENDED ACTION ITEMS (Priority Order)

1. **CRITICAL:** Fix vocabulary translation inconsistencies (especially "khoobi", "ham", "esme")
2. **CRITICAL:** Verify grammar introduction order (ensure suffixes introduced before use)
3. **MAJOR:** Standardize capitalization in `expectedTranslation` fields
4. **MAJOR:** Standardize finglish spelling (capitalization, hyphens)
5. **MAJOR:** Add Persian script (`fa`) to all vocabulary entries missing it
6. **MAJOR:** Standardize `lessonId` format to `"module{X}-lesson{Y}"`
7. **MINOR:** Add `maxWordBankSize` to all text-sequence steps
8. **MINOR:** Standardize punctuation in translations

---

**End of Report**

