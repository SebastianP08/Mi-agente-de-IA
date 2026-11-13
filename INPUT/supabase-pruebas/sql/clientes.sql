-- =====================================================================
-- Protección de clientes_practica: pégalo en Supabase → SQL Editor → Run.
-- Se puede correr varias veces sin romper nada (drop policy if exists).
--
-- Resumen de quién puede hacer qué después de correr esto:
--   anon (sin sesión)  → nada
--   cliente con sesión → ver, crear y editar SOLO su propia fila
--                        (y en la edición, solo nombre, teléfono y dirección)
--   admin              → ver todas las filas (para la gestión de pedidos)
--   nadie desde la API → borrar filas
-- =====================================================================


-- ---------- 1. Datos limpios antes de poner reglas ----------
-- Filas viejas con rol vacío → 'cliente', para que el check de abajo no falle
update clientes_practica set rol = 'cliente' where rol is null;

-- default: si el insert no manda rol, queda 'cliente' solo
alter table clientes_practica alter column rol set default 'cliente';
alter table clientes_practica alter column rol set not null;

-- check: en esta tabla SOLO existen clientes. Los admins viven en
-- admin_practica, así que aquí 'admin' no tiene sentido
alter table clientes_practica drop constraint if exists clientes_practica_rol_check;
alter table clientes_practica add constraint clientes_practica_rol_check
  check (rol = 'cliente');


-- ---------- 2. Encender RLS ----------
-- Con RLS encendido y SIN políticas, nadie puede hacer nada (todo cerrado).
-- Las políticas de abajo abren, una por una, solo lo necesario
alter table clientes_practica enable row level security;


-- ---------- 3. Políticas (filas: CUÁLES puede tocar cada uno) ----------

-- SELECT: cada cliente ve solo su fila. Lo usan leerCliente() en
-- cliente.js y la precarga del envío en pago.js
drop policy if exists ver_mi_perfil on clientes_practica;
create policy ver_mi_perfil on clientes_practica
  for select to authenticated
  using ( (select auth.uid()) = id );

-- SELECT para admin: mismo EXISTS que ya usas en productos_practica y pedidos.
-- Dos políticas SELECT se suman con OR: un admin ve su fila Y todas las demás
drop policy if exists admin_ve_clientes on clientes_practica;
create policy admin_ve_clientes on clientes_practica
  for select to authenticated
  using ( exists (select 1 from admin_practica where admin_practica.id = (select auth.uid())) );

-- INSERT: solo puedes crear TU fila (id = tu uid), con TU correo de Auth
-- (auth.jwt() ->> 'email' = el correo con el que iniciaste sesión) y con
-- rol 'cliente'. Así nadie crea perfiles a nombre de otro
drop policy if exists crear_mi_perfil on clientes_practica;
create policy crear_mi_perfil on clientes_practica
  for insert to authenticated
  with check (
    (select auth.uid()) = id
    -- lower(): Auth guarda el correo en minúsculas, pero el form puede
    -- mandarlo como "Ana@Mail.com". Sin lower() ese registro fallaría
    and lower(correo) = lower((select auth.jwt() ->> 'email'))
    and rol = 'cliente'
  );

-- UPDATE: using = qué fila puedes elegir para editar (la tuya);
-- with check = cómo debe quedar después (sigue siendo tuya, no puedes
-- cambiarle el id para "regalársela" a otro usuario)
drop policy if exists editar_mi_perfil on clientes_practica;
create policy editar_mi_perfil on clientes_practica
  for update to authenticated
  using ( (select auth.uid()) = id )
  with check ( (select auth.uid()) = id );

-- DELETE: no hay política a propósito → nadie borra desde la API.
-- Además pedidos tiene "on delete restrict" hacia esta tabla.


-- ---------- 4. Permisos por columna (columnas: CUÁLES puede cambiar) ----------
-- RLS decide FILAS, no columnas. Con solo la política de UPDATE, un cliente
-- podría mandar { correo: 'otro@x.com' } a su propia fila. Para cerrar eso
-- se quita el UPDATE de toda la tabla y se devuelve solo para 3 columnas.
-- Si cliente.js mandara correo o rol en el update(), Supabase respondería
-- "permission denied for table clientes_practica"
revoke update on clientes_practica from authenticated;
grant update (nombre, telefono, direccion) on clientes_practica to authenticated;

-- anon no tiene políticas, así que RLS ya lo bloquea. Esto es una segunda
-- capa: aunque alguien agregue una política por error, anon sigue sin permiso
revoke all on clientes_practica from anon;


-- ---------- 5. (Opcional) Enlazar con auth.users ----------
-- Hoy clientes_practica.id no apunta a ningún usuario real. Con esta FK,
-- solo puede existir un perfil si existe el usuario en Auth.
--
-- PASO A: corre esto primero. Si devuelve filas, son perfiles huérfanos
-- (sin usuario en Auth): bórralos o arréglalos antes del PASO B
--
--   select c.id, c.correo from clientes_practica c
--   left join auth.users u on u.id = c.id
--   where u.id is null;
--
-- PASO B: quita los "--" y córrelo
--
--   alter table clientes_practica
--     add constraint clientes_practica_id_fkey
--     foreign key (id) references auth.users (id) on delete cascade;


-- ---------- 6. Comprobar ----------
-- Debe salir rls_activo = true y las 4 políticas
select relname as tabla, relrowsecurity as rls_activo
from pg_class where relname = 'clientes_practica';

select policyname, cmd, roles from pg_policies
where tablename = 'clientes_practica';
