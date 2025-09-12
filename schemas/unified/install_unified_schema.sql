-- Unified Schema Installer (Idempotent)
-- Run this in Supabase SQL Editor. Safe to re-run.
-- Sections:
-- 1) Extensions
-- 2) Roles and Users (core identity)
-- 3) Addresses
-- 4) Materials
-- 5) Unified Collections and Items
-- 6) Wallet Tables
-- 7) RPCs (approve/reject, wallet update)

begin;

-- 1) Extensions -------------------------------------------------------------
create extension if not exists pgcrypto; -- for gen_random_uuid()

-- 2) Roles and Users (core identity) ---------------------------------------
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  created_at timestamptz not null default now()
);

-- Seed minimal roles (idempotent)
insert into public.roles (id, name, description)
select gen_random_uuid(), v.name, v.description
from (values
  ('admin', 'Full administrative access'),
  ('collector', 'Collector who performs pickups'),
  ('member', 'Resident/customer')
) as v(name, description)
where not exists (
  select 1 from public.roles r where r.name = v.name
);

-- Application users mapped to auth.users
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  phone text,
  role_id uuid references public.roles(id),
  status text not null default 'active' check (status in ('active','inactive','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_role_id on public.users(role_id);
create index if not exists idx_users_status on public.users(status);

-- 3) Addresses --------------------------------------------------------------
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  line1 text not null,
  line2 text,
  suburb text,
  city text,
  postal_code text,
  lat numeric(10,8),
  lng numeric(11,8),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure user_id exists if addresses table pre-existed without it
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'addresses'
      and column_name = 'user_id'
  ) then
    alter table public.addresses add column user_id uuid;
    alter table public.addresses
      add constraint addresses_user_id_fkey
      foreign key (user_id) references public.users(id) on delete cascade;
  end if;
exception when others then
  -- ignore if we lack perms in this environment; continue
  perform 1;
end$$;

create index if not exists idx_addresses_user_id on public.addresses(user_id);

-- 4) Materials --------------------------------------------------------------
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  category text,
  rate_per_kg numeric(10,2) not null default 0,
  current_rate numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5) Unified Collections and Items -----------------------------------------
create table if not exists public.unified_collections (
  id uuid primary key default gen_random_uuid(),
  collection_code text unique,
  status text not null default 'submitted' check (status in ('pending','submitted','approved','rejected','completed','cancelled')),
  customer_id uuid references public.users(id) on delete cascade,
  collector_id uuid references public.users(id) on delete set null,
  pickup_address_id uuid references public.addresses(id) on delete set null,
  -- denormalized quick fields
  customer_name text,
  customer_email text,
  collector_name text,
  collector_email text,
  pickup_address text,
  -- totals
  weight_kg numeric(10,2), -- optional input
  total_weight_kg numeric(10,2) default 0,
  computed_value numeric(12,2) default 0,
  total_value numeric(12,2) default 0,
  admin_notes text,
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_uc_customer_id on public.unified_collections(customer_id);
create index if not exists idx_uc_collector_id on public.unified_collections(collector_id);
create index if not exists idx_uc_status on public.unified_collections(status);
create index if not exists idx_uc_created_at on public.unified_collections(created_at);

create table if not exists public.collection_materials (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.unified_collections(id) on delete cascade,
  material_id uuid not null references public.materials(id),
  quantity numeric(10,2) not null default 0,
  unit_price numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_cm_collection_id on public.collection_materials(collection_id);
create index if not exists idx_cm_material_id on public.collection_materials(material_id);

create table if not exists public.collection_photos (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.unified_collections(id) on delete cascade,
  photo_url text not null,
  photo_type text default 'general' check (photo_type in ('before','after','general','verification')),
  uploaded_at timestamptz not null default now(),
  uploaded_by uuid references public.users(id)
);

-- 6) Wallet Tables ----------------------------------------------------------
create table if not exists public.user_wallets (
  user_id uuid primary key references public.users(id) on delete cascade,
  current_points numeric(14,2) not null default 0,
  total_points_earned numeric(14,2) not null default 0,
  total_points_spent numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  transaction_type text not null,
  source_id uuid,
  amount numeric(12,2) not null default 0, -- cash equivalent, if used
  points numeric(14,2) not null default 0, -- points delta (+/-)
  description text,
  created_at timestamptz not null default now()
);

create index if not exists idx_wtx_user_id on public.wallet_transactions(user_id);
create index if not exists idx_wtx_source_id on public.wallet_transactions(source_id);

-- 6b) Green Scholar Fund -----------------------------------------------------
-- Minimal ledger and balance to support Main/Office apps
create table if not exists public.green_scholar_fund_balance (
  id uuid primary key default gen_random_uuid(),
  total_balance numeric(12,2) not null default 0,
  total_contributions numeric(12,2) not null default 0,
  total_distributions numeric(12,2) not null default 0,
  pet_donations_total numeric(12,2) not null default 0,
  direct_donations_total numeric(12,2) not null default 0,
  expenses_total numeric(12,2) not null default 0,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.green_scholar_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_type text not null check (transaction_type in ('pet_contribution','donation','distribution','adjustment')),
  amount numeric(12,2) not null default 0,
  source_type text,
  source_id uuid,
  beneficiary_type text,
  beneficiary_id uuid,
  description text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Direct user donations table (for monetary donations into the fund)
create table if not exists public.user_donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  amount numeric(12,2) not null,
  beneficiary_type text check (beneficiary_type in ('school','child_headed_home','general')),
  beneficiary_id uuid,
  message text,
  is_anonymous boolean not null default false,
  status text not null default 'completed' check (status in ('pending','completed','failed','refunded')),
  created_at timestamptz not null default now()
);

-- Monthly summary across PET contributions and donations
create or replace view public.green_scholar_fund_summary as
with pet as (
  select t.created_at, t.amount, uc.customer_id, uc.collector_id
  from public.green_scholar_transactions t
  join public.unified_collections uc on uc.id = t.source_id
  where t.transaction_type = 'pet_contribution'
),
don as (
  select t.created_at, t.amount
  from public.green_scholar_transactions t
  where t.transaction_type = 'donation'
)
select
  date_trunc('month', coalesce(pet.created_at, don.created_at)) as month,
  coalesce(sum(pet.amount),0) + coalesce(sum(don.amount),0) as total_fund_amount,
  count(*) filter (where pet.created_at is not null) as total_pet_collections,
  count(distinct pet.customer_id) as unique_residents_contributing,
  count(distinct pet.collector_id) as unique_collectors_contributing
from pet
full outer join don on date_trunc('month', pet.created_at) = date_trunc('month', don.created_at)
group by 1
order by 1 desc;

-- Per-user contributions (PET + direct donations)
create or replace view public.green_scholar_user_contributions as
with pet as (
  select uc.customer_id as user_id, sum(t.amount) as pet_amount, count(*) as pet_collections
  from public.green_scholar_transactions t
  join public.unified_collections uc on uc.id = t.source_id
  where t.transaction_type = 'pet_contribution'
  group by uc.customer_id
), don as (
  select user_id, sum(amount) as donation_amount, count(*) as donations
  from public.user_donations
  where status = 'completed'
  group by user_id
)
select
  coalesce(pet.user_id, don.user_id) as user_id,
  coalesce(pet.pet_amount, 0)::numeric as total_pet_amount,
  coalesce(pet.pet_collections, 0) as total_pet_collections,
  coalesce(don.donation_amount, 0)::numeric as total_donation_amount,
  coalesce(don.donations, 0) as total_donations,
  (coalesce(pet.pet_amount,0) + coalesce(don.donation_amount,0))::numeric as total_contribution
from pet
full outer join don on pet.user_id = don.user_id;

-- Ensure a single balance row exists
do $$
begin
  if not exists (select 1 from public.green_scholar_fund_balance) then
    insert into public.green_scholar_fund_balance (id) values (gen_random_uuid());
  end if;
end$$;

-- Grants for app roles (adjust as needed)
do $$
begin
  execute 'grant select on public.green_scholar_fund_summary to authenticated';
  execute 'grant insert on public.green_scholar_transactions to authenticated';
  execute 'grant select, insert on public.user_donations to authenticated';
  execute 'grant select, update on public.green_scholar_fund_balance to authenticated';
exception when others then
  null;
end$$;

-- Helper RPC to add a donation atomically
create or replace function public.add_green_scholar_donation(
  p_user_id uuid,
  p_amount numeric,
  p_beneficiary_type text,
  p_beneficiary_id uuid,
  p_is_anonymous boolean,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_donation_id uuid;
begin
  if coalesce(p_amount,0) <= 0 then
    raise exception 'Amount must be > 0';
  end if;

  insert into public.user_donations (user_id, amount, beneficiary_type, beneficiary_id, is_anonymous, message, status)
  values (p_user_id, p_amount, nullif(p_beneficiary_type,''), p_beneficiary_id, coalesce(p_is_anonymous,false), p_message, 'completed')
  returning id into v_donation_id;

  insert into public.green_scholar_transactions (transaction_type, amount, source_type, source_id, beneficiary_type, beneficiary_id, description, created_by)
  values ('donation', p_amount, 'user_donation', v_donation_id, nullif(p_beneficiary_type,''), p_beneficiary_id, coalesce(p_message,'Donation'), p_user_id);

  update public.green_scholar_fund_balance
  set total_balance = total_balance + p_amount,
      total_contributions = total_contributions + p_amount,
      direct_donations_total = direct_donations_total + p_amount,
      last_updated = now(),
      updated_at = now();

  return v_donation_id;
end;
$$;

grant execute on function public.add_green_scholar_donation(uuid,numeric,text,uuid,boolean,text) to authenticated;

-- 6c) Beneficiaries ----------------------------------------------------------
-- Schools and Child-Headed Homes plus funding requests
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  school_type text check (school_type in ('primary','secondary','special_needs')),
  address text,
  city text,
  province text,
  postal_code text,
  contact_person text,
  contact_phone text,
  contact_email text,
  student_count integer default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.child_headed_homes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  province text,
  postal_code text,
  contact_person text,
  contact_phone text,
  contact_email text,
  child_count integer default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.green_scholar_requests (
  id uuid primary key default gen_random_uuid(),
  requester_type text not null check (requester_type in ('school','child_home')),
  requester_id uuid not null,
  title text not null,
  amount_requested numeric(12,2) not null,
  reason text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_requester_school foreign key (requester_id)
    references public.schools(id) deferrable initially deferred,
  constraint fk_requester_home foreign key (requester_id)
    references public.child_headed_homes(id) deferrable initially deferred
);

-- Relax FK enforcement by trigger to allow either school or home per type
do $$
begin
  perform 1;
exception when undefined_table then
  null;
end$$;

-- Simple RLS (optional: can be tightened later)
alter table if exists public.schools enable row level security;
alter table if exists public.child_headed_homes enable row level security;
alter table if exists public.green_scholar_requests enable row level security;

drop policy if exists schools_read on public.schools;
create policy schools_read on public.schools for select using (true);

drop policy if exists homes_read on public.child_headed_homes;
create policy homes_read on public.child_headed_homes for select using (true);

drop policy if exists requests_rw on public.green_scholar_requests;
create policy requests_rw on public.green_scholar_requests for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

do $$
begin
  execute 'grant select on public.schools to authenticated';
  execute 'grant select on public.child_headed_homes to authenticated';
  execute 'grant select, update, insert on public.green_scholar_requests to authenticated';
exception when others then null;
end$$;

-- Attachments for requests (simple URL storage)
create table if not exists public.green_scholar_request_files (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.green_scholar_requests(id) on delete cascade,
  file_url text not null,
  file_type text,
  uploaded_by uuid references public.users(id) on delete set null,
  uploaded_at timestamptz not null default now()
);

-- RPC to approve request and create fund distribution
create or replace function public.approve_green_scholar_request(
  p_request_id uuid,
  p_approver_id uuid,
  p_note text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.green_scholar_requests%rowtype;
  v_amount numeric(12,2);
  v_beneficiary_type text;
  v_beneficiary_id uuid;
begin
  select * into v_req from public.green_scholar_requests where id = p_request_id for update;
  if not found then
    raise exception 'Request not found';
  end if;
  if v_req.status <> 'pending' then
    return true; -- idempotent
  end if;

  v_amount := coalesce(v_req.amount_requested, 0);
  v_beneficiary_type := case when v_req.requester_type = 'school' then 'school' else 'child_headed_home' end;
  v_beneficiary_id := v_req.requester_id;

  -- Create transaction as distribution (negative to balance) and update balance
  insert into public.green_scholar_transactions (
    transaction_type, amount, source_type, source_id, beneficiary_type, beneficiary_id, description, created_by
  ) values (
    'distribution', v_amount, 'request', p_request_id, v_beneficiary_type, v_beneficiary_id, coalesce(p_note,'Approved request distribution'), p_approver_id
  );

  update public.green_scholar_fund_balance
  set total_balance = greatest(0, total_balance - v_amount),
      total_distributions = total_distributions + v_amount,
      expenses_total = expenses_total + v_amount,
      last_updated = now(),
      updated_at = now();

  update public.green_scholar_requests
  set status = 'approved', updated_at = now()
  where id = p_request_id;

  return true;
end;
$$;

grant execute on function public.approve_green_scholar_request(uuid,uuid,text) to authenticated;

-- 7) RPCs -------------------------------------------------------------------
-- Drop conflicting functions (safe/idempotent) so we can change return types
drop function if exists public.update_wallet_simple(uuid,numeric,text,numeric,text,uuid);
drop function if exists public.approve_collection(uuid,uuid,text,uuid);
drop function if exists public.reject_collection(uuid,uuid,text);
drop function if exists public.compute_collection_totals(uuid);
-- Recompute totals for a collection from collection_materials
create or replace function public.compute_collection_totals(p_collection_id uuid)
returns table(total_weight numeric, total_value numeric) language plpgsql as $$
begin
  return query
  select
    coalesce(sum(cm.quantity), 0)::numeric,
    coalesce(sum(cm.quantity * cm.unit_price), 0)::numeric
  from public.collection_materials cm
  where cm.collection_id = p_collection_id;
end;
$$;

-- Simple wallet update: 1 point = 1 kg by convention
create or replace function public.update_wallet_simple(
  p_user_id uuid,
  p_amount numeric,
  p_transaction_type text,
  p_weight_kg numeric,
  p_description text,
  p_reference_id uuid
)
returns boolean language plpgsql as $$
declare
  v_points numeric(14,2);
begin
  v_points := coalesce(p_weight_kg, 0);

  -- Upsert wallet
  insert into public.user_wallets (user_id, current_points, total_points_earned)
  values (p_user_id, v_points, v_points)
  on conflict (user_id) do update
    set current_points = public.user_wallets.current_points + excluded.current_points,
        total_points_earned = public.user_wallets.total_points_earned + excluded.total_points_earned,
        updated_at = now();

  -- Transaction record
  insert into public.wallet_transactions (user_id, transaction_type, source_id, amount, points, description)
  values (p_user_id, coalesce(p_transaction_type,'collection_approval'), p_reference_id, coalesce(p_amount,0), v_points, coalesce(p_description,''));

  return true;
end;
$$;

-- Approve collection: set status, recompute totals, update wallet
create or replace function public.approve_collection(
  p_collection_id uuid,
  p_approver_id uuid,
  p_note text,
  p_idempotency_key uuid default null
)
returns boolean language plpgsql as $$
declare
  v_total_weight numeric(10,2);
  v_wallet_value numeric(12,2);
  v_fund_value numeric(12,2);
  v_customer uuid;
begin
  select customer_id into v_customer from public.unified_collections where id = p_collection_id;
  if v_customer is null then
    raise exception 'Collection not found or has no customer';
  end if;

  -- Split value: 100% of PET material value to Green Scholar Fund; rest to wallet
  select
    coalesce(sum(case when lower(coalesce(m.name,'')) like '%pet%' then 0 else cm.quantity * coalesce(cm.unit_price, m.current_rate, 0) end), 0)::numeric,
    coalesce(sum(case when lower(coalesce(m.name,'')) like '%pet%' then cm.quantity * coalesce(cm.unit_price, m.current_rate, 0) else 0 end), 0)::numeric,
    coalesce(sum(cm.quantity), 0)::numeric
  into v_wallet_value, v_fund_value, v_total_weight
  from public.collection_materials cm
  left join public.materials m on m.id = cm.material_id
  where cm.collection_id = p_collection_id;

  update public.unified_collections
  set status = 'approved',
      total_weight_kg = coalesce(v_total_weight, total_weight_kg),
      computed_value = coalesce(v_wallet_value + v_fund_value, computed_value),
      total_value = coalesce(v_wallet_value + v_fund_value, total_value),
      admin_notes = p_note,
      updated_by = p_approver_id,
      updated_at = now()
  where id = p_collection_id;

  perform public.update_wallet_simple(
    v_customer,
    coalesce(v_wallet_value, 0),
    'collection_approved',
    coalesce(v_total_weight, 0),
    'Collection approved',
    p_collection_id
  );

  -- Record PET contribution to the Green Scholar Fund and update balance
  if coalesce(v_fund_value, 0) > 0 then
    begin
      insert into public.green_scholar_transactions (
        transaction_type, amount, source_type, source_id, description, created_by
      ) values (
        'pet_contribution', v_fund_value, 'collection', p_collection_id,
        'PET contribution from approved collection', v_customer
      );

      update public.green_scholar_fund_balance
      set total_balance = total_balance + v_fund_value,
          total_contributions = total_contributions + v_fund_value,
          pet_donations_total = pet_donations_total + v_fund_value,
          last_updated = now(),
          updated_at = now();
    exception when others then
      -- Do not fail approval if fund update has issues
      null;
    end;
  end if;

  return true;
end;
$$;

-- Reject collection: set status, store note
create or replace function public.reject_collection(
  p_collection_id uuid,
  p_approver_id uuid,
  p_note text
)
returns boolean language plpgsql as $$
begin
  update public.unified_collections
  set status = 'rejected',
      admin_notes = p_note,
      updated_by = p_approver_id,
      updated_at = now()
  where id = p_collection_id;
  return true;
end;
$$;

commit;

-- Note: RLS intentionally not enabled yet to avoid access issues during bring-up.
-- After verification, add policies incrementally.


