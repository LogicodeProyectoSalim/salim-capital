/* Salim Capital — comportamiento del sitio.
   El contenido se sirve completo en HTML; este script solo añade mejoras:
   tema, menú móvil, selector de idioma, FAQ y formulario. */
(function () {
  "use strict";

  var doc = document.documentElement;
  var data = {};
  try {
    data = JSON.parse(document.getElementById("i18n-js").textContent);
  } catch {
    data = {};
  }

  function store(key, value) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      /* almacenamiento no disponible: la elección vale solo para esta visita */
    }
  }
  function read(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  /* ---------- Tema: automático (sistema) / claro / oscuro (W-08 a W-13) ---------- */
  var media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  var themeMetas = document.querySelectorAll('meta[name="theme-color"]');
  var colors = data.themeColors || { light: "#1F3A2E", dark: "#13201A" };

  function applyTheme(choice) {
    if (choice === "light" || choice === "dark") {
      doc.setAttribute("data-theme", choice);
      store("theme", choice);
      themeMetas.forEach(function (m) {
        m.setAttribute("content", colors[choice]);
      });
    } else {
      doc.removeAttribute("data-theme");
      store("theme", null);
      themeMetas.forEach(function (m) {
        var dark = /dark/.test(m.getAttribute("media") || "");
        m.setAttribute("content", dark ? colors.dark : colors.light);
      });
    }
    describeAuto();
  }

  function describeAuto() {
    var autoInput = document.querySelector('[data-theme-switch] input[value="auto"]');
    if (!autoInput || !data.themeAutoNowLight) return;
    var dark = media && media.matches;
    autoInput.setAttribute("aria-label", dark ? data.themeAutoNowDark : data.themeAutoNowLight);
  }

  var saved = read("theme");
  var themeInputs = document.querySelectorAll('[data-theme-switch] input[name="theme"]');
  themeInputs.forEach(function (input) {
    input.checked = input.value === (saved === "light" || saved === "dark" ? saved : "auto");
    input.addEventListener("change", function () {
      if (input.checked) applyTheme(input.value);
    });
  });
  describeAuto();
  if (media) {
    // Mientras el tema sea automático, la página sigue en vivo al sistema.
    var onSystemChange = function () {
      if (!doc.hasAttribute("data-theme")) applyTheme("auto");
    };
    if (media.addEventListener) media.addEventListener("change", onSystemChange);
    else if (media.addListener) media.addListener(onSystemChange);
  }

  /* ---------- Menú móvil: Escape, foco atrapado y retorno del foco (W-102) ---------- */
  var header = document.querySelector("[data-header]");
  var menuBtn = header && header.querySelector(".menu-btn");
  var nav = document.getElementById("site-nav");

  function menuOpen() {
    return header && header.hasAttribute("data-open");
  }
  function setMenu(open, returnFocus) {
    if (!header || !menuBtn) return;
    if (open) header.setAttribute("data-open", "");
    else header.removeAttribute("data-open");
    menuBtn.setAttribute("aria-expanded", String(open));
    var sr = menuBtn.querySelector(".menu-btn-sr");
    if (sr) sr.textContent = open ? menuBtn.dataset.labelClose : menuBtn.dataset.labelOpen;
    if (open) {
      var first = nav.querySelector("a");
      if (first) first.focus();
    } else if (returnFocus) {
      menuBtn.focus();
    }
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      setMenu(!menuOpen(), true);
    });
    header.addEventListener("keydown", function (e) {
      if (!menuOpen()) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setMenu(false, true);
        return;
      }
      if (e.key !== "Tab") return;
      var items = [menuBtn].concat(Array.prototype.slice.call(nav.querySelectorAll("a")));
      var firstEl = items[0];
      var lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    });
    var wide = window.matchMedia("(min-width: 64rem)");
    var onWide = function () {
      if (wide.matches && menuOpen()) setMenu(false, false);
    };
    if (wide.addEventListener) wide.addEventListener("change", onWide);
  }

  /* ---------- Selector de idioma (W-59, W-87) ---------- */
  document.querySelectorAll("[data-lang-switch]").forEach(function (box) {
    var toggle = box.querySelector(".lang-toggle");
    function set(open, focusBack) {
      if (open) box.setAttribute("data-open", "");
      else box.removeAttribute("data-open");
      toggle.setAttribute("aria-expanded", String(open));
      if (open) {
        var current = box.querySelector('a[aria-current="true"]') || box.querySelector("a");
        if (current) current.focus();
      } else if (focusBack) {
        toggle.focus();
      }
    }
    toggle.addEventListener("click", function () {
      set(!box.hasAttribute("data-open"), true);
    });
    box.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && box.hasAttribute("data-open")) {
        e.preventDefault();
        set(false, true);
      }
    });
    document.addEventListener("click", function (e) {
      if (box.hasAttribute("data-open") && !box.contains(e.target)) set(false, false);
    });
  });
  document.querySelectorAll("a[data-lang]").forEach(function (a) {
    a.addEventListener("click", function () {
      store("lang", a.getAttribute("data-lang"));
    });
  });
  store("lang", doc.lang);

  /* ---------- FAQ: enlace directo a cada pregunta (W-76) ---------- */
  function openFromHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var item = document.getElementById(id);
    if (item && item.tagName === "DETAILS") {
      item.open = true;
      item.querySelector("summary").focus();
    }
  }
  if (document.querySelector(".faq-item")) {
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
  }

  /* ---------- Formulario de solicitud (W-01, W-52, W-79, W-81) ---------- */
  var form = document.getElementById("request-form");
  if (!form) return;

  var errors = data.errors || {};
  var settings = data.form || {};
  var summary = document.getElementById("form-errors");
  var statusBox = document.getElementById("form-status");
  var success = document.getElementById("form-success");
  var submitBtn = form.querySelector('button[type="submit"]');
  var loadedAt = Date.now();
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var PHONE = /^\+?[0-9][0-9 ()./-]{6,22}$/;

  // Preselección del modelo desde «Solicitar este modelo» (?model=…)
  var params = new URLSearchParams(location.search);
  var model = params.get("model");
  var modelSelect = form.querySelector("#model");
  if (model && modelSelect && modelSelect.querySelector('option[value="' + model.replace(/[^a-z-]/g, "") + '"]')) {
    modelSelect.value = model;
  }

  function labelFor(fieldName) {
    var box = form.querySelector('[data-field="' + fieldName + '"]');
    if (!box) return fieldName;
    var label = box.querySelector("legend, label");
    return (label ? label.textContent : fieldName)
      .replace(/\*.*$/, "")
      .replace(/\s*\(.*\)\s*$/, "")
      .trim();
  }

  function setError(name, message) {
    var box = form.querySelector('[data-field="' + name + '"]');
    if (!box) return;
    var msg = document.getElementById(name + "-error");
    var controls = box.querySelectorAll("input, select, textarea");
    controls.forEach(function (c) {
      if (message) c.setAttribute("aria-invalid", "true");
      else c.removeAttribute("aria-invalid");
    });
    if (box.tagName === "FIELDSET") {
      if (message) box.setAttribute("aria-invalid", "true");
      else box.removeAttribute("aria-invalid");
    }
    if (msg) {
      msg.textContent = message || "";
      msg.hidden = !message;
    }
  }

  function value(name) {
    var el = form.elements[name];
    if (!el) return "";
    if (el instanceof RadioNodeList) return el.value;
    if (el.type === "checkbox") return el.checked ? el.value : "";
    return (el.value || "").trim();
  }

  function validate() {
    var problems = [];
    function check(name, ok, message) {
      setError(name, ok ? "" : message);
      if (!ok) problems.push({ name: name, message: message });
    }
    check("name", value("name").length > 1, errors.required);
    var email = value("email");
    check("email", email && EMAIL.test(email), email ? errors.email : errors.required);
    var phone = value("phone");
    check("phone", !phone || PHONE.test(phone), errors.phone);
    check("channel", !!value("channel"), errors.choice);
    check("residence", !!value("residence"), errors.choice);
    check("nationality", value("nationality").length > 1, errors.required);
    check("volume", !!value("volume"), errors.choice);
    check("goal", !!value("goal"), errors.choice);
    check("urgency", !!value("urgency"), errors.choice);
    check("consent", !!value("consent"), errors.consent);
    return problems;
  }

  function firstControl(name) {
    var box = form.querySelector('[data-field="' + name + '"]');
    return box && box.querySelector("input:not([type=hidden]), select, textarea");
  }

  function showSummary(problems) {
    var list = summary.querySelector("ul");
    list.textContent = "";
    problems.forEach(function (p) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      var control = firstControl(p.name);
      a.href = "#" + (control ? control.id : p.name);
      a.textContent = labelFor(p.name) + ": " + p.message;
      a.addEventListener("click", function (e) {
        e.preventDefault();
        if (control) control.focus();
      });
      li.appendChild(a);
      list.appendChild(li);
    });
    summary.hidden = problems.length === 0;
    summary.setAttribute("role", "alert");
  }

  function setBusy(busy) {
    submitBtn.disabled = busy;
    submitBtn.setAttribute("aria-busy", String(busy));
    submitBtn.textContent = busy ? data.sending : data.submit;
    if (busy) {
      var spin = document.createElement("span");
      spin.className = "spinner";
      spin.setAttribute("aria-hidden", "true");
      submitBtn.prepend(spin);
    }
  }

  function say(message) {
    statusBox.textContent = message;
  }

  // Validación en vivo una vez que el campo ya muestra un error
  form.addEventListener("change", function (e) {
    var box = e.target.closest("[data-field]");
    if (box && box.querySelector('[aria-invalid="true"]')) validate();
  });

  var sending = false;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (sending) return; // protección contra el doble envío
    say("");
    var problems = validate();
    showSummary(problems);
    if (problems.length) {
      var c = firstControl(problems[0].name);
      if (c) c.focus();
      return;
    }

    // Antispam sin cookies: trampa (honeypot), tiempo mínimo y límite de envíos.
    if (form.elements.website && form.elements.website.value) return;
    if (Date.now() - loadedAt < (settings.minSecondsBeforeSubmit || 4) * 1000) return;
    var hour = 3600 * 1000;
    var sent = [];
    try {
      sent = JSON.parse(read("formSent") || "[]").filter(function (t) {
        return Date.now() - t < hour;
      });
    } catch {
      sent = [];
    }
    if (sent.length >= (settings.maxPerHour || 3)) {
      say(errors.rate);
      return;
    }

    var endpoint = form.getAttribute("data-endpoint");
    if (!endpoint) {
      // Sin proveedor elegido todavía (W-01): no se finge un envío.
      say(errors.inactive);
      statusBox.focus && statusBox.setAttribute("tabindex", "-1");
      statusBox.focus();
      return;
    }

    sending = true;
    setBusy(true);
    fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
      .then(function (res) {
        if (!res.ok) throw new Error(String(res.status));
        sent.push(Date.now());
        store("formSent", JSON.stringify(sent));
        form.hidden = true;
        summary.hidden = true;
        success.hidden = false;
        success.focus();
      })
      .catch(function () {
        say(errors.network);
      })
      .then(function () {
        sending = false;
        setBusy(false);
      });
  });
})();
