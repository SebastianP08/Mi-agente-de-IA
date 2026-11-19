// =====================================================================
// catalogo.js — catálogo de productos: tarjetas, búsqueda, filtros,
// modal y carrito. Lo usan galeria.html y cliente.html (vista Productos).
//
// Funciona porque las dos páginas tienen los MISMOS id en el HTML
// (galeria, input-busqueda, filtro-categoria, carrito-panel, modal-…).
// Este archivo NO arranca solo: cada página decide cuándo llamar a
// cargarProductos() y renderizarCarrito().
// Depende de: supabaseClient.js (db)
// =====================================================================

// ---------- Datos ----------
// Los productos se cargan desde Supabase (productos_practica).
// "db" lo crea supabaseClient.js, que se carga antes que este archivo.
let productos = [];

// Paso 5 de clase: como es async, cargarProductos() YA devuelve una promesa
// que termina cuando acaba (también si hubo error: el return la resuelve).
// El arranque la guarda en productosListos (galeria.js y cliente.js).
async function cargarProductos() {
  const { data, error } = await db.from('productos_practica').select('*');

  if (error) {
    galeria.innerHTML = '<p class="vacio">Error al cargar productos.</p>';
    return;
  }

  // Solo mostrar los disponibles en la galería pública
  productos = data;
  llenarFiltroCategoria();
  renderizarGaleria();
  // El carrito guardado solo tiene { id, cantidad }: para dibujarlo hace
  // falta el nombre, la foto y el precio, que llegan recién ahora
  renderizarCarrito();
}

// ---------- Utilidades ----------

function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
}

function precioFinal(producto) {
  if (producto.descuento > 0) return producto.precio * (1 - producto.descuento);
  return producto.precio;
}

function etiquetas(categorias) {
  return (categorias ?? []).map(c => `<span class="tag">${c}</span>`).join(' ');
}

// ---------- Tarjeta de producto ----------

function tarjetaProducto(p) {
  const foto = p.Img_url
    ? `<span class="card-bg" style="background-image: url('${p.Img_url}')"></span>
       <img src="${p.Img_url}" alt="" loading="lazy">`
    : '<span class="sin-imagen">Sin imagen</span>';

  const precioHTML = p.descuento > 0
    ? `${formatearPrecio(precioFinal(p))} <s class="price-original">${formatearPrecio(p.precio)}</s>`
    : formatearPrecio(p.precio);

  const botonTexto = p.disponible ? 'Agregar al carrito' : 'Agotado';
  const botonClass = p.disponible ? 'btn-agregar' : 'btn-agregar btn-secondary';
  const botonDisabled = p.disponible ? '' : 'disabled';

  return `
    <article class="product-card" data-producto-id="${p.id}" style="animation-delay: ${p._delay || 0}ms">
      <div class="product-card-media">
        ${foto}
        <div class="card-flags">
          <span class="badge badge--ok">${p.disponible ? 'Disponible' : ''}</span>
          ${p.descuento > 0 ? `<span class="card-descuento">-${Math.round(p.descuento * 100)}%</span>` : ''}
        </div>
        <div class="product-card-info">
          <h3>${p.nombre}</h3>
        </div>
      </div>
      <div class="product-card-body">
        <div class="card-fila">
          <span class="card-precio">${precioHTML}</span>
          <span class="card-stock">${p.unidades ?? 0} unid.</span>
        </div>
        ${p.descripcion ? `<p class="card-desc">${p.descripcion}</p>` : ''}
        <div>${etiquetas(p.categorias)}</div>
        <button type="button" class="${botonClass}" data-id="${p.id}" ${botonDisabled}>${botonTexto}</button>
      </div>
    </article>
  `;
}

// ---------- Renderizado y filtros ----------

const galeria         = document.getElementById('galeria');
const inputBusqueda   = document.getElementById('input-busqueda');
const filtroCategoria = document.getElementById('filtro-categoria');
const filtroOrden     = document.getElementById('filtro-orden');

function obtenerCategorias() {
  const set = new Set();
  productos.forEach(p => (p.categorias ?? []).forEach(c => set.add(c)));
  return [...set].sort();
}

function llenarFiltroCategoria() {
  // Limpiar opciones anteriores (menos la primera)
  while (filtroCategoria.options.length > 1) filtroCategoria.remove(1);

  const cats = obtenerCategorias();
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c.charAt(0).toUpperCase() + c.slice(1);
    filtroCategoria.appendChild(opt);
  });
}

function productosFiltrados() {
  const texto = inputBusqueda.value.trim().toLowerCase();
  const cat   = filtroCategoria.value;
  const orden = filtroOrden.value;

  let lista = productos.filter(p => {
    if (texto && !p.nombre.toLowerCase().includes(texto)) return false;
    if (cat && !(p.categorias ?? []).includes(cat)) return false;
    return true;
  });

  lista.sort((a, b) => {
    switch (orden) {
      case 'nombre':      return a.nombre.localeCompare(b.nombre);
      case 'nombre-desc': return b.nombre.localeCompare(a.nombre);
      case 'precio':      return precioFinal(a) - precioFinal(b);
      case 'precio-desc': return precioFinal(b) - precioFinal(a);
      default: return 0;
    }
  });

  return lista;
}

function renderizarGaleria() {
  const lista = productosFiltrados();
  if (lista.length === 0) {
    galeria.innerHTML = '<p class="vacio">No se encontraron productos.</p>';
    return;
  }
  lista.forEach((p, i) => p._delay = i * 60);
  galeria.innerHTML = lista.map(tarjetaProducto).join('');
}

inputBusqueda.addEventListener('input', renderizarGaleria);
filtroCategoria.addEventListener('change', renderizarGaleria);
filtroOrden.addEventListener('change', renderizarGaleria);

// Muestra 'Agregado' (verde) o 'Error' (rojo) en el botón durante 1,2 s.
// clearTimeout: si se hace clic otra vez antes de que pase el tiempo, el
// temporizador viejo no borra el color del resultado nuevo.
function mostrarResultadoBoton(btn, ok) {
  clearTimeout(btn._temporizador);
  btn.classList.remove('btn-agregar--ok', 'btn-agregar--error');
  btn.classList.add(ok ? 'btn-agregar--ok' : 'btn-agregar--error');
  btn.textContent = ok ? 'Agregado' : 'Error';

  btn._temporizador = setTimeout(() => {
    btn.classList.remove('btn-agregar--ok', 'btn-agregar--error');
    btn.textContent = 'Agregar al carrito';
  }, 1200);
}

// Delegación: clic en tarjeta (abrir modal) o en "Agregar al carrito".
// Paso 3 de clase: el fragmento habla de asignarEventosTarjetas(); aquí las
// tarjetas usan UN listener en #galeria (delegación), así que se cambia este.
galeria.addEventListener('click', async (e) => {
  // Si el clic fue en "Agregar al carrito", agregar y no abrir modal
  const btn = e.target.closest('.btn-agregar');
  if (btn) {
    if (btn.disabled) return;

    // Deshabilitado mientras espera a Supabase → un doble clic no agrega dos veces
    btn.disabled = true;
    // Las tarjetas no tienen contador (+/−): siempre se agrega 1
    const ok = await agregarAlCarrito(btn.dataset.id, 1);
    btn.disabled = false;

    mostrarResultadoBoton(btn, ok);
    renderizarCarrito(); // el fragmento dice actualizarCarrito()
    return;
  }

  // Si el clic fue en cualquier otra parte de la tarjeta, abrir modal
  const tarjeta = e.target.closest('.product-card');
  if (tarjeta) {
    const id = Number(tarjeta.dataset.productoId);
    abrirModal(id);
  }
});

// ---------- Modal de producto ----------

const modalOverlay = document.getElementById('modal-overlay');
const modalMedia   = document.getElementById('modal-media');
const modalBody    = document.getElementById('modal-body');

function abrirModal(idProducto) {
  const p = productos.find(prod => prod.id === idProducto);
  if (!p) return;

  const foto = p.Img_url
    ? `<span class="card-bg" style="background-image: url('${p.Img_url}')"></span>
       <img src="${p.Img_url}" alt="">`
    : '<span class="sin-imagen">Sin imagen</span>';

  modalMedia.innerHTML = `
    ${foto}
    <div class="modal-flags">
      ${p.descuento > 0 ? `<span class="card-descuento">-${Math.round(p.descuento * 100)}%</span>` : ''}
    </div>
  `;

  const precioHTML = p.descuento > 0
    ? `${formatearPrecio(precioFinal(p))} <s class="price-original">${formatearPrecio(p.precio)}</s>`
    : formatearPrecio(p.precio);

  const botonTexto = p.disponible ? 'Agregar al carrito' : 'Agotado';
  const botonDisabled = p.disponible ? '' : 'disabled';

  modalBody.innerHTML = `
    <h2>${p.nombre}</h2>
    <div class="card-fila">
      <span class="card-precio">${precioHTML}</span>
      <span class="card-stock">${p.unidades ?? 0} unidades disponibles</span>
    </div>
    ${p.descripcion ? `<p class="card-desc">${p.descripcion}</p>` : ''}
    <div>${etiquetas(p.categorias)}</div>
    <button type="button" class="btn-agregar-modal" data-id="${p.id}" ${botonDisabled}>${botonTexto}</button>
  `;

  modalOverlay.classList.add('visible');
}

function cerrarModal() {
  modalOverlay.classList.remove('visible');
}

document.getElementById('btn-cerrar-modal').addEventListener('click', cerrarModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) cerrarModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') cerrarModal();
});

// Agregar al carrito desde el modal
modalBody.addEventListener('click', async (e) => {
  const boton = e.target.closest('.btn-agregar-modal');
  if (boton && !boton.disabled) {
    cerrarModal();
    const ok = await agregarAlCarrito(boton.dataset.id, 1);
    renderizarCarrito();
    if (ok) abrirCarrito(); // desde el modal no hay botón donde mostrar el resultado
  }
});

// ---------- Carrito ----------

// El carrito se guarda en localStorage para que sobreviva al cambiar de
// página (galeria.html → pago.html). localStorage solo guarda TEXTO, por
// eso se usa JSON.stringify() al guardar y JSON.parse() al leer.
// pago.js lee esta misma clave "carrito".
function leerCarritoGuardado() {
  try {
    return JSON.parse(localStorage.getItem('carrito')) ?? [];
  } catch (_) {
    return []; // texto corrupto o localStorage bloqueado → carrito vacío
  }
}

function guardarCarrito() {
  try { localStorage.setItem('carrito', JSON.stringify(carrito)); } catch (_) {}
}

let carrito = leerCarritoGuardado();

// ---------- Carrito en Supabase (paso 1 de clase) ----------
// El fragmento del profe pone esto en galeria.js; aquí va en catalogo.js
// porque el carrito lo comparten galeria.html y cliente.html.
// "carrito" sigue siendo un array [{ id, cantidad }] (no un objeto) para
// no romper renderizarCarrito() ni pago.js.

// id del pedido de este cliente que está en estado 'carrito'
let pedidoId = null;
// { producto_id: id de su fila en detalles_pedidos } → para hacer update o
// delete de una línea sin tener que buscarla otra vez
const detalleIds = {};

// Usuario con sesión, o null. Sin sesión getUser() devuelve un error
// ("Auth session missing"): no es un fallo, solo significa "no hay usuario".
async function obtenerUsuario() {
  const { data, error } = await db.auth.getUser();
  if (error) return null;
  return data.user;
}

// id del pedido en estado 'carrito' de este cliente, o null.
// .maybeSingle(): 0 filas → data = null (con .single() sería un error).
async function buscarCarrito(usuario) {
  const { data, error } = await db
    .from('pedidos')
    .select('id')
    .eq('cliente_id', usuario.id)
    .eq('estado', 'carrito')
    .maybeSingle();

  if (error) {
    console.log('Error al buscar el carrito:', error);
    return null;
  }
  return data ? data.id : null;
}

async function obtenerOCrearCarrito(usuario) {
  if (pedidoId) return pedidoId;

  pedidoId = await buscarCarrito(usuario);
  if (pedidoId) return pedidoId;

  // SOLO cliente_id: el estado ('carrito') lo pone la base por default, y
  // el grant insert (cliente_id) no deja mandar ninguna otra columna.
  const { data, error } = await db
    .from('pedidos')
    .insert({ cliente_id: usuario.id })
    .select('id')
    .single();

  if (error) {
    // 23505 = unique violation: el índice pedidos_un_carrito_por_cliente dice
    // que ya hay un carrito abierto (doble clic u otra pestaña lo creó antes).
    // No es un fallo: el carrito existe, solo hay que buscarlo.
    if (error.code === '23505') {
      pedidoId = await buscarCarrito(usuario);
      return pedidoId;
    }
    console.log('Error al crear el carrito:', error);
    return null;
  }

  pedidoId = data.id;
  return pedidoId;
}

// Limpia el carrito local (por ejemplo, después de confirmar el pedido).
// El fragmento llama a actualizarCarrito(); aquí se llama renderizarCarrito(),
// que además guarda el carrito vacío en localStorage.
function vaciarCarritoLocal() {
  carrito = [];
  for (const id in detalleIds) delete detalleIds[id]; // const: se vacía, no se reasigna
  pedidoId = null;
  renderizarCarrito();
}

// Paso 5 de clase: el carrito sobrevive a una recarga porque se lee de Supabase.
// productosListos lo declara el arranque de cada página (galeria.js / cliente.js):
//   const productosListos = cargarProductos();
async function cargarCarritoDesdeBD() {
  // Sin productos no se puede dibujar el carrito (faltan nombre, foto y precio)
  await productosListos;

  const usuario = await obtenerUsuario();

  // Adaptación: el fragmento vacía ANTES de mirar la sesión. Aquí, sin sesión
  // se conserva el carrito de localStorage (modo demostración), porque
  // galeria.html → pago.html depende de él. Al cerrar sesión, cliente.js
  // llama a vaciarCarritoLocal() para no dejarle el carrito al siguiente.
  if (!usuario) return;

  // UNA sola consulta: el pedido y, anidadas, sus líneas. Supabase sabe
  // unirlas por la FK detalles_pedidos.pedido_id → pedidos.id
  const { data, error } = await db
    .from('pedidos')
    .select('id, detalles_pedidos(id, producto_id, cantidad)')
    .eq('cliente_id', usuario.id)
    .eq('estado', 'carrito')
    .maybeSingle();

  if (error) {
    console.log('Error al cargar el carrito:', error);
    return;
  }

  // Con sesión, Supabase es la fuente de verdad: lo local se descarta.
  // Se vacía DESPUÉS de la consulta y justo antes de llenar (sin ningún
  // await en medio): así, si dos cargas corren a la vez, la última
  // reemplaza a la primera en vez de sumarle sus productos.
  vaciarCarritoLocal();
  if (!data) return; // todavía no tiene carrito: se crea al agregar el primer producto

  pedidoId = data.id;
  for (const detalle of data.detalles_pedidos) {
    // El fragmento hace carrito[producto_id] = cantidad; aquí carrito es un array
    carrito.push({ id: detalle.producto_id, cantidad: detalle.cantidad });
    detalleIds[detalle.producto_id] = detalle.id;
  }
  renderizarCarrito(); // el fragmento dice actualizarCarrito()
}

const carritoPanel   = document.getElementById('carrito-panel');
const carritoOverlay = document.getElementById('carrito-overlay');
const carritoItems   = document.getElementById('carrito-items');
const carritoTotal   = document.getElementById('carrito-total-valor');
const carritoCount   = document.getElementById('carrito-count');

// Paso 6: el formulario de envío dentro del panel. El fragmento las declara
// en galeria.js; aquí van en catalogo.js porque cliente.html tiene el mismo panel
const btnCheckout    = document.getElementById('btn-checkout');
const formCheckout   = document.getElementById('form-checkout');
const mensajeCarrito = document.getElementById('mensaje-carrito');
const checkEnvio     = document.getElementById('checkout-envio');

function abrirCarrito() {
  carritoPanel.classList.add('abierto');
  carritoOverlay.classList.add('visible');
}

function cerrarCarrito() {
  carritoPanel.classList.remove('abierto');
  carritoOverlay.classList.remove('visible');
}

document.getElementById('btn-abrir-carrito').addEventListener('click', abrirCarrito);
document.getElementById('btn-cerrar-carrito').addEventListener('click', cerrarCarrito);
carritoOverlay.addEventListener('click', cerrarCarrito);

// Paso 2 de clase. Devuelve true si salió bien, false si falló.
// cantidad = 1 por defecto: los botones actuales llaman agregarAlCarrito(id).
async function agregarAlCarrito(id, cantidad = 1) {
  // En el fragmento el id llega como texto (btn.dataset.id). Aquí los botones
  // ya mandan Number(...), pero se convierte igual por si acaso.
  const idProducto = Number(id);
  const producto = productos.find(p => p.id === idProducto);
  if (!producto || !producto.disponible) return false;

  const existente = carrito.find(item => item.id === idProducto);
  const cantidadNueva = (existente ? existente.cantidad : 0) + cantidad;

  const usuario = await obtenerUsuario();

  // Sin sesión = modo demostración: solo el carrito local, nada en Supabase.
  if (usuario) {
    const idPedido = await obtenerOCrearCarrito(usuario);
    if (!idPedido) return false;

    if (detalleIds[idProducto]) {
      // Ya tiene línea → UPDATE de la cantidad.
      // .select() + data.length: si RLS bloquea el update NO da error, solo
      // actualiza 0 filas. Sin esta revisión creeríamos que funcionó.
      const { data, error } = await db
        .from('detalles_pedidos')
        .update({ cantidad: cantidadNueva })
        .eq('id', detalleIds[idProducto])
        .select();

      if (error || data.length === 0) {
        console.log('Error al cambiar la cantidad:', error ?? 'RLS bloqueó el update (0 filas)');
        return false;
      }
    } else {
      // Línea nueva → INSERT. NUNCA se manda el precio: lo pone el trigger
      // detalles_pedidos_fijar_precio (y el grant tampoco dejaría mandarlo).
      const { data, error } = await db
        .from('detalles_pedidos')
        .insert({ pedido_id: idPedido, producto_id: idProducto, cantidad })
        .select('id')
        .single();

      if (error) {
        console.log('Error al agregar el producto:', error);
        return false;
      }
      detalleIds[idProducto] = data.id;
    }
  }

  // Solo si todo salió bien se toca el carrito local.
  // No se dibuja aquí: quien llama decide (paso 3: el botón llama a
  // renderizarCarrito() después de mostrar 'Agregado' o 'Error').
  if (existente) {
    existente.cantidad = cantidadNueva;
  } else {
    carrito.push({ id: idProducto, cantidad });
  }
  return true;
}

function cambiarCantidad(idProducto, delta) {
  const item = carrito.find(i => i.id === idProducto);
  if (!item) return;

  // Bajar a 0 = quitar el producto: pasa por quitarDelCarrito() para que
  // también se borre su fila en Supabase (si no, quedaría "fantasma" allá).
  if (item.cantidad + delta <= 0) {
    quitarDelCarrito(idProducto);
    return;
  }

  item.cantidad += delta;
  renderizarCarrito();
}

// Paso 4 de clase. Devuelve true si salió bien, false si falló.
async function quitarDelCarrito(id) {
  const idProducto = Number(id);

  // Con sesión, el producto tiene fila en detalles_pedidos → se borra allá primero.
  // .select() + data.length: igual que en el update, si RLS bloquea el delete
  // NO da error, solo borra 0 filas.
  if (detalleIds[idProducto]) {
    const { data, error } = await db
      .from('detalles_pedidos')
      .delete()
      .eq('id', detalleIds[idProducto])
      .select();

    if (error || data.length === 0) {
      console.log('Error al quitar el producto:', error ?? 'RLS bloqueó el delete (0 filas)');
      return false; // el carrito local NO se toca: sigue igual que en Supabase
    }
    delete detalleIds[idProducto];
  }

  // Siempre (con o sin sesión). El pedido NO se borra aunque quede vacío:
  // ese carrito se reutiliza la próxima vez que se agregue algo.
  carrito = carrito.filter(i => i.id !== idProducto);
  renderizarCarrito(); // el fragmento dice actualizarCarrito()
  return true;
}

function calcularTotal() {
  return carrito.reduce((sum, item) => {
    const producto = productos.find(p => p.id === item.id);
    if (!producto) return sum;
    return sum + precioFinal(producto) * item.cantidad;
  }, 0);
}

function totalUnidades() {
  return carrito.reduce((sum, item) => sum + item.cantidad, 0);
}

function renderizarCarrito() {
  // Toda modificación del carrito termina llamando a esta función, así que
  // guardar aquí = un solo lugar que guarda, imposible olvidarlo
  guardarCarrito();

  const total = totalUnidades();
  carritoCount.textContent = total > 0 ? total : '';

  if (carrito.length === 0) {
    carritoItems.innerHTML = '<p class="carrito-vacio">Tu carrito está vacío.</p>';
    carritoTotal.textContent = formatearPrecio(0);
    // Paso 6: sin productos no tiene sentido el formulario → vuelve el botón
    formCheckout.hidden = true;
    btnCheckout.hidden = false;
    return;
  }

  carritoItems.innerHTML = carrito.map(item => {
    const p = productos.find(prod => prod.id === item.id);
    if (!p) return '';

    const img = p.Img_url
      ? `<img src="${p.Img_url}" alt="" loading="lazy">`
      : '<div class="placeholder-img"></div>';

    return `
      <div class="carrito-item">
        ${img}
        <div class="carrito-item-info">
          <h4>${p.nombre}</h4>
          <span class="item-precio">${formatearPrecio(precioFinal(p))}</span>
        </div>
        <div class="carrito-item-controles">
          <button type="button" class="btn-cantidad" data-id="${p.id}" data-delta="-1">−</button>
          <span class="cantidad-valor">${item.cantidad}</span>
          <button type="button" class="btn-cantidad" data-id="${p.id}" data-delta="1">+</button>
        </div>
        <button type="button" class="btn-quitar" data-quitar="${p.id}">Quitar</button>
      </div>
    `;
  }).join('');

  carritoTotal.textContent = formatearPrecio(calcularTotal());
}

// Delegación en el panel del carrito
carritoItems.addEventListener('click', (e) => {
  const btnCantidad = e.target.closest('.btn-cantidad');
  if (btnCantidad) {
    cambiarCantidad(Number(btnCantidad.dataset.id), Number(btnCantidad.dataset.delta));
    return;
  }

  const btnQuitar = e.target.closest('.btn-quitar');
  if (btnQuitar) {
    quitarDelCarrito(Number(btnQuitar.dataset.quitar));
  }
});


// ---------- Checkout (paso 6 de clase) ----------

// a) "Ir a pagar": revisa carrito y sesión antes de mostrar el formulario
btnCheckout.addEventListener('click', async () => {
  mensajeCarrito.textContent = '';

  if (carrito.length === 0) {
    mensajeCarrito.textContent = 'Tu carrito está vacío.';
    return;
  }

  // confirmar_pedido exige sesión (auth.uid()), así que se avisa antes de llenar nada
  const usuario = await obtenerUsuario();
  if (!usuario) {
    mensajeCarrito.textContent = 'Para comprar, inicia sesión en cliente.html (Mi cuenta).';
    return;
  }

  // Con sesión → la página de pago (resumen, envío y método de pago).
  // El formulario del panel (pasos 6 y 7 de clase) queda en el código pero
  // ya no se muestra: pago.html hace lo mismo con confirmar_pedido.
  location.href = 'pago.html';
});

// b) "Volver al carrito"
document.getElementById('btn-cancelar-checkout').addEventListener('click', () => {
  formCheckout.hidden = true;
  btnCheckout.hidden = false;
});

// c) Dirección y teléfono son obligatorios solo con envío a domicilio.
// Es la misma regla que valida confirmar_pedido en la base: aquí solo
// ayuda al usuario; la que manda es la de la base.
checkEnvio.addEventListener('change', () => {
  document.getElementById('checkout-direccion').required = checkEnvio.checked;
  document.getElementById('checkout-telefono').required  = checkEnvio.checked;
});

// ---------- Confirmar pedido (paso 7 de clase) ----------
// El fragmento lo pone en galeria.js; va aquí porque cliente.html tiene el
// mismo formulario. IMPORTANTE: el navegador NO calcula el total ni cambia
// el estado. Solo llama a confirmar_pedido(), que valida, descuenta stock,
// fija precios y confirma en UNA transacción dentro de la base.

// '' (o solo espacios) → null, como espera la función
function textoONull(idCampo) {
  const valor = document.getElementById(idCampo).value.trim();
  return valor === '' ? null : valor;
}

formCheckout.addEventListener('submit', async (event) => {
  event.preventDefault(); // sin esto el navegador recarga la página
  if (pedidoId === null) return; // sin carrito en Supabase no hay nada que confirmar

  const btnConfirmar = document.getElementById('btn-confirmar');
  btnConfirmar.disabled = true; // evita confirmar dos veces con doble clic
  mensajeCarrito.textContent = '';

  // Los nombres p_... deben ser EXACTAMENTE los de la función en SQL
  // (sql/confirm_order.sql): Supabase busca la función por esos nombres.
  const { data, error } = await db.rpc('confirmar_pedido', {
    p_pedido_id:   pedidoId,
    p_envio:       checkEnvio.checked,
    p_direccion:   textoONull('checkout-direccion'),
    p_telefono:    textoONull('checkout-telefono'),
    p_observacion: textoONull('checkout-observacion'),
  });

  if (error) {
    // error.message es el texto del "raise exception" de la función, p. ej.
    // 'Stock insuficiente o producto no disponible (producto 2)'.
    // El carrito NO se vacía: la transacción se deshizo y todo sigue igual.
    console.log('Error al confirmar el pedido:', error);
    mensajeCarrito.textContent = error.message;
    btnConfirmar.disabled = false;
    return;
  }

  // data = la fila del pedido confirmado (la función devuelve "pedidos").
  // El total lo calcula la vista pedidos_con_total, no el navegador.
  const { data: pedido, error: errorTotal } = await db
    .from('pedidos_con_total')
    .select('total')
    .eq('id', data.id)
    .single();

  if (errorTotal) console.log('Error al leer el total:', errorTotal);

  vaciarCarritoLocal(); // también oculta el formulario y vuelve a mostrar "Ir a pagar"
  formCheckout.reset();
  document.getElementById('checkout-direccion').required = false;
  document.getElementById('checkout-telefono').required  = false;
  btnConfirmar.disabled = false;

  // El pedido ya está confirmado aunque falle la lectura del total
  mensajeCarrito.textContent = pedido
    ? `Pedido #${data.id} confirmado. Total: $${pedido.total.toLocaleString('es-CO')}`
    : `Pedido #${data.id} confirmado.`;

  // Las tarjetas muestran unidades: se recargan para ver el stock ya descontado
  cargarProductos();
});
