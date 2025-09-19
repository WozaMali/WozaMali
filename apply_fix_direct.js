const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyFixDirect() {
  try {
    console.log('🔧 Applying permission fix directly...');
    
    // Update the soft_delete_collection function with new permissions
    const updateFunctionSQL = `
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
    `;

    console.log('⚡ Updating soft_delete_collection function...');
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: updateFunctionSQL 
    });
    
    if (error) {
      console.error('❌ Error updating function:', error);
      return;
    }
    
    console.log('✅ Function updated successfully!');
    
    // Test the fix
    console.log('🧪 Testing the updated function...');
    const { data: testResult, error: testError } = await supabase
      .rpc('soft_delete_collection', {
        p_collection_id: '00000000-0000-0000-0000-000000000000',
        p_deleted_by: '00000000-0000-0000-0000-000000000000',
        p_deletion_reason: 'Test permission check'
      });
    
    if (testError) {
      console.log('⚠️ Test error (expected for dummy ID):', testError.message);
    } else {
      console.log('✅ Test result:', testResult);
    }
    
  } catch (error) {
    console.error('❌ Failed to apply fix:', error);
  }
}

applyFixDirect();
