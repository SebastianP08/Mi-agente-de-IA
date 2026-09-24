# Explicación de error — 2026-09-24

**Tipo de error**: lógica (bucle que se detiene a la mitad)

**Código con el problema**:
```js
for (let i = 1; i < proyectos.length; i++) {
  proyectos.pop();
}
```

**Causa**: la condición `i < proyectos.length` se evalúa antes de cada vuelta, pero `pop()` achica
el array en cada vuelta. `i` sube de a 1 y `proyectos.length` baja de a 1, así que se cruzan a la
mitad. Con 208 proyectos, el ciclo solo hizo 104 `pop()` y dejó 104 (comprobado corriendo el mismo
ciclo en Node).

| Vuelta | `i` | `proyectos.length` antes del `pop()` |
|---|---|---|
| 1 | 1 | 208 |
| 2 | 2 | 207 |
| ... | ... | ... |
| 104 | 104 | 105 |
| — | 105 | 104 → `105 < 104` es `false`, se detiene |

**Corrección** (quitar los 200 del final y dejar los 8 originales):
```js
while (proyectos.length > 8) {
  proyectos.pop();
}
localStorage.setItem(CLAVE_LOCALSTORAGE, JSON.stringify(proyectos));
```

**Concepto detrás**: no uses como límite del ciclo algo que el mismo ciclo está modificando. Si el
largo cambia en cada vuelta, la condición tiene que depender solo de ese largo (`while`), o hay que
guardar el total en una variable antes de empezar (`const total = proyectos.length;`).
