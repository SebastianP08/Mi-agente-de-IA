// =====================================================================
// perfilMenu.js — círculo de perfil + menú en galeria.html, pago.html y
// pedido.html, para que "Mi cuenta" y "Mis pedidos" siempre estén a mano.
// (cliente.html tiene el suyo propio en cliente.js.)
//
// Necesita: supabaseClient.js (db) cargado antes, un <div id="perfil-global">
// en el header y css/perfil.css.
//
// Todo va dentro de una función que se llama sola: así sus variables no
// chocan con las de pago.js, pedido.js o catalogo.js (que tienen, por
// ejemplo, su propio pedidoId).
// =====================================================================
(async function iniciarPerfilGlobal() {
  const contenedor = document.getElementById('perfil-global');
  if (!contenedor) return;

  const { data } = await db.auth.getUser();
  const usuario = data?.user;

  // Sin sesión: un enlace para entrar
  if (!usuario) {
    contenedor.innerHTML = '<a class="perfil-login" href="cliente.html">Iniciar sesión</a>';
    return;
  }

  // El nombre sale de clientes_practica (RLS: cada uno lee su fila)
  const { data: cliente } = await db
    .from('clientes_practica')
    .select('nombre')
    .eq('id', usuario.id)
    .maybeSingle();

  const nombre = cliente?.nombre || 'Cliente';

  // El HTML fijo va con innerHTML; el nombre y el correo (que escribió el
  // usuario) van con textContent → no se pueden colar etiquetas (XSS)
  contenedor.className = 'perfil';
  contenedor.innerHTML = `
    <button id="perfil-global-btn" class="btn-round btn-avatar" type="button"
            aria-expanded="false" aria-controls="perfil-global-menu" aria-label="Abrir menú de perfil"></button>
    <div id="perfil-global-menu" class="perfil-menu" hidden>
      <div class="perfil-cabecera">
        <strong id="perfil-global-nombre"></strong>
        <span id="perfil-global-correo"></span>
      </div>
      <a class="perfil-item" href="cliente.html">Mi cuenta</a>
      <a class="perfil-item" href="cliente.html?vista=productos">Productos</a>
      <a class="perfil-item" href="pedido.html">Mis pedidos</a>
      <hr class="perfil-separador" />
      <button id="perfil-global-salir" type="button" class="perfil-item perfil-item--peligro">Cerrar sesión</button>
    </div>
  `;

  const btn  = document.getElementById('perfil-global-btn');
  const menu = document.getElementById('perfil-global-menu');

  btn.textContent = nombre.trim().charAt(0).toUpperCase();
  document.getElementById('perfil-global-nombre').textContent = nombre;
  document.getElementById('perfil-global-correo').textContent = usuario.email ?? '';

  function abrir()  { menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); }
  function cerrar() { menu.hidden = true;  btn.setAttribute('aria-expanded', 'false'); }

  btn.addEventListener('click', () => (menu.hidden ? abrir() : cerrar()));

  // Clic fuera del menú → se cierra
  document.addEventListener('click', (e) => {
    if (!contenedor.contains(e.target)) cerrar();
  });

  // Esc → se cierra y el foco vuelve al círculo
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) { cerrar(); btn.focus(); }
  });

  // Cerrar sesión: el carrito sigue guardado en Supabase; aquí solo se
  // borra la copia local para no dejársela al siguiente que use el PC
  document.getElementById('perfil-global-salir').addEventListener('click', async () => {
    await db.auth.signOut();
    try { localStorage.removeItem('carrito'); } catch (_) {}
    location.href = 'cliente.html';
  });
})();
