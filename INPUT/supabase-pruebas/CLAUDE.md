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
- `js/perfilMenu.js` + `css/perfil.css` — círculo de perfil del cliente en `galeria.html`, `pago.html` y `pedido.html` (`cliente.html` usa el suyo en `cliente.js`).
- `sql/` — scripts para pegar en Supabase → SQL Editor (todos se pueden correr varias veces).

| Archivo | Qué hace |
|---|---|
| `sql/current_schema.json` | Esquema real de la base: columnas, restricciones, RLS y políticas |
| `sql/export_schema.sql` | Solo lectura: genera el JSON de `current_schema.json` (más funciones, triggers, vistas, índices y permisos) |
| `sql/client_history.sql` | Política `ver_mi_historial`: el cliente lee el historial de sus pedidos (fechas del seguimiento) |
| `sql/check_order_flow.sql` | Solo lectura: pedidos, líneas, historial y stock del último pedido de un cliente (para verificar el flujo) |
| `sql/admin_products.sql` | Protección de `admin_practica` y `productos_practica` (sin auto-registro de admin, permisos mínimos) |
| `sql/clientes.sql` | Protección de `clientes_practica` |
| `sql/pedidos.sql` | Script inicial de pedidos (revisar: menciona `pedidos_practica`, que no aparece en el esquema actual) |
| `sql/pedidos_rls.sql` | RLS, permisos por columna y políticas de pedidos, detalles e historial |
| `sql/indexes.sql` | Guía 4.3: índice único parcial de carrito + 3 índices en claves foráneas |
| `sql/trigger_unit_price.sql` | Guía 4.4: la base fija `precio_unitario` desde `productos_practica` |
| `sql/trigger_order_status.sql` | Transiciones de estado válidas + historial automático |
| `sql/trigger_tests.sql` | Prueba de los triggers; termina en error a propósito (rollback) |
| `sql/confirm_order.sql` | Función atómica `confirmar_pedido` (rpc): valida, descuenta stock, fija precios y confirma |
| `sql/orders_with_total.sql` | Vista `pedidos_con_total` (`security_invoker`): total calculado en la base |

## Modelo de datos (resumen)
Tablas: `admin_practica`, `clientes_practica`, `productos_practica`, `pedidos`, `detalles_pedidos`, `historial_estados_pedido`. RLS activo en todas.

Reglas de negocio ya implementadas:
- Un cliente solo puede tener **un carrito abierto** (`estado = 'carrito'`).
- El **precio lo fija la base de datos**, nunca el navegador (`round(precio * (1 - descuento))`; `descuento` es una fracción).
- Transiciones permitidas: `carrito → confirmado | cancelado`, `confirmado → enviado | cancelado`, `enviado → entregado | cancelado`. `entregado` y `cancelado` son finales.
- Cada creación o cambio de estado queda en `historial_estados_pedido`.
- Los permisos por columna (`grant update (cantidad)`, `grant update (estado)`) limitan lo que el cliente puede editar.

- El cliente confirma con `rpc('confirmar_pedido', …)` (`security definer`): valida, descuenta stock, fija precios y llena `confirmado_en`. No tiene política de `UPDATE` sobre `pedidos`.
- El total se lee de la vista `pedidos_con_total` (`security_invoker`, respeta RLS).

## Adaptar los fragmentos de clase
El profe da fragmentos pensados para una plantilla genérica. Antes de aplicarlos, traducirlos a los nombres reales de este proyecto y avisar al estudiante de cada cambio:

| El fragmento dice | En este proyecto |
|---|---|
| Código del carrito en `galeria.js` | `js/catalogo.js` (compartido por `galeria.html` y `cliente.html`). `galeria.js` solo tiene tema y arranque |
| `carrito` = objeto `{ producto_id: cantidad }` | Array `[{ id, cantidad }]` guardado en `localStorage` (clave `carrito`, también la lee `js/pago.js`) |
| `actualizarCarrito()` | `renderizarCarrito()` |
| `cantidadesSeleccionadas` | No existe todavía |
| `asignarEventosTarjetas()` | No existe: un solo listener delegado en `#galeria` (`catalogo.js`) |
| Contador por tarjeta, `.btn-restar` / `.btn-sumar` | No existen: el botón de la tarjeta siempre agrega 1. Los +/− solo están en el panel del carrito (`.btn-cantidad`) |
| Texto del botón 'Agregar' | 'Agregar al carrito' |
| `#lista-carrito` | `#carrito-items` |
| "Cada archivo CSS usa variables distintas" | `galeria.html` y `cliente.html` comparten `css/catalogo.css` (componentes) y cada una define su paleta en `:root` con los mismos nombres de variables. Los campos usan `.catalogo-control` |
| Declarar elementos / listeners en `galeria.js` | En `catalogo.js` si tocan el carrito (lo comparten las dos páginas) |
| Tabla de productos `productos` | `productos_practica` (columna de imagen: `Img_url`, con mayúscula) |
| Tablas `clientes` / `admins` | `clientes_practica` / `admin_practica` |
| Cliente de Supabase `supabase` | `db` (en `js/supabaseClient.js`) |

En SQL: usar `create or replace` / `drop … if exists` para que el script se pueda repetir, **salvo** que el profe diga que el error es a propósito (ej. "policy already exists"): en ese caso dejar el original y avisar.

## Pendiente
- **Seguridad:** correr `sql/admin_products.sql` (quita la política `agregar`, que dejaba a cualquiera volverse admin, y deja permisos mínimos). Después el registro de admin en `admin.html` deja de funcionar a propósito: los admins se crean a mano desde el SQL Editor.
- Carrito en Supabase: pasos 1–8 hechos en `js/catalogo.js`. Arranque: `galeria.js` hace `const productosListos = cargarProductos(); cargarCarritoDesdeBD();`; `cliente.js` solo declara `productosListos` y deja que `mostrarEstadoSesion()` cargue o vacíe el carrito (paso 8). No llamar `cargarCarritoDesdeBD()` dos veces en la misma página. Sin sesión, `galeria.html` conserva el carrito de `localStorage` (modo demostración); `cliente.html` lo vacía. Falta: el botón + de `cambiarCantidad` solo cambia lo local.
- Pasos 6 y 7 hechos: el checkout vive en el panel del carrito (`#btn-checkout` + `#form-checkout`) y confirma con `rpc('confirmar_pedido', …)`; el total se lee de `pedidos_con_total`. Decidir qué hacer con `pago.html` / `pago.js` (quedaron sin uso).
- Admin: vistas "Pedidos" (Supabase, cambio de estado con botones según las transiciones válidas), "Mis clientes" y "Finanzas" (KPIs, pedidos por estado, top 5 productos) hechas en `admin.html`/`js/admin.js`; ya no usa `pedidosLocal.js`.
- Cliente: flujo panel → `pago.html` (confirma con `confirmar_pedido`; método de pago solo visual, no se guarda) → `pedido.html?id=N` (seguimiento `confirmado → enviado → entregado`, `cancelado` aparte) y `pedido.html` = "Mis pedidos". Todo desde Supabase; `pedidosLocal.js` ya no lo carga ninguna página (se puede borrar). Correr `sql/client_history.sql` para que el seguimiento muestre la fecha de cada etapa.
- Fusionar con el HTML/diseño de Jaziz.

## Plan: fusión con Jaziz
La idea es traer aquí todo el frontend de **Jaziz** (https://github.com/SebastianP08/Jaziz) y unirlo con el Supabase que ya está creado en este proyecto.

- **Quitar la lógica local de Jaziz:** Jaziz tiene su propio carrito en local (localStorage). Esa lógica se elimina y se reemplaza por la de este proyecto (`js/catalogo.js`: carrito en `pedidos` / `detalles_pedidos`, `confirmar_pedido`, `pedidos_con_total`). No mantener dos carritos.
- **Páginas:** algunas páginas de Jaziz se pueden quitar y quedarse con las que se hicieron aquí: galería, cliente, pago, pedido (seguimiento y "Mis pedidos") y admin. Del diseño de Jaziz se toma lo visual (paleta, tipografía, header, secciones), no la lógica.
- **WhatsApp:** Jaziz tiene "pago por WhatsApp". Eso **no** es el pago: el pago es `pago.html` → `confirmar_pedido`. El enlace de WhatsApp se puede conservar, pero en otro lugar (por ejemplo, contacto/soporte en el header o footer, o "¿Dudas con tu pedido?" en `pedido.html`).
- **Antes de fusionar:** revisar el repo de Jaziz (es privado, requiere sesión de GitHub) y hacer una lista de páginas/archivos: cuáles se quedan, cuáles se quitan y qué lógica local hay que borrar.

## Seguridad
- Las claves van en un `.env` que no se sube al repo. La `anon key` es pública por diseño; la `service_role` nunca va en el frontend ni en un repo.
- En el SQL Editor se corre como `postgres` (se salta RLS) y `auth.uid()` es nulo: sirve para probar triggers, no políticas.
- En un PC compartido (clase): cerrar sesión de GitHub y borrar credenciales guardadas al terminar.
