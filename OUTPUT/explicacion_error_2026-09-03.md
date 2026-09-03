# Explicación de error — 2026-09-03

**Archivo:** `INPUT/codigo/css1/index.html`
**Tipo de error:** tipo_de_dato

## Qué pasó

En el script, `btn2` se definió así:

```js
let btn2 = document.getElementsByClassName("grid-item");
btn2.addEventListener("click", function () { ... });
```

`getElementsByClassName` no devuelve un elemento — devuelve un **HTMLCollection**, que es una
lista de todos los elementos que tienen esa clase (en este caso, las 9 celdas del grid). Una
lista no tiene los mismos métodos que un elemento individual: no existe `HTMLCollection.addEventListener`
ni `HTMLCollection.textContent`. Por eso el clic en `boton2` no hace nada — el navegador lanza
un `TypeError: btn2.addEventListener is not a function` en la consola, y el botón con
`id="boton2"` nunca fue seleccionado.

## El concepto

- `getElementById("algo")` → un único elemento (porque los `id` son únicos en la página).
- `getElementsByClassName("algo")` / `querySelectorAll(".algo")` → una lista de elementos, aunque
  solo haya uno con esa clase.

Antes de llamar un método sobre el resultado de un selector, vale la pena preguntarse: ¿esto me
da un elemento, o una lista de elementos?

## Corrección sugerida

```js
let btn2 = document.getElementById("boton2");
btn2.addEventListener("click", function () {
  console.log("Segundo botón clickeado");
  txt.textContent = "Estoy en clase de Lenguajes";
});
```
