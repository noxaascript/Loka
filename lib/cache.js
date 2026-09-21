import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const FILE = './data/cache.json';

function ensure() {
  const dir = dirname(FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function load() {
  ensure();
  if (!existsSync(FILE)) return {};
  try { return JSON.parse(readFileSync(FILE, 'utf-8')); } catch { return {}; }
}

let store = load();
function persist() { ensure(); writeFileSync(FILE, JSON.stringify(store)); }

export function keyOf(body) {
  const norm = JSON.stringify({
    messages: body.messages,
    temperature: body.temperature ?? 0.7,
    model: body.model
  });
  return createHash('sha256').update(norm).digest('hex').slice(0, 16);
}

export function get(k) {
  const entry = store[k];
  if (!entry) return null;
  if (Date.now() > entry.expires) { delete store[k]; persist(); return null; }
  return entry.value;
}

export function set(k, value, ttlMs = 300000) {
  store[k] = { value, expires: Date.now() + ttlMs };
  persist();
  prune();
}

export function prune(max = 500) {
  const keys = Object.keys(store);
  if (keys.length <= max) return;
  const sorted = keys.map(k => [k, store[k].expires]).sort((a, b) => a[1] - b[1]);
  for (const [k] of sorted.slice(0, keys.length - max)) delete store[k];
  persist();
}

export function clear() { store = {}; persist(); }
