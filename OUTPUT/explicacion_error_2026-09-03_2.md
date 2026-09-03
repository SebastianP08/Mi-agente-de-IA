# Explicación de error — 2026-09-03 (segunda vez, mismo ejercicio)

**Archivo:** `INPUT/codigo/css1/index.html`
**Tipo de error:** tipo_de_dato

## Qué pasó

`btn2` ahora sí apunta al botón correcto (`getElementById("boton2")`), pero el cambio de texto
sigue sin verse porque el objeto que se intenta modificar tampoco es un elemento del DOM:

```js
let grid = document.getElementsByClassName("grid-item"); // lista de 9 elementos
grid.textContent = "Hola mundo";                          // no hace nada
...
btn2.addEventListener("click", function () {
  grid.textContent = "Estoy en clase de Lenguajes";        // tampoco hace nada
});
```

`grid` es una lista (HTMLCollection) con las 9 celdas del grid, no una celda individual. A
diferencia del error anterior de hoy, aquí **no hay ningún error en la consola** — asignar
`.textContent` a un objeto cualquiera en JavaScript es válido, solo que en este caso el objeto
no es un elemento visible en la página, así que la asignación no tiene ningún efecto. Es un
error silencioso: el código "funciona" (no truena) pero no hace lo que se espera.

## El concepto

Es la misma distinción del error anterior — lista vs. elemento — pero muestra su otra cara:
- Llamar un **método** que no existe en el objeto (`.addEventListener` en una lista) → error
  visible en consola.
- Asignar una **propiedad** a un objeto que no es el que crees que es (`.textContent` en una
  lista) → ningún error, pero tampoco ningún efecto.

Antes de escribir `algo.propiedad = valor`, vale la pena confirmar qué es exactamente `algo`:
¿un elemento del DOM, o una lista de elementos?

## Corrección sugerida

Si el objetivo es cambiar solo la celda `#demo` (como en el primer botón), conviene reusar `txt`
en vez de crear `grid`:

```js
btn2.addEventListener("click", function () {
  txt.textContent = "Estoy en clase de Lenguajes";
});
```

Si el objetivo es cambiar las 9 celdas, hay que recorrer la lista:

```js
btn2.addEventListener("click", function () {
  for (let item of grid) {
    item.textContent = "Estoy en clase de Lenguajes";
  }
});
```
