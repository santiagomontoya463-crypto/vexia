-- =====================================================================
-- STIAN · Migración 0009 · Pago de la suscripción por las empresas
--
-- La empresa ve su plan, cómo pagar y avisa su pago; el administrador de la
-- plataforma lo confirma (o lo rechaza) y la suscripción se activa sola.
-- Es seguro ejecutarla varias veces.
-- =====================================================================

-- Cómo pagar: lo puede leer cualquier persona con sesión iniciada.
create or replace function public.get_payment_info()
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'instructions', coalesce((select value #>> '{}' from public.platform_settings where key = 'payment_instructions'), ''),
    'support', coalesce((select value #>> '{}' from public.platform_settings where key = 'support_contact'), '')
  )
  where auth.uid() is not null;
$$;

-- El historial de pagos también lo puede ver el administrador de la empresa.
drop policy if exists payments_select on public.subscription_payments;
create policy payments_select on public.subscription_payments for select to authenticated
  using (
    public.is_platform_admin()
    or public.has_business_role(business_id, array['owner', 'admin'])
  );

-- ---------------------------------------------------------------------
-- Avisos de pago
-- ---------------------------------------------------------------------
create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  plan_id uuid references public.plans (id) on delete set null,
  months integer not null check (months between 1 and 36),
  amount numeric(14, 2) not null check (amount >= 0),
  currency text not null default 'COP',
  method text not null default 'transfer'
    check (method in ('transfer', 'cash', 'card', 'other')),
  reference text,
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reject_reason text,
  requested_by uuid default auth.uid() references auth.users (id) on delete set null,
  payment_id uuid references public.subscription_payments (id) on delete set null,
  resolved_by uuid references auth.users (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists payment_requests_business_idx
  on public.payment_requests (business_id, created_at desc);

alter table public.payment_requests enable row level security;

drop policy if exists payment_requests_select on public.payment_requests;
create policy payment_requests_select on public.payment_requests for select to authenticated
  using (
    public.is_platform_admin()
    or public.has_business_role(business_id, array['owner', 'admin'])
  );

grant select on public.payment_requests to authenticated;

-- La empresa avisa que pagó (funciona aunque la prueba ya haya vencido).
create or replace function public.request_payment(
  p_business uuid,
  p_plan uuid,
  p_months integer,
  p_amount numeric,
  p_method text,
  p_reference text default null,
  p_notes text default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_currency text;
  v_pending integer;
begin
  if not public.has_business_role(p_business, array['owner', 'admin']) then
    raise exception 'Solo el propietario o un administrador puede avisar un pago.';
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

  if p_plan is not null and not exists (
    select 1 from public.plans where id = p_plan and active
  ) then
    raise exception 'El plan elegido no está disponible.';
  end if;

  select count(*) into v_pending
    from public.payment_requests
   where business_id = p_business and status = 'pending';

  if v_pending >= 5 then
    raise exception 'Ya tienes varios avisos pendientes de confirmar. Espera a que los revisemos.';
  end if;

  select currency into v_currency from public.businesses where id = p_business;

  insert into public.payment_requests (
    business_id, plan_id, months, amount, currency, method, reference, notes
  )
  values (
    p_business, p_plan, p_months, p_amount, coalesce(v_currency, 'COP'), p_method,
    nullif(btrim(p_reference), ''), nullif(btrim(p_notes), '')
  )
  returning id into v_id;

  insert into public.audit_log (business_id, user_id, action, entity, entity_id, details)
  values (p_business, auth.uid(), 'billing.payment_reported', 'payment_request', v_id::text,
          jsonb_build_object('amount', p_amount, 'months', p_months));

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Revisión por el administrador de la plataforma
-- ---------------------------------------------------------------------
create or replace function public.master_list_payment_requests(p_status text default 'pending')
returns table (
  id uuid,
  business_id uuid,
  business_name text,
  plan_id uuid,
  plan_name text,
  months integer,
  amount numeric,
  currency text,
  method text,
  reference text,
  notes text,
  status text,
  reject_reason text,
  requested_by_email text,
  owner_email text,
  phone text,
  created_at timestamptz,
  resolved_at timestamptz
)
language sql stable security definer
set search_path = ''
as $$
  select
    r.id, r.business_id, b.name, r.plan_id, p.name, r.months, r.amount, r.currency,
    r.method, r.reference, r.notes, r.status, r.reject_reason,
    rp.email,
    (select pr.email
       from public.business_members m
       join public.profiles pr on pr.id = m.user_id
      where m.business_id = b.id and m.role = 'owner'
      order by m.created_at
      limit 1),
    b.phone,
    r.created_at, r.resolved_at
  from public.payment_requests r
  join public.businesses b on b.id = r.business_id
  left join public.plans p on p.id = r.plan_id
  left join public.profiles rp on rp.id = r.requested_by
  where public.is_platform_admin()
    and (p_status is null or r.status = p_status)
  order by r.created_at desc
  limit 300;
$$;

create or replace function public.master_approve_payment_request(
  p_request uuid,
  p_amount numeric default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_req public.payment_requests%rowtype;
  v_payment uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'No tienes permiso para esta acción.';
  end if;

  select * into v_req
    from public.payment_requests
   where id = p_request and status = 'pending'
   for update;

  if v_req.id is null then
    raise exception 'El aviso no existe o ya fue revisado.';
  end if;

  v_payment := public.master_record_payment(
    v_req.business_id, v_req.plan_id, coalesce(p_amount, v_req.amount),
    v_req.method, v_req.months, v_req.reference, v_req.notes
  );

  update public.payment_requests
     set status = 'approved',
         payment_id = v_payment,
         resolved_by = auth.uid(),
         resolved_at = now()
   where id = p_request;

  return v_payment;
end;
$$;

create or replace function public.master_reject_payment_request(
  p_request uuid,
  p_reason text default null
)
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

  update public.payment_requests
     set status = 'rejected',
         reject_reason = nullif(btrim(p_reason), ''),
         resolved_by = auth.uid(),
         resolved_at = now()
   where id = p_request and status = 'pending'
  returning business_id into v_business;

  if v_business is null then
    raise exception 'El aviso no existe o ya fue revisado.';
  end if;

  insert into public.audit_log (business_id, user_id, action, entity, entity_id, details)
  values (v_business, auth.uid(), 'master.payment_rejected', 'payment_request', p_request::text,
          jsonb_build_object('reason', p_reason));
end;
$$;

-- Permisos de ejecución
revoke all on function public.get_payment_info() from public, anon;
revoke all on function public.request_payment(uuid, uuid, integer, numeric, text, text, text) from public, anon;
revoke all on function public.master_list_payment_requests(text) from public, anon;
revoke all on function public.master_approve_payment_request(uuid, numeric) from public, anon;
revoke all on function public.master_reject_payment_request(uuid, text) from public, anon;

grant execute on function public.get_payment_info() to authenticated;
grant execute on function public.request_payment(uuid, uuid, integer, numeric, text, text, text) to authenticated;
grant execute on function public.master_list_payment_requests(text) to authenticated;
grant execute on function public.master_approve_payment_request(uuid, numeric) to authenticated;
grant execute on function public.master_reject_payment_request(uuid, text) to authenticated;
