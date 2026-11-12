// =====================================================================
// tienda.js — utilidades compartidas de pago.html y pedido.html.
// Se carga DESPUÉS de supabaseClient.js y ANTES de pago.js / pedido.js,
// así esas dos pueden usar estas funciones sin volver a escribirlas.
// =====================================================================

// ---------- Precios ----------
// Mismas fórmulas que galeria.js: si cambian allá, cambiarlas aquí
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
// check (...) de la columna estado en sql/pedidos.sql, y "campoFecha" con
// la columna donde el trigger guarda cuándo se llegó a esa etapa.
const ETAPAS = [
  { valor: 'pagado',     titulo: 'Pago confirmado', campoFecha: 'created_at',
    mensaje: 'Recibimos tu pago. Pronto empezaremos a preparar tu pedido.' },
  { valor: 'preparando', titulo: 'Preparando',      campoFecha: 'preparando_at',
    mensaje: 'Estamos empacando tus productos.' },
  { valor: 'en_camino',  titulo: 'En camino',       campoFecha: 'en_camino_at',
    mensaje: 'Tu pedido salió y va rumbo a tu dirección.' },
  { valor: 'entregado',  titulo: 'Entregado',       campoFecha: 'entregado_at',
    mensaje: 'Tu pedido fue entregado. ¡Que lo disfrutes!' },
];

function etapaDe(estado) {
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
