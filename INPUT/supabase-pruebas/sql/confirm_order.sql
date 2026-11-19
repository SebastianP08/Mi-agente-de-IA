-- =====================================================================
-- Confirmar pedido (funcion atomica): pegalo en Supabase -> SQL Editor -> Run.
-- Se puede correr varias veces sin romper nada (create or replace).
--
-- Confirmar es UNA operacion atomica: valida, descuenta stock, fija precios
-- y cambia el estado. O todo ocurre, o no ocurre nada (si algo falla,
-- Postgres deshace lo que ya habia hecho).
--
-- Desde el JS:
--   const { data, error } = await supabase.rpc('confirmar_pedido', {
--     p_pedido_id: 12, p_envio: true,
--     p_direccion: 'Calle 1 # 2-3', p_telefono: '3001234567', p_observacion: null
--   });
--
-- Se apoya en lo que ya existe:
--   - trigger_order_status.sql: valida carrito -> confirmado y escribe el historial
--   - trigger_unit_price.sql:   recalcula precio_unitario al actualizarlo
-- =====================================================================

-- security definer: corre con permisos del dueno, asi puede descontar stock en
-- productos_practica y actualizar pedidos aunque RLS y los permisos por columna
-- no se lo dejen al cliente. Por eso TODA la seguridad va dentro de la funcion.
create or replace function public.confirmar_pedido(
  p_pedido_id   bigint,
  p_envio       boolean,
  p_direccion   text default null,  -- default null: para recoger en tienda
  p_telefono    text default null,  -- no hace falta mandar estos tres
  p_observacion text default null
)
returns pedidos
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_pedido pedidos;
  v_envio  boolean := coalesce(p_envio, false);  -- envio es NOT NULL en pedidos
  d        record;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion';
  end if;

  -- Bloquea la fila del pedido: dos confirmaciones simultaneas no pueden pisarse.
  -- cliente_id = auth.uid(): solo el dueno confirma su propio carrito.
  select * into v_pedido
    from pedidos
   where id = p_pedido_id and cliente_id = auth.uid() and estado = 'carrito'
     for update;

  if not found then
    raise exception 'Pedido no encontrado o ya confirmado';
  end if;

  if not exists (select 1 from detalles_pedidos where pedido_id = p_pedido_id) then
    raise exception 'El carrito esta vacio';
  end if;

  if v_envio and (coalesce(trim(p_direccion), '') = '' or coalesce(trim(p_telefono), '') = '') then
    raise exception 'Para envio a domicilio se requieren direccion y telefono';
  end if;

  -- Descuenta el stock producto por producto, siempre en el mismo orden (evita bloqueos cruzados).
  -- "for update" bloquea tambien las lineas: nadie cambia la cantidad a mitad de la confirmacion.
  -- El "where unidades >= cantidad" impide que dos clientes compren la ultima unidad a la vez.
  -- (disponible y unidades admiten null: un null cuenta como "no se puede vender").
  for d in
    select producto_id, cantidad
      from detalles_pedidos
     where pedido_id = p_pedido_id
     order by producto_id
       for update
  loop
    update productos_practica
       set unidades = unidades - d.cantidad
     where id = d.producto_id and disponible and unidades >= d.cantidad;

    if not found then
      raise exception 'Stock insuficiente o producto no disponible (producto %)', d.producto_id;
    end if;
  end loop;

  -- Precio definitivo: el de este momento (mientras estaba en el carrito era provisional).
  -- El trigger detalles_pedidos_fijar_precio hace el mismo calculo al tocar precio_unitario,
  -- asi que el resultado es identico; se deja explicito para que se lea en la funcion.
  update detalles_pedidos dp
     set precio_unitario = round(p.precio * (1 - coalesce(p.descuento, 0)))::bigint
    from productos_practica p
   where p.id = dp.producto_id and dp.pedido_id = p_pedido_id;

  -- Este update dispara los triggers de estado: valida la transicion y escribe el historial
  -- (cambiado_por = auth.uid(), el cliente que confirmo).
  update pedidos
     set estado        = 'confirmado',
         envio         = v_envio,
         direccion     = nullif(trim(p_direccion), ''),
         telefono      = nullif(trim(p_telefono), ''),
         observacion   = nullif(trim(p_observacion), ''),
         confirmado_en = now()
   where id = p_pedido_id
  returning * into v_pedido;

  return v_pedido;
end;
$fn$;

-- Por defecto cualquiera podria llamarla: se limita a usuarios con sesion.
revoke all on function public.confirmar_pedido(bigint, boolean, text, text, text) from public, anon;
grant execute on function public.confirmar_pedido(bigint, boolean, text, text, text) to authenticated;

-- Comprobar: debe salir 1 fila con security_definer = true.
select proname, prosecdef as security_definer, pg_get_function_arguments(oid) as argumentos
from pg_proc
where proname = 'confirmar_pedido';
