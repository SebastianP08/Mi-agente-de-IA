---
name: analizar-sitio-web
description: Analiza un sitio web de referencia (por URL o abierto en el browser panel) y produce siempre 3 entregables juntos — resumen .md, estructura semántica .xml y una fila para la matriz comparativa CSV. Use when the user asks to analyze a website, a landing page or a web reference, or says "usa tu skill de análisis de sitios".
---

Cuando se active esta skill con una URL (o con el sitio abierto en el browser panel):

## 1. Recolectar información (sin inventar)

1. Abre el sitio en el browser panel **en desktop (1440×900)**, salvo que el usuario pida otro formato. Lee el texto y la estructura con `get_page_text` / `read_page` y usa screenshots solo para UI y estilo visual.
2. Recorre el home completo (scroll hasta el footer) y cuenta las secciones de `<main>`.
3. Abre el menú (si es hamburguesa u overlay) y navega a al menos una página interna para ver la transición entre páginas.
4. Detecta la tecnología con evidencia real, usando `javascript_tool` o `read_network_requests`:
   - **CMS/builder:** `meta[name=generator]`, rutas `wp-content`, `cdn.prod.website-files.com` (Webflow), `static.wixstatic.com`, `framerusercontent.com`, `cdn.shopify.com`, `squarespace`.
   - **Librería de animación:** `window.gsap`, `ScrollTrigger`, `Lenis`, `locomotive-scroll`, `window.THREE`, `lottie`, `barba`, `swup`, `framer-motion`.
   - **Librería frontend:** `window.React` / `__NEXT_DATA__` (Next.js), `__NUXT__` (Nuxt), `window.Vue`, `data-astro-*`, `window.jQuery`, `___gatsby`.
   - **Tipografía principal:** `getComputedStyle` de `h1` y `body` y los archivos de fuente cargados.
5. **Revisión móvil:** cambia el viewport a 375px (preset `mobile`), recarga la página y anota qué cambia frente a desktop: patrón de navegación, hero, secciones que se ocultan o reordenan, y si el sitio usa un DOM separado o CSS responsive. Al terminar, vuelve el viewport a `desktop`.
6. Si un dato no se puede confirmar, escribe `no detectado`. Nunca lo adivines.

## 2. Producir los 3 entregables (siempre los tres, claramente marcados)

Nombre base del archivo: el dominio en kebab-case sin `www` (ej. `awwwards.com` → `awwwards-com`).

### Entregable 1 — Resumen (.md)
- Ruta: `OUTPUT/analisis_sitios_landing/resumenes/resumen_[dominio].md`
- **Menos de 300 palabras** (cuéntalas antes de guardar).
- Secciones: Contenido · Enfoque · Público objetivo · Estructura · UX · UI · Responsive / móvil (2–4 viñetas, dentro del límite de 300 palabras).
- Indica el viewport analizado al inicio (ej. *desktop 1440×900 + revisión móvil 375px*).
- **El XML y la fila de la matriz describen siempre la versión desktop.** Las diferencias en móvil van solo en el resumen.
- Describe decisiones de diseño con objetividad. No opines sobre la calidad artística.

### Entregable 2 — Estructura semántica (.xml)
- Ruta: `OUTPUT/analisis_sitios_landing/xml/estructura_[dominio].xml`
- Empieza con `<?xml version="1.0" encoding="UTF-8"?>`.
- Usa exactamente este esquema. Solo lleva etiquetas semánticas de HTML5 y las del esquema, sin inventar nombres nuevos:

```xml
<sitio nombre="..." url="...">
  <header>
    <logo>...</logo>
    <nav tipo="fija | hamburguesa | mega-menu | overlay-fullscreen">
      <enlace>...</enlace>
    </nav>
  </header>
  <main>
    <section tipo="hero">...</section>
    <section tipo="...">...</section>
  </main>
  <footer>
    <redes>...</redes>
    <contacto>...</contacto>
  </footer>
</sitio>
```

- `nav tipo` lleva uno solo de los 4 valores permitidos.
- Hay una `<section>` por cada sección real del home, en orden. `tipo` es un descriptor corto en kebab-case (ej. `proyectos`, `servicios`, `testimonios`).
- Escapa `&` como `&amp;` y `<` como `&lt;` dentro del texto. Valida que el XML esté bien formado antes de terminar.

### Entregable 3 — Fila de la matriz comparativa
- Archivo: `OUTPUT/analisis_sitios_landing/matriz_comparativa.csv`
- Exactamente 14 campos, en este orden, separados por ` ; `:

```
url ; tipo_de_sitio ; cms_o_builder ; libreria_animacion ; libreria_frontend ; patron_navegacion ; num_secciones_home ; transicion_entre_paginas ; tipografia_principal ; estilo_visual ; fortaleza_ux ; oportunidad_mejora ; nombre_archivo_md ; nombre_archivo_xml
```

- Si el archivo no existe, créalo con ese encabezado en la primera línea.
- **Agrega** la fila al final y nunca borres ni reescribas las anteriores. Si la URL ya está en la matriz, avisa y pregunta antes de duplicarla.
- `num_secciones_home` debe coincidir con el número de `<section>` del XML.
- `patron_navegacion` debe coincidir con el `nav tipo` del XML.
- `nombre_archivo_md` y `nombre_archivo_xml` llevan solo el nombre del archivo, sin la ruta.

## 3. Reglas anti-desbordamiento del CSV (corrección del profe: "que no exista desbordamiento de celdas")

Cada valor debe caber en su propia celda y no correr las columnas:
- **Nunca uses `;` dentro de un valor.** Si hay varios elementos, sepáralos con ` / ` (ej. `GSAP / Lenis`).
- Nada de comas, comillas (`"`) ni saltos de línea dentro de un valor, porque Excel puede tomarlos como separadores.
- Los textos son cortos: `estilo_visual`, `fortaleza_ux` y `oportunidad_mejora` tienen **máximo 8 palabras**. El detalle va en el resumen .md, no en la matriz.
- No dejes celdas vacías: usa `no detectado` o `no aplica`.
- Después de agregar la fila, **verifica** que todas las líneas del archivo tengan exactamente 14 campos al separar por `;`. Si alguna no cumple, corrígela antes de terminar.
- Guarda el archivo en UTF-8 para que las tildes se vean bien.

## 4. Respuesta final en el chat

Muestra los 3 entregables marcados así:
- **📄 Entregable 1 — Resumen** (ruta + número de palabras)
- **🧩 Entregable 2 — XML** (ruta + número de secciones)
- **📊 Entregable 3 — Fila de la matriz** (la fila completa en un bloque de código)

Al final, lista los datos que quedaron como `no detectado`.
