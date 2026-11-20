-- =====================================================================
-- STIAN · Migración 0004 · Equipo y accesos
--
-- Invitaciones por correo con rol (gerente, administrador, trabajador),
-- aceptación desde la cuenta de la persona invitada, cambio de rol,
-- desactivación y retiro de integrantes, con el límite de usuarios del plan.
-- Es seguro ejecutarla varias veces.
-- =====================================================================

create table if not exists public.business_invitations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  email text not null,
  role text not null check (role in ('manager', 'admin', 'worker')),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked', 'declined')),
  invited_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

create unique index if not exists business_invitations_pending_unique
  on public.business_invitations (business_id, lower(email))
  where status = 'pending';

alter table public.business_invitations enable row level security;

drop policy if exists invitations_select on public.business_invitations;
create policy invitations_select on public.business_invitations for select to authenticated
  using (
    public.has_business_role(business_id, array['owner', 'admin', 'manager'])
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

grant select on public.business_invitations to authenticated;

-- ---------------------------------------------------------------------
-- Invitar a una persona al equipo
-- ---------------------------------------------------------------------
create or replace function public.invite_member(
  p_business uuid,
  p_email text,
  p_role text
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_caller text;
  v_max integer;
  v_used integer;
  v_id uuid;
begin
  select role into v_caller
    from public.business_members
   where business_id = p_business and user_id = auth.uid() and status = 'active';

  if v_caller is null or v_caller not in ('owner', 'admin') then
    raise exception 'Solo el propietario o un administrador puede invitar personas.';
  end if;

  if p_role not in ('manager', 'admin', 'worker') then
    raise exception 'Rol no válido.';
  end if;

  if p_role = 'admin' and v_caller <> 'owner' then
    raise exception 'Solo el propietario puede invitar administradores.';
  end if;

  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'El correo no tiene un formato válido.';
  end if;

  if not public.business_is_operational(p_business) then
    raise exception 'La empresa no está activa: no se pueden invitar personas.';
  end if;

  if exists (
    select 1
      from public.business_members m
      join public.profiles pr on pr.id = m.user_id
     where m.business_id = p_business
       and lower(pr.email) = v_email
       and m.status <> 'disabled'
  ) then
    raise exception 'Esa persona ya hace parte del equipo.';
  end if;

  select p.max_users into v_max
    from public.businesses b
    left join public.plans p on p.id = b.plan_id
   where b.id = p_business;

  if v_max is not null then
    select
      (select count(*) from public.business_members
        where business_id = p_business and status = 'active')
      +
      (select count(*) from public.business_invitations
        where business_id = p_business and status = 'pending')
      into v_used;

    if v_used >= v_max then
      raise exception 'Tu plan permite hasta % usuarios. Mejora el plan para invitar más personas.', v_max;
    end if;
  end if;

  insert into public.business_invitations (business_id, email, role)
  values (p_business, v_email, p_role)
  returning id into v_id;

  insert into public.audit_log (business_id, user_id, action, entity, entity_id, details)
  values (p_business, auth.uid(), 'team.invited', 'invitation', v_id::text,
          jsonb_build_object('email', v_email, 'role', p_role));

  return v_id;
exception
  when unique_violation then
    raise exception 'Ya hay una invitación pendiente para ese correo.';
end;
$$;

create or replace function public.revoke_invitation(p_invitation uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_business uuid;
begin
  select business_id into v_business
    from public.business_invitations
   where id = p_invitation and status = 'pending';

  if v_business is null then
    raise exception 'La invitación no existe o ya fue respondida.';
  end if;

  if not public.has_business_role(v_business, array['owner', 'admin']) then
    raise exception 'No tienes permiso para esta acción.';
  end if;

  update public.business_invitations
     set status = 'revoked', responded_at = now()
   where id = p_invitation;
end;
$$;

-- ---------------------------------------------------------------------
-- Invitaciones que recibe la persona que inició sesión
-- ---------------------------------------------------------------------
create or replace function public.my_pending_invitations()
returns table (
  id uuid,
  business_id uuid,
  business_name text,
  role text,
  created_at timestamptz
)
language sql stable security definer
set search_path = ''
as $$
  select i.id, i.business_id, b.name, i.role, i.created_at
    from public.business_invitations i
    join public.businesses b on b.id = i.business_id
   where i.status = 'pending'
     and lower(i.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
   order by i.created_at desc;
$$;

create or replace function public.accept_invitation(p_invitation uuid)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_inv public.business_invitations%rowtype;
begin
  select * into v_inv
    from public.business_invitations
   where id = p_invitation and status = 'pending'
   for update;

  if v_inv.id is null
     or lower(v_inv.email) <> lower(coalesce(auth.jwt() ->> 'email', '')) then
    raise exception 'La invitación no existe o no es para tu cuenta.';
  end if;

  insert into public.business_members (business_id, user_id, role, status)
  values (v_inv.business_id, auth.uid(), v_inv.role, 'active')
  on conflict (business_id, user_id) do update
    set role = excluded.role, status = 'active'
    where public.business_members.role <> 'owner';

  update public.business_invitations
     set status = 'accepted', responded_at = now()
   where id = v_inv.id;

  insert into public.audit_log (business_id, user_id, action, entity, entity_id, details)
  values (v_inv.business_id, auth.uid(), 'team.joined', 'invitation', v_inv.id::text,
          jsonb_build_object('role', v_inv.role));

  return v_inv.business_id;
end;
$$;

create or replace function public.decline_invitation(p_invitation uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.business_invitations
     set status = 'declined', responded_at = now()
   where id = p_invitation
     and status = 'pending'
     and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''));
end;
$$;

-- ---------------------------------------------------------------------
-- Integrantes del equipo
-- ---------------------------------------------------------------------
-- Se elimina primero por si existe una versión anterior con otras columnas.
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

create or replace function public.update_member(
  p_business uuid,
  p_user uuid,
  p_role text default null,
  p_status text default null
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_caller text;
  v_target text;
begin
  select role into v_caller
    from public.business_members
   where business_id = p_business and user_id = auth.uid() and status = 'active';

  select role into v_target
    from public.business_members
   where business_id = p_business and user_id = p_user;

  if v_caller is null or v_caller not in ('owner', 'admin') then
    raise exception 'No tienes permiso para esta acción.';
  end if;

  if v_target is null then
    raise exception 'La persona no hace parte de este equipo.';
  end if;

  if p_user = auth.uid() then
    raise exception 'No puedes cambiar tu propio rol ni estado.';
  end if;

  if v_target = 'owner' then
    raise exception 'El propietario no se puede modificar.';
  end if;

  if v_caller = 'admin' and v_target = 'admin' then
    raise exception 'Solo el propietario puede modificar a un administrador.';
  end if;

  if p_role is not null then
    if p_role not in ('manager', 'admin', 'worker') then
      raise exception 'Rol no válido.';
    end if;

    if p_role = 'admin' and v_caller <> 'owner' then
      raise exception 'Solo el propietario puede nombrar administradores.';
    end if;
  end if;

  if p_status is not null and p_status not in ('active', 'disabled') then
    raise exception 'Estado no válido.';
  end if;

  update public.business_members
     set role = coalesce(p_role, role),
         status = coalesce(p_status, status)
   where business_id = p_business and user_id = p_user;

  insert into public.audit_log (business_id, user_id, action, entity, entity_id, details)
  values (p_business, auth.uid(), 'team.member_updated', 'member', p_user::text,
          jsonb_build_object('role', p_role, 'status', p_status));
end;
$$;

create or replace function public.remove_member(p_business uuid, p_user uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_caller text;
  v_target text;
begin
  select role into v_caller
    from public.business_members
   where business_id = p_business and user_id = auth.uid() and status = 'active';

  select role into v_target
    from public.business_members
   where business_id = p_business and user_id = p_user;

  if v_caller is null or v_caller not in ('owner', 'admin') then
    raise exception 'No tienes permiso para esta acción.';
  end if;

  if v_target is null then
    raise exception 'La persona no hace parte de este equipo.';
  end if;

  if p_user = auth.uid() then
    raise exception 'No puedes quitarte a ti mismo del equipo.';
  end if;

  if v_target = 'owner' then
    raise exception 'El propietario no se puede quitar.';
  end if;

  if v_caller = 'admin' and v_target = 'admin' then
    raise exception 'Solo el propietario puede quitar a un administrador.';
  end if;

  delete from public.business_members
   where business_id = p_business and user_id = p_user;

  insert into public.audit_log (business_id, user_id, action, entity, entity_id, details)
  values (p_business, auth.uid(), 'team.member_removed', 'member', p_user::text, '{}'::jsonb);
end;
$$;

-- Permisos de ejecución
revoke all on function public.invite_member(uuid, text, text) from public, anon;
revoke all on function public.revoke_invitation(uuid) from public, anon;
revoke all on function public.my_pending_invitations() from public, anon;
revoke all on function public.accept_invitation(uuid) from public, anon;
revoke all on function public.decline_invitation(uuid) from public, anon;
revoke all on function public.list_business_team(uuid) from public, anon;
revoke all on function public.update_member(uuid, uuid, text, text) from public, anon;
revoke all on function public.remove_member(uuid, uuid) from public, anon;

grant execute on function public.invite_member(uuid, text, text) to authenticated;
grant execute on function public.revoke_invitation(uuid) to authenticated;
grant execute on function public.my_pending_invitations() to authenticated;
grant execute on function public.accept_invitation(uuid) to authenticated;
grant execute on function public.decline_invitation(uuid) to authenticated;
grant execute on function public.list_business_team(uuid) to authenticated;
grant execute on function public.update_member(uuid, uuid, text, text) to authenticated;
grant execute on function public.remove_member(uuid, uuid) to authenticated;
