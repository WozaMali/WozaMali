-- ============================================================================
-- Fixed Soft Delete Implementation for WozaMali
-- This file implements the complete soft delete system for transactions
-- Fixed the RLS policy issue with views
-- ============================================================================

-- ============================================================================
-- 1. Create Deleted Transactions Table
-- ============================================================================

-- Create deleted_transactions table to store soft-deleted transaction data
CREATE TABLE IF NOT EXISTS public.deleted_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_collection_id uuid NOT NULL, -- Original collection ID before deletion
  original_wallet_transaction_id uuid, -- Original wallet transaction ID if exists
  
  -- Collection data (from unified_collections)
  collection_code text,
  status text NOT NULL,
  customer_id uuid,
  collector_id uuid,
  pickup_address_id uuid,
  customer_name text,
  customer_email text,
  collector_name text,
  collector_email text,
  pickup_address text,
  weight_kg numeric(10,2),
  total_weight_kg numeric(10,2),
  computed_value numeric(12,2),
  total_value numeric(12,2),
  admin_notes text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  
  -- Wallet transaction data (if exists)
  wallet_user_id uuid,
  wallet_source_type text,
  wallet_source_id uuid,
  wallet_amount numeric(12,2),
  wallet_points integer,
  wallet_description text,
  wallet_created_at timestamptz,
  
  -- Deletion metadata
  deleted_by uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  deleted_at timestamptz NOT NULL DEFAULT now(),
  deletion_reason text,
  
  -- Additional metadata for audit trail
  original_data jsonb, -- Store complete original record for reference
  deletion_metadata jsonb DEFAULT '{}'::jsonb
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_deleted_transactions_original_collection_id ON public.deleted_transactions(original_collection_id);
CREATE INDEX IF NOT EXISTS idx_deleted_transactions_deleted_by ON public.deleted_transactions(deleted_by);
CREATE INDEX IF NOT EXISTS idx_deleted_transactions_deleted_at ON public.deleted_transactions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_deleted_transactions_customer_id ON public.deleted_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_deleted_transactions_collector_id ON public.deleted_transactions(collector_id);
CREATE INDEX IF NOT EXISTS idx_deleted_transactions_status ON public.deleted_transactions(status);

-- Enable RLS
ALTER TABLE public.deleted_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deleted_transactions
-- Only super_admin can view deleted transactions
DROP POLICY IF EXISTS deleted_transactions_super_admin_only ON public.deleted_transactions;
CREATE POLICY deleted_transactions_super_admin_only ON public.deleted_transactions
  FOR ALL USING (public.has_any_role(ARRAY['super_admin']));

-- ============================================================================
-- 2. Helper Functions
-- ============================================================================

-- Function to check if a collection is deleted
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
-- 3. Soft Delete RPC Function
-- ============================================================================

-- Create RPC function to soft delete a collection and all related data
CREATE OR REPLACE FUNCTION public.soft_delete_collection(
  p_collection_id uuid,
  p_deleted_by uuid,
  p_deletion_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_collection RECORD;
  v_wallet_transaction RECORD;
  v_deleted_id uuid;
  v_original_data jsonb;
BEGIN
  -- Verify the user has super_admin role
  IF NOT public.has_any_role(ARRAY['super_admin']) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  -- Get the collection data
  SELECT * INTO v_collection FROM public.unified_collections WHERE id = p_collection_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Collection not found');
  END IF;

  -- Get wallet transaction data if exists
  SELECT * INTO v_wallet_transaction 
  FROM public.wallet_transactions 
  WHERE source_id = p_collection_id AND source_type = 'collection_approval'
  LIMIT 1;

  -- Prepare original data for audit trail
  v_original_data := jsonb_build_object(
    'unified_collection', row_to_json(v_collection),
    'wallet_transaction', CASE WHEN v_wallet_transaction.id IS NOT NULL THEN row_to_json(v_wallet_transaction) ELSE NULL END
  );

  -- Insert into deleted_transactions table
  INSERT INTO public.deleted_transactions (
    original_collection_id,
    original_wallet_transaction_id,
    collection_code,
    status,
    customer_id,
    collector_id,
    pickup_address_id,
    customer_name,
    customer_email,
    collector_name,
    collector_email,
    pickup_address,
    weight_kg,
    total_weight_kg,
    computed_value,
    total_value,
    admin_notes,
    created_by,
    updated_by,
    created_at,
    updated_at,
    wallet_user_id,
    wallet_source_type,
    wallet_source_id,
    wallet_amount,
    wallet_points,
    wallet_description,
    wallet_created_at,
    deleted_by,
    deletion_reason,
    original_data
  ) VALUES (
    v_collection.id,
    v_wallet_transaction.id,
    v_collection.collection_code,
    v_collection.status,
    v_collection.customer_id,
    v_collection.collector_id,
    v_collection.pickup_address_id,
    v_collection.customer_name,
    v_collection.customer_email,
    v_collection.collector_name,
    v_collection.collector_email,
    v_collection.pickup_address,
    v_collection.weight_kg,
    v_collection.total_weight_kg,
    v_collection.computed_value,
    v_collection.total_value,
    v_collection.admin_notes,
    v_collection.created_by,
    v_collection.updated_by,
    v_collection.created_at,
    v_collection.updated_at,
    v_wallet_transaction.user_id,
    v_wallet_transaction.source_type,
    v_wallet_transaction.source_id,
    v_wallet_transaction.amount,
    v_wallet_transaction.points,
    v_wallet_transaction.description,
    v_wallet_transaction.created_at,
    p_deleted_by,
    p_deletion_reason,
    v_original_data
  ) RETURNING id INTO v_deleted_id;

  -- Now perform the hard delete from all active tables
  -- Delete related records first (children)
  DELETE FROM public.collection_photos WHERE collection_id = p_collection_id;
  DELETE FROM public.collection_materials WHERE collection_id = p_collection_id;
  DELETE FROM public.wallet_update_queue WHERE collection_id = p_collection_id;
  DELETE FROM public.wallet_transactions WHERE source_id = p_collection_id;
  DELETE FROM public.collection_approvals WHERE collection_id = p_collection_id;
  
  -- Delete from main tables
  DELETE FROM public.unified_collections WHERE id = p_collection_id;
  DELETE FROM public.collections WHERE id = p_collection_id;

  -- Log the deletion activity
  INSERT INTO public.activity_log(user_id, entity_type, entity_id, action, metadata)
  VALUES (
    p_deleted_by, 
    'collection', 
    p_collection_id, 
    'soft_deleted', 
    jsonb_build_object(
      'deleted_transaction_id', v_deleted_id,
      'deletion_reason', p_deletion_reason,
      'original_status', v_collection.status,
      'original_value', v_collection.computed_value
    )
  );

  RETURN jsonb_build_object(
    'success', true, 
    'deleted_transaction_id', v_deleted_id,
    'message', 'Collection successfully soft deleted'
  );
END;
$$;

-- Grant execute permission to authenticated users (RLS will control access)
GRANT EXECUTE ON FUNCTION public.soft_delete_collection(uuid, uuid, text) TO authenticated;

-- ============================================================================
-- 4. Restore Function
-- ============================================================================

-- Create RPC function to restore a deleted collection
CREATE OR REPLACE FUNCTION public.restore_deleted_collection(
  p_deleted_transaction_id uuid,
  p_restored_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_record RECORD;
  v_restored_collection_id uuid;
  v_restored_wallet_transaction_id uuid;
BEGIN
  -- Verify the user has super_admin role
  IF NOT public.has_any_role(ARRAY['super_admin']) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  -- Get the deleted transaction data
  SELECT * INTO v_deleted_record 
  FROM public.deleted_transactions 
  WHERE id = p_deleted_transaction_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Deleted transaction not found');
  END IF;

  -- Check if the original collection ID already exists (shouldn't happen, but safety check)
  IF EXISTS (SELECT 1 FROM public.unified_collections WHERE id = v_deleted_record.original_collection_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Collection already exists');
  END IF;

  -- Restore the unified_collections record
  INSERT INTO public.unified_collections (
    id,
    collection_code,
    status,
    customer_id,
    collector_id,
    pickup_address_id,
    customer_name,
    customer_email,
    collector_name,
    collector_email,
    pickup_address,
    weight_kg,
    total_weight_kg,
    computed_value,
    total_value,
    admin_notes,
    created_by,
    updated_by,
    created_at,
    updated_at
  ) VALUES (
    v_deleted_record.original_collection_id,
    v_deleted_record.collection_code,
    v_deleted_record.status,
    v_deleted_record.customer_id,
    v_deleted_record.collector_id,
    v_deleted_record.pickup_address_id,
    v_deleted_record.customer_name,
    v_deleted_record.customer_email,
    v_deleted_record.collector_name,
    v_deleted_record.collector_email,
    v_deleted_record.pickup_address,
    v_deleted_record.weight_kg,
    v_deleted_record.total_weight_kg,
    v_deleted_record.computed_value,
    v_deleted_record.total_value,
    v_deleted_record.admin_notes,
    v_deleted_record.created_by,
    v_deleted_record.updated_by,
    v_deleted_record.created_at,
    v_deleted_record.updated_at
  ) RETURNING id INTO v_restored_collection_id;

  -- Restore the collections record (legacy table)
  INSERT INTO public.collections (
    id,
    user_id,
    collector_id,
    pickup_address_id,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_deleted_record.original_collection_id,
    v_deleted_record.customer_id,
    v_deleted_record.collector_id,
    v_deleted_record.pickup_address_id,
    v_deleted_record.status,
    v_deleted_record.created_at,
    v_deleted_record.updated_at
  );

  -- Restore wallet transaction if it existed
  IF v_deleted_record.original_wallet_transaction_id IS NOT NULL THEN
    INSERT INTO public.wallet_transactions (
      id,
      user_id,
      source_type,
      source_id,
      amount,
      points,
      description,
      created_at
    ) VALUES (
      v_deleted_record.original_wallet_transaction_id,
      v_deleted_record.wallet_user_id,
      v_deleted_record.wallet_source_type,
      v_deleted_record.wallet_source_id,
      v_deleted_record.wallet_amount,
      v_deleted_record.wallet_points,
      v_deleted_record.wallet_description,
      v_deleted_record.wallet_created_at
    ) RETURNING id INTO v_restored_wallet_transaction_id;
  END IF;

  -- Remove from deleted_transactions table
  DELETE FROM public.deleted_transactions WHERE id = p_deleted_transaction_id;

  -- Log the restoration activity
  INSERT INTO public.activity_log(user_id, entity_type, entity_id, action, metadata)
  VALUES (
    p_restored_by, 
    'collection', 
    v_restored_collection_id, 
    'restored_from_deleted', 
    jsonb_build_object(
      'deleted_transaction_id', p_deleted_transaction_id,
      'original_status', v_deleted_record.status,
      'original_value', v_deleted_record.computed_value,
      'restored_wallet_transaction_id', v_restored_wallet_transaction_id
    )
  );

  RETURN jsonb_build_object(
    'success', true, 
    'restored_collection_id', v_restored_collection_id,
    'restored_wallet_transaction_id', v_restored_wallet_transaction_id,
    'message', 'Collection successfully restored'
  );
END;
$$;

-- Grant execute permission to authenticated users (RLS will control access)
GRANT EXECUTE ON FUNCTION public.restore_deleted_collection(uuid, uuid) TO authenticated;

-- ============================================================================
-- 5. Views for Deleted Transactions (No RLS policies on views)
-- ============================================================================

-- Create view for super admins to see deleted transactions
-- Note: We don't create RLS policies on views, access is controlled by the underlying table
CREATE OR REPLACE VIEW public.v_deleted_transactions AS
SELECT 
  dt.id,
  dt.original_collection_id,
  dt.original_wallet_transaction_id,
  dt.collection_code,
  dt.status as original_status,
  dt.customer_name,
  dt.customer_email,
  dt.collector_name,
  dt.collector_email,
  dt.pickup_address,
  dt.weight_kg,
  dt.total_weight_kg,
  dt.computed_value,
  dt.total_value,
  dt.wallet_amount,
  dt.wallet_points,
  dt.deleted_by,
  u.full_name as deleted_by_name,
  u.email as deleted_by_email,
  dt.deleted_at,
  dt.deletion_reason,
  dt.created_at as original_created_at
FROM public.deleted_transactions dt
LEFT JOIN public.users u ON u.id = dt.deleted_by
ORDER BY dt.deleted_at DESC;

-- Grant access to the view for super admins only
GRANT SELECT ON public.v_deleted_transactions TO authenticated;

-- ============================================================================
-- 6. Update Existing Views to Exclude Deleted Transactions
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

-- Create a view that excludes deleted transactions from unified_collections
CREATE OR REPLACE VIEW public.v_active_unified_collections AS
SELECT uc.*
FROM public.unified_collections uc
WHERE NOT public.is_collection_deleted(uc.id);

-- Grant access to the filtered view
GRANT SELECT ON public.v_active_unified_collections TO authenticated;

-- Create a view for active wallet transactions (excluding those from deleted collections)
CREATE OR REPLACE VIEW public.v_active_wallet_transactions AS
SELECT wt.*
FROM public.wallet_transactions wt
WHERE wt.source_id IS NULL 
   OR NOT public.is_collection_deleted(wt.source_id);

-- Grant access to the filtered view
GRANT SELECT ON public.v_active_wallet_transactions TO authenticated;

-- ============================================================================
-- 7. Update RLS Policies to Exclude Deleted Transactions
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
-- 8. Helper Functions for Frontend
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
SELECT '✅ Fixed soft delete system implemented successfully' AS status;
