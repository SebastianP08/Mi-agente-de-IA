-- =====================================================================
-- Verificar el flujo de pedidos: pegalo en Supabase -> SQL Editor -> Run.
-- Solo LEE, no cambia nada. Correlo despues de cada paso de la prueba
-- (agregar, quitar, confirmar) y compara con lo que ves en la pagina.
--
-- Cambia el correo de abajo por el del cliente con el que estas probando
-- (aparece en las 4 consultas).
-- =====================================================================


-- 1) Pedidos del cliente, del mas nuevo al mas viejo, con el total que
--    calcula la vista. Despues de AGREGAR debe haber uno en 'carrito';
--    despues de CONFIRMAR ese mismo id pasa a 'confirmado' con confirmado_en.
select p.id, p.estado, p.envio, p.direccion, p.telefono, p.observacion,
       p.total, p.created_at, p.confirmado_en
from pedidos_con_total p
join auth.users u on u.id = p.cliente_id
where u.email = 'correo@ejemplo.com'
order by p.id desc
limit 5;


-- 2) Lineas del pedido mas reciente. Debe coincidir con el panel del carrito:
--    mismos productos y cantidades. precio_unitario lo puso el trigger.
select d.id as detalle_id, d.producto_id, pr.nombre, d.cantidad,
       d.precio_unitario, d.cantidad * d.precio_unitario as subtotal
from detalles_pedidos d
join productos_practica pr on pr.id = d.producto_id
where d.pedido_id = (
  select p.id from pedidos p
  join auth.users u on u.id = p.cliente_id
  where u.email = 'correo@ejemplo.com'
  order by p.id desc limit 1
)
order by d.producto_id;


-- 3) Historial del pedido mas reciente: null -> carrito al crearlo y
--    carrito -> confirmado al confirmar. cambiado_por = id del cliente.
select h.estado_anterior, h.estado_nuevo, h.cambiado_por, h.cambiado_en
from historial_estados_pedido h
where h.pedido_id = (
  select p.id from pedidos p
  join auth.users u on u.id = p.cliente_id
  where u.email = 'correo@ejemplo.com'
  order by p.id desc limit 1
)
order by h.id;


-- 4) Stock de los productos del pedido mas reciente. Anota las unidades
--    ANTES de confirmar: despues deben bajar exactamente en la cantidad pedida.
select pr.id, pr.nombre, pr.unidades, pr.disponible
from productos_practica pr
where pr.id in (
  select d.producto_id from detalles_pedidos d
  where d.pedido_id = (
    select p.id from pedidos p
    join auth.users u on u.id = p.cliente_id
    where u.email = 'correo@ejemplo.com'
    order by p.id desc limit 1
  )
)
order by pr.id;
