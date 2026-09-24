// login.js
// Solo VERIFICA si un usuario y una contraseña son correctos: no toca el
// DOM ni decide que se muestra. Eso lo hace gestion.js, que es donde vive
// sesionIniciada (privada dentro de su IIFE). credenciales.js cargo antes,
// asi que "usuario" y "passwordHash" existen aca.

// const (no function): una funcion declarada con "function" se puede
// reemplazar desde la consola, por ejemplo por una que siempre devuelva
// true. Con const eso da "TypeError: Assignment to constant variable".

// Convierte un texto a su hash SHA-256 en hexadecimal (mismo formato que
// passwordHash en credenciales.js). crypto.subtle.digest es asincrono
// (devuelve una Promise), por eso la funcion es async y se usa await.
const calcularHash = async (texto) => {
  const bytes = new TextEncoder().encode(texto);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hashBuffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

// Devuelve una Promise que resuelve en true solo si coinciden LOS DOS.
// Si falla cualquiera no se dice cual, para no darle pistas a quien este
// probando combinaciones.
const validarCredenciales = async (usuarioIngresado, passwordIngresado) => {
  const hashIngresado = await calcularHash(passwordIngresado);
  return usuarioIngresado === usuario && hashIngresado === passwordHash;
};
