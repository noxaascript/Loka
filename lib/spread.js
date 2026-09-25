// Rounding Spread  rotasi API key per provider biar gak satu key kena limit terus.
// Cursor disimpan per provider.id.

const cursors = new Map();

function cleanKeys(provider) {
  const arr = Array.isArray(provider && provider.apiKeys) ? provider.apiKeys : [];
  return arr
    .map(k => (typeof k === 'string' ? k.trim() : ''))
    .filter(k => k && !k.includes('GANTI_KEY') && k !== 'oauth');
}

export function nextKeySpread(provider) {
  const keys = cleanKeys(provider);
  if (!keys.length) return null;
  const cur = cursors.get(provider.id) || 0;
  const key = keys[cur % keys.length];
  cursors.set(provider.id, (cur + 1) % keys.length);
  return key;
}

export function peekSpreadIndex(provider) {
  return cursors.get(provider.id) || 0;
}

export function resetSpread(providerId) {
  cursors.delete(providerId);
}

export function spreadStats() {
  const out = {};
  for (const [id, idx] of cursors.entries()) out[id] = idx;
  return out;
}

// Sticky-key helper: kalau cuma 1 key, selalu balikin key itu
export function hasMultipleKeys(provider) {
  return cleanKeys(provider).length > 1;
}
