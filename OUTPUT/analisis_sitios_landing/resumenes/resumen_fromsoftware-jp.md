# FromSoftware, Inc. — https://www.fromsoftware.jp/ww/

*Analizado el 2026-09-30 en desktop 1440×900, con revisión móvil a 375px.*

## Contenido
Sitio corporativo del estudio japonés de videojuegos. Muestra su catálogo actual (Elden Ring, Nightreign, The Duskbloods, Armored Core VI, Sekiro y Bloodborne), la última nota de prensa y accesos a Company, Products, Press Release, Recruit y Support.

## Enfoque
El home es una vitrina de productos. Lo corporativo va en las páginas internas.

## Público objetivo
Fans de sus franquicias, prensa especializada y candidatos a empleo (careers.fromsoftware.jp).

## Estructura
- **Home de una sola pantalla sin scroll.** Header fijo con logo SVG y 5 enlaces.
- **Hero:** 6 paneles diagonales, uno por juego.
- **Noticias:** barra con la última nota de prensa.
- **Ficha de producto:** overlay con plataformas, datos, tráiler de YouTube y enlace al sitio oficial.
- **Páginas internas:** menú lateral fijo. El cambio de página es una recarga completa, sin transición.

## UX
- El panel bajo el mouse se ve a color y los demás en grises. El clic abre la ficha sin salir del home.
- **Puntos débiles:**
  - Los iconos de redes no tienen `aria-label`.
  - El copyright del home dice 2021 y el de las páginas internas, 2026.
  - El banner de cookies asume consentimiento si el usuario sigue navegando.

## UI
- Paleta oscura con imágenes a sangre y diagonales.
- Tipografías: Archivo en los títulos y una pila de sistema con Noto Sans JP en los textos.
- Efectos por juego: niebla con CSS, particles.js y hojas en Three.js.

## Responsive / móvil
- Usa un DOM separado (`#spWrapper`), no solo CSS responsive.
- La navegación pasa a un botón hamburguesa con menú a pantalla completa y submenús en acordeón.
- El hero es un carrusel Swiper de 5 banners con botón "MORE DETAIL". El home tiene scroll (~1650px).

**Tecnología:** jQuery 4.0.0, Swiper, Three.js, particles.js, YouTube IFrame API y Google Tag Manager. No se detectó CMS.
