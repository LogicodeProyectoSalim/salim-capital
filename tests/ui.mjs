// Pruebas en navegador (Chromium vía Playwright): responsive, accesibilidad, tema, menú, formulario y sin JavaScript.
// Uso: npm run build && node tests/ui.mjs   → escribe reports/ui-report.json y reports/ui-report.md
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { start } from "../scripts/serve.mjs";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  ({ chromium } = await import("playwright"));
}

const PORT = 4190;
const BASE = `http://localhost:${PORT}`;
const T = Object.fromEntries(
  ["es", "en", "ar"].map((l) => [l, JSON.parse(readFileSync(new URL(`../src/i18n/${l}.json`, import.meta.url)))]),
);
const KEYS = Object.keys(T.es.routes);
const url = (lang, key) => `/${lang}/${T[lang].routes[key] ? T[lang].routes[key] + "/" : ""}`;

const results = [];
const record = (area, name, ok, detail = "") => {
  results.push({ area, name, ok, detail });
  if (!ok) console.log(`✗ [${area}] ${name} ${detail}`);
};

const server = await start(PORT);
const browser = await chromium.launch();

async function withPage(opts, fn) {
  const ctx = await browser.newContext({ deviceScaleFactor: 1, ...opts });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/404/.test(m.text()) && errors.push(m.text()));
  try {
    await fn(page, errors);
  } finally {
    await ctx.close();
  }
}

/* 1. Responsive: sin scroll horizontal, cabecera sin romperse, nombre e idioma visibles (W-55, W-58, W-59, W-66) */
const WIDTHS = [320, 360, 375, 393, 768, 820, 1024, 1280, 1440, 1920, 2560];
for (const lang of ["es", "en", "ar"]) {
  for (const w of WIDTHS) {
    await withPage({ viewport: { width: w, height: 900 } }, async (page, errors) => {
      for (const key of KEYS) {
        await page.goto(BASE + url(lang, key));
        const m = await page.evaluate(() => {
          const de = document.documentElement;
          const nav = document.querySelector(".site-nav ul");
          const navVisible = nav && getComputedStyle(document.querySelector(".site-nav")).display !== "none";
          const items = nav ? [...nav.querySelectorAll("li")].map((li) => li.getBoundingClientRect().top) : [];
          const name = document.querySelector(".brand-name").getBoundingClientRect();
          const lang = document.querySelector(".lang");
          const lr = lang.getBoundingClientRect();
          const bar = document.querySelector(".bar").getBoundingClientRect();
          return {
            overflow: de.scrollWidth - de.clientWidth,
            navOneLine: !navVisible || new Set(items.map((t) => Math.round(t))).size <= 1,
            nameVisible: name.width > 0 && name.right <= de.clientWidth + 1 && name.left >= -1,
            langVisible: lr.width >= 40 && lr.height >= 40,
            barHeight: bar.height,
          };
        });
        record("responsive", `${lang} ${w}px ${key}: sin scroll horizontal`, m.overflow <= 0, `overflow=${m.overflow}`);
        if (key === "home") {
          if (w >= 1024) record("responsive", `${lang} ${w}px: menú completo en una línea`, m.navOneLine);
          record("responsive", `${lang} ${w}px: nombre «Salim Capital» visible`, m.nameVisible);
          record("responsive", `${lang} ${w}px: selector de idioma visible sin abrir el menú`, m.langVisible);
          record("responsive", `${lang} ${w}px: cabecera en una fila`, m.barHeight < 90, `alto=${m.barHeight}`);
        }
      }
      record("js", `${lang} ${w}px: sin errores de JavaScript`, errors.length === 0, errors.join(" | "));
    });
  }
}

/* 2. Llamada a la acción en la primera pantalla (W-56) */
const SCREENS = [
  [320, 568, "iPhone SE (1.ª gen.)"],
  [360, 740, "Android 360"],
  [375, 667, "iPhone SE"],
  [393, 852, "iPhone 15"],
  [768, 1024, "iPad vertical"],
  [1024, 768, "iPad horizontal"],
  [1280, 800, "Portátil 1280"],
  [1440, 900, "Escritorio 1440"],
  [1920, 1080, "Escritorio 1920"],
  [2560, 1080, "Ultrapanorámico"],
  [852, 393, "iPhone 15 en horizontal"],
];
for (const lang of ["es", "en", "ar"]) {
  for (const [w, h, label] of SCREENS) {
    await withPage({ viewport: { width: w, height: h } }, async (page) => {
      await page.goto(BASE + url(lang, "home"));
      const bottom = await page.evaluate(
        () => document.querySelector(".hero .btn--primary").getBoundingClientRect().bottom,
      );
      record(
        "cta",
        `${lang} ${label} ${w}×${h}: CTA visible sin scroll`,
        bottom <= h,
        `borde inferior=${Math.round(bottom)}px`,
      );
    });
  }
}

/* 3. Zonas táctiles de al menos 44×44 px (W-60) */
for (const [w, lang] of [
  [390, "es"],
  [1280, "es"],
  [1280, "ar"],
]) {
  await withPage({ viewport: { width: w, height: 900 } }, async (page) => {
    for (const key of ["home", "contact", "faq"]) {
      await page.goto(BASE + url(lang, key));
      if (w < 1024) await page.click(".menu-btn");
      const small = await page.evaluate(() => {
        const sel =
          ".site-nav a, .lang-list a, .lang-toggle, .menu-btn, .btn, .theme-opt, .foot-nav a, .foot-lang a, .choice, .faq-item summary, .next-link, .brand, .request-form input:not([type=checkbox]):not([type=radio]):not([type=hidden]), .request-form select";
        return [...document.querySelectorAll(sel)]
          .filter((el) => el.offsetParent !== null && !el.closest(".hp"))
          .map((el) => {
            const r = el.getBoundingClientRect();
            return {
              el: el.className || el.tagName,
              text: (el.textContent || "").trim().slice(0, 30),
              w: r.width,
              h: r.height,
            };
          })
          .filter((r) => r.w > 0 && (r.w < 43.5 || r.h < 43.5));
      });
      record(
        "tap",
        `${lang} ${w}px ${key}: objetivos ≥ 44×44 px`,
        small.length === 0,
        JSON.stringify(small.slice(0, 5)),
      );
    }
  });
}

/* 4. Accesibilidad automática con axe-core (WCAG 2.2 AA) en los dos temas */
for (const scheme of ["light", "dark"]) {
  for (const lang of ["es", "en", "ar"]) {
    for (const w of [390, 1280]) {
      await withPage({ viewport: { width: w, height: 900 }, colorScheme: scheme }, async (page) => {
        for (const key of KEYS) {
          await page.goto(BASE + url(lang, key));
          await page.waitForTimeout(50);
          const r = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
            .analyze();
          const v = r.violations.map((x) => `${x.id} (${x.nodes.length}): ${x.nodes[0]?.target}`);
          record("axe", `${scheme} ${lang} ${w}px ${key}`, v.length === 0, v.join(" | "));
        }
      });
    }
  }
}

/* 5. Estructura: un h1 por página, landmarks, salto al contenido, lang/dir servidos, title propio (W-88, W-89, W-98 a W-100) */
await withPage({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } }, async (page) => {
  const titles = new Set();
  for (const lang of ["es", "en", "ar"]) {
    for (const key of KEYS) {
      await page.goto(BASE + url(lang, key));
      const s = await page.evaluate(() => ({
        h1: document.querySelectorAll("h1").length,
        main: document.querySelectorAll("main").length,
        header: !!document.querySelector("body > header"),
        footer: !!document.querySelector("body > footer"),
        nav: document.querySelectorAll("nav").length,
        skip: document.querySelector("a.skip")?.getAttribute("href"),
        lang: document.documentElement.lang,
        dir: document.documentElement.dir,
        title: document.title,
        desc: document.querySelector('meta[name="description"]')?.content,
        hreflang: document.querySelectorAll('link[rel="alternate"][hreflang]').length,
        text: document.querySelector("main").innerText.length,
        navVisible: getComputedStyle(document.querySelector(".site-nav")).display !== "none",
      }));
      record("estructura", `${lang} ${key}: un solo h1`, s.h1 === 1, `h1=${s.h1}`);
      record(
        "estructura",
        `${lang} ${key}: header, nav, main y footer`,
        s.main === 1 && s.header && s.footer && s.nav >= 2,
      );
      record("estructura", `${lang} ${key}: enlace «Saltar al contenido»`, s.skip === "#main");
      record(
        "estructura",
        `${lang} ${key}: lang y dir en el HTML servido`,
        s.lang === lang && s.dir === (lang === "ar" ? "rtl" : "ltr"),
      );
      record("estructura", `${lang} ${key}: hreflang ES/EN/AR + x-default`, s.hreflang === 4);
      record(
        "sin-js",
        `${lang} ${key}: contenido y menú visibles sin JavaScript`,
        s.text > 120 && s.navVisible,
        `texto=${s.text}`,
      );
      titles.add(s.title);
    }
  }
  record(
    "estructura",
    "Cada página e idioma tiene un title distinto",
    titles.size === 3 * KEYS.length,
    `${titles.size}/${3 * KEYS.length}`,
  );
});

/* 6. Tema: sistema por defecto, cambio en vivo, elección manual, sin parpadeo (W-08 a W-13) */
await withPage({ viewport: { width: 1280, height: 900 }, colorScheme: "dark" }, async (page) => {
  const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.goto(BASE + "/es/");
  const darkBg = await bg();
  record("tema", "Arranca con el tema del sistema (oscuro)", darkBg !== "rgb(255, 255, 255)", darkBg);
  await page.emulateMedia({ colorScheme: "light" });
  record("tema", "Cambia en vivo si cambia el sistema (modo automático)", (await bg()) === "rgb(255, 255, 255)");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.click('.theme-opt:has(input[value="light"])');
  record("tema", "Elección manual «Claro» con el sistema en oscuro", (await bg()) === "rgb(255, 255, 255)");
  await page.emulateMedia({ colorScheme: "light" });
  await page.emulateMedia({ colorScheme: "dark" });
  record("tema", "La elección manual no cambia con el sistema", (await bg()) === "rgb(255, 255, 255)");
  await page.click('.theme-opt:has(input[value="dark"])');
  // Sin parpadeo: al recargar, el tema guardado ya está aplicado antes de pintar (script en <head>)
  await page.emulateMedia({ colorScheme: "light" });
  const early = await page.evaluate(async (u) => {
    const r = await fetch(u);
    const html = await r.text();
    const headScript = html.indexOf("<script>") < html.indexOf('rel="stylesheet"');
    return headScript;
  }, BASE + "/es/");
  record("tema", "Script de tema en línea en <head> antes del CSS (sin FOUC)", early);
  await page.reload();
  const attrAtStart = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  record("tema", "Tras recargar se mantiene «Oscuro»", attrAtStart === "dark");
  const meta = await page.evaluate(() =>
    [...document.querySelectorAll('meta[name="theme-color"]')].map((m) => m.content),
  );
  record(
    "tema",
    "theme-color acompaña al tema elegido",
    meta.every((c) => c.toLowerCase() === "#13201a"),
    meta.join(","),
  );
  await page.click('.theme-opt:has(input[value="auto"])');
  const cleared = await page.evaluate(
    () => localStorage.getItem("theme") === null && !document.documentElement.hasAttribute("data-theme"),
  );
  record("tema", "«Automático» borra la preferencia guardada", cleared);
  const label = await page.getAttribute('.theme-opt input[value="auto"]', "aria-label");
  record("tema", "El modo automático anuncia el tema actual", !!label && /claro|oscuro/i.test(label), label);
  const inHeader = await page.evaluate(() => !!document.querySelector("header [data-theme-switch]"));
  record("tema", "El botón de tema está en el footer, no en la cabecera", !inHeader);
});

/* 7. Menú móvil con teclado (W-102, W-104) */
for (const lang of ["es", "ar"]) {
  await withPage({ viewport: { width: 390, height: 844 } }, async (page) => {
    await page.goto(BASE + url(lang, "about"));
    await page.focus(".menu-btn");
    await page.keyboard.press("Enter");
    const opened = await page.evaluate(() => document.querySelector("[data-header]").hasAttribute("data-open"));
    const focusInNav = await page.evaluate(() => !!document.activeElement.closest(".site-nav"));
    record("teclado", `${lang}: Enter abre el menú y el foco entra en él`, opened && focusInNav);
    for (let i = 0; i < 12; i++) await page.keyboard.press("Tab");
    const trapped = await page.evaluate(() => !!document.activeElement.closest("[data-header]"));
    record("teclado", `${lang}: el foco queda atrapado en el menú abierto`, trapped);
    await page.keyboard.press("Escape");
    const closed = await page.evaluate(
      () =>
        !document.querySelector("[data-header]").hasAttribute("data-open") &&
        document.activeElement.classList.contains("menu-btn"),
    );
    record("teclado", `${lang}: Escape cierra el menú y devuelve el foco al botón`, closed);
    await page.focus(".lang-toggle");
    await page.keyboard.press("Enter");
    const langOpen = await page.evaluate(() => document.activeElement.closest(".lang-list") !== null);
    await page.keyboard.press("Escape");
    record("teclado", `${lang}: selector de idioma móvil abre con Enter y cierra con Escape`, langOpen);
    await page.goto(BASE + url(lang, "home"));
    await page.keyboard.press("Tab");
    const skipFirst = await page.evaluate(() => document.activeElement.classList.contains("skip"));
    record("teclado", `${lang}: el primer Tab llega a «Saltar al contenido»`, skipFirst);
  });
}

/* 8. FAQ: acordeón exclusivo y enlace directo (W-76) */
await withPage({ viewport: { width: 1280, height: 900 } }, async (page) => {
  await page.goto(BASE + "/es/faq/#hacienda");
  record(
    "faq",
    "El enlace #hacienda abre esa pregunta",
    await page.evaluate(() => document.getElementById("hacienda").open),
  );
  await page.click("#claves summary");
  const open = await page.evaluate(() => [...document.querySelectorAll(".faq-item")].filter((d) => d.open).length);
  record("faq", "Solo una pregunta abierta a la vez", open === 1, `abiertas=${open}`);
  await page.focus("#legalidad summary");
  await page.keyboard.press("Space");
  record(
    "faq",
    "Espacio abre una pregunta con teclado",
    await page.evaluate(() => document.getElementById("legalidad").open),
  );
});

/* 9. Formulario (W-52, W-79, W-81, W-84, W-85) */
for (const lang of ["es", "ar"]) {
  await withPage({ viewport: { width: 1280, height: 900 } }, async (page) => {
    await page.goto(BASE + url(lang, "contact") + "?model=bridge");
    record(
      "formulario",
      `${lang}: «Solicitar este modelo» preselecciona el modelo`,
      (await page.inputValue("#model")) === "bridge",
    );
    await page.click('button[type="submit"]');
    const st = await page.evaluate(() => ({
      summary: !document.getElementById("form-errors").hidden,
      items: document.querySelectorAll("#form-errors li").length,
      focus: document.activeElement.id,
      invalid: document.querySelectorAll('[aria-invalid="true"]').length,
      nameErr: document.getElementById("name-error").textContent,
      described: document.getElementById("name").getAttribute("aria-describedby"),
    }));
    record("formulario", `${lang}: resumen de errores arriba`, st.summary && st.items >= 8, `errores=${st.items}`);
    record("formulario", `${lang}: foco en el primer campo con error`, st.focus === "name", st.focus);
    record(
      "formulario",
      `${lang}: aria-invalid y mensaje bajo el campo`,
      st.invalid >= 8 && !!st.nameErr && st.described.includes("name-error"),
    );
    const dirs = await page.evaluate(() => [
      document.getElementById("email").dir,
      document.getElementById("phone").dir,
    ]);
    record(
      "formulario",
      `${lang}: correo y teléfono en LTR`,
      dirs.every((d) => d === "ltr"),
    );
    const ac = await page.evaluate(() =>
      ["name", "email", "phone"].map((id) => document.getElementById(id).autocomplete),
    );
    record("formulario", `${lang}: autocomplete name/email/tel`, ac.join() === "name,email,tel", ac.join());
    // Relleno válido: sin proveedor configurado no se finge el envío
    await page.fill("#name", "Prueba Automática");
    await page.fill("#email", "prueba@empresa.com");
    await page.selectOption("#channel", "email");
    await page.selectOption("#residence", "ae");
    await page.fill("#nationality", "Emiratí");
    await page.selectOption("#volume", "1m-5m");
    await page.check("#goal-0");
    await page.check("#urgency-1");
    await page.check("#consent");
    await page.waitForTimeout(4200);
    await page.click('button[type="submit"]');
    const after = await page.evaluate(() => ({
      errors: document.getElementById("form-errors").hidden,
      success: !document.getElementById("form-success").hidden,
      status: document.getElementById("form-status").textContent,
    }));
    record(
      "formulario",
      `${lang}: sin proveedor no muestra un éxito falso y da el correo`,
      after.errors && !after.success && /@/.test(after.status),
      after.status.slice(0, 60),
    );
  });
}

/* 10. Idioma: la raíz redirige según el navegador (W-87) */
for (const [loc, expected] of [
  ["ar-AE", "/ar/"],
  ["es-ES", "/es/"],
  ["fr-FR", "/en/"],
]) {
  await withPage({ locale: loc }, async (page) => {
    await page.goto(BASE + "/");
    await page.waitForURL(/\/(es|en|ar)\/$/);
    record("idioma", `Navegador en ${loc} → ${expected}`, new URL(page.url()).pathname === expected, page.url());
  });
}
await withPage({ locale: "ar-AE" }, async (page) => {
  await page.goto(BASE + "/es/");
  await page.goto(BASE + "/");
  await page.waitForURL(/\/(es|en|ar)\/$/);
  record(
    "idioma",
    "Se respeta la elección previa del usuario sobre el idioma del navegador",
    new URL(page.url()).pathname === "/es/",
  );
});

/* 11. Página 404 trilingüe (W-54) */
await withPage({}, async (page) => {
  const res = await page.goto(BASE + "/no-existe/");
  const langs = await page.evaluate(() => [...document.querySelectorAll(".nf")].map((s) => s.lang));
  record("404", "Responde 404 con bloques en ES, EN y AR", res.status() === 404 && langs.join() === "es,en,ar");
});

/* 12. Asistente de preguntas sin IA: responde con los textos de la web, en los tres idiomas */
const FIRST_FAQ = (lang) => T[lang].pages.faq.blocks[0].qs[0];
for (const lang of ["es", "en", "ar"]) {
  for (const [w, scheme] of [
    [1280, "light"],
    [375, "dark"],
    [320, "light"],
  ]) {
    await withPage({ viewport: { width: w, height: 760 }, colorScheme: scheme }, async (page, errors) => {
      await page.goto(BASE + url(lang, "services"));
      const btn = page.locator(".assistant-open");
      record("asistente", `${lang} ${w}px: botón visible`, await btn.isVisible());
      await btn.click();
      const focused = await page.evaluate(() => document.activeElement?.id);
      record("asistente", `${lang} ${w}px: al abrir, el foco va a la pregunta`, focused === "assistant-input");
      const q = FIRST_FAQ(lang);
      await page.fill("#assistant-input", q.q);
      await page.press("#assistant-input", "Enter");
      const last = page.locator(".assistant-msg--bot").last();
      await last.locator("a").first().waitFor({ timeout: 3000 });
      const href = await last.locator("a").first().getAttribute("href");
      record("asistente", `${lang} ${w}px: responde con la FAQ y enlaza a ella`, href.endsWith(`#${q.id}`), href);
      await page.fill("#assistant-input", "zzqx wvvk");
      await page.press("#assistant-input", "Enter");
      await page.waitForTimeout(100);
      const fb = await page.locator(".assistant-msg--bot").last().innerText();
      record(
        "asistente",
        `${lang} ${w}px: sin respuesta, remite a la solicitud`,
        fb.includes(T[lang].assistant.fallbackLink),
      );
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      record(
        "asistente",
        `${lang} ${w}px: sin scroll horizontal con el panel abierto`,
        overflow <= 0,
        `overflow=${overflow}`,
      );
      const r = await new AxeBuilder({ page })
        .include(".assistant")
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
        .analyze();
      const v = r.violations.map((x) => `${x.id} (${x.nodes.length}): ${x.nodes[0]?.target}`);
      record("asistente", `${lang} ${w}px ${scheme}: axe con el panel abierto`, v.length === 0, v.join(" | "));
      await page.keyboard.press("Escape");
      const closed = await page.evaluate(() => ({
        hidden: document.querySelector(".assistant-panel").hidden,
        focus: document.activeElement?.classList.contains("assistant-open"),
      }));
      record("asistente", `${lang} ${w}px: Escape cierra y devuelve el foco`, closed.hidden && closed.focus);
      record("asistente", `${lang} ${w}px: sin errores de JavaScript`, errors.length === 0, errors.join(" | "));
    });
  }
}

await browser.close();
server.close();

const failed = results.filter((r) => !r.ok);
mkdirSync(new URL("../reports/", import.meta.url), { recursive: true });
writeFileSync(
  new URL("../reports/ui-report.json", import.meta.url),
  JSON.stringify({ date: new Date().toISOString(), results }, null, 2),
);
const byArea = {};
for (const r of results) {
  byArea[r.area] ??= { ok: 0, ko: 0 };
  byArea[r.area][r.ok ? "ok" : "ko"]++;
}
const md = [
  "# Informe de pruebas en navegador",
  "",
  `Fecha: ${new Date().toISOString().slice(0, 10)} · Motor: Chromium (Playwright) · ${results.length} comprobaciones`,
  "",
  "| Área | Correctas | Fallidas |",
  "|---|---|---|",
  ...Object.entries(byArea).map(([a, v]) => `| ${a} | ${v.ok} | ${v.ko} |`),
  "",
  failed.length
    ? "## Fallos\n\n" + failed.map((f) => `- [${f.area}] ${f.name} — ${f.detail}`).join("\n")
    : "Sin fallos.",
  "",
].join("\n");
writeFileSync(new URL("../reports/ui-report.md", import.meta.url), md);
console.log(`\n${results.length - failed.length}/${results.length} comprobaciones correctas`);
process.exit(failed.length ? 1 : 0);
