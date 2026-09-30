# Bruno Simon — https://bruno-simon.com/

*Analizado el 2026-09-30 en desktop 1440×900, con revisión móvil a 375px.*

## Contenido
Portafolio del creative developer Bruno Simon, hecho como un mundo 3D en el que se maneja un carro. El contenido está repartido en 13 zonas del mapa: 8 proyectos en "projects" y 13 experimentos en "lab". Además tiene minijuegos (circuito, bolos), 38 logros y mensajes de otros visitantes ("whispers").

## Enfoque
El portafolio es en sí mismo la demostración de lo que sabe hacer: explorar reemplaza a leer. El código es abierto (repo `folio-2025`, licencia MIT).

## Público objetivo
Estudios y clientes que buscan experiencias web 3D, la comunidad de Three.js y estudiantes de su curso Three.js Journey.

## Estructura
- **Una sola página:** es un `<canvas>` a pantalla completa, sin scroll ni páginas internas.
- **Zonas del mundo:** landing, projects, lab, career, social, circuit, bowling, cookie, altar, toilet, timeMachine, achievements y behindTheScene.
- **Botones fijos:** menú y mapa.
- **Modales:** mapa, Discord y resultado del circuito.

## UX
- Se controla con teclado, mouse, táctil o gamepad. El menú explica los controles de cada uno.
- Los logros y las recompensas motivan a recorrer todo el mapa.
- Tiene opciones de audio, calidad y respawn.
- Limitaciones:
  - Para llegar a la información hay que explorar.
  - Los botones de menú y mapa no tienen `aria-label`.
  - La tabla de puntajes depende de un servidor que estaba offline.

## UI
- Escena 3D estilizada con iluminación de color y suelo en cuadrícula.
- Tipografías: Amatic SC (manuscrita) en los títulos y Nunito en los textos.

## Responsive / móvil
- Usa el mismo canvas a pantalla completa en vertical.
- Los controles pasan a gestos: un dedo mueve el carro, dos dedos mueven la cámara y un toque hace saltar.

**Tecnología:** Three.js r183 con WebGPURenderer y TSL, física con Rapier, GSAP empaquetado, audio con Howler.js y JavaScript vanilla, sin framework.
