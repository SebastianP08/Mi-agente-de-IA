// =====================================================================
// pedido.js — lista de pedidos y seguimiento de UN pedido con el camión.
// Depende de: supabaseClient.js (db) y tienda.js (ETAPAS, formatearPrecio…)
// =====================================================================

// Íconos de cada etapa (mismo estilo de línea que el ojito de cliente.html)
const ICONOS = {
  pagado:     '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
  preparando: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  en_camino:  '<path d="M1 5h13v11H1zM14 9h4l4 4v3h-8"/><circle cx="5" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  entregado:  '<path d="M3 11l9-8 9 8M5 10v10h14V10"/><path d="M9 15l2 2 4-4"/>',
  hecho:      '<path d="M5 12l5 5 9-10"/>', // ✓ para las etapas ya pasadas
};

function icono(valor) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[valor]}</svg>`;
}

const NOMBRE_METODO = { tarjeta: 'Tarjeta', pse: 'PSE', contraentrega: 'Contraentrega' };

function mostrarZona(nombre) {
  ['lista', 'detalle'].forEach((z) => {
    document.getElementById('zona-' + z).hidden = z !== nombre;
  });
}

// ---------- Lista de pedidos ----------
async function mostrarLista() {
  // POR AHORA desde localStorage (pedidosLocal.js). Con Supabase sería un
  // select con tabla "anidada": pedido_items_practica(...) trae los items
  // de cada pedido en la MISMA petición, y RLS deja ver solo los tuyos
  const { data, error } = await listarPedidosLocal();

  const lista = document.getElementById('lista-pedidos');
  mostrarZona('lista');

  if (error) {
    console.log('Error al leer pedidos:', error);
    lista.innerHTML = '<p class="message message--error">No se pudieron leer los pedidos.</p>';
    return;
  }

  if (data.length === 0) {
    lista.innerHTML = '<div class="panel aviso"><h3>Todavía no tienes pedidos</h3><a class="btn" href="galeria.html">Ir a la galería</a></div>';
    return;
  }

  lista.innerHTML = data.map((p) => {
    const items = p.pedido_items_practica;
    const primero = items[0];
    const unidades = items.reduce((s, i) => s + i.cantidad, 0);
    const resumen = items.length === 1 ? primero.nombre : `${primero?.nombre ?? 'Pedido'} y ${items.length - 1} más`;
    const claseBadge = p.estado === 'entregado' ? 'badge-estado badge-estado--entregado' : 'badge-estado';

    return `
      <a class="pedido-fila" href="pedido.html?id=${p.id}">
        ${primero?.img_url ? `<img src="${escaparHTML(primero.img_url)}" alt="">` : '<div class="sin-img"></div>'}
        <div class="pedido-fila-info">
          <h4>${escaparHTML(resumen)}</h4>
          <p>Pedido #${p.id} · ${formatearFecha(p.created_at)} · ${unidades} unid. · ${formatearPrecio(p.total)}</p>
        </div>
        <span class="${claseBadge}">${etapaDe(p.estado).titulo}</span>
      </a>
    `;
  }).join('');
}

// ---------- Seguimiento (camión) ----------
function renderizarTracker(pedido) {
  // findIndex → en qué posición del array ETAPAS está el estado actual (0 a 3)
  const actual = ETAPAS.findIndex((e) => e.valor === pedido.estado);
  const etapa = ETAPAS[actual];

  const tracker = document.getElementById('tracker');
  tracker.dataset.estado = pedido.estado;

  // Leer offsetWidth obliga al navegador a calcular el layout YA, con el
  // camión todavía en 0%. Sin esto, como la zona estaba hidden, el
  // navegador saltaría directo a la posición final, sin deslizarse
  void tracker.offsetWidth;

  // 0 → 0%, 1 → 33.3%, 2 → 66.6%, 3 → 100%. setProperty escribe una
  // variable CSS desde JS: el CSS la usa para el ancho del relleno y la
  // posición del camión, y la transition hace que se deslice
  tracker.style.setProperty('--progreso', (actual / (ETAPAS.length - 1)) * 100 + '%');

  document.getElementById('tracker-pasos').innerHTML = ETAPAS.map((e, i) => {
    // Antes del actual = hecho, el actual = actual, después = pendiente
    const clase = i < actual ? 'paso--hecho' : i === actual ? 'paso--actual' : 'paso--pendiente';
    const fecha = pedido[e.campoFecha]; // pedido['en_camino_at'], etc.
    return `
      <li class="paso ${clase}" ${i === actual ? 'aria-current="step"' : ''}>
        <span class="paso-icono">${icono(i < actual ? 'hecho' : e.valor)}</span>
        <strong>${e.titulo}</strong>
        <time datetime="${fecha ?? ''}">${fecha ? formatearFecha(fecha) : ''}</time>
      </li>
    `;
  }).join('');

  const titulo = document.getElementById('estado-titulo');
  titulo.textContent = etapa.titulo;
  titulo.classList.toggle('estado-titulo--ok', pedido.estado === 'entregado');
  document.getElementById('estado-mensaje').textContent = etapa.mensaje;
}

function renderizarItems(items) {
  document.getElementById('detalle-items').innerHTML = items.map((it) => {
    const tags = (it.categorias ?? []).map((c) => `<span class="tag">${escaparHTML(c)}</span>`).join('');
    const descuento = it.descuento > 0 ? ` · <strong>-${Math.round(it.descuento * 100)}%</strong>` : '';
    return `
      <div class="item">
        ${it.img_url ? `<img src="${escaparHTML(it.img_url)}" alt="">` : '<div class="sin-img"></div>'}
        <div class="item-info">
          <h4>${escaparHTML(it.nombre)}</h4>
          ${it.descripcion ? `<p>${escaparHTML(it.descripcion)}</p>` : ''}
          <p>${it.cantidad} × ${formatearPrecio(it.precio_unitario)}${descuento}</p>
          <div>${tags}</div>
        </div>
        <span class="item-precio">${formatearPrecio(it.precio_unitario * it.cantidad)}</span>
      </div>
    `;
  }).join('');
}

// Arma un <dl> a partir de pares [etiqueta, valor]. Los valores los
// escribió el cliente en pago.html → escaparHTML sí o sí
function filasDatos(pares) {
  return pares
    .map(([etiqueta, valor]) => `<div><dt>${etiqueta}</dt><dd>${escaparHTML(valor || '—')}</dd></div>`)
    .join('');
}

async function mostrarDetalle(id) {
  // POR AHORA desde localStorage. Con Supabase: select('*, pedido_items_practica(*)')
  // .eq('id', id).maybeSingle() → null si no existe o RLS no te deja verlo
  const { data: pedido, error } = await leerPedidoLocal(id);

  if (error || !pedido) {
    console.log('Error al leer el pedido:', error);
    mostrarZona('lista');
    document.getElementById('lista-pedidos').innerHTML =
      '<p class="message message--error">No encontramos ese pedido en este navegador.</p>';
    return;
  }

  document.getElementById('detalle-numero').textContent = '#' + pedido.id;
  document.getElementById('detalle-fecha').textContent = 'Comprado el ' + formatearFecha(pedido.created_at);
  document.getElementById('detalle-total').textContent = formatearPrecio(pedido.total);

  renderizarItems(pedido.pedido_items_practica);

  document.getElementById('detalle-envio').innerHTML = filasDatos([
    ['Recibe', pedido.nombre_envio],
    ['Dirección', pedido.direccion_envio],
    ['Ciudad', pedido.ciudad_envio],
    ['Teléfono', pedido.telefono_envio],
  ]);

  document.getElementById('detalle-pago').innerHTML = filasDatos([
    ['Método', NOMBRE_METODO[pedido.metodo_pago]],
    ['Tarjeta', pedido.ultimos_digitos ? '•••• ' + pedido.ultimos_digitos : ''],
    ['Total', formatearPrecio(pedido.total)],
  ]);

  mostrarZona('detalle');   // primero visible…
  renderizarTracker(pedido); // …después mover el camión, para que se vea el viaje
}

// ---------- Arranque ----------
// URLSearchParams lee lo que va después del "?" en la URL.
// pedido.html?id=5 → params.get('id') = "5"
const params = new URLSearchParams(location.search);
const idPedido = params.get('id');

document.getElementById('btn-actualizar').addEventListener('click', () => mostrarDetalle(idPedido));

// Sin sesión obligatoria mientras los pedidos vivan en localStorage.
// Cuando conectemos Supabase, aquí vuelve el chequeo de db.auth.getUser()
if (idPedido) mostrarDetalle(idPedido);
else mostrarLista();
