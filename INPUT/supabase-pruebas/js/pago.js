// =====================================================================
// pago.js — confirma el carrito de Supabase como pedido.
// Depende de: supabaseClient.js (db) y tienda.js (formatearPrecio, etc.)
//
// El navegador NO calcula el total que se cobra ni cambia el estado:
// - el total sale de la vista pedidos_con_total
// - "Pagar" llama a confirmar_pedido(), que valida, descuenta stock, fija
//   los precios y confirma, todo en UNA transacción dentro de la base.
// El método de pago es SOLO visual por ahora: no se guarda nada de él.
// =====================================================================

const formPago      = document.getElementById('form-pago');
const camposTarjeta = document.getElementById('campos-tarjeta');
const camposEnvio   = document.getElementById('campos-envio');
const btnPagar      = document.getElementById('btn-pagar');
const mensajePago   = document.getElementById('mensaje-pago');

let pedidoId = null;     // id del pedido en estado 'carrito' de este cliente
let totalPedido = 0;     // el que calculó pedidos_con_total

// ---------- Mostrar solo una zona ----------
function mostrarZona(nombre) {
  ['sesion', 'vacio', 'pago'].forEach((z) => {
    document.getElementById('zona-' + z).hidden = z !== nombre;
  });
}

// ---------- Resumen de la derecha ----------
// Cada detalle trae su producto anidado (FK detalles_pedidos.producto_id).
// precio_unitario es el que puso el trigger; confirmar_pedido lo vuelve a
// fijar con el precio de ese momento.
function renderizarResumen(detalles) {
  document.getElementById('resumen-items').innerHTML = detalles.map((d) => {
    const p = d.productos_practica ?? {};
    return `
      <div class="item">
        ${p.Img_url ? `<img src="${escaparHTML(p.Img_url)}" alt="">` : '<div class="sin-img"></div>'}
        <div class="item-info">
          <h4>${escaparHTML(p.nombre ?? 'Producto')}</h4>
          <p>${d.cantidad} × ${formatearPrecio(d.precio_unitario)}</p>
        </div>
        <span class="item-precio">${formatearPrecio(d.precio_unitario * d.cantidad)}</span>
      </div>
    `;
  }).join('');

  const unidades = detalles.reduce((s, d) => s + d.cantidad, 0);
  document.getElementById('resumen-unidades').textContent = unidades;
  document.getElementById('resumen-total').textContent = formatearPrecio(totalPedido);
  btnPagar.textContent = 'Pagar ' + formatearPrecio(totalPedido);
}

// ---------- Envío o recoger en tienda ----------
// disabled en el fieldset → sus inputs no se validan (no pide dirección)
function actualizarEntrega() {
  const domicilio = formPago.elements.entrega.value === 'domicilio';
  camposEnvio.disabled = !domicilio;
  camposEnvio.hidden   = !domicilio;
}

formPago.querySelectorAll('input[name="entrega"]').forEach((radio) => {
  radio.addEventListener('change', actualizarEntrega);
});

// ---------- Método de pago (visual) ----------
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

// '' (o solo espacios) → null, como espera confirmar_pedido
function textoONull(valor) {
  const limpio = valor.trim();
  return limpio === '' ? null : limpio;
}

// ---------- Pagar = confirmar el pedido en la base ----------
formPago.addEventListener('submit', async (event) => {
  event.preventDefault(); // sin esto la página se recarga
  if (pedidoId === null) return;

  const campos = formPago.elements;
  const envio = campos.entrega.value === 'domicilio';

  btnPagar.disabled = true;
  btnPagar.textContent = 'Procesando pago…';
  mensajePago.textContent = '';

  // Simulamos que "el banco" tarda un poco. En una tienda real aquí iría la
  // pasarela de pagos (Wompi, Mercado Pago, Stripe…) ANTES de confirmar.
  await new Promise((resolver) => setTimeout(resolver, 1200));

  // Los nombres p_... son EXACTAMENTE los de sql/confirm_order.sql.
  // Sin envío se mandan null: la función no exige dirección ni teléfono.
  const { data, error } = await db.rpc('confirmar_pedido', {
    p_pedido_id:   pedidoId,
    p_envio:       envio,
    p_direccion:   envio ? textoONull(campos.direccion.value) : null,
    p_telefono:    envio ? textoONull(campos.telefono.value) : null,
    p_observacion: textoONull(campos.observacion.value),
  });

  if (error) {
    // error.message = el "raise exception" de la función, p. ej.
    // 'Stock insuficiente o producto no disponible (producto 2)'.
    // La transacción se deshizo: el carrito sigue intacto.
    console.log('Error al confirmar el pedido:', error);
    mensajePago.className = 'message message--error';
    mensajePago.textContent = error.message;
    btnPagar.disabled = false;
    btnPagar.textContent = 'Pagar ' + formatearPrecio(totalPedido);
    return;
  }

  // El carrito quedó confirmado en la base; el de localStorage sobra
  try { localStorage.removeItem('carrito'); } catch (_) {}

  // data = la fila del pedido confirmado. ?id=... → pedido.js lo muestra
  location.href = 'pedido.html?id=' + data.id;
});

// ---------- Arranque ----------
async function iniciar() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) { mostrarZona('sesion'); return; }

  // El carrito con sus líneas y, dentro de cada línea, su producto.
  // RLS: el cliente solo ve sus pedidos y sus detalles.
  const { data: carrito, error } = await db
    .from('pedidos')
    .select('id, detalles_pedidos(cantidad, precio_unitario, productos_practica(nombre, Img_url))')
    .eq('cliente_id', user.id)
    .eq('estado', 'carrito')
    .maybeSingle();

  if (error) console.log('Error al leer el carrito:', error);
  if (error || !carrito || carrito.detalles_pedidos.length === 0) {
    mostrarZona('vacio');
    return;
  }

  pedidoId = carrito.id;

  // Total calculado por la base (vista security_invoker: respeta RLS).
  // Datos del cliente para precargar el envío. Las dos consultas a la vez.
  const [respTotal, respCliente] = await Promise.all([
    db.from('pedidos_con_total').select('total').eq('id', pedidoId).single(),
    db.from('clientes_practica').select('telefono, direccion').eq('id', user.id).maybeSingle(),
  ]);

  if (respTotal.error) console.log('Error al leer el total:', respTotal.error);
  totalPedido = respTotal.data?.total ?? 0;

  if (respCliente.data) {
    formPago.elements.telefono.value  = respCliente.data.telefono ?? '';
    formPago.elements.direccion.value = respCliente.data.direccion ?? '';
  }

  actualizarEntrega();
  actualizarMetodo();
  renderizarResumen(carrito.detalles_pedidos);
  mostrarZona('pago');
}

iniciar();
