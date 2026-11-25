/* Deadlift — /work/: desktop of folders, glass windows, case files; list view for phones and no-JS. */
(function () {
  "use strict";

  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var data;
  try { data = JSON.parse(document.getElementById("work-data").textContent); } catch (e) { return; }
  var cases = {};
  data.cases.forEach(function (c) { cases[c.id] = c; });

  var isList = new URLSearchParams(location.search).get("view") === "list";

  // INDEX is the active nav item in list view
  function syncNav() {
    document.querySelectorAll(".nav__link").forEach(function (a) {
      var key = a.getAttribute("data-key");
      if (!a._setActive) return;
      if (key === "work") a._setActive(!isList);
      if (key === "index") a._setActive(isList);
    });
    document.querySelectorAll(".menu a").forEach(function (a) {
      var key = a.getAttribute("data-key");
      if (key === "work") a.toggleAttribute("aria-current", !isList);
      if (key === "index") { if (isList) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); }
    });
  }

  var desk = document.querySelector(".desk");
  var iconLayer = document.querySelector(".desk__icons");
  var SVGNS = "http://www.w3.org/2000/svg";

  // Steel file folder: one sheet sticks out per case file (an empty folder shows none),
  // hazard tape slapped across the lip at its own angle, stencil DL on the front.
  // Pattern and gradient live once in the page (#hazard-band, #folder-front).
  var TILT = [-1.6, 1.2, -0.8, 1.5, -1.1];
  var SHEET = [[18, 11, -3], [23, 13, 2], [20, 15.5, -1]];
  function folderArt(files, i) {
    var sheets = "";
    for (var k = 0; k < Math.min(files, 3); k++) {
      var s = SHEET[k];
      sheets += '<g transform="rotate(' + s[2] + ' 65 40)"><rect x="' + s[0] + '" y="' + s[1] + '" width="92" height="40" rx="1.5" fill="#ececec"/>' +
        '<path d="M' + (s[0] + 8) + " " + (s[1] + 5) + 'h38" stroke="#8c8c8c" stroke-width="1.4"/></g>';
    }
    return '<svg class="icon__art" viewBox="0 0 130 104" aria-hidden="true" focusable="false">' +
      '<path d="M6 14a6 6 0 0 1 6-6h34l8 9h64a6 6 0 0 1 6 6v6H6z" fill="#2a2a2a"/>' + sheets +
      '<rect x="6" y="22" width="118" height="78" rx="6" fill="url(#folder-front)" stroke="rgba(255,255,255,.2)"/>' +
      '<path d="M12 33.5h106" stroke="rgba(255,255,255,.12)"/>' +
      '<path transform="rotate(' + TILT[i % TILT.length] + ' 65 27)" fill="url(#hazard-band)" d="M3 22.5H127l-1.4 2.2 1.6 2.3-1.3 2.4 1.1 2.1H3l1.3-2.1-1.5-2.4 1.4-2.3-1.2-2.2z"/>' +
      '<g transform="translate(47 48)" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="1"><circle cx="18" cy="18" r="17.5"/>' +
      '<path d="M6.3 9.9h3.6v16.2H6.3zM11.3 9.9h1.4a6.3 8.1 0 0 1 0 16.2h-1.4v-4h1.4a2.7 4 0 0 0 0-8.1h-1.4zM20.7 9.9h3.6v11.7h-3.6zM20.7 23h9v3.1h-9z"/></g>' +
      "</svg>";
  }

  // GSAP loads after this script; drag handles attach once it is there.
  function whenGsap(fn) {
    var done = false;
    function attempt() { if (!done && window.gsap && window.Draggable) { done = true; fn(); } }
    attempt();
    if (done) return;
    document.addEventListener("DOMContentLoaded", attempt);
    window.addEventListener("load", attempt);
  }

  var POS = [[40, 100], [220, 100], [40, 280], [220, 280], [40, 460]];
  var zTop = 20, openCount = 0, lastOpener = null;

  function closeIcon() {
    return '<svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M1 1l10 10M11 1L1 11"/></svg>';
  }

  function placeWindow(win, w) {
    var W = desk.clientWidth, H = desk.clientHeight;
    var left = Math.min(W - w - 20, Math.max(420, (W - w) / 2 - 120 + (openCount % 5) * 32));
    var top = Math.max(90, Math.min(H - 300, 120 + (openCount % 5) * 32));
    win.style.left = left + "px";
    win.style.top = top + "px";
    openCount++;
  }

  function front(win) { win.style.zIndex = ++zTop; }

  function makeDraggable(win, bar) {
    if (window.gsap && window.Draggable) {
      window.gsap.registerPlugin(window.Draggable);
      if (window.InertiaPlugin) window.gsap.registerPlugin(window.InertiaPlugin);
      window.Draggable.create(win, {
        trigger: bar, bounds: desk, dragClickables: false, zIndexBoost: false,
        inertia: !reduce.matches && !!window.InertiaPlugin,
        onPress: function () { front(win); }
      });
    }
    win.addEventListener("pointerdown", function () { front(win); });
  }

  function closeWin(win) {
    win.remove();
    var opener = win._opener;
    if (opener && document.body.contains(opener)) opener.focus();
  }

  function openWindow(folder, opener) {
    var existing = desk.querySelector('.win[data-folder="' + folder.id + '"]');
    if (existing) { front(existing); existing.querySelector(".win__close").focus(); return; }
    var win = document.createElement("section");
    win.className = "win";
    win.setAttribute("data-folder", folder.id);
    win.setAttribute("role", "dialog");
    win.setAttribute("aria-label", folder.name);
    var n = folder.files.length;
    var body = n ? '<div class="win__grid">' + folder.files.map(function (id) {
      var c = cases[id];
      return '<button class="file" type="button" data-case="' + id + '"><span class="file__thumb"><img src="../assets/work/case-' + id +
        '-690.webp" alt="" width="125" height="92" loading="lazy"></span><span>' + c.title.replace(/&/g, "&amp;") + "</span></button>";
    }).join("") + "</div>" : '<p class="win__empty">' + data.empty + "</p>";
    win.innerHTML = '<div class="win__bar"><span class="win__title">' + folder.name + '</span><span class="win__count">' + n + " FILES</span>" +
      '<button class="win__close" type="button" aria-label="Close window">' + closeIcon() + "</button></div>" + body;
    win._opener = opener;
    desk.appendChild(win);
    placeWindow(win, Math.min(560, desk.clientWidth - 40));
    front(win);
    makeDraggable(win, win.querySelector(".win__bar"));
    win.querySelector(".win__close").addEventListener("click", function () { closeWin(win); });
    win.querySelectorAll(".file").forEach(function (f) {
      f.addEventListener("click", function () { openCase(f.getAttribute("data-case"), f); });
    });
    win.querySelector(".win__close").focus();
  }

  function openCase(id, opener) {
    var existing = desk.querySelector('.win[data-case-win="' + id + '"]');
    if (existing) { front(existing); existing.querySelector(".win__close").focus(); return; }
    var c = cases[id];
    var win = document.createElement("article");
    win.className = "win win--case";
    win.setAttribute("data-case-win", id);
    win.setAttribute("role", "dialog");
    win.setAttribute("aria-label", c.title);
    var esc = function (s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); };
    win.innerHTML = '<div class="win__bar"><span class="win__title">' + esc(c.title) + "</span>" +
      '<a class="launch" href="?view=list#case-' + id + '" aria-label="Launch: ' + esc(c.launch) + '" title="' + esc(c.launch) + '">Launch</a>' +
      '<button class="win__close" type="button" aria-label="Close case file">' + closeIcon() + "</button></div>" +
      '<div class="win__body"><div class="win__media"><img src="../assets/work/case-' + id + '.webp" alt="" width="1376" height="768"></div>' +
      '<div class="win__text"><p class="win__meta">' + esc(c.tags) + " / " + c.year + "</p><p>" + esc(c.text) + "</p></div></div>";
    win._opener = opener;
    desk.appendChild(win);
    var w = Math.min(840, desk.clientWidth - 40);
    win.style.width = w + "px";
    placeWindow(win, w);
    front(win);
    makeDraggable(win, win.querySelector(".win__bar"));
    win.querySelector(".win__close").addEventListener("click", function () { closeWin(win); });
    win.querySelector(".win__close").focus();
  }

  document.addEventListener("keydown", function (ev) {
    if (ev.key !== "Escape") return;
    var wins = Array.prototype.slice.call(desk.querySelectorAll(".win"));
    if (!wins.length) return;
    wins.sort(function (a, b) { return (Number(b.style.zIndex) || 0) - (Number(a.style.zIndex) || 0); });
    closeWin(wins[0]);
  });

  function buildIcons() {
    data.folders.forEach(function (f, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "icon";
      b.setAttribute("data-gravity", "");
      b.setAttribute("aria-label", f.name + ", folder, " + f.files.length + " files");
      b.innerHTML = folderArt(f.files.length, i) + "<span>" + f.name + "</span>";
      b.style.left = POS[i][0] + "px";
      b.style.top = POS[i][1] + "px";
      iconLayer.appendChild(b);
      b._dragged = false;
      b.addEventListener("click", function () {
        if (b._dragged) { b._dragged = false; return; }
        openWindow(f, b);
      });
    });
    whenGsap(function () {
      window.gsap.registerPlugin(window.Draggable);
      iconLayer.querySelectorAll(".icon").forEach(function (b) {
        // no z-index boost: a pressed folder must never rise above the fixed frame
        window.Draggable.create(b, {
          bounds: desk, dragClickables: true, minimumMovement: 4, zIndexBoost: false,
          onPress: function () { b._dragged = false; },
          onDragStart: function () { b._dragged = true; }
        });
      });
    });
  }

  /* gravity: folders drop to the bottom of the desktop */
  function initGravity() {
    var toggle = document.querySelector(".toggle");
    if (!toggle) return;
    if (reduce.matches) { toggle.disabled = true; toggle.title = "Gravity is off while reduced motion is on"; return; }
    var saved = [];
    toggle.addEventListener("click", function () {
      var g = window.gsap;
      if (!g) return;
      var on = toggle.getAttribute("aria-pressed") !== "true";
      toggle.setAttribute("aria-pressed", String(on));
      var icons = Array.prototype.slice.call(iconLayer.querySelectorAll(".icon"));
      if (on) {
        saved = icons.map(function (el) { return { x: g.getProperty(el, "x"), y: g.getProperty(el, "y") }; });
        var H = desk.clientHeight, W = desk.clientWidth;
        var step = Math.min(190, (W - 80 - 180) / Math.max(1, icons.length - 1));
        // they land side by side, clear of the footer and its GRAVITY toggle
        icons.forEach(function (el, i) {
          var floor = H - el.offsetTop - el.offsetHeight - 150;
          g.to(el, { y: floor, x: 40 + i * step - el.offsetLeft + g.utils.random(-12, 12), rotation: g.utils.random(-14, 14), duration: g.utils.random(0.9, 1.3), ease: "bounce.out", delay: i * 0.05 });
        });
      } else {
        icons.forEach(function (el, i) {
          g.to(el, { x: saved[i] ? saved[i].x : 0, y: saved[i] ? saved[i].y : 0, rotation: 0, duration: 0.6, ease: "power3.out" });
        });
      }
    });
  }

  function start() {
    syncNav();
    if (!desk || isList) return;
    buildIcons();
    initGravity();
  }
  if (window.DL && window.DL.started) start();
  else document.addEventListener("dl:ready", start);
})();
