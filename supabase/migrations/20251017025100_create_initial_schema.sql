/*
  # Creazione schema iniziale database trading

  1. Nuove Tabelle
    - `profiles` - Profili utente con informazioni KYC
    - `wallets` - Portafogli multi-asset per ogni utente
    - `transactions` - Storico transazioni
    - `user_roles` - Ruoli utente (admin/user)
    - `payment_methods` - Metodi di pagamento
    - `trading_assets` - Asset disponibili per il trading
    - `subscription_plans` - Piani di abbonamento
    - `user_subscriptions` - Abbonamenti utenti
    - `asset_price_history` - Storico prezzi asset

  2. Sicurezza
    - Abilitazione RLS su tutte le tabelle
    - Policy per accesso utenti ai propri dati
    - Policy per accesso admin a tutti i dati

  3. Trigger e Funzioni
    - Gestione automatica profili, wallet e abbonamenti
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
  date_of_birth DATE,
  address TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT,
  document_type TEXT,
  document_number TEXT,
  kyc_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_code TEXT NOT NULL CHECK (asset_code IN ('BTC', 'ETH', 'USDT', 'USDC', 'EUR', 'USD')),
  balance DECIMAL(20, 8) DEFAULT 0,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, asset_code)
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallets"
  ON public.wallets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallets"
  ON public.wallets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdraw', 'swap', 'buy', 'sell')),
  asset_from TEXT,
  asset_to TEXT NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  fee DECIMAL(20, 8) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create role enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Payment methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  method_type TEXT NOT NULL CHECK (method_type IN ('card', 'bank_account', 'paypal', 'google_pay')),
  last_four TEXT,
  holder_name TEXT,
  iban TEXT,
  card_number TEXT,
  expiry_date TEXT,
  cvv TEXT,
  card_type TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment methods"
ON public.payment_methods
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment methods"
ON public.payment_methods
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment methods"
ON public.payment_methods
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment methods"
ON public.payment_methods
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Trading assets table
CREATE TABLE IF NOT EXISTS public.trading_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('crypto', 'stock', 'commodity')),
  current_price NUMERIC(20, 8) NOT NULL,
  price_change_24h NUMERIC(10, 4) DEFAULT 0,
  market_cap NUMERIC(20, 2),
  volume_24h NUMERIC(20, 2),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.trading_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view trading assets"
ON public.trading_assets
FOR SELECT
TO authenticated
USING (true);

-- Subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  features JSONB,
  trading_fee_discount NUMERIC(5,2) DEFAULT 0,
  withdrawal_fee_discount NUMERIC(5,2) DEFAULT 0,
  priority_support BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subscription plans"
  ON public.subscription_plans FOR SELECT
  TO authenticated
  USING (true);

-- User subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON public.user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON public.user_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON public.user_subscriptions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Asset price history table
CREATE TABLE IF NOT EXISTS public.asset_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  price NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  market_cap NUMERIC,
  volume_24h NUMERIC
);

ALTER TABLE public.asset_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view asset price history"
  ON public.asset_price_history FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_asset_price_history_symbol_timestamp 
  ON public.asset_price_history(symbol, timestamp DESC);

-- Admin policies
CREATE POLICY "Admins can view all transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all wallets"
ON public.wallets
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_profiles') THEN
    CREATE TRIGGER set_updated_at_profiles
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_wallets') THEN
    CREATE TRIGGER set_updated_at_wallets
      BEFORE UPDATE ON public.wallets
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payment_methods_updated_at') THEN
    CREATE TRIGGER update_payment_methods_updated_at
      BEFORE UPDATE ON public.payment_methods
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.wallets (user_id, asset_code, balance) VALUES
    (new.id, 'EUR', 1000.00),
    (new.id, 'USD', 1000.00),
    (new.id, 'BTC', 0.05),
    (new.id, 'ETH', 1.5),
    (new.id, 'USDT', 500.00),
    (new.id, 'USDC', 500.00)
  ON CONFLICT (user_id, asset_code) DO NOTHING;
  
  RETURN new;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Function to assign default subscription
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
  
  IF standard_plan_id IS NOT NULL THEN
    INSERT INTO public.user_subscriptions (user_id, plan_id, status)
    VALUES (NEW.id, standard_plan_id, 'active')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_subscription') THEN
    CREATE TRIGGER on_auth_user_created_subscription
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user_subscription();
  END IF;
END $$;

-- Insert subscription plans
INSERT INTO public.subscription_plans (name, price, features, trading_fee_discount, withdrawal_fee_discount, priority_support) VALUES
  ('Standard', 0, '{"max_transactions": 10, "basic_support": true}', 0, 0, false),
  ('Premium', 9.99, '{"max_transactions": 50, "advanced_charts": true, "email_support": true}', 10, 5, false),
  ('Ultra', 29.99, '{"max_transactions": 200, "advanced_charts": true, "priority_support": true, "api_access": true}', 25, 15, true),
  ('Deluxe', 99.99, '{"unlimited_transactions": true, "advanced_charts": true, "dedicated_support": true, "api_access": true, "premium_insights": true}', 50, 30, true)
ON CONFLICT (name) DO NOTHING;

-- Insert crypto assets
INSERT INTO trading_assets (symbol, name, asset_type, current_price, price_change_24h, market_cap, volume_24h) VALUES
('BTC', 'Bitcoin', 'crypto', 58423.50, 3.45, 1145000000000, 28500000000),
('ETH', 'Ethereum', 'crypto', 3245.80, 5.23, 389000000000, 15200000000),
('USDT', 'Tether', 'crypto', 1.00, 0.01, 83000000000, 45000000000),
('BNB', 'Binance Coin', 'crypto', 412.35, 2.87, 62000000000, 1200000000),
('SOL', 'Solana', 'crypto', 142.67, 8.92, 59000000000, 2300000000),
('XRP', 'Ripple', 'crypto', 0.5234, -1.45, 27000000000, 1100000000),
('DOGE', 'Dogecoin', 'crypto', 0.0876, 1.23, 12400000000, 580000000),
('ADA', 'Cardano', 'crypto', 0.4523, 3.67, 16000000000, 450000000),
('AVAX', 'Avalanche', 'crypto', 28.45, 6.12, 10000000000, 320000000),
('MATIC', 'Polygon', 'crypto', 0.7234, 4.56, 6700000000, 280000000),
('DOT', 'Polkadot', 'crypto', 5.67, -2.34, 7800000000, 180000000),
('LINK', 'Chainlink', 'crypto', 14.23, 2.89, 7900000000, 420000000),
('UNI', 'Uniswap', 'crypto', 6.78, 7.23, 4100000000, 180000000),
('ATOM', 'Cosmos', 'crypto', 9.23, 4.56, 2800000000, 98000000),
('FIL', 'Filecoin', 'crypto', 4.56, 3.21, 2100000000, 120000000),
('APT', 'Aptos', 'crypto', 8.92, 9.45, 1900000000, 150000000),
('ARB', 'Arbitrum', 'crypto', 1.12, 5.67, 1400000000, 230000000),
('OP', 'Optimism', 'crypto', 1.87, 6.34, 1800000000, 180000000)
ON CONFLICT (symbol) DO NOTHING;

-- Insert stock assets
INSERT INTO trading_assets (symbol, name, asset_type, current_price, price_change_24h, market_cap, volume_24h) VALUES
('AAPL', 'Apple Inc.', 'stock', 178.45, 1.23, 2800000000000, 52000000000),
('MSFT', 'Microsoft Corporation', 'stock', 415.67, 0.87, 3100000000000, 28000000000),
('GOOGL', 'Alphabet Inc.', 'stock', 139.82, 2.34, 1750000000000, 23000000000),
('AMZN', 'Amazon.com Inc.', 'stock', 145.23, -0.56, 1500000000000, 31000000000),
('NVDA', 'NVIDIA Corporation', 'stock', 485.92, 4.67, 1200000000000, 45000000000),
('TSLA', 'Tesla Inc.', 'stock', 245.78, 3.21, 780000000000, 89000000000),
('META', 'Meta Platforms Inc.', 'stock', 312.45, 1.89, 800000000000, 18000000000),
('NFLX', 'Netflix Inc.', 'stock', 456.23, -1.23, 200000000000, 4500000000),
('AMD', 'Advanced Micro Devices', 'stock', 112.34, 5.12, 182000000000, 8900000000),
('INTC', 'Intel Corporation', 'stock', 45.67, -0.45, 187000000000, 7200000000),
('NKE', 'Nike Inc.', 'stock', 98.45, 1.67, 152000000000, 6800000000),
('DIS', 'Walt Disney Company', 'stock', 92.34, 0.98, 168000000000, 8900000000),
('MCD', 'McDonald''s Corporation', 'stock', 289.56, 0.45, 210000000000, 3400000000),
('SBUX', 'Starbucks Corporation', 'stock', 98.76, 1.23, 112000000000, 4200000000),
('COCA', 'Coca-Cola Company', 'stock', 58.92, 0.34, 252000000000, 12000000000),
('PEP', 'PepsiCo Inc.', 'stock', 172.45, 0.67, 237000000000, 4500000000),
('BA', 'Boeing Company', 'stock', 187.23, -1.89, 115000000000, 7800000000),
('JPM', 'JPMorgan Chase & Co.', 'stock', 156.78, 1.45, 448000000000, 11000000000),
('V', 'Visa Inc.', 'stock', 245.89, 0.78, 512000000000, 6700000000),
('MA', 'Mastercard Inc.', 'stock', 389.45, 1.12, 368000000000, 3900000000),
('WMT', 'Walmart Inc.', 'stock', 52.34, 0.89, 412000000000, 8900000000),
('JNJ', 'Johnson & Johnson', 'stock', 156.23, 0.56, 383000000000, 6200000000),
('PG', 'Procter & Gamble', 'stock', 148.92, 0.34, 350000000000, 5100000000),
('UNH', 'UnitedHealth Group', 'stock', 512.67, 1.89, 482000000000, 4300000000),
('HD', 'Home Depot Inc.', 'stock', 312.45, 1.23, 321000000000, 3800000000),
('BAC', 'Bank of America Corp', 'stock', 31.23, 0.67, 245000000000, 42000000000),
('XOM', 'Exxon Mobil Corporation', 'stock', 108.45, -0.89, 452000000000, 18000000000),
('CVX', 'Chevron Corporation', 'stock', 156.78, -0.45, 298000000000, 8900000000)
ON CONFLICT (symbol) DO NOTHING;