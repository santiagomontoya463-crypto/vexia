-- =====================================================================
-- STIAN · Migración 0010 · Cuentas por inscribir (prospectos)
--
-- Lista privada del administrador de la plataforma con las cuentas que va a
-- inscribir, su estado y un enlace a la empresa cuando ya fue creada.
-- Es seguro ejecutarla varias veces.
-- =====================================================================

create table if not exists public.business_prospects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_type text,
  contact_name text,
  contact_phone text,
  contact_email text,
  plan_id uuid references public.plans (id) on delete set null,
  status text not null default 'prospect'
    check (status in ('prospect', 'contacted', 'ready', 'enrolled', 'discarded')),
  notes text,
  expected_date date,
  business_id uuid references public.businesses (id) on delete set null,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  enrolled_at timestamptz
);

create index if not exists business_prospects_status_idx
  on public.business_prospects (status, created_at desc);

alter table public.business_prospects enable row level security;

drop policy if exists prospects_all on public.business_prospects;
create policy prospects_all on public.business_prospects for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

grant select, insert, update, delete on public.business_prospects to authenticated;
