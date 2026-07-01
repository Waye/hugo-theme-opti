(() => {
  "use strict";
  var KEY = "scheme", KEY_C = "scheme-custom";
  var SCHEMES = ["entan","mushikuri","baikocha","tsuyukusa","noshimehana","kenpohzome","kurotsurubami"];
  var DARK = { noshimehana:1, kenpohzome:1, kurotsurubami:1 };
  var NAMES = {
    entan:["鉛丹","ENTAN"], mushikuri:["蒸栗","MUSHIKURI"], baikocha:["梅幸茶","BAIKOCHA"],
    tsuyukusa:["露草","TSUYUKUSA"], noshimehana:["熨斗目花","NOSHIMEHANA"],
    kenpohzome:["憲法染","KENPOHZOME"], kurotsurubami:["黒橡","KUROTSURUBAMI"]
  };
  var html = document.documentElement;
  function systemDark(){ return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches; }
  function get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
  function set(k,v){ try { localStorage.setItem(k,v); } catch(e){} }
  function del(k){ try { localStorage.removeItem(k); } catch(e){} }

  function setName(kanji, romaji){
    var el = document.getElementById("rail-colorname"); if(!el) return;
    var k = el.querySelector(".cn-kanji"), r = el.querySelector(".cn-romaji");
    if (k) k.textContent = kanji; if (r) r.textContent = romaji;
  }
  function markSwatch(name){
    var sw = document.querySelectorAll(".scheme-swatch");
    for (var i=0;i<sw.length;i++) sw[i].classList.toggle("is-active", sw[i].getAttribute("data-scheme")===name);
  }
  function lum(hex){
    var c = (hex||"").replace("#","");
    if (c.length===3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
    if (c.length!==6) return 0.5;
    var r=parseInt(c.substr(0,2),16)/255, g=parseInt(c.substr(2,2),16)/255, b=parseInt(c.substr(4,2),16)/255;
    function f(x){ return x<=0.03928 ? x/12.92 : Math.pow((x+0.055)/1.055,2.4); }
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b);
  }

  function applyCustom(hex){
    var dark = lum(hex) < 0.42;
    html.style.setProperty("--washi", hex);
    html.style.setProperty("--line", dark ? "#f0ede6" : "#1c1917");
    if (dark){ html.classList.add("dark"); html.classList.remove("light"); }
    else { html.classList.add("light"); html.classList.remove("dark"); }
    html.setAttribute("data-scheme","custom");
    markSwatch(null);
    setName("任意", (hex||"").toUpperCase());
    var ci = document.getElementById("scheme-custom-input"); if (ci) ci.value = hex;
  }

  function applyPreset(scheme){
    html.style.removeProperty("--washi");
    html.style.removeProperty("--line");
    var valid = scheme && SCHEMES.indexOf(scheme) > -1;
    if (valid){
      html.setAttribute("data-scheme", scheme);
      if (DARK[scheme]){ html.classList.add("dark"); html.classList.remove("light"); }
      else { html.classList.add("light"); html.classList.remove("dark"); }
    } else {
      html.removeAttribute("data-scheme");
      if (systemDark()){ html.classList.add("dark"); html.classList.remove("light"); }
      else { html.classList.add("light"); html.classList.remove("dark"); }
    }
    var eff = valid ? scheme : (systemDark() ? "kurotsurubami" : "mushikuri");
    markSwatch(eff);
    if (NAMES[eff]) setName(NAMES[eff][0], NAMES[eff][1]);
  }

  function boot(){
    var custom = get(KEY_C);
    if (custom) applyCustom(custom);
    else applyPreset(get(KEY));
  }

  boot();
  requestAnimationFrame(function(){ if (document.body) document.body.classList.remove("notransition"); });

  document.addEventListener("DOMContentLoaded", function(){
    var sw = document.querySelectorAll(".scheme-swatch:not(.scheme-custom)");
    for (var i=0;i<sw.length;i++) sw[i].addEventListener("click", function(){
      var s = this.getAttribute("data-scheme");
      del(KEY_C); set(KEY, s);
      applyPreset(s);
    });
    var ci = document.getElementById("scheme-custom-input");
    if (ci){
      var onPick = function(){ var v = ci.value; del(KEY); set(KEY_C, v); applyCustom(v); };
      ci.addEventListener("input", onPick);
      ci.addEventListener("change", onPick);
    }
    boot();
  });

  if (window.matchMedia) { try { window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function(){ if (!get(KEY_C) && !get(KEY)) applyPreset(null); }); } catch(e){} }
})();
