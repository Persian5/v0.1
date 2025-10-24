-- Update RPC function to return {awarded: boolean, new_xp: integer}
-- This eliminates race conditions by returning the XP value atomically

-- Drop the old function signature first (can't change return type with CREATE OR REPLACE)
DROP FUNCTION IF EXISTS award_step_xp_idem(uuid,text,integer,text,text,jsonb);

-- Create new function with jsonb return type
CREATE FUNCTION award_step_xp_idem(
  p_user_id uuid,
  p_idempotency_key text,
  p_amount int,
  p_source text,
  p_lesson_id text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb AS $$
DECLARE
  inserted boolean := false;
  row_count_val integer;
  new_xp_value integer;
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
  ON CONFLICT ON CONSTRAINT uniq_xp_idem_constraint DO NOTHING;

  -- Check if row was inserted
  GET DIAGNOSTICS row_count_val = ROW_COUNT;
  inserted := row_count_val > 0;

  -- If XP was awarded, atomically update user profile and return new total
  IF inserted THEN
    UPDATE public.user_profiles
    SET 
      total_xp = total_xp + p_amount,
      updated_at = now()
    WHERE id = p_user_id
    RETURNING total_xp INTO new_xp_value;
    
    -- Log for debugging (optional, remove in production if too noisy)
    RAISE NOTICE 'XP awarded: user=%, key=%, amount=%, new_total=%', p_user_id, p_idempotency_key, p_amount, new_xp_value;
    
    -- Return success with new XP total
    RETURN jsonb_build_object(
      'awarded', true,
      'new_xp', new_xp_value
    );
  ELSE
    -- XP already awarded for this step - fetch current total
    SELECT total_xp INTO new_xp_value 
    FROM public.user_profiles 
    WHERE id = p_user_id;
    
    RAISE NOTICE 'XP already awarded: user=%, key=%, current_total=%', p_user_id, p_idempotency_key, new_xp_value;
    
    -- Return already awarded with current XP total
    RETURN jsonb_build_object(
      'awarded', false,
      'new_xp', new_xp_value
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update comment
COMMENT ON FUNCTION award_step_xp_idem IS 
'Awards XP for a lesson step if not already awarded. Uses idempotency_key to ensure once-per-step awards. Returns {awarded: boolean, new_xp: integer} atomically to prevent race conditions.';

