-- HTTP call via Postgres to Next API (requires http extension on pg14+, or use edge functions instead)
-- We will create lightweight NOTIFY functions that enqueue minimal payloads.

-- Helper function to notify application layer via inserting into a notifications table (optional)
create table if not exists public.notifications_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  body text not null,
  data jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

-- Triggers: wallet_transactions insert => push queue
create or replace function public.enqueue_wallet_tx_push()
returns trigger as $$
declare
  v_title text;
  v_body text;
begin
  v_title := 'Wallet updated';
  v_body := case when new.amount >= 0 then
    'R ' || to_char(new.amount, 'FM999999990D00') || ' added to your wallet'
  else
    'R ' || to_char(abs(new.amount), 'FM999999990D00') || ' deducted from your wallet'
  end;

  insert into public.notifications_queue (user_id, title, body, data)
  values (new.user_id, v_title, v_body, jsonb_build_object('url','/wallet'));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_wallet_tx_push on public.wallet_transactions;
create trigger trg_wallet_tx_push
after insert on public.wallet_transactions
for each row execute function public.enqueue_wallet_tx_push();

-- Triggers: points_history insert => push queue
create or replace function public.enqueue_points_push()
returns trigger as $$
declare
  v_title text := 'Points update';
  v_body text;
begin
  v_body := case when new.points_change >= 0 then
    new.points_change || ' points earned'
  else
    abs(new.points_change) || ' points spent'
  end;
  insert into public.notifications_queue (user_id, title, body, data)
  values (new.user_id, v_title, v_body, jsonb_build_object('url','/rewards'));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_points_push on public.points_history;
create trigger trg_points_push
after insert on public.points_history
for each row execute function public.enqueue_points_push();

-- Triggers: green scholar transactions insert => push queue
create or replace function public.enqueue_green_scholar_push()
returns trigger as $$
declare
  v_title text := 'Green Scholar update';
  v_body text := 'Thanks for contributing to the Green Scholar Fund';
begin
  insert into public.notifications_queue (user_id, title, body, data)
  values (coalesce(new.created_by, null), v_title, v_body, jsonb_build_object('url','/fund'));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_green_scholar_push on public.green_scholar_transactions;
create trigger trg_green_scholar_push
after insert on public.green_scholar_transactions
for each row execute function public.enqueue_green_scholar_push();

-- Triggers: withdrawal_requests status change => push queue
create or replace function public.enqueue_withdrawal_status_push()
returns trigger as $$
declare
  v_title text := 'Withdrawal update';
  v_body text := 'Your withdrawal status is now ' || new.status;
begin
  if (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    insert into public.notifications_queue (user_id, title, body, data)
    values (new.user_id, v_title, v_body, jsonb_build_object('url','/withdrawal'));
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_withdrawal_push on public.withdrawal_requests;
create trigger trg_withdrawal_push
after update on public.withdrawal_requests
for each row execute function public.enqueue_withdrawal_status_push();


