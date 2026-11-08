// Comprueba que los tres idiomas tienen exactamente las mismas claves y la misma estructura (W-46, W-115).
import { readFileSync } from "node:fs";

const langs = ["es", "en", "ar"];
const data = Object.fromEntries(
  langs.map((l) => [l, JSON.parse(readFileSync(new URL(`../src/i18n/${l}.json`, import.meta.url)))]),
);

function shape(v, path = "", out = new Map()) {
  if (Array.isArray(v)) {
    out.set(path, `array(${v.length})`);
    v.forEach((x, i) => shape(x, `${path}[${i}]`, out));
  } else if (v && typeof v === "object") {
    Object.keys(v).forEach((k) => shape(v[k], path ? `${path}.${k}` : k, out));
  } else {
    out.set(path, typeof v);
  }
  return out;
}
const ref = shape(data.es);
let errors = 0;
for (const l of langs.slice(1)) {
  const s = shape(data[l]);
  for (const [k, t] of ref) {
    if (!s.has(k)) (console.error(`[${l}] falta ${k}`), errors++);
    else if (s.get(k) !== t) (console.error(`[${l}] ${k}: ${s.get(k)} ≠ ${t} (es)`), errors++);
  }
  for (const k of s.keys()) if (!ref.has(k)) (console.error(`[${l}] sobra ${k}`), errors++);
}
// Ningún marcador tipo [TU EMAIL] o TODO en los textos publicados (W-02).
for (const l of langs) {
  const txt = JSON.stringify(data[l]);
  const m = txt.match(/\[[A-ZÁÉÍÓÚ ]{3,}\]|\bTODO\b|lorem ipsum/g);
  if (m) (console.error(`[${l}] marcadores visibles: ${[...new Set(m)].join(", ")}`), errors++);
}
if (errors) process.exit(1);
console.log(`i18n correcto: ${ref.size} claves idénticas en ${langs.join(", ")}`);
