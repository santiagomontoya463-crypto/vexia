-- =====================================================================
-- STIAN · Migración 0007 · Panel Master completo
--
-- Pagos y suscripciones, detalle por empresa, métricas, auditoría y
-- administradores de la plataforma. Todo se maneja con funciones que solo
-- puede ejecutar un administrador de la plataforma.
-- Es seguro ejecutarla varias veces.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Pagos de suscripción
-- ---------------------------------------------------------------------
create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  plan_id uuid references public.plans (id) on delete set null,
  amount numeric(14, 2) not null check (amount >= 0),
  currency text not null default 'COP',
  method text not null default 'transfer'
    check (method in ('transfer', 'cash', 'card', 'other')),
  reference text,
  months integer not null default 1 check (months between 1 and 36),
  period_start timestamptz not null,
  period_end timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'voided')),
  notes text,
  recorded_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists subscription_payments_business_idx
  on public.subscription_payments (business_id, created_at desc);

alter table public.subscription_payments enable row level security;

drop policy if exists payments_select on public.subscription_payments;
create policy payments_select on public.subscription_payments for select to authenticated
  using (
    public.is_platform_admin()
    or public.has_business_role(business_id, array['owner'])
  );

grant select on public.subscription_payments to authenticated;

-- ---------------------------------------------------------------------
-- Registrar un pago: activa la empresa y extiende su suscripción
-- ---------------------------------------------------------------------
create or replace function public.master_record_payment(
  p_business uuid,
  p_plan uuid,
  p_amount numeric,
  p_method text,
  p_months integer,
  p_reference text default null,
  p_notes text default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_current timestamptz;
  v_status text;
  v_currency text;
  v_start timestamptz;
  v_end timestamptz;
  v_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'No tienes permiso para esta acción.';
  end if;

  if p_months is null or p_months < 1 or p_months > 36 then
    raise exception 'Los meses deben estar entre 1 y 36.';
  end if;

  if p_amount is null or p_amount < 0 then
    raise exception 'El valor del pago no es válido.';
  end if;

  if p_method not in ('transfer', 'cash', 'card', 'other') then
    raise exception 'Forma de pago no válida.';
  end if;

  select subscription_ends_at, status, currency
    into v_current, v_status, v_currency
    from public.businesses
   where id = p_business;

  if not found then
    raise exception 'La empresa no existe.';
  end if;

  -- Si la suscripción sigue vigente, el nuevo periodo empieza al terminar;
  -- si ya venció (o venía de prueba), empieza hoy.
  v_start := case
    when v_status = 'active' and v_current is not null and v_current > now()
      then v_current
    else now()
  end;

  v_end := v_start + make_interval(months => p_months);

  insert into public.subscription_payments (
    business_id, plan_id, amount, currency, method, reference, months,
    period_start, period_end, notes
  )
  values (
    p_business, p_plan, p_amount, coalesce(v_currency, 'COP'), p_method,
    nullif(btrim(p_reference), ''), p_months, v_start, v_end,
    nullif(btrim(p_notes), '')
  )
  returning id into v_id;

  update public.businesses
     set status = 'active',
         plan_id = coalesce(p_plan, plan_id),
         subscription_ends_at = v_end,
         suspended_reason = null
   where id = p_business;

  insert into public.audit_log (business_id, user_id, action, entity, entity_id, details)
  values (p_business, auth.uid(), 'master.payment_recorded', 'payment', v_id::text,
          jsonb_build_object('amount', p_amount, 'months', p_months, 'until', v_end));

  return v_id;
end;
$$;

-- Anula un pago registrado por error (no cambia las fechas de la empresa).
create or replace function public.master_void_payment(p_payment uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_business uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'No tienes permiso para esta acción.';
  end if;

  update public.subscription_payments
     set status = 'voided'
   where id = p_payment and status = 'confirmed'
  returning business_id into v_business;

  if v_business is null then
    raise exception 'El pago no existe o ya estaba anulado.';
  end if;

  insert into public.audit_log (business_id, user_id, action, entity, entity_id, details)
  values (v_business, auth.uid(), 'master.payment_voided', 'payment', p_payment::text, '{}'::jsonb);
end;
$$;

create or replace function public.master_list_payments(p_business uuid default null)
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
  recorded_by_email text
)
language sql stable security definer
set search_path = ''
as $$
  select
    sp.id, sp.business_id, b.name, p.name, sp.amount, sp.currency, sp.method,
    sp.reference, sp.months, sp.period_start, sp.period_end, sp.status, sp.notes,
    sp.created_at, pr.email
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
-- Lista de empresas (con actividad y pagos)
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
  currency text
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
    b.currency
  from public.businesses b
  left join public.plans p on p.id = b.plan_id
  where public.is_platform_admin()
  order by b.created_at desc;
$$;

-- ---------------------------------------------------------------------
-- Resumen y métricas
-- ---------------------------------------------------------------------
create or replace function public.master_overview()
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'total', count(b.id),
    'active', count(b.id) filter (where b.status = 'active'),
    'trial', count(b.id) filter (where b.status = 'trial'),
    'suspended', count(b.id) filter (where b.status = 'suspended'),
    'cancelled', count(b.id) filter (where b.status = 'cancelled'),
    'trials_expiring', count(b.id) filter (
      where b.status = 'trial'
        and b.trial_ends_at between now() and now() + interval '7 days'
    ),
    'trials_expired', count(b.id) filter (
      where b.status = 'trial' and b.trial_ends_at < now()
    ),
    'subs_expiring', count(b.id) filter (
      where b.status = 'active'
        and b.subscription_ends_at between now() and now() + interval '7 days'
    ),
    'subs_expired', count(b.id) filter (
      where b.status = 'active' and b.subscription_ends_at < now()
    ),
    'users', (select count(*) from public.profiles),
    'mrr', coalesce(sum(p.price_monthly) filter (where b.status = 'active'), 0),
    'revenue_month', coalesce((
      select sum(sp.amount) from public.subscription_payments sp
       where sp.status = 'confirmed'
         and date_trunc('month', sp.created_at) = date_trunc('month', now())
    ), 0),
    'revenue_total', coalesce((
      select sum(sp.amount) from public.subscription_payments sp
       where sp.status = 'confirmed'
    ), 0)
  )
  from public.businesses b
  left join public.plans p on p.id = b.plan_id
  where public.is_platform_admin();
$$;

create or replace function public.master_metrics()
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'growth', (
      select jsonb_agg(
        jsonb_build_object(
          'month', to_char(m, 'YYYY-MM'),
          'businesses', (
            select count(*) from public.businesses b
             where date_trunc('month', b.created_at) = m
          ),
          'revenue', coalesce((
            select sum(sp.amount) from public.subscription_payments sp
             where sp.status = 'confirmed'
               and date_trunc('month', sp.created_at) = m
          ), 0)
        )
        order by m
      )
      from generate_series(
        date_trunc('month', now()) - interval '11 months',
        date_trunc('month', now()),
        interval '1 month'
      ) as m
    ),
    'by_type', coalesce((
      select jsonb_agg(jsonb_build_object('type', t.kind, 'count', t.n) order by t.n desc)
      from (
        select coalesce(business_type, 'Sin definir') as kind, count(*) as n
          from public.businesses
         group by 1
      ) t
    ), '[]'::jsonb)
  )
  where public.is_platform_admin();
$$;

-- ---------------------------------------------------------------------
-- Detalle de una empresa
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
          'email', pr.email, 'full_name', pr.full_name,
          'role', m.role, 'status', m.status, 'created_at', m.created_at
        )
        order by m.created_at
      )
      from public.business_members m
      join public.profiles pr on pr.id = m.user_id
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
-- Auditoría
-- ---------------------------------------------------------------------
create or replace function public.master_list_audit(
  p_business uuid default null,
  p_limit integer default 100
)
returns table (
  id bigint,
  business_id uuid,
  business_name text,
  user_email text,
  action text,
  entity text,
  entity_id text,
  details jsonb,
  created_at timestamptz
)
language sql stable security definer
set search_path = ''
as $$
  select a.id, a.business_id, b.name, pr.email, a.action, a.entity, a.entity_id,
         a.details, a.created_at
    from public.audit_log a
    left join public.businesses b on b.id = a.business_id
    left join public.profiles pr on pr.id = a.user_id
   where public.is_platform_admin()
     and (p_business is null or a.business_id = p_business)
   order by a.created_at desc
   limit least(greatest(coalesce(p_limit, 100), 1), 500);
$$;

-- ---------------------------------------------------------------------
-- Administradores de la plataforma
-- ---------------------------------------------------------------------
create or replace function public.master_list_admins()
returns table (user_id uuid, email text, full_name text, created_at timestamptz)
language sql stable security definer
set search_path = ''
as $$
  select pa.user_id, pr.email, pr.full_name, pa.created_at
    from public.platform_admins pa
    join public.profiles pr on pr.id = pa.user_id
   where public.is_platform_admin()
   order by pa.created_at;
$$;

create or replace function public.master_add_admin(p_email text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_user uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'No tienes permiso para esta acción.';
  end if;

  select id into v_user
    from auth.users
   where lower(email) = lower(btrim(coalesce(p_email, '')));

  if v_user is null then
    raise exception 'No existe una cuenta con ese correo. La persona debe crear su cuenta primero.';
  end if;

  insert into public.platform_admins (user_id) values (v_user)
  on conflict (user_id) do nothing;

  insert into public.audit_log (business_id, user_id, action, entity, entity_id, details)
  values (null, auth.uid(), 'master.admin_added', 'admin', v_user::text,
          jsonb_build_object('email', lower(btrim(p_email))));
end;
$$;

create or replace function public.master_remove_admin(p_user uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'No tienes permiso para esta acción.';
  end if;

  if p_user = auth.uid() then
    raise exception 'No puedes quitarte a ti mismo como administrador.';
  end if;

  delete from public.platform_admins where user_id = p_user;

  insert into public.audit_log (business_id, user_id, action, entity, entity_id, details)
  values (null, auth.uid(), 'master.admin_removed', 'admin', p_user::text, '{}'::jsonb);
end;
$$;

-- ---------------------------------------------------------------------
-- Eliminar una empresa (solo si está cancelada)
-- ---------------------------------------------------------------------
create or replace function public.master_delete_business(p_business uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_name text;
  v_status text;
begin
  if not public.is_platform_admin() then
    raise exception 'No tienes permiso para esta acción.';
  end if;

  select name, status into v_name, v_status
    from public.businesses where id = p_business;

  if v_name is null then
    raise exception 'La empresa no existe.';
  end if;

  if v_status <> 'cancelled' then
    raise exception 'Para eliminar una empresa primero debes cancelarla.';
  end if;

  delete from public.businesses where id = p_business;

  insert into public.audit_log (business_id, user_id, action, entity, entity_id, details)
  values (null, auth.uid(), 'master.business_deleted', 'business', p_business::text,
          jsonb_build_object('name', v_name));
end;
$$;

-- ---------------------------------------------------------------------
-- Permisos de ejecución
-- ---------------------------------------------------------------------
revoke all on function public.master_record_payment(uuid, uuid, numeric, text, integer, text, text) from public, anon;
revoke all on function public.master_void_payment(uuid) from public, anon;
revoke all on function public.master_list_payments(uuid) from public, anon;
revoke all on function public.master_list_businesses() from public, anon;
revoke all on function public.master_overview() from public, anon;
revoke all on function public.master_metrics() from public, anon;
revoke all on function public.master_business_detail(uuid) from public, anon;
revoke all on function public.master_list_audit(uuid, integer) from public, anon;
revoke all on function public.master_list_admins() from public, anon;
revoke all on function public.master_add_admin(text) from public, anon;
revoke all on function public.master_remove_admin(uuid) from public, anon;
revoke all on function public.master_delete_business(uuid) from public, anon;

grant execute on function public.master_record_payment(uuid, uuid, numeric, text, integer, text, text) to authenticated;
grant execute on function public.master_void_payment(uuid) to authenticated;
grant execute on function public.master_list_payments(uuid) to authenticated;
grant execute on function public.master_list_businesses() to authenticated;
grant execute on function public.master_overview() to authenticated;
grant execute on function public.master_metrics() to authenticated;
grant execute on function public.master_business_detail(uuid) to authenticated;
grant execute on function public.master_list_audit(uuid, integer) to authenticated;
grant execute on function public.master_list_admins() to authenticated;
grant execute on function public.master_add_admin(text) to authenticated;
grant execute on function public.master_remove_admin(uuid) to authenticated;
grant execute on function public.master_delete_business(uuid) to authenticated;
