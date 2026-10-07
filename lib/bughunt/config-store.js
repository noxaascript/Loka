import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');
const CONFIG_FILE = join(DATA_DIR, 'bughunt.json');

function ensure() { if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true }); }

function load() {
  ensure();
  try {
    if (!existsSync(CONFIG_FILE)) return null;
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
  } catch { return null; }
}

function save(c) {
  ensure();
  writeFileSync(CONFIG_FILE, JSON.stringify(c, null, 2));
}

export function getBughuntConfig() {
  let c = load();
  if (!c) {
    c = {
      enabled: true,
      path: '/_x' + randomBytes(4).toString('hex'),
      devKey: randomBytes(32).toString('hex'),
      webhookUrl: '',
      createdAt: new Date().toISOString()
    };
    save(c);
  }
  return c;
}

export function updateBughuntConfig(patch) {
  const c = getBughuntConfig();
  Object.assign(c, patch);
  save(c);
  return c;
}

export function isEnabled() {
  if (process.env.LOKA_DEV === '1') return true;
  return getBughuntConfig().enabled !== false;
}

export function regenerate() {
  const c = getBughuntConfig();
  c.path = '/_x' + randomBytes(4).toString('hex');
  c.devKey = randomBytes(32).toString('hex');
  save(c);
  return c;
}
