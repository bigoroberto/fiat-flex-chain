/*
  # Admin Settings e Withdrawal Account
  
  1. Nuove Tabelle
    - `admin_withdrawal_accounts`: Account di prelievo amministrativi per depositi pagamenti
    - `kyc_reviews`: Record di approvazione/disapprovazione KYC manuale
    
  2. Security
    - RLS per accesso solo admin
*/

CREATE TABLE IF NOT EXISTS public.admin_withdrawal_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL CHECK (account_type IN ('stripe', 'paypal', 'bank_transfer', 'crypto_wallet')),
  account_identifier TEXT NOT NULL,
  account_holder_name TEXT,
  is_active BOOLEAN DEFAULT true,
  total_received NUMERIC(20, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_withdrawal_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage withdrawal accounts"
  ON public.admin_withdrawal_accounts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND admin_id = auth.uid());

-- Tabella per tracciare approvazioni/disapprovazioni KYC
CREATE TABLE IF NOT EXISTS public.kyc_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('approved', 'rejected', 'pending')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.kyc_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view KYC reviews"
  ON public.kyc_reviews FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create KYC reviews"
  ON public.kyc_reviews FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND reviewed_by = auth.uid());

CREATE POLICY "Admins can update KYC reviews"
  ON public.kyc_reviews FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_admin_withdrawal_accounts_updated_at
  BEFORE UPDATE ON public.admin_withdrawal_accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
