# Pruebas (W-00e, W-66, W-67, W-103, W-104)

## Resumen

| Prueba | Herramienta | Resultado |
|---|---|---|
| Pruebas en navegador (`npm run test:ui`) | Playwright + Chromium | **1.051 / 1.051 correctas** ([informe](../reports/ui-report.md)) |
| Accesibilidad automática WCAG 2.2 AA | axe-core 4.11, 13 páginas × 3 idiomas × 2 temas × 2 anchos | **0 incidencias** |
| HTML válido | html-validate | 41 páginas sin errores |
| Enlaces y anclas internas | `npm run links` | Sin enlaces rotos |
| Lighthouse móvil | Lighthouse 13 | Ver tabla |

### Lighthouse en móvil (W-00e)

Medido en local, sin compresión HTTP ni CDN; en producción el rendimiento suele ser igual o mejor.

| Página | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| Inicio (ES) | 95 | 100 | 100 | 100 | 2,6 s | 0,029 |
| Contacto (ES) | 96 | 100 | 100 | 100 | 2,3 s | 0,059 |
| Inicio (AR) | 95 | 100 | 100 | 100 | 2,6 s | 0 |

Informes completos en `reports/lighthouse/` (HTML para abrir en el navegador y JSON).

## Matriz navegador × dispositivo (W-66, W-67)

✔ = probado y correcto · E = probado por emulación de tamaño en Chromium · — = pendiente (requiere el navegador o el dispositivo físico)

| Dispositivo / ancho | Chromium | Chrome real | Edge | Firefox | Safari macOS | Safari iOS |
|---|---|---|---|---|---|---|
| iPhone SE 1.ª gen. (320×568) | E | — | — | — | — | — |
| Android 360 (360×740) | E | — | — | — | — | — |
| iPhone SE (375×667) | E | — | — | — | — | — |
| iPhone 15 (393×852) | E | — | — | — | — | — |
| iPhone 15 horizontal (852×393) | E | — | — | — | — | — |
| iPad vertical (768×1024) | E | — | — | — | — | — |
| iPad horizontal (1024×768) | E | — | — | — | — | — |
| Portátil 1280 | ✔ | — | — | — | — | — |
| Escritorio 1440 / 1920 | ✔ | — | — | — | — | — |
| Ultrapanorámico 2560 | ✔ | — | — | — | — | — |
| Zoom 200 % / reflow a 320 px (WCAG 1.4.10) | ✔ (320 px CSS) | — | — | — | — | — |

En cada ancho se comprueba, en ES, EN y AR y en las 13 páginas: sin scroll horizontal, menú completo en una línea desde 1024 px, nombre «Salim Capital» visible, selector de idioma visible sin abrir el menú, cabecera en una fila y CTA de la portada en la primera pantalla.

**Pendiente:** no hay dispositivos físicos ni Safari, Firefox o Edge en el entorno de trabajo. Las columnas con «—» deben rellenarse a mano con la lista de abajo. Lo más probable es que Safari iOS sea el que más diferencias muestre (fuentes, `100dvh`, controles de formulario).

### Lista para la prueba manual en cada navegador

1. Portada: sin scroll horizontal; el botón «Solicitar una evaluación» se ve sin desplazarse.
2. Menú (en móvil): se abre, se cierra con Escape y con la ✕, y el foco no se escapa.
3. Idioma: cambiar a EN y a AR mantiene la misma página; en AR todo va de derecha a izquierda.
4. Tema: en el pie, Automático / Claro / Oscuro; recargar no produce un destello del tema contrario.
5. FAQ: solo una pregunta abierta a la vez; `/es/faq/#hacienda` abre esa pregunta.
6. Formulario: enviar vacío muestra el resumen de errores y lleva el foco al primer campo; correo y teléfono se escriben de izquierda a derecha también en árabe.
7. «Solicitar este modelo» en Modelos preselecciona el modelo en el formulario.

## Lectores de pantalla (W-103)

**No hecho.** Requiere VoiceOver (macOS/iOS) y NVDA (Windows) con una persona que los maneje. Lo que sí está verificado de forma automática:

- `header`, `nav`, `main` y `footer` en todas las páginas, un único `h1` por página y jerarquía de encabezados sin saltos.
- Enlace «Saltar al contenido» como primer elemento enfocable.
- `lang` y `dir` correctos en el HTML servido; los enlaces de idioma llevan su propio `lang`, para que el lector los pronuncie en su idioma (W-91).
- Todos los textos accesibles (`aria-label`, nombres de botones, leyenda del tema) traducidos en los tres idiomas (W-90).
- El formulario anuncia los errores (`role="alert"`), asocia cada mensaje a su campo (`aria-describedby`) y marca los campos con `aria-invalid`.
- Las banderas son decorativas; cada enlace de idioma tiene el nombre del idioma como texto accesible.

### Guion de prueba con lector de pantalla (ES, EN y AR)

1. Recorrer la portada por encabezados (VoiceOver: VO+Cmd+H; NVDA: H): debe oírse un único nivel 1.
2. Abrir la lista de puntos de referencia (rotor de VoiceOver / NVDA+F7): cabecera, navegación principal, contenido principal, pie.
3. Cambiar de idioma desde la cabecera: se anuncia «Idioma actual: Español. Cambiar idioma» y cada opción en su idioma.
4. Abrir y cerrar el menú móvil (VoiceOver en iOS): se anuncia «Abrir menú» / «Cerrar menú» y el estado expandido.
5. Tema en el pie: se anuncia «Tema, grupo» y «Automático, ahora claro (según su sistema)».
6. FAQ: cada pregunta se anuncia como contraída o expandida.
7. Formulario: enviar vacío; se lee el resumen de errores y cada campo anuncia su error.
8. En árabe: comprobar que el orden de lectura sigue el visual y que el correo se lee de izquierda a derecha.

## Teclado (W-104)

Verificado en las pruebas automáticas: Tab y Mayús+Tab recorren la página en orden; Enter abre el menú y el selector de idioma, Escape los cierra y devuelve el foco; Espacio abre las preguntas de la FAQ; el formulario se completa y envía solo con teclado; el foco siempre es visible (contorno de 3 px con contraste suficiente sobre fondo claro, oscuro y verde).
