-- 1. RLS
alter table pedidos enable row level security;
alter table detalles_pedidos enable row level security;
alter table historial_estados_pedido enable row level security;

-- 2. Permisos por columna
-- (pedidos_con_total se agrega cuando exista la vista, junto con las funciones)
revoke all on pedidos, detalles_pedidos, historial_estados_pedido from anon, authenticated;
grant select, delete on pedidos to authenticated;
grant insert (cliente_id) on pedidos to authenticated;
grant update (estado) on pedidos to authenticated;
grant select, delete on detalles_pedidos to authenticated;
grant insert (pedido_id, producto_id, cantidad) on detalles_pedidos to authenticated;
grant update (cantidad) on detalles_pedidos to authenticated;
grant select on historial_estados_pedido to authenticated;

-- 3. Políticas de pedidos
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

-- 4. Políticas de detalles_pedidos
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

-- 5. Política del historial
drop policy if exists "ver_historial_admin" on historial_estados_pedido;
create policy "ver_historial_admin" on historial_estados_pedido
  for select to authenticated
  using ( exists (select 1 from admin_practica where id = (select auth.uid())) );

-- 6. Comprobar
select tablename, policyname, cmd from pg_policies
where tablename in ('pedidos', 'detalles_pedidos', 'historial_estados_pedido')
order by tablename, cmd;
