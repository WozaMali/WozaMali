-- Fix users RLS recursion by removing policies/functions that query public.users
-- Safe replacements based on JWT/email only (no self-queries)

-- 1) Drop the recursive admin read policy if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='users' AND policyname='users_admin_read'
  ) THEN
    DROP POLICY "users_admin_read" ON public.users;
  END IF;
END $$;

-- 2) Recreate a safe admin read policy using JWT/email only
-- Adjust email allowlist or JWT claim names to your setup
CREATE POLICY "users_admin_read" ON public.users
  FOR SELECT USING (
    -- Email allowlist
    lower(coalesce(auth.jwt()->>'email','')) IN (
      'admin@wozamali.com',
      'superadmin@wozamali.co.za'
    )
    OR
    -- Optional: custom JWT claim (e.g., app_role) set by your auth hook
    coalesce(auth.jwt()->>'app_role','') IN ('admin','super_admin','office')
  );

-- 3) (Optional) Remove duplicate self read policy to avoid ambiguity
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='users' AND policyname='users_self_select'
  ) THEN
    DROP POLICY "users_self_select" ON public.users;
  END IF;
END $$;

-- 4) Verify effective policies (run separately if desired):
-- SELECT policyname, cmd, qual, with_check FROM pg_policies
-- WHERE schemaname='public' AND tablename='users';


