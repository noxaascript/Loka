import { CSS } from './style.js';

const NAV = [
  { href: '/', label: 'Home', icon: '' },
  { href: '/tunnel', label: 'Tunnel', icon: '' },
  { href: '/providers', label: 'Providers', icon: '' },
  { href: '/combos', label: 'Combos', icon: '' },
  { href: '/keys', label: 'API Keys', icon: '' },
  { href: '/cli', label: 'CLI Connector', icon: '' },
  { href: '/usage', label: 'Usage', icon: '' },
  { href: '/logs', label: 'Logs', icon: '' },
  { href: '/settings', label: 'Settings', icon: '' }
];

export function layout(title, body, { active = '/', refresh = 0 } = {}) {
  const metaRefresh = refresh > 0
    ? '<meta http-equiv="refresh" content="' + refresh + '">' : '';

  const nav = NAV.map(item =>
    '<a href="' + item.href + '" class="' + (item.href === active ? 'active' : '') + '">' +
      '<span class="nav-icon">' + item.icon + '</span>' +
      '<span class="nav-label">' + item.label + '</span>' +
    '</a>'
  ).join('');

  return '<!DOCTYPE html>' +
    '<html lang="en">' +
    '<head>' +
      '<meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + title + '  Loka</title>' +
      metaRefresh +
      '<style>' + CSS + '</style>' +
    '</head>' +
    '<body>' +
      '<button class="sidebar-toggle" onclick="toggleSidebar()" title="Show menu"></button>' +
      '<aside id="sidebar">' +
        '<div class="brand">' +
          '<h1> Loka</h1>' +
          '<small>AI Router</small>' +
        '</div>' +
        '<nav>' + nav + '</nav>' +
        '<button class="hide-btn" onclick="toggleSidebar()">' +
          '<span></span> <span>Hide menu</span>' +
        '</button>' +
      '</aside>' +
      '<main>' +
        '<h1>' + title + '</h1>' +
        body +
      '</main>' +
      '<div class="toast" id="toast"></div>' +
      '<script>' +
        'window.toast = function(msg) {' +
          'var t = document.getElementById("toast");' +
          't.textContent = msg;' +
          't.classList.add("show");' +
          'clearTimeout(t._t);' +
          't._t = setTimeout(function(){ t.classList.remove("show"); }, 2500);' +
        '};' +
        'function toggleSidebar() {' +
          'var hidden = document.body.classList.toggle("sidebar-hidden");' +
          'localStorage.setItem("loka-sidebar", hidden ? "hidden" : "shown");' +
        '}' +
        'var saved = localStorage.getItem("loka-sidebar");' +
        'var isMobile = window.matchMedia("(max-width:900px)").matches;' +
        'if (saved === "hidden" || (saved === null && isMobile)) {' +
          'document.body.classList.add("sidebar-hidden");' +
        '}' +
        'document.querySelectorAll("aside nav a").forEach(function(a){' +
          'a.addEventListener("click", function(){' +
            'if (window.matchMedia("(max-width:900px)").matches) {' +
              'document.body.classList.add("sidebar-hidden");' +
              'localStorage.setItem("loka-sidebar", "hidden");' +
            '}' +
          '});' +
        '});' +
      '<\/script>' +
    '</body>' +
    '</html>';
}