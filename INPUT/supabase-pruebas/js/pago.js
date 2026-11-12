// =====================================================================
// pago.js — convierte el carrito (localStorage) en un pedido de Supabase.
// Depende de: supabaseClient.js (db) y tienda.js (formatearPrecio, etc.)
// =====================================================================

const formPago      = document.getElementById('form-pago');
const camposTarjeta = document.getElementById('campos-tarjeta');
const btnPagar      = document.getElementById('btn-pagar');
const mensajePago   = document.getElementById('mensaje-pago');

// Cada línea = { producto: {...fila de productos_practica}, cantidad }
let lineas = [];
let idCliente = null; // id de Auth si hay sesión; null si se paga sin cuenta

// ---------- Mostrar solo una zona ----------
function mostrarZona(nombre) {
  ['vacio', 'pago'].forEach((z) => {
    document.getElementById('zona-' + z).hidden = z !== nombre;
  });
}

// ---------- Leer el carrito que guardó galeria.js ----------
function leerCarrito() {
  try {
    return JSON.parse(localStorage.getItem('carrito')) ?? [];
  } catch (_) {
    return [];
  }
}

function calcularTotal() {
  return lineas.reduce((suma, l) => suma + precioFinal(l.producto) * l.cantidad, 0);
}

// ---------- Resumen de la derecha ----------
function renderizarResumen() {
  document.getElementById('resumen-items').innerHTML = lineas.map(({ producto: p, cantidad }) => `
    <div class="item">
      ${p.Img_url ? `<img src="${escaparHTML(p.Img_url)}" alt="">` : '<div class="sin-img"></div>'}
      <div class="item-info">
        <h4>${escaparHTML(p.nombre)}</h4>
        <p>${cantidad} × ${formatearPrecio(precioFinal(p))}</p>
      </div>
      <span class="item-precio">${formatearPrecio(precioFinal(p) * cantidad)}</span>
    </div>
  `).join('');

  const unidades = lineas.reduce((s, l) => s + l.cantidad, 0);
  document.getElementById('resumen-unidades').textContent = unidades;
  document.getElementById('resumen-total').textContent = formatearPrecio(calcularTotal());
  btnPagar.textContent = 'Pagar ' + formatearPrecio(calcularTotal());
}

// ---------- Método de pago ----------
// disabled en el fieldset → sus inputs no se validan ni se envían
function actualizarMetodo() {
  const metodo = formPago.elements.metodo.value; // el value del radio marcado
  camposTarjeta.disabled = metodo !== 'tarjeta';
  camposTarjeta.hidden   = metodo !== 'tarjeta';
}

formPago.querySelectorAll('input[name="metodo"]').forEach((radio) => {
  radio.addEventListener('change', actualizarMetodo);
});

// Mientras escribes la tarjeta: quita lo que no sea número y mete un
// espacio cada 4 dígitos. \D = "cualquier cosa que NO sea dígito"
formPago.elements.numero.addEventListener('input', (e) => {
  const digitos = e.target.value.replace(/\D/g, '').slice(0, 16);
  e.target.value = digitos.replace(/(\d{4})(?=\d)/g, '$1 ');
});

// "0829" → "08/29"
formPago.elements.vence.addEventListener('input', (e) => {
  const d = e.target.value.replace(/\D/g, '').slice(0, 4);
  e.target.value = d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
});

formPago.elements.cvv.addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, '');
});

// ---------- Crear el pedido ----------
async function crearPedido(datosEnvio, metodo, ultimosDigitos) {

  // Los items guardan una "foto" del producto al momento de comprar: si
  // mañana el admin le cambia el precio, el pedido sigue mostrando lo pagado
  const items = lineas.map(({ producto: p, cantidad }) => ({
    producto_id:     p.id,
    nombre:          p.nombre,
    img_url:         p.Img_url,
    descripcion:     p.descripcion,
    categorias:      p.categorias,
    precio_unitario: precioFinal(p),
    descuento:       p.descuento ?? 0,
    cantidad,
  }));

  // POR AHORA se guarda en localStorage (pedidosLocal.js).
  // Cuando conectemos Supabase, aquí van 2 inserts: primero el pedido en
  // pedidos_practica (con .select().single() para recibir su id) y después
  // los items en pedido_items_practica con ese pedido_id
  const { data: pedido, error } = await crearPedidoLocal({
    cliente_id:      idCliente,
    nombre_envio:    datosEnvio.nombre,
    telefono_envio:  datosEnvio.telefono,
    direccion_envio: datosEnvio.direccion,
    ciudad_envio:    datosEnvio.ciudad,
    metodo_pago:     metodo,
    ultimos_digitos: ultimosDigitos,
    total:           calcularTotal(),
  }, items);

  if (error) {
    console.log('Error al crear el pedido:', error);
    return null;
  }

  return pedido;
}

formPago.addEventListener('submit', async (event) => {
  event.preventDefault(); // sin esto la página se recarga (igual que en cliente.js)

  const campos = formPago.elements;
  const metodo = campos.metodo.value;

  // Solo los 4 últimos dígitos. El número completo NUNCA sale del navegador
  const ultimosDigitos = metodo === 'tarjeta'
    ? campos.numero.value.replace(/\D/g, '').slice(-4)
    : null;

  btnPagar.disabled = true;
  btnPagar.textContent = 'Procesando pago…';
  mensajePago.textContent = '';

  // Simulamos que "el banco" tarda un poco en responder. En una tienda real
  // aquí iría la pasarela de pagos (Wompi, Mercado Pago, Stripe…)
  await new Promise((resolver) => setTimeout(resolver, 1200));

  const pedido = await crearPedido({
    nombre:    campos.nombre.value.trim(),
    telefono:  campos.telefono.value.trim(),
    direccion: campos.direccion.value.trim(),
    ciudad:    campos.ciudad.value.trim(),
  }, metodo, ultimosDigitos);

  if (!pedido) {
    mensajePago.className = 'message message--error';
    mensajePago.textContent = 'No se pudo crear el pedido. Revisa la consola.';
    btnPagar.disabled = false;
    renderizarResumen(); // devuelve el texto "Pagar $…" al botón
    return;
  }

  // Pedido creado: el carrito ya no tiene sentido
  try { localStorage.removeItem('carrito'); } catch (_) {}

  // ?id=... en la URL → pedido.js lo lee para saber qué pedido mostrar
  location.href = 'pedido.html?id=' + pedido.id;
});

// ---------- Arranque ----------
async function iniciar() {
  const carrito = leerCarrito();
  if (carrito.length === 0) { mostrarZona('vacio'); return; }

  // Pedimos los productos OTRA VEZ a Supabase en vez de confiar en lo que
  // quedó en localStorage: si el precio cambió o se agotó, aquí se nota.
  // .in('id', [...]) = "donde el id sea alguno de estos"
  const { data: productos, error } = await db
    .from('productos_practica')
    .select('*')
    .in('id', carrito.map((item) => item.id));

  if (error) {
    console.log('Error al leer productos:', error);
    mostrarZona('vacio');
    return;
  }

  lineas = carrito
    .map((item) => ({ producto: productos.find((p) => p.id === item.id), cantidad: item.cantidad }))
    .filter((l) => l.producto && l.producto.disponible); // fuera los borrados o agotados

  if (lineas.length === 0) { mostrarZona('vacio'); return; }

  // Si hay sesión (cliente.html), precargamos el envío con sus datos.
  // Sin sesión también se puede pagar: el formulario queda vacío
  const { data: { user } } = await db.auth.getUser();
  idCliente = user?.id ?? null; // ?. → si user es null, no revienta, da undefined

  const { data: cliente } = user
    ? await db
        .from('clientes_practica')
        .select('nombre, telefono, direccion')
        .eq('id', user.id)
        .maybeSingle() // como single(), pero si no hay fila devuelve null sin error
    : { data: null };

  if (cliente) {
    formPago.elements.nombre.value    = cliente.nombre ?? '';
    formPago.elements.telefono.value  = cliente.telefono ?? '';
    formPago.elements.direccion.value = cliente.direccion ?? '';
  }

  actualizarMetodo();
  renderizarResumen();
  mostrarZona('pago');
}

iniciar();
