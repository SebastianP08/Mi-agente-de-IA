# Explicación de error — 2026-11-20

**Error:** `23503 — insert or update on table "pedidos" violates foreign key constraint "pedidos_cliente_id_fkey"` · `Key is not present in table "clientes_practica".`
**Dónde:** `js/catalogo.js` → `obtenerOCrearCarrito()` → `db.from('pedidos').insert({ cliente_id: usuario.id })` (en `galeria.html` y `cliente.html`).
**Tipo:** `logica`: el código está bien escrito, pero los datos no cumplen una regla de la base.

## Qué significa
- Una **foreign key** obliga a que cada `pedidos.cliente_id` exista como `id` en `clientes_practica` (`FOREIGN KEY (cliente_id) REFERENCES clientes_practica(id)`, en `sql/current_schema.json`).
- El usuario con sesión **sí existe en Auth** (`auth.users`), pero **no tiene fila en `clientes_practica`**. Por eso la base rechaza el pedido.

## Causas posibles
1. **Hay una sesión de admin abierta.** La sesión de Supabase la comparten todas las páginas del mismo sitio. Si entraste en `admin.html` y después abriste la galería, el usuario es el admin, y el admin vive en `admin_practica`, no en `clientes_practica`.
2. **El registro quedó a medias.** `signUp()` creó el usuario en Auth, pero el `insert` en `clientes_practica` falló (p. ej. con la confirmación por correo activa no hay sesión todavía, y la política `crear_mi_perfil` lo bloquea).

## Solución
- Diagnosticar con `sql/check_missing_profiles.sql` (solo lectura).
- Si es la causa 1: cerrar sesión y entrar con una cuenta de cliente.
- Si es la causa 2: crear la fila que falta (parte 2 del mismo script).
