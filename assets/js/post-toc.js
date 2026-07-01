(function () {
  var bar = document.createElement("div");
  bar.className = "reading-progress";
  var fill = document.createElement("div");
  fill.className = "reading-progress-bar";
  bar.appendChild(fill);
  document.body.appendChild(bar);

  var article = document.querySelector(".post .page-content") || document.querySelector("article");

  function progress() {
    if (!article) return;
    var top = article.getBoundingClientRect().top + window.scrollY;
    var total = article.offsetHeight - window.innerHeight;
    var scrolled = window.scrollY - top;
    var p = total > 0 ? scrolled / total : (scrolled >= 0 ? 1 : 0);
    p = Math.min(Math.max(p, 0), 1);
    fill.style.width = (p * 100) + "%";
  }

  var toc = document.getElementById("TableOfContents");
  var links = toc ? Array.prototype.slice.call(toc.querySelectorAll("a")) : [];
  var targets = links.map(function (a) {
    var id = decodeURIComponent((a.getAttribute("href") || "").replace(/^#/, ""));
    return id ? document.getElementById(id) : null;
  });

  function spy() {
    if (!links.length) return;
    var offset = 90;
    var idx = -1;
    for (var i = 0; i < targets.length; i++) {
      if (targets[i] && targets[i].getBoundingClientRect().top - offset <= 0) idx = i;
    }
    links.forEach(function (a, i) { a.classList.toggle("active", i === idx); });
  }

  links.forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = decodeURIComponent((a.getAttribute("href") || "").replace(/^#/, ""));
      var t = id ? document.getElementById(id) : null;
      if (t) {
        e.preventDefault();
        t.scrollIntoView({ behavior: "smooth", block: "start" });
        if (history.replaceState) history.replaceState(null, "", "#" + id);
      }
    });
  });

  var ticking = false;
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(function () { progress(); spy(); ticking = false; });
      ticking = true;
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  progress();
  spy();
})();
