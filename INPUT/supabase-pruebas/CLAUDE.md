# supabase-pruebas — Contexto del proyecto

## Qué es esto
Prácticas de Supabase (Lenguaje Digital 4) para una tienda con catálogo, carrito y pedidos.
El proyecto de diseño asociado es **Jaziz**: https://github.com/SebastianP08/Jaziz (repo privado; requiere iniciar sesión en GitHub para clonarlo).

## Cómo responder
- Español, tono cercano, directo, sin relleno motivacional.
- Código, nombres de archivo y variables en inglés; comentarios del SQL en español.
- Antes de una tarea de varios pasos: plan en 3–5 viñetas y esperar confirmación.
- No inventar datos del esquema: la fuente de verdad es `sql/current_schema.json`. Si algo no está ahí, preguntar o consultarlo en Supabase.

## Estructura
- `*.html`, `css/`, `js/` — frontend (`js/supabaseClient.js` crea el cliente de Supabase).
- `sql/` — scripts para pegar en Supabase → SQL Editor (todos se pueden correr varias veces).

| Archivo | Qué hace |
|---|---|
| `sql/current_schema.json` | Esquema real de la base: columnas, restricciones, RLS y políticas |
| `sql/clientes.sql` | Protección de `clientes_practica` |
| `sql/pedidos.sql` | Script inicial de pedidos (revisar: menciona `pedidos_practica`, que no aparece en el esquema actual) |
| `sql/pedidos_rls.sql` | RLS, permisos por columna y políticas de pedidos, detalles e historial |
| `sql/indexes.sql` | Guía 4.3: índice único parcial de carrito + 3 índices en claves foráneas |
| `sql/trigger_unit_price.sql` | Guía 4.4: la base fija `precio_unitario` desde `productos_practica` |
| `sql/trigger_order_status.sql` | Transiciones de estado válidas + historial automático |
| `sql/trigger_tests.sql` | Prueba de los triggers; termina en error a propósito (rollback) |

## Modelo de datos (resumen)
Tablas: `admin_practica`, `clientes_practica`, `productos_practica`, `pedidos`, `detalles_pedidos`, `historial_estados_pedido`. RLS activo en todas.

Reglas de negocio ya implementadas:
- Un cliente solo puede tener **un carrito abierto** (`estado = 'carrito'`).
- El **precio lo fija la base de datos**, nunca el navegador (`round(precio * (1 - descuento))`; `descuento` es una fracción).
- Transiciones permitidas: `carrito → confirmado | cancelado`, `confirmado → enviado | cancelado`, `enviado → entregado | cancelado`. `entregado` y `cancelado` son finales.
- Cada creación o cambio de estado queda en `historial_estados_pedido`.
- Los permisos por columna (`grant update (cantidad)`, `grant update (estado)`) limitan lo que el cliente puede editar.

## Pendiente
- El cliente aún no puede pasar `carrito → confirmado`: solo el admin tiene política de `UPDATE` sobre `pedidos`.
- **Función atómica** (se verá en clase): confirmar pedido validando y descontando stock en una sola transacción (`rpc`), con `security definer` y comprobando que el pedido sea del usuario.
- Posible: llenar `confirmado_en` automáticamente al confirmar.
- Fusionar con el HTML/diseño de Jaziz.

## Seguridad
- Las claves van en un `.env` que no se sube al repo. La `anon key` es pública por diseño; la `service_role` nunca va en el frontend ni en un repo.
- En el SQL Editor se corre como `postgres` (se salta RLS) y `auth.uid()` es nulo: sirve para probar triggers, no políticas.
- En un PC compartido (clase): cerrar sesión de GitHub y borrar credenciales guardadas al terminar.
