-- Rate Limiting Table (Supabase-backed, no Redis needed)
-- Stores request counts per user/IP for various endpoints

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,  -- user_id or IP address
  endpoint text NOT NULL,    -- e.g., 'checkout', 'leaderboard'
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
ON public.rate_limits(identifier, endpoint, window_start DESC);

-- Index for cleanup (delete old entries)
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup 
ON public.rate_limits(window_start);

-- Auto-cleanup function: delete entries older than 1 hour
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$;

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.rate_limits TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.rate_limits TO anon;

-- RLS Policies: Users can only see/modify their own rate limit records
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rate limits"
ON public.rate_limits
FOR SELECT
USING (
  identifier = COALESCE(auth.uid()::text, current_setting('request.headers')::json->>'x-forwarded-for')
);

CREATE POLICY "Users can insert their own rate limits"
ON public.rate_limits
FOR INSERT
WITH CHECK (
  identifier = COALESCE(auth.uid()::text, current_setting('request.headers')::json->>'x-forwarded-for')
);

CREATE POLICY "Users can update their own rate limits"
ON public.rate_limits
FOR UPDATE
USING (
  identifier = COALESCE(auth.uid()::text, current_setting('request.headers')::json->>'x-forwarded-for')
);

-- Note: Run cleanup manually or via cron:
-- SELECT cron.schedule('cleanup-rate-limits', '*/15 * * * *', 'SELECT cleanup_rate_limits()');

