-- =====================================================================
-- Pedidos: pégalo completo en Supabase → SQL Editor → Run.
-- Crea 2 tablas, 1 función, 1 trigger y las políticas de RLS.
-- =====================================================================


-- ---------- 1. Tabla de pedidos (la "cabecera" del pedido) ----------
-- Un pedido = una compra. Los productos de esa compra van en otra tabla
-- (pedido_items_practica), porque un pedido puede tener VARIOS productos.
-- Esa separación es la relación "uno a muchos": 1 pedido → N items.
create table if not exists pedidos_practica (
  id              bigint generated always as identity primary key,

  -- default auth.uid(): si el insert no manda cliente_id, Supabase pone
  -- solo el id del usuario con sesión. Igual la política de INSERT
  -- (más abajo) revisa que coincida, para que nadie cree pedidos a nombre de otro
  cliente_id      uuid not null default auth.uid() references auth.users (id),

  -- check: la base de datos SOLO acepta estos 4 valores. Si alguien manda
  -- 'enviado' o 'perdido', el insert/update falla. Es la lista de etapas
  -- que dibuja el camión en pedido.html
  estado          text not null default 'pagado'
                  check (estado in ('pagado', 'preparando', 'en_camino', 'entregado')),

  -- Datos de envío copiados al momento de comprar: si el cliente cambia su
  -- dirección mañana, este pedido sigue diciendo a dónde se mandó
  nombre_envio    text not null,
  telefono_envio  text,
  direccion_envio text not null,
  ciudad_envio    text not null,

  metodo_pago     text not null check (metodo_pago in ('tarjeta', 'pse', 'contraentrega')),
  ultimos_digitos text,            -- solo los 4 últimos de la tarjeta, NUNCA el número completo

  total           numeric not null check (total >= 0),

  -- Una fecha por etapa: las llena el trigger de abajo, no el JS
  created_at      timestamptz not null default now(),
  preparando_at   timestamptz,
  en_camino_at    timestamptz,
  entregado_at    timestamptz
);


-- ---------- 2. Tabla de items (cada producto dentro del pedido) ----------
create table if not exists pedido_items_practica (
  id              bigint generated always as identity primary key,

  -- on delete cascade: si se borra el pedido, se borran sus items solos
  pedido_id       bigint not null references pedidos_practica (id) on delete cascade,

  -- on delete set null: si el admin borra el producto del catálogo, el
  -- item del pedido NO se borra (el cliente igual lo compró), solo pierde el enlace
  producto_id     bigint references productos_practica (id) on delete set null,

  -- "Foto" del producto al momento de comprar. Si mañana el admin le sube
  -- el precio o le cambia el nombre, el pedido sigue mostrando lo que se pagó
  nombre          text not null,
  img_url         text,
  descripcion     text,
  categorias      text[],
  precio_unitario numeric not null check (precio_unitario >= 0),   -- ya con descuento
  descuento       numeric not null default 0,
  cantidad        int not null check (cantidad > 0)
);


-- ---------- 3. ¿El usuario actual es admin? ----------
-- security definer = la función corre con permisos del dueño (no del
-- usuario), así puede leer admin_practica aunque su RLS no lo deje.
-- Sin esto, las políticas de abajo podrían fallar en silencio.
create or replace function es_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from admin_practica where id = auth.uid());
$$;


-- ---------- 4. Trigger: poner la fecha de cada etapa sola ----------
-- Un trigger es código que la base de datos corre SOLA antes/después de
-- un insert/update. Aquí: cuando el estado cambia, guarda la hora de la
-- nueva etapa. Así el admin solo cambia el estado y la fecha nunca se olvida.
create or replace function marcar_fecha_estado()
returns trigger
language plpgsql
as $$
begin
  -- new = la fila como va a quedar; old = como estaba antes
  if new.estado is distinct from old.estado then
    if new.estado = 'preparando' and new.preparando_at is null then new.preparando_at := now(); end if;
    if new.estado = 'en_camino'  and new.en_camino_at  is null then new.en_camino_at  := now(); end if;
    if new.estado = 'entregado'  and new.entregado_at  is null then new.entregado_at  := now(); end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_marcar_fecha_estado on pedidos_practica;
create trigger trg_marcar_fecha_estado
  before update on pedidos_practica
  for each row execute function marcar_fecha_estado();


-- ---------- 5. RLS ----------
alter table pedidos_practica      enable row level security;
alter table pedido_items_practica enable row level security;

-- Pedidos ------------------------------------------------------------
drop policy if exists "cliente ve sus pedidos"   on pedidos_practica;
drop policy if exists "cliente crea su pedido"   on pedidos_practica;
drop policy if exists "admin ve todos"           on pedidos_practica;
drop policy if exists "admin cambia estado"      on pedidos_practica;

-- El cliente solo LEE las filas donde él es el dueño
create policy "cliente ve sus pedidos" on pedidos_practica
  for select using (cliente_id = auth.uid());

-- El cliente solo CREA pedidos a su nombre y en la primera etapa.
-- No puede crear uno que ya diga 'entregado'
create policy "cliente crea su pedido" on pedidos_practica
  for insert with check (cliente_id = auth.uid() and estado = 'pagado');

-- El admin lee todos y es el ÚNICO que puede actualizar (cambiar etapa).
-- Como no hay política de UPDATE para clientes, un cliente que intente
-- cambiar su estado con curl recibe 0 filas actualizadas
create policy "admin ve todos" on pedidos_practica
  for select using (es_admin());

create policy "admin cambia estado" on pedidos_practica
  for update using (es_admin()) with check (es_admin());

-- Items --------------------------------------------------------------
drop policy if exists "ver items de mis pedidos"    on pedido_items_practica;
drop policy if exists "crear items en mi pedido"    on pedido_items_practica;
drop policy if exists "admin ve todos los items"    on pedido_items_practica;

-- Los items no tienen cliente_id: se revisa a través del pedido al que
-- pertenecen (exists = "existe un pedido con ese id que sea mío")
create policy "ver items de mis pedidos" on pedido_items_practica
  for select using (
    exists (select 1 from pedidos_practica p
            where p.id = pedido_id and p.cliente_id = auth.uid())
  );

create policy "crear items en mi pedido" on pedido_items_practica
  for insert with check (
    exists (select 1 from pedidos_practica p
            where p.id = pedido_id and p.cliente_id = auth.uid() and p.estado = 'pagado')
  );

create policy "admin ve todos los items" on pedido_items_practica
  for select using (es_admin());
