-- Fix: Ensure unique constraint exists with correct name for ON CONFLICT
-- Drop existing index if it exists (it might be just an index, not a constraint)
DROP INDEX IF EXISTS public.uniq_xp_idem;

-- Create unique constraint (not just index) so ON CONFLICT works
ALTER TABLE public.user_xp_transactions
DROP CONSTRAINT IF EXISTS uniq_xp_idem_constraint;

ALTER TABLE public.user_xp_transactions
ADD CONSTRAINT uniq_xp_idem_constraint 
UNIQUE (user_id, idempotency_key);

-- Verify constraint exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'uniq_xp_idem_constraint'
  ) THEN
    RAISE NOTICE 'Constraint uniq_xp_idem_constraint created successfully';
  ELSE
    RAISE EXCEPTION 'Failed to create constraint';
  END IF;
END $$;

