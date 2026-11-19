-- =====================================================================
-- Proteccion de admin_practica y productos_practica: pegalo en
-- Supabase -> SQL Editor -> Run. Se puede correr varias veces.
--
-- Problema que corrige:
--   La politica "agregar" (with check auth.uid() = id) dejaba que CUALQUIER
--   usuario con sesion se insertara como admin desde la consola del navegador.
--   Ademas anon y authenticated tenian todos los permisos por defecto
--   (insert, update, delete, truncate...) en las dos tablas.
--
-- Resumen despues de correr esto:
--   admin_practica:     authenticated solo LEE su propia fila; nadie inserta
--                       desde la API. Los admins se crean a mano (paso 4).
--   productos_practica: todos leen; solo un admin crea, edita y borra.
--
-- OJO: el formulario de registro de admin.html deja de funcionar (el insert
-- en admin_practica da error de RLS). Es lo esperado: un admin no se
-- registra solo, lo crea alguien que ya tiene acceso a la base.
-- =====================================================================


-- ---------- 1. admin_practica ----------
alter table admin_practica enable row level security;

-- Sin politica de INSERT = nadie se agrega como admin desde la API.
drop policy if exists agregar on admin_practica;

-- Se mantiene ver_perfil: admin.js lee el nombre del admin al iniciar sesion
-- y las politicas "exists (select 1 from admin_practica ...)" la necesitan.
drop policy if exists ver_perfil on admin_practica;
create policy ver_perfil on admin_practica
  for select to authenticated
  using ( (select auth.uid()) = id );

-- Segunda capa: aunque alguien agregue una politica por error, sin estos
-- permisos de tabla sigue sin poder escribir.
revoke all on admin_practica from anon, authenticated;
grant select on admin_practica to authenticated;


-- ---------- 2. productos_practica ----------
-- Las politicas ya estan bien (ver_productos para todos; admin_crear,
-- admin_actualiza y admin_elimina solo para admins). Solo falta quitar
-- los permisos de tabla que sobran.
revoke all on productos_practica from anon, authenticated;

-- El catalogo es publico: galeria.html lo lee sin sesion.
grant select on productos_practica to anon, authenticated;

-- authenticated puede intentar escribir; las politicas dejan pasar solo al admin.
-- (Los clientes descuentan stock solo a traves de confirmar_pedido, que es
-- security definer y no necesita estos permisos.)
grant insert, update, delete on productos_practica to authenticated;


-- ---------- 3. Revisar quien es admin HOY ----------
-- Si la politica "agregar" ya se uso para colarse, aqui aparece.
-- Borra a mano las filas que no reconozcas:
--   delete from admin_practica where id = '...';
select a.id, a.nombre, a.correo, u.email as correo_auth, a.created_at
from admin_practica a
left join auth.users u on u.id = a.id
order by a.created_at;


-- ---------- 4. Como crear un admin desde ahora ----------
-- 1) La persona se registra como usuario normal (o se crea en
--    Authentication -> Users).
-- 2) Corre esto cambiando el correo y el nombre (quita los "--").
--    El id hay que mandarlo: en el SQL Editor auth.uid() es null.
--
--   insert into admin_practica (id, nombre, correo)
--   select id, 'Nombre del admin', email
--   from auth.users
--   where email = 'correo@ejemplo.com';


-- ---------- 5. Comprobar ----------
-- admin_practica: solo authenticated SELECT. productos_practica: anon SELECT,
-- authenticated SELECT/INSERT/UPDATE/DELETE.
select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as permisos
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('admin_practica', 'productos_practica')
  and grantee in ('anon', 'authenticated')
group by table_name, grantee
order by table_name, grantee;

select tablename, policyname, cmd from pg_policies
where tablename in ('admin_practica', 'productos_practica')
order by tablename, cmd;
