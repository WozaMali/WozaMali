-- Push notifications setup (Web Push for PWA)
-- 1) Subscriptions table
create table if not exists public.push_subscriptions (
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text primary key,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user on public.push_subscriptions(user_id);

-- 2) RLS
alter table public.push_subscriptions enable row level security;

create policy if not exists "users can view own push subscriptions"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

create policy if not exists "users can upsert own push subscriptions"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy if not exists "users can delete own push subscriptions"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

-- 3) Optional cleanup helper for dead endpoints (run from service role)
create or replace function public.delete_push_subscription(p_endpoint text)
returns void as $$
begin
  delete from public.push_subscriptions where endpoint = p_endpoint;
end;
$$ language plpgsql security definer;


