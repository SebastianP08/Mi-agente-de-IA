// Clave usada para guardar/leer los proyectos en localStorage. gestion.js
// escribe aca cada vez que se crea un proyecto nuevo (ver formCrear en
// gestion.js).
const CLAVE_LOCALSTORAGE = "portafolio-proyectos";

// Los 8 proyectos originales: el punto de partida la primera vez que se
// abre la pagina, o si localStorage todavia esta vacio.
const proyectosPorDefecto = [
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

// Si ya hay proyectos guardados en localStorage (porque se creo alguno
// antes en gestion.html), usamos esos en vez de proyectosPorDefecto.
// localStorage solo guarda texto, por eso JSON.parse para convertirlo de
// vuelta a un array de objetos.
const proyectosGuardados = localStorage.getItem(CLAVE_LOCALSTORAGE);
const proyectos = proyectosGuardados ? JSON.parse(proyectosGuardados) : proyectosPorDefecto;

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