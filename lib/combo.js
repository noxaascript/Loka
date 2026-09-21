import { getConfig } from './config.js';

export function expandCombo(name) {
  const cfg = getConfig();
  const combo = cfg.combos?.[name];
  if (!combo) return null;
  return combo;
}

export function isCombo(name) {
  const cfg = getConfig();
  return Boolean(cfg.combos?.[name]);
}

export function listCombos() {
  const cfg = getConfig();
  return Object.keys(cfg.combos || {});
}
