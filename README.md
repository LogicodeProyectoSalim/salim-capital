# Salim Capital — sitio web

Sitio estático multipágina en español, inglés y árabe (RTL), con tema claro/oscuro, sin cookies y sin dependencias en el navegador.

- 13 páginas por idioma: Inicio, Sobre mí, Filosofía, Experiencia, Servicios, Modelos, Aliados, FAQ, Contacto, Ofertas de trabajo, Aviso legal, Privacidad y Cookies.
- URL por idioma: `/es/servicios/`, `/en/services/`, `/ar/services/`. La raíz `/` redirige según el idioma del navegador.
- Estado de la última revisión: [CHANGELOG.md](CHANGELOG.md).

## Requisitos

- Node.js 20 o superior.

## Desarrollo local

```bash
npm install            # instala las herramientas (solo para desarrollo)
npm run build          # genera el sitio en dist/
npm run serve          # lo sirve en http://localhost:4173
```

Para revisarlo sin servidor, con doble clic:

```bash
npm run build:preview  # enlaces terminados en index.html
# abrir dist/index.html en el navegador
```

## Editar textos

Todos los textos están en **un archivo por idioma**:

```
src/i18n/es.json   ← texto del cliente (fuente)
src/i18n/en.json
src/i18n/ar.json
```

1. Cambia el texto en `es.json`.
2. Cambia la misma clave en `en.json` y `ar.json`: los tres idiomas deben decir lo mismo.
3. `npm run check:i18n` comprueba que los tres archivos tienen exactamente las mismas claves y que no queda ningún marcador como `[TU EMAIL]`.

Formato dentro de los textos: `**negrita**` y `*cursiva*`.

Cualquier cambio sobre el texto del cliente se registra primero en [docs/DESVIACIONES.md](docs/DESVIACIONES.md).

Datos generales (dominio, correos, endpoint del formulario, datos legales): `src/data/site.json`. Un valor `null` en `legal` aparece como «Pendiente de completar» en las páginas legales y el build lo avisa.

## Estructura

```
src/
  i18n/          textos por idioma
  data/site.json configuración del sitio
  css/site.css   estilos (tokens de tema al principio, luego componentes)
  js/site.js     tema, menú, idioma, FAQ y formulario (mejora progresiva)
  partials/      mapa SVG generado
  og/            imágenes para compartir en redes
  static/        favicon, _headers, .nojekyll
scripts/
  build.mjs      generador del sitio (sin dependencias)
  serve.mjs      servidor local
  make-map.mjs   regenera el mapa (npm run map)
  make-og.mjs    regenera las imágenes para redes
  check-i18n.mjs coherencia de idiomas
  check-links.mjs enlaces rotos
tests/ui.mjs     pruebas en navegador (Playwright + axe-core)
docs/            desviaciones, propuestas y pruebas
reports/         informes de pruebas y Lighthouse
```

## Calidad

```bash
npm run lint        # ESLint + Stylelint + Prettier
npm run validate    # HTML válido (tras npm run build)
npm run links       # enlaces internos
npm run test:ui     # pruebas en navegador (necesita Playwright y Chromium)
npm test            # todo lo anterior
```

Las pruebas de navegador necesitan Playwright: `npm i --no-save playwright && npx playwright install chromium`.

## Despliegue

### GitHub Pages

1. En el repositorio: **Settings → Pages → Source: GitHub Actions**.
2. Cada push a `main` ejecuta `.github/workflows/deploy.yml`, que genera el sitio con la ruta correcta del repositorio y lo publica.
3. Activa **Enforce HTTPS** en la misma pantalla.

### Cloudflare Pages (recomendado si se usa la opción C del formulario)

- Comando de build: `npm run build` · carpeta de salida: `dist`.
- Aplica las cabeceras de seguridad de `dist/_headers` (HSTS incluido).

### Dominio

Ahora se usa **saidsalim.com como dominio provisional** (no está comprado). Al comprar el definitivo, cambia `siteUrl` y los correos en `src/data/site.json` y pon `domainIsPlaceholder` a `false`. Detalle y precios en [docs/PROPUESTAS.md](docs/PROPUESTAS.md).

## Pendiente antes de publicar para clientes

- Elegir el proveedor del formulario (W-01) y poner su dirección en `form.endpoint`.
- Datos legales del titular en `src/data/site.json` y revisión de las páginas legales por un abogado.
- Aprobación de las propuestas y textos nuevos de [docs/DESVIACIONES.md](docs/DESVIACIONES.md), sobre todo P-01 (Golden Visa).
- Revisión nativa del inglés y del árabe.
- Prueba manual en Safari, Firefox, Edge y dispositivos reales, y con VoiceOver y NVDA ([docs/PRUEBAS.md](docs/PRUEBAS.md)).
