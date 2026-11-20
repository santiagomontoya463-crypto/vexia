-- =====================================================================
-- STIAN · Migración 0005 · Acceso del equipo
--
-- La lista del equipo indica qué personas fueron creadas por la empresa con
-- contraseña temporal ("managed"), para permitir restablecer su contraseña.
-- Es seguro ejecutarla varias veces.
-- =====================================================================

drop function if exists public.list_business_team(uuid);

create function public.list_business_team(p_business uuid)
returns table (
  user_id uuid,
  email text,
  full_name text,
  role text,
  status text,
  created_at timestamptz,
  managed boolean
)
language sql stable security definer
set search_path = ''
as $$
  select
    m.user_id,
    pr.email,
    pr.full_name,
    m.role,
    m.status,
    m.created_at,
    coalesce((u.raw_user_meta_data ->> 'managed_by_business') = p_business::text, false)
  from public.business_members m
  join public.profiles pr on pr.id = m.user_id
  join auth.users u on u.id = m.user_id
  where m.business_id = p_business
    and public.has_business_role(p_business, array['owner', 'admin', 'manager'])
  order by
    case m.role when 'owner' then 0 when 'admin' then 1 when 'manager' then 2 else 3 end,
    m.created_at;
$$;

revoke all on function public.list_business_team(uuid) from public, anon;
grant execute on function public.list_business_team(uuid) to authenticated;
