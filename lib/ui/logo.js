// Loka brand mark - inline SVG.
// A routing node that forks one inbound request across many outbound providers.
// Vector only: scales to any DPI, themes with the UI, and costs ~1KB instead of a
// 936KB base64 PNG that used to be inlined into every single page.

let _uid = 0;
function gradId() { return 'loka-g' + (++_uid); }

function gradientDef(id) {
  return '<linearGradient id="' + id + '" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">'
    + '<stop stop-color="#f59e0b"/><stop offset=".55" stop-color="#ea580c"/><stop offset="1" stop-color="#e64f1e"/>'
    + '</linearGradient>';
}

// Full mark: rounded brand-gradient tile with the routing glyph knocked out in white.
export function logoMark(size = 32) {
  const g = gradId();
  return '<svg class="logo-mark" width="' + size + '" height="' + size + '" viewBox="0 0 32 32"'
    + ' fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Loka">'
    + '<defs>' + gradientDef(g) + '</defs>'
    + '<rect width="32" height="32" rx="9.5" fill="url(#' + g + ')"/>'
    + '<rect x=".5" y=".5" width="31" height="31" rx="9" stroke="#fff" stroke-opacity=".22"/>'
    + '<g stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none">'
    + '<path d="M10.5 16h2.2"/>'
    + '<path d="M12.7 16c0 0 2.1-5.4 5.9-5.4h3.1"/>'
    + '<path d="M12.7 16c0 0 2.1 5.4 5.9 5.4h3.1"/>'
    + '</g>'
    + '<circle cx="9" cy="16" r="2.7" fill="#fff"/>'
    + '<circle cx="23.4" cy="10.6" r="2.7" fill="#fff"/>'
    + '<circle cx="23.4" cy="21.4" r="2.7" fill="#fff"/>'
    + '</svg>';
}


