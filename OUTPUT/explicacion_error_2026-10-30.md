# Explicación de error — 2026-10-30

**Archivo:** `INPUT/supabase-pruebas/js/cliente.js` (línea 19, `db.auth.signUp()`)

```
Failed to load resource: the server responded with a status of 400 ()
Error al registrar: AuthApiError: Email address "sebas@gmail.com" is invalid
```

## Tipo de error: lógica
Es un error de lógica: el código está bien escrito y corre, pero parte de una suposición que no se cumple. En este caso la suposición era que Supabase acepta cualquier correo que tenga buen formato.

## Qué pasó
| Parte | Significado |
|---|---|
| `400` | Supabase recibió la petición y la rechazó porque los datos no le sirven |
| `AuthApiError` | El que rechaza es el servicio de Auth, no la tabla ni el JS |
| `is invalid` | El correo no pasó la validación del servidor |

## Por qué sucedió
- El proyecto tenía **"Confirm email" activado**. Con esa opción, Supabase tiene que **enviar un correo de confirmación** a la dirección que se registra.
- Antes de enviarlo, Supabase revisa que la dirección pueda recibir correos de verdad, no solo el formato `algo@algo.algo`. Un correo inventado como `sebas@gmail.com` no pasa esa revisión y el registro se rechaza.
- La validación del navegador (`type="email"`) sí lo dejó pasar, porque solo revisa el formato.

**Concepto:** hay dos niveles de validación. El **cliente** (HTML) revisa solo la forma. El **servidor** (Supabase) revisa si el dato sirve de verdad. El servidor siempre tiene la última palabra.

## Solución
Se desactivó **"Confirm email"** en Supabase (Authentication → Sign In / Providers → Email), porque son pruebas. Sin correo que enviar, `signUp()` acepta correos inventados y además devuelve la sesión al tiro (`data.session` ya no llega en `null`).

> ⚠️ Antes de pasar el registro a Jaziz con clientes reales, hay que volver a activarlo.

## Fuentes
- [supabase/auth issue #2252](https://github.com/supabase/auth/issues/2252): mismo error (`email_address_invalid`) con un correo inventado.
- [guardlayer.io – Supabase email address invalid](https://www.guardlayer.io/blog/supabase-email-address-invalid-password-reset): explica que el validador revisa el correo antes de enviar el mensaje. Es una fuente no oficial.
