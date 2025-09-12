-- Corrected SQL for Supabase SQL Editor
-- Create withdrawal_requests table

CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  owner_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_type TEXT NOT NULL,
  branch_code TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 50.00),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled')),
  payout_method TEXT DEFAULT 'bank_transfer' CHECK (payout_method IN ('wallet', 'cash', 'bank_transfer', 'mobile_money')),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests(status);

-- Enable Row Level Security
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS withdrawal_requests_read_own ON public.withdrawal_requests;
DROP POLICY IF EXISTS withdrawal_requests_insert_own ON public.withdrawal_requests;
DROP POLICY IF EXISTS withdrawal_requests_read_admin ON public.withdrawal_requests;
DROP POLICY IF EXISTS withdrawal_requests_update_admin ON public.withdrawal_requests;

-- Create RLS policies (without IF NOT EXISTS)
CREATE POLICY withdrawal_requests_read_own
  ON public.withdrawal_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY withdrawal_requests_insert_own
  ON public.withdrawal_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.withdrawal_requests TO authenticated;
