// =====================================================================
// tienda.js — utilidades compartidas de pago.html y pedido.html.
// Se carga DESPUÉS de supabaseClient.js y ANTES de pago.js / pedido.js,
// así esas dos pueden usar estas funciones sin volver a escribirlas.
// =====================================================================

// ---------- Precios ----------
// Mismas fórmulas que catalogo.js: si cambian allá, cambiarlas aquí.
// Solo para MOSTRAR: el precio que se cobra lo fija la base de datos.
function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
}

function precioFinal(producto) {
  if (producto.descuento > 0) return producto.precio * (1 - producto.descuento);
  return producto.precio;
}

// "12 nov 2026, 3:40 p. m."
function formatearFecha(iso) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

// ---------- Seguridad: escapar texto antes de meterlo en innerHTML ----------
// Si alguien escribe <img src=x onerror=alert(1)> como dirección y lo
// pegamos tal cual con innerHTML, el navegador lo EJECUTA (eso es XSS).
// Esta función convierte < > & " ' en texto inofensivo.
function escaparHTML(texto) {
  return String(texto ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// ---------- Etapas del pedido ----------
// El orden de este array ES el orden del camión. "valor" coincide con el
// check de pedidos.estado (sql/current_schema.json). 'carrito' no es una
// etapa (todavía no se compró) y 'cancelado' va aparte: no es un paso del
// camión, corta el camino en cualquier punto.
const ETAPAS = [
  { valor: 'confirmado', titulo: 'Pedido confirmado',
    mensaje: 'Recibimos tu pedido. Pronto lo vamos a despachar.' },
  { valor: 'enviado',    titulo: 'Enviado',
    mensaje: 'Tu pedido salió y va rumbo a tu dirección.' },
  { valor: 'entregado',  titulo: 'Entregado',
    mensaje: 'Tu pedido fue entregado. ¡Que lo disfrutes!' },
];

const ETAPA_CANCELADO = { valor: 'cancelado', titulo: 'Cancelado',
  mensaje: 'Este pedido fue cancelado. Si tienes dudas, escríbenos.' };

function etapaDe(estado) {
  if (estado === 'cancelado') return ETAPA_CANCELADO;
  return ETAPAS.find(e => e.valor === estado) ?? ETAPAS[0];
}

// ---------- Tema claro / oscuro ----------
// Misma clave "tema" que admin.js, cliente.js y galeria.js: todas las
// páginas recuerdan el mismo tema
const btnTema = document.getElementById('btn-tema');

function aplicarTema(tema) {
  document.documentElement.dataset.theme = tema;
  const etiqueta = tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
  btnTema.textContent = tema === 'dark' ? '☀' : '☾';
  btnTema.setAttribute('aria-label', etiqueta);
  btnTema.title = etiqueta;
}

let temaGuardado = 'dark';
try { temaGuardado = localStorage.getItem('tema') || 'dark'; } catch (_) {}
aplicarTema(temaGuardado);

btnTema.addEventListener('click', () => {
  const nuevo = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  aplicarTema(nuevo);
  try { localStorage.setItem('tema', nuevo); } catch (_) {}
});
