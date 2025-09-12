-- Merge duplicate materials and delete aliases
-- Canonicalize: 'Aluminum Cans' over 'Aluminium Cans'
-- Canonicalize: 'PET Bottles' over 'Plastic Bottles (PET)'

begin;

-- Ensure canonical materials exist
insert into public.materials (id, name, unit, rate_per_kg, is_active, description, category, created_at, updated_at)
select gen_random_uuid(), 'Aluminum Cans', 'kg', 18.55, true,
       'Clean aluminum beverage cans', 'Metal', now(), now()
where not exists (select 1 from public.materials where lower(name) = lower('Aluminum Cans'));

insert into public.materials (id, name, unit, rate_per_kg, is_active, description, category, created_at, updated_at)
select gen_random_uuid(), 'PET Bottles', 'kg', 1.50, true,
       'Clear PET plastic bottles', 'Plastics', now(), now()
where not exists (select 1 from public.materials where lower(name) = lower('PET Bottles'));

-- Update collection_materials references
update public.collection_materials cm
set material_id = (
  select id from public.materials where name = 'Aluminum Cans'
)
where cm.material_id in (
  select id from public.materials where name in ('Aluminium Cans')
);

update public.collection_materials cm
set material_id = (
  select id from public.materials where name = 'PET Bottles'
)
where cm.material_id in (
  select id from public.materials where name in ('Plastic Bottles (PET)')
);

-- Update pickup_items references if present
do $$ begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'pickup_items' and column_name = 'material_id'
  ) then
    update public.pickup_items pi
    set material_id = (select id from public.materials where name = 'Aluminum Cans')
    where material_id in (select id from public.materials where name in ('Aluminium Cans'));

    update public.pickup_items pi
    set material_id = (select id from public.materials where name = 'PET Bottles')
    where material_id in (select id from public.materials where name in ('Plastic Bottles (PET)'));
  end if;
end $$;

-- Normalize any free-text columns
-- wallet_update_queue.material_name/material
do $$ begin
  -- Normalize wallet_update_queue.material_name if column exists
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'wallet_update_queue' and column_name = 'material_name'
  ) then
    update public.wallet_update_queue
    set material_name = 'Aluminum Cans'
    where material_name in ('Aluminium Cans');

    update public.wallet_update_queue
    set material_name = 'PET Bottles'
    where material_name in ('Plastic Bottles (PET)');
  end if;

  -- Normalize wallet_update_queue.material if column exists
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'wallet_update_queue' and column_name = 'material'
  ) then
    update public.wallet_update_queue
    set material = 'Aluminum Cans'
    where material in ('Aluminium Cans');

    update public.wallet_update_queue
    set material = 'PET Bottles'
    where material in ('Plastic Bottles (PET)');
  end if;
end $$;

-- Delete alias materials now that references are moved
delete from public.materials where name in ('Aluminium Cans', 'Plastic Bottles (PET)');

commit;


