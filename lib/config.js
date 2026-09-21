import { readFileSync, writeFileSync, watchFile } from 'fs';
import { randomBytes } from 'crypto';

let cfg = null;
let CONFIG_PATH = './loka.json';

function generateKey() {
  const bytes = randomBytes(32);
  const b64 = bytes.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return 'sk-' + b64;
}

export function loadConfig(path = './loka.json') {
  CONFIG_PATH = path;
  const raw = readFileSync(path, 'utf-8');
  const parsed = JSON.parse(raw);
  validate(parsed);

  let dirty = false;

  if (!Array.isArray(parsed.clients) || parsed.clients.length === 0) {
    parsed.clients = [{
      name: 'default',
      key: generateKey(),
      tier: 'unlimited'
    }];
    dirty = true;
  }

  for (const c of parsed.clients) {
    if (!c.key || !c.key.startsWith('sk-') || c.key === 'loka-local') {
      c.key = generateKey();
      dirty = true;
    }
  }

  // Set default status per provider
  for (const p of parsed.providers) {
    if (!p.status) {
      p.status = 'pending';
      dirty = true;
    }
  }

  if (dirty) {
    writeFileSync(path, JSON.stringify(parsed, null, 2));
  }

  cfg = parsed;
  return cfg;
}

function validate(c) {
  if (!c.port) throw new Error('config: port required');
  if (!Array.isArray(c.providers) || !c.providers.length)
    throw new Error('config: providers must be non-empty array');
  for (const p of c.providers) {
    if (!p.id) throw new Error('config: provider without id');
    if (!p.type) throw new Error(`config: provider ${p.id} without type`);
    if (!p.baseUrl) throw new Error(`config: provider ${p.id} without baseUrl`);
    if (!Array.isArray(p.apiKeys) || !p.apiKeys.length)
      throw new Error(`config: provider ${p.id} without apiKeys`);
    if (!Array.isArray(p.models) || !p.models.length)
      throw new Error(`config: provider ${p.id} without models`);
    if (typeof p.weight !== 'number') p.weight = 50;
  }
  if (!c.combos) c.combos = {};
}

export function getConfig() {
  if (!cfg) throw new Error('config not loaded');
  return cfg;
}

export function saveConfig() {
  if (!cfg) return;
  writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

export function watchConfig(path, onReload) {
  watchFile(path, { interval: 1000 }, () => {
    try {
      loadConfig(path);
      onReload?.();
    } catch (e) {
      console.error('[config] reload failed:', e.message);
    }
  });
}
