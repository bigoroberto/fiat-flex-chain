-- Fix user_subscriptions unique constraint issue by removing it
ALTER TABLE public.user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_key;

-- Add a unique constraint on user_id and status='active' to ensure only one active subscription
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_subscription 
ON public.user_subscriptions (user_id) 
WHERE status = 'active';

-- Drop existing policy if exists and recreate
DROP POLICY IF EXISTS "Users can delete own old subscriptions" ON public.user_subscriptions;

-- Add RLS policy to allow users to delete their own old (non-active) subscriptions
CREATE POLICY "Users can delete own old subscriptions"
ON public.user_subscriptions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND status != 'active');