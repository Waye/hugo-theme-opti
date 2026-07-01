/* Wave page transition (Canvas 2D). */
(function () {
  "use strict";
  var REDUCE = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DUR_COVER = 1050, DUR_REVEAL = 1150;

  function cssVar(name) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v && v.trim()) || "#8f3a28";
  }
  function colorForEl(el) {
    var map = { "cat-bengara": "--bengara", "cat-ai": "--ai", "cat-koke": "--koke", "cat-kincha": "--kincha" };
    var node = el;
    while (node && node.classList) {
      for (var k in map) { if (node.classList.contains(k)) return cssVar(map[k]); }
      node = node.parentElement;
    }
    return cssVar("--bengara");
  }
  function makeCanvas() {
    var cv = document.getElementById("wave-canvas");
    if (!cv) { cv = document.createElement("canvas"); cv.id = "wave-canvas"; document.body.appendChild(cv); }
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth, h = window.innerHeight;
    cv.width = Math.floor(w * dpr); cv.height = Math.floor(h * dpr);
    var ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { cv: cv, ctx: ctx, w: w, h: h };
  }
  function drawWave(ctx, w, h, baseY, color, phase, side) {
    var amp = Math.min(30, h * 0.05);
    var k1 = (Math.PI * 2) / (w * 0.6), k2 = (Math.PI * 2) / (w * 0.27);
    var step = Math.max(4, w / 160), x;
    function edge(px) { return baseY + Math.sin(px * k1 + phase) * amp + Math.sin(px * k2 + phase * 1.7) * (amp * 0.4); }

    ctx.beginPath();
    if (side === "below") ctx.moveTo(0, h + 2); else ctx.moveTo(0, -2);
    for (x = 0; x <= w; x += step) { ctx.lineTo(x, edge(x)); }
    ctx.lineTo(w, edge(w));
    if (side === "below") { ctx.lineTo(w, h + 2); ctx.lineTo(0, h + 2); }
    else { ctx.lineTo(w, -2); ctx.lineTo(0, -2); }
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();

    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath();
    for (x = 0; x <= w; x += step) { if (x === 0) ctx.moveTo(0, edge(0)); else ctx.lineTo(x, edge(x)); }
    ctx.lineWidth = 14; ctx.strokeStyle = "rgba(255,252,246,0.16)"; ctx.stroke();   // glow
    ctx.lineWidth = 3.5; ctx.strokeStyle = "rgba(255,253,248,0.92)"; ctx.stroke();  // crest
    var dir = (side === "below") ? 1 : -1;
    for (x = 6; x <= w; x += 12) {                                                  // bubbles
      var hsh = Math.sin(x * 12.9898 + phase * 0.7) * 43758.5453; hsh = hsh - Math.floor(hsh);
      var ex = x + Math.sin(x * 0.05 + phase) * 9;
      var r = 1 + hsh * 3.2, off = dir * (3 + hsh * amp * 0.8);
      ctx.beginPath(); ctx.arc(ex, edge(ex) + off, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,253,248," + (0.35 + hsh * 0.45) + ")"; ctx.fill();
    }
  }
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function animate(o, color, fromY, toY, side, dur, onDone) {
    var start = performance.now();
    (function frame(now) {
      var t = Math.min(1, (now - start) / dur);
      var baseY = fromY + (toY - fromY) * easeInOut(t);
      o.ctx.clearRect(0, 0, o.w, o.h);
      drawWave(o.ctx, o.w, o.h, baseY, color, now / 300, side);
      if (t < 1) requestAnimationFrame(frame); else if (onDone) onDone();
    })(performance.now());
  }
  function coverUp(color, done) { var o = makeCanvas(); animate(o, color, o.h + 50, -50, "below", DUR_COVER, done); }
  function revealUp(color) {
    var o = makeCanvas();
    o.ctx.fillStyle = color; o.ctx.fillRect(0, 0, o.w, o.h);
    document.documentElement.classList.remove("wave-incoming");
    animate(o, color, o.h + 50, -50, "above", DUR_REVEAL, function () { if (o.cv && o.cv.parentNode) o.cv.parentNode.removeChild(o.cv); });
  }
  function eligible(a) {
    if (!a || !a.getAttribute) return false;
    var raw = a.getAttribute("href");
    if (!raw || raw.charAt(0) === "#") return false;
    if (a.target === "_blank" || a.hasAttribute("download")) return false;
    var u; try { u = new URL(a.href, location.href); } catch (e) { return false; }
    if (u.origin !== location.origin) return false;
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    if (u.pathname === location.pathname && (u.hash || raw.indexOf("#") > -1)) return false;
    return true;
  }
  document.addEventListener("click", function (ev) {
    if (REDUCE || ev.defaultPrevented || ev.button !== 0) return;
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    var a = ev.target.closest ? ev.target.closest("a") : null;
    if (!a || a.id === "mode" || a.id === "totop") return;
    if (!eligible(a)) return;
    ev.preventDefault();
    var href = a.href, color = colorForEl(a), navigated = false;
    function go() { if (navigated) return; navigated = true; try { sessionStorage.setItem("waveReveal", color); } catch (e) {} window.location.href = href; }
    coverUp(color, go);
    setTimeout(go, DUR_COVER + 350);
  }, false);
  function onReady() {
    var color = null;
    try { color = sessionStorage.getItem("waveReveal"); sessionStorage.removeItem("waveReveal"); } catch (e) {}
    if (color && !REDUCE) revealUp(color); else document.documentElement.classList.remove("wave-incoming");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", onReady); else onReady();
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    var cv = document.getElementById("wave-canvas"); if (cv && cv.parentNode) cv.parentNode.removeChild(cv);
    document.documentElement.classList.remove("wave-incoming");
  });
})();
