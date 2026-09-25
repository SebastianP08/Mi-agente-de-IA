// memoria.js
// Juego de memoria (flip cards) con los proyectos del portafolio.
// Adaptado de "cardGame" de Julian Bejarano (licencia MIT):
// https://codepen.io/julianbejarano/pen/myrzjBG
// (copia original en ejemplo-juego/cardgame). Cambios principales: usa
// "proyectos" de data.js en vez de un array fijo, la cantidad de pares
// se calcula sola, el reverso es CSS (sin imagen externa), las cartas son
// <button> (se pueden usar con teclado), y el premio es el mejor puntaje
// de cada usuario guardado en localStorage, junto con el historial de
// TODAS sus partidas (ganadas y abandonadas).
//
// Depende de:
// - data.js          -> "proyectos"
// - usuarios-game.js -> leerUsuarios, guardarUsuarios, siguienteIdPartida,
//                       mejorPartida, esMejorPartida, formatearTiempo
// - game.js          -> llama a iniciarMemoria cuando el login sale bien.

// --- Configuracion ---
// Tope de pares: con 8 proyectos quedan 16 cartas (4 x 4). Si en
// localStorage hay mas proyectos, se eligen 8 al azar en cada partida.
const MAX_PARES = 8;
// Cuanto tiempo (ms) quedan a la vista dos cartas que NO coinciden.
const TIEMPO_VISTA_MS = 900;

// --- Elementos del HTML ---
const tableroMemoria = document.getElementById("tableroMemoria");
const hudTiempo = document.getElementById("hudTiempo");
const hudIntentos = document.getElementById("hudIntentos");
const hudPares = document.getElementById("hudPares");
const memoriaRecord = document.getElementById("memoriaRecord");
const memoriaAviso = document.getElementById("memoriaAviso");
const btnReiniciarMemoria = document.getElementById("btnReiniciarMemoria");
const overlayVictoria = document.getElementById("overlayVictoria");
const nuevoRecord = document.getElementById("nuevoRecord");
const btnJugarDeNuevo = document.getElementById("btnJugarDeNuevo");

// --- Estado de la partida ---
let usuarioActual = null; // el que hizo login (lo pasa game.js)
let primeraCarta = null; // la carta que se dio vuelta primero en este turno
let bloqueado = false; // true mientras dos cartas distintas estan a la vista
let paresEncontrados = 0;
let totalPares = 0;
let intentos = 0;
let segundos = 0;
let intervaloTimer = null; // id de setInterval, para poder frenarlo
// id de setTimeout de "dar vuelta de nuevo". Lo guardamos para poder
// cancelarlo al reiniciar: en el ejemplo original, reiniciar justo
// despues de un par fallido hacia que ese timeout corriera igual sobre
// cartas que ya no existian (carta1 = null -> TypeError).
let timeoutVolteo = null;
// true cuando la partida actual ya quedo guardada en el historial (al
// ganar). Evita guardarla dos veces: por ejemplo, ganar y despues tocar
// "Jugar de nuevo" la registraria otra vez como abandonada.
let partidaRegistrada = false;

// --- Utilidades ---
// Mezcla Fisher-Yates (misma idea que shuffle en el ejemplo): recorre la
// lista de atras para adelante e intercambia cada elemento con otro al
// azar de los que quedan. Trabaja sobre una copia ([...lista]) para no
// desordenar "proyectos".
function mezclar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // Intercambio con desestructuracion: sin variable temporal.
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// --- Cronometro ---
// Arranca con la PRIMERA carta que se da vuelta (no al cargar), asi el
// tiempo no corre mientras se mira el tablero sin jugar.
function iniciarTimer() {
  clearInterval(intervaloTimer); // por si ya habia uno corriendo
  intervaloTimer = setInterval(function () {
    segundos++;
    hudTiempo.textContent = formatearTiempo(segundos);
  }, 1000);
}

function detenerTimer() {
  clearInterval(intervaloTimer);
  intervaloTimer = null;
}

// --- Mazo ---
// Elige los proyectos que van a jugar:
// 1) filter: solo los que tienen imagen (en gestion.html es opcional, y
//    una carta sin imagen no se puede reconocer).
// 2) mezclar + slice: si hay mas de MAX_PARES, 8 distintos al azar.
function elegirProyectos() {
  const conImagen = proyectos.filter(function (proyecto) {
    return Boolean(proyecto.imagen);
  });
  return mezclar(conImagen).slice(0, MAX_PARES);
}

// Crea UNA carta. Es un <button> (y no un <div> como en el ejemplo)
// para que se pueda usar con Tab + Enter y el lector de pantalla la
// anuncie como algo clickeable. Adentro solo van <span> porque un
// <button> no puede tener <div> adentro (HTML invalido).
function crearCarta(proyecto) {
  const carta = document.createElement("button");
  carta.type = "button";
  carta.className = "memoria-carta";
  // Guardamos el id del proyecto para comparar las dos cartas del turno.
  carta.dataset.idProyecto = proyecto.id;
  carta.setAttribute("aria-label", "Carta boca abajo");

  const interior = document.createElement("span");
  interior.className = "memoria-carta-inner";

  // Reverso: lo que se ve al principio. Es solo CSS (gradiente + "?").
  const reverso = document.createElement("span");
  reverso.className = "memoria-cara memoria-cara-reverso";
  reverso.textContent = "?";

  // Frente: imagen + nombre + categoria del proyecto. textContent (no
  // innerHTML) porque los proyectos creados en gestion.html los escribe
  // una persona.
  const frente = document.createElement("span");
  frente.className = "memoria-cara memoria-cara-frente";

  const imagen = document.createElement("img");
  imagen.src = proyecto.imagen;
  imagen.alt = ""; // el nombre ya lo dice el aria-label de la carta
  imagen.loading = "lazy";

  const nombre = document.createElement("span");
  nombre.className = "memoria-carta-nombre";
  nombre.textContent = proyecto.nombre;

  const categoria = document.createElement("span");
  categoria.className = "memoria-carta-categoria";
  categoria.textContent = proyecto.categoria;

  frente.append(imagen, nombre, categoria);
  interior.append(reverso, frente);
  carta.appendChild(interior);

  carta.addEventListener("click", function () {
    manejarClic(carta, proyecto);
  });

  return carta;
}

// --- Turno ---
function manejarClic(carta, proyecto) {
  // Mismos "guardias" que el ejemplo: no hacer nada si hay dos cartas
  // esperando, si esta ya esta dada vuelta o si ya es un par encontrado.
  if (bloqueado) return;
  if (carta.classList.contains("volteada")) return;
  if (carta.classList.contains("encontrada")) return;

  // El cronometro arranca con la primera carta de la partida.
  if (intervaloTimer === null) iniciarTimer();

  carta.classList.add("volteada");
  carta.setAttribute("aria-label", proyecto.nombre);

  // Caso A: primera carta del turno -> la guardamos y esperamos otra.
  if (primeraCarta === null) {
    primeraCarta = carta;
    return;
  }

  // Caso B: segunda carta -> cuenta como intento y comparamos.
  const segundaCarta = carta;
  intentos++;
  hudIntentos.textContent = intentos;

  if (primeraCarta.dataset.idProyecto === segundaCarta.dataset.idProyecto) {
    marcarPar(primeraCarta, segundaCarta);
  } else {
    // No coinciden: las dejamos a la vista un momento y las volvemos a
    // tapar. Mientras tanto "bloqueado" impide dar vuelta una tercera.
    bloqueado = true;
    const cartaA = primeraCarta;
    timeoutVolteo = setTimeout(function () {
      taparCarta(cartaA);
      taparCarta(segundaCarta);
      bloqueado = false;
      timeoutVolteo = null;
    }, TIEMPO_VISTA_MS);
  }

  primeraCarta = null;
}

function taparCarta(carta) {
  carta.classList.remove("volteada");
  carta.setAttribute("aria-label", "Carta boca abajo");
}

function marcarPar(cartaA, cartaB) {
  [cartaA, cartaB].forEach(function (carta) {
    carta.classList.remove("volteada");
    carta.classList.add("encontrada");
    // disabled: ya no se puede clickear ni llegar con Tab.
    carta.disabled = true;
  });

  paresEncontrados++;
  hudPares.textContent = paresEncontrados + "/" + totalPares;

  if (paresEncontrados === totalPares) {
    detenerTimer();
    // Pequeña pausa para que se vea la animacion del ultimo par.
    setTimeout(mostrarVictoria, 500);
  }
}

// --- Historial de partidas (localStorage) ---
// Agrega la partida actual al array "partidas" del usuario dentro de
// "game-usuarios" (el mismo array que usa el login).
// - completada: true si gano, false si la abandono (reinicio o cerro la
//   pagina a mitad de camino).
// Devuelve true si fue un nuevo record (solo puede pasar si gano).
function registrarPartida(completada) {
  // Si ya se guardo (ej. gano y despues toco "Jugar de nuevo") o si no
  // llego a voltear ningun par, no hay nada que registrar: una partida
  // que ni empezo no le sirve a nadie en el historial.
  if (partidaRegistrada || intentos === 0) return false;
  partidaRegistrada = true;

  // Siempre releemos de localStorage (y no usamos usuarioActual) por si
  // cambio algo desde que se hizo login, ej. se registro otro usuario en
  // otra pestaña y hay ids de partida nuevos.
  const usuarios = leerUsuarios();
  const usuarioGuardado = usuarios.find(function (usuario) {
    return usuario.id === usuarioActual.id;
  });

  // Por si el usuario se borro de localStorage mientras jugaba.
  if (!usuarioGuardado) return false;

  // El record se calcula ANTES de agregar la partida nueva: si no, la
  // nueva siempre se compararia contra si misma.
  const recordAnterior = mejorPartida(usuarioGuardado.partidas);

  const partida = {
    id: siguienteIdPartida(usuarios),
    fecha: new Date().toISOString(), // ej. "2026-09-25T18:30:00.000Z"
    completada: completada,
    pares: totalPares,
    intentos: intentos,
    segundos: segundos,
  };

  usuarioGuardado.partidas.push(partida);
  guardarUsuarios(usuarios);
  usuarioActual.partidas = usuarioGuardado.partidas; // para mostrarlo sin releer

  return completada && esMejorPartida(partida, recordAnterior);
}

function mostrarRecord() {
  const record = mejorPartida(usuarioActual.partidas ?? []);
  const jugadas = (usuarioActual.partidas ?? []).length;

  memoriaRecord.textContent = record
    ? "Tu mejor partida: " + record.intentos + " intentos en " + formatearTiempo(record.segundos) +
      " (" + record.pares + " pares) · " + jugadas + " partidas jugadas"
    : "Todavía no tienes récord: ¡gana una partida para tener el primero!";
}

// --- Victoria ---
function mostrarVictoria() {
  nuevoRecord.hidden = !registrarPartida(true);
  mostrarRecord();

  document.getElementById("victoriaTiempo").textContent = formatearTiempo(segundos);
  document.getElementById("victoriaIntentos").textContent = intentos;
  document.getElementById("victoriaPares").textContent = totalPares + "/" + totalPares;

  overlayVictoria.hidden = false;
  // Llevamos el foco al boton: con teclado se puede seguir jugando sin
  // tener que buscar donde quedo.
  btnJugarDeNuevo.focus();
}

function cerrarVictoria() {
  overlayVictoria.hidden = true;
}

// --- Armar / reiniciar la partida ---
function nuevaPartida() {
  // Si la partida anterior quedo a medias (se reinicio sin ganar), se
  // guarda como abandonada. Si ya se habia guardado al ganar, o si no
  // se jugo nada, registrarPartida no hace nada.
  registrarPartida(false);
  partidaRegistrada = false;

  // Cancelamos cualquier cosa pendiente de la partida anterior (el bug
  // del ejemplo original, ver timeoutVolteo arriba).
  clearTimeout(timeoutVolteo);
  timeoutVolteo = null;
  detenerTimer();
  cerrarVictoria();

  primeraCarta = null;
  bloqueado = false;
  paresEncontrados = 0;
  intentos = 0;
  segundos = 0;

  const elegidos = elegirProyectos();
  totalPares = elegidos.length;

  hudTiempo.textContent = "00:00";
  hudIntentos.textContent = "0";
  hudPares.textContent = "0/" + totalPares;
  tableroMemoria.innerHTML = "";

  // Con menos de 2 proyectos con imagen no hay juego posible (1 solo par
  // se resuelve en un click).
  if (totalPares < 2) {
    memoriaAviso.textContent =
      "Hacen falta al menos 2 proyectos con imagen para jugar. Agrega más desde gestion.html.";
    memoriaAviso.hidden = false;
    return;
  }
  memoriaAviso.hidden = true;

  // Cada proyecto dos veces (el par) y todo mezclado. [...a, ...a] hace
  // lo mismo que a.concat(a) del ejemplo.
  const mazo = mezclar([...elegidos, ...elegidos]);
  mazo.forEach(function (proyecto) {
    tableroMemoria.appendChild(crearCarta(proyecto));
  });
}

// La llama game.js cuando el login o el registro salen bien.
function iniciarMemoria(usuario) {
  usuarioActual = usuario;
  // La primera partida no tiene una "anterior" que registrar.
  partidaRegistrada = true;
  mostrarRecord();
  nuevaPartida();
}

// --- Eventos ---
btnReiniciarMemoria.addEventListener("click", nuevaPartida);
btnJugarDeNuevo.addEventListener("click", nuevaPartida);

// Cerrar la pestaña, recargar o irse a otra pagina a mitad de partida
// tambien cuenta como abandonarla. "pagehide" se dispara justo antes de
// que la pagina se vaya; localStorage.setItem es sincronico (termina
// antes de seguir), asi que alcanza a guardar. usuarioActual === null
// significa que nunca se hizo login: no hay a quien registrarle nada.
window.addEventListener("pagehide", function () {
  if (usuarioActual !== null) registrarPartida(false);
});

// Escape cierra la ventana de victoria (sin empezar otra partida).
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && !overlayVictoria.hidden) cerrarVictoria();
});
