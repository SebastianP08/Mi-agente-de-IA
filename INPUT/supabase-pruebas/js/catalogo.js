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

// Delegación: clic en tarjeta (abrir modal) o en "Agregar al carrito"
galeria.addEventListener('click', (e) => {
  // Si el clic fue en "Agregar al carrito", agregar y no abrir modal
  const botonAgregar = e.target.closest('.btn-agregar');
  if (botonAgregar) {
    if (!botonAgregar.disabled) agregarAlCarrito(Number(botonAgregar.dataset.id));
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
modalBody.addEventListener('click', (e) => {
  const boton = e.target.closest('.btn-agregar-modal');
  if (boton && !boton.disabled) {
    agregarAlCarrito(Number(boton.dataset.id));
    cerrarModal();
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

const carritoPanel   = document.getElementById('carrito-panel');
const carritoOverlay = document.getElementById('carrito-overlay');
const carritoItems   = document.getElementById('carrito-items');
const carritoTotal   = document.getElementById('carrito-total-valor');
const carritoCount   = document.getElementById('carrito-count');

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

function agregarAlCarrito(idProducto) {
  const producto = productos.find(p => p.id === idProducto);
  if (!producto || !producto.disponible) return;

  const existente = carrito.find(item => item.id === idProducto);
  if (existente) {
    existente.cantidad++;
  } else {
    carrito.push({ id: idProducto, cantidad: 1 });
  }

  renderizarCarrito();
  abrirCarrito();
}

function cambiarCantidad(idProducto, delta) {
  const item = carrito.find(i => i.id === idProducto);
  if (!item) return;

  item.cantidad += delta;
  if (item.cantidad <= 0) {
    carrito = carrito.filter(i => i.id !== idProducto);
  }

  renderizarCarrito();
}

function quitarDelCarrito(idProducto) {
  carrito = carrito.filter(i => i.id !== idProducto);
  renderizarCarrito();
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
  document.getElementById('btn-ir-pagar').disabled = carrito.length === 0;

  const total = totalUnidades();
  carritoCount.textContent = total > 0 ? total : '';

  if (carrito.length === 0) {
    carritoItems.innerHTML = '<p class="carrito-vacio">Tu carrito está vacío.</p>';
    carritoTotal.textContent = formatearPrecio(0);
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
        <button type="button" class="btn-quitar" data-quitar="${p.id}" aria-label="Quitar">&times;</button>
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

