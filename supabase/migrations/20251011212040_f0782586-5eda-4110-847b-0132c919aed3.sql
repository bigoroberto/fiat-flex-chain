-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
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

-- RLS policies for user_roles
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

-- Add KYC fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS document_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS document_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT false;

-- Payment methods table
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  method_type TEXT NOT NULL CHECK (method_type IN ('card', 'bank_account', 'paypal', 'google_pay')),
  last_four TEXT,
  holder_name TEXT,
  iban TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own payment methods"
ON public.payment_methods
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trading assets table
CREATE TABLE public.trading_assets (
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

-- Insert demo trading assets
INSERT INTO public.trading_assets (symbol, name, asset_type, current_price, price_change_24h, market_cap, volume_24h) VALUES
('BTC', 'Bitcoin', 'crypto', 65000.00, 2.5, 1200000000000, 35000000000),
('ETH', 'Ethereum', 'crypto', 3500.00, 3.2, 420000000000, 18000000000),
('AAPL', 'Apple Inc.', 'stock', 178.50, 1.8, 2800000000000, 85000000000),
('TSLA', 'Tesla Inc.', 'stock', 242.80, -1.2, 770000000000, 32000000000),
('GOOGL', 'Alphabet Inc.', 'stock', 142.30, 2.1, 1800000000000, 28000000000),
('MSFT', 'Microsoft Corp.', 'stock', 378.90, 1.5, 2820000000000, 31000000000),
('NVDA', 'NVIDIA Corp.', 'stock', 495.20, 4.7, 1220000000000, 45000000000),
('META', 'Meta Platforms', 'stock', 325.40, -0.8, 825000000000, 19000000000),
('AMZN', 'Amazon.com Inc.', 'stock', 145.60, 1.3, 1510000000000, 42000000000),
('NFLX', 'Netflix Inc.', 'stock', 485.30, 2.9, 215000000000, 8500000000),
('NIKE', 'Nike Inc.', 'stock', 108.70, -2.1, 168000000000, 6200000000),
('SOL', 'Solana', 'crypto', 145.80, 5.3, 65000000000, 2800000000),
('ADA', 'Cardano', 'crypto', 0.58, 1.9, 20500000000, 680000000),
('DOGE', 'Dogecoin', 'crypto', 0.12, -0.5, 17000000000, 920000000);

-- Trigger for payment methods updated_at
CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Update transactions RLS to allow admin access
CREATE POLICY "Admins can view all transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update wallets RLS to allow admin access
CREATE POLICY "Admins can view all wallets"
ON public.wallets
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update profiles RLS to allow admin access
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));