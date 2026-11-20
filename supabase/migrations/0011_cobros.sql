-- =====================================================================
-- STIAN · Migración 0011 · Cobros de suscripción
--
-- 1. Cuentas de cobro de la plataforma (dónde pagan las empresas).
-- 2. Solicitudes de pago: la empresa reporta su transferencia y el Master
--    la aprueba (activa o renueva la suscripción) o la rechaza con motivo.
--
-- Requiere las migraciones 0001 y 0007. Es seguro ejecutarla varias veces.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Cuentas de cobro de la plataforma
-- ---------------------------------------------------------------------
create table if not exists public.platform_payment_accounts (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  kind text not null default 'bank' check (kind in ('bank', 'wallet', 'other')),
  bank_name text,
  account_type text,
  account_number text not null,
  holder_name text not null,
  holder_document text,
  instructions text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.platform_payment_accounts enable row level security;

-- Las empresas ven solo las cuentas activas; el Master ve y administra todas.
drop policy if exists payment_accounts_select on public.platform_payment_accounts;
create policy payment_accounts_select on public.platform_payment_accounts
  for select to authenticated
  using (active or public.is_platform_admin());

drop policy if exists payment_accounts_insert on public.platform_payment_accounts;
create policy payment_accounts_insert on public.platform_payment_accounts
  for insert to authenticated
  with check (public.is_platform_admin());

drop policy if exists payment_accounts_update on public.platform_payment_accounts;
create policy payment_accounts_update on public.platform_payment_accounts
  for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists payment_accounts_delete on public.platform_payment_accounts;
create policy payment_accounts_delete on public.platform_payment_accounts
  for delete to authenticated
  using (public.is_platform_admin());

grant select, insert, update, delete on public.platform_payment_accounts to authenticated;

-- ---------------------------------------------------------------------
-- Solicitudes de pago de suscripción
-- ---------------------------------------------------------------------
create table if not exists public.subscription_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  plan_id uuid references public.plans (id) on delete set null,
  months integer not null check (months between 1 and 36),
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'COP',
  account_id uuid references public.platform_payment_accounts (id) on delete set null,
  reference text not null,
  paid_on date not null,
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reject_reason text,
  payment_id uuid references public.subscription_payments (id) on delete set null,
  requested_by uuid default auth.uid() references auth.users (id) on delete set null,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Solo una solicitud pendiente por empresa.
create unique index if not exists subscription_requests_one_pending
  on public.subscription_requests (business_id)
  where status = 'pending';

create index if not exists subscription_requests_status_idx
  on public.subscription_requests (status, created_at desc);

alter table public.subscription_requests enable row level security;

drop policy if exists subscription_requests_select on public.subscription_requests;
create policy subscription_requests_select on public.subscription_requests
  for select to authenticated
  using (
    public.is_platform_admin()
    or public.has_business_role(business_id, array['owner'])
  );

grant select on public.subscription_requests to authenticated;

-- ---------------------------------------------------------------------
-- La empresa reporta un pago (solo el propietario)
-- ---------------------------------------------------------------------
create or replace function public.submit_payment_request(
  p_business uuid,
  p_plan uuid,
  p_months integer,
  p_account uuid,
  p_reference text,
  p_paid_on date,
  p_notes text default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_status text;
  v_currency text;
  v_price numeric;
  v_plan_active boolean;
  v_reference text := btrim(coalesce(p_reference, ''));
  v_id uuid;
begin
  if not public.has_business_role(p_business, array['owner']) then
    raise exception 'Solo el propietario de la empresa puede reportar pagos.';
  end if;

  if p_months is null or p_months < 1 or p_months > 36 then
    raise exception 'Los meses deben estar entre 1 y 36.';
  end if;

  if length(v_reference) < 3 or length(v_reference) > 120 then
    raise exception 'Escribe la referencia o número de comprobante de la transferencia.';
  end if;

  if p_paid_on is null
     or p_paid_on > current_date + 1
     or p_paid_on < current_date - 90 then
    raise exception 'La fecha del pago no es válida.';
  end if;

  select status, currency
    into v_status, v_currency
    from public.businesses
   where id = p_business;

  if v_status is null then
    raise exception 'La empresa no existe.';
  end if;

  if v_status in ('suspended', 'cancelled') then
    raise exception 'Tu empresa está suspendida o cancelada. Comunícate con soporte para reactivarla.';
  end if;

  select price_monthly, active
    into v_price, v_plan_active
    from public.plans
   where id = p_plan;

  if v_plan_active is distinct from true or coalesce(v_price, 0) <= 0 then
    raise exception 'El plan elegido no está disponible para pago.';
  end if;

  if p_account is not null and not exists (
    select 1 from public.platform_payment_accounts
     where id = p_account and active
  ) then
    raise exception 'La cuenta de cobro elegida no está disponible.';
  end if;

  insert into public.subscription_requests (
    business_id, plan_id, months, amount, currency, account_id,
    reference, paid_on, notes
  )
  values (
    p_business, p_plan, p_months, v_price * p_months,
    coalesce(v_currency, 'COP'), p_account,
    v_reference, p_paid_on, nullif(btrim(coalesce(p_notes, '')), '')
  )
  returning id into v_id;

  insert into public.audit_log (business_id, user_id, action, entity, entity_id, details)
  values (p_business, auth.uid(), 'subscription.request_submitted', 'request', v_id::text,
          jsonb_build_object('plan', p_plan, 'months', p_months, 'reference', v_reference));

  return v_id;
exception
  when unique_violation then
    raise exception 'Ya tienes un pago pendiente de revisión. Espera la respuesta antes de enviar otro.';
end;
$$;

-- ---------------------------------------------------------------------
-- El Master aprueba o rechaza una solicitud
-- ---------------------------------------------------------------------
create or replace function public.master_review_request(
  p_request uuid,
  p_approve boolean,
  p_reason text default null
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_req public.subscription_requests%rowtype;
  v_payment uuid;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if not public.is_platform_admin() then
    raise exception 'No tienes permiso para esta acción.';
  end if;

  select * into v_req
    from public.subscription_requests
   where id = p_request and status = 'pending'
   for update;

  if v_req.id is null then
    raise exception 'La solicitud no existe o ya fue revisada.';
  end if;

  if p_approve then
    v_payment := public.master_record_payment(
      v_req.business_id,
      v_req.plan_id,
      v_req.amount,
      'transfer',
      v_req.months,
      v_req.reference,
      coalesce('Solicitud de la empresa. ' || v_req.notes, 'Solicitud de la empresa.')
    );

    update public.subscription_requests
       set status = 'approved',
           payment_id = v_payment,
           reviewed_by = auth.uid(),
           reviewed_at = now()
     where id = v_req.id;

    insert into public.audit_log (business_id, user_id, action, entity, entity_id, details)
    values (v_req.business_id, auth.uid(), 'master.request_approved', 'request', v_req.id::text,
            jsonb_build_object('payment', v_payment, 'months', v_req.months));
  else
    if v_reason is null then
      raise exception 'Escribe el motivo del rechazo para que la empresa lo vea.';
    end if;

    update public.subscription_requests
       set status = 'rejected',
           reject_reason = v_reason,
           reviewed_by = auth.uid(),
           reviewed_at = now()
     where id = v_req.id;

    insert into public.audit_log (business_id, user_id, action, entity, entity_id, details)
    values (v_req.business_id, auth.uid(), 'master.request_rejected', 'request', v_req.id::text,
            jsonb_build_object('reason', v_reason));
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- Listado de solicitudes para el Master
-- ---------------------------------------------------------------------
drop function if exists public.master_list_requests(text);

create function public.master_list_requests(p_status text default null)
returns table (
  id uuid,
  business_id uuid,
  business_name text,
  plan_id uuid,
  plan_name text,
  months integer,
  amount numeric,
  currency text,
  account_label text,
  reference text,
  paid_on date,
  notes text,
  status text,
  reject_reason text,
  requested_by_email text,
  created_at timestamptz,
  reviewed_at timestamptz
)
language sql stable security definer
set search_path = ''
as $$
  select
    r.id,
    r.business_id,
    b.name,
    r.plan_id,
    p.name,
    r.months,
    r.amount,
    r.currency,
    a.label,
    r.reference,
    r.paid_on,
    r.notes,
    r.status,
    r.reject_reason,
    pr.email,
    r.created_at,
    r.reviewed_at
  from public.subscription_requests r
  join public.businesses b on b.id = r.business_id
  left join public.plans p on p.id = r.plan_id
  left join public.platform_payment_accounts a on a.id = r.account_id
  left join public.profiles pr on pr.id = r.requested_by
  where public.is_platform_admin()
    and (p_status is null or r.status = p_status)
  order by
    case r.status when 'pending' then 0 else 1 end,
    r.created_at desc
  limit 300;
$$;

-- Permisos de ejecución
revoke all on function public.submit_payment_request(uuid, uuid, integer, uuid, text, date, text) from public, anon;
revoke all on function public.master_review_request(uuid, boolean, text) from public, anon;
revoke all on function public.master_list_requests(text) from public, anon;

grant execute on function public.submit_payment_request(uuid, uuid, integer, uuid, text, date, text) to authenticated;
grant execute on function public.master_review_request(uuid, boolean, text) to authenticated;
grant execute on function public.master_list_requests(text) to authenticated;
