// ---------- Ojito de la contraseña ----------
// Mismo código que cliente.js: cambiar type="password" ↔ type="text"
// previousElementSibling = el input justo antes del botón
document.querySelectorAll('.btn-ojo').forEach((boton) => {
  boton.addEventListener('click', () => {
    const input = boton.previousElementSibling;
    const mostrar = input.type === 'password';
    input.type = mostrar ? 'text' : 'password';
    boton.setAttribute('aria-pressed', mostrar);
    boton.setAttribute('aria-label', mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña');
  });
});

// ---------- Alternar login ↔ registro ----------
// Misma idea que mostrarFormulario() en cliente.js: un solo panel con
// dos vistas, se muestra una y se oculta la otra con hidden
function mostrarFormularioAdmin(cual) {
  document.getElementById('vista-login-admin').hidden = cual !== 'login';
  document.getElementById('vista-registro-admin').hidden = cual !== 'registro';
}

// Los links "Crea una" / "Inicia sesión" dicen a dónde ir en data-ir
document.querySelectorAll('[data-ir]').forEach((boton) => {
  boton.addEventListener('click', () => {
    mostrarFormularioAdmin(boton.dataset.ir);
  });
});

// ---------- Registro ----------
document.getElementById('form-registro-admin').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const form = evento.target;

  const { data, error } = await db.auth.signUp({
    email: document.getElementById('admin-registro-correo').value.trim(),
    password: document.getElementById('admin-registro-password').value,
  });

  if (error) {
    document.getElementById('estado-sesion-admin').textContent = 'Error al registrar: ' + error.message;
    return;
  }

  const { error: errorPerfil } = await db.from('admin_practica').insert([{
    id: data.user.id,
    nombre: document.getElementById('admin-registro-nombre').value.trim(),
    correo: document.getElementById('admin-registro-correo').value.trim(),
  }]);

  if (errorPerfil) {
    document.getElementById('estado-sesion-admin').textContent = 'Cuenta creada, pero falló el perfil: ' + errorPerfil.message;
    return;
  }

  document.getElementById('estado-sesion-admin').textContent = 'Cuenta de administrador creada. Ya puedes iniciar sesión.';
  form.reset();
  mostrarFormularioAdmin('login');   // lo lleva al login, igual que en cliente.js
});

// ---------- Login ----------
document.getElementById('form-login-admin').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const form = evento.target;

  const { error } = await db.auth.signInWithPassword({
    email: document.getElementById('admin-login-correo').value.trim(),
    password: document.getElementById('admin-login-password').value,
  });

  if (error) {
    document.getElementById('estado-sesion-admin').textContent = 'Error al iniciar sesión: ' + error.message;
    return;
  }

  form.reset();
  mostrarEstadoSesionAdmin();
});

async function mostrarEstadoSesionAdmin() {
  const { data } = await db.auth.getUser();
  const estado        = document.getElementById('estado-sesion-admin');
  const zonaAcceso    = document.getElementById('zona-acceso-admin');
  const zonaCrud      = document.getElementById('zona-crud');
  const perfilAdmin   = document.getElementById('perfil-admin');
  const btnFallback   = document.getElementById('btn-logout-fallback');

  if (!data.user) {
    estado.innerText    = 'No has iniciado sesión.';
    zonaAcceso.hidden   = false;
    zonaCrud.hidden     = true;
    perfilAdmin.hidden  = true;
    btnFallback.hidden  = true;
    return;
  }

  const { data: perfil } = await db.from('admin_practica').select('nombre').eq('id', data.user.id).single();

  if (perfil) {
    estado.innerText    = 'Sesión iniciada como ' + perfil.nombre + ' (admin).';
    zonaAcceso.hidden   = true;
    zonaCrud.hidden     = false;
    perfilAdmin.hidden  = false;
    btnFallback.hidden  = true;

    document.getElementById('btn-perfil-admin').textContent =
      (perfil.nombre || data.user.email || '?').trim().charAt(0).toUpperCase();
    document.getElementById('menu-nombre-admin').textContent = perfil.nombre || 'Admin';
    document.getElementById('menu-correo-admin').textContent = data.user.email || '';

    mostrarVista('productos');
  } else {
    estado.innerText    = 'Sesión iniciada, pero sin perfil de administrador.';
    zonaAcceso.hidden   = false;
    zonaCrud.hidden     = true;
    perfilAdmin.hidden  = true;
    btnFallback.hidden  = false;
  }
}

// ---------- Menú del círculo de perfil ----------
const btnPerfilAdmin  = document.getElementById('btn-perfil-admin');
const menuPerfilAdmin = document.getElementById('menu-perfil-admin');

function abrirMenuPerfilAdmin() {
  menuPerfilAdmin.hidden = false;
  btnPerfilAdmin.setAttribute('aria-expanded', 'true');
}

function cerrarMenuPerfilAdmin() {
  menuPerfilAdmin.hidden = true;
  btnPerfilAdmin.setAttribute('aria-expanded', 'false');
}

btnPerfilAdmin.addEventListener('click', () => {
  if (menuPerfilAdmin.hidden) abrirMenuPerfilAdmin();
  else cerrarMenuPerfilAdmin();
});

document.addEventListener('click', (event) => {
  if (!document.getElementById('perfil-admin').contains(event.target)) {
    cerrarMenuPerfilAdmin();
  }
});

document.getElementById('btn-logout-admin').addEventListener('click', async () => {
  cerrarMenuPerfilAdmin();
  await db.auth.signOut();
  mostrarEstadoSesionAdmin();
});

document.getElementById('btn-logout-fallback').addEventListener('click', async () => {
  await db.auth.signOut();
  mostrarEstadoSesionAdmin();
});

mostrarEstadoSesionAdmin();

// ANTES era una función anónima dentro de addEventListener('click', ...).
// AHORA tiene nombre, porque la llaman DOS lugares: el botón "Recargar" y
// mostrarVista("productos") cada vez que entras a esa vista.
async function traerProductos() {

  // "async" convierte esta función en una función
  // ASÍNCRONA: una función que PUEDE usar "await" adentro para esperar
  // algo que tarda, sin congelar el resto de la página mientras espera.
  //
  // Diferencia clave con localStorage (semana 7): localStorage.getItem()
  // y localStorage.setItem() son operaciones SINCRÓNICAS — ocurren al
  // instante, en tu propio computador, sin viajar a ningún lado. Por eso
  // nunca necesitaste "async"/"await" para leer o escribir en
  // localStorage. Una consulta a Supabase, en cambio, viaja por internet
  // hasta el servidor de Supabase y la respuesta tiene que volver — eso
  // toma un tiempo real (aunque sea poco), y JavaScript necesita una
  // forma explícita de decir "espera aquí a que llegue la respuesta".

  // "await" pausa la ejecución DE ESTA FUNCIÓN (no de toda la página)
  // hasta que la consulta a Supabase responda. Mientras tanto, el resto
  // de tu página sigue funcionando con normalidad — solo esta función
  // en particular se detiene en esta línea hasta tener respuesta real.
  const { data, error } = await db.from('productos_practica').select('*');

  // Sin "await" en la línea de arriba, "data" y "error" NO tendrían el
  // resultado todavía — tendrías una "Promise" (promesa) sin resolver,
  // no los datos reales. Eso es justo lo que "await" evita: te obliga
  // a esperar antes de seguir usando el resultado.
  console.log(data, error);

 if (error) {
    // Revisamos "error" ANTES de tocar "data": si la consulta falló,
    // "data" llega como null, y usar null más adelante (ej. null.map())
    // rompería el script. Mismo patrón de "validar antes de operar"
    // que ya usaste en el CRUD de la semana 7.
    document.getElementById('resultado').textContent = 'Error: ' + error.message;
    return;
  }

  // JSON.stringify(data, null, 2) convierte el array completo a texto,
  // con sangría (el "2") para que se lea ordenado. Esta línea SÍ es
  // sincrónica (no necesita await) — ya no estamos esperando nada de
  // Supabase, solo transformando el array "data" que ya llegó.
  document.getElementById('resultado').textContent = JSON.stringify(data, null, 2);

  // ANTES: tres map() separados (nombres, descripciones, precios) → tres
  // listas sueltas donde no se veía qué precio era de qué producto.
  // AHORA: UN solo map() que recorre cada producto completo y arma su fila
  // <tr>, así nombre, descripción y precio quedan siempre juntos.
  const filas = data.map(producto => `
    <tr>
      <td class="col-id">${producto.id}</td>
      <td>${miniatura(producto)}</td>
      <td class="col-name">${producto.nombre}</td>
      <td class="col-desc">${producto.descripcion ?? ''}</td>
      <td class="col-price">${celdaPrecio(producto)}</td>
      <td class="col-num">${producto.descuento > 0 ? Math.round(producto.descuento * 100) + '%' : '—'}</td>
      <td class="col-num">${producto.unidades ?? 0}</td>
      <td>${producto.disponible
        ? '<span class="badge badge--ok">Disponible</span>'
        : '<span class="badge badge--off">Agotado</span>'}</td>
      <td>${etiquetas(producto.categorias)}</td>
      <td><button type="button" class="btn-secondary btn-small" data-id="${producto.id}">Editar</button></td>
    </tr>
  `).join('');
  // ?? '' → si la descripción viene null (campo vacío en Supabase),
  // ponemos texto vacío en vez de que aparezca la palabra "null"
  //
  // condición ? A : B (operador ternario) = un if/else que DEVUELVE un
  // valor, por eso se puede usar dentro de ${ } en un template string
  //
  // data-id="..." → guardamos el id DENTRO del botón. Al hacer clic, JS lo
  // lee con boton.dataset.id para saber qué producto cargar.

  document.getElementById('tabla-productos').innerHTML = `
    <table class="product-table">
      <thead>
        <tr>
          <th>ID</th><th></th><th>Nombre</th><th>Descripción</th>
          <th class="col-price">Precio</th><th class="col-num">Desc.</th><th class="col-num">Unid.</th>
          <th>Estado</th><th>Categorías</th><th></th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
  `;

  // Las tarjetas se arman SIEMPRE, igual que la tabla: así al cambiar de
  // modo (Tarjetas ↔ Tabla) no hay que volver a pedir nada a Supabase
  document.getElementById('tarjetas-productos').innerHTML =
    data.length > 0
      ? data.map(tarjetaProducto).join('')
      : '<p class="hint">Todavía no hay productos.</p>';
}
// ↑ Aquí termina traerProductos. Todo lo de abajo queda AFUERA,
// así se registra una sola vez al cargar la página.

// Sin paréntesis: le pasamos LA FUNCIÓN para que el botón la llame al
// hacer clic. Con paréntesis, traerProductos() se ejecutaría ya mismo.
document.getElementById('btn-traer').addEventListener('click', traerProductos);

// Intl.NumberFormat da formato de moneda según el país:
// 300000 → "$ 300.000" (es-CO usa punto para los miles)
function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
}

// Precio con descuento aplicado. descuento está guardado como fracción
// (0.1 = 10%), así que el precio final es precio * (1 - 0.1) = 90%.
// Si hay descuento, mostramos también el original tachado (<s>) debajo.
function celdaPrecio(producto) {
  if (!(producto.descuento > 0)) return formatearPrecio(producto.precio);
  const final = producto.precio * (1 - producto.descuento);
  return `${formatearPrecio(final)}<br><s class="price-original">${formatearPrecio(producto.precio)}</s>`;
}

// ["videojuego", "accion"] → una "pastilla" por categoría.
// ?? [] por si la columna viene null: [].map() no rompe, null.map() sí.
function etiquetas(categorias) {
  return (categorias ?? []).map(c => `<span class="tag">${c}</span>`).join(' ');
}

// Una tarjeta al estilo de .category-card de Jaziz: arriba la foto (con la
// misma foto difuminada de fondo) y el nombre sobre un degradado; abajo
// precio, unidades, descripción y categorías.
// data.map(tarjetaProducto) funciona porque map le pasa cada producto
// como primer argumento — es lo mismo que data.map(p => tarjetaProducto(p))
function tarjetaProducto(p) {
  const foto = p.Img_url
    ? `<span class="card-bg" style="background-image: url('${p.Img_url}')"></span>
       <img src="${p.Img_url}" alt="" loading="lazy">`
    : '<span class="sin-imagen">Sin imagen</span>';

  return `
    <article class="product-card ${p.disponible ? '' : 'product-card--off'}">
      <div class="product-card-media">
        ${foto}
        <div class="card-flags">
          ${p.disponible
            ? '<span class="badge badge--ok">Disponible</span>'
            : '<span class="badge badge--off">Agotado</span>'}
          ${p.descuento > 0 ? `<span class="card-descuento">-${Math.round(p.descuento * 100)}%</span>` : ''}
        </div>
        <div class="product-card-info">
          <p class="card-id">ID ${p.id}</p>
          <h3>${p.nombre}</h3>
        </div>
      </div>
      <div class="product-card-body">
        <div class="card-fila">
          <span class="card-precio">${celdaPrecio(p).replace('<br>', ' ')}</span>
          <span class="card-stock">${p.unidades ?? 0} unid.</span>
        </div>
        ${p.descripcion ? `<p class="card-desc">${p.descripcion}</p>` : ''}
        <div>${etiquetas(p.categorias)}</div>
        <button type="button" class="btn-secondary btn-small" data-id="${p.id}">Editar</button>
      </div>
    </article>
  `;
}
// .replace('<br>', ' ') → celdaPrecio pone el precio original DEBAJO (para
// la tabla); en la tarjeta lo queremos al lado, así que cambiamos el salto
// de línea por un espacio

// Devuelve el <img> del producto, o un cuadro gris vacío si no tiene Img_url.
// La usan la tabla y las sugerencias del buscador.
function miniatura(producto) {
  if (!producto.Img_url) return '<div class="thumb"></div>';
  // loading="lazy": el navegador solo descarga la imagen cuando va a verse
  return `<img class="thumb" src="${producto.Img_url}" alt="" loading="lazy">`;
}

// DELEGACIÓN DE EVENTOS: los botones "Editar" se crean con innerHTML cada
// vez que se cargan los productos, así que no existen al cargar la página y
// no les podemos poner addEventListener uno por uno. En cambio, escuchamos
// los clics en el CONTENEDOR (que sí existe siempre) y revisamos si el
// clic cayó en un botón con data-id.
// #productos-contenido envuelve la tabla Y las tarjetas: un solo listener
// sirve para los botones "Editar" de las dos.
document.getElementById('productos-contenido').addEventListener('click', (e) => {
  const boton = e.target.closest('button[data-id]');   // closest = el botón, aunque el clic caiga en su texto
  if (!boton) return;                                  // el clic fue en otra parte

  cargarProducto(boton.dataset.id);
  mostrarVista("editar");
});

// ---------- Selector Tarjetas / Tabla ----------
const botonesModo = document.querySelectorAll(".toggle-btn");

function aplicarModoProductos(modo) {
  // hidden = true en el que NO coincide con el modo elegido
  document.getElementById('tarjetas-productos').hidden = modo !== "tarjetas";
  document.getElementById('tabla-productos').hidden = modo !== "tabla";
  botonesModo.forEach(b => b.classList.toggle("activo", b.dataset.modo === modo));
}

botonesModo.forEach(boton => {
  boton.addEventListener("click", () => {
    aplicarModoProductos(boton.dataset.modo);
    localStorage.setItem("modoProductos", boton.dataset.modo);   // mismo truco que el tema
  });
});

aplicarModoProductos(localStorage.getItem("modoProductos") || "tarjetas");

// ---------- Sidebar: cambiar de vista (como mostrarVista en gestion.js) ----------
const vistas = document.querySelectorAll(".vista");
const itemsSidebar = document.querySelectorAll(".sidebar-item");

// Deja visible SOLO la vista cuyo data-vista coincide, y marca como
// "activo" su botón del sidebar. Las demás quedan con hidden.
function mostrarVista(nombreVista) {
  vistas.forEach(vista => {
    vista.hidden = vista.dataset.vista !== nombreVista;
  });
  itemsSidebar.forEach(item => {
    // toggle(clase, condición): la pone si la condición es true, la quita si es false
    item.classList.toggle("activo", item.dataset.vista === nombreVista);
  });

  // Estas dos vistas muestran datos de Supabase: los pedimos de nuevo cada
  // vez que entras, así siempre ves lo último (incluido lo que acabas de
  // agregar, editar o borrar)
  if (nombreVista === "productos") traerProductos();
  if (nombreVista === "eliminar") renderizarEliminar();
  if (nombreVista === "pedidos") traerPedidos();
  if (nombreVista === "clientes") traerClientes();
  if (nombreVista === "finanzas") traerFinanzas();
}

itemsSidebar.forEach(item => {
  item.addEventListener("click", () => mostrarVista(item.dataset.vista));
});

  //crud
  // productoPrueba ya no se usa: ahora los datos salen del formulario.
  // Se deja comentado como referencia de la forma que espera la tabla.
  // const productoPrueba = {
  //   nombre: "Zelda Tears Of The Kingdom",
  //   descripcion: "Esto es un producto de prueba",
  //   precio: 300000,
  //   unidades: 10,
  //   descuento: 0.1,
  //   disponible: true,
  //   categorias: ["videojuego", "accion", "aventura"],
  //   Img_url: "https://upload.wikimedia.org/wikipedia/en/f/fb/The_Legend_of_Zelda_Tears_of_the_Kingdom_cover.jpg?utm_source=en.wikipedia.org&utm_campaign=index&utm_content=original"
  // }

    // AHORA (Supabase):
    async function agregarProducto(datos) {

    const { data, error } = await db
        .from('productos_practica')  // la tabla
        .insert([datos])             // insert() siempre recibe un ARRAY de objetos,
                                    // aunque insertes uno solo
        .select();                    // .select() le pide a Supabase que te
                                    // devuelva la fila ya creada (con su id
                                    // nuevo) — sin esto, insert() no te
                                    // devuelve nada útil

    if (error) {
        console.log("Error al agregar:", error);
        return null;
    }

    return data[0];   // data siempre es un array — tomamos el primer
                        // elemento, que es la fila recién creada
    }

    // Agregar y Editar tienen los mismos campos (mismos "name"), así que
    // ambos usan esta función: recibe CUALQUIER form y devuelve el objeto
    // listo para Supabase. Si mañana agregas una columna, la cambias solo aquí.
    function leerFormulario(f) {
        // Los inputs SIEMPRE devuelven strings ("300" no 300), por eso
        // hay que convertir cada valor al tipo que espera la tabla
        return {
            nombre: f.nombre.value.trim(),
            descripcion: f.descripcion.value.trim(),
            precio: Number(f.precio.value),
            unidades: Number(f.unidades.value),
            descuento: Number(f.descuento.value) / 100,   // 10 (%) → 0.1
            disponible: f.disponible.checked,              // checkbox: true/false, no .value
            categorias: f.categorias.value
                .split(",")                                // "a, b" → ["a", " b"]
                .map(c => c.trim())                        // → ["a", "b"]
                .filter(c => c !== ""),                    // quita vacíos si sobra una coma
            Img_url: f.Img_url.value.trim()
        };
    }

    const form = document.getElementById("form-producto");

    // "submit" se dispara al hacer clic en el botón del form O al dar Enter
    form.addEventListener("submit", async (e) => {
        // Sin esto, el form recarga la página y se pierde todo
        e.preventDefault();

        const newProduct = leerFormulario(form);

        const respuesta = await agregarProducto(newProduct);
        const notificacion = document.getElementById("notificacion");
        if (respuesta){
            notificacion.textContent = "Producto agregado con ID: " + respuesta.id;
            // className reemplaza TODAS las clases: por eso repetimos "message"
            notificacion.className = "message message--success";
            form.reset();   // limpia los campos para el siguiente producto
        }else{
            notificacion.textContent = "Error al agregar el producto. Revisa la consola.";
            notificacion.className = "message message--error";
        }
    });
    // ↑ Aquí termina el listener de "agregar". Las funciones de búsqueda
    // van AFUERA para que cualquier otro listener pueda usarlas.

        async function buscarProductoPorId(id) {
        const { data, error } = await db

        
            .from('productos_practica')
            .select('*')
            .eq('id', id)    // eq = "equal" (igual a) — equivalente a find(p => p.id === id)
            .single();         // single() = "espero exactamente una fila, dámela
                                // como objeto, no como array de un elemento"

        if (error) return null;
        return data;
        }

        // ANTES: buscarProductosPorNombre(texto) solo buscaba por nombre.
        // AHORA: busca por nombre O por ID, para el buscador con sugerencias.
        async function buscarProductos(texto) {
        // Quitamos , ( ) porque .or() los usa como separadores de su
        // propia sintaxis — si el usuario los escribe, romperían el filtro
        const limpio = texto.replace(/[,()]/g, '');

        // ilike = "like" insensible a mayúsculas/minúsculas.
        // los símbolos % significan "cualquier texto antes/después" —
        // equivalente a .toLowerCase().includes(texto)
        let filtro = `nombre.ilike.%${limpio}%`;

        // /^\d+$/ = "solo dígitos". Solo en ese caso buscamos también por id:
        // comparar la columna id (un número) con "zelda" le daría error a Supabase
        if (/^\d+$/.test(limpio)) {
            filtro += `,id.eq.${limpio}`;
        }

        const { data, error } = await db
            .from('productos_practica')
            .select('*')
            .or(filtro)     // .or("A,B") = filas que cumplan A ó B
            .limit(8);      // como Google: unas pocas sugerencias, no toda la tabla

        if (error) {
            console.log("Error al buscar:", error);
            return [];
        }
        return data;
        }

    // ---------- Modo claro / oscuro ----------
    // El tema vive en el atributo data-theme del <html>. El CSS tiene un
    // bloque :root[data-theme="light"] que cambia las variables de color,
    // así que JS solo tiene que cambiar ESTE atributo, nada más.
    const btnTema = document.getElementById("btn-tema");

    function aplicarTema(tema) {
        document.documentElement.dataset.theme = tema;   // documentElement = la etiqueta <html>
        // El botón ahora es redondo y solo muestra un ícono: ☀ = "pasar a
        // claro", ☾ = "pasar a oscuro". Como un ícono solo no se "lee",
        // aria-label le dice a los lectores de pantalla qué hace, y title
        // muestra ese texto al dejar el mouse encima
        const etiqueta = tema === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
        btnTema.textContent = tema === "dark" ? "☀" : "☾";
        btnTema.setAttribute("aria-label", etiqueta);
        btnTema.title = etiqueta;
    }

    // localStorage (semana 7) recuerda la elección al recargar la página.
    // Si nunca se eligió, arranca en oscuro.
    aplicarTema(localStorage.getItem("tema") || "dark");

    btnTema.addEventListener("click", () => {
        const nuevo = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        aplicarTema(nuevo);
        localStorage.setItem("tema", nuevo);
    });

// AHORA (Supabase resuelve "encontrar y actualizar" en una sola instrucción):
async function modificarProducto(id, cambios) {

  const { data, error } = await db
    .from('productos_practica')
    .update(cambios)   // solo actualiza las propiedades que vengan en "cambios"
    .eq('id', id)        // ...de la fila donde el id coincida
    .select();

  if (error) return null;
  return data[0];
}

// ---------- Editar: Buscar/Editar en tabla → modificar campos → Guardar ----------
const formEditar = document.getElementById("form-editar");
const camposEditar = document.getElementById("campos-editar");
const notificacionEditar = document.getElementById("notificacion-editar");
const inputBusqueda = document.getElementById("input-busqueda");
const listaSugerencias = document.getElementById("sugerencias");

// Guardamos el id del producto QUE SE CARGÓ. Si usáramos lo que está
// escrito en el input al guardar, alguien podría cambiar el número
// después de cargar y terminaría modificando otro producto sin querer.
let idCargado = null;

function mostrarMensajeEditar(texto, tipo) {
  notificacionEditar.textContent = texto;
  notificacionEditar.className = "message message--" + tipo;
}

// ANTES esto vivía dentro del listener del botón "Cargar". Ahora es una
// función propia porque la llaman DOS lugares: el buscador y el botón
// "Editar" de la tabla.
async function cargarProducto(id) {
  const producto = await buscarProductoPorId(id);   // la función que ya tenías

  if (!producto) {
    idCargado = null;
    camposEditar.disabled = true;
    mostrarMensajeEditar("No existe un producto con ID " + id + ".", "error");
    return;
  }

  // Lo contrario de leerFormulario(): de la fila de Supabase → a los inputs
  formEditar.nombre.value = producto.nombre;
  formEditar.descripcion.value = producto.descripcion ?? '';
  formEditar.precio.value = producto.precio;
  formEditar.unidades.value = producto.unidades;
  formEditar.descuento.value = producto.descuento * 100;                 // 0.1 → 10 (%)
  formEditar.disponible.checked = producto.disponible;
  formEditar.categorias.value = (producto.categorias ?? []).join(", ");   // ["a","b"] → "a, b"
  formEditar.Img_url.value = producto.Img_url ?? '';

  idCargado = producto.id;
  camposEditar.disabled = false;
  mostrarMensajeEditar("Editando: " + producto.nombre + " (ID " + producto.id + ")", "info");
}

// ---------- Buscador con sugerencias (tipo Google) ----------

// DEBOUNCE: sin esto, escribir "zelda" haría 5 consultas a Supabase (z, ze,
// zel, zeld, zelda). Con debounce, cada tecla REINICIA un temporizador de
// 300 ms, y la consulta solo sale cuando dejas de escribir ese tiempo.
let temporizador = null;

// Las respuestas de Supabase no siempre llegan en el orden en que se
// pidieron: la de "zel" podría llegar DESPUÉS que la de "zelda" y pisarla.
// Numeramos cada búsqueda y solo pintamos la respuesta de la más reciente.
let numeroBusqueda = 0;

// Guardamos las sugerencias que se están mostrando, para que Enter pueda
// elegir la primera sin volver a consultar
let sugerenciasActuales = [];

inputBusqueda.addEventListener("input", () => {   // "input" = cada vez que cambia el texto
  clearTimeout(temporizador);                     // cancela la cuenta anterior

  const texto = inputBusqueda.value.trim();
  if (texto === "") {
    cerrarSugerencias();
    return;
  }

  temporizador = setTimeout(async () => {
    const miNumero = ++numeroBusqueda;
    const productos = await buscarProductos(texto);
    if (miNumero !== numeroBusqueda) return;      // llegó tarde: ya hay una búsqueda más nueva
    mostrarSugerencias(productos);
  }, 300);
});

function mostrarSugerencias(productos) {
  sugerenciasActuales = productos;

  if (productos.length === 0) {
    listaSugerencias.innerHTML = '<li class="empty">Sin resultados</li>';
  } else {
    listaSugerencias.innerHTML = productos.map(p => `
      <li data-id="${p.id}">
        ${miniatura(p)}
        <span class="suggestion-name">${p.nombre}</span>
        <span class="suggestion-meta">ID ${p.id} · ${formatearPrecio(p.precio)}</span>
      </li>
    `).join('');
  }
  listaSugerencias.hidden = false;
}

function cerrarSugerencias() {
  listaSugerencias.hidden = true;
  sugerenciasActuales = [];
}

function elegirSugerencia(id) {
  cerrarSugerencias();
  inputBusqueda.value = "";
  cargarProducto(id);
  mostrarVista("editar");
}

// Misma delegación de eventos que en la tabla: un solo listener en la <ul>
listaSugerencias.addEventListener("click", (e) => {
  const item = e.target.closest("li[data-id]");
  if (item) elegirSugerencia(item.dataset.id);
});

inputBusqueda.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    if (sugerenciasActuales.length > 0) elegirSugerencia(sugerenciasActuales[0].id);
  }
  if (e.key === "Escape") cerrarSugerencias();
});

// Clic en cualquier parte FUERA del buscador → cerrar la lista
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-box")) cerrarSugerencias();
});

formEditar.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (idCargado === null) return;

  const respuesta = await modificarProducto(idCargado, leerFormulario(formEditar));

  if (respuesta) {
    // Ya no hace falta recargar la tabla aquí: mostrarVista("productos")
    // la vuelve a pedir cuando entres a esa vista
    mostrarMensajeEditar("Producto " + respuesta.id + " actualizado.", "success");
  } else {
    mostrarMensajeEditar("No se pudo actualizar el producto.", "error");
  }
});

// AHORA:
async function eliminarProducto(id) {

  const { data, error } = await db
    .from('productos_practica')
    .delete()
    .eq('id', id)
    .select();   // igual que en modificarProducto: devuelve las filas BORRADAS

  if (error) {
    console.log("Error al eliminar:", error);
    return false;
  }

  // Si el id no existe (o Supabase no deja borrar por RLS), NO hay error:
  // simplemente no se borra nada y data llega vacío. Por eso no basta con
  // !error — revisamos que de verdad se haya borrado al menos una fila.
  return data.length > 0;
}

// ---------- Eliminar: una fila por producto con su botón ----------
const listaEliminar = document.getElementById("lista-eliminar");
const notificacionEliminar = document.getElementById("notificacion-eliminar");

async function renderizarEliminar() {
  const { data, error } = await db
    .from('productos_practica')
    .select('*')
    .order('id');   // ordenados por id, para que la lista no cambie de orden

  if (error) {
    listaEliminar.textContent = "Error: " + error.message;
    return;
  }
  if (data.length === 0) {
    listaEliminar.innerHTML = '<p class="hint">No hay productos.</p>';
    return;
  }

  listaEliminar.innerHTML = data.map(p => `
    <div class="fila-eliminar">
      ${miniatura(p)}
      <div class="fila-eliminar-info">
        <strong>${p.nombre}</strong>
        <span>ID ${p.id} · ${formatearPrecio(p.precio)}</span>
      </div>
      <button type="button" class="btn-danger btn-small" data-id="${p.id}">Eliminar</button>
    </div>
  `).join('');
}

// Delegación de eventos otra vez: las filas se crean con innerHTML
listaEliminar.addEventListener("click", async (e) => {
  const boton = e.target.closest("button[data-id]");
  if (!boton) return;

  const id = boton.dataset.id;
  const nombre = boton.closest(".fila-eliminar").querySelector("strong").textContent;

  // confirm() muestra una ventana con Aceptar/Cancelar y devuelve true/false.
  // Borrar no se puede deshacer, así que preguntamos antes.
  if (!confirm(`¿Eliminar "${nombre}"? No se puede deshacer.`)) return;

  const borrado = await eliminarProducto(id);

  if (borrado) {
    notificacionEliminar.textContent = `"${nombre}" eliminado.`;
    notificacionEliminar.className = "message message--success";

    // Si justo era el producto abierto en Editar, lo "descargamos": si no,
    // el formulario seguiría intentando guardar un id que ya no existe.
    // String(): idCargado es número y dataset.id siempre es texto
    if (String(idCargado) === id) {
      idCargado = null;
      formEditar.reset();
      camposEditar.disabled = true;
      notificacionEditar.textContent = "";
    }

    renderizarEliminar();   // volvemos a pintar la lista, ya sin ese producto
  } else {
    notificacionEliminar.textContent = `No se pudo eliminar "${nombre}".`;
    notificacionEliminar.className = "message message--error";
  }
});

// ---------- Arranque ----------
// mostrarVista("productos") YA NO se llama aquí directamente: ahora lo
// llama mostrarEstadoSesionAdmin() solo cuando confirma que hay sesión
// de admin válida. Así no pedimos productos a Supabase antes de saber
// quién está usando la página.

// ---------- Pedidos (el admin cambia la etapa) ----------
// Ahora desde Supabase (antes: localStorage con pedidosLocal.js).
// Los mismos valores del check de pedidos.estado (sql/current_schema.json).
// 'carrito' no aparece: un carrito abierto todavía no es un pedido.
const ESTADOS_PEDIDO = {
  confirmado: 'Confirmado',
  enviado:    'Enviado',
  entregado:  'Entregado',
  cancelado:  'Cancelado',
};

// Las mismas transiciones que permite el trigger validar_transicion_estado
// (sql/trigger_order_status.sql). El <select> solo ofrece estas; si alguien
// fuerza otra, la base la rechaza igual. 'entregado' y 'cancelado' son finales.
const SIGUIENTES_ESTADOS = {
  confirmado: ['enviado', 'cancelado'],
  enviado:    ['entregado', 'cancelado'],
  entregado:  [],
  cancelado:  [],
};

// Texto del botón que lleva a cada estado
const ACCION_ESTADO = {
  enviado:   'Marcar enviado',
  entregado: 'Marcar entregado',
  cancelado: 'Cancelar',
};

// Dirección, teléfono y observación los escribe el CLIENTE. Si alguien pone
// <img src=x onerror=...> y lo pegamos tal cual con innerHTML, ese código
// correría en el navegador del ADMIN (XSS). Esto lo vuelve texto inofensivo.
function escaparHTML(texto) {
  return String(texto ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function formatearFechaHora(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

const tablaPedidos        = document.getElementById('tabla-pedidos');
const notificacionPedidos = document.getElementById('notificacion-pedidos');

function mostrarMensajePedidos(texto, tipo) {
  notificacionPedidos.className = 'message message--' + tipo;
  notificacionPedidos.textContent = texto;
}

async function traerPedidos() {
  tablaPedidos.innerHTML = '<p class="hint">Cargando pedidos…</p>';

  // Dos consultas en paralelo (Promise.all = las dos a la vez, no una tras otra):
  // 1) pedidos con su cliente y sus líneas, gracias a las FK:
  //    pedidos.cliente_id → clientes_practica, detalles_pedidos.pedido_id → pedidos,
  //    detalles_pedidos.producto_id → productos_practica
  // 2) el total de cada pedido, que calcula la vista (el navegador NO suma precios)
  // RLS deja al admin ver todos: ver_pedidos, ver_detalles y admin_ve_clientes.
  const [respPedidos, respTotales] = await Promise.all([
    db.from('pedidos')
      .select(`id, estado, envio, direccion, telefono, observacion, created_at, confirmado_en,
               clientes_practica(nombre, correo),
               detalles_pedidos(cantidad, productos_practica(nombre))`)
      .neq('estado', 'carrito')
      .order('id', { ascending: false }),
    db.from('pedidos_con_total')
      .select('id, total')
      .neq('estado', 'carrito'),
  ]);

  const error = respPedidos.error || respTotales.error;
  if (error) {
    console.log('Error al leer pedidos:', error);
    tablaPedidos.innerHTML = '<p class="hint">No se pudieron leer los pedidos. Revisa la consola.</p>';
    return;
  }

  const pedidos = respPedidos.data;
  if (pedidos.length === 0) {
    tablaPedidos.innerHTML = '<p class="hint">Todavía no hay pedidos confirmados.</p>';
    return;
  }

  // { id_pedido: total } para buscar el total de cada fila sin recorrer la lista
  const totales = {};
  for (const t of respTotales.data) totales[t.id] = t.total;

  const filas = pedidos.map((p) => {
    const cliente = p.clientes_practica ?? {};
    // "2× Collar, 1× Anillo"
    const items = p.detalles_pedidos
      .map((d) => `${d.cantidad}× ${escaparHTML(d.productos_practica?.nombre ?? 'Producto borrado')}`)
      .join(', ');

    const entrega = p.envio
      ? `Envío a domicilio<br><span class="hint">${escaparHTML(p.direccion)} · ${escaparHTML(p.telefono)}</span>`
      : 'Recoge en tienda';
    const observacion = p.observacion
      ? `<br><span class="hint">“${escaparHTML(p.observacion)}”</span>`
      : '';

    // Estado actual como etiqueta de color + un botón por cada estado al que
    // puede pasar. En entregado / cancelado no hay botones (son finales).
    // (Antes era un <select>: sus opciones las dibuja el sistema operativo y
    // casi no se pueden estilizar.)
    const botones = SIGUIENTES_ESTADOS[p.estado].map((valor) =>
      `<button type="button" class="btn-estado btn-estado--${valor}" data-id="${p.id}" data-estado="${valor}">${ACCION_ESTADO[valor]}</button>`
    ).join('');

    return `
      <tr>
        <td class="col-id">#${p.id}</td>
        <td>${formatearFechaHora(p.confirmado_en)}</td>
        <td class="col-name">${escaparHTML(cliente.nombre || 'Sin nombre')}<br><span class="hint">${escaparHTML(cliente.correo)}</span></td>
        <td class="col-items">${items}</td>
        <td>${entrega}${observacion}</td>
        <td class="col-price">${formatearPrecio(totales[p.id] ?? 0)}</td>
        <td class="col-estado">
          <div class="acciones-estado">
            <span class="estado-pedido estado-pedido--${p.estado}">${ESTADOS_PEDIDO[p.estado]}</span>
            ${botones}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tablaPedidos.innerHTML = `
    <table class="product-table">
      <thead>
        <tr><th>Pedido</th><th>Confirmado</th><th>Cliente</th><th>Productos</th><th>Entrega</th><th class="col-price">Total</th><th>Estado</th></tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
  `;
}

// Devuelve null si salió bien, o el mensaje de error para mostrar.
async function cambiarEstadoPedido(id, estado) {
  // Como modificarProducto(): update + .select() para detectar 0 filas.
  // grant update (estado) deja tocar solo esa columna; la política
  // admin_actualiza_estado deja pasar solo al admin; el trigger valida la
  // transición y otro trigger guarda el cambio en historial_estados_pedido.
  const { data, error } = await db
    .from('pedidos')
    .update({ estado })
    .eq('id', id)
    .select();

  if (error) {
    console.log('Error al cambiar el estado:', error);
    return error.message; // p. ej. 'Transicion de estado no permitida: entregado -> enviado'
  }
  // 0 filas sin error = RLS no dejó (o el pedido no existe)
  if (data.length === 0) {
    console.log('No se actualizó ninguna fila (¿RLS?).');
    return 'No se actualizó el pedido. Revisa la consola.';
  }
  return null;
}

// Delegación: un solo listener para todos los botones de estado de la tabla
tablaPedidos.addEventListener('click', async (e) => {
  const btn = e.target.closest('.btn-estado');
  if (!btn) return;

  const { id, estado } = btn.dataset;

  // Cancelar es final (el trigger no deja salir de 'cancelado'): se confirma antes
  if (estado === 'cancelado' && !confirm(`¿Cancelar el pedido #${id}? No se puede deshacer.`)) return;

  // Deshabilita los botones de ESA fila mientras se guarda (evita doble clic)
  const fila = btn.closest('tr');
  fila.querySelectorAll('.btn-estado').forEach((b) => { b.disabled = true; });

  const error = await cambiarEstadoPedido(id, estado);

  if (error) {
    fila.querySelectorAll('.btn-estado').forEach((b) => { b.disabled = false; });
    mostrarMensajePedidos('No se pudo cambiar el estado: ' + error, 'error');
    return;
  }

  mostrarMensajePedidos(`Pedido #${id} → ${ESTADOS_PEDIDO[estado]}.`, 'success');
  // Se vuelve a dibujar la tabla: así la fila muestra el NUEVO estado y los
  // botones de lo que sigue (o ninguno si llegó a entregado / cancelado)
  traerPedidos();
});

document.getElementById('btn-recargar-pedidos').addEventListener('click', traerPedidos);


// ---------- Mis clientes ----------
const tablaClientes = document.getElementById('tabla-clientes');

async function traerClientes() {
  tablaClientes.innerHTML = '<p class="hint">Cargando clientes…</p>';

  // La política admin_ve_clientes deja al admin leer todas las filas.
  // pedidos(estado, confirmado_en) viene anidado por la FK pedidos.cliente_id.
  const { data, error } = await db
    .from('clientes_practica')
    .select('id, nombre, correo, telefono, direccion, created_at, pedidos(estado, confirmado_en)')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Error al leer clientes:', error);
    tablaClientes.innerHTML = '<p class="hint">No se pudieron leer los clientes. Revisa la consola.</p>';
    return;
  }

  if (data.length === 0) {
    tablaClientes.innerHTML = '<p class="hint">Todavía no hay clientes registrados.</p>';
    return;
  }

  const filas = data.map((c) => {
    // Solo cuentan los pedidos de verdad (no el carrito abierto)
    const pedidos = c.pedidos.filter((p) => p.estado !== 'carrito');
    const ultimo = pedidos
      .map((p) => p.confirmado_en)
      .filter(Boolean)
      .sort()
      .at(-1); // fechas ISO: ordenadas como texto quedan en orden cronológico

    return `
      <tr>
        <td class="col-name">${escaparHTML(c.nombre || 'Sin nombre')}<br><span class="hint">${escaparHTML(c.correo)}</span></td>
        <td>${escaparHTML(c.telefono || '—')}</td>
        <td>${escaparHTML(c.direccion || '—')}</td>
        <td>${new Date(c.created_at).toLocaleDateString('es-CO')}</td>
        <td class="col-num">${pedidos.length}</td>
        <td>${formatearFechaHora(ultimo)}</td>
      </tr>
    `;
  }).join('');

  tablaClientes.innerHTML = `
    <table class="product-table">
      <thead>
        <tr><th>Cliente</th><th>Teléfono</th><th>Dirección</th><th>Registro</th><th class="col-num">Pedidos</th><th>Último pedido</th></tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
  `;
}

document.getElementById('btn-recargar-clientes').addEventListener('click', traerClientes);


// ---------- Finanzas ----------
// Números resumidos de la tienda. Solo LEE (RLS deja al admin ver todo).
// Los totales de cada pedido salen de la vista pedidos_con_total (los
// calcula la base); aquí solo se suman para el resumen.
const ESTADOS_VENTA = ['confirmado', 'enviado', 'entregado']; // los cancelados no son ingreso

function tarjetaKpi(etiqueta, valor, detalle = '') {
  return `
    <div class="kpi">
      <span class="kpi-etiqueta">${etiqueta}</span>
      <span class="kpi-valor">${valor}</span>
      ${detalle ? `<span class="kpi-detalle">${detalle}</span>` : ''}
    </div>
  `;
}

async function traerFinanzas() {
  const kpis = document.getElementById('kpis-finanzas');
  kpis.innerHTML = '<p class="hint">Cargando…</p>';

  // Cuatro consultas a la vez:
  // 1) cuántos clientes (count exacto, head: true = sin traer las filas)
  // 2) estado y total de cada pedido (incluye carritos para contarlos aparte)
  // 3) las líneas vendidas: pedidos!inner + .in('pedidos.estado', …) filtra
  //    las líneas por el estado de SU pedido (solo ventas reales)
  // 4) los productos, para saber cuántos están agotados
  const [respClientes, respPedidos, respLineas, respProductos] = await Promise.all([
    db.from('clientes_practica').select('id', { count: 'exact', head: true }),
    db.from('pedidos_con_total').select('estado, total'),
    db.from('detalles_pedidos')
      .select('producto_id, cantidad, precio_unitario, productos_practica(nombre), pedidos!inner(estado)')
      .in('pedidos.estado', ESTADOS_VENTA),
    db.from('productos_practica').select('id, unidades, disponible'),
  ]);

  const error = respClientes.error || respPedidos.error || respLineas.error || respProductos.error;
  if (error) {
    console.log('Error al leer finanzas:', error);
    kpis.innerHTML = '<p class="hint">No se pudieron leer los datos. Revisa la consola.</p>';
    return;
  }

  // --- Pedidos por estado ---
  const conteo = { carrito: 0, confirmado: 0, enviado: 0, entregado: 0, cancelado: 0 };
  let ingresos = 0;
  for (const p of respPedidos.data) {
    conteo[p.estado] = (conteo[p.estado] ?? 0) + 1;
    if (ESTADOS_VENTA.includes(p.estado)) ingresos += p.total;
  }
  const ventas = ESTADOS_VENTA.reduce((s, e) => s + conteo[e], 0);
  const pedidosHechos = ventas + conteo.cancelado;
  const ticketPromedio = ventas > 0 ? Math.round(ingresos / ventas) : 0;

  // --- Productos ---
  const unidadesVendidas = respLineas.data.reduce((s, l) => s + l.cantidad, 0);
  const agotados = respProductos.data.filter((p) => !p.disponible || (p.unidades ?? 0) <= 0).length;

  kpis.innerHTML = [
    tarjetaKpi('Ingresos', formatearPrecio(ingresos), `${ventas} pedido(s) vendidos`),
    tarjetaKpi('Clientes', respClientes.count ?? 0, 'registrados'),
    tarjetaKpi('Pedidos hechos', pedidosHechos, `${conteo.cancelado} cancelado(s)`),
    tarjetaKpi('Ticket promedio', formatearPrecio(ticketPromedio), 'por pedido vendido'),
    tarjetaKpi('Unidades vendidas', unidadesVendidas),
    tarjetaKpi('Carritos abiertos', conteo.carrito, 'aún sin confirmar'),
    tarjetaKpi('Productos', respProductos.data.length, `${agotados} agotado(s) o no disponible(s)`),
  ].join('');

  renderizarEstadosFinanzas(conteo, pedidosHechos);
  renderizarTopProductos(respLineas.data);
}

// Barra segmentada (una parte por estado) + leyenda con nombre y número
function renderizarEstadosFinanzas(conteo, total) {
  const cont = document.getElementById('estados-finanzas');
  if (total === 0) {
    cont.innerHTML = '<p class="hint">Todavía no hay pedidos.</p>';
    return;
  }

  const orden = ['confirmado', 'enviado', 'entregado', 'cancelado'];
  const porcentaje = (n) => Math.round((n / total) * 100);

  const segmentos = orden
    .filter((e) => conteo[e] > 0)
    .map((e) => `<span class="seg--${e}" style="flex: ${conteo[e]}" title="${ESTADOS_PEDIDO[e]}: ${conteo[e]} (${porcentaje(conteo[e])}%)"></span>`)
    .join('');

  const leyenda = orden.map((e) => `
    <li>
      <span class="muestra seg--${e}"></span>
      ${ESTADOS_PEDIDO[e]}
      <span class="cifra">${conteo[e]} · ${porcentaje(conteo[e])}%</span>
    </li>
  `).join('');

  cont.innerHTML = `
    <div class="barra-estados" role="img" aria-label="Pedidos por estado">${segmentos}</div>
    <ul class="leyenda-estados">${leyenda}</ul>
  `;
}

// Top 5 por unidades vendidas, con lo que generó cada uno
function renderizarTopProductos(lineas) {
  const cont = document.getElementById('top-productos');
  if (lineas.length === 0) {
    cont.innerHTML = '<p class="hint">Todavía no hay ventas.</p>';
    return;
  }

  // Agrupar por producto: { id: { nombre, unidades, ingresos } }
  const porProducto = {};
  for (const l of lineas) {
    const fila = porProducto[l.producto_id] ??= {
      nombre: l.productos_practica?.nombre ?? 'Producto borrado', unidades: 0, ingresos: 0,
    };
    fila.unidades += l.cantidad;
    fila.ingresos += l.cantidad * l.precio_unitario;
  }

  const top = Object.values(porProducto).sort((a, b) => b.unidades - a.unidades).slice(0, 5);
  const maximo = top[0].unidades;

  const filas = top.map((p) => `
    <tr>
      <td class="col-name">${escaparHTML(p.nombre)}</td>
      <td style="width: 35%;"><div class="barra-mini" style="width: ${(p.unidades / maximo) * 100}%"></div></td>
      <td class="col-num">${p.unidades}</td>
      <td class="col-price">${formatearPrecio(p.ingresos)}</td>
    </tr>
  `).join('');

  cont.innerHTML = `
    <table class="product-table">
      <thead><tr><th>Producto</th><th></th><th class="col-num">Unid.</th><th class="col-price">Ingresos</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>
  `;
}

document.getElementById('btn-recargar-finanzas').addEventListener('click', traerFinanzas);
