// portafolio-cards.js
// Data de los proyectos del portafolio + el codigo que arma UNA tarjeta
// por cada proyecto (ver crearTarjeta) y las agrega todas a #galeria.

// --- Fondo decorativo ---
// Estas imagenes se repiten varias veces cada una, en posiciones,
// tamaños y rotaciones al azar, para decorar el fondo de la pagina.
const imagenesFondo = [
  "https://static.vecteezy.com/system/resources/thumbnails/024/729/181/small/cube-shape-icon-png.png",
  "https://static.vecteezy.com/system/resources/thumbnails/050/756/471/small/soft-pastel-gradient-sphere-with-smooth-glossy-texture-free-png.png",
];

// Cuantas copias al azar vamos a crear, ademas de las 4 fijas en las
// esquinas (ver imagenesEnEsquinas mas abajo).
const CANTIDAD_IMAGENES_FONDO = 28;

// Separacion minima (en % de pantalla) que debe haber entre el centro de
// una imagen nueva y el de las que ya pusimos, para que no se amontonen
// 2 o 3 justo en el mismo lugar.
const DISTANCIA_MINIMA = 14;

// Devuelve un decimal al azar entre min y max (min incluido, max casi
// nunca exacto). La usamos para no repetir la misma cuenta varias veces.
function numeroAlAzar(min, max) {
  return Math.random() * (max - min) + min;
}

const fondoDecorativo = document.getElementById("fondoDecorativo");

// Crea UNA imagen de fondo (eligiendo al azar entre cubo/esfera) con la
// posicion, tamaño y rotacion que le pasemos, y la agrega al contenedor.
function crearImagenFondo(top, left, tamano, rotacion) {
  const imagenFondo = document.createElement("img");

  const indiceAlAzar = Math.floor(Math.random() * imagenesFondo.length);
  imagenFondo.src = imagenesFondo[indiceAlAzar];
  imagenFondo.alt = ""; // decorativa, no aporta info util para lectores de pantalla

  imagenFondo.style.width = `${tamano}px`;
  imagenFondo.style.top = `${top}%`;
  imagenFondo.style.left = `${left}%`;
  imagenFondo.style.transform = `rotate(${rotacion}deg)`;

  fondoDecorativo.appendChild(imagenFondo);
}

// Guardamos aca cada posicion que ya usamos (al azar o fija), para poder
// chequear que las nuevas no caigan demasiado cerca.
const posicionesUsadas = [];

// Busca una posicion al azar que este a mas de DISTANCIA_MINIMA de todas
// las anteriores. Lo intenta hasta 20 veces; si no lo logra (pantalla ya
// muy llena), se queda con la ultima que probo en vez de trabarse.
function posicionAlAzarSinEncimar() {
  let x, y;
  let intentos = 0;

  do {
    x = numeroAlAzar(-10, 110);
    y = numeroAlAzar(-10, 110);
    intentos++;
  } while (
    intentos < 20 &&
    posicionesUsadas.some((p) => Math.hypot(p.x - x, p.y - y) < DISTANCIA_MINIMA)
  );

  posicionesUsadas.push({ x, y });
  return { x, y };
}

// 4 imagenes fijas, una por esquina, con tamaños bien distintos entre si
// (una bien grande, otra chica, etc.) para romper la uniformidad de las
// que van al azar.
const imagenesEnEsquinas = [
  { top: -6, left: -6, tamano: 260 },
  { top: -8, left: 92, tamano: 90 },
  { top: 88, left: -8, tamano: 150 },
  { top: 92, left: 90, tamano: 320 },
];

imagenesEnEsquinas.forEach((esquina) => {
  // La registramos en posicionesUsadas para que las imagenes al azar de
  // abajo tampoco se amontonen justo encima de las esquinas.
  posicionesUsadas.push({ x: esquina.left, y: esquina.top });
  crearImagenFondo(esquina.top, esquina.left, esquina.tamano, numeroAlAzar(0, 360).toFixed(0));
});

for (let i = 0; i < CANTIDAD_IMAGENES_FONDO; i++) {
  const { x, y } = posicionAlAzarSinEncimar();
  crearImagenFondo(y, x, numeroAlAzar(60, 320).toFixed(0), numeroAlAzar(0, 360).toFixed(0));
}

// El arreglo "proyectos" y los mapas iconosPorHerramienta/
// clasesPorHerramienta viven en data.js, cargado antes que este script
// (ver portafolio-cards.html).

// Rellena un set de elementos del HTML (imagen, nombre, categoria,
// herramienta, descripcion, estado) con los datos de UN proyecto.
// Recibe "elementos", un objeto con las referencias a esos elementos, para
// poder reusar esta misma funcion tanto en la tarjeta chica como en el
// modal de detalle (que tienen los mismos campos, pero en elementos
// distintos del HTML).
function mostrarProyecto(elementos, proyecto) {
  elementos.imagen.src = proyecto.imagen;
  elementos.imagen.alt = proyecto.nombre;

  elementos.nombre.textContent = proyecto.nombre;
  elementos.categoria.textContent = proyecto.categoria;
  elementos.herramienta.textContent = proyecto.herramienta;
  elementos.descripcion.textContent = proyecto.descripcion;

  // horasInvertidas es un numero (ej. 14), lo mostramos como texto con
  // la unidad al lado.
  elementos.horas.textContent = `${proyecto.horasInvertidas} h`;

  // etapas es un array de strings (ej. ["Boceto", "Modelado", ...]).
  // Igual que con "poderes" en Objetos/index.js, lo convertimos en una
  // lista de <li>, uno por etapa, y la insertamos de una sola vez.
  elementos.etapasLista.innerHTML = proyecto.etapas.map((etapa) => `<li>${etapa}</li>`).join("");

  // Buscamos el icono correspondiente en el mapa de arriba usando el
  // nombre de la herramienta como key.
  elementos.iconoHerramienta.src = iconosPorHerramienta[proyecto.herramienta];
  elementos.iconoHerramienta.alt = proyecto.herramienta;

  // className (en vez de classList.add) resetea las clases antes de poner
  // la nueva: asi, si esta funcion se llama de nuevo con OTRO proyecto (por
  // ejemplo el modal mostrando distintas tarjetas), no se van acumulando
  // colores viejos.
  elementos.herramientaBadge.className = `tarjeta-herramienta ${clasesPorHerramienta[proyecto.herramienta]}`;

  // enProceso es true/false, asi que lo convertimos en un texto legible y
  // le agregamos la clase de color que le corresponde a ese estado.
  elementos.estado.textContent = proyecto.enProceso ? "En proceso" : "Terminado";
  elementos.estado.className = `tarjeta-estado ${proyecto.enProceso ? "en-proceso" : "terminado"}`;

  // No todos los proyectos tienen "enlace" (Jaziz y Mano Realista no).
  // Boolean(proyecto.enlace) da false para undefined, asi que el boton se
  // muestra (hidden = false) solo cuando SI hay un link cargado.
  elementos.enlace.hidden = !proyecto.enlace;
  if (proyecto.enlace) {
    elementos.enlace.href = proyecto.enlace;
  }
}

// --- Generamos una tarjeta por cada proyecto ---
const galeria = document.getElementById("galeria");
const plantillaTarjeta = document.getElementById("plantillaTarjeta");

// Recibe UN objeto proyecto y devuelve UNA tarjeta de HTML ya llena con sus
// datos y con sus propios eventos (tilt, brillo, click para abrir el
// modal). Se usa una vez por cada elemento de la lista que se pinta (ver
// renderizarObjetos mas abajo) -- mismo patron que crearCarta en
// Objetos/index.js.
function crearTarjeta(proyecto) {
  // plantillaTarjeta.content.cloneNode(true) copia el contenido del
  // <template> sin tocar el original, para poder repetirlo 8 veces sin que
  // se pisen entre si.
  const tarjetaClon = plantillaTarjeta.content.cloneNode(true);

  // Como el <template> no tiene ids (para poder repetirse), buscamos cada
  // elemento dentro de ESTA copia puntual con querySelector + clase.
  const elementos = {
    imagen: tarjetaClon.querySelector(".tarjeta-imagen"),
    nombre: tarjetaClon.querySelector(".tarjeta-nombre"),
    categoria: tarjetaClon.querySelector(".tarjeta-categoria"),
    herramientaBadge: tarjetaClon.querySelector(".tarjeta-herramienta"),
    iconoHerramienta: tarjetaClon.querySelector(".tarjeta-icono-herramienta"),
    herramienta: tarjetaClon.querySelector(".tarjeta-herramienta-nombre"),
    descripcion: tarjetaClon.querySelector(".tarjeta-descripcion"),
    horas: tarjetaClon.querySelector(".tarjeta-horas"),
    etapasLista: tarjetaClon.querySelector(".tarjeta-etapas-lista"),
    estado: tarjetaClon.querySelector(".tarjeta-estado"),
    enlace: tarjetaClon.querySelector(".tarjeta-enlace"),
  };

  mostrarProyecto(elementos, proyecto);

  // El boton "Ver proyecto" ya abre su propio link en una pestaña nueva;
  // sin este stopPropagation, el click tambien "burbujearia" hasta
  // tarjetaEl y ademas abriria el modal (ver el addEventListener("click")
  // de tarjetaEl mas abajo).
  elementos.enlace.addEventListener("click", (e) => e.stopPropagation());

  // --- Tilt 3D + reflejo diagonal que siguen el mouse (por tarjeta) ---
  // Mismo truco que la carta de villanos en Objetos/index.js: en cada
  // pointermove calculamos en que parte de ESTA tarjeta esta el cursor (0
  // a 1 en x/y). Con eso armamos dos cosas:
  // 1) un angulo de rotacion chiquito (--rx/--ry) para que la tarjeta se
  //    incline levemente, como si la sostuvieras con la mano.
  // 2) una posicion (--mx/--my) que mueve una franja diagonal clara sobre
  //    la tarjeta (.tarjeta-brillo), simulando el reflejo de la luz del
  //    sol cuando mueves un objeto brillante.
  const tarjetaEl = tarjetaClon.querySelector(".tarjeta");

  tarjetaEl.addEventListener("pointermove", (e) => {
    const rect = tarjetaEl.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    const rotateY = (px - 0.5) * 4;
    const rotateX = (py - 0.5) * -4;

    tarjetaEl.style.setProperty("--rx", `${rotateX.toFixed(2)}deg`);
    tarjetaEl.style.setProperty("--ry", `${rotateY.toFixed(2)}deg`);
    tarjetaEl.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);

    // --my se invierte (100 - py en vez de py): background-position mas
    // grande que el elemento (ver background-size: 250% en el CSS) se
    // mueve "al reves" del eje que uno esperaria, asi que sin este ajuste
    // el brillo salia arriba cuando el mouse estaba abajo, y viceversa.
    tarjetaEl.style.setProperty("--my", `${((1 - py) * 100).toFixed(1)}%`);
    tarjetaEl.classList.add("activa");
  });

  tarjetaEl.addEventListener("pointerleave", () => {
    tarjetaEl.style.setProperty("--rx", "0deg");
    tarjetaEl.style.setProperty("--ry", "0deg");
    tarjetaEl.classList.remove("activa");
  });

  // Al hacer click en la tarjeta se abre el modal con el detalle completo
  // de ESE proyecto en particular (ver funcion abrirModal mas abajo).
  tarjetaEl.addEventListener("click", () => abrirModal(proyecto));

  return tarjetaClon;
}

// Pinta en #galeria una tarjeta por cada objeto de listaObjetos (reusa
// crearTarjeta para armar cada una). Recibe la lista por parametro en vez
// de usar "proyectos" directo, para poder pintar cualquier array: el
// completo, uno filtrado, uno ordenado, etc.
function renderizarObjetos(listaObjetos) {
  // Primero vacia el grid: si la funcion se llama una segunda vez, las
  // tarjetas viejas se reemplazan en vez de quedar duplicadas debajo de
  // las nuevas (mismo patron que renderizarListado en gestion.js).
  galeria.innerHTML = "";

  listaObjetos.forEach((objeto) => galeria.appendChild(crearTarjeta(objeto)));
}

// --- Estado de los filtros ---
// Los dos filtros (herramienta y horas) se combinan: si eliges "Blender"
// y bajas el slider a 10, ves solo los de Blender con 10 h o menos. Para
// eso cada filtro NO pinta la galeria por su cuenta, sino que guarda su
// valor en estas variables y llama a aplicarFiltros, que es la unica que
// decide que se muestra.
// herramientaActiva / categoriaActiva: null = "Todos" (sin filtrar).
let herramientaActiva = null;
let categoriaActiva = null;
let horasMaximas = Infinity; // se ajusta al maximo real mas abajo

const galeriaVacia = document.getElementById("galeriaVacia");

function aplicarFiltros() {
  const listaFiltrada = proyectos.filter((proyecto) => {
    const coincideHerramienta = herramientaActiva === null || proyecto.herramienta === herramientaActiva;
    const coincideCategoria = categoriaActiva === null || proyecto.categoria === categoriaActiva;
    const coincideHoras = proyecto.horasInvertidas <= horasMaximas;
    return coincideHerramienta && coincideCategoria && coincideHoras;
  });

  renderizarObjetos(listaFiltrada);

  // Si no quedo ningun proyecto, mostramos el aviso en vez de dejar la
  // galeria en blanco sin explicacion.
  galeriaVacia.hidden = listaFiltrada.length > 0;

  // "Limpiar filtros" solo tiene sentido si hay ALGUN filtro puesto: si
  // todo esta en su valor inicial, lo desactivamos (ver btnLimpiarFiltros
  // mas abajo). horasMax es el maximo real de horas, calculado en la
  // seccion del slider.
  const hayFiltros = herramientaActiva !== null || categoriaActiva !== null || horasMaximas < horasMax;
  btnLimpiarFiltros.disabled = !hayFiltros;
}

// --- Filtros por herramienta ---
const filtros = document.getElementById("filtros");

// Lista de herramientas SIN repetir, sacada de los mismos datos:
// 1) map arma un array con la herramienta de cada proyecto
//    (ej. ["Visual Studio Code", "Visual Studio Code", "Blender", ...]).
// 2) new Set(...) guarda cada valor una sola vez (un Set no admite
//    repetidos).
// 3) [...set] lo vuelve a convertir en array para poder recorrerlo.
// Asi, si se agrega un proyecto con otra herramienta, su boton aparece
// solo, y nunca hay un boton con 0 proyectos.
const herramientas = [...new Set(proyectos.map((proyecto) => proyecto.herramienta))];

// Marca como activo SOLO el boton que se clickeo (mismo criterio que
// .sidebar-item.activo en gestion.js). aria-pressed le avisa a los
// lectores de pantalla cual esta seleccionado.
function activarFiltro(botonActivo) {
  filtros.querySelectorAll(".filtro-boton").forEach((boton) => {
    const esActivo = boton === botonActivo;
    boton.classList.toggle("activo", esActivo);
    boton.setAttribute("aria-pressed", esActivo);
  });
}

// Crea UN boton de filtro. "herramienta" es el nombre de la herramienta
// que filtra, o null para el boton "Todos". El numero entre parentesis es
// el total de proyectos de esa herramienta (sin contar el slider de horas).
function crearBotonFiltro(etiqueta, herramienta, claseColor, icono) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = `filtro-boton ${claseColor}`;

  const cantidad = herramienta === null
    ? proyectos.length
    : proyectos.filter((proyecto) => proyecto.herramienta === herramienta).length;

  const iconoHtml = icono ? `<img class="tarjeta-icono-herramienta" src="${icono}" alt="">` : "";
  boton.innerHTML = `${iconoHtml}<span>${etiqueta} (${cantidad})</span>`;

  // El click ya no pinta la galeria directo: solo guarda cual herramienta
  // se eligio y deja que aplicarFiltros la combine con el slider de horas.
  boton.addEventListener("click", () => {
    herramientaActiva = herramienta;
    aplicarFiltros();
    activarFiltro(boton);
  });

  filtros.appendChild(boton);
  return boton;
}

const botonTodos = crearBotonFiltro("Todos", null, "filtro-todos");

herramientas.forEach((herramienta) => {
  // Reusa las mismas clases de color que el badge de las tarjetas
  // (tarjeta-herramienta + herramienta-blender, etc.), asi cada filtro
  // combina con sus tarjetas, tambien en modo oscuro.
  crearBotonFiltro(
    herramienta,
    herramienta,
    `tarjeta-herramienta ${clasesPorHerramienta[herramienta] ?? ""}`,
    iconosPorHerramienta[herramienta]
  );
});

// Al cargar la pagina se ven todos, asi que "Todos" arranca activo.
activarFiltro(botonTodos);

// --- Filtro por tipo de proyecto (select) ---
const filtroCategoria = document.getElementById("filtroCategoria");

// Los botones se agregaron con appendChild DESPUES del select (que ya
// estaba en el HTML), asi que el select quedo primero. appendChild con un
// elemento que YA esta en la pagina no lo copia: lo MUEVE. Asi lo mandamos
// al final de la fila, a la derecha de los botones.
filtros.appendChild(document.getElementById("filtroCategoriaContenedor"));

// Mismo truco que "herramientas": lista de categorias sin repetir.
const categorias = [...new Set(proyectos.map((proyecto) => proyecto.categoria))];

// Arma una <option> por categoria + una primera "Todos los tipos".
// value="" en "Todos" porque un string vacio es facil de detectar abajo.
function llenarSelectCategoria() {
  const opcionTodos = `<option value="">Todos los tipos (${proyectos.length})</option>`;

  const opcionesCategorias = categorias.map((categoria) => {
    const cantidad = proyectos.filter((proyecto) => proyecto.categoria === categoria).length;
    return `<option value="${categoria}">${categoria} (${cantidad})</option>`;
  });

  filtroCategoria.innerHTML = opcionTodos + opcionesCategorias.join("");
}

llenarSelectCategoria();

// En un <select>, "change" se dispara UNA vez al elegir una opcion (a
// diferencia del "input" del slider, que salta en cada movimiento).
// filtroCategoria.value es el value de la <option> elegida; si es "" (la
// de "Todos"), lo guardamos como null para no filtrar por tipo.
filtroCategoria.addEventListener("change", () => {
  categoriaActiva = filtroCategoria.value === "" ? null : filtroCategoria.value;
  aplicarFiltros();
});

// --- Filtro por horas invertidas (slider vertical flotante) ---
const sliderHoras = document.getElementById("sliderHoras");
const horasValor = document.getElementById("horasValor");

// Sacamos el minimo y maximo de horas de los mismos datos: map arma un
// array solo con los numeros (ej. [14, 16, 12, ...]) y el spread (...) los
// pasa como argumentos sueltos a Math.min/Math.max, que no aceptan arrays.
const listaHoras = proyectos.map((proyecto) => proyecto.horasInvertidas);
const horasMin = Math.min(...listaHoras);
const horasMax = Math.max(...listaHoras);

sliderHoras.min = horasMin;
sliderHoras.max = horasMax;
sliderHoras.value = horasMax; // arranca en el maximo: se ven todos
horasMaximas = horasMax;

document.getElementById("horasMinimo").textContent = `${horasMin} h`;
document.getElementById("horasMaximo").textContent = `${horasMax} h`;

function actualizarHoras() {
  // .value de un input SIEMPRE es un string ("12"), aunque sea type=range.
  // Number() lo convierte a numero para que el <= de aplicarFiltros compare
  // numeros y no textos (con textos, "5" <= "12" da false, porque compara
  // letra por letra: "5" va despues de "1").
  horasMaximas = Number(sliderHoras.value);
  horasValor.textContent = `≤ ${horasMaximas} h`;
  aplicarFiltros();
}

// "input" se dispara en CADA movimiento del slider mientras lo arrastras;
// "change" solo se dispararia al soltarlo. Por eso usamos "input": la
// galeria se actualiza en vivo.
sliderHoras.addEventListener("input", actualizarHoras);

// --- Boton "Limpiar filtros" ---
const btnLimpiarFiltros = document.getElementById("btnLimpiarFiltros");

// Igual que el select de tipo: lo movemos al final de la fila de arriba.
filtros.appendChild(btnLimpiarFiltros);

// Vuelve CADA filtro a su valor inicial. Hay que tocar dos cosas por
// filtro: la variable de estado (lo que usa aplicarFiltros) y el control
// que se ve en pantalla (boton activo, opcion del select, posicion del
// slider). Si solo cambiaramos la variable, la galeria mostraria todo
// pero el select seguiria diciendo "Blender", por ejemplo.
function limpiarFiltros() {
  herramientaActiva = null;
  activarFiltro(botonTodos);

  categoriaActiva = null;
  filtroCategoria.value = ""; // la <option> de "Todos los tipos"

  // Cambiar .value por JS NO dispara el evento "input", asi que llamamos
  // a actualizarHoras a mano: actualiza horasMaximas, el texto "≤ 16 h" y
  // ademas llama a aplicarFiltros, que repinta la galeria.
  sliderHoras.value = horasMax;
  actualizarHoras();
}

btnLimpiarFiltros.addEventListener("click", limpiarFiltros);

// Primer pintado de la galeria (con "Todos" y el slider al maximo). Va al
// final porque aplicarFiltros usa btnLimpiarFiltros: si se llamara antes
// de su "const", daria ReferenceError (una const no existe hasta que se
// ejecuta la linea donde se declara).
actualizarHoras();

// --- Boton de modo oscuro/claro ---
// Cada click agrega o quita la clase "oscuro" en el body. El CSS
// (portafolio-cards.css) es el que realmente cambia los colores segun esa
// clase, aqui solo decidimos si esta activa o no y cambiamos el texto
// del boton para reflejarlo.
const btnModoOscuro = document.getElementById("btnModoOscuro");
btnModoOscuro.addEventListener("click", () => {
  document.body.classList.toggle("oscuro");
  const activado = document.body.classList.contains("oscuro");
  btnModoOscuro.textContent = activado ? "☀️ Modo claro" : "🌙 Modo oscuro";
});

// --- Modal de detalle ---
// Un solo modal que se reutiliza y se llena con los datos del proyecto en
// el que se hizo click (ver el addEventListener("click", ...) dentro de
// crearTarjeta, mas arriba).
const modal = document.getElementById("modal");
const modalCerrar = document.getElementById("modalCerrar");

const elementosModal = {
  imagen: document.getElementById("modalImagen"),
  nombre: document.getElementById("modalNombre"),
  categoria: document.getElementById("modalCategoria"),
  herramientaBadge: document.getElementById("modalHerramientaBadge"),
  iconoHerramienta: document.getElementById("modalIconoHerramienta"),
  herramienta: document.getElementById("modalHerramienta"),
  descripcion: document.getElementById("modalDescripcion"),
  horas: document.getElementById("modalHoras"),
  etapasLista: document.getElementById("modalEtapas"),
  estado: document.getElementById("modalEstado"),
  enlace: document.getElementById("modalEnlace"),
};

function abrirModal(proyecto) {
  mostrarProyecto(elementosModal, proyecto);
  modal.classList.add("visible");
  document.body.classList.add("modal-abierto");
}

function cerrarModal() {
  modal.classList.remove("visible");
  document.body.classList.remove("modal-abierto");
}

modalCerrar.addEventListener("click", cerrarModal);

// Si el click fue directamente sobre el fondo oscuro (y no sobre el
// contenido de adentro), tambien cerramos el modal.
modal.addEventListener("click", (e) => {
  if (e.target === modal) cerrarModal();
});

// Cerrar con la tecla Escape, sin importar donde este el foco.
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") cerrarModal();
});
