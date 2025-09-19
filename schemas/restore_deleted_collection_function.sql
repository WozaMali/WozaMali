-- ============================================================================
-- Restore Deleted Collection Function
-- Allows super admins to restore soft-deleted collections
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
-- Summary
-- ============================================================================
SELECT '✅ Restore deleted collection function created successfully' AS status;
