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

// Arreglo de objetos: cada objeto es la "data" de un proyecto del
// portafolio (mismo patron que "villanos" en Objetos/index.js, un arreglo
// de objetos literales todos con las mismas keys).
const proyectos = [
  {
    nombre: "Página Web Jaziz",
    categoria: "Diseño Web",
    herramienta: "Visual Studio Code",
    imagen: "Imgs-proyectos/Jaziz.png",
    descripcion:
      "Página web para Jaziz, el emprendimiento de bisutería de mi mamá (pulseras, collares, aretes, anillos, entre otros). Incluye un elemento 3D animado que se reproduce en video apenas se entra a la página.",
    enProceso: true,
    horasInvertidas: 14,
    etapas: ["Wireframe", "Diseño visual", "Maquetado HTML/CSS", "Desarrollo JS"],
  },
  {
    nombre: "Página Web GlobalSeguros",
    categoria: "Diseño Web",
    herramienta: "Visual Studio Code",
    imagen: "Imgs-proyectos/Global.png",
    descripcion:
      "Página web para la aseguradora GlobalSeguros, con foco en seguros educativos. Se desarrolló como parte de un hackathon en el que la empresa buscaba una forma más dinámica y creativa de mostrar este servicio, corrigiendo errores de su página original como el exceso de información y los colores muy fuertes.",
    enProceso: false,
    enlace: "https://sebastianp08.github.io/GH2026_UniversidadElBosque_Harkan_GlobalSeguros/",
    horasInvertidas: 16,
    etapas: ["Wireframe", "Concepto visual", "Maquetado", "Desarrollo"],
  },
  {
    nombre: "Elementos 3D para GlobalSeguros",
    categoria: "Modelado 3D",
    herramienta: "Blender",
    imagen: "Imgs-proyectos/3D-Global.png",
    descripcion:
      'Elementos 3D en forma de llave creados para la página de GlobalSeguros, pensados para reforzar el mensaje "la llave ideal para el futuro de tu hijo" y darle un tono más original y dinámico a la página.',
    enProceso: false,
    enlace: "https://drive.google.com/file/d/1V9n9VbLC3lZGp0suZTQsnfpOKQG5fnjT/view?usp=drive_link",
    horasInvertidas: 12,
    etapas: ["Boceto", "Modelado", "Texturizado", "Render"],
  },
  {
    nombre: "Bestia de Fantasía 3D",
    categoria: "Modelado 3D",
    herramienta: "Blender",
    imagen: "Imgs-proyectos/Bestia-3D.png",
    descripcion:
      "Bestia con forma de lobo modelada en 3D, hecha como trabajo para la Universidad.",
    enProceso: false,
    enlace: "https://drive.google.com/file/d/1p5Qhqh_VaGi7J4yXFTtFmX-oRB8RXciR/view?usp=drive_link",
    horasInvertidas: 13,
    etapas: ["Boceto", "Modelado", "Texturizado", "Bloqueo de poses", "Timing", "Refinamiento", "Render"],
  },
  {
    nombre: "Animación de una Pelota 3D",
    categoria: "Animación 3D",
    herramienta: "Blender",
    imagen: "Imgs-proyectos/Animacion-Pelota-3D.png",
    descripcion:
      "Animación de una pelota rebotando, hecha para entender el rebote y los principios básicos de la animación. Trabajo para la Universidad.",
    enProceso: false,
    enlace: "https://drive.google.com/file/d/1Eg3cOiGRkQ9daqbJozuU15CPSflZA6PB/view?usp=drive_link",
    horasInvertidas: 5,
    etapas: ["Bloqueo de poses", "Timing", "Refinamiento", "Render"],
  },
  {
    nombre: "Animación de Péndulo 3D",
    categoria: "Animación 3D",
    herramienta: "Blender",
    imagen: "Imgs-proyectos/Pendulo-3D.png",
    descripcion:
      "Animación en loop de un péndulo, hecha para practicar los principios de la animación. Trabajo para la Universidad.",
    enProceso: false,
    enlace: "https://drive.google.com/file/d/1A0mF8o80x8IP74ObnvxjPlVHeWTnMmtn/view?usp=drive_link",
    horasInvertidas: 5,
    etapas: ["Bloqueo de poses", "Timing", "Refinamiento", "Render"],
  },
  {
    nombre: "Esculpido de Mano Realista",
    categoria: "Escultura 3D",
    herramienta: "Blender",
    imagen: "Imgs-proyectos/Mano-Esculpido.png",
    descripcion:
      "Mano realista esculpida manualmente, hecha como trabajo para la Universidad.",
    enProceso: false,
    horasInvertidas: 5,
    etapas: ["Boceto", "Esculpido base", "Detalles", "Render"],
  },
  {
    nombre: "Documento GDD",
    categoria: "Documento de Diseño",
    herramienta: "Figma y Word",
    imagen: "Imgs-proyectos/GDD.png",
    descripcion:
      "GDD (Game Design Document) para un videojuego en desarrollo, con el objetivo de definir un MVP. El concepto se trabajó paso a paso en Figma y luego se redactó en Word, exportado finalmente a PDF.",
    enProceso: true,
    enlace: "https://docs.google.com/document/d/18DPJSW0Ffx5YKwzCsVJE7skcESSO3qReEeVpR250S7Y/edit?usp=sharing",
    horasInvertidas: 6,
    etapas: ["Lluvia de ideas", "Boceto en Figma", "Redacción en Word", "Exportación a PDF"],
  },
];

// Icono SVG segun la herramienta usada en cada proyecto (viven en la
// carpeta Icons-Herramientas). La key tiene que ser identica al texto
// que se escribio en el campo "herramienta" de cada objeto de arriba.
const iconosPorHerramienta = {
  "Visual Studio Code": "Icons-Herramientas/vscode.svg",
  Blender: "Icons-Herramientas/blender.svg",
  "Figma y Word": "Icons-Herramientas/figma.svg",
};

// Clase CSS por herramienta: define el color del badge (ver
// portafolio-cards.css). Cada herramienta tiene su propio color para que
// se distinga mejor de un vistazo.
const clasesPorHerramienta = {
  "Visual Studio Code": "herramienta-vscode",
  Blender: "herramienta-blender",
  "Figma y Word": "herramienta-figma-word",
};

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
// modal). Se usa una vez por cada elemento de "proyectos" (ver el forEach
// mas abajo) -- mismo patron que crearCarta en Objetos/index.js.
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

// Por cada objeto del arreglo proyectos, se crea su tarjeta y se agrega
// dentro de #galeria. Asi terminamos con las 8 tarjetas en pantalla.
proyectos.forEach((proyecto) => galeria.appendChild(crearTarjeta(proyecto)));

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
