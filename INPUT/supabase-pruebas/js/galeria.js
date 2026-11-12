// galeria.js — solo lo propio de galeria.html. Las tarjetas, filtros,
// modal y carrito viven en catalogo.js (compartido con cliente.html),
// que se carga antes que este archivo.

// ---------- Tema claro / oscuro ----------

function aplicarTema() {
  const oscuro = document.documentElement.dataset.theme !== 'light';
  document.getElementById('btn-tema').textContent = oscuro ? '☀' : '☾';
  document.getElementById('btn-tema').ariaLabel = oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';
}

document.getElementById('btn-tema').addEventListener('click', () => {
  const esOscuro = document.documentElement.dataset.theme !== 'light';
  document.documentElement.dataset.theme = esOscuro ? 'light' : 'dark';
  try { localStorage.setItem('tema', document.documentElement.dataset.theme); } catch (_) {}
  aplicarTema();
});

try {
  const guardado = localStorage.getItem('tema');
  if (guardado) document.documentElement.dataset.theme = guardado;
} catch (_) {}
aplicarTema();

// ---------- Arranque ----------
renderizarCarrito();
cargarProductos();
