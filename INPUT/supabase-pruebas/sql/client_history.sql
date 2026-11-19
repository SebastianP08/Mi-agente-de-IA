-- =====================================================================
-- Historial visible para el cliente: pegalo en Supabase -> SQL Editor -> Run.
-- Se puede correr varias veces (drop policy if exists).
--
-- Para que el seguimiento de pedido.html muestre la FECHA de cada etapa
-- (confirmado, enviado, entregado), el cliente necesita leer el historial
-- de SUS pedidos. Hoy solo el admin puede (ver_historial_admin).
-- Sin este script la pagina funciona igual, pero solo muestra la fecha
-- de confirmado.
-- =====================================================================

-- Dos politicas SELECT se suman con OR: el admin sigue viendo todo y el
-- cliente ve solo las filas cuyo pedido es suyo.
drop policy if exists ver_mi_historial on historial_estados_pedido;
create policy ver_mi_historial on historial_estados_pedido
  for select to authenticated
  using (
    exists (select 1 from pedidos p
            where p.id = historial_estados_pedido.pedido_id
              and p.cliente_id = (select auth.uid()))
  );

-- (grant select ya existe desde pedidos_rls.sql; escribir sigue prohibido:
-- solo el trigger registrar_cambio_estado, que es security definer)

-- Comprobar: deben salir ver_historial_admin y ver_mi_historial.
select policyname, cmd from pg_policies
where tablename = 'historial_estados_pedido';
