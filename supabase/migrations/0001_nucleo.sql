-- =====================================================================
-- STIAN · Migración 0001 · Núcleo
-- Usuarios, empresas, roles, planes, panel Master y auditoría.
--
-- Cómo usarla: Supabase > SQL Editor > New query > pegar todo > Run.
-- Seguridad: si ya existen tablas con estos nombres, el script se detiene
-- sin cambiar nada y te dice cuáles son.
-- =====================================================================

do $$
declare
  conflicto text;
begin
  select string_agg(table_name, ', ')
    into conflicto
    from information_schema.tables
   where table_schema = 'public'
     and table_name in (
       'profiles', 'platform_admins', 'platform_settings',
       'plans', 'businesses', 'business_members', 'audit_log'
     );

  if conflicto is not null then
    raise exception
      'Ya existen tablas con estos nombres: %. No se hizo ningún cambio. Cópiale este mensaje a Claude.',
      conflicto;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 1. Tablas
-- ---------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);

-- Propietarios de la plataforma (acceso al panel Master).
create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (key, value)
values ('trial_days', '3'::jsonb);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  price_monthly numeric(14, 2) not null default 0,
  currency text not null default 'COP',
  modules text[] not null default '{}',
  max_users integer,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.plans (name, description, price_monthly, modules, max_users, sort_order)
values
  ('Básico', 'Para empezar a ordenar tu negocio.', 0,
   array['clientes','servicios','productos','ventas','reservas','facturacion'], 3, 1),
  ('Profesional', 'Operación completa con finanzas y equipo.', 0,
   array['clientes','servicios','productos','ventas','reservas','facturacion','finanzas','trabajadores','proveedores','compras'], 10, 2),
  ('Empresarial', 'Todos los módulos y más usuarios.', 0,
   array['clientes','servicios','productos','ventas','reservas','facturacion','finanzas','trabajadores','proveedores','compras'], null, 3);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  business_type text,
  document_type text not null default 'NIT',
  document_number text,
  country_code text not null default 'CO',
  currency text not null default 'COP',
  email text,
  phone text,
  address text,
  status text not null default 'trial'
    check (status in ('trial', 'active', 'suspended', 'cancelled')),
  suspended_reason text,
  plan_id uuid references public.plans (id) on delete set null,
  trial_ends_at timestamptz,
  subscription_ends_at timestamptz,
  enabled_modules text[] not null default array[
    'reservas','clientes','servicios','productos','ventas','facturacion',
    'finanzas','trabajadores','proveedores','compras'
  ],
  settings jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_members (
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null
    check (role in ('owner', 'manager', 'admin', 'worker')),
  status text not null default 'active'
    check (status in ('active', 'invited', 'disabled')),
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

create index business_members_user_idx on public.business_members (user_id);

create table public.audit_log (
  id bigint generated always as identity primary key,
  business_id uuid references public.businesses (id) on delete set null,
  user_id uuid default auth.uid(),
  action text not null,
  entity text,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_business_idx on public.audit_log (business_id, created_at desc);

-- ---------------------------------------------------------------------
-- 2. Funciones de apoyo (se usan en las reglas de seguridad)
-- ---------------------------------------------------------------------

create function public.is_platform_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.platform_admins where user_id = auth.uid()
  );
$$;

create function public.is_business_member(p_business uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.business_members
     where business_id = p_business
       and user_id = auth.uid()
       and status = 'active'
  );
$$;

create function public.has_business_role(p_business uuid, p_roles text[])
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.business_members
     where business_id = p_business
       and user_id = auth.uid()
       and status = 'active'
       and role = any (p_roles)
  );
$$;

-- Una empresa puede operar si está en prueba vigente o con suscripción vigente.
create function public.business_is_operational(p_business uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.businesses b
     where b.id = p_business
       and (
         (b.status = 'trial'
           and (b.trial_ends_at is null or b.trial_ends_at > now()))
         or
         (b.status = 'active'
           and (b.subscription_ends_at is null or b.subscription_ends_at > now()))
       )
  );
$$;

-- ---------------------------------------------------------------------
-- 3. Disparadores
-- ---------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Usuarios que ya existían antes de esta migración.
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger businesses_touch_updated_at
  before update on public.businesses
  for each row execute function public.touch_updated_at();

-- El dueño de una empresa NO puede cambiar su propio plan, estado,
-- fechas de prueba/suscripción ni módulos: eso es solo del panel Master.
create function public.protect_business_admin_fields()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    new.status := old.status;
    new.suspended_reason := old.suspended_reason;
    new.plan_id := old.plan_id;
    new.trial_ends_at := old.trial_ends_at;
    new.subscription_ends_at := old.subscription_ends_at;
    new.enabled_modules := old.enabled_modules;
    new.created_by := old.created_by;
  end if;
  return new;
end;
$$;

create trigger businesses_protect_admin_fields
  before update on public.businesses
  for each row execute function public.protect_business_admin_fields();

-- ---------------------------------------------------------------------
-- 4. Reglas de seguridad por fila (RLS)
-- ---------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;
alter table public.platform_settings enable row level security;
alter table public.plans enable row level security;
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.audit_log enable row level security;

-- profiles
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or public.is_platform_admin()
    or exists (
      select 1
        from public.business_members mine
        join public.business_members theirs
          on theirs.business_id = mine.business_id
       where mine.user_id = auth.uid()
         and theirs.user_id = profiles.id
    )
  );

create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- platform_admins: cada usuario solo puede ver si él mismo es admin.
-- Para agregar administradores se usa el SQL Editor (no desde la app).
create policy platform_admins_select on public.platform_admins for select to authenticated
  using (user_id = auth.uid() or public.is_platform_admin());

-- platform_settings: solo el Master
create policy platform_settings_select on public.platform_settings for select to authenticated
  using (public.is_platform_admin());
create policy platform_settings_update on public.platform_settings for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- plans
create policy plans_select on public.plans for select to authenticated
  using (active or public.is_platform_admin());
create policy plans_insert on public.plans for insert to authenticated
  with check (public.is_platform_admin());
create policy plans_update on public.plans for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
create policy plans_delete on public.plans for delete to authenticated
  using (public.is_platform_admin());

-- businesses (se crean solo con la función create_business)
create policy businesses_select on public.businesses for select to authenticated
  using (public.is_business_member(id) or public.is_platform_admin());
create policy businesses_update on public.businesses for update to authenticated
  using (public.has_business_role(id, array['owner', 'admin']) or public.is_platform_admin())
  with check (public.has_business_role(id, array['owner', 'admin']) or public.is_platform_admin());
create policy businesses_delete on public.businesses for delete to authenticated
  using (public.is_platform_admin());

-- business_members
create policy members_select on public.business_members for select to authenticated
  using (public.is_business_member(business_id) or public.is_platform_admin());
create policy members_insert on public.business_members for insert to authenticated
  with check (public.has_business_role(business_id, array['owner', 'admin']) or public.is_platform_admin());
create policy members_update on public.business_members for update to authenticated
  using (public.has_business_role(business_id, array['owner', 'admin']) or public.is_platform_admin())
  with check (public.has_business_role(business_id, array['owner', 'admin']) or public.is_platform_admin());
create policy members_delete on public.business_members for delete to authenticated
  using (public.has_business_role(business_id, array['owner', 'admin']) or public.is_platform_admin());

-- audit_log
create policy audit_select on public.audit_log for select to authenticated
  using (
    public.is_platform_admin()
    or (business_id is not null
        and public.has_business_role(business_id, array['owner', 'admin', 'manager']))
  );
create policy audit_insert on public.audit_log for insert to authenticated
  with check (
    user_id = auth.uid()
    and (business_id is null or public.is_business_member(business_id))
  );

-- ---------------------------------------------------------------------
-- 5. Funciones que usa la aplicación
-- ---------------------------------------------------------------------

-- Crea una empresa nueva con prueba gratuita y deja al usuario como propietario.
create function public.create_business(
  p_name text,
  p_business_type text default null,
  p_document_number text default null,
  p_country_code text default 'CO',
  p_currency text default 'COP',
  p_email text default null,
  p_phone text default null,
  p_address text default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_trial_days integer;
  v_id uuid;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesión.';
  end if;

  if p_name is null or btrim(p_name) = '' then
    raise exception 'El nombre del negocio es obligatorio.';
  end if;

  select coalesce((value #>> '{}')::integer, 3)
    into v_trial_days
    from public.platform_settings
   where key = 'trial_days';

  v_trial_days := coalesce(v_trial_days, 3);

  insert into public.businesses (
    name, business_type, document_number, country_code, currency,
    email, phone, address, status, trial_ends_at, created_by
  )
  values (
    btrim(p_name), p_business_type, nullif(btrim(p_document_number), ''),
    upper(coalesce(nullif(btrim(p_country_code), ''), 'CO')),
    upper(coalesce(nullif(btrim(p_currency), ''), 'COP')),
    nullif(btrim(p_email), ''), nullif(btrim(p_phone), ''), nullif(btrim(p_address), ''),
    'trial', now() + make_interval(days => v_trial_days), v_user
  )
  returning id into v_id;

  insert into public.business_members (business_id, user_id, role)
  values (v_id, v_user, 'owner');

  insert into public.audit_log (business_id, user_id, action, entity, entity_id, details)
  values (v_id, v_user, 'business.created', 'business', v_id::text,
          jsonb_build_object('name', p_name, 'trial_days', v_trial_days));

  return v_id;
end;
$$;

-- Resumen para el panel Master.
create function public.master_overview()
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
    'users', (select count(*) from public.profiles),
    'mrr', coalesce(sum(p.price_monthly) filter (where b.status = 'active'), 0)
  )
  from public.businesses b
  left join public.plans p on p.id = b.plan_id
  where public.is_platform_admin();
$$;

-- Lista de empresas para el panel Master.
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
  members_count bigint
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
    (select count(*) from public.business_members m where m.business_id = b.id)
  from public.businesses b
  left join public.plans p on p.id = b.plan_id
  where public.is_platform_admin()
  order by b.created_at desc;
$$;

-- Cambios del Master sobre una empresa (queda registrado en la auditoría).
create function public.master_update_business(
  p_business uuid,
  p_status text default null,
  p_plan uuid default null,
  p_trial_ends timestamptz default null,
  p_subscription_ends timestamptz default null,
  p_modules text[] default null,
  p_reason text default null
)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'No tienes permiso para esta acción.';
  end if;

  if p_status is not null and p_status not in ('trial', 'active', 'suspended', 'cancelled') then
    raise exception 'Estado no válido.';
  end if;

  update public.businesses
     set status = coalesce(p_status, status),
         plan_id = coalesce(p_plan, plan_id),
         trial_ends_at = coalesce(p_trial_ends, trial_ends_at),
         subscription_ends_at = coalesce(p_subscription_ends, subscription_ends_at),
         enabled_modules = coalesce(p_modules, enabled_modules),
         suspended_reason = case
           when p_status = 'suspended' then p_reason
           when p_status is not null then null
           else suspended_reason
         end
   where id = p_business;

  insert into public.audit_log (business_id, user_id, action, entity, entity_id, details)
  values (
    p_business, auth.uid(), 'master.business_updated', 'business', p_business::text,
    jsonb_build_object(
      'status', p_status, 'plan', p_plan, 'trial_ends', p_trial_ends,
      'subscription_ends', p_subscription_ends, 'modules', p_modules, 'reason', p_reason
    )
  );
end;
$$;

-- Permisos de ejecución: solo usuarios con sesión iniciada.
revoke all on function public.create_business(text, text, text, text, text, text, text, text) from public, anon;
revoke all on function public.master_overview() from public, anon;
revoke all on function public.master_list_businesses() from public, anon;
revoke all on function public.master_update_business(uuid, text, uuid, timestamptz, timestamptz, text[], text) from public, anon;
revoke all on function public.is_platform_admin() from public, anon;
revoke all on function public.is_business_member(uuid) from public, anon;
revoke all on function public.has_business_role(uuid, text[]) from public, anon;
revoke all on function public.business_is_operational(uuid) from public, anon;

grant execute on function public.create_business(text, text, text, text, text, text, text, text) to authenticated;
grant execute on function public.master_overview() to authenticated;
grant execute on function public.master_list_businesses() to authenticated;
grant execute on function public.master_update_business(uuid, text, uuid, timestamptz, timestamptz, text[], text) to authenticated;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_business_member(uuid) to authenticated;
grant execute on function public.has_business_role(uuid, text[]) to authenticated;
grant execute on function public.business_is_operational(uuid) to authenticated;
