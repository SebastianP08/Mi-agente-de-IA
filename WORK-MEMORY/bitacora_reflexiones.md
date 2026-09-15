# Bitácora de reflexiones — Agente de Talleres

Una entrada breve por sesión de clase: qué se aprendió o qué costó más, escrita al cierre de cada
sesión. **No es la bitácora del curso** (esa la lleva el profesor, en `bitacora_sesiones_curso.csv`,
fuera de esta carpeta) — esta es la reflexión personal del estudiante sobre su propio proceso.

## 2026-08-21

Hoy comenzamos a ver como crear un agente de IA dandole una historia y personalidad, tambien se intento
que el agente comitiera un fallo y ver como reaccionaba. Lo que mas me costo de esta actividad fue saber 
que historia le daba a mi agente, ya que no se me ocurrian tantas ideas que fueran bizarras y quedaran bien
al menos para mi.

## 2026-08-27

En esta sesión se continuo el tema de los agentes, esta vez con uno ya más definido tanto en papel como en caracteristicas.
Con este agente se desarrollarón pruebas e incluso se le dio un código erroneo a proposito para saber como respondia y de que
manera daba la solución y nos guiaba hacia ella.
Lo que mas me costo de la clase fue cuando el profesor nos pidio hacer un bucle for, ya que aunque se como funciona y para que sirve
en un inicio no supe como era la estructura de este.

## 2026-08-28

En esta sesión utilizamos una página para ayudarnos en temas de css de manera más facil de comprender sin la necesidad de hacer dódigo de 0.
En esta página que era para armar bien contenidos que usan el grid de css, la usamos para crear una card similar a las de pokemon con cualquier
contenido que quisieramos y con ayuda del agente la refinamos de mejor manera tanto en contenido como en diseño.
En este caso no hubo nada que se me complicara o dificultara, pude desarrollar y entender todo de buena forma.

## 2026-09-03

Lo que más me costó hoy fue la diferencia entre un error silencioso y uno que lanza `TypeError`.
Con `getElementsByClassName` había asumido que, si el código no truena en consola, es que está
funcionando — pero asignar `.textContent` a una lista (HTMLCollection) en vez de a un elemento
no da ningún error y tampoco hace nada. Me quedó la pregunta fija de revisar siempre si un
selector me devuelve un elemento o una lista antes de usarlo.

## 2026-09-10

En la clase de hoy no presenté dificultades y aprendí algo que no sabía antes, y es cambiar el
contenido en base al tamaño con JS, ya que solo lo había hecho anteriormente con HTML usando
`display: none` y `@media`. Me pareció súper interesante y útil saber hacer esto de una manera
distinta y más limpia.

## 2026-09-11

El día de hoy vimos como es el funcionamiento de objetos con javascript aplicando primero la
creación de un solo objeto y una plantilla para una carta, despues con la ayuda de la IA generamos
12 objetos en total cada uno con el estilo de la plantilla que se hizo.

## 2026-09-14

Hoy seguimos con las tarjetas de portafolio, agregando los links de cada proyecto y un hover con
animación de saltito en el botón. Aunque ya lo sabía, hoy volví a confirmar que con pocas cositas
de CSS y algo de JS se le puede dar muchísimo dinamismo a una página. También me quedó claro que
trabajar con una IA siempre requiere paciencia e ir paso a paso en cada cosa para que el resultado
quede mejor desarrollado.

**Exploración de estilos de las cards (qué se probó, qué se descartó y qué quedó):**

- *Reflejo de la tarjeta al mover el mouse*: primero probamos un círculo de luz que sigue al
  cursor (radial-gradient) — se descartó porque no se sentía como un reflejo real, sino como una
  linterna. Se reemplazó por una franja diagonal que se desliza por toda la tarjeta (como el
  reflejo del sol al mover un objeto), inspirada en el efecto "holo" de una carta de referencia.
  De paso apareció un bug: el eje vertical salía invertido (el brillo aparecía arriba cuando el
  mouse estaba abajo) al final se dejo ese error ya que al verlo más detenidamente no quedaba realmente mal, pero en modo claro el efecto no se notaba sobre fondo blanco, por lo que se resolvio
  cambiando el `mix-blend-mode` (`multiply` + gris en claro, `screen` + blanco en oscuro).

- *Inclinación 3D de la tarjeta al mover el mouse*: se agregó un tilt leve, pero poner la
  propiedad `perspective` directo en el `body` rompía el fondo decorativo y el modal (dejaban de
  cubrir toda la pantalla). Se dejó el `perspective` en un `div` propio que envuelve solo las
  tarjetas.

- *Modo oscuro*: probamos primero un gris (#1a1a1a), después negro puro (#000000, se sentía muy
  fuerte/plano), y terminamos en un gris intermedio distinto al original (#16151b) — ninguno de
  los dos extremos convenció, el punto medio sí.

- *Título*: se probó un efecto de neón con `text-shadow` pulsante y letras en contorno hueco
  (`-webkit-text-stroke` + texto transparente) — se descartó porque la letra no se veia nada y era muy brillante.
  Se reemplazó por una animación de ola: cada letra en su propio `<span>`, subiendo y bajando con
  un pequeño retraso entre una y la siguiente. La fuente también cambió más de una vez: se probó
  Anton, y al final quedó Permanent Marker para el título y Pangolin para los nombres de proyecto
  (subtítulos), por ser más pareja/regular de leer.

- *Fondo decorativo (cubos y esferas)*: al principio las imágenes eran chicas, de opacidad baja
  (0.35) y quedaban muy amontonadas entre sí. Se fue ajustando: más cantidad, tamaños más grandes
  y variados, 4 imágenes fijas en las esquinas con tamaños bien distintos, un chequeo de distancia
  mínima entre imágenes para que no se pisen 2 o 3 en el mismo lugar, y la opacidad subió a 1
  (invisible en modo oscuro) y bajó de nuevo a un punto medio (0.6).

- *Íconos de herramienta*: se pensó primero en usar emojis (rápido, sin depender de archivos
  externos) pero se descartó a favor de íconos SVG reales de cada herramienta (VS Code, Blender,
  Figma, Word), que se ven más profesionales.

- *Layout general*: la tarjeta pasó de un tamaño fijo de 350px a 520px, y al mostrar las 8 juntas
  se armó una grilla de 2 columnas (con un límite de ancho para que no quedaran gigantes en
  pantallas anchas).
