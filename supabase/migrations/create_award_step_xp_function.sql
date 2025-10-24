-- RPC function for idempotent XP awards
-- Ensures users can only earn XP once per step (identified by idempotency_key)
-- Returns true if XP was awarded, false if already awarded

CREATE OR REPLACE FUNCTION award_step_xp_idem(
  p_user_id uuid,
  p_idempotency_key text,
  p_amount int,
  p_source text,
  p_lesson_id text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean AS $$
DECLARE
  inserted boolean := false;
  row_count_val integer;
BEGIN
  -- Validate inputs
  IF p_user_id IS NULL OR p_idempotency_key IS NULL OR p_amount IS NULL THEN
    RAISE EXCEPTION 'Missing required parameters';
  END IF;

  -- Try to insert XP transaction with idempotency key
  -- ON CONFLICT DO NOTHING ensures atomic "insert if not exists"
  INSERT INTO public.user_xp_transactions (
    user_id,
    amount,
    source,
    lesson_id,
    metadata,
    idempotency_key,
    created_at
  )
  VALUES (
    p_user_id,
    p_amount,
    p_source,
    p_lesson_id,
    p_metadata,
    p_idempotency_key,
    now()
  )
  ON CONFLICT (user_id, idempotency_key) DO NOTHING;

  -- Check if row was inserted
  GET DIAGNOSTICS row_count_val = ROW_COUNT;
  inserted := row_count_val > 0;

  -- If XP was awarded, atomically update user profile
  IF inserted THEN
    UPDATE public.user_profiles
    SET 
      total_xp = total_xp + p_amount,
      updated_at = now()
    WHERE id = p_user_id;
    
    -- Log for debugging (optional, remove in production if too noisy)
    RAISE NOTICE 'XP awarded: user=%, key=%, amount=%', p_user_id, p_idempotency_key, p_amount;
  ELSE
    -- XP already awarded for this step
    RAISE NOTICE 'XP already awarded: user=%, key=%', p_user_id, p_idempotency_key;
  END IF;

  RETURN inserted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION award_step_xp_idem TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION award_step_xp_idem IS 
'Awards XP for a lesson step if not already awarded. Uses idempotency_key to ensure once-per-step awards. Returns true if XP was granted, false if already granted.';

