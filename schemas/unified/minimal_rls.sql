-- Minimal RLS policies for Unified Schema (idempotent-ish)
-- Run after install_unified_schema.sql

begin;

-- Helper: determine if current user is admin based on users.role_id → roles.name
create or replace function public.is_admin(p_user_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1
    from public.users u
    left join public.roles r on r.id::text = u.role_id::text
    where u.id = p_user_id
      and lower(coalesce(r.name, '')) = 'admin'
  );
$$;

-- Enable RLS on all relevant tables ---------------------------------------
alter table if exists public.users enable row level security;
alter table if exists public.addresses enable row level security;
alter table if exists public.materials enable row level security;
alter table if exists public.unified_collections enable row level security;
alter table if exists public.collection_materials enable row level security;
alter table if exists public.collection_photos enable row level security;
-- Enable RLS on user_wallets only if it's a real table (not a view)
do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'user_wallets'
      and c.relkind in ('r','p') -- ordinary or partitioned table
  ) then
    execute 'alter table public.user_wallets enable row level security';
  end if;
end$$;
alter table if exists public.wallet_transactions enable row level security;

-- USERS --------------------------------------------------------------------
drop policy if exists users_select on public.users;
create policy users_select on public.users
for select using (
  public.is_admin(auth.uid()) or id = auth.uid()
);

drop policy if exists users_modify on public.users;
create policy users_modify on public.users
for update using (
  id = auth.uid() or public.is_admin(auth.uid())
) with check (
  id = auth.uid() or public.is_admin(auth.uid())
);

drop policy if exists users_insert on public.users;
create policy users_insert on public.users
for insert with check (
  public.is_admin(auth.uid())
);

drop policy if exists users_delete on public.users;
create policy users_delete on public.users
for delete using (
  public.is_admin(auth.uid())
);

-- ADDRESSES ----------------------------------------------------------------
drop policy if exists addresses_select on public.addresses;
create policy addresses_select on public.addresses
for select using (
  public.is_admin(auth.uid()) or user_id = auth.uid()
);

drop policy if exists addresses_cud on public.addresses;
create policy addresses_cud on public.addresses
for all using (
  public.is_admin(auth.uid()) or user_id = auth.uid()
) with check (
  public.is_admin(auth.uid()) or user_id = auth.uid()
);

-- MATERIALS ----------------------------------------------------------------
drop policy if exists materials_select on public.materials;
create policy materials_select on public.materials
for select using (true);

drop policy if exists materials_modify on public.materials;
create policy materials_modify on public.materials
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- UNIFIED COLLECTIONS ------------------------------------------------------
drop policy if exists collections_select on public.unified_collections;
create policy collections_select on public.unified_collections
for select using (
  public.is_admin(auth.uid())
  or customer_id = auth.uid()
  or collector_id = auth.uid()
  or created_by = auth.uid()
);

drop policy if exists collections_insert on public.unified_collections;
create policy collections_insert on public.unified_collections
for insert with check (
  public.is_admin(auth.uid())
  or customer_id = auth.uid()
  or created_by = auth.uid()
);

drop policy if exists collections_update on public.unified_collections;
create policy collections_update on public.unified_collections
for update using (
  public.is_admin(auth.uid())
  or collector_id = auth.uid()
  or created_by = auth.uid()
) with check (
  public.is_admin(auth.uid())
  or collector_id = auth.uid()
  or created_by = auth.uid()
);

drop policy if exists collections_delete on public.unified_collections;
create policy collections_delete on public.unified_collections
for delete using (public.is_admin(auth.uid()));

-- COLLECTION MATERIALS -----------------------------------------------------
drop policy if exists cm_select on public.collection_materials;
create policy cm_select on public.collection_materials
for select using (
  exists (
    select 1 from public.unified_collections c
    where c.id = collection_id
      and (
        public.is_admin(auth.uid())
        or c.customer_id = auth.uid()
        or c.collector_id = auth.uid()
        or c.created_by = auth.uid()
      )
  )
);

drop policy if exists cm_cud on public.collection_materials;
create policy cm_cud on public.collection_materials
for all using (
  exists (
    select 1 from public.unified_collections c
    where c.id = collection_id
      and (
        public.is_admin(auth.uid())
        or c.collector_id = auth.uid()
        or c.created_by = auth.uid()
      )
  )
) with check (
  exists (
    select 1 from public.unified_collections c
    where c.id = collection_id
      and (
        public.is_admin(auth.uid())
        or c.collector_id = auth.uid()
        or c.created_by = auth.uid()
      )
  )
);

-- COLLECTION PHOTOS --------------------------------------------------------
drop policy if exists cph_select on public.collection_photos;
create policy cph_select on public.collection_photos
for select using (
  exists (
    select 1 from public.unified_collections c
    where c.id = collection_id
      and (
        public.is_admin(auth.uid())
        or c.customer_id = auth.uid()
        or c.collector_id = auth.uid()
        or c.created_by = auth.uid()
      )
  )
);

drop policy if exists cph_cud on public.collection_photos;
create policy cph_cud on public.collection_photos
for all using (
  exists (
    select 1 from public.unified_collections c
    where c.id = collection_id
      and (
        public.is_admin(auth.uid())
        or c.collector_id = auth.uid()
        or c.created_by = auth.uid()
      )
  )
) with check (
  exists (
    select 1 from public.unified_collections c
    where c.id = collection_id
      and (
        public.is_admin(auth.uid())
        or c.collector_id = auth.uid()
        or c.created_by = auth.uid()
      )
  )
);

-- WALLETS ------------------------------------------------------------------
-- Policies for user_wallets only if it's a real table
do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'user_wallets'
      and c.relkind in ('r','p')
  ) then
    execute 'drop policy if exists wallets_select on public.user_wallets';
    execute 'create policy wallets_select on public.user_wallets '
            'for select using ( public.is_admin(auth.uid()) or user_id = auth.uid() )';

    execute 'drop policy if exists wallets_modify on public.user_wallets';
    execute 'create policy wallets_modify on public.user_wallets '
            'for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()))';
  end if;
end$$;

-- Guard wallet_transactions if it's a view; only enable/apply RLS when table
do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'wallet_transactions'
      and c.relkind in ('r','p')
  ) then
    execute 'alter table public.wallet_transactions enable row level security';

    execute 'drop policy if exists wtx_select on public.wallet_transactions';
    execute 'create policy wtx_select on public.wallet_transactions '
            'for select using ( public.is_admin(auth.uid()) or user_id = auth.uid() )';

    execute 'drop policy if exists wtx_insert on public.wallet_transactions';
    execute 'create policy wtx_insert on public.wallet_transactions '
            'for insert with check (public.is_admin(auth.uid()))';
  end if;
end$$;

-- WALLET TRANSACTIONS ------------------------------------------------------
drop policy if exists wtx_select on public.wallet_transactions;
create policy wtx_select on public.wallet_transactions
for select using (
  public.is_admin(auth.uid()) or user_id = auth.uid()
);

drop policy if exists wtx_insert on public.wallet_transactions;
create policy wtx_insert on public.wallet_transactions
for insert with check (public.is_admin(auth.uid()));

commit;


