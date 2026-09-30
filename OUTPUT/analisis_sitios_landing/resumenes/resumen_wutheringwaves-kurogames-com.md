# Wuthering Waves — https://wutheringwaves.kurogames.com/en/main#main

*Analizado el 2026-09-30 en desktop 1440×900, con revisión móvil a 375px.*

## Contenido
Sitio oficial del RPG de acción de mundo abierto de Kuro Games, en inglés. Presenta:
- el tráiler del juego;
- descargas para Windows, Google Play, Google Play Games, App Store, Epic Games Store y PS5;
- las notas del parche 3.7;
- noticias y personajes ("Resonators");
- el lore del mundo (Solaris-3) y sus regiones.

## Enfoque
Busca que el visitante descargue el juego y se sumerja en su universo.

## Público objetivo
Jugadores de RPG y gacha en PC, móvil y consola, tanto nuevos como actuales.

## Estructura
- **Navbar fija:** logo, Home, News, Resonators, Lore, Regions, TOP-UP Center, idioma (9 opciones) y cuenta.
- **Scroll por secciones a pantalla completa:** cada paso de la rueda cambia de sección y actualiza el hash (#main → #news → #resonators → #lore → #regions → #end).
- **Última pantalla:** frase con efecto de texto que se "descifra", redes y footer legal.

## UX
- En el hero la descarga está a un clic, con código QR incluido.
- Las noticias se filtran por pestañas (Latest, Notice, News, Event).
- El detalle de noticias abre en `/main/news` sin recargar la página.
- Puntos débiles:
  - Ninguna sección usa `h1` ni `h2`.
  - El scroll por secciones no deja ver contenido parcial y depende de la rueda o del teclado.

## UI
- Paleta oscura con acentos dorados y arte de personajes.
- Tipografía propia (mc-gamefont) y paneles con marcos ornamentales.

## Responsive / móvil
- Redirige a otro sitio móvil (`/m/en/`).
- Tiene menú hamburguesa y un botón único "DOWNLOAD NOW".
- Muestra las noticias directo bajo el hero.

**Tecnología:**
- Vue 3.3.11 con Vite, Vue Router y Pinia.
- GSAP 3.9.1 con CustomEase y ScrollTrigger.
- Lottie, pero solo en un botón de la versión en chino.
- CMS propio: `operation-cms.kurogame.com`.
