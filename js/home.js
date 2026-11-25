/* Deadlift — home: wordmark fit, object pool, fling, intro, gravity, marquee, film, 3D loader. */
(function () {
  "use strict";

  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var hoverable = window.matchMedia("(hover: hover) and (pointer: fine)");
  var scriptURL = document.currentScript ? document.currentScript.src : location.href;

  /* ---------- wordmark: DEAD fills the box; LIFT keeps its own, compact width ---------- */

  function fitWordmark() {
    var wm = document.querySelector(".wm");
    if (!wm) return;
    var top = wm.querySelector(".wm__line--top span");
    wm.style.setProperty("--wm-size", "100px");
    var w = top.offsetWidth; // layout width: the intro's scale(0) does not affect it
    if (!w) return;
    wm.style.setProperty("--wm-size", (100 * wm.clientWidth / w).toFixed(2) + "px");
  }

  /* ---------- pool ---------- */

  var pool = [];
  try { pool = JSON.parse(document.getElementById("pool").textContent); } catch (e) { pool = []; }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  var deck = shuffle(pool.slice());
  var things = Array.prototype.slice.call(document.querySelectorAll(".objects .thing, .row4 .thing"));
  var showing = [];
  var status = document.getElementById("swap-status");

  function show(btn, item) {
    var img = btn.querySelector("img");
    img.src = item.src;
    btn.setAttribute("aria-label", item.alt + ". Swap object");
    btn._item = item;
  }

  things.forEach(function (btn, i) {
    var dealt = btn.getAttribute("data-obj");
    var item = dealt !== null ? pool[Number(dealt)] : deck[i];
    if (!item) return;
    if (dealt !== null && btn.querySelector("img").getAttribute("src")) btn._item = item;
    else show(btn, item);
    showing.push(item);
  });

  function swap(btn) {
    var free = pool.filter(function (p) { return showing.indexOf(p) === -1; });
    if (!free.length) return;
    var next = free[Math.floor(Math.random() * free.length)];
    showing[showing.indexOf(btn._item)] = next;
    show(btn, next);
    if (status) status.textContent = "Now showing: " + next.alt;
    btn.classList.remove("is-swapped");
    void btn.offsetWidth;
    if (!reduce.matches) btn.classList.add("is-swapped");
  }

  /* ---------- fling on hover (fine pointers only) ---------- */

  var last = { x: 0, y: 0, dx: 0, dy: 0 };
  window.addEventListener("pointermove", function (ev) {
    last.dx = ev.clientX - last.x;
    last.dy = ev.clientY - last.y;
    last.x = ev.clientX;
    last.y = ev.clientY;
  }, { passive: true });

  function fling(btn) {
    if (reduce.matches || !hoverable.matches || doc.classList.contains("gravity-on")) return;
    var g = window.gsap;
    var vx = Math.max(-60, Math.min(60, last.dx)) * 30;
    var vy = Math.max(-60, Math.min(60, last.dy)) * 30;
    if (g && window.InertiaPlugin) {
      g.registerPlugin(window.InertiaPlugin);
      g.killTweensOf(btn);
      var tl = g.timeline();
      tl.to(btn, { inertia: { x: { velocity: vx, end: 0 }, y: { velocity: vy, end: 0 } }, duration: { min: 0.45, max: 0.65 } }, 0);
      tl.fromTo(btn, { rotation: 0 }, { rotation: g.utils.random(-15, 15), duration: 0.4, ease: "power1.inOut", yoyo: true, repeat: 1 }, 0);
      tl.timeScale(1.2);
    } else {
      springFling(btn, vx, vy);
    }
  }

  // Fallback if the CDN is unreachable: damped spring from an impulse.
  function springFling(btn, vx, vy) {
    var x = 0, y = 0, r = 0, vr = (Math.random() * 2 - 1) * 120, t0 = performance.now();
    cancelAnimationFrame(btn._raf);
    (function step(now) {
      var dt = Math.min(0.032, (now - t0) / 1000); t0 = now;
      var k = 170, c = 26;
      vx += (-k * x - c * vx) * dt; vy += (-k * y - c * vy) * dt; vr += (-k * r - c * vr) * dt;
      x += vx * dt; y += vy * dt; r += vr * dt;
      btn.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) rotate(" + r.toFixed(2) + "deg)";
      if (Math.abs(x) + Math.abs(y) + Math.abs(vx) + Math.abs(vy) > 0.5) btn._raf = requestAnimationFrame(step);
      else btn.style.transform = "";
    })(t0);
  }

  var suppressClick = false;
  things.forEach(function (btn) {
    btn.addEventListener("pointerenter", function (ev) { if (ev.pointerType === "mouse") fling(btn); });
    btn.addEventListener("click", function () {
      if (suppressClick) { suppressClick = false; return; }
      swap(btn);
    });
  });

  // Touch: a soft pulse on load so the objects read as tappable.
  if (!hoverable.matches && !reduce.matches) {
    setTimeout(function () {
      document.querySelectorAll(".objects .thing").forEach(function (b, i) {
        setTimeout(function () { b.classList.add("is-pulse"); }, i * 160);
      });
    }, 900);
  }

  /* ---------- intro (first visit only) ---------- */

  function runIntro() {
    if (!doc.classList.contains("intro-run")) return;
    try { localStorage.setItem("dl-intro", "1"); } catch (e) { /* ignore */ }
    var mark = document.querySelector(".intro__mark");
    var label = document.querySelector(".intro__label");
    var overlay = document.querySelector(".intro");
    var skip = document.querySelector(".intro__skip");
    var timers = [];
    var mats = ["01 / RAW STEEL", "02 / HAZARD ENAMEL", "03 / HARD CHROME"];
    function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
    function setMat(i) { mark.setAttribute("data-mat", String(i + 1)); label.textContent = mats[i]; }
    function wake() {
      ["main", ".site-header", ".site-footer", ".skip"].forEach(function (sel) {
        var el = document.querySelector(sel);
        if (el) el.inert = false;
      });
    }
    function finish() {
      fitWordmark();
      wake();
      timers.forEach(clearTimeout);
      doc.classList.remove("intro-run", "intro-cover", "intro-row", "intro-burst", "intro-hud");
      overlay.classList.remove("is-leaving");
    }
    skip.addEventListener("click", finish);
    setMat(0);
    at(420, function () { setMat(1); });
    at(840, function () { setMat(2); });
    at(1200, function () { overlay.classList.add("is-leaving"); doc.classList.add("intro-row"); });
    at(1450, function () { doc.classList.remove("intro-cover"); wake(); });
    at(2050, function () { doc.classList.add("intro-burst"); });
    at(2250, function () { doc.classList.add("intro-hud"); });
    at(2800, finish);
  }

  /* ---------- gravity mode ---------- */

  function initGravity() {
    var toggle = document.querySelector(".toggle");
    var stage = document.querySelector("[data-gravity-stage]");
    if (!toggle || !stage) return;
    if (reduce.matches) {
      toggle.disabled = true;
      toggle.title = "Gravity is off while reduced motion is on";
      return;
    }
    var bodies = [], raf = 0, held = null, prev = 0;
    var G = 2400, BOUNCE = 0.5;

    function setup() {
      var sr = stage.getBoundingClientRect();
      bodies = Array.prototype.slice.call(stage.querySelectorAll(".obj")).map(function (el) {
        var thing = el.querySelector(".thing");
        if (window.gsap) window.gsap.killTweensOf(thing);
        thing.style.transform = "";
        var r = el.getBoundingClientRect();
        // layout origin in stage coordinates (offsets ignore transforms)
        var ox = el.offsetLeft + el.offsetParent.getBoundingClientRect().left - sr.left;
        var oy = el.offsetTop + el.offsetParent.getBoundingClientRect().top - sr.top;
        return { el: el, x: r.left - sr.left, y: r.top - sr.top, w: r.width, h: r.height, ox: ox, oy: oy,
          vx: (Math.random() * 2 - 1) * 160, vy: -Math.random() * 200, rot: 0, vr: 0 };
      });
    }

    function step(now) {
      var dt = Math.min(0.033, (now - prev) / 1000 || 0.016);
      prev = now;
      var W = stage.clientWidth, H = stage.clientHeight;
      bodies.forEach(function (b) {
        if (b !== held) {
          b.vy += G * dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          var floor = H - b.h * 0.9;
          if (b.y > floor) { b.y = floor; b.vy *= -BOUNCE; b.vx *= 0.92; b.vr *= 0.8; if (Math.abs(b.vy) < 40) b.vy = 0; }
          if (b.x < -b.w * 0.05) { b.x = -b.w * 0.05; b.vx *= -BOUNCE; }
          if (b.x > W - b.w * 0.95) { b.x = W - b.w * 0.95; b.vx *= -BOUNCE; }
          if (b.y < -b.h * 0.2) { b.y = -b.h * 0.2; b.vy = Math.abs(b.vy) * BOUNCE; }
          b.vr += (b.vx * 0.02 - b.vr) * dt * 3;
          b.rot += b.vr * dt * 6;
        }
        b.el.style.transform = "translate(" + (b.x - b.ox).toFixed(1) + "px," + (b.y - b.oy).toFixed(1) + "px) rotate(" + b.rot.toFixed(1) + "deg)";
      });
      if (running && inView) raf = requestAnimationFrame(step);
    }

    function point(ev) {
      var sr = stage.getBoundingClientRect();
      return { x: ev.clientX - sr.left, y: ev.clientY - sr.top, t: performance.now() };
    }
    var grab = null, moved = 0;
    stage.addEventListener("pointerdown", function (ev) {
      if (!doc.classList.contains("gravity-on")) return;
      var el = ev.target.closest(".obj");
      if (!el) return;
      var b = bodies.find(function (x) { return x.el === el; });
      if (!b) return;
      ev.preventDefault();
      held = b; moved = 0;
      var p = point(ev);
      grab = { dx: p.x - b.x, dy: p.y - b.y, last: p, vx: 0, vy: 0 };
      el.querySelector(".thing").classList.add("is-held");
      el.setPointerCapture && el.setPointerCapture(ev.pointerId);
    });
    stage.addEventListener("pointermove", function (ev) {
      if (!held) return;
      var p = point(ev);
      var dt = Math.max(0.008, (p.t - grab.last.t) / 1000);
      grab.vx = (p.x - grab.last.x) / dt;
      grab.vy = (p.y - grab.last.y) / dt;
      moved += Math.abs(p.x - grab.last.x) + Math.abs(p.y - grab.last.y);
      grab.last = p;
      held.x = p.x - grab.dx;
      held.y = p.y - grab.dy;
    });
    function release() {
      if (!held) return;
      held.vx = Math.max(-3000, Math.min(3000, grab.vx));
      held.vy = Math.max(-3000, Math.min(3000, grab.vy));
      held.el.querySelector(".thing").classList.remove("is-held");
      if (moved > 6) suppressClick = true;
      held = null;
    }
    stage.addEventListener("pointerup", release);
    stage.addEventListener("pointercancel", release);

    var inView = true, running = false;
    function run() {
      cancelAnimationFrame(raf);
      if (!running || !inView) return;
      prev = performance.now();
      raf = requestAnimationFrame(step);
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; run(); }).observe(stage);
    }
    function on() {
      setup();
      doc.classList.add("gravity-on");
      running = true;
      run();
    }
    function off() {
      running = false;
      cancelAnimationFrame(raf);
      doc.classList.remove("gravity-on");
      bodies.forEach(function (b) {
        b.el.classList.add("is-returning");
        b.el.style.transform = "";
        setTimeout(function () { b.el.classList.remove("is-returning"); }, 700);
      });
      bodies = [];
    }
    toggle.addEventListener("click", function () {
      var pressed = toggle.getAttribute("aria-pressed") !== "true";
      toggle.setAttribute("aria-pressed", String(pressed));
      if (pressed) on(); else off();
    });
  }

  /* ---------- marquee ---------- */

  function initMarquee() {
    var section = document.querySelector(".marquee");
    if (!section) return;
    var rows = Array.prototype.slice.call(section.querySelectorAll(".marquee__track")).map(function (track) {
      var set = track.innerHTML;
      // five more copies (54 cards per row) so the loop never shows a gap; hidden from assistive tech
      var clone = document.createElement("div");
      clone.innerHTML = set;
      var extras = [];
      for (var k = 0; k < 5; k++) {
        Array.prototype.slice.call(clone.children).forEach(function (c) {
          var n = c.cloneNode(true);
          n.setAttribute("aria-hidden", "true");
          n.querySelector("img").alt = "";
          extras.push(n);
        });
      }
      extras.forEach(function (n) { track.appendChild(n); });
      return { el: track, dir: Number(track.getAttribute("data-dir")) || -1, x: 0, setW: 0 };
    });
    function measure() {
      rows.forEach(function (r) { r.setW = r.el.scrollWidth / 6; });
    }
    measure();
    window.addEventListener("resize", measure);

    var paused = reduce.matches, visible = false, raf = 0, prevT = 0, flip = 1, lastY = window.scrollY;
    var ctl = DL.pauseButton("marquee", function (p) { paused = p; if (!p) loop(); });
    if (reduce.matches && ctl) ctl.set(true);

    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      if (y < lastY - 1) flip = -1; else if (y > lastY + 1) flip = 1;
      lastY = y;
      if (paused && !reduce.matches) render();
    }, { passive: true });

    function render() {
      var rect = section.getBoundingClientRect();
      var scrollShift = reduce.matches ? 0 : (window.innerHeight - rect.top) * 0.12;
      rows.forEach(function (r) {
        var pos = r.x + scrollShift * r.dir;
        var w = r.setW || 1;
        var m = ((pos % w) + w) % w;
        r.el.style.transform = "translate3d(" + (-m).toFixed(1) + "px,0,0)";
      });
    }
    function loop() {
      cancelAnimationFrame(raf);
      prevT = performance.now();
      raf = requestAnimationFrame(function tick(now) {
        var dt = Math.min(0.05, (now - prevT) / 1000);
        prevT = now;
        var speed = window.innerWidth * 0.05;
        rows.forEach(function (r) { r.x -= r.dir * flip * speed * dt; });
        render();
        if (!paused && visible) raf = requestAnimationFrame(tick);
      });
    }
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible && !paused) loop(); else cancelAnimationFrame(raf);
    }, { rootMargin: "100px" }).observe(section);
    render();
  }

  /* ---------- film ---------- */

  function initFilm() {
    var v = document.querySelector(".film video");
    if (!v) return;
    var poster = (window.matchMedia("(max-width: 800px)").matches && v.getAttribute("data-poster-small")) || v.getAttribute("data-poster");
    if (poster) {
      new IntersectionObserver(function (en, obs) {
        if (!en[0].isIntersecting) return;
        obs.disconnect();
        v.poster = poster;
      }, { rootMargin: "100% 0px" }).observe(v);
    }
    var userPaused = reduce.matches;
    var ctl = DL.pauseButton("film", function (p) { userPaused = p; if (p) v.pause(); else v.play().catch(function () {}); });
    if (reduce.matches && ctl) ctl.set(true);
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting && !userPaused) v.play().catch(function () {});
      else v.pause();
    }, { threshold: 0.15 }).observe(v);
  }

  /* ---------- 3D kettlebell (lazy) ---------- */

  function hasWebGL() {
    try {
      var c = document.createElement("canvas");
      return !!(window.WebGL2RenderingContext && c.getContext("webgl2"));
    } catch (e) { return false; }
  }

  function initIdea() {
    var box = document.querySelector(".idea");
    if (!box) return;
    var note = box.querySelector(".idea__note");
    var notes = [
      "Hazard stripes, baked on and tough enough for the loading dock.",
      "Only the frame. Every line of the build, nothing hidden.",
      "Clear as a window, shiny as an oil slick, still heavy."
    ];
    var buttons = Array.prototype.slice.call(box.querySelectorAll(".finish"));
    var api = null, current = 0, paused = reduce.matches;
    var ctl = DL.pauseButton("idea", function (p) { paused = p; if (api) api.setPaused(p); });
    if (paused && ctl) ctl.set(true);
    function fallback() {
      box.classList.remove("has-gl");
      box.classList.add("no-gl");
      var dragLayer = box.querySelector(".idea__drag");
      if (dragLayer) dragLayer.hidden = true;
      var label = box.querySelector(".idea__label");
      if (label) label.textContent = "IDEA 01";
      var pb = box.querySelector('[data-pause="idea"]');
      if (pb) pb.hidden = true;
    }
    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        var i = Number(b.getAttribute("data-finish"));
        if (i === current) return;
        current = i;
        buttons.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        note.textContent = notes[i];
        if (api) api.setFinish(i);
      });
    });
    if (!hasWebGL()) { fallback(); return; }
    var io = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      io.disconnect();
      import(new URL("kettlebell.js", scriptURL).href).then(function (mod) {
        api = mod.mount(box, { reduced: reduce.matches, finish: current, paused: paused });
        if (api) box.classList.add("has-gl");
        else fallback();
      }).catch(fallback);
    }, { rootMargin: "300px" });
    io.observe(box);
  }

  /* ---------- start ---------- */

  function start() {
    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    fitWordmark();
    ready.then(fitWordmark);
    window.addEventListener("resize", fitWordmark);
    runIntro();
    initGravity();
    initMarquee();
    initFilm();
    initIdea();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
