// Genera las imágenes de vista previa al compartir (og:image) por idioma: src/og/og-{lang}.png (1200×630).
import { createRequire } from "node:module";
import { mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const { chromium } = createRequire(import.meta.url)("playwright");
const root = new URL("../", import.meta.url);
const map = readFileSync(new URL("src/partials/map.svg", root), "utf8");
const font = (f) => fileURLToPath(new URL(`node_modules/${f}`, root));
mkdirSync(new URL("src/og/", root), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const lang of ["es", "en", "ar"]) {
  const t = JSON.parse(readFileSync(new URL(`src/i18n/${lang}.json`, root), "utf8"));
  const rtl = lang === "ar";
  await page.setContent(`<!doctype html><html lang="${lang}" dir="${t.meta.dir}"><head><style>
    @font-face{font-family:F;src:url("file://${font("@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2")}")}
    @font-face{font-family:A;font-weight:600;src:url("file://${font("@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-600-normal.woff2")}")}
    body{margin:0;width:1200px;height:630px;background:#1F3A2E;color:#fff;font-family:${rtl ? "A" : "F"},serif;display:grid;grid-template-columns:1.1fr 1fr;align-items:center;gap:40px;padding:0 70px;box-sizing:border-box}
    h1{font-size:${rtl ? 54 : 58}px;line-height:1.15;font-weight:${rtl ? 600 : 400};margin:0 0 28px}
    p{margin:0;font-size:30px;color:#D9B76C;font-family:F,serif}
    .map{width:100%} .map-land{fill:none;stroke:#4E6E5B;stroke-width:3.4;stroke-linecap:round} .map-arc{fill:none;stroke:#D9B76C;stroke-width:3}
    .map-city{fill:#9FC2A8} .map-node{fill:#1F3A2E;stroke:#D9B76C;stroke-width:3}
  </style></head><body><div><h1>${t.pages.home.h1}</h1><p>Salim Capital</p></div><div dir="ltr">${map}</div></body></html>`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: fileURLToPath(new URL(`src/og/og-${lang}.png`, root)) });
}
await browser.close();
console.log("Imágenes og generadas en src/og/");
