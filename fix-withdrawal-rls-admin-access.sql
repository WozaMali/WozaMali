-- Fix RLS permissions for withdrawal_requests table
-- Allow admin users to access all withdrawal requests

-- Ensure required extension exists for UUID generation (if needed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, check if the table exists and has RLS enabled
DO $$
BEGIN
    -- Enable RLS if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' 
        AND c.relname = 'withdrawal_requests'
        AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can update withdrawal status" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admin full access to withdrawal_requests" ON public.withdrawal_requests;

-- Create safe helper: determine role from user_profiles or profiles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_user_role'
  ) THEN
    CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID DEFAULT auth.uid())
    RETURNS TEXT AS $fn$
    DECLARE r TEXT;
    BEGIN
      -- Try unified user_profiles first
      SELECT role INTO r FROM public.user_profiles WHERE user_id = user_uuid LIMIT 1;
      IF r IS NOT NULL THEN RETURN r; END IF;
      -- Fallback to legacy profiles
      SELECT role INTO r FROM public.profiles WHERE id = user_uuid LIMIT 1;
      RETURN r;
    END;
    $fn$ LANGUAGE plpgsql SECURITY DEFINER;
  END IF;
END $$;

-- Admin full access policy using helper
CREATE POLICY "Admin full access to withdrawal_requests" ON public.withdrawal_requests
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- Also create a specific policy for office users if they have a different role
DROP POLICY IF EXISTS "Office users can view all withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Office users can manage withdrawal requests" ON public.withdrawal_requests
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin','office','office_staff','staff'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin','office','office_staff','staff'));

-- Grant necessary permissions
GRANT ALL ON public.withdrawal_requests TO authenticated;

-- Create a view for easier access if needed
CREATE OR REPLACE VIEW public.withdrawal_requests_admin_view AS
SELECT 
    wr.*,
    p.full_name as user_full_name,
    p.email as user_email,
    p.phone as user_phone
FROM public.withdrawal_requests wr
LEFT JOIN public.profiles p ON wr.user_id = p.id;

-- Grant access to the view
GRANT SELECT ON public.withdrawal_requests_admin_view TO authenticated;

-- Create status history table if it doesn't exist, then enable RLS and grant
CREATE TABLE IF NOT EXISTS public.withdrawal_status_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  withdrawal_id UUID REFERENCES public.withdrawal_requests(id) ON DELETE CASCADE NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.withdrawal_status_history ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.withdrawal_status_history TO authenticated;

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'withdrawal_requests'
ORDER BY policyname;

-- Ensure payout_method column exists for Office payout choice
ALTER TABLE public.withdrawal_requests
  ADD COLUMN IF NOT EXISTS payout_method text
  CHECK (payout_method IN ('wallet','cash','bank_transfer','mobile_money'));
