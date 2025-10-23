-- Add unique constraint to user_xp_transactions to prevent duplicate XP awards
-- This ensures idempotency when retrying failed operations

-- Drop existing constraint if it exists (for re-running migration)
ALTER TABLE user_xp_transactions 
DROP CONSTRAINT IF EXISTS unique_xp_transaction;

-- Add unique constraint on (user_id, source, lesson_id, created_at)
-- This prevents the same XP transaction from being inserted twice
-- Note: created_at is included to allow multiple transactions from the same source/lesson
-- but at different times (e.g., replaying a lesson)
ALTER TABLE user_xp_transactions
ADD CONSTRAINT unique_xp_transaction 
UNIQUE (user_id, source, lesson_id, created_at);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_xp_transactions_lookup 
ON user_xp_transactions (user_id, source, lesson_id);

