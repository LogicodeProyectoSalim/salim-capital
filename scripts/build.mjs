// Generador del sitio estático de Salim Capital.
// Uso: node scripts/build.mjs            → dist/ para publicar
//      node scripts/build.mjs --preview  → dist/ con enlaces a index.html (abrir con doble clic)
// Variables de entorno: BASE_PATH (por defecto "/"), usada solo por la página 404.
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const DIST = join(ROOT, "dist");
const PREVIEW = process.argv.includes("--preview");
const BASE_PATH = (process.env.BASE_PATH || "/").replace(/\/?$/, "/");

const site = JSON.parse(readFileSync(join(SRC, "data/site.json"), "utf8"));
const LANGS = site.languages;
const T = Object.fromEntries(LANGS.map((l) => [l, JSON.parse(readFileSync(join(SRC, `i18n/${l}.json`), "utf8"))]));
const MAP_SVG = readFileSync(join(SRC, "partials/map.svg"), "utf8").trim();
const MAP_POINTS = JSON.parse(readFileSync(join(SRC, "partials/map-points.json"), "utf8"));
const YEAR = new Date(site.legal.updated).getFullYear();
const warnings = new Set();
// Versión de los recursos para invalidar la caché al publicar cambios.
const LANGS_FOR_HASH = ["es", "en", "ar"];
const ASSET_V = createHash("sha256")
  .update(readFileSync(join(SRC, "css/site.css")))
  .update(readFileSync(join(SRC, "js/site.js")))
  .update(readFileSync(join(SRC, "js/assistant.js")))
  .update(LANGS_FOR_HASH.map((l) => readFileSync(join(SRC, `i18n/${l}.json`))).join(""))
  .digest("hex")
  .slice(0, 10);

// Orden de las secciones según las specs del cliente (1 a 10) y el menú pedido en W-50.
const NAV = ["home", "about", "philosophy", "experience", "services", "models", "partners", "faq", "contact"];
const PAGES = [...NAV, "careers", "legal", "privacy", "cookies"];
const FOOTER_NAV = ["careers", "legal", "privacy", "cookies"];

/* ---------- utilidades ---------- */
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
// Marcado mínimo en los textos: **negrita** y *cursiva*.
const md = (s) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<em>$2</em>");
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
const attr = (o) =>
  Object.entries(o)
    .filter(([, v]) => v !== false && v != null)
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${esc(v)}"`))
    .join("");
const sha256 = (s) => "sha256-" + createHash("sha256").update(s).digest("base64");

const pagePath = (lang, key) => {
  const slug = T[lang].routes[key];
  return slug ? `/${lang}/${slug}/` : `/${lang}/`;
};
// Enlace relativo entre dos rutas del sitio (funciona en cualquier subcarpeta, p. ej. GitHub Pages).
const rel = (from, to) => {
  const fromDir = from.endsWith("/") ? from : posix.dirname(from) + "/";
  let r = posix.relative(fromDir, to.replace(/\/$/, "") || "/");
  if (to.endsWith("/")) r = r ? r + "/" : "./";
  if (r === "") r = "./";
  if (PREVIEW && r.endsWith("/")) r += "index.html";
  return r;
};
const abs = (p) => site.siteUrl.replace(/\/$/, "") + p;

/* ---------- iconos y gráficos ---------- */
const ICONS = {
  digital:
    '<path d="M12 2.5 20.5 7.25v9.5L12 21.5 3.5 16.75v-9.5Z"/><path d="M12 7.5v9M9 9.5h4.25a1.75 1.75 0 0 1 0 3.5H9h4.75a1.75 1.75 0 0 1 0 3.5H9"/>',
  border:
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.75 5.6 3.75 9S14.5 18.4 12 21c-2.5-2.6-3.75-5.6-3.75-9S9.5 5.6 12 3Z"/>',
  legal:
    '<path d="M12 2.75 19.5 5.5v6c0 4.6-3.1 8.3-7.5 9.75C7.6 19.8 4.5 16.1 4.5 11.5v-6Z"/><path d="m8.75 12 2.25 2.25 4.25-4.5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  auto: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17Z" fill="currentColor"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/>',
  chat: '<path d="M4.5 5.5h15v10h-8l-4.5 3.5v-3.5h-2.5Z"/><path d="M8.5 9.5h7M8.5 12.5h4.5"/>',
};
const icon = (name, cls = "icon") =>
  `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;

const FLAGS = {
  es: '<svg class="flag" viewBox="0 0 3 2" aria-hidden="true" focusable="false"><rect width="3" height="2" fill="#AA151B"/><rect y=".5" width="3" height="1" fill="#F1BF00"/></svg>',
  en: '<svg class="flag" viewBox="0 0 60 30" aria-hidden="true" focusable="false"><rect width="60" height="30" fill="#012169"/><path d="M0 0l60 30M60 0 0 30" stroke="#fff" stroke-width="6"/><path d="M0 0l60 30M60 0 0 30" stroke="#C8102E" stroke-width="2"/><path d="M30 0v30M0 15h60" stroke="#fff" stroke-width="10"/><path d="M30 0v30M0 15h60" stroke="#C8102E" stroke-width="6"/></svg>',
  ar: '<svg class="flag" viewBox="0 0 12 6" aria-hidden="true" focusable="false"><rect width="12" height="6" fill="#00732F"/><rect y="2" width="12" height="2" fill="#fff"/><rect y="4" width="12" height="2" fill="#000"/><rect width="3" height="6" fill="#FF0000"/></svg>',
};

const MARKS = JSON.parse(readFileSync(join(SRC, "partials/marks.json"), "utf8"));
// Sello: disco, aro fino, iniciales (SC; سك en árabe) y la línea dorada del «puente».
const markSvg = (lang) =>
  `<svg class="mark" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><circle class="mark-disc" cx="60" cy="60" r="56"/><circle class="mark-ring" cx="60" cy="60" r="49"/><path class="mark-text" d="${lang === "ar" ? MARKS.ar : MARKS.sc}"/><path class="mark-bridge" d="M30 84H90"/><circle class="mark-node" cx="30" cy="84" r="2.6"/><circle class="mark-node" cx="90" cy="84" r="2.6"/></svg>`;
const MARK = markSvg("es");

// El mapa es geográfico: España siempre a la izquierda y el Golfo a la derecha, también en árabe (W-73).
function mapWithLabels(lang) {
  const t = T[lang];
  const [mx, my] = MAP_POINTS.madrid;
  const [dx, dy] = MAP_POINTS.dubai;
  const labels = `<text class="map-label" x="${mx + 14}" y="${my + 30}" text-anchor="start" lang="${lang}">${esc(t.ui.mapWest)}</text><text class="map-label" x="${dx - 14}" y="${dy + 34}" text-anchor="end" lang="${lang}">${esc(t.ui.mapEast)}</text>`;
  return MAP_SVG.replace("</svg>", `  ${labels}\n</svg>`);
}

/* ---------- scripts en línea (con hash para la CSP) ---------- */
const THEME_INIT = `(function(){var d=document.documentElement;d.classList.add("js");try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark"){d.setAttribute("data-theme",t);var m=document.querySelectorAll('meta[name="theme-color"]');for(var i=0;i<m.length;i++)m[i].setAttribute("content",t==="dark"?"${site.theme.dark}":"${site.theme.light}")}}catch(e){}})();`;

const endpointOrigin = site.form.endpoint ? new URL(site.form.endpoint).origin : "";
const csp = (inlineScripts) =>
  [
    "default-src 'self'",
    `script-src 'self' ${inlineScripts.map((s) => `'${sha256(s)}'`).join(" ")}`,
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self'${endpointOrigin ? " " + endpointOrigin : ""}`,
    `form-action 'self'${endpointOrigin ? " " + endpointOrigin : ""}`,
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");

/* ---------- plantilla común ---------- */
function head({ lang, title, description, path, alternates, extraScripts = [] }) {
  const t = T[lang];
  const assets = rel(path, "/assets/");
  const alt = alternates
    ? alternates.map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${esc(abs(a.path))}">`).join("\n")
    : "";
  return `<!doctype html>
<html lang="${lang}" dir="${t.meta.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="${site.theme.light}">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="${site.theme.dark}">
<script>${THEME_INIT}</script>
${PREVIEW ? "" : `<meta http-equiv="Content-Security-Policy" content="${esc(csp([THEME_INIT, ...extraScripts]))}">`}
<meta name="referrer" content="strict-origin-when-cross-origin">
<link rel="canonical" href="${esc(abs(path))}">
${alt}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Salim Capital">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(abs(path))}">
<meta property="og:locale" content="${{ es: "es_ES", en: "en_GB", ar: "ar_AE" }[lang]}">
<meta property="og:image" content="${esc(abs(`/assets/og/og-${lang}.png`))}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${rel(path, lang === "ar" ? "/favicon-ar.svg" : "/favicon.svg")}" type="image/svg+xml">
<link rel="preload" href="${assets}fonts/${lang === "ar" ? "ibm-plex-sans-arabic-arabic-400-normal.woff2" : "instrument-sans-latin-400-normal.woff2"}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${assets}css/site.css?v=${ASSET_V}">
<script src="${assets}js/site.js?v=${ASSET_V}" defer></script>
<script src="${assets}js/assistant.js?v=${ASSET_V}" defer></script>
</head>`;
}

function langSwitch(lang, key, path, where) {
  const t = T[lang];
  const id = `lang-list-${where}`;
  const items = LANGS.map((l) => {
    const target = pagePath(l, key);
    const current = l === lang;
    return `<li><a href="${rel(path, target)}" lang="${l}" hreflang="${l}" data-lang="${l}"${current ? ' aria-current="true"' : ""}>${FLAGS[l]}<span class="vh">${esc(T[l].meta.name)}</span></a></li>`;
  }).join("");
  if (where === "footer") {
    const text = LANGS.map((l) => {
      const current = l === lang;
      return `<li><a href="${rel(path, pagePath(l, key))}" lang="${l}" hreflang="${l}" data-lang="${l}"${current ? ' aria-current="true"' : ""}>${FLAGS[l]}<span>${esc(T[l].meta.name)}</span></a></li>`;
    }).join("");
    return `<nav class="foot-lang" aria-label="${esc(t.ui.langLabel)}"><ul>${text}</ul></nav>`;
  }
  return `<div class="lang" data-lang-switch>
  <button type="button" class="lang-toggle" aria-expanded="false" aria-controls="${id}" aria-label="${esc(t.ui.langCurrent)}">${FLAGS[lang]}${icon("chevron", "icon icon--sm")}</button>
  <ul class="lang-list" id="${id}">${items}</ul>
</div>`;
}

function header(lang, key, path) {
  const t = T[lang];
  const links = NAV.map((k) => {
    const target = pagePath(lang, k);
    return `<li><a href="${rel(path, target)}"${k === key ? ' aria-current="page"' : ""}>${esc(t.nav[k])}</a></li>`;
  }).join("");
  return `<a class="skip" href="#main">${esc(t.ui.skip)}</a>
<header class="site-header" data-header>
  <div class="wrap bar">
    <a class="brand" href="${rel(path, pagePath(lang, "home"))}" aria-label="${esc(t.ui.homeLink)}">${markSvg(lang)}<span class="brand-name">${esc(t.meta.siteName)}</span></a>
    <div class="bar-actions">
      ${langSwitch(lang, key, path, "header")}
      <a class="btn btn--on-brand bar-cta" href="${rel(path, pagePath(lang, "contact"))}">${esc(t.ui.cta)}</a>
      <button type="button" class="menu-btn" aria-expanded="false" aria-controls="site-nav" data-label-open="${esc(t.ui.menuOpen)}" data-label-close="${esc(t.ui.menuClose)}">${icon("menu", "icon icon-open")}${icon("close", "icon icon-close")}<span class="menu-btn-text">${esc(t.ui.menu)}</span><span class="vh menu-btn-sr">${esc(t.ui.menuOpen)}</span></button>
    </div>
  </div>
  <nav class="site-nav" id="site-nav" aria-label="${esc(t.ui.mainNav)}">
    <div class="wrap"><ul>${links}</ul></div>
  </nav>
</header>`;
}

function footer(lang, key, path) {
  const t = T[lang];
  const secondary = FOOTER_NAV.map(
    (k) =>
      `<li><a href="${rel(path, pagePath(lang, k))}"${k === key ? ' aria-current="page"' : ""}>${esc(t.nav[k])}</a></li>`,
  ).join("");
  const main = NAV.map(
    (k) =>
      `<li><a href="${rel(path, pagePath(lang, k))}"${k === key ? ' aria-current="page"' : ""}>${esc(t.nav[k])}</a></li>`,
  ).join("");
  const opt = (v, ic, label) =>
    `<label class="theme-opt"><input type="radio" name="theme" value="${v}"${v === "auto" ? " checked" : ""}>${icon(ic)}<span>${esc(label)}</span></label>`;
  return `<footer class="site-footer">
  <div class="wrap foot-grid">
    <div class="foot-brand">
      <p class="foot-name">${markSvg(lang)}<span>${esc(t.meta.siteName)}</span></p>
      <p class="foot-tagline">${esc(t.meta.tagline)}</p>
      <p><a class="foot-mail" href="mailto:${site.email.contact}" dir="ltr">${icon("mail")}<span>${site.email.contact}</span></a></p>
    </div>
    <nav class="foot-nav" aria-label="${esc(t.ui.footerNav)}">
      <ul>${main}</ul>
      <ul>${secondary}</ul>
    </nav>
    <div class="foot-prefs">
      ${langSwitch(lang, key, path, "footer")}
      <fieldset class="theme-switch" data-theme-switch>
        <legend>${esc(t.ui.themeLegend)}</legend>
        <div class="theme-opts">${opt("auto", "auto", t.ui.themeAuto)}${opt("light", "sun", t.ui.themeLight)}${opt("dark", "moon", t.ui.themeDark)}</div>
      </fieldset>
    </div>
  </div>
  <div class="wrap foot-legal"><p>${esc(fill(t.ui.copyright, { year: YEAR }))}</p></div>
</footer>`;
}

function jsStrings(lang) {
  const t = T[lang];
  const data = {
    menuOpen: t.ui.menuOpen,
    menuClose: t.ui.menuClose,
    themeAutoNowLight: t.ui.themeAutoNowLight,
    themeAutoNowDark: t.ui.themeAutoNowDark,
    themeAuto: t.ui.themeAuto,
    themeColors: site.theme,
    errors: Object.fromEntries(
      Object.entries(t.form.errors).map(([k, v]) => [k, fill(v, { email: site.email.contact })]),
    ),
    sending: t.form.sending,
    submit: t.form.submit,
    form: site.form,
  };
  return `<script type="application/json" id="i18n-js">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

/* ---------- Asistente de preguntas (sin IA): base de conocimiento por idioma ---------- */
// Se genera a partir de los mismos textos del cliente que muestran las páginas, así el asistente
// nunca dice nada distinto de la web. Las respuestas propias del asistente están en `assistant.intents`.
const plain = (s) => String(s).replace(/\*\*?/g, "");
const site_path = (lang, key, hash = "") => pagePath(lang, key).replace(/^\//, "") + (hash ? `#${hash}` : "");
function assistantKB(lang) {
  const t = T[lang];
  const p = t.pages;
  const a = t.assistant;
  const docs = [];
  const add = (title, text, url, weight = 1) =>
    docs.push({ t: plain(title).replace(/:$/, ""), a: text, u: url, w: weight });
  add(p.home.h1, `${p.home.intro1} ${p.home.intro2}`, site_path(lang, "home"));
  p.home.give.forEach((g) => add(g.t, g.p, site_path(lang, "home")));
  add(p.home.giveTitle, p.home.mission, site_path(lang, "home"), 0.6);
  p.about.blocks.forEach((b) => b.forEach((para) => add(p.about.h1, para, site_path(lang, "about"), 0.7)));
  p.philosophy.intro.forEach((x) => add(p.philosophy.h1, x, site_path(lang, "philosophy"), 0.7));
  p.philosophy.principles.forEach((x) => add(x.t, x.p, site_path(lang, "philosophy")));
  p.experience.profiles.forEach((x) => add(x.t, x.p, site_path(lang, "experience")));
  p.services.groups.forEach((g) => g.items.forEach((x) => add(x.t, x.p, site_path(lang, "services"))));
  p.models.list.forEach((m) => {
    const L = p.models.labels;
    const inc = m.includes.map((i) => plain(`${i.t} ${i.p}`).trim()).join(" · ");
    add(
      `${m.letter} ${m.t}`,
      `**${L.focus}** ${m.focus} **${L.ideal}** ${m.ideal} **${L.includes}** ${inc} **${L.result}** ${m.result}`,
      site_path(lang, "models", m.id),
    );
  });
  p.partners.groups.forEach((g) => g.items.forEach((x) => add(x.t, x.p, site_path(lang, "partners"))));
  p.faq.blocks.forEach((b) => b.qs.forEach((q) => add(q.q, q.a, site_path(lang, "faq", q.id), 1.4)));
  add(p.careers.h1, fill(p.careers.text, { email: site.email.careers }), site_path(lang, "careers"));
  add(p.contact.lead, p.contact.intro, site_path(lang, "contact"), 0.8);
  const refs = {
    contactNext: p.contact.asideNext.join(" "),
    careers: fill(p.careers.text, { email: site.email.careers }),
    who: p.home.intro1,
    services: `${a.servicesIntro} ${p.services.groups.map((g) => `**${plain(g.t)}** ${g.s}: ${g.items.map((x) => plain(x.t).replace(/:$/, "")).join(" · ")}.`).join(" ")}`,
    models: `${a.modelsIntro} ${p.models.list.map((m) => `**${m.letter} ${plain(m.t)}:** ${m.focus}`).join(" ")}`,
  };
  const intents = a.intents.map((i) => ({
    id: i.id,
    k: i.keywords,
    a: i.ref ? refs[i.ref] : fill(i.answer, { email: site.email.contact }),
    u: i.link ? site_path(lang, i.link) : "",
  }));
  return { docs, intents, synonyms: a.synonyms, contact: site_path(lang, "contact") };
}

function assistant(lang, path) {
  const a = T[lang].assistant;
  const strings = {
    readMore: a.readMore,
    related: a.related,
    fallback: a.fallback,
    fallbackLink: a.fallbackLink,
    you: a.you,
    bot: a.bot,
    loadError: a.loadError,
  };
  const root = rel(path, "/").replace(/index\.html$/, "");
  const kbUrl = rel(path, `/assets/kb/kb-${lang}.json`) + `?v=${ASSET_V}`;
  return `<div class="assistant" data-assistant data-root="${esc(root)}" data-kb="${esc(kbUrl)}"${PREVIEW ? " data-preview" : ""} hidden>
  <button type="button" class="assistant-open" aria-expanded="false" aria-controls="assistant-panel" aria-label="${esc(a.openLabel)}">${icon("chat")}<span>${esc(a.open)}</span></button>
  <section class="assistant-panel" id="assistant-panel" role="dialog" aria-modal="false" aria-labelledby="assistant-title" hidden>
    <div class="assistant-head">
      <h2 id="assistant-title">${esc(a.title)}</h2>
      <button type="button" class="assistant-close" aria-label="${esc(a.close)}">${icon("close")}</button>
    </div>
    <div class="assistant-log" role="log" aria-live="polite" aria-relevant="additions" tabindex="0" aria-label="${esc(a.title)}">
      <div class="assistant-msg assistant-msg--bot"><p>${esc(a.intro)}</p></div>
    </div>
    <p class="assistant-disclaimer">${esc(a.disclaimer)}</p>
    <div class="assistant-suggestions" role="group" aria-label="${esc(a.suggestionsLabel)}">${a.suggestions.map((q) => `<button type="button" class="assistant-chip">${esc(q)}</button>`).join("")}</div>
    <form class="assistant-form" novalidate>
      <label class="vh" for="assistant-input">${esc(a.inputLabel)}</label>
      <input id="assistant-input" type="text" autocomplete="off" maxlength="300" enterkeyhint="send" placeholder="${esc(a.placeholder)}">
      <button type="submit" class="assistant-send" aria-label="${esc(a.send)}">${icon("arrow", "icon icon--dir")}</button>
    </form>
  </section>
  <script type="application/json" class="assistant-strings">${JSON.stringify(strings).replace(/</g, "\\u003c")}</script>${PREVIEW ? `\n  <script type="application/json" class="assistant-kb">${JSON.stringify(assistantKB(lang)).replace(/</g, "\\u003c")}</script>` : ""}
</div>`;
}

function pageEnd(lang, key, path) {
  const t = T[lang];
  const i = NAV.indexOf(key);
  const nextKey = i >= 0 && i < NAV.length - 2 ? NAV[i + 1] : null;
  if (key === "contact") return "";
  const next = nextKey
    ? `<a class="next-link" href="${rel(path, pagePath(lang, nextKey))}"><span class="next-label">${esc(t.ui.nextLabel)}</span><span class="next-title">${esc(t.nav[nextKey])}</span>${icon("arrow", "icon icon--dir")}</a>`
    : "";
  return `<section class="page-end" aria-labelledby="end-title">
  <div class="wrap page-end-grid">
    <div class="page-end-cta">
      <h2 id="end-title">${esc(t.ui.endTitle)}</h2>
      <p>${esc(t.ui.endText)}</p>
      <a class="btn btn--primary" href="${rel(path, pagePath(lang, "contact"))}">${esc(t.ui.ctaLong)}</a>
    </div>
    ${next}
  </div>
</section>`;
}

function layout(lang, key, main, { extraHead = "" } = {}) {
  const t = T[lang];
  const path = pagePath(lang, key);
  const p = t.pages[key] || t.legal[{ legal: "legalNotice", privacy: "privacyPolicy", cookies: "cookiesPolicy" }[key]];
  const alternates = [
    ...LANGS.map((l) => ({ lang: l, path: pagePath(l, key) })),
    { lang: "x-default", path: key === "home" ? "/" : pagePath(site.defaultLanguage, key) },
  ];
  return `${head({ lang, title: p.title, description: p.description, path, alternates })}
<body class="page-${key}">
${header(lang, key, path)}
<main id="main" tabindex="-1">
${main}
${pageEnd(lang, key, path)}
</main>
${footer(lang, key, path)}
${assistant(lang, path)}
${extraHead}${jsStrings(lang)}
</body>
</html>
`;
}

const pageHead = (h1, lead, cls = "") =>
  `<div class="page-head ${cls}"><div class="wrap"><h1>${md(h1)}</h1>${lead ? `<p class="page-lead">${md(lead)}</p>` : ""}</div></div>`;

/* ---------- páginas ---------- */
const render = {
  home(lang, path) {
    const p = T[lang].pages.home;
    const t = T[lang];
    const icons = ["digital", "border", "legal"];
    return `<section class="hero">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <h1>${md(p.h1)}</h1>
      <p class="hero-intro">${md(p.intro1)}</p>
      <div class="actions">
        <a class="btn btn--primary btn--lg" href="${rel(path, pagePath(lang, "contact"))}">${esc(t.ui.ctaLong)}</a>
        <a class="btn btn--ghost btn--lg" href="${rel(path, pagePath(lang, "about"))}">${esc(t.nav.about)}</a>
      </div>
    </div>
    <figure class="hero-map" dir="ltr">
      <div class="map-frame">${mapWithLabels(lang)}</div>
      <figcaption lang="${lang}" dir="${t.meta.dir}">${esc(t.ui.mapCaption)}</figcaption>
    </figure>
  </div>
</section>
<section class="section section--tight">
  <div class="wrap"><p class="statement">${md(p.intro2)}</p></div>
</section>
<section class="section section--surface" aria-labelledby="give-title">
  <div class="wrap">
    <h2 id="give-title">${md(p.giveTitle)}</h2>
    <ul class="pillars">
      ${p.give.map((g, i) => `<li class="pillar">${icon(icons[i], "icon icon--lg")}<h3>${md(g.t.replace(/:$/, ""))}</h3><p>${md(g.p)}</p></li>`).join("\n      ")}
    </ul>
    <blockquote class="mission"><p>${md(p.mission)}</p></blockquote>
  </div>
</section>`;
  },

  about(lang) {
    const p = T[lang].pages.about;
    return `${pageHead(p.h1, p.lead)}
<section class="section">
  <div class="wrap prose">
    ${p.blocks.map((b) => `<div class="prose-block">${b.map((para) => `<p>${md(para)}</p>`).join("")}</div>`).join("\n    ")}
  </div>
</section>`;
  },

  philosophy(lang) {
    const p = T[lang].pages.philosophy;
    return `${pageHead(p.h1)}
<section class="section">
  <div class="wrap prose">
    ${p.intro.map((x) => `<p>${md(x)}</p>`).join("")}
    <ol class="principles">
      ${p.principles.map((x) => `<li><h2 class="principle-title">${md(x.t.replace(/:$/, ""))}</h2><p>${md(x.p)}</p></li>`).join("\n      ")}
    </ol>
    <blockquote class="mission"><p>${md(p.closing)}</p></blockquote>
  </div>
</section>`;
  },

  experience(lang) {
    const p = T[lang].pages.experience;
    return `${pageHead(p.h1)}
<section class="section">
  <div class="wrap">
    <p class="intro-em prose">${md(p.intro)}</p>
    <div class="profiles">
      ${p.profiles.map((x) => `<article class="profile"><h2>${md(x.t)} <span class="profile-sub">${md(x.s)}</span></h2><p>${md(x.p)}</p></article>`).join("\n      ")}
    </div>
  </div>
</section>`;
  },

  services(lang, path) {
    const t = T[lang];
    const p = t.pages.services;
    const models = Object.fromEntries(t.pages.models.list.map((m) => [m.id, m.t]));
    const icons = ["digital", "border", "legal"];
    return `${pageHead(p.h1)}
<div class="services">
${p.groups
  .map(
    (g, gi) => `<section class="section service-group" aria-labelledby="sg-${gi}">
  <div class="wrap service-grid">
    <div class="service-head">
      ${icon(icons[gi], "icon icon--lg")}
      <h2 id="sg-${gi}">${md(g.t)} <span class="group-sub">${md(g.s)}</span></h2>
    </div>
    <ul class="service-list">
      ${g.items
        .map(
          (it) => `<li class="service">
        <h3>${md(it.t.replace(/:$/, ""))}</h3>
        <p>${md(it.p)}</p>
        <p class="included">${esc(t.ui.includedIn)} ${it.models
          .map((m) => `<a href="${rel(path, pagePath(lang, "models"))}#${m}">${esc(models[m])}</a>`)
          .join(", ")}</p>
      </li>`,
        )
        .join("\n      ")}
    </ul>
  </div>
</section>`,
  )
  .join("\n")}
</div>`;
  },

  models(lang, path) {
    const t = T[lang];
    const p = t.pages.models;
    const L = p.labels;
    const contact = rel(path, pagePath(lang, "contact"));
    return `${pageHead(p.h1, p.lead)}
<section class="section">
  <div class="wrap models">
    ${p.list
      .map(
        (
          m,
        ) => `<article class="model${m.id === "bridge" ? " model--featured" : ""}" id="${m.id}" aria-labelledby="m-${m.id}">
      <div class="model-main">
        ${m.id === "bridge" ? `<p class="badge">${esc(t.ui.recommended)}</p>` : ""}
        <h2 id="m-${m.id}"><span class="model-letter">${esc(m.letter)}</span> ${md(m.t)}</h2>
        <p class="model-row"><strong>${esc(L.focus)}</strong> ${md(m.focus)}</p>
        <p class="model-row"><strong>${esc(L.ideal)}</strong> ${md(m.ideal)}</p>
        <a class="btn btn--primary" href="${contact}?model=${m.id}">${esc(p.request)}<span class="vh">: ${esc(m.t)}</span></a>
      </div>
      <div class="model-detail">
        <h3 class="model-label">${esc(L.includes)}</h3>
        <ul class="checks">
          ${m.includes.map((x) => `<li>${x.t ? `<strong>${md(x.t)}</strong>` : ""}${x.t && x.p ? " " : ""}${md(x.p)}</li>`).join("\n          ")}
        </ul>
        <p class="model-result"><strong>${esc(L.result)}</strong> ${md(m.result)}</p>
      </div>
    </article>`,
      )
      .join("\n    ")}
  </div>
</section>
<section class="section section--surface" aria-labelledby="how-title">
  <div class="wrap">
    <h2 id="how-title">${esc(p.howTitle)}</h2>
    <ol class="steps">
      ${p.how.map((s) => `<li class="step"><h3>${md(s.t)}</h3><p>${md(s.p)}</p></li>`).join("\n      ")}
    </ol>
  </div>
</section>`;
  },

  partners(lang) {
    const p = T[lang].pages.partners;
    return `${pageHead(p.h1)}
<section class="section">
  <div class="wrap">
    <p class="intro-em prose">${md(p.intro)}</p>
    <ol class="partner-groups">
      ${p.groups
        .map(
          (g, gi) => `<li class="partner-group">
        <h2><span class="group-num">${gi + 1}.</span> ${md(g.t)} <span class="group-sub">${md(g.s)}</span></h2>
        <ul class="partner-list">
          ${g.items.map((it) => `<li><h3>${md(it.t.replace(/:$/, ""))}</h3><p>${md(it.p)}</p></li>`).join("\n          ")}
        </ul>
      </li>`,
        )
        .join("\n      ")}
    </ol>
  </div>
</section>`;
  },

  faq(lang) {
    const p = T[lang].pages.faq;
    return `${pageHead(p.h1, p.lead)}
<section class="section">
  <div class="wrap faq">
    ${p.blocks
      .map(
        (b, bi) => `<section class="faq-block" aria-labelledby="fb-${bi}">
      <h2 id="fb-${bi}">${md(b.t)}</h2>
      ${b.qs
        .map(
          (q) => `<details class="faq-item" id="${q.id}" name="faq">
        <summary>${md(q.q)}${icon("chevron", "icon icon--sm faq-icon")}</summary>
        <div class="faq-answer"><p>${md(q.a)}</p><p class="permalink"><a href="#${q.id}">${esc(p.permalink)}</a></p></div>
      </details>`,
        )
        .join("\n      ")}
    </section>`,
      )
      .join("\n    ")}
  </div>
</section>`;
  },

  contact(lang, path) {
    const t = T[lang];
    const p = t.pages.contact;
    const f = t.form;
    const email = site.email.contact;
    const privacyHref = rel(path, pagePath(lang, "privacy"));
    const privacyLink = `<a href="${privacyHref}">${esc(f.privacyLinkText)}</a>`;
    const req = `<span class="req" aria-hidden="true">*</span><span class="vh"> (${esc(f.required)})</span>`;
    const field = ({ id, label, type = "text", required = false, note, inputAttrs = {} }) => {
      const desc = [note ? `${id}-note` : null, `${id}-error`].filter(Boolean).join(" ");
      return `<div class="field" data-field="${id}">
          <label for="${id}">${esc(label)}${required ? req : ""}</label>
          ${note ? `<p class="field-note" id="${id}-note">${esc(note)}</p>` : ""}
          <input id="${id}" name="${id}" type="${type}"${attr({ required, "aria-describedby": desc, ...inputAttrs })}>
          <p class="field-error" id="${id}-error" hidden></p>
        </div>`;
    };
    const select = ({
      id,
      label,
      options,
      required = false,
      values,
      extra = "",
    }) => `<div class="field" data-field="${id}">
          <label for="${id}">${esc(label)}${required ? req : ""}</label>
          <select id="${id}" name="${id}"${attr({ required, "aria-describedby": `${id}-error` })}>
            ${extra || `<option value="">${esc(f.choose)}</option>`}
            ${options.map((o, i) => `<option value="${esc(values ? values[i] : o)}">${esc(o)}</option>`).join("\n            ")}
          </select>
          <p class="field-error" id="${id}-error" hidden></p>
        </div>`;
    const group = ({
      id,
      legend,
      type,
      options,
      values,
      required = false,
    }) => `<fieldset class="field field--group" data-field="${id}"${attr({ "aria-describedby": `${id}-error` })}>
          <legend>${md(legend)}${required ? req : ""}</legend>
          ${options
            .map(
              (o, i) =>
                `<label class="choice"><input type="${type}" id="${id}-${i}" name="${id}" value="${esc(values[i])}"${required && type === "radio" && i === 0 ? " required" : ""}><span>${md(o)}</span></label>`,
            )
            .join("\n          ")}
          <p class="field-error" id="${id}-error" hidden></p>
        </fieldset>`;
    const modelOpts = t.pages.models.list.map((m) => m.t.replace(/[“”«»]/g, ""));
    return `${pageHead(p.h1, p.lead)}
<section class="section section--flush">
  <div class="wrap contact-grid">
    <div class="contact-main">
      <p class="intro-em">${md(p.intro)}</p>
      <noscript><p class="notice">${fill(esc(t.ui.noscript), { email: `<a href="mailto:${email}" dir="ltr">${email}</a>` })}</p></noscript>
      <div class="form-errors" id="form-errors" tabindex="-1" hidden>
        <h2>${icon("alert")}${esc(f.errorsTitle)}</h2>
        <ul></ul>
      </div>
      <p class="form-status" id="form-status" role="status"></p>
      <form class="request-form" id="request-form" method="post" novalidate${attr({ action: site.form.endpoint || false })} data-endpoint="${esc(site.form.endpoint)}">
        <input type="hidden" name="language" value="${lang}">
        <input type="hidden" name="_subject" value="Salim Capital – solicitud (${lang})">
        <div class="hp" aria-hidden="true">
          <label for="website">${esc(f.honeypot)}</label>
          <input type="text" id="website" name="website" tabindex="-1" autocomplete="off">
        </div>
        <fieldset class="form-section">
          <legend>${esc(f.legendData)}</legend>
          <div class="field-row">
            ${field({ id: "name", label: f.name, required: true, inputAttrs: { autocomplete: "name", maxlength: 120 } })}
            ${field({ id: "email", label: f.email, type: "email", required: true, note: f.emailNote, inputAttrs: { autocomplete: "email", inputmode: "email", dir: "ltr", maxlength: 160, spellcheck: "false" } })}
          </div>
          <div class="field-row">
            ${field({ id: "phone", label: f.phone, type: "tel", note: f.phoneNote, inputAttrs: { autocomplete: "tel", inputmode: "tel", dir: "ltr", maxlength: 24 } })}
            ${select({ id: "channel", label: f.channel, options: f.channelOptions, values: ["whatsapp", "signal", "telegram", "email"], required: true })}
          </div>
          <div class="field-row">
            ${select({ id: "residence", label: f.residence, options: f.residenceOptions, values: ["ae", "qa", "sa", "es", "other"], required: true })}
            ${field({ id: "nationality", label: f.nationality, required: true, inputAttrs: { maxlength: 80 } })}
          </div>
        </fieldset>
        <fieldset class="form-section">
          <legend>${esc(f.legendProfile)}</legend>
          <div class="field-row">
            ${select({ id: "model", label: f.model, options: modelOpts, values: t.pages.models.list.map((m) => m.id), extra: `<option value="unsure">${esc(f.modelUnsure)}</option>` })}
            ${select({ id: "volume", label: f.volume, options: f.volumeOptions, values: ["500k-1m", "1m-5m", "5m-20m", "20m+"], required: true })}
          </div>
          ${group({ id: "assets", legend: f.assets, type: "checkbox", options: f.assetOptions, values: ["re-mena", "re-eu", "traditional", "companies"] })}
          ${group({ id: "goal", legend: f.goal, type: "radio", options: f.goalOptions, values: ["relocation", "diversification", "protection", "management"], required: true })}
          ${group({ id: "urgency", legend: f.urgency, type: "radio", options: f.urgencyOptions, values: ["immediate", "quarterly", "long-term"], required: true })}
          <div class="field" data-field="message">
            <label for="message">${esc(f.message)}</label>
            <textarea id="message" name="message" rows="6" maxlength="3000" aria-describedby="message-error"></textarea>
            <p class="field-error" id="message-error" hidden></p>
          </div>
        </fieldset>
        <div class="privacy-box">
          <h2>${esc(f.privacyInfoTitle)}</h2>
          <dl>
            ${f.privacyInfo.map((x) => `<div><dt>${esc(x.t)}</dt><dd>${fill(esc(x.p), { email: `<a href="mailto:${site.email.privacy}" dir="ltr">${site.email.privacy}</a>` })}</dd></div>`).join("\n            ")}
          </dl>
          <p>${fill(esc(f.privacyMore), { link: privacyLink })}</p>
          <div class="field" data-field="consent">
            <label class="choice"><input type="checkbox" id="consent" name="consent" value="yes" required aria-describedby="consent-error"><span>${fill(esc(f.consent), { link: privacyLink })}${req}</span></label>
            <p class="field-error" id="consent-error" hidden></p>
          </div>
        </div>
        <button type="submit" class="btn btn--primary btn--lg">${esc(f.submit)}</button>
      </form>
      <div class="form-success" id="form-success" tabindex="-1" hidden>
        <h2>${esc(f.successTitle)}</h2>
        <p>${esc(f.success)}</p>
      </div>
    </div>
    <aside class="contact-aside" aria-label="${esc(p.asideNextTitle)}">
      <section>
        <h2>${esc(p.asideNextTitle)}</h2>
        <ol class="mini-steps">${p.asideNext.map((x) => `<li>${md(x)}</li>`).join("")}</ol>
      </section>
      <section>
        <h2>${icon("lock")}${esc(p.asideNdaTitle)}</h2>
        <p>${md(p.asideNda)}</p>
      </section>
      <section>
        <h2>${icon("mail")}${esc(p.asideAltTitle)}</h2>
        <p>${esc(p.asideAlt)} <a href="mailto:${email}" dir="ltr">${email}</a></p>
      </section>
    </aside>
  </div>
</section>`;
  },

  careers(lang) {
    const p = T[lang].pages.careers;
    const email = site.email.careers;
    return `${pageHead(p.h1)}
<section class="section">
  <div class="wrap prose"><p>${fill(esc(p.text), { email: `<a href="mailto:${email}" dir="ltr">${email}</a>` })}</p></div>
</section>`;
  },
};

function legalPage(lang, key) {
  const t = T[lang];
  const doc = t.legal[{ legal: "legalNotice", privacy: "privacyPolicy", cookies: "cookiesPolicy" }[key]];
  const value = (f) => {
    if (f === "email") return `<a href="mailto:${site.email.privacy}" dir="ltr">${site.email.privacy}</a>`;
    const v = site.legal[f];
    if (v == null || v === "") {
      warnings.add(`legal.${f}`);
      return `<span class="pending">${esc(t.legal.pending)}</span>`;
    }
    return esc(v);
  };
  return `${pageHead(doc.h1)}
<section class="section">
  <div class="wrap prose legal">
    <p class="notice">${esc(t.legal.draftNotice)}</p>
    ${doc.sections
      .map(
        (s) => `<section>
      <h2>${esc(s.h)}</h2>
      ${(s.p || []).map((x) => `<p>${md(x)}</p>`).join("")}
      ${s.fields ? `<dl class="legal-fields">${s.fields.map((f) => `<div><dt>${esc(t.legal.fields[f])}</dt><dd>${value(f)}</dd></div>`).join("")}</dl>` : ""}
    </section>`,
      )
      .join("\n    ")}
    <p class="updated">${esc(t.legal.updated)} <time datetime="${site.legal.updated}">${site.legal.updated}</time></p>
  </div>
</section>`;
}

/* ---------- páginas especiales ---------- */
function rootPage() {
  const path = "/";
  const choose = LANGS.map(
    (l) =>
      `<li><a href="${rel(path, pagePath(l, "home"))}" lang="${l}" hreflang="${l}" data-lang="${l}">${FLAGS[l]}<span>${esc(T[l].meta.name)}</span></a></li>`,
  ).join("");
  const targets = Object.fromEntries(LANGS.map((l) => [l, rel(path, pagePath(l, "home"))]));
  const redirect = `(function(){var t=${JSON.stringify(targets)},l=null;try{l=localStorage.getItem("lang")}catch(e){}if(!t[l]){var n=(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||""]);l="${site.defaultLanguage}";for(var i=0;i<n.length;i++){var c=String(n[i]).toLowerCase().slice(0,2);if(c==="ar"||c==="es"){l=c;break}if(c==="en"){l="en";break}}}location.replace(t[l])})();`;
  const alternates = [...LANGS.map((l) => ({ lang: l, path: pagePath(l, "home") })), { lang: "x-default", path: "/" }];
  return `${head({ lang: "en", title: "Salim Capital", description: T.en.pages.home.description, path, alternates, extraScripts: [redirect] })}
<body class="page-root">
<main id="main" class="root-choose">
  <p class="root-brand">${MARK}<span>Salim Capital</span></p>
  <ul class="root-langs">${choose}</ul>
</main>
<script>${redirect}</script>
</body>
</html>
`;
}

function notFoundPage() {
  // GitHub Pages sirve 404.html en cualquier ruta: enlaces absolutos con BASE_PATH.
  const base = PREVIEW ? "./" : BASE_PATH;
  const blocks = LANGS.map((l) => {
    const p = T[l].pages.notFound;
    return `<section class="nf" lang="${l}" dir="${T[l].meta.dir}"><h${l === "es" ? 1 : 2}>${esc(p.h1)}</h${l === "es" ? 1 : 2}><p>${esc(p.text)}</p><p><a class="btn btn--primary" href="${base}${l}/${PREVIEW ? "index.html" : ""}">${esc(p.back)}</a></p></section>`;
  }).join("\n");
  const fixedHead = head({
    lang: "es",
    title: T.es.pages.notFound.title,
    description: T.es.pages.notFound.text,
    path: "/404.html",
  })
    .replace(/href="(?!https?:|mailto:|#)([^"]*?)(assets\/|favicon(?:-ar)?\.svg)/g, `href="${base}$2`)
    .replace(/src="(?!https?:)([^"]*?)assets\//g, `src="${base}assets/`);
  return `${fixedHead.replace(/<link rel="canonical"[^>]*>\n/, '<meta name="robots" content="noindex">\n')}
<body class="page-404">
<main id="main" class="nf-wrap">
  <p class="root-brand">${MARK}<span>Salim Capital</span></p>
  ${blocks}
</main>
</body>
</html>
`;
}

function sitemap() {
  const urls = PAGES.flatMap((key) =>
    LANGS.map((l) => {
      const alts = LANGS.map(
        (a) => `    <xhtml:link rel="alternate" hreflang="${a}" href="${abs(pagePath(a, key))}"/>`,
      ).join("\n");
      return `  <url>\n    <loc>${abs(pagePath(l, key))}</loc>\n${alts}\n  </url>`;
    }),
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
}

/* ---------- escritura ---------- */
function write(p, content) {
  const file = join(DIST, p.endsWith("/") ? p + "index.html" : p);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

for (const lang of LANGS) {
  for (const key of PAGES) {
    const path = pagePath(lang, key);
    const main = render[key] ? render[key](lang, path) : legalPage(lang, key);
    write(path, layout(lang, key, main));
  }
}
write("/index.html", rootPage());
write("/404.html", notFoundPage());
write("/sitemap.xml", sitemap());
write("/robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${abs("/sitemap.xml")}\n`);

// Recursos estáticos
cpSync(join(SRC, "css"), join(DIST, "assets/css"), { recursive: true });
cpSync(join(SRC, "js"), join(DIST, "assets/js"), { recursive: true });
cpSync(join(SRC, "static"), DIST, { recursive: true });
mkdirSync(join(DIST, "assets/kb"), { recursive: true });
for (const lang of LANGS) writeFileSync(join(DIST, `assets/kb/kb-${lang}.json`), JSON.stringify(assistantKB(lang)));
if (existsSync(join(SRC, "og"))) cpSync(join(SRC, "og"), join(DIST, "assets/og"), { recursive: true });
const FONTS = [
  ["@fontsource-variable/fraunces/files", ["fraunces-latin-wght-normal.woff2", "fraunces-latin-wght-italic.woff2"]],
  [
    "@fontsource/instrument-sans/files",
    [
      "instrument-sans-latin-400-normal.woff2",
      "instrument-sans-latin-500-normal.woff2",
      "instrument-sans-latin-600-normal.woff2",
    ],
  ],
  [
    "@fontsource/ibm-plex-sans-arabic/files",
    [
      "ibm-plex-sans-arabic-arabic-400-normal.woff2",
      "ibm-plex-sans-arabic-arabic-600-normal.woff2",
      "ibm-plex-sans-arabic-latin-400-normal.woff2",
      "ibm-plex-sans-arabic-latin-600-normal.woff2",
    ],
  ],
];
mkdirSync(join(DIST, "assets/fonts"), { recursive: true });
for (const [dir, files] of FONTS)
  for (const f of files) cpSync(join(ROOT, "node_modules", dir, f), join(DIST, "assets/fonts", f));

if (site.domainIsPlaceholder) warnings.add(`dominio provisional: ${site.siteUrl}`);
if (!site.form.endpoint)
  warnings.add("form.endpoint vacío: el formulario no envía (W-01, pendiente de elegir proveedor)");
console.log(
  `Sitio generado en dist/ (${LANGS.length} idiomas × ${PAGES.length} páginas)${PREVIEW ? " [vista previa]" : ""}`,
);
if (warnings.size) console.log("Pendientes:\n  - " + [...warnings].join("\n  - "));
