(function () {
  var section = document.getElementById("tl-section");
  var data = window.POSTS_TIMELINE;
  if (!section || !data || !data.length) return;
  data.forEach(function (d) {
    var p = String(d.date).split("-");
    d._y = parseInt(p[0], 10);
    d._m = parseInt(p[1], 10) - 1;
    d._dd = parseInt(p[2], 10);
    d._sort = new Date(d._y, d._m, d._dd).getTime();
  });
  data = data.filter(function (d) { return !isNaN(d._y); });
  data.sort(function (a, b) { return a._sort - b._sort; });

  var track = document.getElementById("tl-track");
  var handle = document.getElementById("tl-handle");
  var label = document.getElementById("tl-label");
  var listEl = document.getElementById("tl-list");
  var scopeBtns = Array.prototype.slice.call(section.querySelectorAll(".tl-scope button"));
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  var scope = "year", buckets = [], current = 0;

  function buildBuckets() {
    buckets = [];
    var first = data[0], last = data[data.length - 1];
    if (scope === "year") {
      for (var y = first._y; y <= last._y; y++) buckets.push({ label: "" + y, match: matchYear(y) });
    } else {
      var y = first._y, m = first._m;
      while (y < last._y || (y === last._y && m <= last._m)) {
        buckets.push({ label: MONTHS[m] + " " + y, match: matchMonth(y, m) });
        m++; if (m > 11) { m = 0; y++; }
      }
    }
    buckets.forEach(function (b) { b.count = data.filter(b.match).length; });
  }
  function matchYear(y) { return function (d) { return d._y === y; }; }
  function matchMonth(y, m) { return function (d) { return d._y === y && d._m === m; }; }

  function renderTrack() {
    Array.prototype.slice.call(track.querySelectorAll(".tl-dot")).forEach(function (n) { n.parentNode.removeChild(n); });
    var n = buckets.length;
    buckets.forEach(function (b, i) {
      b._x = n > 1 ? (i / (n - 1)) * 100 : 50;
      if (b.count > 0) {
        var dot = document.createElement("div");
        dot.className = "tl-dot";
        dot.style.left = b._x + "%";
        dot.title = b.label + " (" + b.count + ")";
        track.appendChild(dot);
      }
    });
  }

  function selectBucket(i) {
    current = Math.max(0, Math.min(i, buckets.length - 1));
    var b = buckets[current];
    handle.style.left = b._x + "%";
    label.textContent = b.label + (b.count ? "  ·  " + b.count : "");
    renderList(b);
  }

  function renderList(b) {
    var posts = data.filter(b.match).sort(function (a, c) { return c._sort - a._sort; });
    if (!posts.length) { listEl.innerHTML = '<li class="tl-empty">—</li>'; return; }
    listEl.innerHTML = posts.map(function (p) {
      return '<li><a href="' + p.url + '">' + esc(p.title) + '</a><span class="tl-date">' +
        p._dd + " " + MONTHS[p._m] + " " + p._y + '</span></li>';
    }).join("");
  }

  function nearest(clientX) {
    var rect = track.getBoundingClientRect();
    var ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    var n = buckets.length;
    return n > 1 ? Math.round(ratio * (n - 1)) : 0;
  }

  var dragging = false;
  track.addEventListener("pointerdown", function (e) {
    dragging = true;
    if (track.setPointerCapture) { try { track.setPointerCapture(e.pointerId); } catch (x) {} }
    selectBucket(nearest(e.clientX));
  });
  track.addEventListener("pointermove", function (e) { if (dragging) selectBucket(nearest(e.clientX)); });
  window.addEventListener("pointerup", function () { dragging = false; });

  scopeBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      scope = btn.getAttribute("data-scope");
      scopeBtns.forEach(function (b) { b.classList.toggle("active", b === btn); });
      buildBuckets(); renderTrack(); selectBucket(buckets.length - 1);
    });
  });

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }

  buildBuckets(); renderTrack(); selectBucket(buckets.length - 1);
})();
