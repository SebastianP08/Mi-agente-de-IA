// Tope de referencia para calcular el porcentaje de la barra de poder.
// Yhwach tiene 1000, por eso su barra sale llena (100%).
const NIVEL_MAXIMO = 1000;

// Arreglo de objetos: cada objeto es la "data" de una tarjeta de villano.
// El HTML no tiene texto quemado para estos datos, todo sale de aqui.
const villanos = [
  {
    nombre: "Yhwach",
    poderes: ["Ver el futuro", "Alterar el futuro", "Presión espiritual", "Super velocidad", "Super fuerza"],
    descripcion:
      "Yhwach, hijo del rey espiritual, lider de la raza quincy. Alguien que nacio con el Almighty, un poder para ver infinitos futuros y elegir cualquiera para traerlo al presente, busca acabar con todos los mundos",
    bando: "villano",
    imagen: "https://preview.redd.it/so-what-exactly-is-yhwach-is-he-the-actual-biological-son-v0-9zkjx4lpvp9g1.jpeg?auto=webp&s=00328bccb190ec9d5f52af6125374299c57cb9ff",
    raza: "quincy",
    edad: 1000,
    altura: "2 metros",
    universo: "bleach",
    nivelDeFuerza: 1000,
    activo: true,
  },
  {
    nombre: "Frieza",
    poderes: ["Transformaciones", "Rayos de energia", "Vuelo", "Regeneracion", "Telequinesis"],
    descripcion:
      "Emperador galactico y tirano de una de las razas mas temidas del universo, conquista y destruye planetas enteros sin ningun tipo de remordimiento.",
    bando: "villano",
    imagen: "https://static.wikia.nocookie.net/featteca/images/d/db/Freezer_render_.png/revision/latest?cb=20240719211559&path-prefix=es",
    raza: "changuiano",
    edad: 100,
    altura: "1.5 metros",
    universo: "dragon ball",
    nivelDeFuerza: 850,
    activo: true,
  },
  {
    nombre: "Madara Uchiha",
    poderes: ["Sharingan", "Rinnegan", "Control de Bijuus", "Susanoo", "Ninjutsu de fuego"],
    descripcion:
      "Legendario shinobi del clan Uchiha que busca imponer un mundo de ilusion perfecto mediante el Infinite Tsukuyomi.",
    bando: "villano",
    imagen: "https://static.wikia.nocookie.net/naruto/images/f/fd/Madara.png/revision/latest?cb=20160115141947",
    raza: "humano",
    edad: 80,
    altura: "1.8 metros",
    universo: "naruto",
    nivelDeFuerza: 900,
    activo: false,
  },
  {
    nombre: "Dio Brando",
    poderes: ["Detener el tiempo", "Super fuerza", "Absorcion de sangre", "Manipulacion"],
    descripcion:
      "Vampiro ambicioso que tras robar el cuerpo de Jonathan Joestar, se propone dominar el mundo con su Stand, The World.",
    bando: "villano",
    imagen: "https://static.wikia.nocookie.net/jjba/images/1/17/DioBPflww.png/revision/latest?cb=20241115011651",
    raza: "vampiro",
    edad: 122,
    altura: "1.9 metros",
    universo: "jojo's bizarre adventure",
    nivelDeFuerza: 750,
    activo: false,
  },
  {
    nombre: "Muzan Kibutsuji",
    poderes: ["Regeneracion", "Manipulacion de sangre", "Super velocidad", "Creacion de demonios"],
    descripcion:
      "Primer y mas poderoso demonio, origen de todos los demas, busca alcanzar la inmortalidad absoluta bajo la luz del sol.",
    bando: "villano",
    imagen: "https://static.wikia.nocookie.net/kimetsu-no-yaiba/images/0/0e/Muzan_Kibutsuji_Full_Body_%28Anime%29.png/revision/latest?cb=20210731042132",
    raza: "demonio",
    edad: 1000,
    altura: "1.8 metros",
    universo: "demon slayer",
    nivelDeFuerza: 880,
    activo: true,
  },
  {
    nombre: "Meruem",
    poderes: ["Fuerza sobrehumana", "Nen", "Aprendizaje instantaneo", "Veneno letal"],
    descripcion:
      "Rey de las hormigas quimera, un ser nacido para ser la cima evolutiva, con un poder e intelecto sin comparacion.",
    bando: "villano",
    imagen: "https://static.wikia.nocookie.net/hunterxhunter/images/5/58/Meruem_CA_Portrait.png/revision/latest?cb=20190419124312",
    raza: "hormiga quimera",
    edad: 0,
    altura: "2.2 metros",
    universo: "hunter x hunter",
    nivelDeFuerza: 970,
    activo: false,
  },
  {
    nombre: "Light Yagami",
    poderes: ["Death Note", "Inteligencia excepcional", "Manipulacion psicologica"],
    descripcion:
      "Estudiante brillante que, tras encontrar un cuaderno capaz de matar a quien escriba su nombre, se autoproclama un dios de un nuevo mundo.",
    bando: "villano",
    imagen: "https://static.wikia.nocookie.net/deathnote/images/0/05/299276.jpg/revision/latest?cb=20160609084120",
    raza: "humano",
    edad: 23,
    altura: "1.79 metros",
    universo: "death note",
    nivelDeFuerza: 200,
    activo: false,
  },
  {
    nombre: "Thanos",
    poderes: ["Fuerza sobrehumana", "Guantelete del infinito", "Estrategia militar"],
    descripcion:
      "Titan que busca el equilibrio del universo eliminando a la mitad de toda la vida existente mediante las Gemas del Infinito.",
    bando: "villano",
    imagen: "https://static.wikia.nocookie.net/marveldatabase/images/6/6f/Thanos_Vol_4_1_Lim_Virgin_Variant.jpg/revision/latest?cb=20231110201203",
    raza: "titan",
    edad: 1000,
    altura: "2.05 metros",
    universo: "marvel",
    nivelDeFuerza: 950,
    activo: false,
  },
  {
    nombre: "Lord Voldemort",
    poderes: ["Magia oscura", "Horrocruxes", "Legeremancia", "Maldiciones imperdonables"],
    descripcion:
      "El mago tenebroso mas temido de su epoca, busca la inmortalidad y el dominio total del mundo magico.",
    bando: "villano",
    imagen: "https://static.wikia.nocookie.net/harrypotter/images/9/97/Voldemort_Headshot_DHF1.png/revision/latest?cb=20161203031453",
    raza: "mago",
    edad: 71,
    altura: "1.8 metros",
    universo: "harry potter",
    nivelDeFuerza: 600,
    activo: false,
  },
  {
    nombre: "Sauron",
    poderes: ["El Unico Anillo", "Manipulacion", "Ejercitos oscuros", "Vision omnipresente"],
    descripcion:
      "Señor oscuro de Mordor que forjo el Unico Anillo para dominar a todas las razas de la Tierra Media.",
    bando: "villano",
    imagen: "https://static.wikia.nocookie.net/lotr/images/9/90/Sauron-2.jpg/revision/latest?cb=20110508182634",
    raza: "maia",
    edad: 7000,
    altura: "3 metros",
    universo: "el señor de los anillos",
    nivelDeFuerza: 700,
    activo: false,
  },
  {
    nombre: "Darth Vader",
    poderes: ["Fuerza oscura", "Telequinesis", "Combate con sable de luz", "Estrangulamiento a distancia"],
    descripcion:
      "Antiguo caballero Jedi caido al lado oscuro, se convierte en el implacable ejecutor del Imperio Galactico.",
    bando: "villano",
    imagen: "https://static.wikia.nocookie.net/starwars/images/d/de/DarthVader-TheEmpire2026.png/revision/latest?cb=20260522041242",
    raza: "humano cyborg",
    edad: 45,
    altura: "2.02 metros",
    universo: "star wars",
    nivelDeFuerza: 800,
    activo: false,
  },
  {
    nombre: "Joker",
    poderes: ["Genio criminal", "Manipulacion psicologica", "Imprevisibilidad", "Dominio del caos"],
    descripcion:
      "Criminal caotico de Ciudad Gotica que no busca dinero ni poder, solo demostrar que cualquiera puede caer en la locura en un mal dia.",
    bando: "villano",
    imagen: "https://static.wikia.nocookie.net/marvel_dc/images/5/58/Joker_0003.jpg/revision/latest?cb=20140725171230",
    raza: "humano",
    edad: 45,
    altura: "1.85 metros",
    universo: "dc comics",
    nivelDeFuerza: 300,
    activo: true,
  },
];

// Referencias al DOM que vamos a usar para armar la galeria:
// - plantilla: el <template> del index.html, es el "molde" de una tarjeta vacia.
// - contenedor: el <div id="contenedor"> dentro de section.galeria, donde van a caer las 12 tarjetas.
const plantilla = document.getElementById("plantilla-carta");
const contenedor = document.getElementById("contenedor");

// Recibe UN objeto villano y devuelve UNA tarjeta de HTML ya llena con sus datos.
// Se usa una sola vez por cada elemento del arreglo (ver el forEach mas abajo).
function crearCarta(villano) {
  // plantilla.content.cloneNode(true) copia el contenido del <template>
  // sin tocar el original, para poder repetirlo 12 veces sin que se pisen entre si.
  const carta = plantilla.content.cloneNode(true);

  // Como el <template> ya no tiene ids (para poder repetirse), buscamos cada
  // elemento dentro de ESTA copia puntual con querySelector + clase.
  const imagen = carta.querySelector(".imagen");
  imagen.src = villano.imagen;
  imagen.alt = villano.nombre;

  carta.querySelector(".bando").textContent = villano.bando;
  carta.querySelector(".nombre").textContent = villano.nombre;
  carta.querySelector(".universo").textContent = villano.universo;
  carta.querySelector(".raza").textContent = villano.raza;
  carta.querySelector(".edad").textContent = villano.edad;
  carta.querySelector(".altura").textContent = villano.altura;
  carta.querySelector(".nivelDeFuerza").textContent = villano.nivelDeFuerza;
  carta.querySelector(".descripcion").textContent = villano.descripcion;

  // El arreglo de poderes se convierte en una lista de <li>, uno por poder,
  // y se inserta de una sola vez dentro del <ul class="poderes">.
  carta.querySelector(".poderes").innerHTML = villano.poderes.map((poder) => `<li>${poder}</li>`).join("");

  // Barra de poder: se calcula que porcentaje representa nivelDeFuerza sobre
  // el maximo definido arriba, y ese porcentaje se usa como ancho de la barra.
  // Math.min(..., 100) evita que la barra se pase del 100% si algun villano
  // llegara a tener mas nivel que NIVEL_MAXIMO.
  const porcentajePoder = Math.min((villano.nivelDeFuerza / NIVEL_MAXIMO) * 100, 100);
  carta.querySelector(".barra-poder-fill").style.width = `${porcentajePoder}%`;

  // Efecto tilt 3D que sigue el mouse (mismo truco que la carta de
  // referencia en OUTPUT/Card, pero sin el brillo/color, solo el
  // movimiento): en cada pointermove se calcula en que parte de la
  // tarjeta esta el cursor (0 a 1 en x/y) y con eso se arma un angulo
  // de rotacion que se guarda como CSS custom property. El CSS
  // (style.css) es el que usa esas variables para rotar la tarjeta.
  const cartaEl = carta.querySelector(".carta");

  cartaEl.addEventListener("pointermove", (e) => {
    const rect = cartaEl.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    const rotateY = (px - 0.5) * 4;
    const rotateX = (py - 0.5) * -4;

    cartaEl.style.setProperty("--rx", rotateX.toFixed(2) + "deg");
    cartaEl.style.setProperty("--ry", rotateY.toFixed(2) + "deg");
    cartaEl.classList.add("activa");
  });

  cartaEl.addEventListener("pointerleave", () => {
    cartaEl.style.setProperty("--rx", "0deg");
    cartaEl.style.setProperty("--ry", "0deg");
    cartaEl.classList.remove("activa");
  });

  // Al hacer click en la tarjeta se abre el modal con el detalle completo
  // de ESE villano en particular (ver funcion abrirModal mas abajo).
  cartaEl.addEventListener("click", () => abrirModal(villano));

  return carta;
}

// Por cada objeto del arreglo villanos, se crea su tarjeta y se agrega
// dentro de #contenedor. Asi terminamos con las 12 tarjetas en pantalla.
villanos.forEach((villano) => contenedor.appendChild(crearCarta(villano)));

// --- Modal de detalle ---
// A diferencia de las tarjetas (que se repiten 12 veces y por eso usan
// clases), el modal es UN solo elemento que se reutiliza y se rellena con
// los datos del villano en el que se hizo click, asi que aca si podemos
// usar ids con document.getElementById sin problema.
const modal = document.getElementById("modal");
const modalCerrar = document.getElementById("modalCerrar");

function abrirModal(villano) {
  const modalImagen = document.getElementById("modalImagen");
  modalImagen.src = villano.imagen;
  modalImagen.alt = villano.nombre;

  document.getElementById("modalBando").textContent = villano.bando;
  document.getElementById("modalNombre").textContent = villano.nombre;
  document.getElementById("modalUniverso").textContent = villano.universo;
  document.getElementById("modalRaza").textContent = villano.raza;
  document.getElementById("modalEdad").textContent = villano.edad;
  document.getElementById("modalAltura").textContent = villano.altura;
  document.getElementById("modalNivelDeFuerza").textContent = villano.nivelDeFuerza;
  document.getElementById("modalDescripcion").textContent = villano.descripcion;
  document.getElementById("modalPoderes").innerHTML = villano.poderes.map((poder) => `<li>${poder}</li>`).join("");

  const porcentajePoder = Math.min((villano.nivelDeFuerza / NIVEL_MAXIMO) * 100, 100);
  document.getElementById("modalBarraPoderFill").style.width = `${porcentajePoder}%`;

  modal.classList.add("visible");
  document.body.classList.add("modal-abierto");
}

function cerrarModal() {
  modal.classList.remove("visible");
  document.body.classList.remove("modal-abierto");
}

modalCerrar.addEventListener("click", cerrarModal);

// Si el click fue directamente sobre el fondo oscuro (y no sobre la tarjeta
// de adentro), tambien cerramos el modal.
modal.addEventListener("click", (e) => {
  if (e.target === modal) cerrarModal();
});

// Cerrar con la tecla Escape, sin importar donde este el foco.
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") cerrarModal();
});

// Boton de modo oscuro/claro: cada click agrega o quita la clase "oscuro"
// en el body. El CSS es el que realmente cambia los colores segun esa clase,
// aqui solo decidimos si esta activa o no y cambiamos el texto del boton.
const btnModoOscuro = document.getElementById("btnModoOscuro");
btnModoOscuro.addEventListener("click", () => {
  document.body.classList.toggle("oscuro");
  const activado = document.body.classList.contains("oscuro");
  btnModoOscuro.textContent = activado ? "☀️ Modo claro" : "🌙 Modo oscuro";
});
