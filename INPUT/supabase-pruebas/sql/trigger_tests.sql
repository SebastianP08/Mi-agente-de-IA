-- =====================================================================
-- Prueba de los triggers de estado: pegalo en Supabase -> SQL Editor -> Run.
-- NO deja datos: el error final es a proposito y deshace todo.
-- El texto de ese error trae el resultado de la prueba.
--
-- Resultado esperado:
--   1) OK, bloqueo: Transicion de estado no permitida: carrito -> entregado
--   2) OK, carrito -> confirmado
--   3) Historial: null -> carrito | carrito -> confirmado
--
-- Nota: en el SQL Editor corres como postgres (se salta RLS) y auth.uid()
-- es nulo, asi que cambiado_por sale vacio. Esto valida los triggers,
-- no las politicas.
-- =====================================================================

do $$
declare
  v_cliente uuid;
  v_pedido  bigint;
  v_msg     text := '';
  v_hist    text;
begin
  -- Un cliente que no tenga carrito abierto (por el indice unico)
  select c.id into v_cliente
  from clientes_practica c
  where not exists (select 1 from pedidos p where p.cliente_id = c.id and p.estado = 'carrito')
  limit 1;

  if v_cliente is null then
    raise exception 'No hay un cliente sin carrito abierto para probar';
  end if;

  insert into pedidos (cliente_id) values (v_cliente) returning id into v_pedido;

  -- 1) Transicion invalida: carrito -> entregado (debe fallar)
  begin
    update pedidos set estado = 'entregado' where id = v_pedido;
    v_msg := v_msg || E'\n1) MAL: dejo pasar carrito -> entregado';
  exception when others then
    v_msg := v_msg || E'\n1) OK, bloqueo: ' || sqlerrm;
  end;

  -- 2) Transicion valida: carrito -> confirmado
  update pedidos set estado = 'confirmado' where id = v_pedido;
  v_msg := v_msg || E'\n2) OK, carrito -> confirmado';

  -- 3) Historial
  select string_agg(coalesce(estado_anterior, 'null') || ' -> ' || estado_nuevo, ' | ' order by id)
    into v_hist
  from historial_estados_pedido where pedido_id = v_pedido;
  v_msg := v_msg || E'\n3) Historial: ' || v_hist;

  -- Error final a proposito: deshace todo lo creado en la prueba
  raise exception E'RESULTADO DE LA PRUEBA (se hizo rollback):%', v_msg;
end;
$$;
