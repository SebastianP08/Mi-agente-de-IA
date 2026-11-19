-- =====================================================================
-- Vista pedidos_con_total: pegalo en Supabase -> SQL Editor -> Run.
-- Se puede correr varias veces sin romper nada (drop view if exists).
--
-- El total se calcula en la base de datos, nunca se confia al navegador.
--
-- Desde el JS se lee como si fuera una tabla:
--   const { data, error } = await supabase
--     .from('pedidos_con_total').select('*').eq('id', pedidoId).single();
-- =====================================================================

-- drop + create en vez de "create or replace": p.* se expande al crear la vista.
-- Si mañana se agrega una columna a pedidos, "or replace" fallaria porque
-- cambiaria el orden de las columnas (total ya no quedaria al final).
drop view if exists public.pedidos_con_total;

-- security_invoker: la vista respeta las politicas RLS de quien la consulta.
-- Sin esto la vista correria como su dueno (postgres) y cualquier cliente
-- veria los pedidos de todos.
create view public.pedidos_con_total
with (security_invoker = true)
as
-- left join: un carrito vacio tambien aparece, con total 0 (coalesce).
-- group by p.id basta para usar p.*: id es la clave primaria de pedidos.
select p.*, coalesce(sum(d.cantidad * d.precio_unitario), 0)::bigint as total
  from pedidos p
  left join detalles_pedidos d on d.pedido_id = p.id
 group by p.id;

-- Permisos: igual que en pedidos_rls.sql, anon no ve nada y authenticated
-- solo lee. Supabase da permisos por defecto a las vistas nuevas, por eso
-- se quitan primero y se devuelve solo el select.
revoke all on public.pedidos_con_total from anon, authenticated;
grant select on public.pedidos_con_total to authenticated;

-- Comprobar: debe salir security_invoker=true en las opciones de la vista.
select relname as vista, reloptions as opciones
from pg_class
where relname = 'pedidos_con_total';
