// =====================================================================
// pedido.js — "Mis pedidos" y seguimiento de UN pedido con el camión.
// Depende de: supabaseClient.js (db) y tienda.js (ETAPAS, formatearPrecio…)
//
// Todo sale de Supabase. RLS (política ver_pedidos) hace que cada cliente
// vea SOLO sus pedidos, sin que este archivo tenga que filtrar por seguridad.
// =====================================================================

// Íconos de cada etapa (mismo estilo de línea que el ojito de cliente.html)
const ICONOS = {
  confirmado: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  enviado:    '<path d="M1 5h13v11H1zM14 9h4l4 4v3h-8"/><circle cx="5" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  entregado:  '<path d="M3 11l9-8 9 8M5 10v10h14V10"/><path d="M9 15l2 2 4-4"/>',
  hecho:      '<path d="M5 12l5 5 9-10"/>', // ✓ para las etapas ya pasadas
};

function icono(valor) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[valor]}</svg>`;
}

function mostrarZona(nombre) {
  ['sesion', 'lista', 'detalle'].forEach((z) => {
    document.getElementById('zona-' + z).hidden = z !== nombre;
  });
}

// { id_pedido: total } desde la vista: el total lo calcula la base
async function leerTotales(ids) {
  const { data, error } = await db.from('pedidos_con_total').select('id, total').in('id', ids);
  if (error) console.log('Error al leer totales:', error);
  const totales = {};
  for (const t of data ?? []) totales[t.id] = t.total;
  return totales;
}

// ---------- Lista de pedidos ----------
async function mostrarLista() {
  // Un select con tablas "anidadas": cada pedido trae sus líneas y cada línea
  // su producto, en la MISMA petición. 'carrito' no es un pedido todavía.
  const { data, error } = await db
    .from('pedidos')
    .select('id, estado, confirmado_en, detalles_pedidos(cantidad, productos_practica(nombre, Img_url))')
    .neq('estado', 'carrito')
    .order('id', { ascending: false });

  const lista = document.getElementById('lista-pedidos');
  mostrarZona('lista');

  if (error) {
    console.log('Error al leer pedidos:', error);
    lista.innerHTML = '<p class="message message--error">No se pudieron leer los pedidos.</p>';
    return;
  }

  if (data.length === 0) {
    lista.innerHTML = '<div class="panel aviso"><h3>Todavía no tienes pedidos</h3><a class="btn" href="cliente.html?vista=productos">Ir a Productos</a></div>';
    return;
  }

  const totales = await leerTotales(data.map((p) => p.id));

  lista.innerHTML = data.map((p) => {
    const items = p.detalles_pedidos;
    const primero = items[0]?.productos_practica;
    const unidades = items.reduce((s, i) => s + i.cantidad, 0);
    const nombre = primero?.nombre ?? 'Pedido';
    const resumen = items.length <= 1 ? nombre : `${nombre} y ${items.length - 1} más`;
    const claseBadge = 'badge-estado' +
      (p.estado === 'entregado' ? ' badge-estado--entregado' : '') +
      (p.estado === 'cancelado' ? ' badge-estado--cancelado' : '');

    return `
      <a class="pedido-fila" href="pedido.html?id=${p.id}">
        ${primero?.Img_url ? `<img src="${escaparHTML(primero.Img_url)}" alt="">` : '<div class="sin-img"></div>'}
        <div class="pedido-fila-info">
          <h4>${escaparHTML(resumen)}</h4>
          <p>Pedido #${p.id} · ${formatearFecha(p.confirmado_en)} · ${unidades} unid. · ${formatearPrecio(totales[p.id] ?? 0)}</p>
        </div>
        <span class="${claseBadge}">${etapaDe(p.estado).titulo}</span>
      </a>
    `;
  }).join('');
}

// ---------- Seguimiento (camión) ----------
// fechas = { confirmado: '2026-…', enviado: '…' } (del historial)
function renderizarTracker(pedido, fechas) {
  const tracker = document.getElementById('tracker');
  const titulo = document.getElementById('estado-titulo');
  const etapa = etapaDe(pedido.estado);

  titulo.textContent = etapa.titulo;
  titulo.classList.toggle('estado-titulo--ok', pedido.estado === 'entregado');
  titulo.classList.toggle('estado-titulo--cancelado', pedido.estado === 'cancelado');
  document.getElementById('estado-mensaje').textContent = etapa.mensaje;

  // Cancelado no es un paso del camión: se oculta el seguimiento
  tracker.hidden = pedido.estado === 'cancelado';
  if (tracker.hidden) return;

  // findIndex → en qué posición del array ETAPAS está el estado actual (0 a 2)
  const actual = ETAPAS.findIndex((e) => e.valor === pedido.estado);
  tracker.dataset.estado = pedido.estado;

  // Leer offsetWidth obliga al navegador a calcular el layout YA, con el
  // camión todavía en 0%. Sin esto, como la zona estaba hidden, saltaría
  // directo a la posición final, sin deslizarse
  void tracker.offsetWidth;

  // 0 → 0%, 1 → 50%, 2 → 100%. El CSS usa --progreso para el relleno y el camión
  tracker.style.setProperty('--progreso', (actual / (ETAPAS.length - 1)) * 100 + '%');

  document.getElementById('tracker-pasos').innerHTML = ETAPAS.map((e, i) => {
    // Antes del actual = hecho, el actual = actual, después = pendiente
    const clase = i < actual ? 'paso--hecho' : i === actual ? 'paso--actual' : 'paso--pendiente';
    const fecha = fechas[e.valor];
    return `
      <li class="paso ${clase}" ${i === actual ? 'aria-current="step"' : ''}>
        <span class="paso-icono">${icono(i < actual ? 'hecho' : e.valor)}</span>
        <strong>${e.titulo}</strong>
        <time datetime="${fecha ?? ''}">${fecha ? formatearFecha(fecha) : ''}</time>
      </li>
    `;
  }).join('');
}

function renderizarItems(detalles) {
  document.getElementById('detalle-items').innerHTML = detalles.map((d) => {
    const p = d.productos_practica ?? {};
    // categorias es una columna json: puede no ser un array
    const categorias = Array.isArray(p.categorias) ? p.categorias : [];
    const tags = categorias.map((c) => `<span class="tag">${escaparHTML(c)}</span>`).join('');
    return `
      <div class="item">
        ${p.Img_url ? `<img src="${escaparHTML(p.Img_url)}" alt="">` : '<div class="sin-img"></div>'}
        <div class="item-info">
          <h4>${escaparHTML(p.nombre ?? 'Producto borrado')}</h4>
          <p>${d.cantidad} × ${formatearPrecio(d.precio_unitario)}</p>
          <div>${tags}</div>
        </div>
        <span class="item-precio">${formatearPrecio(d.precio_unitario * d.cantidad)}</span>
      </div>
    `;
  }).join('');
}

// Arma un <dl> a partir de pares [etiqueta, valor]. Dirección, teléfono y
// observación los escribió el cliente → escaparHTML sí o sí
function filasDatos(pares) {
  return pares
    .map(([etiqueta, valor]) => `<div><dt>${etiqueta}</dt><dd>${escaparHTML(valor || '—')}</dd></div>`)
    .join('');
}

async function mostrarDetalle(id) {
  // El pedido con sus líneas, su total y su historial, las 3 consultas a la vez.
  // maybeSingle → null si no existe o si RLS no te deja verlo (es de otro).
  const [respPedido, totales, respHistorial] = await Promise.all([
    db.from('pedidos')
      .select('id, estado, envio, direccion, telefono, observacion, confirmado_en, detalles_pedidos(cantidad, precio_unitario, productos_practica(nombre, Img_url, categorias))')
      .eq('id', id)
      .neq('estado', 'carrito')
      .maybeSingle(),
    leerTotales([id]),
    // Fechas de cada etapa. Si la política para clientes no existe todavía,
    // RLS devuelve 0 filas (sin error) y solo se muestra la de confirmado.
    db.from('historial_estados_pedido')
      .select('estado_nuevo, cambiado_en')
      .eq('pedido_id', id)
      .order('id'),
  ]);

  const pedido = respPedido.data;
  if (respPedido.error || !pedido) {
    console.log('Error al leer el pedido:', respPedido.error);
    mostrarZona('lista');
    document.getElementById('lista-pedidos').innerHTML =
      '<p class="message message--error">No encontramos ese pedido en tu cuenta.</p>' +
      '<p><a href="pedido.html">← Ver todos mis pedidos</a></p>';
    return;
  }

  // { estado: fecha } — si un estado se repitiera, gana la última vez
  const fechas = { confirmado: pedido.confirmado_en };
  for (const h of respHistorial.data ?? []) fechas[h.estado_nuevo] = h.cambiado_en;

  const total = totales[pedido.id] ?? 0;

  document.getElementById('detalle-numero').textContent = '#' + pedido.id;
  document.getElementById('detalle-fecha').textContent = 'Confirmado el ' + formatearFecha(pedido.confirmado_en);
  document.getElementById('detalle-total').textContent = formatearPrecio(total);

  renderizarItems(pedido.detalles_pedidos);

  document.getElementById('detalle-envio').innerHTML = filasDatos(
    pedido.envio
      ? [['Entrega', 'Envío a domicilio'], ['Dirección', pedido.direccion], ['Teléfono', pedido.telefono], ['Observación', pedido.observacion]]
      : [['Entrega', 'Recoger en tienda'], ['Observación', pedido.observacion]]
  );

  const unidades = pedido.detalles_pedidos.reduce((s, d) => s + d.cantidad, 0);
  document.getElementById('detalle-pago').innerHTML = filasDatos([
    ['Productos', unidades + ' unid.'],
    ['Estado', etapaDe(pedido.estado).titulo],
    ['Total', formatearPrecio(total)],
  ]);

  mostrarZona('detalle');            // primero visible…
  renderizarTracker(pedido, fechas); // …después mover el camión, para que se vea el viaje
}

// ---------- Arranque ----------
// URLSearchParams lee lo que va después del "?" en la URL.
// pedido.html?id=5 → params.get('id') = "5"
const params = new URLSearchParams(location.search);
const idPedido = params.get('id');

document.getElementById('btn-actualizar').addEventListener('click', () => mostrarDetalle(idPedido));

async function iniciar() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) { mostrarZona('sesion'); return; }

  if (idPedido) mostrarDetalle(idPedido);
  else mostrarLista();
}

iniciar();
