-- Add idempotency key for XP rate limiting
-- This allows stable step identification for "once per step" XP awards

-- Add idempotency_key column
ALTER TABLE public.user_xp_transactions
ADD COLUMN IF NOT EXISTS idempotency_key text;

-- Create unique index to enforce once-per-step-per-user XP
-- Only enforces for rows with non-null idempotency_key (backward compatible)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_xp_idem
ON public.user_xp_transactions (user_id, idempotency_key)
WHERE idempotency_key IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.user_xp_transactions.idempotency_key IS 
'Stable step identifier in format: moduleId:lessonId:stepUid. Used to prevent duplicate XP awards for the same step.';

