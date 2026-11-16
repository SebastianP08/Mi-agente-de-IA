-- =====================================================================
-- Indices (guia 4.3): pegalo en Supabase -> SQL Editor -> Run.
-- Se puede correr varias veces sin romper nada (if not exists).
-- =====================================================================

-- Un cliente solo puede tener UN carrito abierto (indice unico parcial).
-- Solo cuenta las filas con estado = 'carrito'; los demas estados no tienen limite.
-- Si ya existen dos carritos de un mismo cliente, este indice falla al crearse.
-- Detectalos antes con:
--   select cliente_id, count(*) from pedidos
--   where estado = 'carrito' group by cliente_id having count(*) > 1;
create unique index if not exists pedidos_un_carrito_por_cliente
  on public.pedidos (cliente_id)
  where estado = 'carrito';

-- Postgres NO crea indices automaticamente en las columnas de una clave foranea.
-- (detalles_pedidos.pedido_id ya queda cubierta por UNIQUE (pedido_id, producto_id)).
create index if not exists pedidos_cliente_id_idx
  on public.pedidos (cliente_id);

create index if not exists detalles_pedidos_producto_id_idx
  on public.detalles_pedidos (producto_id);

create index if not exists historial_estados_pedido_pedido_id_idx
  on public.historial_estados_pedido (pedido_id);

-- Comprobar: deben salir 4 filas.
select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'pedidos_un_carrito_por_cliente',
    'pedidos_cliente_id_idx',
    'detalles_pedidos_producto_id_idx',
    'historial_estados_pedido_pedido_id_idx'
  );
