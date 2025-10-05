-- ============================================
-- CRITICAL: Add RLS policies for user_subscriptions
-- ============================================
-- Only service_role can insert subscriptions (via Stripe webhooks)
CREATE POLICY "Only service can insert subscriptions"
ON user_subscriptions FOR INSERT
TO service_role
WITH CHECK (true);

-- Only service_role can update subscriptions (via Stripe webhooks)
CREATE POLICY "Only service can update subscriptions"
ON user_subscriptions FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Only service_role can delete subscriptions
CREATE POLICY "Only service can delete subscriptions"
ON user_subscriptions FOR DELETE
TO service_role
USING (true);

-- ============================================
-- HIGH: Fix database functions to prevent search_path injection
-- ============================================

-- Fix get_user_verified_emails
CREATE OR REPLACE FUNCTION public.get_user_verified_emails(user_uuid uuid)
RETURNS TABLE(id uuid, email text, is_verified boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT id, email, is_verified
  FROM verified_destination_emails
  WHERE user_id = user_uuid
  AND is_verified = TRUE
  ORDER BY created_at DESC;
$function$;

-- Fix check_user_forward_limit
CREATE OR REPLACE FUNCTION public.check_user_forward_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  forward_count INTEGER;
  user_is_premium BOOLEAN;
BEGIN
  -- Check if user is premium
  SELECT EXISTS (
    SELECT 1 FROM user_subscriptions 
    WHERE user_id = NEW.user_id 
    AND status = 'active'
    AND plan_type = 'premium'
    AND current_period_end > NOW()
  ) INTO user_is_premium;

  -- Count active forwards for user
  SELECT COUNT(*) INTO forward_count
  FROM temp_email_forwards
  WHERE user_id = NEW.user_id
  AND expires_at > NOW();

  -- Check limits (5 for free, 20 for premium)
  IF user_is_premium THEN
    IF forward_count >= 20 THEN
      RAISE EXCEPTION 'Premium users can only have 20 active forwards';
    END IF;
  ELSE
    IF forward_count >= 5 THEN
      RAISE EXCEPTION 'Free users can only have 5 active forwards. Upgrade to Premium for more.';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Fix get_expired_forwards
CREATE OR REPLACE FUNCTION public.get_expired_forwards()
RETURNS TABLE(id uuid, temp_email_name text, cloudflare_rule_id text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    tef.id,
    tef.temp_email_name,
    tef.cloudflare_rule_id
  FROM temp_email_forwards tef
  WHERE tef.expires_at <= NOW()
  AND tef.cloudflare_rule_id IS NOT NULL;
$function$;

-- Fix delete_forward_record
CREATE OR REPLACE FUNCTION public.delete_forward_record(forward_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  DELETE FROM temp_email_forwards WHERE id = forward_id;
$function$;

-- Fix get_total_active_forwards
CREATE OR REPLACE FUNCTION public.get_total_active_forwards()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM temp_email_forwards
  WHERE expires_at > NOW()
  AND cloudflare_rule_id IS NOT NULL;
$function$;

-- ============================================
-- ADDITIONAL: Create helper function for premium checks
-- ============================================
CREATE OR REPLACE FUNCTION public.check_user_premium(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = user_uuid
    AND status = 'active'
    AND current_period_end > NOW()
  );
$function$;