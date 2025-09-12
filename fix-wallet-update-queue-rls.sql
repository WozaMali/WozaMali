-- Fix for wallet_update_queue RLS policy violation
-- This script addresses the missing wallet_update_queue table issue

-- Option 1: Create the missing wallet_update_queue table if it should exist
-- (Uncomment if this table is needed)

/*
CREATE TABLE IF NOT EXISTS public.wallet_update_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    collection_id UUID,
    resident_email TEXT,
    email TEXT,
    material_name TEXT,
    material TEXT,
    weight_kg DECIMAL(10,2),
    value DECIMAL(10,2),
    status TEXT DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.wallet_update_queue ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies for wallet_update_queue
CREATE POLICY "Allow authenticated users to view wallet_update_queue" ON public.wallet_update_queue
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert wallet_update_queue" ON public.wallet_update_queue
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update wallet_update_queue" ON public.wallet_update_queue
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete wallet_update_queue" ON public.wallet_update_queue
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallet_update_queue_user_id ON public.wallet_update_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_update_queue_collection_id ON public.wallet_update_queue(collection_id);
CREATE INDEX IF NOT EXISTS idx_wallet_update_queue_email ON public.wallet_update_queue(email);
CREATE INDEX IF NOT EXISTS idx_wallet_update_queue_resident_email ON public.wallet_update_queue(resident_email);
*/

-- Option 2: Fix the approve_collection function to handle missing wallet_update_queue gracefully
-- This is the recommended approach since the table seems to be legacy

-- Drop existing functions first to avoid return type conflicts
DROP FUNCTION IF EXISTS public.approve_collection(uuid, uuid, text, uuid);
DROP FUNCTION IF EXISTS public.reject_collection(uuid, uuid, text);

-- Update the approve_collection function to handle missing tables gracefully
CREATE OR REPLACE FUNCTION public.approve_collection(
  p_collection_id uuid,
  p_approver_id uuid,
  p_note text,
  p_idempotency_key uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_collection RECORD;
  v_is_unified boolean := false;
  v_total_amount numeric(12,2) := 0;
  v_total_points numeric := 0; -- points == kg
  v_user_id uuid;
BEGIN
  -- Try unified_collections first
  SELECT * INTO v_collection
  FROM public.unified_collections
  WHERE id = p_collection_id
  FOR UPDATE;

  IF FOUND THEN
    v_is_unified := true;
  ELSE
    -- Fallback to collections
    SELECT * INTO v_collection
    FROM public.collections
    WHERE id = p_collection_id
    FOR UPDATE;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'collection not found';
  END IF;

  IF COALESCE(v_collection.status, 'pending') <> 'pending' AND COALESCE(v_collection.status, 'submitted') <> 'submitted' THEN
    RETURN jsonb_build_object('status','noop','message','already processed');
  END IF;

  -- Determine credited user (customer) robustly across schemas
  IF v_is_unified THEN
    -- unified_collections typically has customer_id and created_by
    v_user_id := COALESCE(v_collection.customer_id, v_collection.created_by);
  ELSE
    -- legacy collections has user_id (customer) and sometimes customer_id
    v_user_id := COALESCE(v_collection.user_id, v_collection.customer_id);
  END IF;

  -- Compute totals from collection_materials with fallback to materials.current_rate
  SELECT 
    COALESCE(SUM(cm.quantity), 0),
    COALESCE(SUM(cm.quantity * COALESCE(cm.unit_price, m.current_rate, 0)), 0)
  INTO v_total_points, v_total_amount
  FROM public.collection_materials cm
  LEFT JOIN public.materials m ON m.id = cm.material_id
  WHERE cm.collection_id = p_collection_id;

  -- Update status on the correct table
  IF v_is_unified THEN
    UPDATE public.unified_collections
    SET status = 'approved', updated_at = now()
    WHERE id = p_collection_id;
  ELSE
    UPDATE public.collections
    SET status = 'approved', updated_at = now()
    WHERE id = p_collection_id;
  END IF;

  -- Approval history (if table exists)
  BEGIN
    INSERT INTO public.collection_approvals(collection_id, approver_id, status_before, status_after, note)
    VALUES (p_collection_id, p_approver_id, v_collection.status, 'approved', p_note);
  EXCEPTION WHEN undefined_table OR insufficient_privilege OR foreign_key_violation THEN
    -- ignore if approvals table is missing, caller lacks permission, or FK targets legacy-only table
    NULL;
  END;

  -- Wallet updates: 1kg = 1 point; only if a user is resolvable
  IF v_user_id IS NOT NULL THEN
    -- Prefer RPC if available; otherwise direct insert/update
    BEGIN
      PERFORM public.update_wallet_simple(p_user_id => v_user_id,
                                          p_amount => v_total_amount,
                                          p_transaction_type => 'collection_approval',
                                          p_weight_kg => v_total_points,
                                          p_description => 'Approved collection',
                                          p_reference_id => p_collection_id);
    EXCEPTION WHEN undefined_function OR undefined_column THEN
      -- Fallback: create a transaction and update wallet summary
      BEGIN
        INSERT INTO public.wallet_transactions(user_id, source_type, source_id, amount, points, description)
        VALUES (v_user_id, 'collection_approval', p_collection_id, v_total_amount, v_total_points::int, 'Approved collection');
      EXCEPTION WHEN unique_violation THEN
        -- duplicate approval of same collection: ignore
        NULL;
      END;

      UPDATE public.wallets w
      SET balance = COALESCE(w.balance,0) + v_total_amount,
          total_points = COALESCE(w.total_points,0) + v_total_points::int,
          updated_at = now()
      WHERE w.user_id = v_user_id;
    END;
  END IF;

  -- Activity log (best effort)
  BEGIN
    INSERT INTO public.activity_log(user_id, entity_type, entity_id, action, metadata)
    VALUES (p_approver_id, 'collection', p_collection_id, 'approved', jsonb_build_object('amount', v_total_amount, 'points', v_total_points));
  EXCEPTION WHEN undefined_table OR insufficient_privilege THEN
    NULL;
  END;

  RETURN jsonb_build_object('status','ok','amount',v_total_amount,'points',v_total_points);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.approve_collection(uuid, uuid, text, uuid) TO authenticated;

-- Also fix the reject_collection function for consistency
CREATE OR REPLACE FUNCTION public.reject_collection(
  p_collection_id uuid,
  p_approver_id uuid,
  p_note text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_collection RECORD;
BEGIN
  -- Try unified_collections first
  SELECT * INTO v_collection
  FROM public.unified_collections
  WHERE id = p_collection_id
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Fallback to collections
    SELECT * INTO v_collection
    FROM public.collections
    WHERE id = p_collection_id
    FOR UPDATE;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'collection not found';
  END IF;

  IF COALESCE(v_collection.status, 'pending') <> 'pending' AND COALESCE(v_collection.status, 'submitted') <> 'submitted' THEN
    RETURN jsonb_build_object('status','noop','message','already processed');
  END IF;

  -- Update status
  IF EXISTS (SELECT 1 FROM public.unified_collections WHERE id = p_collection_id) THEN
    UPDATE public.unified_collections
    SET status = 'rejected', updated_at = now()
    WHERE id = p_collection_id;
  ELSE
    UPDATE public.collections
    SET status = 'rejected', updated_at = now()
    WHERE id = p_collection_id;
  END IF;

  -- Approval history (if table exists)
  BEGIN
    INSERT INTO public.collection_approvals(collection_id, approver_id, status_before, status_after, note)
    VALUES (p_collection_id, p_approver_id, v_collection.status, 'rejected', p_note);
  EXCEPTION WHEN undefined_table OR insufficient_privilege OR foreign_key_violation THEN
    NULL;
  END;

  -- Activity log (best effort)
  BEGIN
    INSERT INTO public.activity_log(user_id, entity_type, entity_id, action, metadata)
    VALUES (p_approver_id, 'collection', p_collection_id, 'rejected', jsonb_build_object('note', p_note));
  EXCEPTION WHEN undefined_table OR insufficient_privilege THEN
    NULL;
  END;

  RETURN jsonb_build_object('status','ok');
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.reject_collection(uuid, uuid, text) TO authenticated;
