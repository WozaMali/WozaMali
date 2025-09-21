create or replace view public.registered_users_with_roles as
select
  au.id::uuid                as id,
  au.email                   as email,
  au.created_at              as registered_at,
  coalesce(u.status, 'active') as app_status,
  r.name                     as role_name,
  u.role_id                  as role_id
from auth.users au
left join public.users u
  on u.email = au.email
left join public.roles r
  on r.id = u.role_id;

grant select on public.registered_users_with_roles to anon, authenticated;
