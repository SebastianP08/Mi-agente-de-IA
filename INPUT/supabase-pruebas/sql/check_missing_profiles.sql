-- =====================================================================
-- check_missing_profiles.sql
-- Error 23503 (pedidos_cliente_id_fkey): el usuario con sesión existe en
-- auth.users pero NO tiene fila en clientes_practica, así que no puede
-- tener pedidos. Correr en Supabase → SQL Editor (se puede repetir).
-- =====================================================================

-- ---------------------------------------------------------------------
-- PARTE 1 (solo lectura): usuarios de Auth sin perfil de cliente.
-- es_admin = true  → es un admin: no es un error de datos, solo hay que
--                    cerrar sesión y entrar como cliente para comprar.
-- es_admin = false → registro a medias: le falta su fila de cliente.
-- ---------------------------------------------------------------------
select
  u.id,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  exists (select 1 from public.admin_practica a where a.id = u.id) as es_admin
from auth.users u
left join public.clientes_practica c on c.id = u.id
where c.id is null
order by u.created_at desc;

-- ---------------------------------------------------------------------
-- PARTE 2: crear el perfil que falta a los usuarios que NO son admin.
-- on conflict do nothing → si la fila ya existe no hace nada (repetible).
-- El nombre queda null; el cliente lo puede editar luego desde su perfil.
-- ---------------------------------------------------------------------
insert into public.clientes_practica (id, correo, rol)
select u.id, u.email, 'cliente'
from auth.users u
left join public.clientes_practica c on c.id = u.id
where c.id is null
  and not exists (select 1 from public.admin_practica a where a.id = u.id)
on conflict (id) do nothing;

-- Verificación: debería devolver solo admins (o nada).
select u.email
from auth.users u
left join public.clientes_practica c on c.id = u.id
where c.id is null;
