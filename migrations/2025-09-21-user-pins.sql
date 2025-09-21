-- Migration: Create and secure public.user_pins
-- Date: 2025-09-21

BEGIN;

-- 1) Create table if missing
CREATE TABLE IF NOT EXISTS public.user_pins (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username text NOT NULL,
    salt text NOT NULL,
    salted_hash text NOT NULL,
    last_changed_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Grants (schema + table)
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_pins TO authenticated, service_role;

-- 3) Enable RLS
ALTER TABLE public.user_pins ENABLE ROW LEVEL SECURITY;

-- 4) Drop old policies if present
DROP POLICY IF EXISTS "user_pins_authenticated_all" ON public.user_pins;
DROP POLICY IF EXISTS "user_pins_authenticated_select" ON public.user_pins;
DROP POLICY IF EXISTS "user_pins_authenticated_insert" ON public.user_pins;
DROP POLICY IF EXISTS "user_pins_authenticated_update" ON public.user_pins;
DROP POLICY IF EXISTS "user_pins_authenticated_delete" ON public.user_pins;
DROP POLICY IF EXISTS "user_pins_service_role_all" ON public.user_pins;

-- 5) Create working RLS policies
CREATE POLICY "user_pins_authenticated_all" ON public.user_pins
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Optional: service_role has full access
CREATE POLICY "user_pins_service_role_all" ON public.user_pins
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- 6) Realtime publication (optional, only if publication exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
              AND schemaname = 'public'
              AND tablename = 'user_pins'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.user_pins;
        END IF;
    END IF;
END $$;

COMMIT;
