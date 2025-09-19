-- Complete fix for soft delete functionality
-- This includes both RPC function update and role permissions

-- 1. Update the soft_delete_collection function to allow admin role
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
  v_table_exists boolean := false;
  v_customer_id uuid;
  v_created_by_id uuid;
  v_updated_by_id uuid;
BEGIN
  -- Verify the user has admin or super_admin role
  IF NOT public.has_any_role(ARRAY['admin', 'super_admin']) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  -- Check if unified_collections table exists and has data
  BEGIN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'unified_collections'
    ) INTO v_table_exists;
    
    IF v_table_exists THEN
      SELECT * INTO v_collection FROM public.unified_collections WHERE id = p_collection_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_table_exists := false;
  END;

  -- If not found in unified_collections, try collections table
  IF NOT FOUND OR NOT v_table_exists THEN
    SELECT * INTO v_collection FROM public.collections WHERE id = p_collection_id;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Collection not found');
    END IF;
  END IF;

  -- Get wallet transaction data if exists
  SELECT * INTO v_wallet_transaction 
  FROM public.wallet_transactions 
  WHERE source_id = p_collection_id AND source_type = 'collection_approval'
  LIMIT 1;

  -- Determine customer_id based on table structure
  IF v_table_exists THEN
    -- unified_collections table structure
    v_customer_id := v_collection.customer_id;
    v_created_by_id := v_collection.created_by;
    v_updated_by_id := v_collection.updated_by;
  ELSE
    -- collections table structure  
    v_customer_id := v_collection.user_id;
    v_created_by_id := v_collection.user_id;
    v_updated_by_id := v_collection.user_id;
  END IF;

  -- Prepare original data for audit trail
  v_original_data := jsonb_build_object(
    'collection', row_to_json(v_collection),
    'wallet_transaction', CASE WHEN v_wallet_transaction.id IS NOT NULL THEN row_to_json(v_wallet_transaction) ELSE NULL END,
    'source_table', CASE WHEN v_table_exists THEN 'unified_collections' ELSE 'collections' END
  );

  -- Insert into deleted_transactions table (simplified version)
  INSERT INTO public.deleted_transactions (
    original_collection_id,
    collection_code,
    status,
    customer_id,
    collector_id,
    weight_kg,
    total_value,
    deleted_by,
    deletion_reason,
    original_data,
    created_at,
    updated_at
  ) VALUES (
    v_collection.id,
    COALESCE(v_collection.collection_code, ''),
    v_collection.status,
    v_customer_id,
    v_collection.collector_id,
    COALESCE(v_collection.total_weight_kg, 0),
    COALESCE(v_collection.total_value, 0),
    p_deleted_by,
    p_deletion_reason,
    v_original_data,
    NOW(),
    NOW()
  ) RETURNING id INTO v_deleted_id;

  -- Delete from the original table
  IF v_table_exists THEN
    DELETE FROM public.unified_collections WHERE id = p_collection_id;
  ELSE
    DELETE FROM public.collections WHERE id = p_collection_id;
  END IF;

  -- Delete related wallet transaction if exists
  IF v_wallet_transaction.id IS NOT NULL THEN
    DELETE FROM public.wallet_transactions WHERE id = v_wallet_transaction.id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Collection successfully moved to deleted transactions',
    'deleted_transaction_id', v_deleted_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- 2. Ensure the current user has admin role
INSERT INTO public.user_roles (user_id, role) 
SELECT auth.uid(), 'admin'
WHERE auth.uid() IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );

-- 3. Grant execute permission
GRANT EXECUTE ON FUNCTION public.soft_delete_collection(uuid, uuid, text) TO authenticated;

-- 4. Test the function
SELECT 
  u.id as user_id,
  u.email,
  array_agg(ur.role) as roles,
  bool_or(ur.role IN ('admin', 'super_admin')) as has_admin_role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.id = auth.uid()
GROUP BY u.id, u.email;

SELECT 'Soft delete functionality fixed and admin role assigned!' as result;
