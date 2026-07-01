(function () {
  var input = document.getElementById("site-search");
  var resultsEl = document.getElementById("search-results");
  if (!input || !resultsEl || !window.SEARCH_INDEX || typeof Fuse === "undefined") return;

  var fuse = new Fuse(window.SEARCH_INDEX, {
    keys: [
      { name: "title", weight: 3 },
      { name: "tags", weight: 2 },
      { name: "summary", weight: 1 }
    ],
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 2
  });

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function render(results) {
    if (!results.length) {
      resultsEl.innerHTML = '<li class="search-empty">No matches</li>';
      resultsEl.classList.add("active");
      return;
    }
    resultsEl.innerHTML = results.map(function (r) {
      var p = r.item;
      var tags = (p.tags && p.tags.length)
        ? p.tags.map(function (t) { return "#" + esc(t); }).join(" ") : "";
      var meta = esc(p.date) + (tags ? "  ·  " + tags : "");
      return '<li><a href="' + p.url + '">' + esc(p.title) + '</a>' +
        '<div class="search-result-meta">' + meta + '</div></li>';
    }).join("");
    resultsEl.classList.add("active");
  }

  function search() {
    var q = input.value.trim();
    if (q.length < 2) { resultsEl.innerHTML = ""; resultsEl.classList.remove("active"); return; }
    render(fuse.search(q, { limit: 8 }));
  }

  input.addEventListener("input", search);
  input.addEventListener("focus", function () { if (input.value.trim().length >= 2) search(); });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".search-box")) resultsEl.classList.remove("active");
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      input.value = "";
      resultsEl.innerHTML = "";
      resultsEl.classList.remove("active");
      input.blur();
    }
  });
})();
