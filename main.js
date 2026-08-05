(function () {
  "use strict";

  var data = window.__BRAND__ || {};
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  /* ---- Nav: solidify on scroll ---- */
  function initNav() {
    var nav = $(".nav");
    if (!nav) return;
    var onScroll = function () {
      if (window.scrollY > 24 || nav.classList.contains("menu-open")) nav.classList.add("is-scrolled");
      else nav.classList.remove("is-scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- Mobile menu ---- */
  function initMobileMenu() {
    var toggle = $(".nav-toggle");
    var menu = $(".mobile-menu");
    var nav = $(".nav");
    if (!toggle || !menu) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("is-open", open);
      document.body.style.overflow = open ? "hidden" : "";
      if (nav) {
        nav.classList.toggle("menu-open", open);
        if (!open && window.scrollY <= 24) nav.classList.remove("is-scrolled");
        else nav.classList.add("is-scrolled");
      }
    }

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      setOpen(!open);
    });
    $$("a", menu).forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
  }

  /* ---- Scroll reveal ---- */
  function initReveals() {
    var targets = $$("[data-reveal]");
    if (!targets.length) return;

    if (typeof IntersectionObserver === "undefined") {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.02, rootMargin: "0px 0px -2% 0px" });

    targets.forEach(function (el, i) {
      el.style.transitionDelay = reduced ? "0s" : Math.min(i % 4, 3) * 0.08 + "s";
      io.observe(el);
    });

    setTimeout(function () {
      $$("[data-reveal]:not(.is-visible)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-visible");
      });
    }, 6000);
  }

  /* ---- Tilt on service/pillar cards ---- */
  function initTilt() {
    if (!fineHover) return;
    $$("[data-tilt]").forEach(function (card) {
      var raf = null;
      card.addEventListener("mousemove", function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5;
          var py = (e.clientY - r.top) / r.height - 0.5;
          card.style.transform = "perspective(700px) rotateX(" + (py * -6) + "deg) rotateY(" + (px * 6) + "deg) translateY(-6px)";
          raf = null;
        });
      });
      card.addEventListener("mouseleave", function () { card.style.transform = ""; });
    });
  }

  /* ---- Nav logo reveal: hidden while hero logo is visible, fades in once it scrolls away ---- */
  function initLogoReveal() {
    var heroLogo = $(".hero-lockup");
    var navLogo = $(".brand-logo-reveal");
    if (!heroLogo || !navLogo || typeof IntersectionObserver === "undefined") return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        navLogo.classList.toggle("is-hidden", entry.isIntersecting);
      });
    }, { rootMargin: "-90px 0px 0px 0px", threshold: 0 });
    io.observe(heroLogo);
  }

  /* ---- WhatsApp quick-message forms: type a message, opens WhatsApp pre-filled ---- */
  function initWaForms() {
    var WA_NUMBER = "18299950994";
    var DEFAULT_MSG = "Hola, quisiera información sobre el servicio de lavandería.";
    $$("[data-wa-form]").forEach(function (form) {
      if (form.dataset.waBound) return;
      form.dataset.waBound = "1";
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var input = form.querySelector("input[name='text']");
        var msg = (input && input.value.trim()) || DEFAULT_MSG;
        var url = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg);
        window.open(url, "_blank", "noopener");
        if (input) input.value = "";
        var panel = form.closest("[data-wa-chat-panel]");
        if (panel) panel.classList.remove("is-open");
      });
    });
  }

  /* ---- WhatsApp floating chat widget: toggle popup panel ---- */
  function initWaChat() {
    $$("[data-wa-chat]").forEach(function (wrap) {
      var panel = wrap.querySelector("[data-wa-chat-panel]");
      var toggles = $$("[data-wa-chat-toggle]", wrap);
      if (!panel || !toggles.length) return;

      function setOpen(open) {
        panel.classList.toggle("is-open", open);
        toggles.forEach(function (t) { t.setAttribute("aria-expanded", String(open)); });
        if (open) {
          var input = panel.querySelector("input[name='text']");
          if (input) setTimeout(function () { input.focus(); }, 200);
        }
      }

      toggles.forEach(function (t) {
        t.addEventListener("click", function (e) {
          e.preventDefault();
          setOpen(!panel.classList.contains("is-open"));
        });
      });

      document.addEventListener("click", function (e) {
        if (!wrap.contains(e.target)) setOpen(false);
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") setOpen(false);
      });
    });
  }

  /* ---- Footer year ---- */
  function initFooterYear() {
    var el = $("[data-year]");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ---- Smooth anchor scroll (native) ---- */
  function initSmoothAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var navOffset = 84;
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - navOffset,
        behavior: reduced ? "auto" : "smooth"
      });
    });
  }

  /* ---- Language tabs (politica.html) — progressive enhancement ---- */
  function initLangTabs() {
    var tabs = $$(".lang-tab");
    if (!tabs.length) return;
    var panels = {
      es: $('[data-lang-panel="es"]'),
      en: $('[data-lang-panel="en"]')
    };
    if (!panels.es || !panels.en) return;

    function activate(lang) {
      tabs.forEach(function (t) { t.setAttribute("aria-selected", String(t.dataset.lang === lang)); });
      Object.keys(panels).forEach(function (key) {
        panels[key].classList.toggle("is-hidden", key !== lang);
      });
    }

    tabs.forEach(function (t) {
      t.addEventListener("click", function () { activate(t.dataset.lang); });
    });

    activate("es");
  }

  /* ---- GSAP-enhanced hero entrance (optional, feature-detected) ---- */
  function initHeroEntrance() {
    if (!window.gsap) return;
    var sel = [".hero-lockup", ".hero-title", ".hero-sub", ".hero-actions", ".hero-badges"];

    // Red de seguridad: pase lo que pase con la animación, el texto se ve.
    function reveal() {
      sel.forEach(function (s) {
        $$(s).forEach(function (el) {
          el.style.opacity = "";
          el.style.transform = "";
          el.style.visibility = "";
        });
      });
    }
    var guard = setTimeout(reveal, 3500);

    var tl = gsap.timeline({
      defaults: { ease: "expo.out", duration: 1.1 },
      onComplete: function () { clearTimeout(guard); reveal(); }
    });
    tl.from(".hero-lockup", { y: 30, opacity: 0 })
      .from(".hero-title", { y: 26, opacity: 0 }, "-=0.75")
      .from(".hero-sub", { y: 20, opacity: 0 }, "-=0.75")
      .from(".hero-actions", { y: 16, opacity: 0 }, "-=0.7")
      .from(".hero-badges", { y: 14, opacity: 0 }, "-=0.65");
  }

  /* ---- Proceso: la lavadora gira y se llena según el scroll ---- */
  function initProcessMachine() {
    var section = $("[data-process]");
    if (!section) return;
    var svg = $(".machine-svg", section);
    var grid = $(".process-grid", section);
    var machine = $(".machine-sticky", section);
    var steps = $$("[data-process-step]", section);
    var label = $("[data-machine-label]", section);
    var fill = $("[data-machine-fill]", section);
    var led = $(".machine-led", section);
    if (!svg || !grid || !machine || !steps.length) return;

    var LABELS = ["Recogiendo", "Clasificando", "Lavando", "Secando", "Lista para entregar"];
    var LEDS = ["#f6c34a", "#f6c34a", "#5ad1f0", "#f79b4a", "#5be08a"];
    var raf = null;
    var lastIdx = -1;

    function update() {
      raf = null;
      // El recorrido empieza cuando la lavadora queda fija arriba y termina
      // cuando llega al final de los pasos: así solo se anima mientras se ve.
      var navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 84;
      var anchor = navH + 35;
      var g = grid.getBoundingClientRect();
      var travel = grid.offsetHeight - machine.offsetHeight;
      var t = travel > 0 ? (anchor - g.top) / travel : (g.top <= anchor ? 1 : 0);
      t = Math.max(0, Math.min(1, t));

      svg.style.setProperty("--drum-rot", (t * 1080).toFixed(1) + "deg");
      svg.style.setProperty("--knob-rot", (t * 300).toFixed(1) + "deg");

      var water = 82;
      if (t >= 0.22 && t < 0.5) water = 82 - ((t - 0.22) / 0.28) * 60;
      else if (t >= 0.5 && t < 0.68) water = 22;
      else if (t >= 0.68 && t < 0.85) water = 22 + ((t - 0.68) / 0.17) * 60;
      svg.style.setProperty("--water-y", water.toFixed(1) + "px");

      if (fill) fill.style.width = (t * 100).toFixed(1) + "%";

      var idx = Math.min(steps.length - 1, Math.floor(t * steps.length));
      if (idx !== lastIdx) {
        lastIdx = idx;
        steps.forEach(function (s, i) { s.classList.toggle("is-active", i === idx); });
        if (label) label.textContent = LABELS[idx] || LABELS[0];
        if (led) led.setAttribute("fill", LEDS[idx] || LEDS[0]);
      }
    }

    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
  }

  /* ---- Contadores que suben al entrar en pantalla ---- */
  function initCounters() {
    var nums = $$("[data-count]");
    if (!nums.length || reduced) return;
    if (typeof IntersectionObserver === "undefined") return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        var el = entry.target;
        var target = parseInt(el.getAttribute("data-count"), 10);
        if (isNaN(target)) return;
        var suffix = el.getAttribute("data-suffix") || "";
        var dur = 1100;
        var start = 0;
        function tick(now) {
          if (!start) start = now;
          var p = Math.min(1, (now - start) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = target + suffix;
        }
        el.textContent = "0" + suffix;
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.05 });

    nums.forEach(function (el) { io.observe(el); });
  }

  /* ---- Hero: campo de burbujas en canvas que reacciona al cursor ---- */
  function initHeroFX() {
    var canvas = $("[data-hero-canvas]");
    if (!canvas || !canvas.getContext) return;
    var hero = canvas.closest(".hero");
    if (!hero) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 1, h = 1;
    var bubbles = [];
    var rings = [];
    var px = -9999, py = -9999;
    var onScreen = true, rafId = null;

    // Una sola burbuja pre-dibujada que luego se reutiliza escalada (rápido)
    var SP = 128;
    var sprite = document.createElement("canvas");
    sprite.width = sprite.height = SP;
    (function paintSprite() {
      var c = sprite.getContext("2d");
      var m = SP / 2, r = m - 3;
      // Pompa de jabón sobre fondo oscuro: cuerpo casi transparente y
      // aro luminoso, para que lean como burbujas iluminadas.
      var g = c.createRadialGradient(m - r * 0.30, m - r * 0.34, r * 0.04, m, m, r);
      g.addColorStop(0, "rgba(255,255,255,0.34)");
      g.addColorStop(0.30, "rgba(150,200,255,0.12)");
      g.addColorStop(0.72, "rgba(120,170,255,0.05)");
      g.addColorStop(0.90, "rgba(205,232,255,0.62)");
      g.addColorStop(0.99, "rgba(255,255,255,0.85)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = g;
      c.beginPath(); c.arc(m, m, r, 0, Math.PI * 2); c.fill();

      // Aro exterior brillante
      c.strokeStyle = "rgba(255,255,255,0.9)";
      c.lineWidth = 2.4;
      c.beginPath(); c.arc(m, m, r * 0.95, 0, Math.PI * 2); c.stroke();

      // Irisado: un toque rojo de marca y otro cian
      c.globalAlpha = 0.55;
      c.strokeStyle = "rgba(255,90,78,0.9)";
      c.lineWidth = 2.6;
      c.beginPath(); c.arc(m, m, r * 0.94, 0.9, 2.1); c.stroke();
      c.strokeStyle = "rgba(90,220,255,0.9)";
      c.beginPath(); c.arc(m, m, r * 0.94, 3.7, 5.1); c.stroke();
      c.globalAlpha = 1;

      // Reflejo principal
      c.fillStyle = "rgba(255,255,255,0.95)";
      c.beginPath(); c.ellipse(m - r * 0.34, m - r * 0.40, r * 0.19, r * 0.12, -0.6, 0, Math.PI * 2); c.fill();
      c.fillStyle = "rgba(255,255,255,0.55)";
      c.beginPath(); c.ellipse(m + r * 0.30, m + r * 0.34, r * 0.10, r * 0.06, 0.5, 0, Math.PI * 2); c.fill();
    })();

    function newBubble(atY) {
      var r = 6 + Math.pow(Math.random(), 2.2) * 38;
      return {
        x: Math.random() * w,
        y: atY == null ? h + r + Math.random() * 140 : atY,
        r: r,
        sp: (0.20 + Math.random() * 0.55) * (1.35 - r / 70),
        amp: 8 + Math.random() * 26,
        ph: Math.random() * Math.PI * 2,
        fr: 0.4 + Math.random() * 0.9,
        a: 0.45 + Math.random() * 0.55,
        ox: 0, oy: 0
      };
    }

    function seed() {
      var n = Math.round(Math.min(95, Math.max(30, w / 15)));
      if (reduced) n = Math.round(n * 0.55);
      bubbles = [];
      for (var i = 0; i < n; i++) bubbles.push(newBubble(Math.random() * h));
    }

    function resize() {
      var r = hero.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < bubbles.length; i++) {
        var b = bubbles[i];
        if (!reduced) {
          b.y -= b.sp;
          b.ph += 0.010 * b.fr;
        }
        if (b.y < -b.r - 30) { bubbles[i] = newBubble(); continue; }

        var sway = Math.sin(b.ph) * b.amp;
        var bx = b.x + sway;

        // el cursor empuja las burbujas cercanas
        var dx = bx - px, dy = b.y - py;
        var d2 = dx * dx + dy * dy;
        var R = 155;
        if (d2 < R * R && d2 > 0.01) {
          var d = Math.sqrt(d2);
          var f = (1 - d / R) * 30;
          b.ox += (dx / d * f - b.ox) * 0.14;
          b.oy += (dy / d * f - b.oy) * 0.14;
        } else {
          b.ox += (0 - b.ox) * 0.07;
          b.oy += (0 - b.oy) * 0.07;
        }

        var s = b.r * 2;
        ctx.globalAlpha = b.a;
        ctx.drawImage(sprite, bx + b.ox - b.r, b.y + b.oy - b.r, s, s);
      }
      ctx.globalAlpha = 1;

      for (var j = rings.length - 1; j >= 0; j--) {
        var g = rings[j];
        g.r += g.v;
        g.a -= 0.03;
        if (g.a <= 0) { rings.splice(j, 1); continue; }
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255," + Math.max(0, g.a).toFixed(3) + ")";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    function loop() {
      rafId = null;
      draw();
      if (onScreen) rafId = requestAnimationFrame(loop);
    }
    function start() {
      if (reduced) { draw(); return; }
      if (!rafId && onScreen) rafId = requestAnimationFrame(loop);
    }
    function stop() {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }

    function pop(cx, cy) {
      rings.push({ x: cx, y: cy, r: 6, v: 3.2, a: 0.85 });
      for (var i = 0; i < bubbles.length; i++) {
        var b = bubbles[i];
        var dx = b.x - cx, dy = b.y - cy;
        if (dx * dx + dy * dy < 105 * 105) {
          rings.push({ x: b.x, y: b.y, r: b.r * 0.6, v: 2.4, a: 0.6 });
          bubbles[i] = newBubble();
        }
      }
      if (reduced) draw();
    }

    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      px = e.clientX - r.left;
      py = e.clientY - r.top;
    }, { passive: true });

    hero.addEventListener("pointerleave", function () { px = -9999; py = -9999; }, { passive: true });

    hero.addEventListener("pointerdown", function (e) {
      if (e.target.closest && e.target.closest("a, button, input, form, .wa-quickform")) return;
      var r = hero.getBoundingClientRect();
      pop(e.clientX - r.left, e.clientY - r.top);
    }, { passive: true });

    var rz = null;
    window.addEventListener("resize", function () {
      clearTimeout(rz);
      rz = setTimeout(resize, 180);
    }, { passive: true });

    if (typeof IntersectionObserver !== "undefined") {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        if (onScreen) start(); else stop();
      }, { threshold: 0 }).observe(hero);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else start();
    });

    resize();
    start();
  }

  /* ---- Hero: las auroras siguen al cursor con retardo ---- */
  function initHeroAurora() {
    if (!fineHover) return;
    var hero = $("[data-hero]");
    if (!hero) return;
    var layers = $$(".hero-aurora", hero);
    if (!layers.length) return;
    var depth = [26, -34, 18];

    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width - 0.5;
      var ny = (e.clientY - r.top) / r.height - 0.5;
      layers.forEach(function (el, i) {
        var d = depth[i] == null ? 20 : depth[i];
        el.style.setProperty("--ax", (nx * d).toFixed(1) + "px");
        el.style.setProperty("--ay", (ny * d).toFixed(1) + "px");
      });
    }, { passive: true });
  }

  function boot() {
    document.documentElement.classList.add("reveal-ready");
    safe(initNav, "initNav");
    safe(initMobileMenu, "initMobileMenu");
    safe(initLogoReveal, "initLogoReveal");
    safe(initWaForms, "initWaForms");
    safe(initWaChat, "initWaChat");
    safe(initReveals, "initReveals");
    safe(initTilt, "initTilt");
    safe(initProcessMachine, "initProcessMachine");
    safe(initCounters, "initCounters");
    safe(initFooterYear, "initFooterYear");
    safe(initSmoothAnchors, "initSmoothAnchors");
    safe(initLangTabs, "initLangTabs");
    safe(initHeroEntrance, "initHeroEntrance");
    safe(initHeroFX, "initHeroFX");
    safe(initHeroAurora, "initHeroAurora");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
