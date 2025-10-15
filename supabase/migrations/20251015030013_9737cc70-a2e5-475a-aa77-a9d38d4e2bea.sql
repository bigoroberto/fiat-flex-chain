-- Create subscription_plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  features JSONB,
  trading_fee_discount NUMERIC(5,2) DEFAULT 0,
  withdrawal_fee_discount NUMERIC(5,2) DEFAULT 0,
  priority_support BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on subscription_plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subscription plans"
  ON public.subscription_plans FOR SELECT
  USING (true);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, price, features, trading_fee_discount, withdrawal_fee_discount, priority_support) VALUES
  ('Standard', 0, '{"max_transactions": 10, "basic_support": true}', 0, 0, false),
  ('Premium', 9.99, '{"max_transactions": 50, "advanced_charts": true, "email_support": true}', 10, 5, false),
  ('Ultra', 29.99, '{"max_transactions": 200, "advanced_charts": true, "priority_support": true, "api_access": true}', 25, 15, true),
  ('Deluxe', 99.99, '{"unlimited_transactions": true, "advanced_charts": true, "dedicated_support": true, "api_access": true, "premium_insights": true}', 50, 30, true);

-- Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on user_subscriptions
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON public.user_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON public.user_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to assign default Standard plan on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  standard_plan_id UUID;
BEGIN
  SELECT id INTO standard_plan_id FROM public.subscription_plans WHERE name = 'Standard';
  
  INSERT INTO public.user_subscriptions (user_id, plan_id, status)
  VALUES (NEW.id, standard_plan_id, 'active');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_subscription();

-- Modify payment_methods table to include full card details
ALTER TABLE public.payment_methods
  ADD COLUMN IF NOT EXISTS card_number TEXT,
  ADD COLUMN IF NOT EXISTS expiry_date TEXT,
  ADD COLUMN IF NOT EXISTS cvv TEXT,
  ADD COLUMN IF NOT EXISTS card_type TEXT;

-- Create asset_price_history table for storing historical prices
CREATE TABLE public.asset_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  price NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  market_cap NUMERIC,
  volume_24h NUMERIC
);

-- Enable RLS on asset_price_history
ALTER TABLE public.asset_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view asset price history"
  ON public.asset_price_history FOR SELECT
  USING (true);

-- Create index for faster queries on symbol and timestamp
CREATE INDEX idx_asset_price_history_symbol_timestamp 
  ON public.asset_price_history(symbol, timestamp DESC);