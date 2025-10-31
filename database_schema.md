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
| user_sessions        | id                     | uuid                     | NO          | gen_random_uuid()  |
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

### user_xp_transactions
- **UNIQUE**: `(user_id, source, lesson_id, created_at)` - Prevents duplicate XP awards (idempotency for retries)
- **UNIQUE**: `(user_id, idempotency_key)` WHERE `idempotency_key IS NOT NULL` - Ensures once-per-step XP awards (format: moduleId:lessonId:stepUid)
- **INDEX**: `idx_xp_transactions_lookup` on `(user_id, source, lesson_id)` - Faster lookups

### vocabulary_performance
- **UNIQUE**: `(user_id, vocabulary_id)` - One performance record per user per word
- **INDEX**: `idx_vocab_perf_user_next_review` on `(user_id, next_review_at)` WHERE `next_review_at IS NOT NULL` - Spaced repetition queries
- **INDEX**: `idx_vocab_perf_user_consecutive` on `(user_id, consecutive_correct DESC)` - Finding weak words by streak
- **INDEX**: `idx_vocab_perf_user_mastery` on `(user_id, mastery_level ASC)` - Finding words by mastery level

### vocabulary_attempts
- **INDEX**: `idx_vocab_attempts_user_time` on `(user_id, created_at DESC)` - User's recent attempts
- **INDEX**: `idx_vocab_attempts_user_vocab` on `(user_id, vocabulary_id, created_at DESC)` - Per-word history
- **INDEX**: `idx_vocab_attempts_vocab_global` on `(vocabulary_id, created_at DESC)` - Global analytics
- **INDEX**: `idx_vocab_attempts_context_gin` on `context_data` using GIN - JSONB queries