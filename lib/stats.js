import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const FILE = './data/stats.json';

function ensure() {
  const dir = dirname(FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function load() {
  ensure();
  if (!existsSync(FILE)) return { providers: {}, clients: {}, totals: { req: 0, tokens: 0 } };
  try { return JSON.parse(readFileSync(FILE, 'utf-8')); }
  catch { return { providers: {}, clients: {}, totals: { req: 0, tokens: 0 } }; }
}

let state = load();

function persist() {
  ensure();
  writeFileSync(FILE, JSON.stringify(state, null, 2));
}

export function bumpProvider(id, { success, latency = 0, tokens = 0, error = null }) {
  const p = state.providers[id] ||= {
    success: 0, fail: 0, tokens: 0, latencySum: 0,
    lastError: null, lastUsed: null, streak: 0
  };
  if (success) {
    p.success++;
    p.streak = p.streak >= 0 ? p.streak + 1 : 1;
    p.tokens += tokens;
    p.latencySum += latency;
  } else {
    p.fail++;
    p.streak = p.streak <= 0 ? p.streak - 1 : -1;
    p.lastError = error;
  }
  p.lastUsed = new Date().toISOString();
  state.totals.req++;
  state.totals.tokens += tokens;
  persist();
}

export function bumpClient(name, tokens = 0) {
  const c = state.clients[name] ||= { req: 0, tokens: 0 };
  c.req++;
  c.tokens += tokens;
  persist();
}

export function getStats() {
  return JSON.parse(JSON.stringify(state));
}

export function avgLatency(id) {
  const p = state.providers[id];
  if (!p || !p.success) return 0;
  return Math.round(p.latencySum / p.success);
}
