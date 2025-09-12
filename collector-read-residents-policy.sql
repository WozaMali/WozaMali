-- Collector App read access to resident users and lookups

-- Ensure RLS is enabled on required tables
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.roles ENABLE ROW LEVEL SECURITY;

-- Grant basic SELECT to authenticated role (RLS still applies)
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.areas TO authenticated;
GRANT SELECT ON public.roles TO authenticated;

-- Roles readable to authenticated (for lookups)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'roles' AND policyname = 'roles readable to authenticated'
  ) THEN
    CREATE POLICY "roles readable to authenticated" ON public.roles
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Areas readable to everyone (safe lookup)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'areas' AND policyname = 'Allow read access to areas'
  ) THEN
    CREATE POLICY "Allow read access to areas" ON public.areas
      FOR SELECT USING (true);
  END IF;
END $$;

-- Authenticated users can read resident-like users (non-recursive to avoid 42P17)
DO $$ BEGIN
  -- Drop previous policy if present
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Collectors can read resident users'
  ) THEN
    DROP POLICY "Collectors can read resident users" ON public.users;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Authenticated can read resident users'
  ) THEN
    DROP POLICY "Authenticated can read resident users" ON public.users;
  END IF;

  CREATE POLICY "Authenticated can read resident users" ON public.users
    FOR SELECT USING (
      auth.role() = 'authenticated'
      AND (
        -- target row is resident-like or newly created without role yet
        role IN ('resident','member','customer')
        OR role IS NULL
        OR role_id IS NULL
        OR role_id IN ('resident','member','customer')
        OR role_id::text IN (
          SELECT id::text FROM public.roles WHERE name IN ('resident','member','customer')
        )
      )
    );
END $$;

-- Optional: allow collectors to see minimal fields for all users if needed (commented)
-- CREATE POLICY "Collectors can read minimal user fields" ON public.users
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM public.users me
--       LEFT JOIN public.roles cr ON cr.id::text = me.role_id::text
--       WHERE me.id = auth.uid() AND (me.role = 'collector' OR me.role_name = 'collector' OR cr.name = 'collector')
--     )
--   );


