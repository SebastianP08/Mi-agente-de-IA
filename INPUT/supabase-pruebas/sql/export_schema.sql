-- =====================================================================
-- Exportar el esquema: pegalo en Supabase -> SQL Editor -> Run.
-- Solo LEE (no cambia nada), se puede correr las veces que quieras.
--
-- Devuelve UNA fila con una columna "esquema" (JSON) con todo lo del
-- schema public: columnas, restricciones, RLS, politicas, funciones,
-- triggers, vistas, indices y permisos.
--
-- Para actualizar current_schema.json: en el resultado -> Export -> JSON,
-- y reemplaza el contenido del archivo con lo descargado.
--
-- Las 4 primeras secciones tienen el mismo formato que el current_schema.json
-- actual; las demas son nuevas.
-- =====================================================================

select json_build_object(

  -- Columnas de tablas y vistas. "identidad" = YES si el id lo genera la base
  -- (generated ... as identity); por eso esas columnas salen con default null.
  'columnas', (
    select json_agg(json_build_object(
             'tabla', c.table_name, 'columna', c.column_name, 'tipo', c.data_type,
             'nulo', c.is_nullable, 'default', c.column_default, 'identidad', c.is_identity)
           order by c.table_name, c.ordinal_position)
      from information_schema.columns c
     where c.table_schema = 'public'
  ),

  -- PK, FK, UNIQUE y CHECK
  'restricciones', (
    select json_agg(json_build_object(
             'tabla', cl.relname, 'nombre', co.conname, 'definicion', pg_get_constraintdef(co.oid))
           order by cl.relname, co.conname)
      from pg_constraint co
      join pg_class cl on cl.oid = co.conrelid
      join pg_namespace n on n.oid = cl.relnamespace
     where n.nspname = 'public'
  ),

  -- RLS encendido o no, por tabla
  'rls', (
    select json_agg(json_build_object('tabla', cl.relname, 'rls_activo', cl.relrowsecurity)
           order by cl.relname)
      from pg_class cl
      join pg_namespace n on n.oid = cl.relnamespace
     where n.nspname = 'public' and cl.relkind = 'r'
  ),

  -- Politicas de RLS
  'politicas', (
    select json_agg(json_build_object(
             'tabla', po.tablename, 'nombre', po.policyname, 'comando', po.cmd,
             'roles', po.roles, 'using', po.qual, 'with_check', po.with_check)
           order by po.tablename, po.policyname)
      from pg_policies po
     where po.schemaname = 'public'
  ),

  -- Funciones propias (sin las que instalan las extensiones).
  -- "permisos" null = permisos por defecto (cualquiera puede ejecutarla).
  'funciones', (
    select json_agg(json_build_object(
             'nombre', p.proname,
             'argumentos', pg_get_function_arguments(p.oid),
             'devuelve', pg_get_function_result(p.oid),
             'security_definer', p.prosecdef,
             'permisos', (select json_agg(coalesce(r.rolname, 'public') || ': ' || a.privilege_type)
                            from aclexplode(p.proacl) a
                            left join pg_roles r on r.oid = a.grantee),
             'definicion', pg_get_functiondef(p.oid))
           order by p.proname)
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.prokind = 'f'
       and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  ),

  -- Triggers (sin los internos que crea Postgres para las FK)
  'triggers', (
    select json_agg(json_build_object(
             'tabla', cl.relname, 'nombre', t.tgname, 'definicion', pg_get_triggerdef(t.oid))
           order by cl.relname, t.tgname)
      from pg_trigger t
      join pg_class cl on cl.oid = t.tgrelid
      join pg_namespace n on n.oid = cl.relnamespace
     where n.nspname = 'public' and not t.tgisinternal
  ),

  -- Vistas. "opciones" muestra security_invoker=true si la vista respeta RLS.
  'vistas', (
    select json_agg(json_build_object(
             'nombre', cl.relname, 'opciones', cl.reloptions,
             'definicion', pg_get_viewdef(cl.oid, true))
           order by cl.relname)
      from pg_class cl
      join pg_namespace n on n.oid = cl.relnamespace
     where n.nspname = 'public' and cl.relkind = 'v'
  ),

  -- Indices (incluye los que crean las PK y los UNIQUE)
  'indices', (
    select json_agg(json_build_object(
             'tabla', i.tablename, 'nombre', i.indexname, 'definicion', i.indexdef)
           order by i.tablename, i.indexname)
      from pg_indexes i
     where i.schemaname = 'public'
  ),

  -- Permisos de tabla/vista para anon y authenticated (lo que dejan los grant/revoke)
  'permisos_tabla', (
    select json_agg(json_build_object(
             'tabla', cl.relname, 'rol', r.rolname, 'permiso', a.privilege_type)
           order by cl.relname, r.rolname, a.privilege_type)
      from pg_class cl
      join pg_namespace n on n.oid = cl.relnamespace
      cross join lateral aclexplode(cl.relacl) a
      join pg_roles r on r.oid = a.grantee
     where n.nspname = 'public' and cl.relkind in ('r', 'v')
       and r.rolname in ('anon', 'authenticated')
  ),

  -- Permisos POR COLUMNA (grant insert (cliente_id), grant update (cantidad), ...)
  'permisos_columna', (
    select json_agg(json_build_object(
             'tabla', cl.relname, 'columna', att.attname, 'rol', r.rolname, 'permiso', a.privilege_type)
           order by cl.relname, att.attname, r.rolname, a.privilege_type)
      from pg_attribute att
      join pg_class cl on cl.oid = att.attrelid
      join pg_namespace n on n.oid = cl.relnamespace
      cross join lateral aclexplode(att.attacl) a
      join pg_roles r on r.oid = a.grantee
     where n.nspname = 'public' and att.attnum > 0 and not att.attisdropped
       and r.rolname in ('anon', 'authenticated')
  )

) as esquema;
