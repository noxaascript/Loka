import { getConfig } from './config.js';

function normalize(name) {
  if (!name) return '';
  let s = String(name).trim();
  s = s.replace(/^loka\//i, '');
  s = s.replace(/^combo\//i, '');
  return s;
}

export function expandCombo(name) {
  const cfg = getConfig();
  const key = normalize(name);
  if (!key) return null;
  const combo = cfg.combos?.[key];
  if (!combo || !combo.length) return null;
  return combo;
}

export function isCombo(name) {
  const cfg = getConfig();
  const key = normalize(name);
  return Boolean(cfg.combos?.[key] && cfg.combos[key].length);
}

export function listCombos() {
  const cfg = getConfig();
  return Object.keys(cfg.combos || {});
}

export function comboName(name) {
  return normalize(name);
}

//  Validitas model 

// Build map: providerId -> Set(model), plus set global model (union)
export function buildModelIndex(cfg) {
  const byProvider = new Map();
  const all = new Set();
  for (const p of cfg.providers || []) {
    const set = new Set();
    for (const m of p.models || []) {
      set.add(m);
      all.add(m);
    }
    byProvider.set(p.id, set);
  }
  return { byProvider, all };
}

// Cek apakah model reference valid
// Format: "model" atau "providerId/model"
export function isModelValid(ref, index) {
  if (!ref || typeof ref !== 'string') return false;
  const s = ref.trim();
  if (!s) return false;
  const slash = s.indexOf('/');
  if (slash > 0) {
    const pid = s.slice(0, slash);
    const mid = s.slice(slash + 1);
    const set = index.byProvider.get(pid);
    return Boolean(set && set.has(mid));
  }
  return index.all.has(s);
}

// Buang model yang gak valid dari semua combo
// Return: { changed: n, removed: [{ combo, model }] }
export function pruneInvalidComboModels(cfg) {
  const index = buildModelIndex(cfg);
  const removed = [];
  let changed = 0;

  const combos = cfg.combos || {};
  for (const [name, arr] of Object.entries(combos)) {
    if (!Array.isArray(arr)) continue;
    const before = arr.length;
    const next = arr.filter(m => {
      const ok = isModelValid(m, index);
      if (!ok) removed.push({ combo: name, model: m });
      return ok;
    });
    if (next.length !== before) {
      combos[name] = next;
      changed++;
    }
  }

  return { changed, removed };
}

// Hapus spesifik model dari semua combo (untuk remove key / disconnect)
export function removeModelFromAllCombos(cfg, providerId, modelName) {
  const removed = [];
  let changed = 0;
  const bare = providerId + '/' + modelName;

  for (const [name, arr] of Object.entries(cfg.combos || {})) {
    if (!Array.isArray(arr)) continue;
    const before = arr.length;
    const next = arr.filter(m => {
      const s = typeof m === 'string' ? m.trim() : '';
      const isTarget = s === bare || s === modelName;
      if (isTarget) removed.push({ combo: name, model: m });
      return !isTarget;
    });
    if (next.length !== before) {
      cfg.combos[name] = next;
      changed++;
    }
  }

  return { changed, removed };
}

// List model valid untuk UI combo editor
// providersFilter: array of providerId, atau null = semua
export function listAvailableModels(cfg, providersFilter) {
  const out = [];
  const filter = providersFilter && providersFilter.length
    ? new Set(providersFilter)
    : null;

  for (const p of cfg.providers || []) {
    if (filter && !filter.has(p.id)) continue;
    for (const m of p.models || []) {
      out.push({ provider: p.id, model: m, ref: p.id + '/' + m });
    }
  }
  return out;
}
