| table_name           | column_name            | data_type                | is_nullable | column_default     |
| -------------------- | ---------------------- | ------------------------ | ----------- | ------------------ |
| user_attempts        | id                     | uuid                     | NO          | gen_random_uuid()  |
| user_attempts        | user_id                | uuid                     | NO          | null               |
| user_attempts        | session_id             | uuid                     | YES         | null               |
| user_attempts        | content_type           | text                     | NO          | null               |
| user_attempts        | content_id             | text                     | NO          | null               |
| user_attempts        | attempt_data           | jsonb                    | NO          | null               |
| user_attempts        | is_correct             | boolean                  | YES         | null               |
| user_attempts        | time_spent_ms          | integer                  | YES         | null               |
| user_attempts        | created_at             | timestamp with time zone | NO          | now()              |
| user_lesson_progress | id                     | uuid                     | NO          | gen_random_uuid()  |
| user_lesson_progress | user_id                | uuid                     | NO          | null               |
| user_lesson_progress | module_id              | text                     | NO          | null               |
| user_lesson_progress | lesson_id              | text                     | NO          | null               |
| user_lesson_progress | status                 | text                     | NO          | '''locked'''::text |
| user_lesson_progress | progress_percent       | integer                  | NO          | 0                  |
| user_lesson_progress | xp_earned              | integer                  | NO          | 0                  |
| user_lesson_progress | started_at             | timestamp with time zone | YES         | null               |
| user_lesson_progress | completed_at           | timestamp with time zone | YES         | null               |
| user_lesson_progress | created_at             | timestamp with time zone | NO          | now()              |
| user_profiles        | id                     | uuid                     | NO          | auth.uid()         |
| user_profiles        | display_name           | text                     | YES         | null               |
| user_profiles        | email                  | text                     | YES         | null               |
| user_profiles        | total_xp               | integer                  | NO          | 0                  |
| user_profiles        | onboarding_completed   | boolean                  | NO          | false              |
| user_profiles        | created_at             | timestamp with time zone | NO          | now()              |
| user_profiles        | updated_at             | timestamp with time zone | NO          | now()              |
| user_profiles        | first_name             | text                     | YES         | null               |
| user_profiles        | last_name              | text                     | YES         | null               |
| user_profiles        | review_xp_earned_today | integer                 | NO          | 0                  |
| user_profiles        | review_xp_reset_at     | timestamp with time zone | YES         | null               |
| user_profiles        | timezone               | text                     | NO          | 'America/Los_Angeles' |
| user_profiles        | learning_goal          | text                     | YES         | null               |
| user_profiles        | current_level          | text                     | YES         | null               |
| user_profiles        | primary_focus          | text                     | YES         | null               |
|| user_profiles        | streak_count           | integer                  | NO          | 0                  |
|| user_profiles        | last_activity_date     | date                     | YES         | null               |
|| user_profiles        | last_streak_date       | date                     | YES         | null               |
|| user_profiles        | daily_goal_xp          | integer                  | NO          | 50                 
|| user_sessions        | id                     | uuid                     | NO          | gen_random_uuid()  |
| user_sessions        | user_id                | uuid                     | NO          | null               |
| user_sessions        | session_start          | timestamp with time zone | NO          | now()              |
| user_sessions        | session_end            | timestamp with time zone | YES         | null               |
| user_sessions        | lessons_completed      | integer                  | NO          | 0                  |
| user_sessions        | xp_earned_this_session | integer                  | NO          | 0                  |
| user_subscriptions   | id                     | uuid                     | NO          | gen_random_uuid()  |
| user_subscriptions   | user_id                | uuid                     | NO          | null               |
| user_subscriptions   | stripe_customer_id     | text                     | YES         | null               |
| user_subscriptions   | stripe_subscription_id | text                     | YES         | null               |
| user_subscriptions   | plan_type              | text                     | NO          | '''free'''::text   |
| user_subscriptions   | status                 | text                     | NO          | '''free'''::text   |
| user_subscriptions   | current_period_end     | timestamp with time zone | YES         | null               |
| user_subscriptions   | cancel_at_period_end   | boolean                  | NO          | false              |
| user_subscriptions   | cancellation_reason    | text                     | YES         | null               |
| user_subscriptions   | created_at             | timestamp with time zone | NO          | now()              |
| user_subscriptions   | updated_at             | timestamp with time zone | NO          | now()              |
| user_xp_transactions | id                     | uuid                     | NO          | gen_random_uuid()  |
| user_xp_transactions | user_id                | uuid                     | NO          | null               |
| user_xp_transactions | amount                 | integer                  | NO          | null               |
| user_xp_transactions | source                 | text                     | NO          | null               |
| user_xp_transactions | lesson_id              | text                     | YES         | null               |
| user_xp_transactions | metadata               | jsonb                    | YES         | null               |
| user_xp_transactions | idempotency_key        | text                     | YES         | null               |
| user_xp_transactions | created_at             | timestamp with time zone | NO          | now()              |
| vocabulary_performance | id                   | uuid                     | NO          | gen_random_uuid()  |
| vocabulary_performance | user_id              | uuid                     | NO          | null               |
| vocabulary_performance | vocabulary_id        | text                     | NO          | null               |
| vocabulary_performance | word_text            | text                     | NO          | null               |
| vocabulary_performance | total_attempts       | integer                  | NO          | 0                  |
| vocabulary_performance | total_correct        | integer                  | NO          | 0                  |
| vocabulary_performance | total_incorrect      | integer                  | NO          | 0                  |
| vocabulary_performance | consecutive_correct  | integer                  | NO          | 0                  |
| vocabulary_performance | mastery_level        | smallint                 | NO          | 0                  |
| vocabulary_performance | last_seen_at         | timestamp with time zone | YES         | null               |
| vocabulary_performance | last_correct_at      | timestamp with time zone | YES         | null               |
| vocabulary_performance | next_review_at       | timestamp with time zone | YES         | null               |
| vocabulary_performance | created_at           | timestamp with time zone | NO          | now()              |
| vocabulary_performance | updated_at           | timestamp with time zone | NO          | now()              |
| vocabulary_attempts    | id                   | uuid                     | NO          | gen_random_uuid()  |
| vocabulary_attempts    | user_id              | uuid                     | NO          | null               |
| vocabulary_attempts    | vocabulary_id        | text                     | NO          | null               |
| vocabulary_attempts    | game_type            | text                     | NO          | null               |
| vocabulary_attempts    | module_id            | text                     | YES         | null               |
| vocabulary_attempts    | lesson_id            | text                     | YES         | null               |
| vocabulary_attempts    | step_uid             | text                     | YES         | null               |
| vocabulary_attempts    | is_correct           | boolean                  | NO          | null               |
| vocabulary_attempts    | time_spent_ms        | integer                  | YES         | null               |
| vocabulary_attempts    | context_data         | jsonb                    | YES         | null               |
| vocabulary_attempts    | created_at           | timestamp with time zone | NO          | now()              |

## Constraints

### user_lesson_progress
- **UNIQUE**: `(user_id, module_id, lesson_id)` - Prevents duplicate lesson progress records

### user_profiles
- **CHECK**: `review_xp_earned_today >= 0` - Ensures review XP cannot be negative
- **CHECK**: `streak_count >= 0` - Ensures streak count cannot be negative
- **CHECK**: `daily_goal_xp > 0 AND daily_goal_xp <= 1000` - Daily goal must be between 1-1000 XP
- **learning_goal** values: `'heritage'`, `'travel'`, `'family'`, `'academic'`, `'fun'` (nullable, set during onboarding)
- **current_level** values: `'beginner'`, `'few_words'`, `'basic_conversation'`, `'intermediate'` (nullable, optional during onboarding)
- **primary_focus** values: `'speaking'`, `'reading'`, `'writing'`, `'all'` (nullable, optional during onboarding)
- **INDEX**: `idx_user_profiles_leaderboard` on `(total_xp DESC, created_at ASC)` - Leaderboard performance optimization (added 2025-01-04)
- **INDEX**: `idx_user_profiles_last_activity` on `(last_activity_date, id)` WHERE `last_activity_date IS NOT NULL` - Streak query optimization (added 2025-01-13)
- **INDEX**: `idx_user_profiles_streak_count` on `(streak_count DESC)` WHERE `streak_count > 0` - Streak leaderboard optimization (added 2025-01-13)

### Database Triggers

#### `trg_set_display_name` (BEFORE INSERT OR UPDATE)
- **Function**: `set_display_name()`
- **Purpose**: Auto-generates `display_name` only if NULL or empty
- **Logic**: 
  - If `display_name` is NULL or empty → generates "FirstName LastInitial." format from `first_name` + `last_name`
  - If `display_name` is already set → leaves it unchanged (allows onboarding custom names to persist)
- **Security**: Uses `SECURITY DEFINER` (required for trigger functions), RLS policies still enforced
- **Updated**: 2025-01-03 - Fixed to respect explicit `display_name` values set during onboarding

#### `trg_sync_user_metadata` (AFTER INSERT OR UPDATE)
- **Function**: `sync_user_metadata()`
- **Purpose**: Syncs `first_name`, `last_name`, `display_name` from `user_profiles` → `auth.users.raw_user_meta_data`
- **Security**: Uses `SECURITY DEFINER` (required to update `auth.users` table), RLS policies still enforced

#### `trg_update_streak` (AFTER INSERT on `user_xp_transactions`)
- **Function**: `trigger_update_streak()`
- **Purpose**: Automatically updates user streak whenever XP is awarded
- **Logic**: Calls `update_streak()` function for the user who earned XP
- **Security**: Uses `SECURITY DEFINER` (required for trigger functions), RLS policies still enforced
- **Added**: 2025-01-13 - Ensures streaks stay in sync automatically without application code changes

### Database RPC Functions

#### `award_step_xp_idem(p_user_id, p_idempotency_key, p_amount, p_source, p_lesson_id, p_metadata)`
- **Purpose**: Idempotent XP award - ensures users can only earn XP once per step
- **Returns**: `jsonb { awarded: boolean, new_xp: integer }`
- **Logic**: Uses `idempotency_key` constraint to prevent duplicate awards
- **Security**: Uses `SECURITY DEFINER`, granted to `authenticated`
- **Updated**: 2025-01-10 - Returns new XP total atomically

#### `get_all_users_for_leaderboard()`
- **Purpose**: Fetches all user profiles for leaderboard with guaranteed real-time data
- **Returns**: `TABLE (id, display_name, total_xp, created_at)`
- **Logic**: Forces read from PRIMARY database (bypasses read replica lag) using advisory locks
- **Security**: Uses `SECURITY DEFINER`, granted to `authenticated` and `anon`
- **Added**: 2025-01-12 - Fixes leaderboard staleness caused by read replica lag

#### `calculate_level(p_total_xp INTEGER)`
- **Purpose**: Calculates user level from total XP
- **Returns**: `INTEGER` (level number)
- **Logic**: 
  - Level 1: 0-100 XP
  - Level 2: 101-250 XP
  - Level 3: 251-500 XP
  - Level 4: 501-1000 XP
  - Level 5+: 1000 + (n-4) * 500 XP per level
- **Security**: `IMMUTABLE` function (pure calculation)
- **Added**: 2025-01-13

#### `xp_to_next_level(p_total_xp INTEGER)`
- **Purpose**: Calculates remaining XP needed to reach next level
- **Returns**: `INTEGER` (XP remaining, minimum 1 if at boundary)
- **Logic**: Uses `calculate_level()` to determine current level, then calculates XP threshold for next level
- **Security**: `IMMUTABLE` function (pure calculation)
- **Added**: 2025-01-13

#### `update_streak(p_user_id UUID)`
- **Purpose**: Updates user streak when XP is awarded (timezone-aware)
- **Returns**: `VOID`
- **Logic**: 
  - Validates `auth.uid() = p_user_id` (prevents privilege escalation)
  - Gets user's timezone (defaults to 'America/Los_Angeles')
  - Converts server time to user timezone and extracts date
  - Compares dates:
    - If never had activity → streak = 1
    - If last activity < today - 1 → streak broken, reset to 1
    - If last activity = today - 1 → continue streak, increment
    - If last activity = today → do nothing (already updated)
- **Security**: 
  - Uses `SECURITY DEFINER` (needed to update user_profiles via trigger)
  - Validates `auth.uid() = p_user_id` before execution (prevents users from updating other users' streaks)
  - When called from trigger, `auth.uid()` matches `NEW.user_id` due to RLS on `user_xp_transactions`
  - Granted `EXECUTE` to `authenticated` role only
- **Added**: 2025-01-13 - Automatically called by trigger on XP award
- **Updated**: 2025-01-13 - Added security validation to prevent privilege escalation

#### `get_xp_earned_today(p_user_id UUID, p_timezone TEXT)`
- **Purpose**: Calculates total XP earned today in user's timezone (optimized server-side filtering)
- **Returns**: `INTEGER` (total XP earned today)
- **Logic**: 
  - Validates `auth.uid() = p_user_id` (prevents data leakage)
  - Gets today's date in user's timezone
  - Calculates start/end of today in UTC (for efficient querying)
  - Sums all XP transactions that occurred today (in user timezone)
  - Uses PostgreSQL timezone conversion for accurate filtering
- **Security**: 
  - Uses `SECURITY DEFINER`, `STABLE` function (safe for caching)
  - Validates `auth.uid() = p_user_id` before execution (prevents users from querying other users' XP)
  - Granted `EXECUTE` to `authenticated` role only
- **Performance**: Server-side filtering (much faster than client-side)
- **Added**: 2025-01-13 - Optimized daily goal progress calculation
- **Updated**: 2025-01-13 - Added security validation to prevent data leakage

### user_xp_transactions
- **UNIQUE**: `(user_id, source, lesson_id, created_at)` - Prevents duplicate XP awards (idempotency for retries)
- **UNIQUE**: `(user_id, idempotency_key)` WHERE `idempotency_key IS NOT NULL` - Ensures once-per-step XP awards (format: moduleId:lessonId:stepUid)
- **INDEX**: `idx_xp_transactions_lookup` on `(user_id, source, lesson_id)` - Faster lookups

### vocabulary_performance
- **UNIQUE**: `(user_id, vocabulary_id)` - One performance record per user per word
- **INDEX**: `idx_vocab_perf_user_next_review` on `(user_id, next_review_at)` WHERE `next_review_at IS NOT NULL` - Spaced repetition queries
- **INDEX**: `idx_vocab_perf_user_consecutive` on `(user_id, consecutive_correct DESC)` - Finding weak words by streak
- **INDEX**: `idx_vocab_perf_user_mastery` on `(user_id, mastery_level ASC)` - Finding words by mastery level
- **INDEX**: `idx_vocab_perf_user_status` on `(user_id, total_attempts, consecutive_correct)` WHERE `total_attempts > 0` - Dashboard status queries (added 2025-01-13)
- **INDEX**: `idx_vocab_perf_last_correct` on `(user_id, last_correct_at DESC)` WHERE `last_correct_at IS NOT NULL` - Decay system queries (added 2025-01-13)
- **COLUMN**: `last_correct_at` (TIMESTAMPTZ, nullable) - Last timestamp when word was answered correctly. Used for decay system. Auto-updated by VocabularyTrackingService on correct answers. (added 2025-01-13)

### vocabulary_attempts
- **INDEX**: `idx_vocab_attempts_user_time` on `(user_id, created_at DESC)` - User's recent attempts
- **INDEX**: `idx_vocab_attempts_user_vocab` on `(user_id, vocabulary_id, created_at DESC)` - Per-word history
- **INDEX**: `idx_vocab_attempts_vocab_global` on `(vocabulary_id, created_at DESC)` - Global analytics
- **INDEX**: `idx_vocab_attempts_context_gin` on `context_data` using GIN - JSONB queries

---

## Database Views

### `user_word_mastery` (VIEW)
- **Purpose**: Single source of truth for word mastery status with improved algorithm
- **Base Table**: `vocabulary_performance`
- **Returns**: All base fields plus calculated fields
- **Calculated Fields**:
  - `accuracy` (NUMERIC, 0-100) - Percentage accuracy: `(total_correct / total_attempts) * 100`, rounded to 1 decimal
  - `error_rate` (NUMERIC, 0-100) - Percentage error rate: `(total_incorrect / total_attempts) * 100`, rounded to 1 decimal
  - `status` (TEXT) - Mastery status: `'unclassified' | 'mastered' | 'hard' | 'learning'`
  - `mastery_confidence` (NUMERIC, 0-100) - Composite confidence score: `(accuracy * 0.6) + (streak_ratio * 30) + (attempt_weight * 10)`
  - `effective_mastery_level` (SMALLINT) - Mastery level with decay applied (reduces by 1 if inactive >14 days)
- **Status Logic** (mutually exclusive):
  - **Unclassified**: `total_attempts < 3` (not enough data to classify)
  - **Mastered**: `consecutive_correct >= 5 AND accuracy >= 90 AND total_attempts >= 3`
  - **Hard**: `(accuracy < 70 OR consecutive_correct < 2) AND total_attempts >= 2 AND NOT mastered`
  - **Learning**: Everything else (in progress, has 3+ attempts, not mastered, not hard)
- **Edge Cases Handled**:
  - Division by zero: Checks `total_attempts >= 2` or `>= 3` before division (no NULLIF needed)
  - Null values: All calculations handle NULL safely
  - Boundary conditions: Uses `>=` and `<` for exact thresholds (90%, 70%, etc.)
  - Mutual exclusivity: Mastered words explicitly excluded from hard words
- **Decay Logic**: `effective_mastery_level = GREATEST(0, mastery_level - 1)` if `last_correct_at IS NULL` or `last_correct_at < NOW() - INTERVAL '14 days'`
- **Security**: `GRANT SELECT` to `authenticated` and `anon`
- **Performance**: Uses indexes on base table for efficient queries
- **Added**: 2025-01-13 - Replaces duplicated logic in service/API layers