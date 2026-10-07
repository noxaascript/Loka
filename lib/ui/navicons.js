// Monochrome UI icon set for navigation and controls.
// 24x24 grid, 1.75 stroke, currentColor so it inherits text colour in both themes.
// Distinct from lib/ui/icons/ - those are third-party brand marks served as files.

const P = {
  home: '<path d="M3 10.4 12 3.2l9 7.2V20a1 1 0 0 1-1 1h-4.5v-6h-7v6H4a1 1 0 0 1-1-1z"/>',
  tunnel: '<circle cx="12" cy="12" r="2.1"/><path d="M8.1 8.1a5.5 5.5 0 0 0 0 7.8"/><path d="M15.9 15.9a5.5 5.5 0 0 0 0-7.8"/><path d="M5.2 5.2a9.6 9.6 0 0 0 0 13.6"/><path d="M18.8 18.8a9.6 9.6 0 0 0 0-13.6"/>',
  providers: '<rect x="3" y="3" width="7.6" height="7.6" rx="2.2"/><rect x="13.4" y="3" width="7.6" height="7.6" rx="2.2"/><rect x="3" y="13.4" width="7.6" height="7.6" rx="2.2"/><rect x="13.4" y="13.4" width="7.6" height="7.6" rx="2.2"/>',
  combos: '<path d="M16.5 3.5H21v4.5"/><path d="M3.5 20.5 20.5 3.5"/><path d="M21 16v4.5h-4.5"/><path d="m14.8 14.8 6.2 6.2"/><path d="m3.5 3.5 5.3 5.3"/>',
  saver: '<path d="M3.5 17.5a9 9 0 1 1 17 0"/><path d="m12 13.4 4.1-4.3"/><circle cx="12" cy="14.6" r="1.5"/><path d="M20.5 17.5h-3"/>',
  keys: '<circle cx="7.6" cy="12" r="4.1"/><path d="M11.7 12H21"/><path d="M17.2 12v3.4"/><path d="M20 12v2.4"/>',
  cli: '<rect x="2.6" y="4" width="18.8" height="16" rx="2.6"/><path d="m6.6 9.2 2.9 2.8-2.9 2.8"/><path d="M12.6 15h5"/>',
  usage: '<path d="M3.2 20.8h17.6"/><rect x="5" y="11" width="3.6" height="7" rx="1.2"/><rect x="10.2" y="5.6" width="3.6" height="12.4" rx="1.2"/><rect x="15.4" y="13.4" width="3.6" height="4.6" rx="1.2"/>',
  logs: '<path d="M4 6.2h16"/><path d="M4 12h16"/><path d="M4 17.8h10.5"/>',
  settings: '<path d="M4 6.2h9.5"/><path d="M17.6 6.2H20"/><circle cx="15.7" cy="6.2" r="1.9"/><path d="M4 12h3.4"/><path d="M11.4 12H20"/><circle cx="9.6" cy="12" r="1.9"/><path d="M4 17.8h9.5"/><path d="M17.6 17.8H20"/><circle cx="15.7" cy="17.8" r="1.9"/>',
  update: '<path d="M20.6 12a8.6 8.6 0 1 1-3.4-6.8"/><path d="M21 3.6v5.2h-5.2"/>',
  sun: '<circle cx="12" cy="12" r="4.1"/><path d="M12 2.4v2.2"/><path d="M12 19.4v2.2"/><path d="m4.9 4.9 1.6 1.6"/><path d="m17.5 17.5 1.6 1.6"/><path d="M2.4 12h2.2"/><path d="M19.4 12h2.2"/><path d="m6.5 17.5-1.6 1.6"/><path d="m19.1 4.9-1.6 1.6"/>',
  moon: '<path d="M20.8 13.1A8.9 8.9 0 1 1 10.9 3.2a6.9 6.9 0 0 0 9.9 9.9z"/>',
  menu: '<path d="M3.4 6.4h17.2"/><path d="M3.4 12h17.2"/><path d="M3.4 17.6h17.2"/>',
  close: '<path d="M5.6 5.6l12.8 12.8"/><path d="M18.4 5.6 5.6 18.4"/>',
  trash: '<path d="M4.6 6.6h14.8"/><path d="M9.4 6.6V4.9a1.3 1.3 0 0 1 1.3-1.3h2.6a1.3 1.3 0 0 1 1.3 1.3v1.7"/><path d="M6.6 6.6l.8 12a1.4 1.4 0 0 0 1.4 1.3h6.4a1.4 1.4 0 0 0 1.4-1.3l.8-12"/><path d="M10.4 10.4v6"/><path d="M13.6 10.4v6"/>'
};

export function uiIcon(name, size = 18) {
  const body = P[name];
  if (!body) return '';
  return '<svg class="ui-icon" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none"'
    + ' stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"'
    + ' aria-hidden="true" focusable="false">' + body + '</svg>';
}

export const UI_ICON_NAMES = Object.keys(P);
