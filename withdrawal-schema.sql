-- WozaMali Withdrawal Schema (Unified)
-- Idempotent schema for handling withdrawal requests and RLS

-- Create withdrawal_requests table
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  owner_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_type TEXT NOT NULL,
  branch_code TEXT NOT NULL CHECK (branch_code ~ '^[0-9]{3,10}$'),
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 50.00),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled')),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create withdrawal_status_history table for tracking status changes
CREATE TABLE IF NOT EXISTS public.withdrawal_status_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  withdrawal_id UUID REFERENCES public.withdrawal_requests(id) ON DELETE CASCADE NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bank_reference table for standardized bank information
CREATE TABLE IF NOT EXISTS public.bank_reference (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bank_name TEXT UNIQUE NOT NULL,
  bank_code TEXT UNIQUE NOT NULL,
  swift_code TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS withdrawal_requests_read_own
  ON public.withdrawal_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS withdrawal_requests_insert_own
  ON public.withdrawal_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS withdrawal_requests_admin_all
  ON public.withdrawal_requests
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND lower(up.role) IN ('admin','super_admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND lower(up.role) IN ('admin','super_admin')
  ));

CREATE OR REPLACE FUNCTION public.withdrawal_updated_at_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_withdrawal_updated_at ON public.withdrawal_requests;
CREATE TRIGGER set_withdrawal_updated_at
BEFORE UPDATE ON public.withdrawal_requests
FOR EACH ROW EXECUTE FUNCTION public.withdrawal_updated_at_trigger();

-- Insert South African banks
INSERT INTO public.bank_reference (bank_name, bank_code, swift_code) VALUES
  ('ABSA Bank', '632005', 'ABSAZAJJ'),
  ('First National Bank (FNB)', '250655', 'FIRNZAJJ'),
  ('Nedbank', '198765', 'NEDSZAJJ'),
  ('Standard Bank', '051001', 'SBZAZAJJ'),
  ('Capitec Bank', '470010', 'CABLZAJJ'),
  ('African Bank', '430000', 'AFBLZAJJ'),
  ('Bidvest Bank', '462005', 'BIDVZAJJ'),
  ('Discovery Bank', '679000', 'DISCZAJJ'),
  ('Investec Bank', '580105', 'INVESTEC'),
  ('Mercantile Bank', '450105', 'MERCZAJJ'),
  ('Sasfin Bank', '683000', 'SASFZAJJ'),
  ('TymeBank', '678910', 'TYMEZAJJ'),
  ('VBS Mutual Bank', '198765', 'VBSMZAJJ')
ON CONFLICT (bank_name) DO NOTHING;

-- Create account_type_reference table
CREATE TABLE IF NOT EXISTS public.account_type_reference (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type_name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert account types
INSERT INTO public.account_type_reference (type_name, description) VALUES
  ('Savings Account', 'Standard savings account'),
  ('Current Account', 'Regular current/checking account'),
  ('Cheque Account', 'Account with cheque book facility'),
  ('Transmission Account', 'Account for business transactions'),
  ('Investment Account', 'Account for investment purposes')
ON CONFLICT (type_name) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_reference ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_type_reference ENABLE ROW LEVEL SECURITY;

-- RLS Policies for withdrawal_requests
CREATE POLICY "Users can view own withdrawal requests" ON public.withdrawal_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawal requests" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own withdrawal requests" ON public.withdrawal_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin policies for withdrawal management
CREATE POLICY "Admins can view all withdrawal requests" ON public.withdrawal_requests
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update withdrawal status" ON public.withdrawal_requests
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for withdrawal_status_history
CREATE POLICY "Users can view own withdrawal status history" ON public.withdrawal_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.withdrawal_requests 
      WHERE id = withdrawal_status_history.withdrawal_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage withdrawal status history" ON public.withdrawal_status_history
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for reference tables (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view bank reference" ON public.bank_reference
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view account type reference" ON public.account_type_reference
  FOR SELECT USING (auth.role() = 'authenticated');

-- Function to create withdrawal request
CREATE OR REPLACE FUNCTION public.create_withdrawal_request(
  p_owner_name TEXT,
  p_bank_name TEXT,
  p_account_number TEXT,
  p_account_type TEXT,
  p_branch_code TEXT,
  p_amount DECIMAL(10,2)
)
RETURNS UUID AS $$
DECLARE
  v_withdrawal_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Validate amount
  IF p_amount < 100.00 THEN
    RAISE EXCEPTION 'Withdrawal amount must be at least R100.00';
  END IF;
  
  -- Validate branch code format
  IF p_branch_code !~ '^[0-9]{6}$' THEN
    RAISE EXCEPTION 'Branch code must be exactly 6 digits';
  END IF;
  
  -- Check if bank exists
  IF NOT EXISTS (SELECT 1 FROM public.bank_reference WHERE bank_name = p_bank_name AND is_active = TRUE) THEN
    RAISE EXCEPTION 'Invalid bank name';
  END IF;
  
  -- Check if account type exists
  IF NOT EXISTS (SELECT 1 FROM public.account_type_reference WHERE type_name = p_account_type AND is_active = TRUE) THEN
    RAISE EXCEPTION 'Invalid account type';
  END IF;
  
  -- Insert withdrawal request
  INSERT INTO public.withdrawal_requests (
    user_id,
    owner_name,
    bank_name,
    account_number,
    account_type,
    branch_code,
    amount
  ) VALUES (
    v_user_id,
    p_owner_name,
    p_bank_name,
    p_account_number,
    p_account_type,
    p_branch_code,
    p_amount
  ) RETURNING id INTO v_withdrawal_id;
  
  -- Log status change
  INSERT INTO public.withdrawal_status_history (
    withdrawal_id,
    previous_status,
    new_status,
    changed_by
  ) VALUES (
    v_withdrawal_id,
    NULL,
    'pending',
    v_user_id
  );
  
  RETURN v_withdrawal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update withdrawal status
CREATE OR REPLACE FUNCTION public.update_withdrawal_status(
  p_withdrawal_id UUID,
  p_new_status TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_previous_status TEXT;
  v_user_id UUID;
BEGIN
  -- Check if user is admin
  IF auth.jwt() ->> 'role' != 'admin' THEN
    RAISE EXCEPTION 'Only admins can update withdrawal status';
  END IF;
  
  -- Get current status
  SELECT status INTO v_previous_status 
  FROM public.withdrawal_requests 
  WHERE id = p_withdrawal_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal request not found';
  END IF;
  
  -- Update status
  UPDATE public.withdrawal_requests 
  SET 
    status = p_new_status,
    processed_at = CASE WHEN p_new_status IN ('approved', 'processing', 'completed', 'rejected') THEN NOW() ELSE processed_at END,
    processed_by = auth.uid(),
    rejection_reason = CASE WHEN p_new_status = 'rejected' THEN p_reason ELSE rejection_reason END,
    updated_at = NOW()
  WHERE id = p_withdrawal_id;
  
  -- Log status change
  INSERT INTO public.withdrawal_status_history (
    withdrawal_id,
    previous_status,
    new_status,
    changed_by,
    reason
  ) VALUES (
    p_withdrawal_id,
    v_previous_status,
    p_new_status,
    auth.uid(),
    p_reason
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON public.withdrawal_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_withdrawal_status_history_withdrawal_id ON public.withdrawal_status_history(withdrawal_id);

-- Create view for withdrawal requests with user details
CREATE OR REPLACE VIEW public.withdrawal_requests_view AS
SELECT 
  wr.id,
  wr.user_id,
  p.full_name as user_full_name,
  p.email as user_email,
  wr.owner_name,
  wr.bank_name,
  wr.account_number,
  wr.account_type,
  wr.branch_code,
  wr.amount,
  wr.status,
  wr.processed_at,
  wr.processed_by,
  wr.rejection_reason,
  wr.created_at,
  wr.updated_at
FROM public.withdrawal_requests wr
JOIN public.profiles p ON wr.user_id = p.id;

-- Grant necessary permissions
GRANT SELECT ON public.withdrawal_requests_view TO authenticated;
GRANT SELECT ON public.bank_reference TO authenticated;
GRANT SELECT ON public.account_type_reference TO authenticated;
GRANT ALL ON public.withdrawal_requests TO authenticated;
GRANT ALL ON public.withdrawal_status_history TO authenticated;
