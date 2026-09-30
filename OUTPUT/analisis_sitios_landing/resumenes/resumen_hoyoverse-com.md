# HoYoverse — https://www.hoyoverse.com/es-es/

*Analizado el 2026-09-30 en desktop 1440×900, con revisión móvil a 375px.*

## Contenido
Sitio corporativo de HoYoverse (su copyright dice COGNOSPHERE). Tiene:
- banner con las últimas versiones de sus juegos;
- noticias;
- 6 productos: Genshin Impact, Honkai: Star Rail, Zenless Zone Zero, Honkai Impact 3rd, Tears of Themis y la comunidad HoYoLAB;
- accesos a Sobre nosotros y Empleo.

## Enfoque
Es un escaparate de productos y actualizaciones que dirige a los sitios de cada juego.

## Público objetivo
Jugadores de sus títulos y personas que buscan empleo. Tiene además un correo para acuerdos comerciales.

## Estructura
- **Navbar fija:** logo y 5 enlaces.
- **Hero:** carrusel a pantalla completa de 4 slides con miniaturas para navegar.
- **Noticias:** grilla de tarjetas etiquetadas por juego.
- **Franja de marca:** anillo del logo sobre fondo estrellado.
- **Productos:** tarjetas en 2 columnas con botón "Más".
- **Bloque final:** Sobre nosotros y Oportunidades de empleo.
- **Footer:** enlaces legales, correo comercial y selector de idioma.

## UX
- La jerarquía es clara: primero las novedades, luego las noticias y después los productos.
- La navegación interna es SPA (Nuxt), sin recarga.
- Puntos débiles:
  - Hay textos sin traducir: dos lemas de producto y un slide siguen en inglés.
  - El footer no enlaza a redes sociales.

## UI
- El hero es oscuro con arte de personajes a sangre.
- El resto del sitio es claro, con tarjetas de esquinas redondeadas.
- Tipografía de sistema (Microsoft YaHei / Arial): no se carga ninguna fuente web.

## Responsive / móvil
- Usa el mismo DOM con CSS responsive.
- El menú pasa a hamburguesa.
- El hero se vuelve vertical, con las miniaturas debajo, y las tarjetas se apilan (unos 5400px de alto).

**Tecnología:** Nuxt 2 con Vue 2.6.14 (generación estática) e imágenes servidas desde `fastcdn.hoyoverse.com/content-v2`. No se identificó el CMS ni una librería de animación.
