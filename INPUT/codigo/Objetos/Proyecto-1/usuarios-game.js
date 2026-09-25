// usuarios-game.js
// Todo lo que tiene que ver con los DATOS de los usuarios del juego
// (guardados en localStorage). Lo usan dos paginas:
// - game.html    -> game.js (login/registro) y memoria.js (partidas)
// - gestion.html -> gestion.js (pestaña "Usuarios")
// Por eso vive en su propio archivo: si estuviera copiado en los dos
// lados, un cambio en uno (ej. como se calcula el id) se olvidaria en
// el otro.
//
// localStorage solo guarda TEXTO: el array se pasa a JSON con
// JSON.stringify al guardar y se vuelve array con JSON.parse al leer.
// Asi se ve UN usuario (DevTools > Application > Local Storage):
// {
//   "id": 1,
//   "nombre": "Ana", "alias": "ana99", "email": "ana@gmail.com",
//   "password": "Hola!23", "passwordHash": "9f86d0...",
//   "partidas": [
//     { "id": 1, "fecha": "2026-09-25T18:30:00.000Z", "completada": true,
//       "pares": 8, "intentos": 12, "segundos": 83 }
//   ]
// }

const CLAVE_USUARIOS = "game-usuarios";

// --- Ids autogenerados ---
// Mismo truco que siguienteId en data.js: el id mas alto que ya existe
// + 1. No usamos un contador fijo (ej. "let proximoId = 1") porque al
// recargar la pagina volveria a 1 y repetiria ids ya guardados.
// El 0 extra es por si la lista esta vacia: Math.max() sin nada da
// -Infinity. "?? 0" cubre usuarios viejos que todavia no tienen id.
function siguienteIdUsuario(usuarios) {
  return Math.max(0, ...usuarios.map((usuario) => usuario.id ?? 0)) + 1;
}

// Los ids de partida son unicos entre TODOS los usuarios (no se reinician
// por usuario): asi "partida #4" identifica una sola partida en todo el
// sistema. flatMap junta los arrays de partidas de cada usuario en uno
// solo (igual que con las etapas en el portafolio).
function siguienteIdPartida(usuarios) {
  const todasLasPartidas = usuarios.flatMap((usuario) => usuario.partidas ?? []);
  return Math.max(0, ...todasLasPartidas.map((partida) => partida.id)) + 1;
}

// --- Leer y guardar ---
function guardarUsuarios(usuarios) {
  localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(usuarios));
}

// Lee la lista y, de paso, "migra" los usuarios guardados con una
// version anterior del codigo, para que todos tengan la misma forma:
// - sin "partidas" -> se le pone un array vacio.
// - sin "id"       -> se le asigna uno nuevo.
// - con "mejorPartida" (version anterior de memoria.js) -> se convierte
//   en la primera partida de su historial, para no perder ese record.
// Si hubo que arreglar algo, se guarda enseguida (asi la migracion
// ocurre una sola vez).
function leerUsuarios() {
  let usuarios;

  // try/catch: si el texto guardado quedo mal escrito (ej. editado a
  // mano), JSON.parse tira un error. Arrancamos con la lista vacia en vez
  // de romper toda la pagina.
  try {
    usuarios = JSON.parse(localStorage.getItem(CLAVE_USUARIOS)) ?? [];
  } catch (error) {
    usuarios = [];
  }
  if (!Array.isArray(usuarios)) usuarios = [];

  let huboCambios = false;

  usuarios.forEach((usuario) => {
    if (!Array.isArray(usuario.partidas)) {
      usuario.partidas = [];
      huboCambios = true;
    }

    if (usuario.id === undefined) {
      usuario.id = siguienteIdUsuario(usuarios);
      huboCambios = true;
    }

    if (usuario.mejorPartida) {
      usuario.partidas.push({
        id: siguienteIdPartida(usuarios),
        fecha: usuario.mejorPartida.fecha,
        completada: true,
        pares: usuario.mejorPartida.pares,
        intentos: usuario.mejorPartida.intentos,
        segundos: usuario.mejorPartida.segundos,
      });
      // delete borra la propiedad del objeto (no solo la deja vacia).
      delete usuario.mejorPartida;
      huboCambios = true;
    }
  });

  if (huboCambios) guardarUsuarios(usuarios);
  return usuarios;
}

// --- Partidas ---
// Una partida ganada es MEJOR que otra si:
// - no habia otra (record === undefined), o
// - se jugo con mas pares (un tablero de 8 pares vale mas que uno de 4), o
// - mismos pares y menos intentos, o
// - mismos pares, mismos intentos y menos tiempo.
function esMejorPartida(nueva, record) {
  if (!record) return true;
  if (nueva.pares !== record.pares) return nueva.pares > record.pares;
  if (nueva.intentos !== record.intentos) return nueva.intentos < record.intentos;
  return nueva.segundos < record.segundos;
}

// La mejor partida GANADA del historial (o undefined si no gano ninguna).
// - filter: solo las completadas (una abandonada con 2 intentos no es
//   un record).
// - reduce: recorre la lista quedandose siempre con la mejor hasta ahora.
//   Arranca en undefined (el segundo argumento), y esMejorPartida(p,
//   undefined) da true, asi que la primera siempre entra.
function mejorPartida(partidas) {
  return partidas
    .filter((partida) => partida.completada)
    .reduce((mejor, partida) => (esMejorPartida(partida, mejor) ? partida : mejor), undefined);
}

// 83 -> "01:23". padStart(2, "0") agrega un 0 adelante si hace falta.
function formatearTiempo(totalSegundos) {
  const mm = String(Math.floor(totalSegundos / 60)).padStart(2, "0");
  const ss = String(totalSegundos % 60).padStart(2, "0");
  return mm + ":" + ss;
}
