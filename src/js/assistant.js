/* Salim Capital — asistente de preguntas sin IA.
   Busca la respuesta en los textos de la propia web (FAQ, servicios, modelos, etc.)
   y en unas respuestas breves aprobadas (precio, cómo empezar, idiomas...).
   Todo ocurre en el navegador: no se envía ni se guarda nada de lo que escribe el usuario. */
(function () {
  "use strict";

  var box = document.querySelector("[data-assistant]");
  if (!box) return;

  var lang = document.documentElement.lang || "es";
  var openBtn = box.querySelector(".assistant-open");
  var panel = box.querySelector(".assistant-panel");
  var closeBtn = box.querySelector(".assistant-close");
  var log = box.querySelector(".assistant-log");
  var form = box.querySelector(".assistant-form");
  var input = box.querySelector("#assistant-input");
  var chips = box.querySelector(".assistant-suggestions");
  var root = box.getAttribute("data-root") || "./";
  var preview = box.hasAttribute("data-preview");
  var S = {};
  try {
    S = JSON.parse(box.querySelector(".assistant-strings").textContent);
  } catch {
    S = {};
  }

  /* ---------- Normalización y búsqueda ---------- */
  var STOP = {
    es: "a al algo algun alguna como con cual cuales cuando de del donde el ella en es esa ese esta este esto hay la las le lo los me mi mis mucho muy no nos o para pero por porque puedo puede pueden que quiero se ser si sin sobre son su sus tengo tiene tu un una uno usted ustedes y ya yo hacer hace hago debo",
    en: "a about an and are as at be by can could do does for from get have has how i if in is it its me my of on or our should that the there this to us was we what when where which who will with would you your",
    ar: "في من على الى عن هل ما ماذا كيف هو هي انا انت انتم نحن مع او ثم لي لكم هذا هذه ذلك التي الذي كان يمكن اريد عندي لدي",
  };
  var stop = {};
  (STOP[lang] || "").split(" ").forEach(function (w) {
    stop[norm(w)] = true;
  });

  function norm(s) {
    s = String(s).toLowerCase();
    if (s.normalize) s = s.normalize("NFD").replace(/[̀-ͯ]/g, "");
    return s
      .replace(/[ً-ٰٟـ]/g, "")
      .replace(/[أإآ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي");
  }

  function stem(w) {
    if (lang === "ar") {
      var m = w.match(/^(وال|بال|كال|فال|لل|ال)(.{3,})$/);
      if (m) w = m[2];
      if (w.length > 4 && w.charAt(0) === "و") w = w.slice(1);
      if (w.length > 4 && /ات$/.test(w)) w = w.slice(0, -2);
      return w;
    }
    if (w.length > 5 && /es$/.test(w) && lang === "es") return w.slice(0, -2);
    if (w.length > 4 && /s$/.test(w)) return w.slice(0, -1);
    return w;
  }

  function tokens(s) {
    var out = [];
    norm(s.replace(/\{[a-z]+\}/g, " "))
      .split(/[^\p{L}\p{N}$]+/u)
      .forEach(function (w) {
        if (!w || stop[w] || (w.length < 2 && !/\d/.test(w))) return;
        out.push(stem(w));
      });
    return out;
  }

  // Coincidencia exacta = 1; una palabra empieza por la otra (≥ 4 letras) = 0,6.
  function match(q, w) {
    if (q === w) return 1;
    var a = q.length < w.length ? q : w;
    var b = a === q ? w : q;
    return a.length >= 4 && b.indexOf(a) === 0 ? 0.6 : 0;
  }

  var kb = null;
  var index = null;

  function build(data) {
    var docs = data.docs.map(function (d) {
      var tf = {};
      var title = tokens(d.t);
      var body = tokens(d.a);
      title.forEach(function (w) {
        tf[w] = (tf[w] || 0) + 2;
      });
      body.forEach(function (w) {
        tf[w] = (tf[w] || 0) + 1;
      });
      return { d: d, tf: tf, len: title.length * 2 + body.length };
    });
    var df = {};
    docs.forEach(function (x) {
      Object.keys(x.tf).forEach(function (w) {
        df[w] = (df[w] || 0) + 1;
      });
    });
    var avg =
      docs.reduce(function (s, x) {
        return s + x.len;
      }, 0) / Math.max(docs.length, 1);
    var intents = data.intents.map(function (i) {
      return { i: i, k: tokens(i.k) };
    });
    // Sinónimos: una palabra del grupo añade las dos primeras, que son las que usan los textos.
    var syn = {};
    (data.synonyms || []).forEach(function (g) {
      var words = tokens(g);
      words.forEach(function (w) {
        syn[w] = words.slice(0, 2);
      });
    });
    return { docs: docs, df: df, n: docs.length, avg: avg, intents: intents, syn: syn };
  }

  function idf(w) {
    var n = index.df[w] || 0;
    return Math.log(1 + (index.n - n + 0.5) / (n + 0.5));
  }

  function scoreDoc(q, x) {
    var s = 0;
    q.forEach(function (w) {
      var best = 0;
      var bestW = w;
      for (var k in x.tf) {
        var m = match(w, k);
        if (m > best) {
          best = m;
          bestW = k;
        }
      }
      if (!best) return;
      var tf = x.tf[bestW];
      s += best * idf(bestW) * ((tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * (x.len / index.avg))));
    });
    return s * (x.d.w || 1);
  }

  function hitsIn(q, x) {
    var n = 0;
    q.forEach(function (w) {
      var cands = [w].concat(index.syn[w] || []);
      for (var k in x.tf) {
        for (var c = 0; c < cands.length; c++) {
          if (match(cands[c], k)) {
            n++;
            return;
          }
        }
      }
    });
    return n;
  }

  function scoreIntent(q, it) {
    var hits = 0;
    q.forEach(function (w) {
      var best = 0;
      it.k.forEach(function (k) {
        best = Math.max(best, match(w, k));
      });
      hits += best;
    });
    return hits;
  }

  function answer(text) {
    var q = tokens(text);
    if (!q.length) return { type: "none" };
    var asked = q.length;
    q.slice().forEach(function (w) {
      (index.syn[w] || []).forEach(function (x) {
        if (q.indexOf(x) < 0) q.push(x);
      });
    });
    var ranked = index.docs
      .map(function (x) {
        return { x: x, s: scoreDoc(q, x) };
      })
      .filter(function (r) {
        return r.s > 0;
      })
      .sort(function (a, b) {
        return b.s - a.s;
      });
    var bestIntent = null;
    var bestHits = 0;
    index.intents.forEach(function (it) {
      var h = scoreIntent(q.slice(0, asked), it);
      if (h > bestHits) {
        bestHits = h;
        bestIntent = it.i;
      }
    });
    var top = ranked[0];
    var social = bestIntent && (bestIntent.id === "greeting" || bestIntent.id === "thanks");
    var coverage = bestHits / asked;
    // Respuestas breves: ganan si cubren al menos la mitad de la pregunta y ningún texto
    // de la web encaja claramente mejor. Saludo y agradecimiento, solo en mensajes cortos.
    if (bestIntent && bestHits >= 1) {
      if (social ? asked <= 3 && (!top || top.s < 4) : coverage >= 0.5 && (!top || top.s < 6 || coverage >= 0.99))
        return { type: "intent", i: bestIntent };
    }
    // Un texto de la web: con puntuación suficiente y que cubra al menos la mitad de la pregunta.
    if (top && (top.s < 2.5 || (top.s < 5 && hitsIn(q.slice(0, asked), top.x) < asked * 0.5))) top = null;
    if (top) {
      var related = [];
      for (var i = 1; i < ranked.length && related.length < 2; i++) {
        var r = ranked[i];
        if (r.s < top.s * 0.55) break;
        if (
          r.x.d.u !== top.x.d.u &&
          related.every(function (o) {
            return o.d.u !== r.x.d.u;
          })
        )
          related.push(r.x);
      }
      return { type: "doc", d: top.x.d, related: related };
    }
    return { type: "none" };
  }

  /* ---------- Presentación ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function md(s) {
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<em>$2</em>");
  }
  function href(u) {
    var parts = u.split("#");
    var p = parts[0];
    if (preview && (p === "" || /\/$/.test(p))) p += "index.html";
    return root + p + (parts[1] ? "#" + parts[1] : "");
  }
  // Recorta respuestas largas en el final de una frase.
  function short(s) {
    if (s.length <= 420) return s;
    var cut = s.slice(0, 420);
    var end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("。"), cut.lastIndexOf("؟ "));
    return (end > 160 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, "")) + " …";
  }
  function link(u, text) {
    return '<a href="' + esc(href(u)) + '">' + esc(text) + "</a>";
  }

  function add(html, who) {
    var div = document.createElement("div");
    div.className = "assistant-msg assistant-msg--" + who;
    div.innerHTML = '<span class="vh">' + esc(who === "user" ? S.you : S.bot) + ": </span>" + html;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    return div;
  }

  function reply(text) {
    var r = answer(text);
    var html;
    if (r.type === "intent") {
      html = "<p>" + md(r.i.a) + "</p>";
      if (r.i.u) html += '<p class="assistant-more">' + link(r.i.u, S.readMore) + "</p>";
    } else if (r.type === "doc") {
      html =
        '<p class="assistant-q">' +
        md(r.d.t) +
        "</p><p>" +
        md(short(r.d.a)) +
        '</p><p class="assistant-more">' +
        link(r.d.u, S.readMore) +
        "</p>";
      if (r.related.length) {
        html +=
          '<p class="assistant-related">' +
          esc(S.related) +
          "</p><ul>" +
          r.related
            .map(function (x) {
              return "<li>" + link(x.d.u, x.d.t) + "</li>";
            })
            .join("") +
          "</ul>";
      }
    } else {
      html = "<p>" + esc(S.fallback) + '</p><p class="assistant-more">' + link(kb.contact, S.fallbackLink) + "</p>";
    }
    add(html, "bot");
  }

  function ask(text) {
    text = String(text).trim().slice(0, 300);
    if (!text) return;
    var mine = add("<p>" + esc(text) + "</p>", "user");
    if (chips) chips.hidden = true;
    ensureKB(function () {
      reply(text);
      // La pregunta queda arriba y la respuesta se lee desde el principio.
      log.scrollTop = Math.max(0, mine.offsetTop - 12);
    });
  }

  /* ---------- Carga de la base de conocimiento (al abrir por primera vez) ---------- */
  var waiting = [];
  var loading = false;
  function ensureKB(cb) {
    if (index) return cb();
    waiting.push(cb);
    if (loading) return;
    loading = true;
    var inline = box.querySelector(".assistant-kb");
    function ready(data) {
      kb = data;
      index = build(data);
      waiting.splice(0).forEach(function (f) {
        f();
      });
    }
    if (inline) {
      try {
        return ready(JSON.parse(inline.textContent));
      } catch {
        /* sigue con la descarga */
      }
    }
    fetch(box.getAttribute("data-kb"), { credentials: "same-origin" })
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        return res.json();
      })
      .then(ready)
      .catch(function () {
        loading = false;
        waiting = [];
        add("<p>" + esc(S.loadError) + "</p>", "bot");
      });
  }

  /* ---------- Abrir y cerrar ---------- */
  function setOpen(open) {
    panel.hidden = !open;
    openBtn.setAttribute("aria-expanded", String(open));
    box.classList.toggle("is-open", open);
    if (open) {
      ensureKB(function () {});
      input.focus();
    } else {
      openBtn.focus();
    }
  }

  openBtn.addEventListener("click", function () {
    setOpen(panel.hidden);
  });
  closeBtn.addEventListener("click", function () {
    setOpen(false);
  });
  box.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !panel.hidden) {
      e.stopPropagation();
      setOpen(false);
    }
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    ask(input.value);
    input.value = "";
    input.focus();
  });
  if (chips) {
    chips.addEventListener("click", function (e) {
      var b = e.target.closest(".assistant-chip");
      if (b) {
        ask(b.textContent);
        input.focus();
      }
    });
  }

  box.hidden = false;
})();
