# Changelog

## [2.2.0] — 2026-11-12 · Asistente de preguntas (sin IA)

- Botón «¿Preguntas?» en todas las páginas de los tres idiomas. Abre un panel que responde al momento con los textos de la propia web: FAQ, servicios, modelos, aliados, filosofía, experiencia y contacto, con un enlace «Leer más» a la sección exacta.
- Respuestas breves para lo que la web no cubre en un solo texto (tarifas, mínimo, cómo empezar, contacto, residencia, idiomas, lista de servicios y de modelos). Son texto nuevo: N-15 en [docs/DESVIACIONES.md](docs/DESVIACIONES.md), pendiente de aprobación del cliente.
- Si no encuentra la respuesta, lo dice y remite a la solicitud: nunca inventa.
- Todo funciona en el navegador, sin IA, sin coste y sin enviar ni guardar lo que se escribe. Busca por palabras con sinónimos (p. ej. «casa» → inmobiliario, «cancelar» → finalizar) y normaliza acentos y escritura árabe.
- La base de conocimiento (`assets/kb/kb-{es,en,ar}.json`) se genera en cada build a partir de `src/i18n`, así que el asistente siempre dice lo mismo que la web.
- Accesible: diálogo con nombre, registro con `aria-live`, foco al abrir, Escape para cerrar, zonas táctiles de 44 px y sin scroll horizontal a 320 px. Pruebas en navegador: 1.123 / 1.123 correctas (72 nuevas del asistente).

## [2.1.0] — 2026-11-10 · Logotipo nuevo

- Sello nuevo: disco con aro fino dorado, iniciales y una línea dorada que une dos puntos («el puente entre dos mundos»). Diseño aprobado en el lienzo «Logo profesional».
- Español e inglés: monograma **SC** y nombre «SALIM CAPITAL» en versalitas espaciadas. Árabe: monograma **سك** y «سالم كابيتال»; solo en las páginas en árabe.
- Favicon por idioma: `favicon.svg` (SC) y `favicon-ar.svg` (سك).
- Las iniciales son trazados (no texto), así que el logo se ve igual aunque no carguen las fuentes. Se regeneran con `python3 scripts/make-logo.py`.
- Por debajo de 376 px el sello y el nombre se reducen para que no haya scroll horizontal a 320 px. Pruebas en navegador: 1.051 / 1.051 correctas.

## [2.0.0] — 2026-11-08 · Iteración 2 (respuesta a la revisión `01_feedback_web_A.md`)

La web se ha rehecho como **sitio estático multipágina trilingüe** (ES, EN, AR) a partir de los textos literales de las specs. Cada punto de la revisión tiene su estado abajo.

Estados: ✅ hecho · 🟡 parcial (motivo indicado) · 📋 propuesta, pendiente de decisión · ❌ no hecho (motivo indicado)

Documentos de apoyo: [Desviaciones](docs/DESVIACIONES.md) · [Propuestas: formulario, dominio, estructura, alojamiento](docs/PROPUESTAS.md) · [Pruebas](docs/PRUEBAS.md) · [Informe UI](reports/ui-report.md) · [Lighthouse](reports/lighthouse/)

### 0. Entrega

| Punto | Estado | Detalle |
|---|---|---|
| W-00a Historial git real | ✅ | Un commit por grupo de puntos (`git log --oneline`). Pendiente de subir a tu repositorio: hace falta acceso de escritura o que lo subas tú (ver README). |
| W-00b CHANGELOG | ✅ | Este archivo. |
| W-00c Tabla de desviaciones | ✅ | [docs/DESVIACIONES.md](docs/DESVIACIONES.md): 17 propuestas no aplicadas, 7 cambios de formato y 14 textos nuevos pendientes de aprobación. |
| W-00e Lighthouse móvil | ✅ | Home 95/100/100/100 y contacto 96/100/100/100 (rendimiento/accesibilidad/buenas prácticas/SEO). HTML y JSON en `reports/lighthouse/`. Medido en local, sin CDN. |

### 1. Bloqueantes

| Punto | Estado | Detalle |
|---|---|---|
| W-01 Formulario no envía | 📋 | Tres opciones con coste en [PROPUESTAS §1](docs/PROPUESTAS.md). Recomendada: función propia en Cloudflare Pages (0 €/mes). Sin implementar hasta que elijas, como pediste. Mientras tanto la web ya no finge el envío: muestra el correo de contacto. Honeypot, tiempo mínimo y límite de 3 envíos/hora listos en el navegador. |
| W-02 Placeholders visibles | ✅ | Eliminados en los tres idiomas. `npm run check:i18n` falla si vuelve a aparecer un marcador tipo `[TU EMAIL]`. Dominios libres y precios en [PROPUESTAS §2](docs/PROPUESTAS.md); **saidsalim.com** usado como provisional (no comprado). |
| W-03 Páginas legales | ✅ | Aviso legal (LSSI-CE art. 10), privacidad (RGPD) y cookies en ES, EN y AR, enlazadas desde el pie y desde la casilla del formulario. Borradores redactados con IA, marcados como tal en la página. Faltan datos del cliente (NIF, domicilio, registro, autorizaciones, proveedor del formulario): se muestran como «Pendiente de completar» y el build los lista. |
| W-05 Tema claro/oscuro | ✅ | Ver W-08 a W-14. |
| W-06 Textos de las specs | ✅ | Ver W-16 a W-48. |
| W-07 Navegación | ✅ | Ver W-50. |

### 2. Tema claro / oscuro

| Punto | Estado | Detalle |
|---|---|---|
| W-08 Tema del sistema por defecto | ✅ | `prefers-color-scheme` en CSS. |
| W-09 Cambio en vivo | ✅ | Por CSS mientras no haya elección manual; además un `matchMedia(...).addEventListener('change')` actualiza `theme-color` y el texto accesible. |
| W-10 Botón en el footer | ✅ | Fuera de la cabecera y del menú móvil. |
| W-11 Tres estados | ✅ | Automático / Claro / Oscuro como grupo de opciones (`fieldset` + radios): el estado se ve siempre y se maneja con flechas. «Automático» borra la preferencia. Leyenda y textos traducidos; en automático anuncia «Automático, ahora oscuro (según su sistema)». |
| W-12 Sin parpadeo | ✅ | Script mínimo en línea en `<head>`, antes del CSS, con su hash en la CSP. |
| W-13 Metas | ✅ | `color-scheme` y dos `theme-color` por esquema; se actualizan si el usuario fuerza un tema. |
| W-14 Una sola identidad | ✅ | Tokens únicos en `:root` (color, superficies, bordes, foco); el oscuro redefine los mismos tokens. Cabecera y pie verdes en los dos temas, sin marco. No quedan colores fijos fuera de los tokens salvo las banderas y el texto oscuro sobre el botón dorado. |

### 3. Contenido frente a las specs

| Punto | Estado | Detalle |
|---|---|---|
| W-16 «Qué aporto» y misión en la Home | ✅ | |
| W-17 Frases de la Home | ✅ | «sofisticados», «experto en la interconexión de mercados», «Mi especialidad es crear el puente financiero…». |
| W-18 Cinco frases de Sobre mí | ✅ | Las cinco, en el orden de las specs. |
| W-19 «capitalizar la revolución…» | ✅ | |
| W-20 Título de Filosofía | ✅ | «Filosofía de Inversión: El Valor de la Confianza en la Era Digital.» |
| W-21 Introducción y cierre | ✅ | |
| W-22 «Discreción Absoluta» | ✅ | En los tres idiomas. |
| W-23 Filosofía como sección 3 | ✅ | En el menú, tras «Sobre mí». |
| W-24 Subtítulos de perfiles | ✅ | |
| W-25 Credenciales | ✅ | «directivos de fondos soberanos», «inversores ángeles», «familias prominentes». Nota en DESVIACIONES §4. |
| W-26 Tiempo verbal | ✅ | «He asesorado / He trabajado / He brindado / He colaborado». |
| W-27 Matices | ✅ | |
| W-28 Títulos de Servicios | ✅ | |
| W-29 Nombres completos | ✅ | Incluido «(Hold & Growth)». |
| W-30 Cambios en Servicios | ✅ + 📋 | Texto original restaurado; propuestas P-03, P-04, P-05. |
| W-31 Enfoque / Ideal para / Qué incluye / Resultado | ✅ | |
| W-32 Etiquetas en negrita | ✅ | |
| W-33 Cómo contratar | ✅ | Bloque de 6 pasos. Texto nuevo pendiente de aprobación (N-02). |
| W-34 Resultados | ✅ + 📋 | Restaurados; propuestas P-06 a P-08. |
| W-35 Grupos de Aliados | ✅ | |
| W-36 Frases de Aliados | ✅ | |
| W-37 Introducción de Contacto | ✅ | |
| W-38 Pregunta del campo de texto | ✅ | Completa en los tres idiomas. |
| W-39 Mensaje tras el envío | ✅ | Completo en los tres idiomas. |
| W-40 Etiquetas | ✅ | |
| W-41 FAQ 1 | ✅ | |
| W-42 FAQ 2 y 6 | ✅ + 📋 | Restaurados; propuesta P-09. |
| W-43 Modelo 721 | 📋 | Quitado de la web; propuesta P-10. |
| W-44 FAQ 5 | ✅ + 📋 | Restaurado; propuesta P-02 (prioritaria). |
| W-45 Empleo | ✅ | Título de las specs («Ofertas de trabajo»); el texto es nuestro y está pendiente de aprobación (N-01). Correo con el dominio provisional. |
| W-46 Mismo contenido en los tres idiomas | ✅ | EN y AR traducidos desde las specs. `npm run check:i18n` exige la misma estructura (495 claves). |
| W-47 Trato de usted | ✅ | Revisado todo el ES; el título de Empleo es el del cliente. |
| W-48 Revisión nativa | ❌ | Las traducciones al inglés y al árabe las ha hecho una IA (Claude). Necesitan revisión de una persona nativa; para el árabe, alguien con experiencia en banca privada del Golfo. |

### 4. Estructura y navegación

| Punto | Estado | Detalle |
|---|---|---|
| W-49 Estructura | ✅ | Opción (b): multipágina generado, una URL por página e idioma. Justificación en [PROPUESTAS §3](docs/PROPUESTAS.md). |
| W-50 Menú | ✅ | Inicio · Sobre mí · Filosofía · Experiencia · Servicios · Modelos · Aliados · FAQ · Contacto. Empleo y legales en el pie. |
| W-51 Orden | ✅ | Orden de las specs. |
| W-52 Preselección del modelo | ✅ | Campo nuevo «Modelo de interés»; `?model=` lo rellena. |
| W-53 Cierre de cada página | ✅ | «Solicitar una evaluación» + «Siguiente: …» en todas las páginas salvo Contacto. |
| W-54 404 | ✅ | Trilingüe, con `noindex`. |

### 5. Responsive

| Punto | Estado | Detalle |
|---|---|---|
| W-55 Cabecera a 1024 px | ✅ | Desde 1024 px, cabecera en dos niveles diseñada a propósito (marca + idioma + CTA; menú completo debajo). Por debajo, menú desplegable. Probado en 11 anchos de 320 a 2560 px en los tres idiomas: el menú cabe en una línea en todos. |
| W-56 CTA en la primera pantalla | ✅ | Comprobado en 11 pantallas, incluido móvil en horizontal. |
| W-57 Bloque de marca repetido | ✅ | Eliminado; la portada empieza por el titular. |
| W-58 Nombre siempre visible | ✅ | |
| W-59 Idioma visible en móvil | ✅ | Banderas en la cabecera; por debajo de 420 px, la bandera actual abre la lista sin pasar por el menú. |
| W-60 Zonas táctiles | ✅ | Mínimo 44×44 px, comprobado automáticamente. |
| W-61 Marco de 6 px | ✅ | Eliminado. |
| W-62 Footer al fondo | ✅ | Flex en columna con `min-height: 100dvh`. |
| W-63 dvh | ✅ | Con `vh` como respaldo para navegadores antiguos. |
| W-64 Contacto en dos columnas | ✅ | Formulario + panel con «Qué pasa después», confidencialidad (NDA) y correo alternativo. |
| W-65 Tarjetas de modelos | ✅ | Cada modelo en una fila de dos columnas, sin huecos; etiqueta «Más completo» en el C. |
| W-66 Dispositivos reales | 🟡 | Probados todos los tamaños pedidos por emulación en Chromium, más horizontal y reflow a 320 px. Sin dispositivos físicos en el entorno: lista de prueba manual en [PRUEBAS](docs/PRUEBAS.md). |
| W-67 Navegadores | 🟡 | Chromium automatizado. Safari, Firefox y Edge pendientes de prueba manual; tabla preparada en [PRUEBAS](docs/PRUEBAS.md). |

### 6. Diseño

| Punto | Estado | Detalle |
|---|---|---|
| W-71 Identidad visual | 📋 | Tres alternativas (Arco, Dos hemisferios, Sello), cada una con versión árabe, monocroma y favicon, en el lienzo de diseño «Salim Capital – Logotipo», página «Alternativas de logo». La web sigue con el monograma actual hasta que se elija. |
| W-72 Dibujo del puente | ✅ | Mapa de puntos real (Natural Earth) con el arco Madrid → Dubái. |
| W-73 Orientación | ✅ | Geográfica en todos los idiomas: España a la izquierda, Golfo a la derecha. |
| W-74 Servicios | ✅ | Icono por grupo y enlace «Incluido en: …» al modelo correspondiente (correspondencia pendiente de validar, N-08). Sin numeración: no es una secuencia. |
| W-75 Microcopy | ✅ | «FAQ» en el menú, «Preguntas frecuentes» como título; revisada en los tres idiomas. |
| W-76 FAQ | ✅ | Acordeón exclusivo (`<details name>`), enlace directo por pregunta (`/es/faq/#hacienda`). Añadir preguntas queda a decisión del cliente. |
| W-77 Animaciones | ✅ | Solo el trazo del arco, decorativo; desactivado con `prefers-reduced-motion`. |

### 7. Formulario

| Punto | Estado | Detalle |
|---|---|---|
| W-79 Errores por campo | ✅ | Mensaje bajo cada campo en los tres idiomas, `aria-invalid`, `aria-describedby`, foco en el primer error y resumen con enlaces arriba. |
| W-81 Envío en curso | ✅ | Botón deshabilitado con indicador y bloqueo de doble envío. Se activa en cuanto haya proveedor (W-01). |
| W-83 Información RGPD | ✅ | Primera capa (responsable, finalidad, legitimación, destinatarios, derechos) + enlace a la política. Borrador pendiente del abogado. |
| W-84 RTL | ✅ | Correo y teléfono con `dir="ltr"`; casillas, radios y desplegables alineados en RTL. |
| W-85 autocomplete / inputmode | ✅ | `name`, `email`, `tel`; `inputmode` en correo y teléfono. Campo de teléfono opcional nuevo (N-09). |

### 8. Idiomas y RTL

| Punto | Estado | Detalle |
|---|---|---|
| W-87 Detección de idioma | ✅ | La raíz `/` elige por `navigator.languages` (ar → árabe, es → español, otro → inglés) y respeta después la elección guardada. Sin JavaScript muestra un selector. |
| W-88 URL por idioma | ✅ | `hreflang` entre versiones + `x-default`; `lang` y `dir` en el HTML servido. |
| W-89 Título y descripción | ✅ | Propios por página e idioma (39 títulos distintos). |
| W-90 Textos sin traducir | ✅ | Todos los `aria-label` salen de los archivos de idioma. |
| W-91 `lang` en el selector | ✅ | |
| W-92 Cifras en árabe | ✅ | Occidentales (0-9), documentado en DESVIACIONES F-07. |
| W-93 Logo en árabe | 📋 | Variante árabe en cada alternativa de W-71. La cabecera árabe ya muestra «سالم كابيتال» (pendiente de confirmar la transliteración, N-14). |
| Banderas en el selector | ✅ | España (ES), Reino Unido (EN) y Emiratos Árabes Unidos (AR), sin la de EE. UU. Cada enlace tiene el nombre del idioma como texto accesible. Para el árabe se eligió EAU por ser el mercado principal del cliente; puede cambiarse por Arabia Saudí. |

### 9. Legal y privacidad

| Punto | Estado | Detalle |
|---|---|---|
| W-95 Rentabilidades y riesgos | 📋 | Todas las frases problemáticas marcadas en DESVIACIONES (P-02 a P-09, P-15, P-16) y nota sobre servicios regulados (MiCA/CNMV). |
| W-96 Sin cookies ni rastreadores | ✅ | Fuentes autoalojadas (antes venían de Google Fonts), sin analítica ni cookies. Solo `localStorage` para idioma, tema y el límite de envíos, explicado en la política de cookies. |
| W-97 HTTPS / HSTS | 🟡 | `_headers` con HSTS listo para Cloudflare Pages o Netlify. GitHub Pages no permite cabeceras propias: allí solo «Enforce HTTPS». Recomendación en [PROPUESTAS §4](docs/PROPUESTAS.md). CSP en todas las páginas. |

### 10. Accesibilidad (WCAG 2.2 AA)

| Punto | Estado | Detalle |
|---|---|---|
| W-98 Landmarks | ✅ | |
| W-99 Saltar al contenido | ✅ | |
| W-100 Un h1 por página | ✅ | |
| W-101 Foco al cambiar de vista | ✅ | Al ser multipágina, cada sección es una carga de página real que el lector anuncia; ya no hay cambios por `#hash`. |
| W-102 Menú móvil | ✅ | Escape, foco atrapado y devolución del foco al botón. |
| W-103 VoiceOver y NVDA | ❌ | Requiere probarlo una persona con esos lectores. Guion de prueba en [PRUEBAS](docs/PRUEBAS.md). axe-core: 0 incidencias en ES/EN/AR, claro y oscuro, móvil y escritorio. |
| W-104 Teclado | ✅ | Comprobado de forma automática. |
| Inclusiva para personas ciegas | 🟡 | Todo lo automatizable está verificado; falta la prueba con lector de pantalla real (W-103). |

### 12. Calidad del código

| Punto | Estado | Detalle |
|---|---|---|
| W-113 Separación | ✅ | `src/i18n/{es,en,ar}.json`, `src/css/site.css`, `src/js/site.js`, generador en `scripts/`. |
| W-114 CSS duplicado | ✅ | Reescrito por componentes con tokens; Stylelint sin errores (incluye `no-duplicate-selectors`). |
| W-115 Traducciones unificadas | ✅ | Un JSON por idioma, sin asignaciones sueltas. |
| W-116 Sin JavaScript | ✅ | Todo el contenido y el menú se ven; el formulario muestra el correo en `<noscript>` y, con proveedor, enviará también sin JS. |
| W-117 Linter y CI | ✅ | ESLint, Stylelint, Prettier, html-validate, enlaces rotos, coherencia i18n y pruebas de navegador en `.github/workflows/ci.yml`. |
| W-118 README | ✅ | |

## [1.0.0] — 2026-10-28

- Primera versión: página única `index.html` subida a GitHub Pages.
