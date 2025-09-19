-- ============================================================================
-- Fix Soft Delete Permissions
-- Update soft delete functions to allow admin, office, and super_admin roles
-- ============================================================================

-- Update soft_delete_collection function to allow all admin roles
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
BEGIN
  -- Verify the user has admin, office, or super_admin role
  IF NOT public.has_any_role(ARRAY['admin', 'office', 'super_admin']) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions. Admin, office, or super_admin role required.');
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

  -- Prepare original data for audit trail
  v_original_data := jsonb_build_object(
    'collection', row_to_json(v_collection),
    'wallet_transaction', CASE WHEN v_wallet_transaction.id IS NOT NULL THEN row_to_json(v_wallet_transaction) ELSE NULL END,
    'source_table', CASE WHEN v_table_exists THEN 'unified_collections' ELSE 'collections' END
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
    COALESCE(v_collection.collection_code, ''),
    v_collection.status,
    COALESCE(v_collection.customer_id, v_collection.user_id),
    v_collection.collector_id,
    v_collection.pickup_address_id,
    COALESCE(v_collection.customer_name, ''),
    COALESCE(v_collection.customer_email, ''),
    COALESCE(v_collection.collector_name, ''),
    COALESCE(v_collection.collector_email, ''),
    COALESCE(v_collection.pickup_address, ''),
    COALESCE(v_collection.weight_kg, 0),
    COALESCE(v_collection.total_weight_kg, 0),
    COALESCE(v_collection.computed_value, 0),
    COALESCE(v_collection.total_value, 0),
    COALESCE(v_collection.admin_notes, ''),
    COALESCE(v_collection.created_by, v_collection.user_id),
    COALESCE(v_collection.updated_by, v_collection.user_id),
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
  
  -- Delete from main tables (try both)
  IF v_table_exists THEN
    DELETE FROM public.unified_collections WHERE id = p_collection_id;
  END IF;
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
      'original_value', COALESCE(v_collection.computed_value, v_collection.total_value, 0),
      'source_table', CASE WHEN v_table_exists THEN 'unified_collections' ELSE 'collections' END
    )
  );

  RETURN jsonb_build_object(
    'success', true, 
    'deleted_transaction_id', v_deleted_id,
    'message', 'Collection successfully soft deleted'
  );
END;
$$;

-- Update restore_deleted_collection function to allow all admin roles
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
  v_table_exists boolean := false;
  v_source_table text;
BEGIN
  -- Verify the user has admin, office, or super_admin role
  IF NOT public.has_any_role(ARRAY['admin', 'office', 'super_admin']) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions. Admin, office, or super_admin role required.');
  END IF;

  -- Get the deleted transaction data
  SELECT * INTO v_deleted_record 
  FROM public.deleted_transactions 
  WHERE id = p_deleted_transaction_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Deleted transaction not found');
  END IF;

  -- Determine source table from original_data
  v_source_table := COALESCE(v_deleted_record.original_data->>'source_table', 'collections');

  -- Check if the original collection ID already exists (shouldn't happen, but safety check)
  IF EXISTS (SELECT 1 FROM public.collections WHERE id = v_deleted_record.original_collection_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Collection already exists');
  END IF;

  -- Check if unified_collections table exists
  BEGIN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'unified_collections'
    ) INTO v_table_exists;
  EXCEPTION WHEN OTHERS THEN
    v_table_exists := false;
  END;

  -- Restore the collections record (legacy table) - always restore this
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
  ) RETURNING id INTO v_restored_collection_id;

  -- Restore unified_collections record if table exists and was the original source
  IF v_table_exists AND v_source_table = 'unified_collections' THEN
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
    );
  END IF;

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
      'restored_wallet_transaction_id', v_restored_wallet_transaction_id,
      'source_table', v_source_table
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

-- Update RLS policy for deleted_transactions to allow all admin roles
DROP POLICY IF EXISTS deleted_transactions_super_admin_only ON public.deleted_transactions;
CREATE POLICY deleted_transactions_admin_only ON public.deleted_transactions
  FOR ALL USING (public.has_any_role(ARRAY['admin', 'office', 'super_admin']));

-- ============================================================================
-- Summary
-- ============================================================================
SELECT '✅ Soft delete permissions fixed - now allows admin, office, and super_admin roles' AS status;
