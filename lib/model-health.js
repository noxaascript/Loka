import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const FILE = './data/model-health.json';
const BLACKLIST_TTL = 24 * 3600 * 1000; // 24 jam

function ensure() {
  const dir = dirname(FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function load() {
  ensure();
  if (!existsSync(FILE)) return {};
  try { return JSON.parse(readFileSync(FILE, 'utf8')); } catch { return {}; }
}

let state = load();

function persist() {
  ensure();
  writeFileSync(FILE, JSON.stringify(state, null, 2));
}

function key(providerId, model) {
  return providerId + '::' + model;
}

export function isBlacklisted(providerId, model) {
  const entry = state[key(providerId, model)];
  if (!entry) return false;
  if (Date.now() > entry.until) {
    delete state[key(providerId, model)];
    persist();
    return false;
  }
  return true;
}

export function blacklist(providerId, model, reason, ttlMs) {
  state[key(providerId, model)] = {
    reason: String(reason).slice(0, 200),
    until: Date.now() + (ttlMs || BLACKLIST_TTL),
    addedAt: new Date().toISOString()
  };
  persist();
}

export function unblacklist(providerId, model) {
  delete state[key(providerId, model)];
  persist();
}

export function listBlacklisted() {
  const now = Date.now();
  const out = [];
  for (const k of Object.keys(state)) {
    if (state[k].until > now) {
      const [pid, model] = k.split('::');
      out.push({ providerId: pid, model, ...state[k] });
    }
  }
  return out;
}

export function clearExpired() {
  const now = Date.now();
  let changed = false;
  for (const k of Object.keys(state)) {
    if (state[k].until <= now) {
      delete state[k];
      changed = true;
    }
  }
  if (changed) persist();
}