-- Create schools table for Green Scholar data
-- Run this in the Supabase SQL editor (project: public schema)

-- Extensions (usually enabled already on Supabase)
-- create extension if not exists "pgcrypto";

create table if not exists public.schools (
	id uuid primary key default gen_random_uuid(),
	school_name text not null,
	township text,
	address_line1 text,
	phone text,
	email text,
	has_website boolean default false,
	account_name text,
	contact_last_name text,
	city text,
	created_at timestamptz default now()
);

-- Helpful index for case-insensitive search by name
create index if not exists idx_schools_lower_name on public.schools (lower(school_name));

-- Enable RLS and allow public read access (adjust if you want auth-only)
alter table public.schools enable row level security;

drop policy if exists "Allow read to all" on public.schools;
create policy "Allow read to all"
on public.schools for select
to anon, authenticated
using (true);

-- Optional: allow inserts/updates only for authenticated users
-- drop policy if exists "Allow write to authenticated" on public.schools;
-- create policy "Allow write to authenticated"
-- on public.schools for all
-- to authenticated
-- using (true)
-- with check (true);

-- After running this, import your CSV via Table Editor → Import data
-- Map columns accordingly:
--   School -> school_name
--   Township -> township
--   Street -> address_line1
--   Phone -> phone
--   Email -> email
--   WBSITE (YES/NO) -> has_website (transform YES -> true, NO -> false)
--   Account Name -> account_name
--   Last Name -> contact_last_name
--   City -> city

-- OPTIONAL: Use a staging table if your CSV has values like "Coming soon"
-- 1) Create staging table with TEXT columns (easier imports)
create table if not exists public.schools_import_raw (
	school text,
	township text,
	street text,
	phone text,
	email text,
	wsite text,
	account_name text,
	contact_last_name text,
	city text,
	created_at timestamptz default now()
);

-- 2) Import your CSV into public.schools_import_raw with this mapping:
--   School -> school
--   Township -> township
--   Street -> street
--   Phone -> phone
--   Email -> email
--   WBSITE (YES/NO) -> wsite
--   Account Name -> account_name
--   Last Name -> contact_last_name
--   City -> city

-- 3) Normalize and move into public.schools
insert into public.schools (
	school_name,
	township,
	address_line1,
	phone,
	email,
	has_website,
	account_name,
	contact_last_name,
	city
)
select
	trim(school),
	trim(township),
	trim(street) as address_line1,
	nullif(trim(phone), '') as phone,
	case
		when email ilike 'no email' then null
		when email ilike 'coming soon' then null
		when trim(email) = '' then null
		else trim(email)
	end as email,
	case
		when upper(coalesce(wsite, '')) in ('YES','Y','TRUE','1') then true
		when upper(coalesce(wsite, '')) in ('NO','N','FALSE','0') then false
		else null
	end as has_website,
	trim(account_name),
	trim(contact_last_name),
	trim(city)
from public.schools_import_raw;

-- 4) (Optional) Clear the staging table after verifying data
-- truncate table public.schools_import_raw;


-- =====================================================
-- USER PREFERRED SCHOOL (Save School)
-- =====================================================
create table if not exists public.user_school_preferences (
	user_id uuid primary key references auth.users(id) on delete cascade,
	school_id uuid not null references public.schools(id) on delete cascade,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

alter table public.user_school_preferences enable row level security;

drop policy if exists "user can select own pref" on public.user_school_preferences;
create policy "user can select own pref"
on public.user_school_preferences for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user can upsert own pref" on public.user_school_preferences;
create policy "user can upsert own pref"
on public.user_school_preferences for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "user can update own pref" on public.user_school_preferences;
create policy "user can update own pref"
on public.user_school_preferences for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- =====================================================
-- RPC: Upsert preferred school using auth.uid()
-- =====================================================
drop function if exists public.upsert_user_school_preference(uuid);
create or replace function public.upsert_user_school_preference(p_school_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.user_school_preferences (user_id, school_id, created_at, updated_at)
  values (auth.uid(), p_school_id, now(), now())
  on conflict (user_id) do update
    set school_id = excluded.school_id,
        updated_at = now();
end;
$$;

revoke all on function public.upsert_user_school_preference(uuid) from public;
grant execute on function public.upsert_user_school_preference(uuid) to authenticated;

-- =====================================================
-- RPC: Get current user's preferred school via auth.uid()
-- =====================================================
drop function if exists public.get_user_school_preference();
create or replace function public.get_user_school_preference()
returns table (
  school_id uuid,
  school_name text,
  township text,
  address_line1 text,
  city text
)
language sql
security definer
as $$
  select s.id as school_id,
         s.school_name,
         s.township,
         s.address_line1,
         s.city
  from public.user_school_preferences usp
  join public.schools s on s.id = usp.school_id
  where usp.user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.get_user_school_preference() from public;
grant execute on function public.get_user_school_preference() to authenticated;

-- =====================================================
-- RPC: Clear current user's preferred school
-- =====================================================
drop function if exists public.clear_user_school_preference();
create or replace function public.clear_user_school_preference()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.user_school_preferences where user_id = auth.uid();
end;
$$;

revoke all on function public.clear_user_school_preference() from public;
grant execute on function public.clear_user_school_preference() to authenticated;

