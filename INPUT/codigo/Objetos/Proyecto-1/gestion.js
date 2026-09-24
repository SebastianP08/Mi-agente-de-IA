// gestion.js
// Logica de la pagina de gestion (agregar, editar, borrar proyectos del
// portafolio). data.js ya cargo antes que este script, asi que
// "proyectos", "iconosPorHerramienta" y "clasesPorHerramienta" estan
// disponibles para usarlos aca. login.js tambien cargo antes, asi que
// "validarCredenciales" existe para verificar el login.

// IIFE (funcion que se ejecuta apenas se define): todo lo que se declara
// adentro vive en el scope de esta funcion, no en el global. Por eso desde
// la consola no se puede leer ni cambiar sesionIniciada, ni llamar a
// mostrarVista, renderizarEliminar, etc. Se cierra al final del archivo.
(() => {

// --- Sesion ---
// Solo el login correcto la pone en true. Cada operacion del CRUD la
// revisa antes de hacer algo: asi, aunque alguien le quite el hidden a
// .layout-gestion desde la consola, los botones no hacen nada.
let sesionIniciada = false;

// --- Login ---
// Mientras el login no sea correcto, .layout-gestion sigue con hidden
// (ver gestion.html) y el CRUD no se ve.
const seccionLogin = document.getElementById("login");
const formLogin = document.getElementById("formLogin");
const mensajeLogin = document.getElementById("mensajeLogin");
const layoutGestion = document.querySelector(".layout-gestion");

function mostrarErrorLogin(texto) {
  mensajeLogin.textContent = texto;
  mensajeLogin.hidden = false;
  formLogin.loginPassword.value = "";
}

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault(); // evita que el form recargue la pagina

  // crypto.subtle solo existe en contextos seguros (https, localhost o
  // archivo local). Si no esta, avisamos en vez de fallar en silencio.
  if (!window.crypto?.subtle) {
    mostrarErrorLogin("Este navegador no permite validar el login aquí.");
    return;
  }

  // La verificacion vive en login.js; aca solo se decide que hacer con
  // el resultado. await porque validarCredenciales devuelve una Promise.
  const credencialesCorrectas = await validarCredenciales(
    formLogin.loginUsuario.value.trim(),
    formLogin.loginPassword.value
  );

  if (credencialesCorrectas) {
    sesionIniciada = true;
    seccionLogin.hidden = true;

    // Vuelve a meter el CRUD en la pagina (se saco con remove() al final
    // de este archivo). Los addEventListener que se le pusieron siguen
    // funcionando: se guardan en el elemento, no en el DOM.
    document.body.prepend(layoutGestion);
    layoutGestion.hidden = false;

    // Recien ahora se arma la primera vista (antes se hacia al cargar la
    // pagina, con o sin login).
    mostrarVista("crear");
  } else {
    mostrarErrorLogin("Usuario o contraseña incorrectos.");
  }
});

// --- Cambio de vista por el sidebar ---
// Cada item tiene un data-vista (ver gestion.html) que coincide con el
// data-vista de UNA de las <section class="vista">. Mostramos esa y
// ocultamos el resto con el atributo hidden.
const itemsSidebar = document.querySelectorAll(".sidebar-item");
const vistas = document.querySelectorAll(".vista");

function mostrarVista(nombreVista) {
  if (!sesionIniciada) return;

  vistas.forEach((vista) => {
    vista.hidden = vista.dataset.vista !== nombreVista;
  });

  itemsSidebar.forEach((item) => {
    item.classList.toggle("activo", item.dataset.vista === nombreVista);
  });

  // Se re-arma cada vez que se entra a esta vista, para que muestre
  // siempre el estado actual de "proyectos" (incluyendo lo que se haya
  // agregado en Crear).
  if (nombreVista === "mostrar-todos") {
    renderizarListado();
  }

  if (nombreVista === "leer") {
    renderizarLeer();
  }

  if (nombreVista === "eliminar") {
    renderizarEliminar();
  }

  if (nombreVista === "actualizar") {
    renderizarActualizar();
  }
}

itemsSidebar.forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault(); // el href="#" no debe mover la pagina
    mostrarVista(item.dataset.vista);
  });
});

// --- Mostrar todos: lista completa de proyectos ---
const vistaMostrarTodos = document.getElementById("vista-mostrar-todos");

// Arma UNA tarjeta de solo lectura para un proyecto (version simplificada
// de crearTarjeta en portafolio-cards.js: mismas clases CSS para verse
// igual, pero sin tilt ni modal porque esta pagina no los tiene).
function crearTarjetaListado(proyecto) {
  const tarjeta = document.createElement("section");
  tarjeta.className = "tarjeta";

  // proyecto.imagen es opcional (ver formCrear mas abajo): si no hay
  // imagen cargada todavia, la tarjeta se arma sin ese <img> en vez de
  // mostrar un icono de imagen rota.
  const imagenHtml = proyecto.imagen
    ? `<img class="tarjeta-imagen" src="${proyecto.imagen}" alt="${proyecto.nombre}">`
    : "";

  const iconoHerramienta = iconosPorHerramienta[proyecto.herramienta];
  const iconoHtml = iconoHerramienta
    ? `<img class="tarjeta-icono-herramienta" src="${iconoHerramienta}" alt="${proyecto.herramienta}">`
    : "";

  const etapasHtml = proyecto.etapas.map((etapa) => `<li>${etapa}</li>`).join("");

  const enlaceHtml = proyecto.enlace
    ? `<a class="tarjeta-enlace" href="${proyecto.enlace}" target="_blank" rel="noopener noreferrer">Ver proyecto ↗</a>`
    : "";

  // El id se muestra para saber cual escribir en "Leer". Si un proyecto
  // viejo de localStorage no tiene id, simplemente no se muestra.
  const idHtml = proyecto.id !== undefined ? `<p class="tarjeta-id">#${proyecto.id}</p>` : "";

  tarjeta.innerHTML = `
    ${imagenHtml}
    <div class="tarjeta-info">
      ${idHtml}
      <h2 class="tarjeta-nombre">${proyecto.nombre}</h2>
      <p class="tarjeta-categoria">${proyecto.categoria}</p>
      <p class="tarjeta-dato">
        <strong>Herramienta:</strong>
        <span class="tarjeta-herramienta ${clasesPorHerramienta[proyecto.herramienta] ?? ""}">
          ${iconoHtml}
          <span>${proyecto.herramienta}</span>
        </span>
      </p>
      <p class="tarjeta-descripcion">${proyecto.descripcion}</p>
      <p class="tarjeta-dato">
        <strong>Horas invertidas:</strong>
        <span>${proyecto.horasInvertidas} h</span>
      </p>
      <div class="tarjeta-etapas">
        <strong>Etapas:</strong>
        <ol class="tarjeta-etapas-lista">${etapasHtml}</ol>
      </div>
      <span class="tarjeta-estado ${proyecto.enProceso ? "en-proceso" : "terminado"}">
        ${proyecto.enProceso ? "En proceso" : "Terminado"}
      </span>
      ${enlaceHtml}
    </div>
  `;

  return tarjeta;
}

function renderizarListado() {
  vistaMostrarTodos.innerHTML = "";

  const grilla = document.createElement("div");
  grilla.className = "escena-tarjeta";

  proyectos.forEach((proyecto) => grilla.appendChild(crearTarjetaListado(proyecto)));

  vistaMostrarTodos.appendChild(grilla);
}

// --- Leer: buscar UN proyecto por su id ---
const formLeer = document.getElementById("formLeer");
const mensajeLeer = document.getElementById("mensajeLeer");
const resultadoLeer = document.getElementById("resultadoLeer");

// Cada vez que se entra a la vista se limpia la busqueda anterior, para
// no ver la ficha de un proyecto que quizas ya se elimino o se edito.
function renderizarLeer() {
  formLeer.reset();
  mensajeLeer.hidden = true;
  resultadoLeer.innerHTML = "";
}

formLeer.addEventListener("submit", (e) => {
  e.preventDefault(); // evita que el form recargue la pagina
  if (!sesionIniciada) return;

  // El value de un input SIEMPRE es texto (aunque sea type="number"): sin
  // Number(), "3" === 3 da false y nunca encontraria nada.
  const idBuscado = Number(formLeer.leerId.value);

  // find (no filter): devuelve EL primer objeto que cumple la condicion, o
  // undefined si ninguno la cumple. filter devolveria siempre un array
  // (vacio o con elementos), y aca buscamos uno solo, porque el id no se
  // repite.
  const proyectoEncontrado = proyectos.find((proyecto) => proyecto.id === idBuscado);

  resultadoLeer.innerHTML = "";

  if (proyectoEncontrado) {
    mensajeLeer.hidden = true;
    resultadoLeer.appendChild(crearTarjetaListado(proyectoEncontrado));
  } else {
    mensajeLeer.textContent = `No existe un proyecto con el id ${idBuscado}.`;
    mensajeLeer.hidden = false;
  }
});

// --- Eliminar: una fila por proyecto, cada una con su boton --
const listaEliminar = document.getElementById("listaEliminar");

// Arma UNA fila compacta (nombre + categoria/herramienta + boton
// eliminar), a diferencia de crearTarjetaListado que muestra el proyecto
// completo -- para borrar no hace falta ver toda la descripcion.
function crearFilaEliminar(proyecto) {
  const fila = document.createElement("div");
  fila.className = "fila-eliminar";

  fila.innerHTML = `
    <div class="fila-eliminar-info">
      <strong>${proyecto.nombre}</strong>
      <span>${proyecto.categoria} · ${proyecto.herramienta}</span>
    </div>
  `;

  const botonEliminar = document.createElement("button");
  botonEliminar.className = "btn-eliminar-fila";
  botonEliminar.textContent = "Eliminar";
  botonEliminar.addEventListener("click", () => {
    if (!sesionIniciada) return;

    const confirmado = confirm(`¿Eliminar "${proyecto.nombre}"? No se puede deshacer.`);
    if (!confirmado) return;

    // indexOf busca ESTE objeto puntual (no un duplicado con el mismo
    // nombre) porque compara la referencia, no el contenido.
    proyectos.splice(proyectos.indexOf(proyecto), 1);
    localStorage.setItem(CLAVE_LOCALSTORAGE, JSON.stringify(proyectos));

    renderizarEliminar();
  });

  fila.appendChild(botonEliminar);
  return fila;
}

function renderizarEliminar() {
  listaEliminar.innerHTML = "";

  if (proyectos.length === 0) {
    listaEliminar.innerHTML = "<p>No queda ningún proyecto.</p>";
    return;
  }

  proyectos.forEach((proyecto) => listaEliminar.appendChild(crearFilaEliminar(proyecto)));
}

// --- Actualizar: elegir un proyecto de la lista y editar sus datos ---
const listaActualizar = document.getElementById("listaActualizar");
const formActualizar = document.getElementById("formActualizar");
const mensajeActualizar = document.getElementById("mensajeActualizar");
const btnCancelarActualizar = document.getElementById("btnCancelarActualizar");

// Referencia al objeto de "proyectos" que se esta editando ahora mismo
// (null si todavia no se eligio ninguno). Guardar la referencia -- no una
// copia -- es lo que permite modificarlo directo al guardar, sin tener
// que buscarlo de nuevo por nombre.
let proyectoEnEdicion = null;

function crearFilaActualizar(proyecto) {
  const fila = document.createElement("div");
  fila.className = "fila-eliminar"; // mismo estilo de fila que en Eliminar

  fila.innerHTML = `
    <div class="fila-eliminar-info">
      <strong>${proyecto.nombre}</strong>
      <span>${proyecto.categoria} · ${proyecto.herramienta}</span>
    </div>
  `;

  const botonEditar = document.createElement("button");
  botonEditar.className = "btn-editar-fila";
  botonEditar.textContent = "Editar";
  botonEditar.addEventListener("click", () => cargarFormularioActualizar(proyecto));

  fila.appendChild(botonEditar);
  return fila;
}

function renderizarActualizar() {
  // Cada vez que se entra (o se vuelve a entrar) a esta vista, se
  // esconde el formulario: evita quedar editando un proyecto que ya no
  // esta en pantalla.
  formActualizar.hidden = true;
  mensajeActualizar.hidden = true;
  proyectoEnEdicion = null;

  listaActualizar.innerHTML = "";

  if (proyectos.length === 0) {
    listaActualizar.innerHTML = "<p>No queda ningún proyecto.</p>";
    return;
  }

  proyectos.forEach((proyecto) => listaActualizar.appendChild(crearFilaActualizar(proyecto)));
}

// Llena el formulario con los datos ACTUALES del proyecto elegido y lo
// muestra.
function cargarFormularioActualizar(proyecto) {
  if (!sesionIniciada) return;

  proyectoEnEdicion = proyecto;

  formActualizar.actNombre.value = proyecto.nombre;
  formActualizar.actCategoria.value = proyecto.categoria;
  formActualizar.actHerramienta.value = proyecto.herramienta;
  formActualizar.actImagen.value = proyecto.imagen ?? "";
  formActualizar.actDescripcion.value = proyecto.descripcion;
  formActualizar.actHoras.value = proyecto.horasInvertidas;
  formActualizar.actEtapas.value = proyecto.etapas.join(", ");
  formActualizar.actEnlace.value = proyecto.enlace ?? "";
  formActualizar.actEnProceso.checked = proyecto.enProceso;

  formActualizar.hidden = false;
  mensajeActualizar.hidden = true;
}

formActualizar.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!sesionIniciada || !proyectoEnEdicion) return;

  // A diferencia de Crear (que arma un objeto nuevo), aca reescribimos
  // las propiedades del objeto QUE YA ESTA en "proyectos" -- asi no
  // pierde su posicion en el array ni hay que buscarlo de nuevo.
  proyectoEnEdicion.nombre = formActualizar.actNombre.value.trim();
  proyectoEnEdicion.categoria = formActualizar.actCategoria.value.trim();
  proyectoEnEdicion.herramienta = formActualizar.actHerramienta.value;
  proyectoEnEdicion.descripcion = formActualizar.actDescripcion.value.trim();
  proyectoEnEdicion.horasInvertidas = Number(formActualizar.actHoras.value);
  proyectoEnEdicion.enProceso = formActualizar.actEnProceso.checked;
  proyectoEnEdicion.etapas = formActualizar.actEtapas.value
    .split(",")
    .map((etapa) => etapa.trim())
    .filter((etapa) => etapa !== "");

  // imagen y enlace siguen siendo opcionales: si se vaciaron, se borran
  // del objeto (delete) en vez de quedar como string vacio -- mismo
  // criterio que en Crear.
  const imagen = formActualizar.actImagen.value.trim();
  if (imagen !== "") {
    proyectoEnEdicion.imagen = imagen;
  } else {
    delete proyectoEnEdicion.imagen;
  }

  const enlace = formActualizar.actEnlace.value.trim();
  if (enlace !== "") {
    proyectoEnEdicion.enlace = enlace;
  } else {
    delete proyectoEnEdicion.enlace;
  }

  localStorage.setItem(CLAVE_LOCALSTORAGE, JSON.stringify(proyectos));

  mensajeActualizar.textContent = `Proyecto "${proyectoEnEdicion.nombre}" actualizado.`;
  mensajeActualizar.hidden = false;

  formActualizar.hidden = true;
  proyectoEnEdicion = null;

  // Repinta solo la lista (no llamamos a renderizarActualizar completa
  // porque esa tambien esconde mensajeActualizar, y lo queremos ver).
  listaActualizar.innerHTML = "";
  proyectos.forEach((proyecto) => listaActualizar.appendChild(crearFilaActualizar(proyecto)));
});

btnCancelarActualizar.addEventListener("click", () => {
  formActualizar.hidden = true;
  proyectoEnEdicion = null;
});

// --- Formulario de Crear ---
const formCrear = document.getElementById("formCrear");
const mensajeCrear = document.getElementById("mensajeCrear");

formCrear.addEventListener("submit", (e) => {
  e.preventDefault(); // evita que el form recargue la pagina
  if (!sesionIniciada) return;

  // Mismo patron que cada objeto de "proyectos" en data.js: mismas keys,
  // mismos tipos (horasInvertidas numero, etapas array de strings).
  // El id sale de siguienteId (declarado en data.js).
  const nuevoProyecto = {
    id: siguienteId,
    nombre: formCrear.campoNombre.value.trim(),
    categoria: formCrear.campoCategoria.value.trim(),
    herramienta: formCrear.campoHerramienta.value,
    descripcion: formCrear.campoDescripcion.value.trim(),
    enProceso: formCrear.campoEnProceso.checked,
    horasInvertidas: Number(formCrear.campoHoras.value),
    etapas: formCrear.campoEtapas.value
      .split(",")
      .map((etapa) => etapa.trim())
      .filter((etapa) => etapa !== ""),
  };

  // imagen y enlace son opcionales: solo se agregan si el campo tiene
  // algo, en vez de quedar como string vacio (mismo patron que Jaziz y
  // Mano Realista en data.js, que directamente no tienen "enlace").
  const imagen = formCrear.campoImagen.value.trim();
  if (imagen !== "") {
    nuevoProyecto.imagen = imagen;
  }

  const enlace = formCrear.campoEnlace.value.trim();
  if (enlace !== "") {
    nuevoProyecto.enlace = enlace;
  }

  // unshift (no push) para que el proyecto nuevo aparezca primero en
  // "Mostrar todos" -- y tambien primero en portafolio-cards.html, ya
  // que comparten el mismo array.
  proyectos.unshift(nuevoProyecto);

  // Se suma 1 para que el proximo proyecto creado (sin recargar la
  // pagina) no reciba el mismo id que este.
  siguienteId++;

  // Guarda TODO el array actualizado en localStorage (no solo el nuevo
  // proyecto), para que la proxima vez que se abra data.js -- aca o en
  // portafolio-cards.html -- lo lea de vuelta en vez de los 8 originales.
  localStorage.setItem(CLAVE_LOCALSTORAGE, JSON.stringify(proyectos));

  mensajeCrear.textContent = `Proyecto "${nuevoProyecto.nombre}" agregado. Van ${proyectos.length} en total. Andá a "Mostrar todos" para verlo.`;
  mensajeCrear.hidden = false;

  formCrear.reset();
});

// --- Reiniciar a los 8 proyectos originales ---
// Borra lo guardado en localStorage y recarga la pagina: al volver a
// correr data.js, "proyectosGuardados" da null y se usa de nuevo
// proyectosPorDefecto (ver data.js).
const btnReiniciar = document.getElementById("btnReiniciar");

btnReiniciar.addEventListener("click", () => {
  if (!sesionIniciada) return;

  const confirmado = confirm(
    "Esto borra todos los proyectos que agregaste y vuelve a los 8 originales. ¿Seguro?"
  );
  if (!confirmado) return;

  localStorage.removeItem(CLAVE_LOCALSTORAGE);
  location.reload();
});

// --- Sacar el CRUD de la pagina hasta el login ---
// hidden solo OCULTA el CRUD: sigue en el DOM y desde la consola se le
// puede quitar el hidden. remove() lo SACA de la pagina; la unica
// referencia que queda es layoutGestion, dentro de esta IIFE. Hasta el
// login correcto, document.querySelector(".layout-gestion") da null.
// Va al FINAL a proposito: todos los getElementById/querySelectorAll de
// arriba buscan en document, asi que tienen que correr antes de que el
// CRUD salga de la pagina.
layoutGestion.remove();

})(); // fin de la IIFE que empieza arriba del login
