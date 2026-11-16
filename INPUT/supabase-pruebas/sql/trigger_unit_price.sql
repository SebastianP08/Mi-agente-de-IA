-- =====================================================================
-- Precio fijado por la base de datos (guia 4.4): pegalo en Supabase ->
-- SQL Editor -> Run. Se puede correr varias veces sin romper nada.
--
-- El precio NO lo manda el navegador: el trigger lo copia desde
-- productos_practica (precio con descuento) y sobrescribe lo que llegue.
-- Asi el precio queda congelado en la linea del pedido.
--
-- IMPORTANTE: la formula supone que descuento es una FRACCION (0.15 = 15 %).
-- Si guardas descuentos como 15, el precio saldria negativo. Revisalo con:
--   select nombre, precio, descuento from productos_practica;
-- =====================================================================

create or replace function public.fijar_precio_unitario()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_precio bigint;
  v_existe boolean;
begin
  select true,
         round(p.precio * (1 - coalesce(p.descuento, 0)))::bigint
    into v_existe, v_precio
    from productos_practica p
   where p.id = new.producto_id;

  if v_existe is null then
    raise exception 'Producto % no encontrado', new.producto_id;
  end if;
  if v_precio is null then
    raise exception 'Producto % no tiene precio definido', new.producto_id;
  end if;

  new.precio_unitario := v_precio;
  return new;
end;
$$;

-- Corre en INSERT y tambien en UPDATE de producto_id / precio_unitario
-- (un UPDATE de solo la cantidad no lo dispara).
drop trigger if exists detalles_pedidos_fijar_precio on public.detalles_pedidos;

create trigger detalles_pedidos_fijar_precio
before insert or update of producto_id, precio_unitario on public.detalles_pedidos
for each row execute function public.fijar_precio_unitario();
