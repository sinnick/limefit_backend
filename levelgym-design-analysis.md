# Análisis Estético Completo de LEVEL GYM

> Documento de referencia para inspiración de diseño
> URL: https://levelgym.com.ar/level/
> Fecha de análisis: 2026-05-30

---

## RESUMEN EJECUTIVO

LEVEL GYM es una cadena de gimnasios premium (Buenos Aires, Mendoza, Catamarca) con una
estética **dark, atlética y de alto contraste**: fondo casi negro, un rojo brand intenso
(`#DA100C`) como único acento, tipografía display condensada en mayúsculas (Bebas Neue) y
cuerpo en una sans-serif técnica (Rajdhani). El resultado transmite energía, agresividad
deportiva y exclusividad. Construido sobre WordPress (presumiblemente con Elementor + tema custom).

---

## 1. TIPOGRAFÍA

### Fuente Principal (Títulos/Headlines) — **Bebas Neue**
- **Tipo:** Display / Sans-serif condensada
- **Pesos:** se declara 400, 600 y 700, aunque Bebas Neue real solo tiene un peso visual; el
  navegador sintetiza los semibold/bold (font-family con fallback `cursive` y `sans-serif`).
- **Estilo:** SIEMPRE en `text-transform: uppercase`.
- **Sensación:** impacto, fuerza, atletismo, titulares de revista deportiva. Letras altas y
  estrechas que permiten titulares enormes ocupando poco ancho.
- **Tamaños observados:**
  - H1: `88px`, weight 700, line-height `74.8px` (≈ 0.85 — muy ceñido), uppercase
  - H2: `64px`, weight 600, line-height `70.4px` (≈ 1.1), letter-spacing `2px`, uppercase
  - H3: `28.8px`, weight 600, line-height `31.68px` (≈ 1.1), letter-spacing `1px`, uppercase
  - Números de estadísticas (850+, 40+, 98%): `64px`, weight 400, color rojo `#DA100C`

### Fuente Secundaria (Cuerpo/UI) — **Rajdhani**
- **Tipo:** Sans-serif técnica / semi-condensada (estilo "tech/gaming")
- **Pesos:** 400 (texto), 600 (navegación, botones, labels)
- **Tamaño de cuerpo:** `16px`, line-height `26.4px` (≈ 1.65)
- **Color de cuerpo:** `#B3B3B3` (gris claro)
- **Uso:** párrafos, navegación, botones, labels, badges, descripciones de cards.
- Los elementos de UI (nav links, botones) van en `12.8px`, weight 600, uppercase,
  letter-spacing `1px`.

### Jerarquía Tipográfica Completa
| Elemento | Fuente | Tamaño | Peso | Color | Line-height | Extra |
|----------|--------|--------|------|-------|-------------|-------|
| H1 | Bebas Neue | 88px | 700 | `#FFFFFF` | 0.85 | uppercase |
| H2 | Bebas Neue | 64px | 600 | `#FFFFFF` | 1.1 | uppercase, ls 2px |
| H3 | Bebas Neue | 28.8px | 600 | `#FFFFFF` | 1.1 | uppercase, ls 1px |
| H4 | Bebas Neue | ~22px | 600 | `#FFFFFF` | ~1.1 | uppercase |
| Body / p | Rajdhani | 16px | 400 | `#B3B3B3` | 1.65 | — |
| Caption / eyebrow | Rajdhani | ~13px | 600 | `#DA100C` | — | uppercase, ls |
| Nav / botones | Rajdhani | 12.8px | 600 | varía | — | uppercase, ls 1px |
| Stats (números) | Bebas Neue | 64px | 400 | `#DA100C` | — | — |

**Patrón de titular destacado:** los H1/H2 combinan blanco + una palabra clave en rojo
(`LISTO PARA SUBIR AL PROXIMO **LEVEL?**`, `LA EVOLUCIÓN DEL **FITNESS**`). Es el recurso
visual más característico del sitio.

### Recursos de las fuentes (gratuitas, Google Fonts)
- Bebas Neue: https://fonts.google.com/specimen/Bebas+Neue
- Rajdhani: https://fonts.google.com/specimen/Rajdhani
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## 2. PALETA DE COLORES

### Color Primario (Brand)
- **Level Red** — `#DA100C` · `rgb(218, 16, 12)` · `hsl(1, 90%, 45%)`
  - Uso: CTAs primarios, palabra destacada en titulares, números de estadísticas, iconos,
    eyebrows, hover states. Es el ÚNICO acento de color en todo el sitio.
- Variante secundaria detectada: `#DD183B` · `rgb(221, 24, 59)` (rojo ligeramente más rosado,
  uso menor) y `#D90D0D` en gradientes radiales sutiles.

### Colores Neutros (la base del diseño es escala de grises sobre negro)
| Nombre | HEX | RGB | Uso |
|--------|-----|-----|-----|
| Negro base / página | `#0A0A0A` | rgb(10,10,10) | fondo principal |
| Negro sección | `#080808` | rgb(8,8,8) | fondos de secciones alternas |
| Negro puro | `#000000` | rgb(0,0,0) | nav scrolled, overlays |
| Superficie 1 | `#111111` | rgb(17,17,17) | cards de servicios |
| Superficie 2 | `#1A1A1A` | rgb(26,26,26) | cards/gradientes elevados |
| Superficie 3 | `#050505` | rgb(5,5,5) | fondos muy oscuros |
| Borde sutil | `#222222` | rgb(34,34,34) | divisores |
| Texto secundario | `#B3B3B3` | rgb(179,179,179) | cuerpo (color dominante de texto) |
| Texto terciario | `#CCCCCC` | rgb(204,204,204) | texto algo más claro |
| Texto muted | `#888888` | rgb(136,136,136) | metadatos, captions |
| Texto muy muted | `#777777` | rgb(119,119,119) | fechas, copyright |
| Texto principal | `#FFFFFF` | rgb(255,255,255) | títulos, énfasis |

### Colores con Transparencia (CSS)
```css
/* Bordes / superficies vidriosas sutiles (el patrón más usado en cards) */
background: rgba(255, 255, 255, 0.05);   /* surface sutil sobre negro */
background: rgba(255, 255, 255, 0.03);   /* surface aún más sutil */
border:     1px solid rgba(255, 255, 255, 0.05);

/* Texto */
color: rgba(255, 255, 255, 0.8);  /* texto botón/nav */
color: rgba(255, 255, 255, 0.7);
color: rgba(255, 255, 255, 0.3);  /* texto muy tenue / disabled */

/* Acentos rojos translúcidos */
background: rgba(218, 16, 12, 0.8);   /* hover/overlays rojos */
```

### Gradientes
```css
/* Overlay del hero (oscurece imagen de fondo, lado izquierdo más opaco) */
background: linear-gradient(90deg, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.6) 100%);

/* Superficie de cards / paneles elevados (sutil de claro→oscuro) */
background: linear-gradient(135deg, #111111 0%, #0A0A0A 100%);
background: linear-gradient(135deg, #111111 0%, #0D0D0D 100%);
background: linear-gradient(135deg, #1A1A1A 0%, #0D0D0D 100%);

/* Glow ambiental rojo en esquinas de secciones (muy sutil, 5% opacidad) */
background:
  radial-gradient(circle at 100% 0%, rgba(217,13,13,0.05), transparent 400px),
  radial-gradient(circle at 0% 100%, rgba(217,13,13,0.05), transparent 400px);
```

### Modo Oscuro
El sitio ES nativamente dark; no hay modo claro. Toda la paleta está construida sobre negro.

---

## 3. LAYOUT Y ESPACIADO

### Contenedor Principal
- Ancho de contenido observado: ~`1200–1217px` centrado.
- Padding lateral interno de columnas: `~20px` (en mobile aumenta el respiro lateral).
- Alineación: centrado con `margin: 0 auto`.

### Sistema de Espaciado
- Unidad base aparente: múltiplos de `~10px` (10/20/30/40).
- **Padding vertical de secciones: `100px 0`** (muy generoso, da sensación premium/aireada).
- Padding interno de cards: `40px 30px`.
- Gaps entre cards de grid: `~30px`.

### Sistema de Grid
- Cards de servicios: **grid de 4 columnas** en desktop.
- Estadísticas: **4 columnas**.
- Galería: **grid de 4 columnas** de imágenes (aspect ~3:4 verticales).
- Testimonios: **3 columnas**.
- Footer: **4 columnas** (marca + Navegación + Oportunidades + Redes Sociales).
- Combinación de CSS Grid (galerías/cards) y Flexbox (nav, filas de features).

### Border Radius
| Elemento | Radius |
|----------|--------|
| Botones (hero) | `4px` |
| Botones (nav CTA) | `6px` |
| Botones pill (ubicaciones) | `50px` |
| Cards de servicio | `15px` |
| Cards / paneles medianos | `12px` |
| Elementos generales | `8px` (el más frecuente) |
| Imágenes / contenedores | `10px`, `20px`, `24px` |
| Círculos (iconos, avatares, social) | `50%` |

### Bordes
- Grosor típico: `1px`.
- Color de borde estrella: `rgba(255,255,255,0.05)` (apenas perceptible, define superficies sobre negro).
- Divisores/acentos: borde inferior rojo `#DA100C` bajo los eyebrows ("NUESTRA ESENCIA").

---

## 4. IMÁGENES Y MEDIA

### Estilo Fotográfico
- Fotografía **real de las sedes y miembros entrenando**: lifestyle deportivo.
- Tratamiento oscuro y contrastado, tonos fríos/neutros con detalles cálidos del rojo de marca.
- Iluminación dramática de gimnasio (luces de máquinas, ventanales).
- Sujetos: atletas reales, entrenadores, equipamiento, fachadas con el logo LEVEL GYM.

### Iconografía
- Estilo **filled / sólido**, color rojo `#DA100C`.
- Encerrados en círculos/cuadrados redondeados con fondo oscuro translúcido.
- Conjunto típico de fitness: mancuerna, llama (crossfit), bici (spinning), nota musical (zumba),
  corredor (funcional), loto (pilates), diana (localizada), capas (GAP), ducha, taza (bar), cámara,
  corazón, trofeo. Estilo consistente tipo **Font Awesome / Material filled**.
- Tamaño del glifo dentro de su círculo: ~24–28px.

### Tratamiento de Imágenes
- Galería: tarjetas verticales aspecto ~`3:4` con `border-radius` y hover (zoom/overlay).
- Hero: imagen a sangre completa con overlay degradado para legibilidad del texto.
- Mockup de teléfono para la sección de la app (imagen de gimnasio dentro del frame del celular,
  con sombra fuerte y logo LEVEL GYM sobreimpreso).

### Fondos
- Negro sólido (`#0A0A0A` / `#080808`) en la mayoría de secciones.
- Glows radiales rojos al 5% en esquinas para dar profundidad.
- Hero con foto + overlay degradado.

---

## 5. EFECTOS VISUALES

### Sombras (Box Shadows)
```css
/* Sutil (elementos pequeños) */
box-shadow: 0 1px 2px rgba(0,0,0,0.05);
box-shadow: 0 5px 15px rgba(0,0,0,0.3);

/* Media (cards) */
box-shadow: 0 10px 20px rgba(0,0,0,0.2);
box-shadow: 0 20px 60px rgba(0,0,0,0.8);

/* Pronunciada / elevación fuerte (mockups, paneles destacados) */
box-shadow: 0 30px 60px rgba(0,0,0,0.5);
box-shadow: 0 40px 80px rgba(0,0,0,0.5);
box-shadow: 0 40px 100px rgba(0,0,0,0.7);
box-shadow: 0 50px 100px -20px rgba(0,0,0,0.8);

/* Glow ROJO de marca (CTAs / elementos destacados) — el sello del sitio */
box-shadow: 0 10px 30px rgba(218,16,12,0.3);
box-shadow: 0 15px 30px rgba(218,16,12,0.4);
```

### Efectos de Texto
- Énfasis por color (palabra en rojo) más que por sombras.
- Sin text-shadow notable; el contraste blanco sobre negro ya es máximo.

### Filtros / Profundidad
- Overlays degradados sobre fotos (no `backdrop-filter` glassmorphism pesado; el efecto vidrioso
  se logra con `rgba(255,255,255,0.03–0.05)`).

---

## 6. ANIMACIONES Y TRANSICIONES

### Transiciones Globales
- Duración estándar: **`0.3s`** (declarada en botones, nav y cards).
- Easing: por defecto `ease`.
- Propiedades animadas: `background-color`, `color`, `transform`, `box-shadow`, `border-color`.

### Hover Effects (esperados / observados)
- **Botones primarios:** oscurecen/intensifican el rojo y elevan con glow rojo.
- **Nav links:** cambian a rojo `#DA100C`.
- **Cards de servicio:** elevación (translateY) + aparece glow/borde rojo.
- **Imágenes de galería:** zoom suave + overlay.

### Animaciones de Entrada (on scroll)
- Elementos aparecen con fade/slide al hacer scroll (las secciones se "revelan" — comportamiento
  típico de Elementor / AOS). Stagger entre cards de un mismo grid.

---

## 7. COMPONENTES UI

### Navegación
- **Tipo:** `position: fixed`, altura ~`81px`, padding `20px 0`.
- Fondo transparente sobre el hero; al hacer scroll pasa a **negro sólido** (sticky condensado).
- **Logo** "LEVEL GYM" a la izquierda: "LEVEL" en blanco + "GYM" en rojo (wordmark, sin símbolo).
- Links centrados/derecha: Rajdhani 600, 12.8px, uppercase, letter-spacing 1px, color blanco→rojo en hover.
- **CTA "EMPEZAR AHORA"** a la derecha: botón rojo sólido, radius 6px.
- **Mobile:** menú hamburguesa → **drawer lateral derecho** a pantalla completa, fondo negro,
  links centrados verticalmente en uppercase, CTA rojo abajo.

### Botones
```css
/* Botón Primario (CTA rojo) */
.btn-primary {
  background: #DA100C;
  color: #FFFFFF;                 /* a veces rgba(255,255,255,0.8) */
  padding: 12px 30px;             /* 10px 20px en variante nav */
  border-radius: 4px;             /* 6px en nav */
  font-family: 'Rajdhani', sans-serif;
  font-size: 12.8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  border: none;
  transition: 0.3s;
}
.btn-primary:hover {
  filter: brightness(1.08);
  box-shadow: 0 15px 30px rgba(218,16,12,0.4);  /* glow rojo */
  transform: translateY(-2px);
}

/* Botón Secundario / Outline (hero "EMPEZAR AHORA") */
.btn-outline {
  background: transparent;
  color: #FFFFFF;
  border: 1px solid rgba(255,255,255,0.4);
  padding: 12px 30px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: 0.3s;
}
.btn-outline:hover { border-color: #DA100C; color: #DA100C; }

/* Botón pill (filtros de ubicación) */
.btn-pill { border-radius: 50px; padding: 10px 20px; }

/* Botón "link" (nav links, "Trabaja con nosotros") */
.btn-link {
  background: transparent;
  color: rgba(255,255,255,0.8);
  font-size: 12.8px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 1px;
}
```

### Tarjetas (Cards de servicio)
```css
.card {
  background: #111111;                       /* o linear-gradient(135deg,#111 0%,#0a0a0a 100%) */
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 15px;
  padding: 40px 30px;
  text-align: center;
  transition: 0.3s;
}
.card .icon-circle {           /* círculo del icono */
  border-radius: 50%;
  /* fondo oscuro translúcido, icono rojo centrado */
}
.card h3 { font-family:'Bebas Neue'; text-transform:uppercase; color:#fff; letter-spacing:1px; }
.card p  { font-family:'Rajdhani'; color:#B3B3B3; }
.card:hover { transform: translateY(-6px); border-color: rgba(218,16,12,0.5); box-shadow: 0 10px 30px rgba(218,16,12,0.3); }
```

### Estadísticas (counters)
- Número grande en Bebas Neue 64px rojo `#DA100C` + label debajo en Rajdhani uppercase gris.
- Ej: `850+ MIEMBROS ACTIVOS`, `40+ ENTRENADORES`, `120+ CLASES SEMANALES`, `98% TASA DE ÉXITO`.

### Badges / Pills
- Eyebrow rojo con pequeño icono + texto uppercase (`RUTINAS GYM`, `SISTEMA DE PUNTOS`,
  `PREMIOS & CANJES`) — fondo oscuro translúcido, texto/icono rojo, radius alto.

### Testimonios
- Grid de 3 cards: estrellas (rating rojo) arriba-izquierda, comillas decorativas arriba-derecha,
  quote en cuerpo, autor en negrita + "Miembro desde [mes año]" en muted.

### Acordeones (ubicaciones)
- Filas tipo card (`#111`, radius ~12px) con nombre de ciudad en Bebas Neue, descripción, iconos
  sociales (WhatsApp / Instagram / Facebook) y chevron de expandir a la derecha.

### Footer
- 4 columnas sobre negro: logo + tagline · "NAVEGACIÓN" · "OPORTUNIDADES" · "REDES SOCIALES"
  (iconos circulares).
- Títulos de columna en Bebas Neue rojo/blanco con subrayado/acento.
- Barra inferior: `© 2026 Level Gym. Todos los derechos reservados.` en muted, centrado.

---

## 8. SECCIONES DE PÁGINA (orden real)

1. **Hero** — fullscreen, foto de atleta + overlay degradado; eyebrow ("Favorito de los Miembros
   - 4.9 Calificado por 350+ personas"), H1 gigante con palabra en rojo, subtítulo, dos botones
   (rojo sólido + outline).
2. **Nuestra Esencia** — imagen de la sede + badge "34+ AÑOS DE EXPERIENCIA" (card roja superpuesta)
   + grid 2×2 de features con iconos rojos (Calidad humana, Equipamiento pro, Clases variadas,
   Atención personal).
3. **Estadísticas** — 4 counters rojos.
4. **CTA Franquicia** — panel oscuro con glow rojo: "¿QUERÉS TENER TU PROPIO LEVEL GYM?" + botón
   "ABRIR MI FRANQUICIA".
5. **Servicios / Actividades** — H2 "TU ENTRENAMIENTO AL MÁXIMO" + grid 4×N de cards
   (Musculación, Crossfit, Spinning, Zumba, Funcional, Pilates, Localizada, GAP, Duchas y
   Vestuarios, Bar & Suplementos).
6. **Mis Actividades / Rewards** — panel con pills (Rutinas Gym, Sistema de Puntos, Premios &
   Canjes) + CTA "Acceder a Mis Actividades".
7. **Novedades / Blog** — cards de noticias con fecha (badge día/mes), categoría, título y "LEER MÁS".
8. **App móvil** — "LLEVÁ TU ENTRENAMIENTO AL SIGUIENTE LEVEL" + features con iconos + botón Google
   Play + mockup de teléfono.
9. **Ubicaciones** — acordeones por ciudad (Buenos Aires, Catamarca, Mendoza) con redes.
10. **Galería** — grid 4 columnas de fotos de sedes/entrenamientos.
11. **Testimonios** — rating 4.9 + 3 cards de reseñas.
12. **Footer**.

---

## 9. RESPONSIVE DESIGN

### Breakpoints (típicos del tema)
- Mobile: `< 768px`
- Tablet: `768px – 1024px`
- Desktop: `> 1024px`

### Cambios por Breakpoint
**Mobile (< 768px)**
- Nav → hamburguesa con **drawer lateral derecho fullscreen** (fondo negro, links centrados, CTA rojo abajo).
- Hero: texto **centrado**, botones **full-width apilados** (stacked).
- Grids de 4 columnas → 1 columna.
- H1 se reduce notablemente (de 88px a ~44–52px) manteniendo el impacto.
- Padding de secciones reducido.

**Desktop (> 1024px)**
- Layout completo multi-columna, hero a dos zonas (texto izq / foto der), padding 100px vertical.

- **Enfoque:** responsive fluido (probablemente mobile-aware sobre tema WordPress).

---

## 10. IDENTIDAD VISUAL Y BRANDING

### Concepto General
Gimnasio **premium, agresivo y tecnológico**. La estética dice "rendimiento, nivel superior,
comunidad fuerte". Público objetivo: adultos jóvenes fitness, gente que busca exclusividad y
seguimiento serio del progreso.

### Logo
- Wordmark **"LEVELGYM"**: "LEVEL" en blanco + "GYM" en rojo `#DA100C`, tipografía gruesa
  condensada. Sin isotipo. En footer/menú aparece en blanco/rojo sobre negro.

### Tono Visual
- **Moderno, oscuro, de alto contraste, atlético.** Minimalista en color (mono-acento rojo),
  maximalista en tamaño tipográfico. Energía tipo marca deportiva premium (Nike/UFC vibes).

### Elementos Diferenciadores
1. **Titulares mitad-blanco / mitad-rojo** (palabra clave siempre en rojo).
2. **Bebas Neue gigante uppercase** como protagonista absoluto.
3. **Glows rojos translúcidos** (sombras `rgba(218,16,12,0.3–0.4)` y radiales al 5%) que dan
   un brillo "neón" sobre el negro.
4. Counters de estadísticas en rojo enorme.
5. Superficies casi invisibles (`rgba(255,255,255,0.05)`) que estructuran sin romper el negro.

---

## 11. PERFORMANCE Y TÉCNICO

### Stack Técnico
- **CMS:** WordPress (slug `/level/`, categoría "SIN CATEGORÍA" en blog, estructura de tema clásica).
- **Builder probable:** Elementor (clases `elementor-*`, animaciones on-scroll).
- **CSS:** propio del tema (no se detectaron variables `:root` custom expuestas; estilos inline/tema).
- **Fuentes:** Google Fonts (Bebas Neue + Rajdhani).

---

## 12. RECURSOS Y ASSETS

### Fuentes
- Bebas Neue — Google Fonts (gratuita)
- Rajdhani — Google Fonts (gratuita)

### Iconografía
- Set filled tipo Font Awesome / Material Icons, recoloreado en rojo de marca.

### Imágenes
- Fotografía propia de las sedes y miembros (no stock genérico).

---

## 13. APLICACIONES SUGERIDAS

Ideal para:
- Gimnasios / boxes de crossfit / estudios de entrenamiento premium.
- Marcas deportivas, suplementos, ropa fitness.
- Apps de fitness/tracking, eventos deportivos, eSports/gaming (la combinación Bebas+Rajdhani
  encaja con estética gamer/tech).
- Landing pages de productos con un solo color de acento fuerte.

No ideal para:
- Marcas suaves, wellness/spa, salud infantil, finanzas conservadoras o cualquier tono claro/pastel.

---

## 14. CSS VARIABLES RECOMENDADAS

```css
:root {
  /* Colors */
  --color-primary:        #DA100C;   /* Level Red */
  --color-primary-alt:    #DD183B;
  --color-background:     #0A0A0A;
  --color-background-alt: #080808;
  --color-surface:        #111111;
  --color-surface-2:      #1A1A1A;
  --color-surface-glass:  rgba(255,255,255,0.05);
  --color-text-primary:   #FFFFFF;
  --color-text-secondary: #B3B3B3;
  --color-text-muted:     #888888;
  --color-text-faint:     #777777;
  --color-border:         rgba(255,255,255,0.05);
  --color-border-strong:  #222222;

  /* Typography */
  --font-family-heading: 'Bebas Neue', sans-serif;
  --font-family-body:    'Rajdhani', sans-serif;
  --font-size-xs:   12.8px;
  --font-size-sm:   14px;
  --font-size-base: 16px;
  --font-size-lg:   20px;
  --font-size-xl:   28.8px;   /* h3 */
  --font-size-2xl:  64px;     /* h2 / stats */
  --font-size-3xl:  88px;     /* h1 */
  --line-height-tight:   0.85;
  --line-height-heading: 1.1;
  --line-height-body:    1.65;
  --letter-spacing-ui:   1px;

  /* Spacing */
  --spacing-xs:  10px;
  --spacing-sm:  20px;
  --spacing-md:  30px;
  --spacing-lg:  40px;
  --spacing-section: 100px;   /* padding vertical de secciones */

  /* Border Radius */
  --radius-sm:   4px;   /* botones */
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   15px;  /* cards */
  --radius-pill: 50px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm:    0 5px 15px rgba(0,0,0,0.3);
  --shadow-md:    0 10px 20px rgba(0,0,0,0.2);
  --shadow-lg:    0 30px 60px rgba(0,0,0,0.5);
  --shadow-xl:    0 50px 100px -20px rgba(0,0,0,0.8);
  --shadow-glow:  0 15px 30px rgba(218,16,12,0.4);  /* glow rojo de marca */

  /* Gradients */
  --gradient-hero:    linear-gradient(90deg, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.6) 100%);
  --gradient-surface: linear-gradient(135deg, #111111 0%, #0A0A0A 100%);
  --glow-radial:      radial-gradient(circle at 100% 0%, rgba(217,13,13,0.05), transparent 400px);

  /* Transitions */
  --transition-normal: 0.3s ease;

  /* Z-index */
  --z-dropdown: 100;
  --z-modal:    200;
  --z-tooltip:  300;
}
```

---

Documento generado como referencia de diseño basado en https://levelgym.com.ar/level/
