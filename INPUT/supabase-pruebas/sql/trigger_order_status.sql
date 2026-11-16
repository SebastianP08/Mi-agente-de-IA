-- =====================================================================
-- Estados del pedido: pegalo en Supabase -> SQL Editor -> Run.
-- Se puede correr varias veces sin romper nada.
--
-- 1) validar_transicion_estado: solo se permiten ciertas transiciones
--    (los pedidos no se borran: se cancelan).
--      carrito    -> confirmado | cancelado
--      confirmado -> enviado    | cancelado
--      enviado    -> entregado  | cancelado
--    'entregado' y 'cancelado' son estados finales.
-- 2) registrar_cambio_estado: cada creacion o cambio de estado queda en
--    historial_estados_pedido.
--
-- Pendiente (no esta en este archivo): hoy solo el admin tiene politica de
-- UPDATE sobre pedidos, asi que el cliente no puede pasar carrito ->
-- confirmado. Eso se resuelve con una politica o con la funcion atomica.
-- =====================================================================

-- ---------- 1. Validar transiciones ----------
create or replace function public.validar_transicion_estado()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.estado = old.estado then
    return new;
  end if;

  if (old.estado, new.estado) in (
    ('carrito', 'confirmado'),  ('carrito', 'cancelado'),
    ('confirmado', 'enviado'),  ('confirmado', 'cancelado'),
    ('enviado', 'entregado'),   ('enviado', 'cancelado')
  ) then
    return new;
  end if;

  raise exception 'Transicion de estado no permitida: % -> %', old.estado, new.estado;
end;
$$;

drop trigger if exists pedidos_validar_transicion on public.pedidos;
create trigger pedidos_validar_transicion
before update of estado on public.pedidos
for each row execute function public.validar_transicion_estado();

-- ---------- 2. Registrar historial ----------
-- security definer: escribe en el historial aunque quien cambia el estado
-- no tenga permiso directo sobre esa tabla. auth.uid() sigue devolviendo
-- al usuario que hizo la peticion.
create or replace function public.registrar_cambio_estado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into historial_estados_pedido (pedido_id, estado_anterior, estado_nuevo, cambiado_por)
    values (new.id, null, new.estado, auth.uid());
  else
    insert into historial_estados_pedido (pedido_id, estado_anterior, estado_nuevo, cambiado_por)
    values (new.id, old.estado, new.estado, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists pedidos_historial_alta on public.pedidos;
create trigger pedidos_historial_alta
after insert on public.pedidos
for each row execute function public.registrar_cambio_estado();

drop trigger if exists pedidos_historial_cambio on public.pedidos;
create trigger pedidos_historial_cambio
after update of estado on public.pedidos
for each row
when (old.estado is distinct from new.estado)
execute function public.registrar_cambio_estado();
