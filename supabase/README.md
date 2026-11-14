# Supabase · STIAN

Los archivos de `migrations/` se ejecutan en orden en el **SQL Editor** de Supabase.

1. `0001_nucleo.sql`: usuarios, empresas, roles, planes, panel Master y auditoría.
2. `0002_permisos.sql`: permisos explícitos para la API de datos.
3. `0003_datos.sql`: tabla `business_records` con los datos de cada empresa (clientes, ventas, productos, facturas, finanzas…) y sus reglas de seguridad.

## Convertirte en propietario de la plataforma (Master)

1. Crea tu cuenta desde la pantalla **Crear cuenta** de la aplicación.
2. En el SQL Editor ejecuta (cambia el correo por el tuyo):

```sql
insert into public.platform_admins (user_id)
select id from auth.users where email = 'TU_CORREO@EJEMPLO.COM';
```

3. Cierra sesión, vuelve a entrar y aparecerá **Panel Master** en el menú.

Nunca pongas la clave `service_role` en el código ni en variables que empiecen por `NEXT_PUBLIC_`.
