-- ============================================================================
-- QUICK RLS FIX FOR HISTORY PAGE (Main App)
-- Allows authenticated users to read their own collections and withdrawals
-- irrespective of whether rows are keyed by:
--  - customer_id = auth.uid()
--  - customer_id = user_profiles.id of auth user
--  - customer_email = auth user's email
--  - created_by / collector_id = auth.uid()
-- Only exposes approved/completed collections for History
-- ============================================================================

-- unified_collections: SELECT policy for History page
create policy if not exists "history_read_own_collections"
on public.unified_collections
for select
using (
  status in ('approved','completed') and (
    customer_id = auth.uid()
    or collector_id = auth.uid()
    or created_by = auth.uid()
    or exists (
      select 1 from public.user_profiles p
      where p.id = public.unified_collections.customer_id
        and p.user_id = auth.uid()
    )
    or exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and lower(u.email) = lower(public.unified_collections.customer_email)
    )
  )
);

-- Optional: broaden to pending/in_progress if you want them to appear too
-- alter policy "history_read_own_collections" on public.unified_collections using (
--   status in ('approved','completed','pending','in_progress') and (...same conditions...)
-- );

-- withdrawal_requests: SELECT policy for History page (user sees own withdrawals)
create policy if not exists "history_read_own_withdrawals"
on public.withdrawal_requests
for select
using (
  user_id = auth.uid()
);

-- Helpful indexes (safe no-ops if already exist)
create index if not exists idx_uc_customer_email on public.unified_collections(lower(customer_email));
create index if not exists idx_uc_customer_id on public.unified_collections(customer_id);
create index if not exists idx_uc_created_by on public.unified_collections(created_by);
create index if not exists idx_uc_collector_id on public.unified_collections(collector_id);
create index if not exists idx_wr_user_id on public.withdrawal_requests(user_id);

-- Verification helpers (run manually in SQL editor if needed)
-- select count(*) from public.unified_collections where status in ('approved','completed') and (customer_id = auth.uid() or created_by = auth.uid());
-- select count(*) from public.withdrawal_requests where user_id = auth.uid();


