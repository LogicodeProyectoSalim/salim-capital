// Verifica que todos los enlaces y recursos internos de dist/ existen (enlaces rotos, W-117).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith(".html")) files.push(p);
  }
})(DIST);

let broken = 0;
const ids = new Map();
for (const f of files) ids.set(f, new Set([...readFileSync(f, "utf8").matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));

for (const f of files) {
  if (f.endsWith("404.html")) continue; // usa rutas absolutas según BASE_PATH
  const html = readFileSync(f, "utf8");
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const url = m[1];
    if (/^(https?:|mailto:|tel:|data:)/.test(url)) continue;
    const [pathPart, hash] = url.split("#");
    const clean = pathPart.split("?")[0];
    let target = clean ? resolve(dirname(f), clean) : f;
    if (clean.endsWith("/") || (existsSync(target) && statSync(target).isDirectory()))
      target = join(target, "index.html");
    if (!existsSync(target)) {
      console.error(`${relative(DIST, f)} → ${url} (no existe)`);
      broken++;
      continue;
    }
    if (hash && target.endsWith(".html") && !ids.get(target)?.has(hash)) {
      console.error(`${relative(DIST, f)} → ${url} (ancla #${hash} no existe)`);
      broken++;
    }
  }
}
if (broken) process.exit(1);
console.log(`Enlaces internos correctos en ${files.length} páginas`);
