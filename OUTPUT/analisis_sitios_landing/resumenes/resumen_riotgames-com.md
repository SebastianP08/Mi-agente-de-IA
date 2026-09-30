# Riot Games — https://www.riotgames.com/es

*Analizado el 2026-09-30 en desktop 1440×900, con revisión móvil a 375px.*

## Contenido
Sitio corporativo de Riot Games en español. Incluye:
- novedades (VALORANT Champions Shanghai y HEARTSTEEL);
- noticias;
- catálogo de 7 juegos (League of Legends, VALORANT, TFT, Wild Rift, Runeterra, 2XKO y Riftbound);
- esports y entretenimiento (Arcane, Riot Games Music);
- empleo (167 puestos en 24 oficinas).

## Enfoque
Es un hub de marca: presenta la empresa y lleva a los sitios de cada juego y de esports.

## Público objetivo
Jugadores, fans de esports, prensa y candidatos a empleo.

## Estructura
- **Header fijo (Riotbar):** logo, selector de apps, 3 enlaces, idioma, búsqueda e Iniciar sesión.
- **Main con 5 bloques:** hero en carrusel (2 slides con video), Actualidad, Nuestros juegos, Esports y entretenimiento, y ¡Buscamos gente!
- **Footer:** enlaces legales, 6 redes y "Ir al inicio".
- **Cambio de página:** recarga completa, sin transición.

## UX
- Cada bloque tiene una llamada a la acción clara ("Ver ahora", "Ver todo", "Descubrir oportunidades").
- Las tarjetas de juegos llevan al sitio oficial de cada uno.
- Puntos débiles:
  - Las etiquetas de redes mezclan español e inglés.
  - El enlace de LinkedIn dice "Compartir".
  - Las imágenes del catálogo tienen `alt` vacío.

## UI
- Fondo oscuro con key art a sangre y botones de alto contraste.
- Tipografías: Riot Sans en los títulos de sección e Inter en el cuerpo.

## Responsive / móvil
- Usa el mismo DOM con CSS responsive: el menú pasa a hamburguesa y los bloques se apilan.
- El banner de cookies (Osano) cubre más de la mitad de la pantalla.

**Tecnología:** React 16.12, Lit 2.8 (Riotbar), Osano y el servicio de imágenes `/darkroom/`. No se identificó el CMS ni una librería de animación: los movimientos son CSS y video.
