(function () {
  var mapEl = document.getElementById("home-map");
  if (!mapEl || typeof L === "undefined" || !window.GEO_DATA) return;
  var i18n = window.MAP_I18N || {};
  var READ = i18n.read || "Read &rarr;";
  fixLeafletIcons();
  var map = L.map(mapEl).setView([20, 0], 2);
  setupTiles(map);
  renderStats(window.GEO_DATA);
  var currentLoc = "";
  var entries = [];
  window.GEO_DATA.forEach(function (d) {
    var bounds = [];
    var routeGroup = null;
    if (d.route && d.route.length >= 2) {
      var pts = [];
      d.route.forEach(function (p) {
        var la = parseFloat(p.lat), ln = parseFloat(p.lng);
        if (isNaN(la) || isNaN(ln)) return;
        pts.push([la, ln]); bounds.push([la, ln]);
      });
      if (pts.length >= 2) routeGroup = buildRouteGroup(map, pts);
    }
    var pin = null;
    var lat = parseFloat(d.lat), lng = parseFloat(d.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      pin = L.marker([lat, lng]);
      pin.bindPopup('<strong>' + esc(d.title) + '</strong><br><a href="' + d.url + '">' + READ + '</a>' + (d.loc ? '<br><small>' + esc(d.loc) + '</small>' : ''));
      bounds.push([lat, lng]);
    }
    var e = { loc: d.loc || "", pin: pin, route: routeGroup, bounds: bounds };
    entries.push(e);
    if (pin && routeGroup) {
      pin.on("popupopen", function () { if (!map.hasLayer(routeGroup)) routeGroup.addTo(map); });
      pin.on("popupclose", function () {
        if (!(currentLoc && e.loc === currentLoc) && map.hasLayer(routeGroup)) map.removeLayer(routeGroup);
      });
    }
  });
  var items = Array.prototype.slice.call(document.querySelectorAll("#geo-post-list .geo-post-item"));
  var filter = document.getElementById("geo-filter");
  var resetBtn = document.getElementById("geo-reset");
  var list = document.getElementById("geo-post-list");
  function fit(vis) {
    var b = [];
    vis.forEach(function (e) { b = b.concat(e.bounds); });
    if (b.length) map.fitBounds(b, { padding: [30, 30], maxZoom: 13 });
  }
  function applyFilter(loc) {
    currentLoc = loc;
    var visible = [];
    entries.forEach(function (e) {
      var match = !loc || e.loc === loc;
      if (e.pin) {
        if (match) { if (!map.hasLayer(e.pin)) e.pin.addTo(map); }
        else if (map.hasLayer(e.pin)) map.removeLayer(e.pin);
      }
      if (e.route) {
        var showRoute = loc && match;
        if (showRoute) { if (!map.hasLayer(e.route)) e.route.addTo(map); }
        else if (map.hasLayer(e.route)) map.removeLayer(e.route);
      }
      if (match) visible.push(e);
    });
    items.forEach(function (li) {
      li.style.display = (!loc || li.dataset.location === loc) ? "" : "none";
    });
    list.classList.toggle("active", !!loc);
    fit(visible);
    if (filter && filter.value !== loc) filter.value = loc;
  }
  if (filter) filter.addEventListener("change", function () { applyFilter(filter.value); });
  if (resetBtn) resetBtn.addEventListener("click", function () { applyFilter(""); });
  applyFilter("");
})();
function setupTiles(map) {
  var i18n = window.MAP_I18N || {};
  var carto = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
  var esri = 'Imagery &copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics';
  function cartoUrl() {
    var dark = document.documentElement.classList.contains("dark");
    return "https://{s}.basemaps.cartocdn.com/" + (dark ? "dark_all" : "light_all") + "/{z}/{x}/{y}{r}.png";
  }
  var mapLayer = L.tileLayer(cartoUrl(), { maxZoom: 19, attribution: carto });
  var satImg = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, attribution: esri });
  var satLbl = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19 });
  var satellite = L.layerGroup([satImg, satLbl]);
  mapLayer.addTo(map);
  var bases = {};
  bases[i18n.map || "Map"] = mapLayer;
  bases[i18n.satellite || "Satellite"] = satellite;
  L.control.layers(bases, null, { position: "topright", collapsed: false }).addTo(map);
  new MutationObserver(function () { mapLayer.setUrl(cartoUrl()); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
}
function buildRouteGroup(map, pts) {
  var group = L.featureGroup();
  L.polyline(pts, { className: "route-line", weight: 3, opacity: 0.8 }).addTo(group);
  for (var i = 0; i < pts.length - 1; i++) {
    var pa = map.project(L.latLng(pts[i]), 1);
    var pb = map.project(L.latLng(pts[i + 1]), 1);
    var mid = map.unproject(L.point((pa.x + pb.x) / 2, (pa.y + pb.y) / 2), 1);
    var ang = Math.atan2(pb.y - pa.y, pb.x - pa.x) * 180 / Math.PI + 90;
    L.marker(mid, { icon: arrowIcon(ang), interactive: false, keyboard: false }).addTo(group);
  }
  return group;
}
function arrowIcon(deg) {
  return L.divIcon({
    className: "route-arrow",
    html: '<span style="transform:rotate(' + deg + 'deg)"><svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 1 11 11 6 8.5 1 11Z" fill="currentColor"/></svg></span>',
    iconSize: [14, 14], iconAnchor: [7, 7]
  });
}
function renderStats(data) {
  var el = document.getElementById("travel-stats");
  if (!el || !data) return;
  var places = 0, trips = 0, dist = 0, countries = {};
  data.forEach(function (d) {
    if (d.route && d.route.length) {
      places += d.route.length;
      if (d.route.length >= 2) {
        trips += 1;
        for (var i = 0; i < d.route.length - 1; i++) dist += haversine(d.route[i], d.route[i + 1]);
      }
    } else if (!isNaN(parseFloat(d.lat)) && !isNaN(parseFloat(d.lng))) {
      places += 1;
    }
    if (d.loc) {
      var parts = String(d.loc).split(",");
      var country = parts[parts.length - 1].trim();
      if (country) countries[country.toLowerCase()] = true;
    }
  });
  var stats = { places: places, trips: trips, countries: Object.keys(countries).length, distance: Math.round(dist) };
  Object.keys(stats).forEach(function (k) {
    var node = el.querySelector('[data-stat="' + k + '"]');
    if (node) countUp(node, stats[k]);
  });
}
function haversine(a, b) {
  var R = 6371;
  var la1 = parseFloat(a.lat) * Math.PI / 180, la2 = parseFloat(b.lat) * Math.PI / 180;
  var dLa = (parseFloat(b.lat) - parseFloat(a.lat)) * Math.PI / 180;
  var dLn = (parseFloat(b.lng) - parseFloat(a.lng)) * Math.PI / 180;
  var x = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(la1) * Math.cos(la2) * Math.sin(dLn / 2) * Math.sin(dLn / 2);
  return 2 * R * Math.asin(Math.sqrt(x));
}
function countUp(node, target) {
  var dur = 1100, start = null;
  function tick(ts) {
    if (start === null) start = ts;
    var p = Math.min((ts - start) / dur, 1);
    var eased = 1 - Math.pow(1 - p, 3);
    node.textContent = Math.round(eased * target).toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
    else node.textContent = target.toLocaleString();
  }
  requestAnimationFrame(tick);
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
}
function fixLeafletIcons() {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
  });
}
