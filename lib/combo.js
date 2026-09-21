import { getConfig } from './config.js';

function normalize(name) {
  if (!name) return '';
  let s = String(name).trim();
  // Strip prefix yang biasa dipakai client
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