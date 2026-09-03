# Bitácora de reflexiones — Agente de Talleres

Una entrada breve por sesión de clase: qué se aprendió o qué costó más, escrita al cierre de cada
sesión. **No es la bitácora del curso** (esa la lleva el profesor, en `bitacora_sesiones_curso.csv`,
fuera de esta carpeta) — esta es la reflexión personal del estudiante sobre su propio proceso.

## 2026-08-20

Hoy entendí la diferencia entre declarar una variable con `let` y usarla sin declararla — el
`ReferenceError` dejó de sentirse aleatorio en cuanto vi que siempre es la misma causa: un nombre
que nunca definí.

## 2026-08-22

Me costó organizar las referencias visuales por tema en vez de por sitio de origen. Al principio
quería agruparlas por dónde las encontré, pero agruparlas por lo que inspiran (color, tipografía,
layout) tiene más sentido para el proyecto.

## 2026-09-03

Lo que más me costó hoy fue la diferencia entre un error silencioso y uno que lanza `TypeError`.
Con `getElementsByClassName` había asumido que, si el código no truena en consola, es que está
funcionando — pero asignar `.textContent` a una lista (HTMLCollection) en vez de a un elemento
no da ningún error y tampoco hace nada. Me quedó la pregunta fija de revisar siempre si un
selector me devuelve un elemento o una lista antes de usarlo.
