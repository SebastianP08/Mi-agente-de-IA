# Explicación de error — 2026-08-27

**Tipo de error**: lógica (bucle que nunca se ejecuta)

**Código con el problema**:
```js
for(let i = 0; i > 10; i++) {
  console.log(i + 1);
}
```

**Causa**: la condición de continuación (`i > 10`) se evalúa antes de cada iteración, incluida la
primera. Con `i` arrancando en `0`, `0 > 10` es `false` de entrada, así que el bucle nunca entra —
no hay excepción, no hay mensaje de error, simplemente no pasa nada.

**Corrección**:
```js
for (let i = 0; i < 10; i++) {
  console.log(i + 1);
}
```

**Concepto detrás**: la condición del medio en un `for` es "¿debo seguir?", evaluada antes de cada
vuelta. Si `i` aumenta con `i++`, la condición tiene que comparar hacia arriba (`i < límite`), no
hacia abajo (`i > límite`).
