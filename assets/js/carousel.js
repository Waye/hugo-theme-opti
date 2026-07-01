(function () {
  function init() {
    var REDUCE = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var gals = document.querySelectorAll(".home-gallery[data-rotate]");
    for (var n = 0; n < gals.length; n++) {
      (function (g) {
        var slides = g.querySelectorAll(".hg-slide");
        if (slides.length < 2 || REDUCE) return;
        var ms = parseInt(g.getAttribute("data-rotate"), 10) || 10000;
        var i = 0;
        setInterval(function () {
          slides[i].classList.remove("is-active");
          i = (i + 1) % slides.length;
          slides[i].classList.add("is-active");
        }, ms);
      })(gals[n]);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
