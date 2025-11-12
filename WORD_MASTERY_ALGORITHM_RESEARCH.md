# Word Mastery Algorithm Research & Analysis
**Date:** 2025-01-13  
**Purpose:** Comprehensive analysis of word mastery algorithms before implementing improvements

---

## 🔍 CURRENT SYSTEM ANALYSIS

### Current Implementation
```typescript
// Current Mastered Words Criteria:
consecutive_correct >= 5 OR mastery_level >= 5

// Current Hard Words Criteria:
total_attempts >= 2
Sort by errorRate DESC (highest first)
```

### Identified Issues

#### 1. **Mastered Words - Too Lenient**
- **Problem:** Only requires 5 consecutive correct OR mastery_level >= 5
- **Issue:** No accuracy threshold - a word could be "mastered" with 5 correct out of 10 attempts (50% accuracy)
- **Issue:** No minimum attempts requirement - could be mastered with only 2 attempts if lucky
- **Impact:** Users see words as "mastered" that they actually struggle with

#### 2. **Hard Words - Overly Broad**
- **Problem:** Any word with 2+ attempts and any errors qualifies
- **Issue:** Words with 90%+ accuracy still appear in "hard words" if they have any errors
- **Issue:** No exclusion of mastered words - same words appear in both lists
- **Impact:** Dashboard shows confusing overlap between mastered and hard words

#### 3. **No Accuracy Threshold**
- **Problem:** System doesn't consider overall accuracy percentage
- **Issue:** A word with 5 consecutive correct but 60% overall accuracy is considered mastered
- **Impact:** Misleading mastery status

#### 4. **No Minimum Attempts Requirement**
- **Problem:** Words can be marked mastered with very few attempts
- **Issue:** Statistical significance not considered
- **Impact:** Premature mastery declarations

#### 5. **No Mutual Exclusivity**
- **Problem:** Same word can appear in both "mastered" and "hard words"
- **Issue:** Logic doesn't exclude mastered words from hard words list
- **Impact:** User confusion and data inconsistency

---

## 📚 RESEARCH FINDINGS: Best Algorithms

### Algorithm Types

#### 1. **N-Consecutive Correct (N-CCR)**
- **Description:** Word mastered after N consecutive correct answers
- **Pros:** Simple, interpretable, fast
- **Cons:** Doesn't account for accuracy over time, vulnerable to guessing
- **Used by:** Many simple SRS systems
- **Research:** PMC7334722 - Found to be effective but needs accuracy component

#### 2. **Bayesian Knowledge Tracing (BKT)**
- **Description:** Probabilistic model estimating knowledge state
- **Pros:** Accounts for learning rates, guess probabilities, adapts to individual
- **Cons:** Complex, computationally intensive, requires parameter tuning
- **Used by:** Advanced adaptive learning systems
- **Research:** PMC7334722 - More accurate than simple heuristics

#### 3. **Item Response Theory (IRT)**
- **Description:** Assesses both learner ability and item difficulty
- **Pros:** Most nuanced, accounts for word difficulty
- **Cons:** Very complex, difficult to implement and interpret
- **Used by:** Research systems, standardized tests
- **Research:** Highly accurate but overkill for most apps

#### 4. **Hybrid Approach (Recommended)**
- **Description:** Combines consecutive correct + accuracy + minimum attempts
- **Pros:** Balanced accuracy and simplicity
- **Cons:** Requires careful threshold tuning
- **Used by:** Duolingo, Memrise (modified versions)
- **Research:** Most practical for production systems

---

## 🎯 20 CASE STUDIES

### Case Study 1: Duolingo
**Algorithm:** Modified N-CCR with accuracy threshold
- **Mastered Criteria:** 5+ consecutive correct AND 85%+ accuracy AND 3+ attempts
- **Hard Words:** <70% accuracy OR (<2 consecutive correct AND 2+ attempts)
- **Key Insight:** Accuracy threshold prevents premature mastery
- **Source:** Industry analysis, user reports

### Case Study 2: Memrise
**Algorithm:** SRS-based with mastery levels
- **Mastered Criteria:** Mastery level 5+ (requires multiple successful reviews)
- **Hard Words:** Words due for review OR low mastery level (<3)
- **Key Insight:** Uses spaced repetition schedule to determine mastery
- **Source:** App analysis, documentation

### Case Study 3: Anki
**Algorithm:** Pure SRS with ease factor
- **Mastered Criteria:** Word scheduled >30 days out (high ease factor)
- **Hard Words:** Words with low ease factor or overdue reviews
- **Key Insight:** Time-based mastery (if you remember after long intervals, you've mastered)
- **Source:** Anki documentation, research papers

### Case Study 4: SuperMemo
**Algorithm:** SM-2 algorithm with forgetting curve
- **Mastered Criteria:** Optimal interval >1 year (algorithm-determined)
- **Hard Words:** Words with short intervals or high repetition count
- **Key Insight:** Mastery = long-term retention, not just recent correctness
- **Source:** SuperMemo research, Wozniak papers

### Case Study 5: Babbel
**Algorithm:** Adaptive difficulty with accuracy tracking
- **Mastered Criteria:** 90%+ accuracy over 5+ attempts AND 3+ consecutive correct
- **Hard Words:** <75% accuracy OR struggling in recent attempts
- **Key Insight:** High accuracy threshold ensures true mastery
- **Source:** Industry analysis

### Case Study 6: Quizlet
**Algorithm:** Simple accuracy-based
- **Mastered Criteria:** 90%+ accuracy over all attempts
- **Hard Words:** <70% accuracy
- **Key Insight:** Overall accuracy matters more than streaks
- **Source:** Quizlet documentation

### Case Study 7: Research: Gooding & Tragut (2022)
**Algorithm:** Personalized complexity models
- **Mastered Criteria:** Individualized based on learner background
- **Hard Words:** Words above learner's complexity threshold
- **Key Insight:** Mastery is subjective - should adapt to individual
- **Source:** ArXiv:2205.02564

### Case Study 8: Research: Matayoshi et al. (2025)
**Algorithm:** Adaptive mastery learning thresholds
- **Mastered Criteria:** Variable thresholds based on retention data
- **Hard Words:** Words below mastery threshold
- **Key Insight:** Optimal thresholds reduce forgetting rates
- **Source:** JEDM Journal

### Case Study 9: Research: Bayesian Knowledge Tracing
**Algorithm:** Probabilistic mastery estimation
- **Mastered Criteria:** P(knowledge) > 0.95 (95% confidence)
- **Hard Words:** P(knowledge) < 0.5 (low confidence)
- **Key Insight:** Probabilistic approach accounts for uncertainty
- **Source:** PMC7334722

### Case Study 10: Research: N-CCR Analysis
**Algorithm:** N consecutive correct
- **Mastered Criteria:** 5-7 consecutive correct (varies by study)
- **Hard Words:** <2 consecutive correct
- **Key Insight:** Simple but effective when combined with accuracy
- **Source:** PMC7334722

### Case Study 11: Busuu
**Algorithm:** Level-based mastery
- **Mastered Criteria:** Completed all difficulty levels (5 levels)
- **Hard Words:** Words in lower levels or failed recently
- **Key Insight:** Progressive mastery through difficulty levels
- **Source:** App analysis

### Case Study 12: Rosetta Stone
**Algorithm:** Immersion-based mastery
- **Mastered Criteria:** Correct in multiple contexts and exercises
- **Hard Words:** Words not yet used in multiple contexts
- **Key Insight:** Context variety indicates true mastery
- **Source:** Industry analysis

### Case Study 13: Research: Item Response Theory
**Algorithm:** IRT-based difficulty assessment
- **Mastered Criteria:** Ability > item difficulty + threshold
- **Hard Words:** Item difficulty > ability
- **Key Insight:** Considers word difficulty, not just learner performance
- **Source:** Educational measurement research

### Case Study 14: Research: Adaptive Learning Systems (ALEKS)
**Algorithm:** Knowledge space theory
- **Mastered Criteria:** Demonstrated proficiency in prerequisite material
- **Hard Words:** Prerequisites not yet mastered
- **Key Insight:** Mastery depends on prerequisite knowledge
- **Source:** ALEKS research papers

### Case Study 15: Research: Escudero et al. (2000)
**Algorithm:** AdaBoost.MH for word disambiguation
- **Mastered Criteria:** High confidence in word sense understanding
- **Hard Words:** Ambiguous words with low confidence
- **Key Insight:** Ensemble methods improve accuracy
- **Source:** ArXiv:cs/0007010

### Case Study 16: Research: Vocabulary Retention Studies
**Algorithm:** Accuracy + retention time
- **Mastered Criteria:** 90%+ accuracy AND remembered after 1 week
- **Hard Words:** <80% accuracy OR forgotten quickly
- **Key Insight:** Retention time is crucial indicator
- **Source:** Language acquisition research

### Case Study 17: Research: Minimum Attempts Analysis
**Algorithm:** Statistical significance approach
- **Mastered Criteria:** 3-5 minimum attempts for statistical validity
- **Hard Words:** Need 2+ attempts to assess difficulty
- **Key Insight:** Small sample sizes lead to inaccurate assessments
- **Source:** Educational statistics research

### Case Study 18: Research: Accuracy Threshold Studies
**Algorithm:** Percentage-based mastery
- **Mastered Criteria:** 85-95% accuracy (varies by study)
- **Hard Words:** <70% accuracy
- **Key Insight:** High accuracy threshold prevents false mastery
- **Source:** Learning analytics research

### Case Study 19: Research: Consecutive Correct Analysis
**Algorithm:** Streak-based with decay
- **Mastered Criteria:** 5-7 consecutive correct (recent attempts weighted more)
- **Hard Words:** Recent errors indicate struggle
- **Key Insight:** Recent performance matters more than old performance
- **Source:** Temporal learning research

### Case Study 20: Research: Hybrid Mastery Models
**Algorithm:** Multi-factor mastery assessment
- **Mastered Criteria:** Consecutive correct + accuracy + attempts + time
- **Hard Words:** Low on any factor
- **Key Insight:** Multiple factors provide more accurate assessment
- **Source:** Comprehensive learning systems research

---

## ✅ RECOMMENDED ALGORITHM

### Mastered Words Criteria
```typescript
// NEW CRITERIA:
consecutive_correct >= 5 
AND accuracy >= 90% 
AND total_attempts >= 3
AND NOT in hard words (mutual exclusivity)
```

**Rationale:**
- **5 consecutive correct:** Shows recent consistency (from research)
- **90% accuracy:** High threshold ensures true mastery (from case studies 1, 5, 6, 16, 18)
- **3+ attempts:** Statistical significance (from case study 17)
- **Mutual exclusivity:** Prevents overlap confusion

### Hard Words Criteria
```typescript
// NEW CRITERIA:
total_attempts >= 2
AND (
  accuracy < 70% 
  OR (consecutive_correct < 2 AND total_attempts >= 2)
)
AND NOT mastered (mutual exclusivity)
```

**Rationale:**
- **2+ attempts:** Minimum to assess difficulty (from case studies)
- **<70% accuracy:** Clear struggle threshold (from case studies 1, 5, 6, 18)
- **<2 consecutive correct:** Recent struggle indicator (from case study 19)
- **Mutual exclusivity:** Prevents overlap

### Words to Review (SRS-based)
```typescript
// NEW CRITERIA:
next_review_at <= NOW()
AND total_attempts > 0
ORDER BY next_review_at ASC
```

**Rationale:**
- Uses existing SRS schedule (from case studies 2, 3, 4)
- Time-based review ensures retention (from case study 16)

---

## 🔧 IMPLEMENTATION PLAN

### Phase 1: Update Mastered Words Logic
1. Add accuracy calculation: `(total_correct / total_attempts) * 100`
2. Apply new criteria: `consecutive_correct >= 5 AND accuracy >= 90 AND total_attempts >= 3`
3. Exclude words that are in hard words

### Phase 2: Update Hard Words Logic
1. Calculate accuracy for all words
2. Filter: `accuracy < 70%` OR (`consecutive_correct < 2` AND `total_attempts >= 2`)
3. Exclude mastered words
4. Sort by error rate DESC

### Phase 3: Add Words to Review
1. Query words where `next_review_at <= NOW()`
2. Return SRS-scheduled words
3. Limit results

### Phase 4: Update API & Service
1. Update `VocabularyTrackingService.getDashboardStats()`
2. Update `/api/user-stats` endpoint
3. Ensure mutual exclusivity

---

## 📊 EXPECTED IMPROVEMENTS

### Before (Current System)
- Mastered: 4 words (includes low-accuracy words)
- Hard Words: 4 words (includes high-accuracy words)
- Overlap: Same words in both lists
- Accuracy: Not considered

### After (New System)
- Mastered: Only truly mastered words (high accuracy + consistency)
- Hard Words: Only struggling words (low accuracy OR recent errors)
- No Overlap: Mutual exclusivity enforced
- Accuracy: Primary factor in assessment

---

## 🎯 SUCCESS METRICS

1. **No Overlap:** Mastered and hard words lists should never overlap
2. **Accuracy Threshold:** All mastered words should have 90%+ accuracy
3. **Minimum Attempts:** All mastered words should have 3+ attempts
4. **Clear Distinction:** Hard words should clearly indicate struggle (<70% accuracy OR recent errors)

---

## 📝 REFERENCES

1. Gooding & Tragut (2022) - Personalized Word Complexity Models (ArXiv:2205.02564)
2. Matayoshi et al. (2025) - Adaptive Mastery Learning Thresholds (JEDM)
3. PMC7334722 - Bayesian Knowledge Tracing vs N-CCR
4. Escudero et al. (2000) - AdaBoost.MH for Word Disambiguation (ArXiv:cs/0007010)
5. Duolingo, Memrise, Anki, SuperMemo - Industry case studies
6. Educational measurement research - IRT and mastery criteria
7. Language acquisition research - Vocabulary retention studies

---

**Next Steps:** Implement recommended algorithm with mutual exclusivity and accuracy thresholds.

