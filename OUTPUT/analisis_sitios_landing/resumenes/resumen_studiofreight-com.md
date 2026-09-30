# Studio Freight — https://studiofreight.com/

*Analizado el 2026-09-30 en desktop 1440×900, con revisión móvil a 375px.*

## Contenido
Portafolio de una agencia creativa que hace marcas, experiencias digitales y campañas. El home muestra solo el lema "Moving Missions Forward" y una grilla con 25 proyectos (Perplexity Comet, MetaMask, Brex, La Marzocco, entre otros). Las páginas internas son Work, Info, News, Aeon y Contact.

## Enfoque
El trabajo es el protagonista: el home lleva directo a los casos de estudio.

## Público objetivo
Empresas de tecnología, cripto y consumo que buscan agencia, además de talento creativo y prensa (tiene correos separados para jobs, press y hello).

## Estructura
- **Header fijo:** logo, indicador de la página actual y enlaces Work, Info, News, Aeon y Contact.
- **Main:** título central y una grilla de 7×7 con las miniaturas de los proyectos.
- **Footer fijo:** IG / LI, el nombre del estudio y ©2026 / Terms.
- **Home sin scroll:** ocupa una sola pantalla. Las páginas internas sí tienen scroll (Info mide unos 8300px).

## UX
- Al cargar, las etiquetas del menú y las miniaturas aparecen de forma escalonada.
- La navegación es SPA: al cambiar de página hay un fundido corto (~350ms) con un overlay y sin recarga.
- Cada miniatura tiene `aria-label` con el nombre del proyecto.
- Falta: el home no explica los servicios, eso solo está en Info.

## UI
- Fondo claro casi blanco, texto negro y el color lo ponen las miniaturas.
- Tipografías: JJannon (serif) en el título y Publico Text Mono en la interfaz.

## Responsive / móvil
- Usa el mismo DOM con CSS responsive: la grilla pasa a 3 columnas con 20 miniaturas.
- El menú cambia a un texto "Menu" que abre un overlay a pantalla completa con enlaces grandes escalonados. Ese control no es un `<button>`.

**Tecnología:** Nuxt 3 (Vue 3.5.30), Storyblok como CMS headless, GSAP 3.14.2 con ScrollTrigger, Lenis y Tempus.
