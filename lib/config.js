import { readFileSync, writeFileSync, watchFile, existsSync, mkdirSync, copyFileSync } from 'fs';
import { randomBytes } from 'crypto';
import { join, dirname } from 'path';
import { homedir } from 'os';

const HOME_DIR = join(homedir(), '.config', 'loka');
const CONFIG_FILE = join(HOME_DIR, 'loka.json');

let cfg = null;
let CONFIG_PATH = CONFIG_FILE;

function ensureDir() {
  if (!existsSync(HOME_DIR)) mkdirSync(HOME_DIR, { recursive: true });
}

function generateKey() {
  const bytes = randomBytes(32);
  return 'sk-' + bytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function getConfigPath() {
  return CONFIG_PATH;
}

export function loadConfig(path) {
  ensureDir();

  // Kalau path dikasih, pakai itu (untuk backward compat)
  // Tapi kalau nggak, pakai lokasi tetap di home
  const targetPath = path || CONFIG_FILE;

  // Migrasi: kalau ada loka.json di cwd tapi nggak di home, pindahin
  const cwdPath = join(process.cwd(), 'loka.json');
  if (!existsSync(targetPath) && existsSync(cwdPath) && cwdPath !== targetPath) {
    try {
      copyFileSync(cwdPath, targetPath);
      console.log('[config] migrated from cwd:', cwdPath);
    } catch (e) {
      console.log('[config] migrate failed:', e.message);
    }
  }

  CONFIG_PATH = targetPath;

  if (!existsSync(targetPath)) {
    const fresh = defaultConfig();
    writeFileSync(targetPath, JSON.stringify(fresh, null, 2));
    cfg = fresh;
    return cfg;
  }

  const raw = readFileSync(targetPath, 'utf8');
  const parsed = JSON.parse(raw);
  validate(parsed);

  let dirty = false;

  if (!Array.isArray(parsed.clients) || parsed.clients.length === 0) {
    parsed.clients = [{ name: 'default', key: generateKey(), tier: 'unlimited' }];
    dirty = true;
  }

  for (const c of parsed.clients) {
    if (!c.key || !c.key.startsWith('sk-') || c.key === 'loka-local') {
      c.key = generateKey();
      dirty = true;
    }
  }

  for (const p of parsed.providers) {
    if (!p.status) { p.status = 'pending'; dirty = true; }
    // Auto-ready provider dengan public key (nggak butuh auth real)
    const hasPublicKey = (p.apiKeys || []).some(k => k === 'public' || k === 'anonymous');
    if (hasPublicKey && p.status === 'pending') {
      p.status = 'ready';
      p.connectedAt = new Date().toISOString();
      p.autoConnected = true;
      dirty = true;
    }
  }

  if (dirty) {
    writeFileSync(targetPath, JSON.stringify(parsed, null, 2));
  }

  cfg = parsed;
  return cfg;
}

function defaultConfig() {
  return {
    port: 1455,
    host: '0.0.0.0',
    cooldownMs: 60000,
    maxRetries: 2,
    requestTimeoutMs: 60000,
    logLevel: 'error',
    cache: { enabled: true, ttlMs: 300000, maxEntries: 500 },
    rateLimit: { enabled: true, windowMs: 60000, maxRequests: 120 },
    rtk: { enabled: true, maxDiffLines: 200, maxGrepResults: 100 },
    clients: [{ name: 'default', key: generateKey(), tier: 'unlimited' }],
    combos: {},
    providers: [
      {
        id: 'openai-codex',
        type: 'openai-codex',
        baseUrl: 'https://chatgpt.com/backend-api/codex',
        apiKeys: ['oauth'],
        models: ['gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.5', 'gpt-5.4'],
        weight: 5,
        tags: ['oauth', 'smart'],
        status: 'pending'
      },
      {
        id: 'github-copilot',
        type: 'github-copilot',
        baseUrl: 'https://api.githubcopilot.com',
        apiKeys: ['oauth'],
        models: ['gpt-5', 'claude-sonnet-4-5'],
        weight: 8,
        tags: ['oauth', 'free'],
        status: 'pending'
      },
      {
        id: 'google-gemini-cli',
        type: 'google-gemini-cli',
        baseUrl: 'https://cloudcode-pa.googleapis.com',
        apiKeys: ['oauth'],
        models: ['gemini-2.5-flash', 'gemini-2.5-pro'],
        weight: 10,
        tags: ['oauth', 'free'],
        status: 'pending'
      },
      {
        id: 'groq',
        type: 'openai',
        baseUrl: 'https://api.groq.com/openai/v1',
        apiKeys: ['gsk_GANTI_KEY_GROQ'],
        models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
        weight: 20,
        tags: ['fast', 'apikey'],
        status: 'pending'
      }
    ]
  };
}

function validate(c) {
  if (!c.port) throw new Error('config: port required');
  if (!Array.isArray(c.providers) || !c.providers.length)
    throw new Error('config: providers must be non-empty array');
  for (const p of c.providers) {
    if (!p.id) throw new Error('config: provider without id');
    if (!p.type) throw new Error('config: provider ' + p.id + ' without type');
    if (!p.baseUrl) throw new Error('config: provider ' + p.id + ' without baseUrl');
    if (!Array.isArray(p.apiKeys) || !p.apiKeys.length)
      throw new Error('config: provider ' + p.id + ' without apiKeys');
    if (!Array.isArray(p.models) || !p.models.length)
      throw new Error('config: provider ' + p.id + ' without models');
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
  ensureDir();
  writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

export function watchConfig(path, onReload) {
  const target = path || CONFIG_FILE;
  watchFile(target, { interval: 1000 }, () => {
    try {
      loadConfig(target);
      onReload?.();
    } catch (e) {
      console.error('[config] reload failed:', e.message);
    }
  });
}