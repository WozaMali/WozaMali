-- Minimal seed for Unified Schema
-- Safe to re-run. Run after:
--  1) schemas/unified/install_unified_schema.sql
--  2) schemas/unified/minimal_rls.sql (optional; you can seed before enabling RLS)

begin;

-- 1) Materials --------------------------------------------------------------
insert into public.materials (id, name, category, rate_per_kg, current_rate, created_at, updated_at)
select gen_random_uuid(), v.name, v.category, v.rate, v.rate, now(), now()
from (
  values
    ('Aluminum Cans', 'Metals', 20.00),
    ('PET Bottles', 'Plastics', 6.00),
    ('Glass', 'Glass', 1.50),
    ('Paper/Cardboard', 'Paper', 2.00)
) as v(name, category, rate)
where not exists (
  select 1 from public.materials m where lower(m.name) = lower(v.name)
);

-- 2) Optional: Upsert user roles for existing users -------------------------
-- If you know specific user UUIDs from auth.users, you can upsert them here.
-- Replace the placeholders below before running this block.
--
-- do $$
-- declare
--   v_admin uuid := '00000000-0000-0000-0000-000000000000'; -- REPLACE (auth user id)
--   v_collector uuid := '00000000-0000-0000-0000-000000000000'; -- REPLACE
--   v_member uuid := '00000000-0000-0000-0000-000000000000'; -- REPLACE
-- begin
--   insert into public.users (id, email, full_name, phone, role_id)
--   select v_admin, 'admin@example.com', 'Admin User', '', r.id from public.roles r where lower(r.name) = 'admin'
--   on conflict (id) do update set role_id = excluded.role_id, email = excluded.email, full_name = excluded.full_name, updated_at = now();
--
--   insert into public.users (id, email, full_name, phone, role_id)
--   select v_collector, 'collector@example.com', 'Collector User', '', r.id from public.roles r where lower(r.name) = 'collector'
--   on conflict (id) do update set role_id = excluded.role_id, email = excluded.email, full_name = excluded.full_name, updated_at = now();
--
--   insert into public.users (id, email, full_name, phone, role_id)
--   select v_member, 'member@example.com', 'Member User', '', r.id from public.roles r where lower(r.name) = 'member'
--   on conflict (id) do update set role_id = excluded.role_id, email = excluded.email, full_name = excluded.full_name, updated_at = now();
-- end$$;

-- 3) Optional: Create a sample collection ----------------------------------
-- This requires valid user UUIDs in public.users. Replace placeholders first.
--
-- do $$
-- declare
--   v_customer uuid := '00000000-0000-0000-0000-000000000000'; -- REPLACE (public.users.id)
--   v_collector uuid := '00000000-0000-0000-0000-000000000000'; -- REPLACE (public.users.id)
--   v_address uuid;
--   v_coll uuid;
--   v_mat uuid;
-- begin
--   -- Ensure an address for the customer
--   insert into public.addresses (id, user_id, line1, suburb, city, postal_code)
--   values (gen_random_uuid(), v_customer, '123 Sample Street', 'Central', 'Cape Town', '8000')
--   returning id into v_address;
--
--   insert into public.unified_collections (
--     id, collection_code, status, customer_id, collector_id, pickup_address_id,
--     customer_name, customer_email, collector_name, collector_email, pickup_address
--   )
--   select gen_random_uuid(), 'COLL-0001', 'submitted', v_customer, v_collector, v_address,
--          cu.full_name, cu.email, co.full_name, co.email, '123 Sample Street, Central, Cape Town'
--   from public.users cu, public.users co
--   where cu.id = v_customer and co.id = v_collector
--   returning id into v_coll;
--   select id into v_mat from public.materials where lower(name) = lower('Aluminum Cans') limit 1;
--   if v_mat is not null then
--     insert into public.collection_materials (id, collection_id, material_id, quantity, unit_price)
--     select gen_random_uuid(), v_coll, v_mat, 10.0, rate_per_kg from public.materials where id = v_mat;
--   end if;
-- end$$;

commit;


