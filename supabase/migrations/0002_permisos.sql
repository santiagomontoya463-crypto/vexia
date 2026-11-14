-- =====================================================================
-- STIAN · Migración 0002 · Permisos explícitos para la API de datos
--
-- Supabase ya no siempre expone las tablas nuevas a la aplicación de forma
-- automática: hay que dar permisos explícitos. Las reglas de seguridad por
-- fila (RLS) de la migración 0001 siguen decidiendo qué filas ve cada usuario.
-- Es seguro ejecutarla varias veces.
-- =====================================================================

grant usage on schema public to authenticated;

grant select, update on public.profiles to authenticated;
grant select on public.platform_admins to authenticated;
grant select, update on public.platform_settings to authenticated;
grant select, insert, update, delete on public.plans to authenticated;
grant select, update, delete on public.businesses to authenticated;
grant select, insert, update, delete on public.business_members to authenticated;
grant select, insert on public.audit_log to authenticated;
