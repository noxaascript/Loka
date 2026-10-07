import { CSS } from './style.js';
import { logoMark } from './logo.js';
import { uiIcon } from './navicons.js';
import { getVersion } from '../version.js';
import { getConfig } from '../config.js';

const NAV = [
  { section: 'Main' },
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/tunnel', label: 'Tunnel', icon: 'tunnel' },
  { href: '/providers', label: 'Providers', icon: 'providers' },
  { href: '/combos', label: 'Combos', icon: 'combos' },
  { href: '/token-saver', label: 'Token Saver', icon: 'saver' },
  { section: 'System' },
  { href: '/keys', label: 'API Keys', icon: 'keys' },
  { href: '/cli', label: 'CLI Tools', icon: 'cli' },
  { href: '/usage', label: 'Usage', icon: 'usage' },
  { href: '/logs', label: 'Console Log', icon: 'logs' },
  { href: '/settings', label: 'Settings', icon: 'settings' }
];

function scopeFor(active) {
  for (const item of NAV) {
    if (item.href && item.href === active) {
      return item.label.toLowerCase().replace(/\s+/g, '-') || 'home';
    }
  }
  return String(active || '/').replace(/^\//, '').replace(/[^a-z0-9-]+/gi, '-') || 'home';
}

function pad2(n) {
  return n < 10 ? '0' + n : '' + n;
}

function tickerHtml() {
  try {
    const cfg = getConfig();
    const total = (cfg.providers || []).length;
    const ready = (cfg.providers || []).filter(p => p.status === 'ready').length;
    const combos = Object.keys(cfg.combos || {}).length;
    const rl = cfg.rateLimit && cfg.rateLimit.enabled
      ? (cfg.rateLimit.maxRequests || '') + '/min' : 'off';
    const cache = cfg.cache && cfg.cache.enabled ? 'on' : 'off';
    const rtk = cfg.rtk && cfg.rtk.enabled ? 'on' : 'off';
    const segs = [
      '<span><b>' + ready + '</b><span class="dim">/' + total + '</span> online</span>',
      '<span class="sep">·</span>',
      '<span>combos <b>' + combos + '</b></span>',
      '<span class="sep">·</span>',
      '<span>port <b>' + cfg.port + '</b></span>',
      '<span class="sep hide-sm">·</span>',
      '<span class="hide-sm">rl <b>' + rl + '</b></span>',
      '<span class="sep hide-sm">·</span>',
      '<span class="hide-sm">cache <b>' + cache + '</b></span>',
      '<span class="sep hide-sm">·</span>',
      '<span class="hide-sm">rtk <b>' + rtk + '</b></span>',
      '<span class="sep hide-sm">·</span>',
      '<span class="hide-sm hot">' + getVersion().short + '</span>',
      '<span class="cursor" aria-hidden="true"></span>'
    ];
    return '<div class="ticker" role="status">' + segs.join('') + '</div>';
  } catch (e) {
    return '';
  }
}

export function layout(title, body, { active = '/', refresh = 0, subtitle = '', scope } = {}) {
  const metaRefresh = refresh > 0
    ? '<meta http-equiv="refresh" content="' + refresh + '">' : '';

  let authKey = '';
  try {
    const cfg = getConfig();
    authKey = (cfg.clients && cfg.clients[0] && cfg.clients[0].key) || '';
  } catch (e) {}

  const ver = getVersion();
  const scopeText = (scope || scopeFor(active)).toLowerCase();

  let idx = 0;
  const nav = NAV.map(item => {
    if (item.section) return '<div class="section-label">' + item.section + '</div>';
    idx += 1;
    const on = item.href === active;
    const cls = 'nav-item' + (on ? ' active' : '');
    return '<a href="' + item.href + '" class="' + cls + '"' + (on ? ' aria-current="page"' : '') + '>'
      + '<span class="nav-icon">' + uiIcon(item.icon, 17) + '</span>'
      + '<span class="nav-label">' + item.label + '</span>'
      + '<span class="nav-idx">' + pad2(idx) + '</span>'
      + '</a>';
  }).join('');

  const head = [
    '<!DOCTYPE html>',
    '<html lang="en" data-theme="dark">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=5">',
    '<meta name="color-scheme" content="dark light">',
    '<title>' + title + ' · Loka</title>',
    metaRefresh,
    '<link rel="icon" type="image/svg+xml" href="/icons/loka.svg">',
    '<script>(function(){try{var t=localStorage.getItem("loka-theme")||"dark";document.documentElement.setAttribute("data-theme",t)}catch(e){}})();<\/script>',
    '<script>window.LOKA_UI_ICONS={trash:' + JSON.stringify(uiIcon('trash', 13)) + ',close:' + JSON.stringify(uiIcon('close', 15)) + '};window.uiIcon=function(n){return window.LOKA_UI_ICONS[n]||""};<\/script>',
    '<style>' + CSS + '</style>',
    '</head>'
  ].join('\n');

  const bodyHtml = [
    '<body>',
    '<div class="ambient" aria-hidden="true"></div>',
    '<div class="sidebar-overlay" id="sidebarOverlay"></div>',
    '<button class="menu-toggle" onclick="toggleRail()" aria-label="Toggle navigation">' + uiIcon('menu', 20) + '</button>',
    '<button id="railToggle" onclick="toggleRail()" aria-label="Expand rail" title="Expand rail"><span aria-hidden="true">‹</span></button>',
    '<aside id="sidebar">',
    '  <div class="brand">',
    '    <a class="brand-glyph" href="/" aria-label="Loka home">' + logoMark(30) + '<span class="brand-name">Loka</span></a>',
    '    <div class="version-pill" title="' + ver.display + '">' + ver.short + '</div>',
    '    <button class="update-badge" id="updateBadge" style="display:none" onclick="sidebarUpdateNow()">'
      + uiIcon('update', 13) + '<span>Update</span></button>',
    '  </div>',
    '  <nav>' + nav + '</nav>',
    '  <div class="sidebar-foot">',
    '    <button class="icon-btn" onclick="toggleTheme()" title="Toggle theme" aria-label="Toggle theme">'
      + '<span id="themeIcon" class="theme-icon"></span></button>',
    '  </div>',
    '</aside>',
    '<main>',
    '  <header class="page-header">',
    '    <div class="page-eyebrow"><span class="eb-slang">// loka</span><span aria-hidden="true"> › </span><span>' + scopeText + '</span></div>',
    '    <h1>' + title + '</h1>',
    subtitle ? '    <p class="page-subtitle">' + subtitle + '</p>' : '',
    '  </header>',
    tickerHtml(),
    body,
    '</main>',
    '<div class="loka-dialog-overlay" id="lokaDialog" style="display:none">',
    '  <div class="loka-dialog" role="dialog" aria-modal="true" aria-labelledby="lokaDialogTitle">',
    '    <div class="loka-dialog-icon" id="lokaDialogIcon">?</div>',
    '    <h3 id="lokaDialogTitle"></h3>',
    '    <p id="lokaDialogMessage"></p>',
    '    <div id="lokaDialogInputWrap" style="display:none;margin-bottom:1.35rem"></div>',
    '    <div class="loka-dialog-actions">',
    '      <button class="ghost" id="lokaDialogCancel">Cancel</button>',
    '      <button id="lokaDialogConfirm">OK</button>',
    '    </div>',
    '  </div>',
    '</div>',
    '<div class="toast" id="toast" role="status" aria-live="polite"></div>'
  ].join('\n');

  const scriptJS = [
    '<script>',
    'var LOKA_KEY = ' + JSON.stringify(authKey) + ';',
    'window.LOKA_KEY = LOKA_KEY;',
    'var THEME_ICONS = {',
    '  sun: ' + JSON.stringify(uiIcon('sun', 17)) + ',',
    '  moon: ' + JSON.stringify(uiIcon('moon', 17)) + ',',
    '};',
    '',
    'window.toast = function(m, o) {',
    '  var t = document.getElementById("toast");',
    '  var d = (o && o.duration) || 2500;',
    '  t.textContent = m;',
    '  t.classList.add("show");',
    '  clearTimeout(t._t);',
    '  t._t = setTimeout(function(){ t.classList.remove("show"); }, d);',
    '};',
    '',
    'function isMobile() { return window.matchMedia("(max-width:900px)").matches; }',
    '',
    'function toggleRail() {',
    '  var open = document.body.classList.toggle("rail-open");',
    '  var ov = document.getElementById("sidebarOverlay");',
    '  if (isMobile()) {',
    '    if (open && ov) ov.classList.add("show");',
    '    else if (ov) ov.classList.remove("show");',
    '  }',
    '  try { localStorage.setItem("loka-rail", open ? "open" : "closed"); } catch(e) {}',
    '}',
    '',
    'function closeRail() {',
    '  if (!document.body.classList.contains("rail-open")) return;',
    '  document.body.classList.remove("rail-open");',
    '  var ov = document.getElementById("sidebarOverlay");',
    '  if (ov) ov.classList.remove("show");',
    '  try { localStorage.setItem("loka-rail", "closed"); } catch(e) {}',
    '}',
    '',
    'window.toggleRail = toggleRail;',
    'window.closeSidebar = closeRail;',
    '',
    'function toggleTheme() {',
    '  var cur = document.documentElement.getAttribute("data-theme");',
    '  var next = cur === "dark" ? "light" : "dark";',
    '  document.documentElement.setAttribute("data-theme", next);',
    '  try { localStorage.setItem("loka-theme", next); } catch(e) {}',
    '  syncThemeIcon();',
    '}',
    '',
    'function syncThemeIcon() {',
    '  var t = document.documentElement.getAttribute("data-theme");',
    '  var i = document.getElementById("themeIcon");',
    '  if (!i) return;',
    '  i.innerHTML = t === "dark" ? THEME_ICONS.moon : THEME_ICONS.sun;',
    '  var b = i.parentNode;',
    '  if (b) b.title = t === "dark" ? "Switch to light theme" : "Switch to dark theme";',
    '}',
    'syncThemeIcon();',
    '',
    '// Update flow, reachable from the sidebar badge on every page.',
    'window.sidebarUpdateNow = async function() {',
    '  var okd = await window.dialog.confirm(',
    '    "Update Loka to the latest version?\\n\\nAfter updating, restart manually: Ctrl+C in the terminal, then node index.js.",',
    '    { title: "Update Loka" }',
    '  );',
    '  if (!okd) return;',
    '  try {',
    '    var r = await fetch("/api/update/proxy", { method: "POST", headers: { "Authorization": "Bearer " + LOKA_KEY } });',
    '    var d = await r.json();',
    '    if (d.ok) {',
    '      window.toast("Update successful. Restart manually: Ctrl+C then node index.js", { duration: 20000 });',
    '    } else {',
    '      window.toast("Failed: " + (d.error || "unknown"), { duration: 8000 });',
    '    }',
    '  } catch (e) {',
    '    window.toast("Error: " + e.message, { duration: 8000 });',
    '  }',
    '};',
    '',
    '// Restore rail + legacy sidebar state',
    '(function() {',
    '  try {',
    '    var r = localStorage.getItem("loka-rail");',
    '    var legacy = localStorage.getItem("loka-sidebar");',
    '    var open = r === "open" || (!r && legacy === "shown");',
    '    if (open) document.body.classList.add("rail-open");',
    '    var m = isMobile();',
    '    if (open && m) {',
    '      var ov = document.getElementById("sidebarOverlay");',
    '      if (ov) ov.classList.add("show");',
    '    }',
    '  } catch(e) {}',
    '})();',
    '',
    '// Overlay click closes the rail/drawer',
    'document.getElementById("sidebarOverlay").addEventListener("click", closeRail);',
    '',
    '// Nav link click closes the drawer on mobile',
    'document.querySelectorAll("aside nav a").forEach(function(a) {',
    '  a.addEventListener("click", function() {',
    '    if (isMobile()) closeRail();',
    '  });',
    '});',
    '',
    '// Escape key closes the drawer',
    'document.addEventListener("keydown", function(e) {',
    '  if (e.key === "Escape" && isMobile()) closeRail();',
    '});',
    '',
    '// Dialog system',
    'window.dialog = {',
    '  confirm: function(m, o) {',
    '    return window._showDialog({',
    '      title: (o && o.title) || "Confirm",',
    '      message: m,',
    '      confirmText: (o && o.confirmText) || "OK",',
    '      cancelText: (o && o.cancelText) || "Cancel",',
    '      icon: (o && o.icon) || "?"',
    '    });',
    '  },',
    '  alert: function(m, o) {',
    '    return window._showDialog({',
    '      title: (o && o.title) || "Info",',
    '      message: m,',
    '      confirmText: (o && o.confirmText) || "OK",',
    '      cancelText: null,',
    '      icon: (o && o.icon) || "i"',
    '    });',
    '  },',
    '  prompt: function(m, d, o) {',
    '    return window._showDialog({',
    '      title: (o && o.title) || "Input",',
    '      message: m,',
    '      input: true,',
    '      value: (d === undefined || d === null) ? "" : String(d),',
    '      confirmText: (o && o.confirmText) || "OK",',
    '      cancelText: (o && o.cancelText) || "Cancel",',
    '      icon: (o && o.icon) || ""',
    '    });',
    '  }',
    '};',
    '',
    'window._showDialog = function(opts) {',
    '  return new Promise(function(resolve) {',
    '    var ov = document.getElementById("lokaDialog");',
    '    var ic = document.getElementById("lokaDialogIcon");',
    '    var ti = document.getElementById("lokaDialogTitle");',
    '    var me = document.getElementById("lokaDialogMessage");',
    '    var wrap = document.getElementById("lokaDialogInputWrap");',
    '    var bc = document.getElementById("lokaDialogCancel");',
    '    var bk = document.getElementById("lokaDialogConfirm");',
    '',
    '    ic.textContent = opts.icon || "?";',
    '    ti.textContent = opts.title || "";',
    '    me.textContent = opts.message || "";',
    '    bk.textContent = opts.confirmText || "OK";',
    '    bc.textContent = opts.cancelText || "Cancel";',
    '    bc.style.display = opts.cancelText ? "" : "none";',
    '',
    '    wrap.innerHTML = "";',
    '    var input = null;',
    '    if (opts.input) {',
    '      wrap.style.display = "";',
    '      input = document.createElement("input");',
    '      input.type = "text";',
    '      input.autocomplete = "off";',
    '      input.autocorrect = "off";',
    '      input.autocapitalize = "off";',
    '      input.spellcheck = false;',
    '      input.name = "loka_dlg_" + Date.now() + "_" + Math.random().toString(36).slice(2);',
    '      input.value = opts.value || "";',
    '      wrap.appendChild(input);',
    '    } else {',
    '      wrap.style.display = "none";',
    '    }',
    '',
    '    ov.style.display = "flex";',
    '    if (input) setTimeout(function(){ input.focus(); input.select(); }, 60);',
    '',
    '    function done(v) {',
    '      ov.style.display = "none";',
    '      bk.removeEventListener("click", onOk);',
    '      bc.removeEventListener("click", onCancel);',
    '      ov.removeEventListener("click", onOverlay);',
    '      document.removeEventListener("keydown", onKey);',
    '      wrap.innerHTML = "";',
    '      resolve(v);',
    '    }',
    '    function onOk() { done(input ? input.value : true); }',
    '    function onCancel() { done(input ? null : false); }',
    '    function onOverlay(e) { if (e.target === ov) done(input ? null : false); }',
    '    function onKey(e) {',
    '      if (e.key === "Escape") done(input ? null : false);',
    '      else if (e.key === "Enter" && input) done(input.value);',
    '    }',
    '',
    '    bk.addEventListener("click", onOk);',
    '    bc.addEventListener("click", onCancel);',
    '    ov.addEventListener("click", onOverlay);',
    '    document.addEventListener("keydown", onKey);',
    '  });',
    '};',
    '',
    '// Tunnel notification poll',
    '(function() {',
    '  if (!LOKA_KEY) return;',
    '  var notified = {};',
    '  function poll() {',
    '    fetch("/api/tunnel/notifications", { headers: { "Authorization": "Bearer " + LOKA_KEY } })',
    '      .then(function(r){ return r.ok ? r.json() : null; })',
    '      .then(function(d) {',
    '        if (!d || !d.notifications || !d.notifications.length) return;',
    '        var fresh = d.notifications.filter(function(n){ return !notified[n.id]; });',
    '        if (!fresh.length) return;',
    '        fresh.forEach(function(n) {',
    '          notified[n.id] = true;',
    '          window.toast(n.message, { duration: 12000 });',
    '        });',
    '        fetch("/api/tunnel/mark-read", { method: "POST", headers: { "Authorization": "Bearer " + LOKA_KEY } }).catch(function(){});',
    '      })',
    '      .catch(function(){});',
    '  }',
    '  setTimeout(poll, 1500);',
    '  setInterval(poll, 20000);',
    '})();',
    '',
    '// Update check poll',
    '(function() {',
    '  if (!LOKA_KEY) return;',
    '  var shown = false;',
    '  function poll() {',
    '    fetch("/api/update/state", { headers: { "Authorization": "Bearer " + LOKA_KEY } })',
    '      .then(function(r){ return r.ok ? r.json() : null; })',
    '      .then(function(d) {',
    '        if (!d || !d.updateAvailable) return;',
    '        var badge = document.getElementById("updateBadge");',
    '        if (badge) {',
    '          badge.style.display = "flex";',
    '          badge.title = "Update: " + d.installed + " -> " + d.latest;',
    '        }',
    '        if (!shown) {',
    '          shown = true;',
    '          window.toast("Update available: " + d.latest, { duration: 10000 });',
    '        }',
    '      })',
    '      .catch(function(){});',
    '  }',
    '  setTimeout(poll, 3000);',
    '  setInterval(poll, 60000);',
    '})();',
    '<\/script>'
  ].join('\n');

  return head + '\n' + bodyHtml + '\n' + scriptJS + '\n</body>\n</html>';
}