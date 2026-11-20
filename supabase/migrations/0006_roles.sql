-- =====================================================================
-- STIAN · Migración 0006 · Roles del equipo
--
-- El propietario puede asignar cualquier rol (incluido "propietario" para
-- compartir el control total) y modificar o quitar a otros propietarios.
-- Los administradores solo gestionan gerentes y trabajadores.
-- Nadie puede cambiar su propio rol ni quitarse a sí mismo, así que siempre
-- queda al menos un propietario. Es seguro ejecutarla varias veces.
-- =====================================================================

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

  if v_caller = 'admin' and v_target in ('admin', 'owner') then
    raise exception 'Solo un propietario puede modificar a un administrador u otro propietario.';
  end if;

  if p_role is not null then
    if p_role not in ('owner', 'admin', 'manager', 'worker') then
      raise exception 'Rol no válido.';
    end if;

    if p_role in ('owner', 'admin') and v_caller <> 'owner' then
      raise exception 'Solo el propietario puede asignar este rol.';
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

  if v_caller = 'admin' and v_target in ('admin', 'owner') then
    raise exception 'Solo un propietario puede quitar a un administrador u otro propietario.';
  end if;

  delete from public.business_members
   where business_id = p_business and user_id = p_user;

  insert into public.audit_log (business_id, user_id, action, entity, entity_id, details)
  values (p_business, auth.uid(), 'team.member_removed', 'member', p_user::text, '{}'::jsonb);
end;
$$;

revoke all on function public.update_member(uuid, uuid, text, text) from public, anon;
revoke all on function public.remove_member(uuid, uuid) from public, anon;
grant execute on function public.update_member(uuid, uuid, text, text) to authenticated;
grant execute on function public.remove_member(uuid, uuid) to authenticated;
