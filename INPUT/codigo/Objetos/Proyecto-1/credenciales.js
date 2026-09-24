// Credenciales del login de gestion.html.
// const (no let): asi no se pueden reasignar desde la consola, por ejemplo
// poniendo el hash de otra contraseña para entrar con ella.
const usuario = "admin";

// Hash SHA-256 de la contraseña, no la contraseña en texto plano.
// gestion.js calcula el hash de lo que se escribe en el login y compara
// hash contra hash. Para generar el hash de una contraseña nueva, en la
// consola del navegador:
//   crypto.subtle.digest("SHA-256", new TextEncoder().encode("nueva"))
//     .then((b) => console.log([...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("")));
const passwordHash = "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9";
