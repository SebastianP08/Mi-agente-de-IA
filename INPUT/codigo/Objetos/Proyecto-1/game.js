// game.js
// Login + registro de game.html:
// 1) Valida Nombre, Alias, Email y Contraseña (cada regla es una regex).
// 2) Busca el email entre los usuarios guardados en localStorage.
//    - Si existe y la contraseña coincide: entra.
//    - Si existe y la contraseña NO coincide: muestra el error.
//    - Si no existe: pregunta con confirm() si quiere registrarse.

// --- Reglas de validacion ---
// Cada regla es un objeto { regex, mensaje }. regex.test(texto) devuelve
// true si el texto cumple el patron. En vez de una sola regex gigante,
// tenemos una por requisito: asi la checklist puede mostrar cual falta, y
// para validar alcanza con ver que NINGUNA falle (ver verificar mas abajo).
//
// Letras con tilde, ñ y ü: las listamos aparte para que cuenten como
// LETRAS y no como caracteres especiales ("Canción" no deberia pasar
// como si tuviera un simbolo).
const reglasPassword = [
  // "." es cualquier caracter y {7,} significa "7 o mas veces". ^ y $
  // marcan inicio y fin del texto, asi se mide la contraseña ENTERA.
  { regex: /^.{7,}$/, mensaje: "Al menos 7 caracteres" },
  // Un caracter entre la A y la Z mayusculas (+ Ñ y mayusculas con tilde).
  { regex: /[A-ZÁÉÍÓÚÑÜ]/, mensaje: "Al menos una mayúscula" },
  // [^...]: el ^ ADENTRO de los corchetes significa "cualquier caracter
  // que NO este en esta lista". La lista es letras, numeros y espacios
  // (\s), asi que lo que queda son los simbolos: ! @ # . - _ etc.
  { regex: /[^A-Za-z0-9ÁÉÍÓÚáéíóúÑñÜü\s]/, mensaje: "Al menos un carácter especial (! @ # . - _)" },
];

const reglasEmail = [
  // \S es "cualquier caracter que NO sea espacio" (la version en
  // mayuscula de \s). ^\S+$ = de principio a fin, puros no-espacios.
  { regex: /^\S+$/, mensaje: "Sin espacios" },
  // [^@]+ = uno o mas caracteres que no sean @. Con eso a cada lado,
  // exige texto antes y despues de UNA sola @ ("ana@@x" no pasa).
  { regex: /^[^@]+@[^@]+$/, mensaje: "Una @ con texto antes y después" },
  // Despues de la @: algo, un punto (\. porque "." solo significa
  // "cualquier caracter") y al final 2 o mas letras (com, co, net...).
  { regex: /@[^@\s]+\.[A-Za-z]{2,}$/, mensaje: "Un dominio con punto (ej. gmail.com)" },
];

// Devuelve la lista de mensajes de las reglas que NO se cumplen, con la
// misma cadena filter + map de filter-map.js:
// - filter se queda solo con las reglas cuyo regex.test da false.
// - map convierte cada una de esas reglas en su texto.
// Si devuelve un array vacio ([]), el valor cumple todo.
function verificar(reglas, valor) {
  return reglas
    .filter(function (regla) {
      return !regla.regex.test(valor);
    })
    .map(function (regla) {
      return regla.mensaje;
    });
}

// --- Elementos del HTML ---
const formLogin = document.getElementById("formLogin");
const campoNombre = document.getElementById("campoNombre");
const campoAlias = document.getElementById("campoAlias");
const campoEmail = document.getElementById("campoEmail");
const campoPassword = document.getElementById("campoPassword");
const requisitosEmail = document.getElementById("requisitosEmail");
const requisitosPassword = document.getElementById("requisitosPassword");
const mensajeError = document.getElementById("mensajeError");
const btnContinuar = document.getElementById("btnContinuar");
const juego = document.getElementById("juego");
const saludoJuego = document.getElementById("saludoJuego");
const detalleJuego = document.getElementById("detalleJuego");

// --- Checklist en vivo ---
// Arma un <li> por regla dentro de la <ul> que recibe. Si el texto
// cumple la regla le pone la clase "cumple" (verde en game.css); si no,
// queda en naranja. Se llama en cada tecla (evento "input").
function pintarChecklist(lista, reglas, valor) {
  lista.innerHTML = "";

  reglas.forEach(function (regla) {
    const cumple = regla.regex.test(valor);
    const item = document.createElement("li");
    item.className = cumple ? "requisito cumple" : "requisito";
    item.textContent = (cumple ? "✔ " : "✘ ") + regla.mensaje;
    lista.appendChild(item);
  });
}

// El boton se ve "apagado" (clase "incompleto") mientras email o
// contraseña no cumplan. Sigue clickeable a proposito: al hacer click
// aparece el mensaje que explica que falta.
function actualizarBoton() {
  const emailOk = verificar(reglasEmail, campoEmail.value.trim()).length === 0;
  const passwordOk = verificar(reglasPassword, campoPassword.value).length === 0;
  btnContinuar.classList.toggle("incompleto", !(emailOk && passwordOk));
}

campoEmail.addEventListener("input", function () {
  pintarChecklist(requisitosEmail, reglasEmail, campoEmail.value.trim());
  actualizarBoton();
});

campoPassword.addEventListener("input", function () {
  pintarChecklist(requisitosPassword, reglasPassword, campoPassword.value);
  actualizarBoton();
});

// Estado inicial: todo en ✘ y el boton apagado.
pintarChecklist(requisitosEmail, reglasEmail, "");
pintarChecklist(requisitosPassword, reglasPassword, "");
actualizarBoton();

// --- Usuarios en localStorage ---
// leerUsuarios, guardarUsuarios y siguienteIdUsuario viven en
// usuarios-game.js (cargado antes que este archivo), porque gestion.html
// tambien los usa.

// Convierte un texto a su hash SHA-256 en hexadecimal (copiada de
// login.js). Guardamos el HASH y no la contraseña: si alguien abre
// localStorage ve "9f86d0..." y no "Hola!23". Al hacer login se calcula
// el hash de lo que se escribio y se comparan los dos hashes.
// crypto.subtle.digest devuelve una Promise, por eso async/await.
const calcularHash = async (texto) => {
  const bytes = new TextEncoder().encode(texto);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hashBuffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

// --- Mensajes de error ---
function mostrarError(texto) {
  mensajeError.textContent = texto;
  mensajeError.hidden = false;
}

// aria-invalid="true" marca el campo en rojo (ver game.css) y le avisa al
// lector de pantalla que ese campo tiene un error.
function marcarCampo(campo, tieneError) {
  campo.setAttribute("aria-invalid", tieneError);
}

// --- Entrar al juego ---
// Arma el saludo letra por letra, cada una en su <span> con --i, para la
// animacion de ola de game.css. Usamos textContent (no innerHTML) porque
// el alias lo escribe el usuario: si escribiera "<img onerror=...>" con
// innerHTML se ejecutaria como HTML; con textContent es solo texto.
function entrarAlJuego(usuario, esNuevo) {
  saludoJuego.innerHTML = "";

  const texto = "¡A jugar, " + usuario.alias + "!";
  // [...texto] separa el string en letras (incluso emojis, que con
  // split("") se partirian en dos).
  [...texto].forEach(function (letra, i) {
    const span = document.createElement("span");
    span.textContent = letra === " " ? " " : letra; // espacio que no colapsa
    span.style.setProperty("--i", i);
    saludoJuego.appendChild(span);
  });

  detalleJuego.textContent = esNuevo
    ? "Cuenta creada para " + usuario.nombre + " (" + usuario.email + ")."
    : "Qué bueno verte de nuevo, " + usuario.nombre + ".";

  mensajeError.hidden = true;
  formLogin.hidden = true;
  juego.hidden = false;

  // Arranca el juego de memoria (memoria.js) recien ahora, con el usuario
  // que entro: asi el tablero y el puntaje son de ESTA persona. memoria.js
  // carga despues que este archivo, pero para cuando alguien hace login
  // ya cargaron todos los scripts, asi que la funcion ya existe.
  iniciarMemoria(usuario);
}

// --- Envio del formulario ---
// async porque adentro esperamos (await) el hash de la contraseña.
formLogin.addEventListener("submit", async function (e) {
  // Sin esto, el navegador recarga la pagina al enviar el form (su
  // comportamiento por defecto) y se pierde todo.
  e.preventDefault();

  // trim() quita espacios al principio y al final: asi "   " cuenta como
  // vacio. El email ademas va en minusculas: "Ana@Gmail.com" y
  // "ana@gmail.com" son la misma cuenta.
  const nombre = campoNombre.value.trim();
  const alias = campoAlias.value.trim();
  const email = campoEmail.value.trim().toLowerCase();
  const password = campoPassword.value;

  const fallasEmail = verificar(reglasEmail, email);
  const fallasPassword = verificar(reglasPassword, password);

  marcarCampo(campoNombre, nombre === "");
  marcarCampo(campoAlias, alias === "");
  marcarCampo(campoEmail, fallasEmail.length > 0);
  marcarCampo(campoPassword, fallasPassword.length > 0);

  // Juntamos TODOS los errores en vez de cortar en el primero, para que
  // se puedan corregir de una sola vez.
  const errores = [];
  if (nombre === "") errores.push("Escribe tu nombre.");
  if (alias === "") errores.push("Escribe tu alias.");
  if (fallasEmail.length > 0) errores.push("El email no cumple: " + fallasEmail.join(", ") + ".");
  if (fallasPassword.length > 0) errores.push("La contraseña no cumple: " + fallasPassword.join(", ") + ".");

  if (errores.length > 0) {
    mostrarError(errores.join(" "));
    return; // "no se puede continuar": cortamos aca
  }

  const usuarios = leerUsuarios();
  const passwordHash = await calcularHash(password);

  // find devuelve el PRIMER usuario con ese email, o undefined si no hay.
  const usuarioExistente = usuarios.find(function (usuario) {
    return usuario.email === email;
  });

  // Caso 1: el email ya esta registrado -> comparamos los hashes.
  if (usuarioExistente) {
    if (usuarioExistente.passwordHash === passwordHash) {
      entrarAlJuego(usuarioExistente, false);
    } else {
      marcarCampo(campoPassword, true);
      mostrarError("La contraseña no coincide con la registrada para " + email + ".");
    }
    return;
  }

  // Caso 2: el email no existe -> preguntamos si quiere registrarse.
  // confirm() pausa la pagina hasta que se elija: devuelve true con
  // "Aceptar" y false con "Cancelar".
  const quiereRegistrarse = confirm(
    "No encontramos una cuenta con " + email + ".\n¿Quieres registrarte con estos datos?"
  );

  if (!quiereRegistrarse) {
    mostrarError("No se creó la cuenta. Revisa el email o regístrate para continuar.");
    return;
  }

  // ⚠ SOLO PARA ESTE EJERCICIO: guardamos tambien la contraseña en texto
  // plano para poder verla en la pestaña "Usuarios" de gestion.html. En
  // un proyecto real NUNCA se hace: cualquiera que abra DevTools la lee.
  // El login igual sigue comparando passwordHash, no esta.
  // id: autogenerado (el mas alto + 1, ver usuarios-game.js).
  // partidas: arranca vacio; memoria.js le agrega una por cada partida.
  const nuevoUsuario = {
    id: siguienteIdUsuario(usuarios),
    nombre: nombre,
    alias: alias,
    email: email,
    password: password,
    passwordHash: passwordHash,
    partidas: [],
  };
  usuarios.push(nuevoUsuario);
  guardarUsuarios(usuarios);
  entrarAlJuego(nuevoUsuario, true);
});
