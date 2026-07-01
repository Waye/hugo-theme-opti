(function () {
  var el = document.getElementById("post-map");
  if (!el || typeof L === "undefined") return;
  var i18n = window.MAP_I18N || {};
  var STOP = i18n.stop || "Stop";
  fixLeafletIcons();
  var map = L.map(el, { scrollWheelZoom: false });
  setupTiles(map);
  var route = window.POST_ROUTE && window.POST_ROUTE.length >= 2 ? window.POST_ROUTE : null;
  if (route) {
    var pts = [];
    route.forEach(function (p, i) {
      var lat = parseFloat(p.lat), lng = parseFloat(p.lng);
      if (isNaN(lat) || isNaN(lng)) return;
      pts.push([lat, lng]);
      L.marker([lat, lng], { icon: numIcon(i + 1) }).addTo(map)
        .bindPopup(p.name ? esc(p.name) : STOP + " " + (i + 1));
    });
    var group = buildRouteGroup(map, pts);
    group.addTo(map);
    map.fitBounds(group.getBounds(), { padding: [35, 35] });
  } else {
    var lat = parseFloat(el.dataset.lat), lng = parseFloat(el.dataset.lng);
    if (isNaN(lat) || isNaN(lng)) return;
    map.setView([lat, lng], 13);
    var marker = L.marker([lat, lng]).addTo(map);
    if (el.dataset.label) marker.bindPopup(esc(el.dataset.label)).openPopup();
  }
  map.on("focus", function () { map.scrollWheelZoom.enable(); });
  map.on("blur", function () { map.scrollWheelZoom.disable(); });
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
  L.polyline(pts, { className: "route-line", weight: 4, opacity: 0.85 }).addTo(group);
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
function numIcon(n) {
  return L.divIcon({ className: "route-pin", html: String(n), iconSize: [26, 26], iconAnchor: [13, 13], popupAnchor: [0, -14] });
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
