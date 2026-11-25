/* Deadlift — shared frame: nav, menu, marker strokes, word reveal, clock, weather, pause buttons. */
(function () {
  "use strict";

  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var DL = (window.DL = window.DL || {});
  DL.reduced = function () { return reduce.matches; };

  /* ---------- hand-drawn marker paths ---------- */

  function jitter(n) { return (Math.random() * 2 - 1) * n; }

  function smooth(pts) {
    var d = "M" + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1);
    for (var i = 1; i < pts.length - 1; i++) {
      var mx = (pts[i][0] + pts[i + 1][0]) / 2;
      var my = (pts[i][1] + pts[i + 1][1]) / 2;
      d += " Q" + pts[i][0].toFixed(1) + " " + pts[i][1].toFixed(1) + " " + mx.toFixed(1) + " " + my.toFixed(1);
    }
    var last = pts[pts.length - 1];
    return d + " L" + last[0].toFixed(1) + " " + last[1].toFixed(1);
  }

  // Two passes: out and back, slightly offset, like a fast marker.
  function underline(x1, x2, y) {
    var w = x2 - x1, steps = Math.max(4, Math.round(w / 60)), pts = [];
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      pts.push([x1 - 6 + (w + 12) * t, y + Math.sin(t * Math.PI) * 1.6 + jitter(0.9)]);
    }
    var back = [];
    for (var j = steps; j >= 0; j--) {
      var u = j / steps;
      back.push([x1 + 8 + (w - 4) * u, y + 2.4 + Math.sin(u * Math.PI * 0.8) * 1.2 + jitter(0.9)]);
    }
    return smooth(pts.concat(back));
  }

  function ellipse(r) {
    var cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    var rx = r.w / 2 + 14, ry = r.h / 2 + 7;
    var start = -1.9 + jitter(0.2), sweep = Math.PI * 2 + 0.55, pts = [];
    for (var a = 0; a <= sweep; a += 0.26) {
      var grow = 1 + (a / sweep) * 0.08;
      pts.push([cx + Math.cos(start + a) * rx * grow + jitter(1), cy + Math.sin(start + a) * ry * grow + jitter(0.8)]);
    }
    return smooth(pts);
  }

  function strike(w) {
    var y = 10 + jitter(1.5), pts = [];
    for (var i = 0; i <= 5; i++) pts.push([2 + (w - 4) * (i / 5), y + (i / 5) * jitter(3) + jitter(0.8)]);
    return smooth(pts);
  }
  DL.strike = strike;

  var SVGNS = "http://www.w3.org/2000/svg";
  function makePath(d, cls) {
    var p = document.createElementNS(SVGNS, "path");
    p.setAttribute("d", d);
    if (cls) p.setAttribute("class", cls);
    return p;
  }

  /* ---------- marks on text blocks ---------- */

  var markHosts = [];
  function buildMarks(host) {
    var svg = host._marks;
    if (!svg) {
      svg = document.createElementNS(SVGNS, "svg");
      svg.setAttribute("class", "marks");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
      if (getComputedStyle(host).position === "static") host.style.position = "relative";
      host.appendChild(svg);
      host._marks = svg;
    }
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var box = host.getBoundingClientRect();
    host.querySelectorAll(".mk").forEach(function (mk, idx) {
      var kind = mk.getAttribute("data-mark");
      var rects = Array.prototype.slice.call(mk.getClientRects()).filter(function (r) { return r.width > 2; });
      if (!rects.length) return;
      if (kind === "o") {
        var r = rects[0];
        svg.appendChild(makePath(ellipse({ x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height }), idx ? "late" : ""));
      } else {
        rects.forEach(function (r) {
          var y = r.top - box.top + r.height * 0.86;
          svg.appendChild(makePath(underline(r.left - box.left, r.right - box.left, y), idx ? "late" : ""));
        });
      }
    });
    svg.querySelectorAll("path").forEach(function (p) {
      var len = Math.ceil(p.getTotalLength ? p.getTotalLength() : 1000);
      p.style.setProperty("--len", len);
    });
  }

  function initMarks() {
    var hosts = document.querySelectorAll("[data-marks]");
    if (!hosts.length) return;
    var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var svg = en.target._marks;
          if (svg) requestAnimationFrame(function () { svg.classList.add("is-drawn"); });
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -18% 0px" }) : null;
    hosts.forEach(function (h) {
      buildMarks(h);
      markHosts.push(h);
      if (io && !reduce.matches) io.observe(h);
      else h._marks.classList.add("is-drawn");
    });
    var t;
    function relayout(delay) {
      clearTimeout(t);
      t = setTimeout(function () {
        markHosts.forEach(function (h) {
          var drawn = h._marks && h._marks.classList.contains("is-drawn");
          buildMarks(h);
          if (drawn) {
            h._marks.style.transition = "none";
            h._marks.classList.add("is-drawn");
          }
        });
      }, delay);
    }
    window.addEventListener("resize", function () { relayout(150); });
    // late web fonts reflow the text: redraw so strokes stay on their words
    if (document.fonts && document.fonts.addEventListener) {
      document.fonts.addEventListener("loadingdone", function () { relayout(30); });
    }
    window.addEventListener("load", function () { relayout(30); });
    if ("ResizeObserver" in window) {
      var ro = new ResizeObserver(function () { relayout(60); });
      hosts.forEach(function (h) { ro.observe(h); });
    }
  }
  DL.rebuildMarks = function () { markHosts.forEach(buildMarks); };

  /* ---------- nav strike-through ---------- */

  function initNav() {
    document.querySelectorAll(".nav__link").forEach(function (a) {
      var svg = document.createElementNS(SVGNS, "svg");
      svg.setAttribute("class", "scribble");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
      a.appendChild(svg);
      var active = a.getAttribute("aria-current") === "page";

      function draw(animate) {
        var w = a.offsetWidth + 20;
        svg.setAttribute("viewBox", "0 0 " + w + " 20");
        while (svg.firstChild) svg.removeChild(svg.firstChild);
        var p = makePath(strike(w));
        svg.appendChild(p);
        var len = Math.ceil(p.getTotalLength());
        p.style.strokeDasharray = len;
        if (animate && !reduce.matches) {
          p.style.strokeDashoffset = len;
          p.getBoundingClientRect();
          p.style.transition = "stroke-dashoffset .6s cubic-bezier(.16,1,.3,1)";
          p.style.strokeDashoffset = 0;
        } else {
          p.style.strokeDashoffset = 0;
        }
        svg.style.opacity = 1;
      }
      if (active) {
        (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { if (active) draw(false); });
      }
      function enter() { if (!active) draw(true); }
      function leave() {
        if (active) return;
        svg.style.transition = "opacity .12s ease";
        svg.style.opacity = 0;
      }
      a.addEventListener("mouseenter", enter);
      a.addEventListener("focus", enter);
      a.addEventListener("mouseleave", leave);
      a.addEventListener("blur", leave);
      a._setActive = function (on) {
        active = on;
        if (on) { a.setAttribute("aria-current", "page"); draw(false); }
        else { a.removeAttribute("aria-current"); svg.style.opacity = 0; }
      };
    });
  }

  /* ---------- mobile menu ---------- */

  function initMenu() {
    var btn = document.querySelector(".burger");
    var menu = document.getElementById("menu");
    if (!btn || !menu) return;
    var links = menu.querySelectorAll("a");
    function set(open) {
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menu.classList.toggle("is-open", open);
      doc.style.overflow = open ? "hidden" : "";
      if (open && links[0]) setTimeout(function () { links[0].focus(); }, 50);
    }
    btn.addEventListener("click", function () { set(btn.getAttribute("aria-expanded") !== "true"); });
    menu.addEventListener("click", function (ev) { if (ev.target === menu) set(false); });
    document.addEventListener("keydown", function (ev) {
      if (btn.getAttribute("aria-expanded") !== "true") return;
      if (ev.key === "Escape") { set(false); btn.focus(); }
      if (ev.key === "Tab") {
        var items = [btn].concat(Array.prototype.slice.call(links));
        var i = items.indexOf(document.activeElement);
        if (ev.shiftKey && i <= 0) { ev.preventDefault(); items[items.length - 1].focus(); }
        else if (!ev.shiftKey && i === items.length - 1) { ev.preventDefault(); items[0].focus(); }
      }
    });
    var phoneFrame = window.matchMedia("(max-width: 800px), (max-height: 500px)");
    window.addEventListener("resize", function () { if (!phoneFrame.matches) set(false); });
  }

  /* ---------- scroll state ---------- */

  function initScrollState() {
    function on() {
      if (window.scrollY > 10) {
        doc.classList.add("is-scrolled");
        window.removeEventListener("scroll", on);
      }
    }
    window.addEventListener("scroll", on, { passive: true });
    on();
  }

  /* ---------- word reveal tied to scroll ---------- */

  function initReveal() {
    var blocks = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
    if (!blocks.length) return;
    if (reduce.matches) {
      blocks.forEach(function (b) { b.querySelectorAll(".w").forEach(function (w) { w.style.opacity = 1; }); });
      return;
    }
    doc.classList.add("reveal-ready");
    var data = blocks.map(function (b) {
      return { el: b, words: Array.prototype.slice.call(b.querySelectorAll(".w")).filter(function (w) { return !w.closest(".keep"); }) };
    });
    var ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight;
      data.forEach(function (d) {
        var r = d.el.getBoundingClientRect();
        // start: top at 90% of the viewport; end: bottom at 60%
        var start = vh * 0.9, end = vh * 0.6;
        var span = (r.height + start - end);
        var p = (start - r.top) / span;
        p = Math.max(0, Math.min(1, p));
        var n = d.words.length, soft = 10;
        var head = p * (n + soft);
        for (var i = 0; i < n; i++) {
          var o = (head - i) / soft;
          o = 0.2 + 0.8 * Math.max(0, Math.min(1, o));
          d.words[i].style.opacity = o.toFixed(3);
        }
      });
    }
    function req() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener("scroll", req, { passive: true });
    window.addEventListener("resize", req);
    update();
  }

  /* ---------- clock + weather (Pittsburgh) ---------- */

  var TZ = "America/New_York";
  DL.clock = function () {
    var now = new Date();
    var parts = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: true, timeZoneName: "short" }).formatToParts(now);
    var get = function (t) { var p = parts.find(function (x) { return x.type === t; }); return p ? p.value : ""; };
    var dateParts = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", month: "short", day: "numeric" }).formatToParts(now);
    var dget = function (t) { var p = dateParts.find(function (x) { return x.type === t; }); return p ? p.value : ""; };
    return {
      hm: get("hour") + ":" + get("minute") + " " + get("dayPeriod").toUpperCase(),
      zone: get("timeZoneName"),
      date: (dget("weekday") + " " + dget("month") + " " + dget("day")).toUpperCase()
    };
  };

  var URL_WX = "https://api.open-meteo.com/v1/forecast?latitude=40.4406&longitude=-79.9959&current=temperature_2m,weather_code,wind_speed_10m,visibility&temperature_unit=fahrenheit&wind_speed_unit=mph";
  var FALLBACK = { sky: "DEADLIFT SKIES — STEEL GREY, PROBABLY", vis: "VISIBILITY — ASK THE RIVERS", wind: "WIND — OFF THE ALLEGHENY" };

  function word(code) {
    if (code === 0 || code === 1) return "CLEAR";
    if (code === 2 || code === 3) return "CLOUDS";
    if (code === 45 || code === 48) return "FOG";
    if ([51, 53, 55, 56, 57].indexOf(code) > -1) return "DRIZZLE";
    if ([61, 63, 65, 66, 67, 80, 81, 82].indexOf(code) > -1) return "RAIN";
    if ([71, 73, 75, 77, 85, 86].indexOf(code) > -1) return "SNOW";
    if ([95, 96, 99].indexOf(code) > -1) return "STORM";
    return "CLOUDS";
  }

  function format(cur) {
    if (!cur || typeof cur.temperature_2m !== "number" || typeof cur.weather_code !== "number") throw new Error("weather payload");
    var miles = cur.visibility / 1609.344;
    var wind = cur.wind_speed_10m;
    return {
      sky: "DEADLIFT SKIES — " + word(cur.weather_code) + ", " + Math.round(cur.temperature_2m) + "°F",
      vis: !isFinite(miles) ? FALLBACK.vis : miles >= 10 ? "VISIBILITY 10+ MI" : "VISIBILITY " + miles.toFixed(1) + " MI",
      wind: isFinite(wind) ? "WIND " + Math.round(wind) + " MPH" : FALLBACK.wind
    };
  }

  var wxPromise = null;
  DL.weather = function () {
    if (wxPromise) return wxPromise;
    wxPromise = new Promise(function (resolve) {
      try {
        var cached = JSON.parse(sessionStorage.getItem("dl-wx") || "null");
        if (cached && Date.now() - cached.t < 30 * 60 * 1000) return resolve(cached.v);
      } catch (e) { /* storage blocked */ }
      var done = false;
      var ctrl = "AbortController" in window ? new AbortController() : null;
      var timer = setTimeout(function () { if (!done) { done = true; if (ctrl) ctrl.abort(); resolve(FALLBACK); } }, 3000);
      fetch(URL_WX, ctrl ? { signal: ctrl.signal } : {})
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (j) {
          if (done) return;
          var v = format(j && j.current);
          done = true; clearTimeout(timer);
          try { sessionStorage.setItem("dl-wx", JSON.stringify({ t: Date.now(), v: v })); } catch (e) { /* ignore */ }
          resolve(v);
        })
        .catch(function () { if (!done) { done = true; clearTimeout(timer); resolve(FALLBACK); } });
    });
    return wxPromise;
  };

  function initLive() {
    var clocks = document.querySelectorAll("[data-clock]");
    var dates = document.querySelectorAll("[data-date]");
    function tick() {
      var c = DL.clock();
      clocks.forEach(function (el) {
        el.textContent = el.getAttribute("data-clock") === "hud" ? c.hm + " " + c.zone + " — PITTSBURGH" : c.hm;
      });
      dates.forEach(function (el) { el.textContent = c.date; });
    }
    if (clocks.length || dates.length) { tick(); setInterval(tick, 15000); }
    var sky = document.querySelectorAll("[data-sky]");
    if (!sky.length) return;
    DL.weather().then(function (v) {
      sky.forEach(function (el) { el.textContent = v.sky; });
      document.querySelectorAll("[data-vis]").forEach(function (el) { el.textContent = v.vis; });
      document.querySelectorAll("[data-wind]").forEach(function (el) { el.textContent = v.wind; });
    });
  }

  /* ---------- pause buttons ---------- */

  DL.pauseButton = function (name, onToggle) {
    var btn = document.querySelector('[data-pause="' + name + '"]');
    if (!btn) return null;
    var label = btn.querySelector("span");
    var icon = btn.querySelector("svg");
    function render(paused) {
      btn.setAttribute("aria-pressed", String(paused));
      label.textContent = paused ? "Play" : "Pause";
      icon.innerHTML = paused ? '<path d="M1 0l8 5-8 5z"/>' : '<rect x="1" y="0" width="3" height="10"/><rect x="6" y="0" width="3" height="10"/>';
    }
    btn.addEventListener("click", function () {
      var paused = btn.getAttribute("aria-pressed") !== "true";
      render(paused);
      onToggle(paused);
    });
    return { set: render };
  };

  function initGallery() {
    var g = document.querySelector(".gallery");
    if (!g) return;
    var ctl = DL.pauseButton("gallery", function (p) { g.classList.toggle("is-paused", p); });
    if (reduce.matches && ctl) { ctl.set(true); g.classList.add("is-paused"); }
  }

  function start() {
    initNav();
    initMenu();
    initScrollState();
    initLive();
    initGallery();
    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready.then(function () { initMarks(); initReveal(); });
    DL.started = true;
    document.dispatchEvent(new CustomEvent("dl:ready"));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
