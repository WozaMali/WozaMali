-- ============================================================================
-- Deleted Transactions Schema
-- Implements soft delete system for transactions in WozaMali
-- When super admin deletes transactions, they are moved here instead of hard deleted
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

-- Create view for super admins to see deleted transactions
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

-- Create RLS policy for the view
CREATE POLICY deleted_transactions_view_super_admin_only ON public.v_deleted_transactions
  FOR SELECT USING (public.has_any_role(ARRAY['super_admin']));

-- ============================================================================
-- Update existing RLS policies to exclude deleted transactions
-- ============================================================================

-- Update unified_collections RLS to exclude soft-deleted records
-- This ensures that deleted transactions don't appear in any queries
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

-- Update the unified_collections view to exclude deleted transactions
-- We'll create a new view that filters out deleted transactions
CREATE OR REPLACE VIEW public.v_active_unified_collections AS
SELECT uc.*
FROM public.unified_collections uc
WHERE NOT public.is_collection_deleted(uc.id);

-- Grant access to the filtered view
GRANT SELECT ON public.v_active_unified_collections TO authenticated;

-- Create RLS policy for the filtered view
CREATE POLICY active_unified_collections_view ON public.v_active_unified_collections
  FOR SELECT USING (
    -- Existing collection access rules
    customer_id = auth.uid() OR 
    collector_id = auth.uid() OR 
    public.has_any_role(ARRAY['office','admin','super_admin'])
  );

-- ============================================================================
-- Migration helper function to move existing deleted records
-- ============================================================================

-- Function to check if a collection was previously hard deleted
-- This can be used to identify records that should be in deleted_transactions
CREATE OR REPLACE FUNCTION public.identify_missing_deleted_records()
RETURNS TABLE(
  collection_id uuid,
  last_activity timestamptz,
  status text
)
LANGUAGE sql
STABLE
AS $$
  -- This would need to be customized based on your audit logs
  -- For now, return empty result
  SELECT NULL::uuid, NULL::timestamptz, NULL::text WHERE false;
$$;

-- ============================================================================
-- Summary
-- ============================================================================
SELECT '✅ Deleted transactions schema created successfully' AS status;
