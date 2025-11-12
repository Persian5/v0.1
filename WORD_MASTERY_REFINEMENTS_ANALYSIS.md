# Word Mastery Algorithm Refinements - Analytical Evaluation
**Date:** 2025-01-13  
**Purpose:** Critical analysis of proposed refinements for production-grade word mastery system

---

## 📊 REFINEMENT EVALUATION MATRIX

| Refinement | Complexity | Impact | Risk | Priority | Implementation Time | Dependencies |
|------------|-----------|--------|------|----------|-------------------|--------------|
| 1. Decay/Recency | Medium | High | Low | ⭐⭐⭐⭐ | 2-3 hours | last_correct_at column |
| 2. Confidence Score | Low | Medium | Low | ⭐⭐⭐ | 1-2 hours | None (computed) |
| 3. Unclassified Bucket | Low | High | None | ⭐⭐⭐⭐⭐ | 30 min | None |
| 4. Context-Based | High | Low (future) | Medium | ⭐ | Future | Schema change |
| 5. SQL View | Low | High | Low | ⭐⭐⭐⭐⭐ | 1 hour | None |
| 6. Telemetry | Medium | High | Low | ⭐⭐⭐⭐ | 2-3 hours | Analytics infra |
| 7. Personalization | High | Medium (future) | Medium | ⭐⭐ | Future | Confidence score |

---

## 🔍 DETAILED ANALYSIS

### 1. Decay/Recency Weight ⭐⭐⭐⭐

#### Current State
- ✅ We have `last_seen_at` (last time word was attempted)
- ❌ We don't have `last_correct_at` (last time word was answered correctly)
- ✅ We have `updated_at` (last time record was updated)

#### Implementation Options

**Option A: Add `last_correct_at` column (RECOMMENDED)**
```sql
ALTER TABLE vocabulary_performance
ADD COLUMN last_correct_at TIMESTAMPTZ;

-- Update on correct answers
UPDATE vocabulary_performance
SET last_correct_at = NOW()
WHERE is_correct = true;
```

**Pros:**
- Accurate decay calculation
- Can query "words not seen correctly in 14 days"
- Enables decay logic

**Cons:**
- Requires migration
- Need to backfill existing data

**Option B: Query `vocabulary_attempts` table**
```sql
-- Find last correct attempt
SELECT MAX(created_at) 
FROM vocabulary_attempts 
WHERE user_id = ? AND vocabulary_id = ? AND is_correct = true;
```

**Pros:**
- No schema change
- Uses existing data

**Cons:**
- Slower (requires JOIN or subquery)
- More complex queries
- Performance impact on dashboard

**Recommendation:** **Option A** - Add `last_correct_at` column
- One-time migration cost
- Better performance long-term
- Cleaner queries

#### Decay Logic Implementation

**Simple Decay (Recommended for Phase 1):**
```typescript
// In getDashboardStats or SQL view
if (last_correct_at < NOW() - INTERVAL '14 days') {
  // Reduce mastery_level by 1 (minimum 0)
  effective_mastery_level = GREATEST(0, mastery_level - 1);
}
```

**Advanced Decay (Future):**
```typescript
// Exponential decay based on days inactive
days_inactive = EXTRACT(DAY FROM NOW() - last_correct_at);
decay_factor = 1 - (days_inactive / 30); // Linear decay over 30 days
effective_mastery = mastery_level * GREATEST(0, decay_factor);
```

**Decision:** Start with simple decay, upgrade later if needed.

---

### 2. Mastery Confidence Score ⭐⭐⭐

#### Analysis

**Formula:**
```
mastery_confidence = (accuracy * 0.6) + (streak_ratio * 0.3) + (attempt_weight * 0.1)
```

**Pros:**
- Single number for sorting/filtering
- Enables dynamic thresholds
- Useful for analytics
- No schema change (computed column)

**Cons:**
- Weights need tuning (0.6/0.3/0.1 may not be optimal)
- Adds complexity to queries
- May confuse users if exposed directly

#### Implementation Strategy

**Phase 1: Internal Only (Recommended)**
- Compute in SQL view or service layer
- Use for internal sorting/analytics
- Don't expose to users yet

**Phase 2: Expose to Users**
- Show as "Mastery Score: 85/100"
- Use for personalized difficulty

**Recommendation:** **Implement now, keep internal**
- Low cost (computed, no storage)
- Enables future features
- Useful for analytics immediately

---

### 3. Unclassified Bucket ⭐⭐⭐⭐⭐

#### Analysis

**Current Problem:**
- Words with 1-2 attempts get forced into "hard" or "mastered"
- Creates false positives/negatives
- Misleading dashboard stats

**Solution:**
```typescript
if (total_attempts < 3) {
  category = "unclassified";
}
```

**Impact:**
- ✅ Eliminates false classifications
- ✅ More accurate dashboard
- ✅ Better user experience
- ✅ Zero risk (only improves accuracy)

**Implementation:**
- Add to SQL view
- Update service logic
- Update API response
- Update dashboard UI (show as "Learning" or "New")

**Recommendation:** **Implement immediately**
- Highest priority
- Zero risk
- Immediate accuracy improvement

---

### 4. Context-Based Mastery ⭐

#### Analysis

**Current State:**
- We track `game_type` in `vocabulary_attempts`
- Could differentiate: reading, writing, listening, speaking
- Not currently used for mastery

**Future Value:**
- Multi-dimensional mastery (e.g., "mastered in reading, learning in listening")
- More accurate assessment
- Better personalized practice

**Current Need:**
- ❌ Not needed for MVP
- ❌ Adds complexity
- ❌ Requires UI changes

**Recommendation:** **Defer to Phase 2**
- Keep schema flexible (we already have `game_type`)
- Add context column later if needed
- Focus on core mastery first

---

### 5. SQL View ⭐⭐⭐⭐⭐

#### Analysis

**Current Problem:**
- Mastery logic duplicated in:
  - `VocabularyTrackingService.getDashboardStats()`
  - `/api/user-stats/route.ts`
  - Future dashboard queries
- Changes require updates in multiple places
- Risk of inconsistency

**Solution:**
```sql
CREATE OR REPLACE VIEW user_word_mastery AS
SELECT
  user_id,
  vocabulary_id,
  word_text,
  total_attempts,
  total_correct,
  total_incorrect,
  consecutive_correct,
  -- Calculate accuracy
  CASE 
    WHEN total_attempts > 0 
    THEN (total_correct::numeric / total_attempts::numeric * 100)::integer
    ELSE 0
  END AS accuracy,
  -- Determine status
  CASE
    WHEN total_attempts < 3 THEN 'unclassified'
    WHEN consecutive_correct >= 5 
         AND (total_correct::numeric / total_attempts::numeric * 100) >= 90 
         AND total_attempts >= 3 
    THEN 'mastered'
    WHEN total_attempts >= 2 
         AND (
           (total_correct::numeric / total_attempts::numeric * 100) < 70 
           OR consecutive_correct < 2
         )
    THEN 'hard'
    ELSE 'learning'
  END AS status,
  mastery_level,
  last_seen_at,
  next_review_at
FROM vocabulary_performance;
```

**Benefits:**
- ✅ Single source of truth
- ✅ Consistent logic across all queries
- ✅ Easy to update (change view definition)
- ✅ Better performance (pre-computed)
- ✅ Version controllable (can create v2 view)

**Recommendation:** **Implement immediately**
- Highest priority
- Foundation for all other features
- Reduces technical debt

---

### 6. Telemetry & Analytics ⭐⭐⭐⭐

#### Analysis

**Metrics Needed:**
1. **False Positive Rate:** % of mastered words that drop below 90% accuracy
2. **Recovery Rate:** % of hard words that improve to >80% accuracy
3. **Average Attempts:** Mean attempts per mastered word
4. **Mastery Stability:** % of words that stay mastered over 30 days

**Implementation:**

**Option A: Real-time Calculation (Simple)**
```typescript
// In analytics endpoint
const falsePositives = masteredWords.filter(w => w.currentAccuracy < 90).length;
const falsePositiveRate = (falsePositives / masteredWords.length) * 100;
```

**Option B: Periodic Aggregation (Scalable)**
```sql
-- Create analytics table
CREATE TABLE word_mastery_analytics (
  date DATE,
  user_id UUID,
  metric_name TEXT,
  metric_value NUMERIC,
  PRIMARY KEY (date, user_id, metric_name)
);

-- Daily aggregation job
INSERT INTO word_mastery_analytics
SELECT 
  CURRENT_DATE,
  user_id,
  'false_positive_rate',
  COUNT(*) FILTER (WHERE status = 'mastered' AND accuracy < 90)::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE status = 'mastered'), 0) * 100
FROM user_word_mastery
GROUP BY user_id;
```

**Recommendation:** **Start with Option A, migrate to Option B**
- Phase 1: Real-time calculation (simple, immediate)
- Phase 2: Periodic aggregation (scalable, efficient)

---

### 7. Personalization Layer ⭐⭐

#### Analysis

**Complexity:** High
- Requires user profiling
- Dynamic threshold adjustment
- A/B testing infrastructure
- Performance considerations

**Value:** Medium (future)
- Improves engagement
- Better learning outcomes
- Competitive advantage

**Current Need:** ❌ Not needed for MVP

**Recommendation:** **Defer to Phase 2**
- Requires confidence score (refinement #2)
- Requires analytics (refinement #6)
- Complex to implement correctly
- Can add later without breaking changes

---

## 🎯 IMPLEMENTATION PRIORITY MATRIX

### Phase 1: Core Improvements (Week 1)
**Priority: CRITICAL**

1. ✅ **SQL View** (1 hour)
   - Single source of truth
   - Foundation for everything else
   - **Risk:** None

2. ✅ **Unclassified Bucket** (30 min)
   - Fixes false classifications
   - Immediate accuracy improvement
   - **Risk:** None

3. ✅ **Updated Mastery Logic** (2 hours)
   - Accuracy threshold (90%)
   - Minimum attempts (3)
   - Mutual exclusivity
   - **Risk:** Low (backward compatible)

### Phase 2: Production Polish (Week 2)
**Priority: HIGH**

4. ✅ **Decay System** (2-3 hours)
   - Add `last_correct_at` column
   - Implement decay logic
   - **Risk:** Low (migration needed)

5. ✅ **Confidence Score** (1-2 hours)
   - Compute in view/service
   - Use for analytics
   - **Risk:** None (computed)

6. ✅ **Basic Telemetry** (2-3 hours)
   - False positive rate
   - Recovery rate
   - Average attempts
   - **Risk:** None (read-only)

### Phase 3: Future Enhancements (Post-Launch)
**Priority: MEDIUM**

7. ⏳ **Personalization** (Future)
   - Requires Phase 2 complete
   - A/B testing infrastructure
   - **Risk:** Medium (complex)

8. ⏳ **Context-Based Mastery** (Future)
   - Multi-dimensional mastery
   - Schema changes needed
   - **Risk:** Medium (UI changes)

---

## 🏗️ IMPLEMENTATION ARCHITECTURE

### Database Layer

```sql
-- 1. Add last_correct_at column
ALTER TABLE vocabulary_performance
ADD COLUMN last_correct_at TIMESTAMPTZ;

-- 2. Create mastery view
CREATE OR REPLACE VIEW user_word_mastery AS
SELECT
  -- ... (see refinement #5)
  CASE
    WHEN last_correct_at < NOW() - INTERVAL '14 days' 
    THEN GREATEST(0, mastery_level - 1)
    ELSE mastery_level
  END AS effective_mastery_level,
  -- Confidence score (computed)
  (
    (accuracy * 0.6) + 
    (LEAST(consecutive_correct / 5.0, 1.0) * 30) + 
    (LEAST(total_attempts / 5.0, 1.0) * 10)
  )::integer AS mastery_confidence
FROM vocabulary_performance;
```

### Service Layer

```typescript
// VocabularyTrackingService.getDashboardStats()
// Now queries view instead of raw table
const { data } = await supabase
  .from('user_word_mastery')
  .select('*')
  .eq('user_id', userId);

const mastered = data.filter(w => w.status === 'mastered');
const hard = data.filter(w => w.status === 'hard');
const unclassified = data.filter(w => w.status === 'unclassified');
```

### API Layer

```typescript
// /api/user-stats returns:
{
  wordsLearned: number,
  masteredWords: number,
  hardWords: WeakWord[],
  unclassifiedWords: number, // NEW
  wordsToReview: WeakWord[] // NEW (SRS-based)
}
```

---

## 📈 SUCCESS METRICS

### Immediate (Week 1)
- ✅ No overlap between mastered and hard words
- ✅ All mastered words have 90%+ accuracy
- ✅ All mastered words have 3+ attempts
- ✅ Unclassified words properly categorized

### Short-term (Month 1)
- 📊 False positive rate < 10%
- 📊 Recovery rate > 30%
- 📊 Average attempts per mastered word: 5-8
- 📊 Mastery stability > 80%

### Long-term (Quarter 1)
- 📊 User engagement increase (from better accuracy)
- 📊 Learning outcomes improvement
- 📊 Reduced confusion (from mutual exclusivity)

---

## ⚠️ RISK ASSESSMENT

### Low Risk ✅
- SQL View (read-only, can revert)
- Unclassified bucket (only improves accuracy)
- Confidence score (computed, no storage)

### Medium Risk ⚠️
- Decay system (requires migration, data backfill)
- Updated mastery logic (may change user stats)

### High Risk ❌
- None identified (all refinements are additive or improve accuracy)

---

## 🎯 FINAL RECOMMENDATION

### Implement Now (Phase 1)
1. ✅ SQL View (foundation)
2. ✅ Unclassified bucket (accuracy fix)
3. ✅ Updated mastery logic (core improvement)

### Implement Soon (Phase 2)
4. ✅ Decay system (production polish)
5. ✅ Confidence score (analytics)
6. ✅ Basic telemetry (monitoring)

### Defer (Phase 3)
7. ⏳ Personalization (future)
8. ⏳ Context-based mastery (future)

**Total Implementation Time:** ~8-10 hours for Phase 1 + 2
**Risk Level:** Low
**Impact:** High
**ROI:** Excellent

---

## 📝 NEXT STEPS

1. Create SQL migration for `last_correct_at` column
2. Create `user_word_mastery` view with all logic
3. Update `VocabularyTrackingService` to use view
4. Update API endpoints to use view
5. Add unclassified bucket to UI
6. Implement decay logic
7. Add telemetry endpoints

**Ready to proceed?** ✅

