/* Deadlift — /about/: sticky chapters on native scroll; photos travel in on an arc. */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  // pinned chapters only where a chapter fits the screen; short screens (200% zoom, phones held sideways) stack
  var wide = window.matchMedia("(min-width: 601px) and (min-height: 561px)");
  var chapters = Array.prototype.slice.call(document.querySelectorAll(".chapter"));
  if (!chapters.length) return;

  var items = chapters.map(function (ch) {
    return { el: ch, text: ch.querySelector(".chapter__text"), photo: ch.querySelector(".chapter__photo") };
  });

  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }

  var ticking = false;
  function update() {
    ticking = false;
    var vh = window.innerHeight;
    items.forEach(function (it, i) {
      if (!wide.matches || reduce.matches) {
        it.photo.style.transform = "";
        it.text.style.opacity = "";
        return;
      }
      var r = it.el.getBoundingClientRect();
      var hold = r.height - vh;
      // enter: chapter top travels from the bottom of the screen to the top
      var enter = i === 0 ? 1 : clamp(1 - r.top / vh);
      // exit: only once the pin starts to leave; the last chapter stays to the end
      var exit = i === items.length - 1 ? 0 : clamp((-r.top - hold) / (vh * 0.5));
      var angle = (1 - ease(enter)) * 32 - ease(exit) * 32;
      it.photo.style.transform = "rotate(" + angle.toFixed(2) + "deg)";
      it.photo.style.opacity = (0.15 + 0.85 * clamp(enter * 1.3) * (1 - exit * 0.85)).toFixed(3);
      it.text.style.opacity = (clamp(enter * 2) * (1 - exit)).toFixed(3);
    });
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", req, { passive: true });
  window.addEventListener("resize", req);
  update();
})();
