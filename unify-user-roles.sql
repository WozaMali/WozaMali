-- Unify user roles to resident/member for Main App users
-- Keeps collector/admin/super_admin intact

-- 1) Ensure required roles exist
DO $$
DECLARE
  v_resident uuid;
  v_member uuid;
  v_collector uuid;
  v_admin uuid;
  v_super uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'resident') THEN
    INSERT INTO public.roles (id, name, description) VALUES (gen_random_uuid(), 'resident', 'Main App resident')
    ON CONFLICT (name) DO NOTHING;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'member') THEN
    INSERT INTO public.roles (id, name, description) VALUES (gen_random_uuid(), 'member', 'Legacy alias of resident')
    ON CONFLICT (name) DO NOTHING;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'collector') THEN
    INSERT INTO public.roles (id, name, description) VALUES (gen_random_uuid(), 'collector', 'Collector user')
    ON CONFLICT (name) DO NOTHING;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'admin') THEN
    INSERT INTO public.roles (id, name, description) VALUES (gen_random_uuid(), 'admin', 'Administrator')
    ON CONFLICT (name) DO NOTHING;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'super_admin') THEN
    INSERT INTO public.roles (id, name, description) VALUES (gen_random_uuid(), 'super_admin', 'Super Administrator')
    ON CONFLICT (name) DO NOTHING;
  END IF;
END $$;

-- Cache role IDs
DO $$
DECLARE
  v_resident uuid;
  v_member uuid;
  v_collector uuid;
  v_admin uuid;
  v_super uuid;
BEGIN
  SELECT id INTO v_resident FROM public.roles WHERE name = 'resident' LIMIT 1;
  SELECT id INTO v_member FROM public.roles WHERE name = 'member' LIMIT 1;
  SELECT id INTO v_collector FROM public.roles WHERE name = 'collector' LIMIT 1;
  SELECT id INTO v_admin FROM public.roles WHERE name = 'admin' LIMIT 1;
  SELECT id INTO v_super FROM public.roles WHERE name = 'super_admin' LIMIT 1;

  -- 2) Normalize text role fields to resident (except protected roles)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
    UPDATE public.users SET role = 'resident'
    WHERE COALESCE(role,'') NOT IN ('resident','member','collector','admin','super_admin');
    UPDATE public.users SET role = 'resident' WHERE role = 'member';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role_name') THEN
    UPDATE public.users SET role_name = 'resident'
    WHERE COALESCE(role_name,'') NOT IN ('resident','member','collector','admin','super_admin');
    UPDATE public.users SET role_name = 'resident' WHERE role_name = 'member';
  END IF;

  -- 3) Normalize role_id respecting its FK target (roles.id vs roles.name)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role_id') THEN
    DECLARE v_ref_col text;
    BEGIN
      SELECT a2.attname INTO v_ref_col
      FROM pg_constraint c
      JOIN pg_class cl ON cl.oid = c.conrelid AND cl.relname = 'users'
      JOIN pg_namespace nsp ON nsp.oid = cl.relnamespace AND nsp.nspname = 'public'
      JOIN pg_class cl2 ON cl2.oid = c.confrelid AND cl2.relname = 'roles'
      JOIN pg_attribute a1 ON a1.attrelid = c.conrelid AND a1.attnum = ANY (c.conkey)
      JOIN pg_attribute a2 ON a2.attrelid = c.confrelid AND a2.attnum = ANY (c.confkey)
      WHERE c.contype = 'f' AND a1.attname = 'role_id'
      LIMIT 1;

      IF COALESCE(v_ref_col,'') = 'id' THEN
        -- role_id references roles.id (UUID/text id)
        UPDATE public.users SET role_id = v_resident::text WHERE role_id IN ('resident','member') OR role_id IS NULL;
        UPDATE public.users SET role_id = v_collector::text WHERE role_id IN ('collector');
        UPDATE public.users SET role_id = v_admin::text WHERE role_id IN ('admin');
        UPDATE public.users SET role_id = v_super::text WHERE role_id IN ('super_admin');
        UPDATE public.users u
        SET role_id = v_resident::text
        WHERE NOT EXISTS (
          SELECT 1 FROM public.roles r WHERE r.id::text = u.role_id::text AND r.name IN ('collector','admin','super_admin','resident','member')
        );
      ELSIF COALESCE(v_ref_col,'') = 'name' THEN
        -- role_id references roles.name (text)
        UPDATE public.users SET role_id = 'resident' WHERE role_id IN ('member') OR role_id IS NULL;
        UPDATE public.users SET role_id = 'collector' WHERE role_id IN ('collector');
        UPDATE public.users SET role_id = 'admin' WHERE role_id IN ('admin');
        UPDATE public.users SET role_id = 'super_admin' WHERE role_id IN ('super_admin');
        UPDATE public.users u
        SET role_id = 'resident'
        WHERE COALESCE(role_id,'') NOT IN ('resident','member','collector','admin','super_admin');
      ELSE
        -- Unknown FK target: do not change role_id to avoid FK violations
        RAISE NOTICE 'Skipped role_id normalization: could not determine FK target column (found: %)', v_ref_col;
      END IF;
    END;
  END IF;
END $$;

-- 4) Default role for new users
CREATE OR REPLACE FUNCTION public.set_default_resident_role()
RETURNS trigger AS $$
DECLARE
  v_resident_id text;
  v_ref_col text;
BEGIN
  SELECT id::text INTO v_resident_id FROM public.roles WHERE name = 'resident' LIMIT 1;

  -- Prefer role_id if column exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role_id') THEN
    SELECT a2.attname INTO v_ref_col
    FROM pg_constraint c
    JOIN pg_class cl ON cl.oid = c.conrelid AND cl.relname = 'users'
    JOIN pg_namespace nsp ON nsp.oid = cl.relnamespace AND nsp.nspname = 'public'
    JOIN pg_class cl2 ON cl2.oid = c.confrelid AND cl2.relname = 'roles'
    JOIN pg_attribute a1 ON a1.attrelid = c.conrelid AND a1.attnum = ANY (c.conkey)
    JOIN pg_attribute a2 ON a2.attrelid = c.confrelid AND a2.attnum = ANY (c.confkey)
    WHERE c.contype = 'f' AND a1.attname = 'role_id'
    LIMIT 1;

    IF COALESCE(v_ref_col,'') = 'id' THEN
      IF NEW.role_id IS NULL OR NEW.role_id IN ('resident','member') THEN
        NEW.role_id := v_resident_id;
      END IF;
    ELSIF COALESCE(v_ref_col,'') = 'name' THEN
      IF NEW.role_id IS NULL OR NEW.role_id IN ('member') THEN
        NEW.role_id := 'resident';
      END IF;
    END IF;
  END IF;

  -- Normalize text role fields if present
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
    IF NEW.role IS NULL OR NEW.role IN ('member') THEN
      NEW.role := 'resident';
    END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role_name') THEN
    IF NEW.role_name IS NULL OR NEW.role_name IN ('member') THEN
      NEW.role_name := 'resident';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS users_default_resident ON public.users;
CREATE TRIGGER users_default_resident
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_default_resident_role();

-- 5) Optional: backfill the specific user ID if needed
-- UPDATE public.users SET role_id = (SELECT id::text FROM public.roles WHERE name='resident' LIMIT 1)
-- WHERE id = '3625eb83-2732-4973-945f-c3a663ee44e7';


