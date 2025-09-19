-- ============================================================================
-- Update RLS Policies for Soft Delete System
-- This ensures deleted transactions are excluded from all queries
-- ============================================================================

-- First, let's create a helper function to check if a collection is deleted
CREATE OR REPLACE FUNCTION public.is_collection_deleted(p_collection_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.deleted_transactions 
    WHERE original_collection_id = p_collection_id
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_collection_deleted(uuid) TO authenticated;

-- ============================================================================
-- Update existing views to exclude deleted transactions
-- ============================================================================

-- Update the office approval queue view to exclude deleted collections
DROP VIEW IF EXISTS public.v_office_approval_queue;
CREATE VIEW public.v_office_approval_queue AS
SELECT c.id AS collection_id,
       c.created_at,
       c.user_id,
       u.email AS customer_email,
       c.collector_id,
       c.status
FROM public.collections c
LEFT JOIN public.users u ON u.id = c.user_id
WHERE c.status = 'pending'
  AND NOT public.is_collection_deleted(c.id)
ORDER BY c.created_at DESC;

-- Update customer fund summary to exclude deleted transactions
DROP VIEW IF EXISTS public.v_customer_fund;
CREATE VIEW public.v_customer_fund AS
SELECT
  u.id AS user_id,
  u.full_name,
  COALESCE(SUM(CASE WHEN ft.fund_name = 'green_scholar' THEN ft.amount ELSE 0 END), 0) AS total_contributed
FROM public.users u
LEFT JOIN public.fund_transactions ft ON ft.user_id = u.id
  AND NOT EXISTS (
    SELECT 1 FROM public.deleted_transactions dt 
    WHERE dt.original_collection_id = ft.source_id
  )
GROUP BY u.id, u.full_name;

-- ============================================================================
-- Create filtered views for unified collections
-- ============================================================================

-- Create a view that excludes deleted transactions from unified_collections
CREATE OR REPLACE VIEW public.v_active_unified_collections AS
SELECT uc.*
FROM public.unified_collections uc
WHERE NOT public.is_collection_deleted(uc.id);

-- Grant access to the filtered view
GRANT SELECT ON public.v_active_unified_collections TO authenticated;

-- Create RLS policy for the filtered view
DROP POLICY IF EXISTS active_unified_collections_view ON public.v_active_unified_collections;
CREATE POLICY active_unified_collections_view ON public.v_active_unified_collections
  FOR SELECT USING (
    -- Existing collection access rules
    customer_id = auth.uid() OR 
    collector_id = auth.uid() OR 
    public.has_any_role(ARRAY['office','admin','super_admin'])
  );

-- ============================================================================
-- Update wallet transactions to exclude deleted collections
-- ============================================================================

-- Create a view for active wallet transactions (excluding those from deleted collections)
CREATE OR REPLACE VIEW public.v_active_wallet_transactions AS
SELECT wt.*
FROM public.wallet_transactions wt
WHERE wt.source_id IS NULL 
   OR NOT public.is_collection_deleted(wt.source_id);

-- Grant access to the filtered view
GRANT SELECT ON public.v_active_wallet_transactions TO authenticated;

-- Create RLS policy for the filtered view
DROP POLICY IF EXISTS active_wallet_transactions_view ON public.v_active_wallet_transactions;
CREATE POLICY active_wallet_transactions_view ON public.v_active_wallet_transactions
  FOR SELECT USING (
    user_id = auth.uid() OR 
    public.has_any_role(ARRAY['office','admin','super_admin'])
  );

-- ============================================================================
-- Update existing RLS policies to use filtered views
-- ============================================================================

-- Update the collections RLS policy to exclude deleted collections
DROP POLICY IF EXISTS collections_owner_select ON public.collections;
DROP POLICY IF EXISTS collections_collector_select ON public.collections;
DROP POLICY IF EXISTS collections_admin_select ON public.collections;

CREATE POLICY collections_owner_select ON public.collections 
  FOR SELECT USING (
    user_id = auth.uid() AND NOT public.is_collection_deleted(id)
  );

CREATE POLICY collections_collector_select ON public.collections 
  FOR SELECT USING (
    collector_id = auth.uid() AND NOT public.is_collection_deleted(id)
  );

CREATE POLICY collections_admin_select ON public.collections 
  FOR SELECT USING (
    public.has_any_role(ARRAY['office','admin','super_admin']) AND NOT public.is_collection_deleted(id)
  );

-- Update pickup items policy to exclude deleted collections
DROP POLICY IF EXISTS pickup_items_view ON public.pickup_items;
CREATE POLICY pickup_items_view ON public.pickup_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.collections c
    WHERE c.id = pickup_id 
      AND NOT public.is_collection_deleted(c.id)
      AND (
        c.user_id = auth.uid() OR 
        c.collector_id = auth.uid() OR 
        public.has_any_role(ARRAY['office','admin','super_admin'])
      )
  )
);

-- Update wallet transactions policy to exclude deleted collections
DROP POLICY IF EXISTS wallet_tx_owner_select ON public.wallet_transactions;
CREATE POLICY wallet_tx_owner_select ON public.wallet_transactions 
  FOR SELECT USING (
    (user_id = auth.uid() OR public.has_any_role(ARRAY['office','admin','super_admin']))
    AND (source_id IS NULL OR NOT public.is_collection_deleted(source_id))
  );

-- ============================================================================
-- Create helper functions for the frontend
-- ============================================================================

-- Function to get active collections (excluding deleted)
CREATE OR REPLACE FUNCTION public.get_active_collections()
RETURNS TABLE(
  id uuid,
  collection_code text,
  status text,
  customer_id uuid,
  collector_id uuid,
  customer_name text,
  customer_email text,
  collector_name text,
  collector_email text,
  pickup_address text,
  weight_kg numeric,
  total_weight_kg numeric,
  computed_value numeric,
  total_value numeric,
  admin_notes text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    uc.id,
    uc.collection_code,
    uc.status,
    uc.customer_id,
    uc.collector_id,
    uc.customer_name,
    uc.customer_email,
    uc.collector_name,
    uc.collector_email,
    uc.pickup_address,
    uc.weight_kg,
    uc.total_weight_kg,
    uc.computed_value,
    uc.total_value,
    uc.admin_notes,
    uc.created_at,
    uc.updated_at
  FROM public.unified_collections uc
  WHERE NOT public.is_collection_deleted(uc.id)
  ORDER BY uc.created_at DESC;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_active_collections() TO authenticated;

-- Function to get active wallet transactions (excluding deleted collections)
CREATE OR REPLACE FUNCTION public.get_active_wallet_transactions()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  source_type text,
  source_id uuid,
  amount numeric,
  points integer,
  description text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    wt.id,
    wt.user_id,
    wt.source_type,
    wt.source_id,
    wt.amount,
    wt.points,
    wt.description,
    wt.created_at
  FROM public.wallet_transactions wt
  WHERE wt.source_id IS NULL OR NOT public.is_collection_deleted(wt.source_id)
  ORDER BY wt.created_at DESC;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_active_wallet_transactions() TO authenticated;

-- ============================================================================
-- Summary
-- ============================================================================
SELECT '✅ RLS policies updated for soft delete system' AS status;
