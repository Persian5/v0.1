-- Review XP Analysis Query - Last 6 Hours
-- Checks for XP doubling issues and validates review XP tracking

-- 1. Check users who earned review XP in last 6 hours
-- Shows: user, review_xp_earned_today, total_xp, timezone, reset_at
SELECT 
  id,
  email,
  display_name,
  review_xp_earned_today,
  total_xp,
  timezone,
  review_xp_reset_at,
  updated_at,
  -- Calculate if review XP seems reasonable (should be <= 1000)
  CASE 
    WHEN review_xp_earned_today > 1000 THEN '⚠️ OVER CAP'
    WHEN review_xp_earned_today < 0 THEN '⚠️ NEGATIVE'
    ELSE '✓ OK'
  END as review_xp_status
FROM user_profiles
WHERE updated_at >= NOW() - INTERVAL '6 hours'
  AND review_xp_earned_today > 0
ORDER BY updated_at DESC;

-- 2. Check for potential XP doubling
-- Compares review_xp_earned_today changes vs total_xp changes
-- If total_xp increased MORE than review_xp_earned_today, might indicate doubling
WITH xp_changes AS (
  SELECT 
    up.id,
    up.email,
    up.review_xp_earned_today as current_review_xp,
    up.total_xp as current_total_xp,
    up.updated_at as last_updated,
    -- Get XP transactions from last 6 hours (if any)
    COUNT(xt.id) FILTER (WHERE xt.source LIKE '%review%' OR xt.source LIKE '%game%') as review_xp_transactions,
    COALESCE(SUM(xt.amount) FILTER (WHERE xt.source LIKE '%review%' OR xt.source LIKE '%game%'), 0) as review_xp_from_transactions
  FROM user_profiles up
  LEFT JOIN user_xp_transactions xt ON xt.user_id = up.id 
    AND xt.created_at >= NOW() - INTERVAL '6 hours'
  WHERE up.updated_at >= NOW() - INTERVAL '6 hours'
    AND up.review_xp_earned_today > 0
  GROUP BY up.id, up.email, up.review_xp_earned_today, up.total_xp, up.updated_at
)
SELECT 
  id,
  email,
  current_review_xp,
  current_total_xp,
  review_xp_transactions,
  review_xp_from_transactions,
  -- Flag if review_xp_earned_today is HIGH but no transactions exist (review games don't create transactions)
  CASE 
    WHEN review_xp_transactions = 0 AND current_review_xp > 0 THEN '✓ Expected (review games use direct update)'
    WHEN review_xp_transactions > 0 THEN '⚠️ Has transactions (unexpected for review games)'
    ELSE '✓ OK'
  END as transaction_status,
  last_updated
FROM xp_changes
ORDER BY last_updated DESC;

-- 3. Check vocabulary_attempts from review games (last 6 hours)
-- Shows: attempts, correct/incorrect breakdown, game types
SELECT 
  game_type,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE is_correct = true) as correct_attempts,
  COUNT(*) FILTER (WHERE is_correct = false) as incorrect_attempts,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT vocabulary_id) as unique_words,
  -- Check if context_data has reviewMode flag
  COUNT(*) FILTER (WHERE context_data->>'reviewMode' = 'true') as review_mode_attempts,
  COUNT(*) FILTER (WHERE context_data->>'reviewMode' IS NULL OR context_data->>'reviewMode' != 'true') as non_review_attempts
FROM vocabulary_attempts
WHERE created_at >= NOW() - INTERVAL '6 hours'
  AND game_type LIKE '%review%'
GROUP BY game_type
ORDER BY total_attempts DESC;

-- 4. Detailed view: User's review XP progression over time
-- (Requires audit log or we can only see current state)
-- This shows current state only since we don't have history table
SELECT 
  up.id,
  up.email,
  up.review_xp_earned_today,
  up.total_xp,
  up.review_xp_reset_at,
  up.timezone,
  -- Count vocabulary attempts in last 6 hours
  COUNT(va.id) FILTER (WHERE va.created_at >= NOW() - INTERVAL '6 hours') as attempts_last_6h,
  COUNT(va.id) FILTER (WHERE va.created_at >= NOW() - INTERVAL '6 hours' AND va.is_correct = true) as correct_last_6h,
  COUNT(va.id) FILTER (WHERE va.created_at >= NOW() - INTERVAL '6 hours' AND va.is_correct = false) as incorrect_last_6h
FROM user_profiles up
LEFT JOIN vocabulary_attempts va ON va.user_id = up.id
  AND va.created_at >= NOW() - INTERVAL '6 hours'
  AND va.game_type LIKE '%review%'
WHERE up.updated_at >= NOW() - INTERVAL '6 hours'
  AND up.review_xp_earned_today > 0
GROUP BY up.id, up.email, up.review_xp_earned_today, up.total_xp, up.review_xp_reset_at, up.timezone
ORDER BY up.updated_at DESC;

-- 5. Check for suspicious patterns (XP doubling indicators)
-- If review_xp_earned_today = X but total_xp increased by > X, might be doubling
SELECT 
  up.id,
  up.email,
  up.review_xp_earned_today,
  up.total_xp,
  -- Count all XP transactions (lesson + review) in last 6 hours
  COUNT(xt.id) as total_xp_transactions,
  COALESCE(SUM(xt.amount), 0) as xp_from_transactions,
  -- Flag potential issues
  CASE 
    WHEN up.review_xp_earned_today > 0 AND COUNT(xt.id) FILTER (WHERE xt.source LIKE '%review%') > 0 THEN 
      '⚠️ Review XP exists + transactions exist (review games should NOT create transactions)'
    WHEN up.review_xp_earned_today > 1000 THEN 
      '⚠️ Review XP over daily cap (1000)'
    ELSE '✓ Looks OK'
  END as status
FROM user_profiles up
LEFT JOIN user_xp_transactions xt ON xt.user_id = up.id 
  AND xt.created_at >= NOW() - INTERVAL '6 hours'
WHERE up.updated_at >= NOW() - INTERVAL '6 hours'
  AND up.review_xp_earned_today > 0
GROUP BY up.id, up.email, up.review_xp_earned_today, up.total_xp
ORDER BY up.review_xp_earned_today DESC;

