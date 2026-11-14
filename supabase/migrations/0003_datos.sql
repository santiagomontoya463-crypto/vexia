-- =====================================================================
-- STIAN · Migración 0003 · Datos de cada empresa
--
-- Una sola tabla guarda los registros de todos los módulos (clientes,
-- ventas, productos, facturas, finanzas, etc.), siempre con el
-- identificador de la empresa. Las reglas de seguridad (RLS) garantizan que
-- cada usuario solo vea y modifique los datos de SU empresa, y que una
-- empresa suspendida o con la prueba vencida no pueda escribir.
-- Es seguro ejecutarla varias veces.
-- =====================================================================

create table if not exists public.business_records (
  business_id uuid not null references public.businesses (id) on delete cascade,
  collection text not null,
  record_id text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid(),
  primary key (business_id, collection, record_id)
);

create index if not exists business_records_collection_idx
  on public.business_records (business_id, collection);

drop trigger if exists business_records_touch_updated_at on public.business_records;
create trigger business_records_touch_updated_at
  before update on public.business_records
  for each row execute function public.touch_updated_at();

-- Qué colecciones puede leer o escribir cada rol.
create or replace function public.collection_allowed(
  p_business uuid,
  p_collection text,
  p_write boolean
)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.business_members m
     where m.business_id = p_business
       and m.user_id = auth.uid()
       and m.status = 'active'
       and (
         m.role in ('owner', 'admin', 'manager')
         or (
           m.role = 'worker'
           and (
             p_collection in (
               'clients', 'services', 'products', 'inventory-movements',
               'sales', 'operations', 'payments', 'financial-movements',
               'reservations'
             )
             or (
               not p_write
               and p_collection in ('businesses', 'business-settings', 'business-operations')
             )
           )
         )
       )
  );
$$;

revoke all on function public.collection_allowed(uuid, text, boolean) from public, anon;
grant execute on function public.collection_allowed(uuid, text, boolean) to authenticated;

alter table public.business_records enable row level security;

drop policy if exists records_select on public.business_records;
create policy records_select on public.business_records for select to authenticated
  using (public.collection_allowed(business_id, collection, false));

drop policy if exists records_insert on public.business_records;
create policy records_insert on public.business_records for insert to authenticated
  with check (
    public.collection_allowed(business_id, collection, true)
    and public.business_is_operational(business_id)
  );

drop policy if exists records_update on public.business_records;
create policy records_update on public.business_records for update to authenticated
  using (
    public.collection_allowed(business_id, collection, true)
    and public.business_is_operational(business_id)
  )
  with check (
    public.collection_allowed(business_id, collection, true)
    and public.business_is_operational(business_id)
  );

drop policy if exists records_delete on public.business_records;
create policy records_delete on public.business_records for delete to authenticated
  using (
    public.collection_allowed(business_id, collection, true)
    and public.business_is_operational(business_id)
  );

grant select, insert, update, delete on public.business_records to authenticated;
