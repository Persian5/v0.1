| schemaname | tablename            | policyname                           | permissive | roles    | cmd    | qual                   | with_check             |
| ---------- | -------------------- | ------------------------------------ | ---------- | -------- | ------ | ---------------------- | ---------------------- |
| public     | user_attempts        | Users can insert own attempts        | PERMISSIVE | {public} | INSERT | null                   | (auth.uid() = user_id) |
| public     | user_attempts        | Users can view own attempts          | PERMISSIVE | {public} | SELECT | (auth.uid() = user_id) | null                   |
| public     | user_lesson_progress | Users can insert own lesson progress | PERMISSIVE | {public} | INSERT | null                   | (auth.uid() = user_id) |
| public     | user_lesson_progress | Users can update own lesson progress | PERMISSIVE | {public} | UPDATE | (auth.uid() = user_id) | null                   |
| public     | user_lesson_progress | Users can view own lesson progress   | PERMISSIVE | {public} | SELECT | (auth.uid() = user_id) | null                   |
| public     | user_profiles        | Users can insert own profile         | PERMISSIVE | {public} | INSERT | null                   | (auth.uid() = id)      |
| public     | user_profiles        | Users can update own profile         | PERMISSIVE | {public} | UPDATE | (auth.uid() = id)      | null                   |
| public     | user_profiles        | Users can view own profile           | PERMISSIVE | {public} | SELECT | (auth.uid() = id)      | null                   |
| public     | user_sessions        | Users can insert own sessions        | PERMISSIVE | {public} | INSERT | null                   | (auth.uid() = user_id) |
| public     | user_sessions        | Users can update own sessions        | PERMISSIVE | {public} | UPDATE | (auth.uid() = user_id) | null                   |
| public     | user_sessions        | Users can view own sessions          | PERMISSIVE | {public} | SELECT | (auth.uid() = user_id) | null                   |
| public     | user_subscriptions   | Users can insert own subscription    | PERMISSIVE | {public} | INSERT | null                   | (auth.uid() = user_id) |
| public     | user_subscriptions   | Users can update own subscription    | PERMISSIVE | {public} | UPDATE | (auth.uid() = user_id) | null                   |
| public     | user_subscriptions   | Users can view own subscription      | PERMISSIVE | {public} | SELECT | (auth.uid() = user_id) | null                   |
| public     | user_xp_transactions | Users can insert own XP transactions | PERMISSIVE | {public} | INSERT | null                   | (auth.uid() = user_id) |
| public     | user_xp_transactions | Users can view own XP transactions   | PERMISSIVE | {public} | SELECT | (auth.uid() = user_id) | null                   |