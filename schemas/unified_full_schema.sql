-- ============================================================================
-- WozaMali Unified Schema (Consolidated)
-- Safe to run multiple times (idempotent). Creates tables, RLS, helper, RPCs,
-- views, and seeds roles/materials/rates. Designed for Supabase.
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Core Reference Tables
-- ============================================================================

-- Roles
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Users (keeps role_id as text for compatibility; can store UUID or role name)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY,
  email text UNIQUE,
  full_name text,
  phone text,
  role_id text DEFAULT 'member',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Materials
CREATE TABLE IF NOT EXISTS public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text,
  unit text NOT NULL DEFAULT 'kg',
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Versioned material rates
CREATE TABLE IF NOT EXISTS public.material_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  rate_per_kg numeric(10,2) NOT NULL,
  points_per_kg numeric(10,2) NOT NULL DEFAULT 0,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_material_rates_material_from ON public.material_rates (material_id, effective_from DESC);

-- Collections and pickup items
CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  collector_id uuid,
  pickup_address_id uuid,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pickup_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  material_id uuid REFERENCES public.materials(id) ON DELETE SET NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 0, -- kg
  unit_price numeric(10,2) NOT NULL DEFAULT 0, -- optional baseline
  total_price numeric(12,2) NOT NULL DEFAULT 0,
  -- snapshot fields to freeze pricing at approval time if needed
  unit_price_applied numeric(10,2),
  points_per_kg_applied numeric(10,2),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- Addresses (Unified for all apps)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.address_townships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  township_name text NOT NULL,
  city text NOT NULL,
  postal_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ux_address_townships_name UNIQUE (township_name)
);

CREATE TABLE IF NOT EXISTS public.address_subdivisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id uuid NOT NULL REFERENCES public.address_townships(id) ON DELETE CASCADE,
  subdivision text NOT NULL,
  township_name text,
  postal_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ux_address_subdivisions_area_sub UNIQUE (area_id, subdivision)
);
CREATE INDEX IF NOT EXISTS ix_address_subdivisions_area ON public.address_subdivisions(area_id);

-- Wallet summary and immutable wallet ledger
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  balance numeric(12,2) NOT NULL DEFAULT 0,
  total_points integer NOT NULL DEFAULT 0,
  tier text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('collection_approval','adjustment','payout')),
  source_id uuid NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_wallet_tx_source ON public.wallet_transactions (source_type, source_id) WHERE source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_wallet_tx_user_created ON public.wallet_transactions (user_id, created_at DESC);

-- Green Scholar Fund summary and immutable fund ledger
CREATE TABLE IF NOT EXISTS public.fund_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_name text NOT NULL UNIQUE,
  balance numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fund_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  fund_name text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('collection_approval','adjustment')),
  source_id uuid,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_fund_tx_fund_created ON public.fund_transactions (fund_name, created_at DESC);

-- Approvals and activity log
CREATE TABLE IF NOT EXISTS public.collection_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  approver_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  status_before text NOT NULL,
  status_after text NOT NULL CHECK (status_after IN ('approved','rejected')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_collection_approvals_collection_created ON public.collection_approvals (collection_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_activity_log_entity ON public.activity_log (entity_type, entity_id, created_at DESC);

-- ============================================================================
-- RLS Helper Function (supports users.role_id as UUID or role name text)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.has_any_role(required_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    LEFT JOIN public.roles r
      ON (r.id::text = u.role_id::text OR r.name = u.role_id::text)
    WHERE u.id = auth.uid()
      AND (
        (r.name IS NOT NULL AND r.name = ANY(required_roles))
        OR (u.role_id::text = ANY(required_roles))
      )
  );
$$;
GRANT EXECUTE ON FUNCTION public.has_any_role(text[]) TO anon, authenticated;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.address_townships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.address_subdivisions ENABLE ROW LEVEL SECURITY;

-- Users
DROP POLICY IF EXISTS users_self_select ON public.users;
DROP POLICY IF EXISTS users_admin_select ON public.users;
DROP POLICY IF EXISTS users_self_update ON public.users;
DROP POLICY IF EXISTS users_admin_update ON public.users;
DROP POLICY IF EXISTS users_insert_self ON public.users;

CREATE POLICY users_self_select ON public.users FOR SELECT USING (id = auth.uid());
CREATE POLICY users_admin_select ON public.users FOR SELECT USING (public.has_any_role(ARRAY['admin','super_admin','office']));
CREATE POLICY users_self_update ON public.users FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY users_admin_update ON public.users FOR UPDATE USING (public.has_any_role(ARRAY['admin','super_admin'])) WITH CHECK (public.has_any_role(ARRAY['admin','super_admin']));
CREATE POLICY users_insert_self ON public.users FOR INSERT WITH CHECK (id = auth.uid());

-- Roles
DROP POLICY IF EXISTS roles_admin_select ON public.roles;
CREATE POLICY roles_admin_select ON public.roles FOR SELECT USING (public.has_any_role(ARRAY['admin','super_admin']));

-- Collections
DROP POLICY IF EXISTS collections_owner_select ON public.collections;
DROP POLICY IF EXISTS collections_collector_select ON public.collections;
DROP POLICY IF EXISTS collections_admin_select ON public.collections;
CREATE POLICY collections_owner_select ON public.collections FOR SELECT USING (user_id = auth.uid());
CREATE POLICY collections_collector_select ON public.collections FOR SELECT USING (collector_id = auth.uid());
CREATE POLICY collections_admin_select ON public.collections FOR SELECT USING (public.has_any_role(ARRAY['office','admin','super_admin']));

-- Pickup items (visible if user can view the collection)
DROP POLICY IF EXISTS pickup_items_view ON public.pickup_items;
CREATE POLICY pickup_items_view ON public.pickup_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.collections c
    WHERE c.id = pickup_id AND (
      c.user_id = auth.uid() OR c.collector_id = auth.uid() OR public.has_any_role(ARRAY['office','admin','super_admin'])
    )
  )
);

-- Material rates
DROP POLICY IF EXISTS mat_rates_office_read ON public.material_rates;
DROP POLICY IF EXISTS mat_rates_office_write ON public.material_rates;
CREATE POLICY mat_rates_office_read ON public.material_rates FOR SELECT USING (public.has_any_role(ARRAY['collector','office','admin','super_admin']));
CREATE POLICY mat_rates_office_write ON public.material_rates FOR ALL USING (public.has_any_role(ARRAY['office','admin','super_admin'])) WITH CHECK (public.has_any_role(ARRAY['office','admin','super_admin']));

-- Wallet transactions (owner read)
DROP POLICY IF EXISTS wallet_tx_owner_select ON public.wallet_transactions;
CREATE POLICY wallet_tx_owner_select ON public.wallet_transactions FOR SELECT USING (user_id = auth.uid() OR public.has_any_role(ARRAY['office','admin','super_admin']));

-- Approvals (office/admin)
DROP POLICY IF EXISTS approvals_office_read ON public.collection_approvals;
DROP POLICY IF EXISTS approvals_office_write ON public.collection_approvals;
DROP POLICY IF EXISTS approvals_office_insert ON public.collection_approvals;
CREATE POLICY approvals_office_read ON public.collection_approvals FOR SELECT USING (public.has_any_role(ARRAY['office','admin','super_admin']));
-- INSERT policies must not specify USING; use WITH CHECK only
CREATE POLICY approvals_office_insert ON public.collection_approvals FOR INSERT WITH CHECK (public.has_any_role(ARRAY['office','admin','super_admin']));

-- Activity log (owner or office/admin)
DROP POLICY IF EXISTS activity_read_related ON public.activity_log;
CREATE POLICY activity_read_related ON public.activity_log FOR SELECT USING (
  public.has_any_role(ARRAY['office','admin','super_admin']) OR user_id = auth.uid()
);

-- Fund tables (admin/super_admin read; insert via RPC)
DROP POLICY IF EXISTS fund_bal_admin_read ON public.fund_balances;
DROP POLICY IF EXISTS fund_tx_admin_read ON public.fund_transactions;
CREATE POLICY fund_bal_admin_read ON public.fund_balances FOR SELECT USING (public.has_any_role(ARRAY['admin','super_admin']));
CREATE POLICY fund_tx_admin_read ON public.fund_transactions FOR SELECT USING (
  public.has_any_role(ARRAY['admin','super_admin']) OR user_id = auth.uid()
);

-- Address tables (public read)
DROP POLICY IF EXISTS address_townships_read_all ON public.address_townships;
DROP POLICY IF EXISTS address_subdivisions_read_all ON public.address_subdivisions;
CREATE POLICY address_townships_read_all ON public.address_townships FOR SELECT USING (true);
CREATE POLICY address_subdivisions_read_all ON public.address_subdivisions FOR SELECT USING (true);

-- ============================================================================
-- RPCs: Approve / Reject Collection (with PET fund split)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.approve_collection(
  p_collection_id uuid,
  p_approver_id uuid,
  p_note text,
  p_idempotency_key uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_collection RECORD;
  v_user_id uuid;
  v_wallet_amount numeric(12,2) := 0;
  v_fund_amount numeric(12,2) := 0;
  v_total_points integer := 0;
  v_pet_material_id uuid;
BEGIN
  -- Lock collection
  SELECT * INTO v_collection FROM public.collections WHERE id = p_collection_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'collection not found'; END IF;
  IF v_collection.status <> 'pending' THEN
    RETURN jsonb_build_object('status','noop','message','already processed');
  END IF;

  v_user_id := v_collection.user_id;

  -- Find PET Bottles material id if exists
  SELECT id INTO v_pet_material_id FROM public.materials WHERE lower(name) = 'pet bottles' LIMIT 1;

  -- Compute wallet/fund amounts and points
  WITH priced AS (
    SELECT
      pi.material_id,
      pi.quantity,
      COALESCE(pi.unit_price_applied,
        (
          SELECT mr.rate_per_kg
          FROM public.material_rates mr
          WHERE mr.material_id = pi.material_id
            AND (mr.effective_to IS NULL OR now() BETWEEN mr.effective_from AND COALESCE(mr.effective_to, now()))
          ORDER BY mr.effective_from DESC
          LIMIT 1
        ),
        0
      ) AS rate_used,
      COALESCE(pi.points_per_kg_applied,
        (
          SELECT mr.points_per_kg
          FROM public.material_rates mr
          WHERE mr.material_id = pi.material_id
            AND (mr.effective_to IS NULL OR now() BETWEEN mr.effective_from AND COALESCE(mr.effective_to, now()))
          ORDER BY mr.effective_from DESC
          LIMIT 1
        ),
        0
      ) AS points_used
    FROM public.pickup_items pi
    WHERE pi.pickup_id = p_collection_id
  )
  SELECT
    COALESCE(SUM(CASE WHEN priced.material_id = v_pet_material_id THEN 0 ELSE priced.rate_used * priced.quantity END), 0),
    COALESCE(SUM(CASE WHEN priced.material_id = v_pet_material_id THEN priced.rate_used * priced.quantity ELSE 0 END), 0),
    COALESCE(SUM((priced.points_used * priced.quantity)::int), 0)
  INTO v_wallet_amount, v_fund_amount, v_total_points
  FROM priced;

  -- Update collection status
  UPDATE public.collections SET status = 'approved', updated_at = now() WHERE id = p_collection_id;

  -- Approval record
  INSERT INTO public.collection_approvals(collection_id, approver_id, status_before, status_after, note)
  VALUES (p_collection_id, p_approver_id, v_collection.status, 'approved', p_note);

  -- Wallet transaction (idempotent by unique index)
  BEGIN
    INSERT INTO public.wallet_transactions(user_id, source_type, source_id, amount, points, description)
    VALUES (v_user_id, 'collection_approval', p_collection_id, v_wallet_amount, v_total_points, 'Approved collection');
  EXCEPTION WHEN unique_violation THEN
    -- already inserted: ignore
  END;

  -- Upsert wallet summary
  INSERT INTO public.wallets(user_id, balance, total_points)
  VALUES (v_user_id, COALESCE(v_wallet_amount,0), COALESCE(v_total_points,0))
  ON CONFLICT (user_id) DO UPDATE SET
    balance = public.wallets.balance + EXCLUDED.balance,
    total_points = public.wallets.total_points + EXCLUDED.total_points,
    updated_at = now();

  -- Fund transaction and balance (only if PET produced value)
  IF COALESCE(v_fund_amount,0) > 0 THEN
    INSERT INTO public.fund_transactions(user_id, fund_name, source_type, source_id, amount, description)
    VALUES (v_user_id, 'green_scholar', 'collection_approval', p_collection_id, v_fund_amount, 'PET contribution');

    INSERT INTO public.fund_balances(fund_name, balance)
    VALUES ('green_scholar', v_fund_amount)
    ON CONFLICT (fund_name) DO UPDATE SET
      balance = public.fund_balances.balance + EXCLUDED.balance,
      updated_at = now();
  END IF;

  -- Activity log
  INSERT INTO public.activity_log(user_id, entity_type, entity_id, action, metadata)
  VALUES (p_approver_id, 'collection', p_collection_id, 'approved', jsonb_build_object('wallet_amount', v_wallet_amount, 'fund_amount', v_fund_amount, 'points', v_total_points));

  RETURN jsonb_build_object('status','ok','wallet_amount',v_wallet_amount,'fund_amount',v_fund_amount,'points',v_total_points);
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_collection(
  p_collection_id uuid,
  p_approver_id uuid,
  p_note text
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_collection RECORD;
BEGIN
  SELECT * INTO v_collection FROM public.collections WHERE id = p_collection_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'collection not found'; END IF;
  IF v_collection.status <> 'pending' THEN
    RETURN jsonb_build_object('status','noop','message','already processed');
  END IF;

  UPDATE public.collections SET status = 'rejected', updated_at = now() WHERE id = p_collection_id;

  INSERT INTO public.collection_approvals(collection_id, approver_id, status_before, status_after, note)
  VALUES (p_collection_id, p_approver_id, v_collection.status, 'rejected', p_note);

  INSERT INTO public.activity_log(user_id, entity_type, entity_id, action, metadata)
  VALUES (p_approver_id, 'collection', p_collection_id, 'rejected', jsonb_build_object('note', p_note));

  RETURN jsonb_build_object('status','ok');
END;
$$;

-- ============================================================================
-- Views
-- ============================================================================

-- Office approval queue (pending collections)
CREATE OR REPLACE VIEW public.v_office_approval_queue AS
SELECT c.id AS collection_id,
       c.created_at,
       c.user_id,
       u.email AS customer_email,
       c.collector_id,
       c.status
FROM public.collections c
LEFT JOIN public.users u ON u.id = c.user_id
WHERE c.status = 'pending'
ORDER BY c.created_at DESC;

-- Customer fund summary
CREATE OR REPLACE VIEW public.v_customer_fund AS
SELECT
  u.id AS user_id,
  u.full_name,
  COALESCE(SUM(CASE WHEN ft.fund_name = 'green_scholar' THEN ft.amount ELSE 0 END), 0) AS total_contributed
FROM public.users u
LEFT JOIN public.fund_transactions ft ON ft.user_id = u.id
GROUP BY u.id, u.full_name;

-- Total fund value
CREATE OR REPLACE VIEW public.v_fund_total AS
SELECT COALESCE(SUM(balance), 0) AS fund_total
FROM public.fund_balances
WHERE fund_name = 'green_scholar';

-- ============================================================================
-- Seed Data (idempotent)
-- ============================================================================

-- Roles
INSERT INTO public.roles(name, description)
VALUES
  ('super_admin','Platform super administrator'),
  ('admin','Office administrator'),
  ('office','Office staff'),
  ('collector','Collection staff'),
  ('member','Main app member')
ON CONFLICT (name) DO NOTHING;

-- Materials
INSERT INTO public.materials(name, category)
VALUES
  ('Aluminum Cans','metals'),
  ('PET Bottles','plastics'),
  ('Cardboard','paper'),
  ('Glass Bottles','glass'),
  ('HDPE Containers','plastics')
ON CONFLICT (name) DO NOTHING;

-- Material Rates (effective now)
-- Aluminum Cans 18.55; PET Bottles 1.50; Cardboard 1.70; Glass Bottles 0.83; HDPE Containers 2.72
WITH mats AS (
  SELECT id, name FROM public.materials WHERE name IN ('Aluminum Cans','PET Bottles','Cardboard','Glass Bottles','HDPE Containers')
)
INSERT INTO public.material_rates(material_id, rate_per_kg, points_per_kg, effective_from)
SELECT m.id,
       CASE m.name
         WHEN 'Aluminum Cans' THEN 18.55
         WHEN 'PET Bottles' THEN 1.50
         WHEN 'Cardboard' THEN 1.70
         WHEN 'Glass Bottles' THEN 0.83
         WHEN 'HDPE Containers' THEN 2.72
         ELSE 0
       END AS rate_per_kg,
       1.0 AS points_per_kg,
       now() AS effective_from
FROM mats m
WHERE NOT EXISTS (
  SELECT 1 FROM public.material_rates mr
  WHERE mr.material_id = m.id AND mr.effective_to IS NULL
);

-- Ensure fund balance row exists
INSERT INTO public.fund_balances(fund_name, balance) VALUES ('green_scholar', 0)
ON CONFLICT (fund_name) DO NOTHING;

-- ============================================================================
-- Seed Address Data (Soweto: 29 townships and their subdivisions)
-- ============================================================================

-- Townships (street postal codes)
INSERT INTO public.address_townships(township_name, city, postal_code) VALUES
  ('Braamfischerville','Soweto','1863'),
  ('Chiawelo','Soweto','1818'),
  ('Diepkloof','Soweto','1862'),
  ('Dobsonville','Soweto','1863'),
  ('Doornkop','Soweto','1874'),
  ('Dube','Soweto','1801'),
  ('Eldorado Park','Soweto','1811'),
  ('Greenvillage','Soweto','1818'),
  ('Jabavu','Soweto','1809'),
  ('Jabulani','Soweto','1868'),
  ('Mapetla','Soweto','1818'),
  ('Meadowlands','Soweto','1852'),
  ('Mmesi Park','Soweto','1863'),
  ('Mofolo','Soweto','1801'),
  ('Molapo','Soweto','1818'),
  ('Moroka','Soweto','1818'),
  ('Naledi','Soweto','1861'),
  ('Orlando East','Soweto','1804'),
  ('Orlando West','Soweto','1804'),
  ('Phiri','Soweto','1818'),
  ('Pimville','Soweto','1809'),
  ('Protea Glen','Soweto','1819'),
  ('Protea North','Soweto','1818'),
  ('Protea South','Soweto','1818'),
  ('Senaoane','Soweto','1818'),
  ('Thulani','Soweto','1874'),
  ('Tladi','Soweto','1818'),
  ('Zola','Soweto','1818'),
  ('Zondi','Soweto','1818')
ON CONFLICT (township_name) DO NOTHING;

-- Helper to insert a subdivision if missing
DO $$
DECLARE
  v_id uuid;
BEGIN
  -- Braamfischerville: Phase 1-4
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Braamfischerville';
  IF v_id IS NOT NULL THEN
    FOR i IN 1..4 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Phase '||i, 'Braamfischerville', '1863'
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Chiawelo: Ext 3-5
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Chiawelo';
  IF v_id IS NOT NULL THEN
    FOR i IN 3..5 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Ext '||i, 'Chiawelo', '1818'
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Diepkloof: Zone 1-6, Ext 1-10
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Diepkloof';
  IF v_id IS NOT NULL THEN
    FOR i IN 1..6 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Zone '||i, 'Diepkloof', '1862' ON CONFLICT DO NOTHING;
    END LOOP;
    FOR i IN 1..10 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Ext '||i, 'Diepkloof', '1862' ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Dobsonville: Old Dobsonville, Ext 1-5, Ext 7
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Dobsonville';
  IF v_id IS NOT NULL THEN
    INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
    SELECT v_id, 'Old Dobsonville', 'Dobsonville', '1863' ON CONFLICT DO NOTHING;
    FOR i IN 1..5 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Ext '||i, 'Dobsonville', '1863' ON CONFLICT DO NOTHING;
    END LOOP;
    INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
    SELECT v_id, 'Ext 7', 'Dobsonville', '1863' ON CONFLICT DO NOTHING;
  END IF;

  -- Doornkop: Block 1-12
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Doornkop';
  IF v_id IS NOT NULL THEN
    FOR i IN 1..12 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Block '||i, 'Doornkop', '1874' ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Dube: Zone 1-9
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Dube';
  IF v_id IS NOT NULL THEN
    FOR i IN 1..9 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Zone '||i, 'Dube', '1801' ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Eldorado Park: Ext 1-10
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Eldorado Park';
  IF v_id IS NOT NULL THEN
    FOR i IN 1..10 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Ext '||i, 'Eldorado Park', '1811' ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Greenvillage: Ext 1-3
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Greenvillage';
  IF v_id IS NOT NULL THEN
    FOR i IN 1..3 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Ext '||i, 'Greenvillage', '1818' ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Jabavu: Zone 1-4
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Jabavu';
  IF v_id IS NOT NULL THEN
    FOR i IN 1..4 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Zone '||i, 'Jabavu', '1809' ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Jabulani: Zone 1-9
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Jabulani';
  IF v_id IS NOT NULL THEN
    FOR i IN 1..9 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Zone '||i, 'Jabulani', '1868' ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Mapetla: Ext 1-2
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Mapetla';
  IF v_id IS NOT NULL THEN
    FOR i IN 1..2 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Ext '||i, 'Mapetla', '1818' ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Meadowlands: Zone 1-12
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Meadowlands';
  IF v_id IS NOT NULL THEN
    FOR i IN 1..12 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Zone '||i, 'Meadowlands', '1852' ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Mmesi Park: Main
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Mmesi Park';
  IF v_id IS NOT NULL THEN
    INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
    SELECT v_id, 'Main', 'Mmesi Park', '1863' ON CONFLICT DO NOTHING;
  END IF;

  -- Mofolo: North, Central, South
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Mofolo';
  IF v_id IS NOT NULL THEN
    INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
    SELECT v_id, 'North', 'Mofolo', '1801' ON CONFLICT DO NOTHING;
    INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
    SELECT v_id, 'Central', 'Mofolo', '1801' ON CONFLICT DO NOTHING;
    INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
    SELECT v_id, 'South', 'Mofolo', '1801' ON CONFLICT DO NOTHING;
  END IF;

  -- Molapo: Zone 1-4
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Molapo';
  IF v_id IS NOT NULL THEN
    FOR i IN 1..4 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Zone '||i, 'Molapo', '1818' ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Moroka: North, South
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Moroka';
  IF v_id IS NOT NULL THEN
    INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
    SELECT v_id, 'North', 'Moroka', '1818' ON CONFLICT DO NOTHING;
    INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
    SELECT v_id, 'South', 'Moroka', '1818' ON CONFLICT DO NOTHING;
  END IF;

  -- Naledi: Ext 1-4
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Naledi';
  IF v_id IS NOT NULL THEN
    FOR i IN 1..4 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Ext '||i, 'Naledi', '1861' ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Orlando East: Zone 1-7
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Orlando East';
  IF v_id IS NOT NULL THEN
    FOR i IN 1..7 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Zone '||i, 'Orlando East', '1804' ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Orlando West: Zone 1-6, Ext 1-5
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Orlando West';
  IF v_id IS NOT NULL THEN
    FOR i IN 1..6 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Zone '||i, 'Orlando West', '1804' ON CONFLICT DO NOTHING;
    END LOOP;
    FOR i IN 1..5 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Ext '||i, 'Orlando West', '1804' ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Phiri: Zone 1-3
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Phiri';
  IF v_id IS NOT NULL THEN
    FOR i IN 1..3 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Zone '||i, 'Phiri', '1818' ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Pimville: Zone 1-9, Ext 1-5
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Pimville';
  IF v_id IS NOT NULL THEN
    FOR i IN 1..9 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Zone '||i, 'Pimville', '1809' ON CONFLICT DO NOTHING;
    END LOOP;
    FOR i IN 1..5 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Ext '||i, 'Pimville', '1809' ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Protea Glen: Ext 1-31
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Protea Glen';
  IF v_id IS NOT NULL THEN
    FOR i IN 1..31 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Ext '||i, 'Protea Glen', '1819' ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Protea North: Ext 1-4
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Protea North';
  IF v_id IS NOT NULL THEN
    FOR i IN 1..4 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Ext '||i, 'Protea North', '1818' ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Protea South: Ext 1-4
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Protea South';
  IF v_id IS NOT NULL THEN
    FOR i IN 1..4 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Ext '||i, 'Protea South', '1818' ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Senaoane: Zone 1-4
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Senaoane';
  IF v_id IS NOT NULL THEN
    FOR i IN 1..4 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Zone '||i, 'Senaoane', '1818' ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Thulani: Ext 1-3
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Thulani';
  IF v_id IS NOT NULL THEN
    FOR i IN 1..3 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Ext '||i, 'Thulani', '1874' ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Tladi: Zone 1-3
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Tladi';
  IF v_id IS NOT NULL THEN
    FOR i IN 1..3 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Zone '||i, 'Tladi', '1818' ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Zola: Zone 1-6
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Zola';
  IF v_id IS NOT NULL THEN
    FOR i IN 1..6 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Zone '||i, 'Zola', '1818' ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Zondi: Zone 1-5
  SELECT id INTO v_id FROM public.address_townships WHERE township_name='Zondi';
  IF v_id IS NOT NULL THEN
    FOR i IN 1..5 LOOP
      INSERT INTO public.address_subdivisions(area_id, subdivision, township_name, postal_code)
      SELECT v_id, 'Zone '||i, 'Zondi', '1818' ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END $$;

-- ============================================================================
-- Optional: Map superadmin email to super_admin role (if user exists)
-- ============================================================================
DO $$
DECLARE
  v_role_id text;
BEGIN
  SELECT id::text INTO v_role_id FROM public.roles WHERE name = 'super_admin' LIMIT 1;
  IF v_role_id IS NOT NULL THEN
    UPDATE public.users SET role_id = v_role_id WHERE lower(email) = 'superadmin@wozamali.co.za';
  END IF;
END $$;

-- ============================================================================
-- Done
-- ============================================================================
SELECT '✅ Unified schema applied' AS status;


