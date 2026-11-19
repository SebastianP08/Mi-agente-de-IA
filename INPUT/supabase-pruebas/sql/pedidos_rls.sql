-- =====================================================================
-- RLS y permisos de pedidos: pegalo en Supabase -> SQL Editor -> Run.
-- Se puede correr varias veces sin romper nada (drop policy if exists).
--
-- ORDEN: corre antes orders_with_total.sql. Este script da permisos sobre
-- la vista pedidos_con_total; si la vista no existe, falla en el paso 2.
-- =====================================================================

-- 1) RLS activado en las 3 tablas nuevas.
alter table pedidos enable row level security;
alter table detalles_pedidos enable row level security;
alter table historial_estados_pedido enable row level security;

-- 2) Permisos POR COLUMNA. Supabase concede todo por defecto a anon y authenticated: se quita
--    y se concede solo lo necesario. Asi el navegador NO puede enviar precio_unitario, estado ni confirmado_en.
revoke all on pedidos, detalles_pedidos, historial_estados_pedido, pedidos_con_total from anon, authenticated;

grant select, delete on pedidos to authenticated;
grant insert (cliente_id) on pedidos to authenticated;
grant update (estado) on pedidos to authenticated;            -- solo lo usara el admin (ver politicas)

grant select, delete on detalles_pedidos to authenticated;
grant insert (pedido_id, producto_id, cantidad) on detalles_pedidos to authenticated;
grant update (cantidad) on detalles_pedidos to authenticated;

grant select on historial_estados_pedido to authenticated;
grant select on pedidos_con_total to authenticated;

-- 3) Politicas de pedidos. El cliente no tiene ninguna politica de UPDATE: confirma con confirmar_pedido().
drop policy if exists "ver_pedidos" on pedidos;
create policy "ver_pedidos" on pedidos
  for select to authenticated
  using (
    (select auth.uid()) = cliente_id
    or exists (select 1 from admin_practica where id = (select auth.uid()))
  );

drop policy if exists "crear_carrito" on pedidos;
create policy "crear_carrito" on pedidos
  for insert to authenticated
  with check ( (select auth.uid()) = cliente_id );

drop policy if exists "vaciar_carrito" on pedidos;
create policy "vaciar_carrito" on pedidos
  for delete to authenticated
  using ( (select auth.uid()) = cliente_id and estado = 'carrito' );

drop policy if exists "admin_actualiza_estado" on pedidos;
create policy "admin_actualiza_estado" on pedidos
  for update to authenticated
  using ( exists (select 1 from admin_practica where id = (select auth.uid())) )
  with check ( exists (select 1 from admin_practica where id = (select auth.uid())) );

-- 4) Politicas de detalles_pedidos: dependen del pedido padre.
--    La subconsulta sobre pedidos tambien pasa por sus politicas: solo "ve" los pedidos propios (o todos, si es admin).
drop policy if exists "ver_detalles" on detalles_pedidos;
create policy "ver_detalles" on detalles_pedidos
  for select to authenticated
  using ( exists (select 1 from pedidos p where p.id = detalles_pedidos.pedido_id) );

drop policy if exists "agregar_detalle" on detalles_pedidos;
create policy "agregar_detalle" on detalles_pedidos
  for insert to authenticated
  with check (
    exists (select 1 from pedidos p
            where p.id = detalles_pedidos.pedido_id
              and p.cliente_id = (select auth.uid())
              and p.estado = 'carrito')
  );

drop policy if exists "cambiar_cantidad" on detalles_pedidos;
create policy "cambiar_cantidad" on detalles_pedidos
  for update to authenticated
  using (
    exists (select 1 from pedidos p
            where p.id = detalles_pedidos.pedido_id
              and p.cliente_id = (select auth.uid())
              and p.estado = 'carrito')
  )
  with check (
    exists (select 1 from pedidos p
            where p.id = detalles_pedidos.pedido_id
              and p.cliente_id = (select auth.uid())
              and p.estado = 'carrito')
  );

drop policy if exists "quitar_detalle" on detalles_pedidos;
create policy "quitar_detalle" on detalles_pedidos
  for delete to authenticated
  using (
    exists (select 1 from pedidos p
            where p.id = detalles_pedidos.pedido_id
              and p.cliente_id = (select auth.uid())
              and p.estado = 'carrito')
  );

-- 5) Politica del historial: solo lo lee un administrador.
drop policy if exists "ver_historial_admin" on historial_estados_pedido;
create policy "ver_historial_admin" on historial_estados_pedido
  for select to authenticated
  using ( exists (select 1 from admin_practica where id = (select auth.uid())) );

-- 6) Comprobar: 4 politicas en pedidos, 4 en detalles_pedidos y 1 en el historial.
select tablename, policyname, cmd from pg_policies
where tablename in ('pedidos', 'detalles_pedidos', 'historial_estados_pedido')
order by tablename, cmd;
