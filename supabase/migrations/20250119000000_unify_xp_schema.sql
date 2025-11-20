-- Migration: Unify XP Schema and Functions
-- Purpose: Support generic XP awards (Review, Games, etc.) with idempotency and transaction logging

BEGIN;

-- 1. Add index for efficient daily review XP calculation
-- We need to sum XP where source LIKE 'review%' AND created_at >= today
CREATE INDEX IF NOT EXISTS idx_user_xp_transactions_daily_source 
ON public.user_xp_transactions(user_id, source, created_at);

-- 2. Create Unified XP Award Function
-- Replaces/Generalizes award_step_xp_idem
CREATE OR REPLACE FUNCTION public.award_xp_unified(
  p_user_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_idempotency_key TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_lesson_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_total INTEGER;
  v_inserted_id UUID;
BEGIN
  -- 1. Idempotency Check: If key exists, return existing state
  IF EXISTS (
    SELECT 1 FROM public.user_xp_transactions 
    WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key
  ) THEN
    -- Return current total XP without changing anything
    SELECT total_xp INTO v_new_total FROM public.user_profiles WHERE id = p_user_id;
    RETURN jsonb_build_object(
      'awarded', false,
      'reason', 'already_awarded',
      'new_xp', v_new_total
    );
  END IF;

  -- 2. Insert Transaction
  INSERT INTO public.user_xp_transactions (
    user_id,
    amount,
    source,
    lesson_id,
    idempotency_key,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    p_amount,
    p_source,
    p_lesson_id, -- Can be NULL for review games
    p_idempotency_key,
    p_metadata,
    NOW()
  ) RETURNING id INTO v_inserted_id;

  -- 3. Update User Profile (Atomic Increment)
  -- Note: Trigger trg_update_streak will handle streak updates
  UPDATE public.user_profiles
  SET 
    total_xp = total_xp + p_amount,
    updated_at = NOW(),
    -- If this is a review game, update review_xp_earned_today for backward compatibility
    review_xp_earned_today = CASE 
      WHEN p_source LIKE 'review%' THEN review_xp_earned_today + p_amount
      ELSE review_xp_earned_today
    END
  WHERE id = p_user_id
  RETURNING total_xp INTO v_new_total;

  -- 4. Return Result
  RETURN jsonb_build_object(
    'awarded', true,
    'new_xp', v_new_total,
    'transaction_id', v_inserted_id
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.award_xp_unified(UUID, INTEGER, TEXT, TEXT, JSONB, TEXT) TO authenticated;

COMMIT;

