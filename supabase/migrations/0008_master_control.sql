-- =====================================================================
-- STIAN · Migración 0008 · Control total del panel Master
--
-- Seguimiento interno de cada empresa, cartera de cobros con comprobantes,
-- usuarios de toda la plataforma, avisos para las empresas, acciones
-- masivas y respaldo de datos. Es seguro ejecutarla varias veces.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Seguimiento interno (solo lo ve el administrador de la plataforma)
-- ---------------------------------------------------------------------
create table if not exists public.business_internal (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  notes text,
  tags text[] not null default '{}',
  contact_name text,
  contact_phone text,
  next_followup date,
  updated_at timestamptz not null default now()
);

alter table public.business_internal enable row level security;

drop policy if exists internal_all on public.business_internal;
create policy internal_all on public.business_internal for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

grant select, insert, update, delete on public.business_internal to authenticated;

-- ---------------------------------------------------------------------
-- Ajustes de cobro
-- ---------------------------------------------------------------------
insert into public.platform_settings (key, value)
values
  ('payment_instructions', to_jsonb('Escribe aquí cómo te deben pagar: banco, número de cuenta, Nequi, etc.'::text)),
  ('support_contact', to_jsonb(''::text))
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- Número de comprobante en los pagos
-- ---------------------------------------------------------------------
create sequence if not exists public.subscription_receipt_seq;

alter table public.subscription_payments
  add column if not exists receipt_number bigint default nextval('public.subscription_receipt_seq');

update public.subscription_payments
   set receipt_number = nextval('public.subscription_receipt_seq')
 where receipt_number is null;

drop function if exists public.master_list_payments(uuid);

create function public.master_list_payments(p_business uuid default null)
returns table (
  id uuid,
  business_id uuid,
  business_name text,
  plan_name text,
  amount numeric,
  currency text,
  method text,
  reference text,
  months integer,
  period_start timestamptz,
  period_end timestamptz,
  status text,
  notes text,
  created_at timestamptz,
  recorded_by_email text,
  receipt_number bigint
)
language sql stable security definer
set search_path = ''
as $$
  select
    sp.id, sp.business_id, b.name, p.name, sp.amount, sp.currency, sp.method,
    sp.reference, sp.months, sp.period_start, sp.period_end, sp.status, sp.notes,
    sp.created_at, pr.email, sp.receipt_number
  from public.subscription_payments sp
  join public.businesses b on b.id = sp.business_id
  left join public.plans p on p.id = sp.plan_id
  left join public.profiles pr on pr.id = sp.recorded_by
  where public.is_platform_admin()
    and (p_business is null or sp.business_id = p_business)
  order by sp.created_at desc
  limit 500;
$$;

-- ---------------------------------------------------------------------
-- Lista de empresas (ahora con teléfono y correo)
-- ---------------------------------------------------------------------
drop function if exists public.master_list_businesses();

create function public.master_list_businesses()
returns table (
  id uuid,
  name text,
  business_type text,
  status text,
  suspended_reason text,
  plan_id uuid,
  plan_name text,
  trial_ends_at timestamptz,
  subscription_ends_at timestamptz,
  enabled_modules text[],
  created_at timestamptz,
  owner_email text,
  members_count bigint,
  last_activity timestamptz,
  payments_total numeric,
  currency text,
  phone text,
  email text,
  document_number text
)
language sql stable security definer
set search_path = ''
as $$
  select
    b.id, b.name, b.business_type, b.status, b.suspended_reason,
    b.plan_id, p.name, b.trial_ends_at, b.subscription_ends_at,
    b.enabled_modules, b.created_at,
    (select pr.email
       from public.business_members m
       join public.profiles pr on pr.id = m.user_id
      where m.business_id = b.id and m.role = 'owner'
      order by m.created_at
      limit 1),
    (select count(*) from public.business_members m where m.business_id = b.id),
    (select max(r.updated_at) from public.business_records r where r.business_id = b.id),
    coalesce((select sum(sp.amount) from public.subscription_payments sp
               where sp.business_id = b.id and sp.status = 'confirmed'), 0),
    b.currency,
    b.phone,
    b.email,
    b.document_number
  from public.businesses b
  left join public.plans p on p.id = b.plan_id
  where public.is_platform_admin()
  order by b.created_at desc;
$$;

-- ---------------------------------------------------------------------
-- Detalle de empresa (el equipo ahora trae el identificador y si fue creado
-- por la plataforma, para poder administrarlo)
-- ---------------------------------------------------------------------
create or replace function public.master_business_detail(p_business uuid)
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'team', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'user_id', m.user_id,
          'email', pr.email,
          'full_name', pr.full_name,
          'role', m.role,
          'status', m.status,
          'created_at', m.created_at,
          'managed', coalesce((u.raw_user_meta_data ->> 'managed_by_business') = p_business::text, false)
        )
        order by m.created_at
      )
      from public.business_members m
      join public.profiles pr on pr.id = m.user_id
      join auth.users u on u.id = m.user_id
      where m.business_id = p_business
    ), '[]'::jsonb),
    'usage', coalesce((
      select jsonb_object_agg(t.collection, t.n)
      from (
        select collection, count(*) as n
          from public.business_records
         where business_id = p_business
           and record_id not in ('_order', '_value')
         group by collection
      ) t
    ), '{}'::jsonb),
    'last_activity', (
      select max(updated_at) from public.business_records where business_id = p_business
    )
  )
  where public.is_platform_admin();
$$;

-- ---------------------------------------------------------------------
-- Usuarios de toda la plataforma
-- ---------------------------------------------------------------------
create or replace function public.master_list_users()
returns table (
  user_id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  banned boolean,
  is_admin boolean,
  businesses jsonb
)
language sql stable security definer
set search_path = ''
as $$
  select
    u.id,
    u.email::text,
    pr.full_name,
    u.created_at,
    u.last_sign_in_at,
    (u.banned_until is not null and u.banned_until > now()),
    exists (select 1 from public.platform_admins pa where pa.user_id = u.id),
    coalesce((
      select jsonb_agg(
        jsonb_build_object('id', b.id, 'name', b.name, 'role', m.role, 'status', m.status)
      )
      from public.business_members m
      join public.businesses b on b.id = m.business_id
      where m.user_id = u.id
    ), '[]'::jsonb)
  from auth.users u
  left join public.profiles pr on pr.id = u.id
  where public.is_platform_admin()
  order by u.created_at desc
  limit 1000;
$$;

-- ---------------------------------------------------------------------
-- Acciones masivas sobre empresas
-- ---------------------------------------------------------------------
create or replace function public.master_bulk_update(
  p_businesses uuid[],
  p_status text default null,
  p_trial_days integer default null,
  p_reason text default null
)
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_count integer := 0;
  v_base timestamptz;
begin
  if not public.is_platform_admin() then
    raise exception 'No tienes permiso para esta acción.';
  end if;

  if p_status is not null and p_status not in ('trial', 'active', 'suspended', 'cancelled') then
    raise exception 'Estado no válido.';
  end if;

  if p_trial_days is not null and (p_trial_days < 1 or p_trial_days > 365) then
    raise exception 'Los días de prueba deben estar entre 1 y 365.';
  end if;

  foreach v_id in array p_businesses loop
    if p_trial_days is not null then
      select case
               when status = 'trial' and trial_ends_at > now() then trial_ends_at
               else now()
             end
        into v_base
        from public.businesses
       where id = v_id;

      if v_base is null then
        continue;
      end if;

      update public.businesses
         set status = 'trial',
             trial_ends_at = v_base + make_interval(days => p_trial_days),
             suspended_reason = null
       where id = v_id;
    elsif p_status is not null then
      update public.businesses
         set status = p_status,
             suspended_reason = case when p_status = 'suspended' then p_reason else null end
       where id = v_id;
    else
      continue;
    end if;

    v_count := v_count + 1;

    insert into public.audit_log (business_id, user_id, action, entity, entity_id, details)
    values (v_id, auth.uid(), 'master.business_updated', 'business', v_id::text,
            jsonb_build_object('bulk', true, 'status', p_status, 'trial_days', p_trial_days));
  end loop;

  return v_count;
end;
$$;

-- ---------------------------------------------------------------------
-- Respaldo completo de una empresa (para descargar antes de eliminarla)
-- ---------------------------------------------------------------------
create or replace function public.master_export_business(p_business uuid)
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'exported_at', now(),
    'business', to_jsonb(b),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'email', pr.email, 'full_name', pr.full_name, 'role', m.role, 'status', m.status
      ))
      from public.business_members m
      join public.profiles pr on pr.id = m.user_id
      where m.business_id = b.id
    ), '[]'::jsonb),
    'payments', coalesce((
      select jsonb_agg(to_jsonb(sp)) from public.subscription_payments sp
       where sp.business_id = b.id
    ), '[]'::jsonb),
    'records', coalesce((
      select jsonb_agg(jsonb_build_object(
        'collection', r.collection, 'record_id', r.record_id, 'data', r.data
      ))
      from public.business_records r
      where r.business_id = b.id
    ), '[]'::jsonb)
  )
  from public.businesses b
  where b.id = p_business and public.is_platform_admin();
$$;

-- ---------------------------------------------------------------------
-- Avisos para las empresas
-- ---------------------------------------------------------------------
create table if not exists public.platform_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  level text not null default 'info' check (level in ('info', 'warning', 'critical')),
  target_business uuid references public.businesses (id) on delete cascade,
  active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.platform_announcements enable row level security;

drop policy if exists announcements_select on public.platform_announcements;
create policy announcements_select on public.platform_announcements for select to authenticated
  using (
    public.is_platform_admin()
    or (
      active
      and starts_at <= now()
      and (ends_at is null or ends_at > now())
      and (target_business is null or public.is_business_member(target_business))
    )
  );

drop policy if exists announcements_insert on public.platform_announcements;
create policy announcements_insert on public.platform_announcements for insert to authenticated
  with check (public.is_platform_admin());

drop policy if exists announcements_update on public.platform_announcements;
create policy announcements_update on public.platform_announcements for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists announcements_delete on public.platform_announcements;
create policy announcements_delete on public.platform_announcements for delete to authenticated
  using (public.is_platform_admin());

grant select, insert, update, delete on public.platform_announcements to authenticated;

-- ---------------------------------------------------------------------
-- Permisos de ejecución
-- ---------------------------------------------------------------------
revoke all on function public.master_list_payments(uuid) from public, anon;
revoke all on function public.master_list_businesses() from public, anon;
revoke all on function public.master_business_detail(uuid) from public, anon;
revoke all on function public.master_list_users() from public, anon;
revoke all on function public.master_bulk_update(uuid[], text, integer, text) from public, anon;
revoke all on function public.master_export_business(uuid) from public, anon;

grant execute on function public.master_list_payments(uuid) to authenticated;
grant execute on function public.master_list_businesses() to authenticated;
grant execute on function public.master_business_detail(uuid) to authenticated;
grant execute on function public.master_list_users() to authenticated;
grant execute on function public.master_bulk_update(uuid[], text, integer, text) to authenticated;
grant execute on function public.master_export_business(uuid) to authenticated;
