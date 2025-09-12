-- Unified ledger and approvals additive schema (safe to run on existing DB)
-- 1) Immutable wallet ledger; 2) Material rate versioning; 3) Approvals + activity log

-- Enable extensions if not present
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Immutable wallet ledger capturing both money and points
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('collection_approval','adjustment','payout')),
  source_id uuid NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  description text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Prevent duplicates for same source (idempotency)
CREATE UNIQUE INDEX IF NOT EXISTS ux_wallet_tx_source ON public.wallet_transactions (source_type, source_id)
  WHERE source_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_wallet_tx_user_created ON public.wallet_transactions (user_id, created_at DESC);

-- 2) Versioned material pricing
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

-- 2b) Snapshot fields on pickup_items (if not already present)
ALTER TABLE public.pickup_items
  ADD COLUMN IF NOT EXISTS unit_price_applied numeric(10,2),
  ADD COLUMN IF NOT EXISTS points_per_kg_applied numeric(10,2);

-- 3) Collection approvals and generic activity log
CREATE TABLE IF NOT EXISTS public.collection_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  approver_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  status_before text NOT NULL,
  status_after text NOT NULL CHECK (status_after IN ('approved','rejected')),
  note text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_collection_approvals_collection_created ON public.collection_approvals (collection_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  metadata jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_activity_log_entity ON public.activity_log (entity_type, entity_id, created_at DESC);


