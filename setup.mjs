#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { execSync, spawn } from 'child_process';
import { randomBytes } from 'crypto';
import { networkInterfaces } from 'os';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { homedir } from 'os';

// ===== PATH CONSTANTS (declare dulu sebelum dipakai) =====
const PKG_DIR = dirname(fileURLToPath(import.meta.url));
const HOME_DIR = join(homedir(), '.config', 'loka');
const CFG_PATH = join(HOME_DIR, 'loka.json');

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';

function log(msg) { console.log(msg); }
function ok(msg) { log(`${GREEN}${RESET} ${msg}`); }
function info(msg) { log(`${CYAN}?${RESET} ${msg}`); }
function warn(msg) { log(`${YELLOW}${RESET} ${msg}`); }
function err(msg) { log(`${RED}${RESET} ${msg}`); }

function generateKey() {
  const bytes = randomBytes(32);
  return 'sk-' + bytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function getLANIPs() {
  const nets = networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push({ iface: name, ip: net.address });
      }
    }
  }
  return ips;
}

function defaultConfig() {
  return {
    port: 1455,
    host: '0.0.0.0',
    cooldownMs: 60000,
    maxRetries: 2,
    requestTimeoutMs: 60000,
    logLevel: 'error',
    autoTunnel: true,
    cache: { enabled: true, ttlMs: 300000, maxEntries: 500 },
    rateLimit: { enabled: true, windowMs: 60000, maxRequests: 120 },
    rtk: { enabled: true, maxDiffLines: 200, maxGrepResults: 100 },
    clients: [],
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
        id: 'anthropic-oauth',
        type: 'anthropic-oauth',
        baseUrl: 'https://api.anthropic.com/v1',
        apiKeys: ['oauth'],
        models: ['claude-opus-4-5-20251101', 'claude-sonnet-4-5-20250929'],
        weight: 6,
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
        apiKeys: ['gsk-GANTI_KEY_GROQ'],
        models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
        weight: 20,
        tags: ['fast', 'apikey'],
        status: 'pending'
      },
      {
        id: 'xai',
        type: 'openai',
        baseUrl: 'https://api.x.ai/v1',
        apiKeys: ['xai-GANTI_KEY_XAI'],
        models: ['grok-4.3', 'grok-4.20-0309-reasoning'],
        weight: 22,
        tags: ['apikey', 'smart'],
        status: 'pending'
      },
      {
        id: 'deepseek',
        type: 'openai',
        baseUrl: 'https://api.deepseek.com',
        apiKeys: ['sk-GANTI_KEY_DEEPSEEK'],
        models: ['deepseek-v4-flash', 'deepseek-v4-pro', 'deepseek-chat', 'deepseek-reasoner'],
        weight: 24,
        tags: ['cheap', 'apikey'],
        status: 'pending'
      },
      {
        id: 'mistral',
        type: 'openai',
        baseUrl: 'https://api.mistral.ai/v1',
        apiKeys: ['GANTI_KEY_MISTRAL'],
        models: ['mistral-small-latest', 'mistral-medium-latest', 'codestral-latest'],
        weight: 26,
        tags: ['free-tier', 'apikey'],
        status: 'pending'
      },
      {
        id: 'openrouter',
        type: 'openai',
        baseUrl: 'https://openrouter.ai/api/v1',
        apiKeys: ['sk-or-GANTI_KEY_OPENROUTER'],
        models: [
          'meta-llama/llama-3.3-70b-instruct:free',
          'meta-llama/llama-3.1-8b-instruct:free',
          'mistralai/mistral-7b-instruct:free',
          'google/gemma-2-9b-it:free'
        ],
        weight: 28,
        tags: ['free-tier', 'apikey'],
        status: 'pending'
      },
      {
        id: 'cerebras',
        type: 'openai',
        baseUrl: 'https://api.cerebras.ai/v1',
        apiKeys: ['csk-GANTI_KEY_CEREBRAS'],
        models: ['llama-3.3-70b', 'llama3.1-8b'],
        weight: 30,
        tags: ['free-tier', 'fast'],
        status: 'pending'
      },
      {
        id: 'perplexity',
        type: 'openai',
        baseUrl: 'https://api.perplexity.ai',
        apiKeys: ['pplx-GANTI_KEY_PERPLEXITY'],
        models: ['sonar-pro', 'sonar'],
        weight: 32,
        tags: ['apikey', 'web-search'],
        status: 'pending'
      },
      {
        id: 'cloudflare',
        type: 'openai',
        baseUrl: 'https://api.cloudflare.com/client/v4/accounts/GANTI_ACCOUNT_ID/ai/v1',
        apiKeys: ['GANTI_KEY_CLOUDFLARE'],
        models: [
          '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
          '@cf/meta/llama-3.1-8b-instruct'
        ],
        weight: 34,
        tags: ['free-tier', 'edge'],
        status: 'pending'
      },
      {
        id: 'github-models',
        type: 'openai',
        baseUrl: 'https://models.inference.ai.azure.com',
        apiKeys: ['ghp-GANTI_KEY_GITHUB'],
        models: ['gpt-4o-mini', 'gpt-4o', 'Phi-3.5-MoE-instruct'],
        weight: 36,
        tags: ['free-tier', 'apikey'],
        status: 'pending'
      },
      {
        id: 'huggingface',
        type: 'openai',
        baseUrl: 'https://router.huggingface.co/v1',
        apiKeys: ['hf-GANTI_KEY_HF'],
        models: ['meta-llama/Llama-3.3-70B-Instruct'],
        weight: 38,
        tags: ['free-tier', 'apikey'],
        status: 'pending'
      },
      {
        id: 'opencode-zen',
        type: 'openai',
        baseUrl: 'https://opencode.ai/zen/v1',
        apiKeys: ['public'],
        models: ['big-pickle', 'north-mini-code-free', 'nemotron-3-ultra-free'],
        weight: 4,
        tags: ['free-tier', 'anonymous'],
        status: 'pending'
      },
      {
        id: 'ollama',
        type: 'openai',
        baseUrl: 'http://localhost:11434/v1',
        apiKeys: ['ollama'],
        models: ['llama3.2', 'qwen2.5', 'deepseek-r1'],
        weight: 99,
        tags: ['local', 'free'],
        status: 'pending'
      }
    ]
  };
}

log('');
log(`${BOLD} Loka AI Router  Setup${RESET}`);
log(`${DIM}${RESET}`);
log('');

// 1. Cek Node.js
log(`${BOLD}[1/4]${RESET} Checking Node.js...`);
try {
  const v = execSync('node --version', { encoding: 'utf8' }).trim();
  const major = parseInt(v.replace('v', '').split('.')[0], 10);
  if (major < 20) {
    err(`Node.js ${v} too old. Need v20+`);
    log('Download: https://nodejs.org/');
    process.exit(1);
  }
  ok(`Node.js ${v}`);
} catch {
  err('Node.js not found');
  log('Download: https://nodejs.org/');
  process.exit(1);
}

// 2. Cek folder data
log('');
log(`${BOLD}[2/4]${RESET} Preparing folders...`);
const dataDir = join(HOME_DIR, 'data');
const backupDir = join(HOME_DIR, 'data', 'backups');
for (const dir of [HOME_DIR, dataDir, backupDir]) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}
ok('~/.config/loka/, data/, data/backups/');

// 3. Cek loka.json
log('');
log(`${BOLD}[3/4]${RESET} Checking config...`);

if (!existsSync(CFG_PATH)) {
  warn('loka.json tidak ada  bikin default...');
  const cfg = defaultConfig();
  cfg.clients = [{ name: 'default', key: generateKey(), tier: 'unlimited' }];
  writeFileSync(CFG_PATH, JSON.stringify(cfg, null, 2));
  ok('loka.json dibuat dengan API key random');
} else {
  const cfg = JSON.parse(readFileSync(CFG_PATH, 'utf8'));
  let dirty = false;

  // Fix clients
  if (!Array.isArray(cfg.clients) || !cfg.clients.length) {
    cfg.clients = [{ name: 'default', key: generateKey(), tier: 'unlimited' }];
    dirty = true;
  }
  cfg.clients = cfg.clients.filter(c =>
    c && typeof c.name === 'string' && c.name.trim() !== '' &&
    typeof c.key === 'string' && c.key.startsWith('sk-')
  );
  if (!cfg.clients.length) {
    cfg.clients = [{ name: 'default', key: generateKey(), tier: 'unlimited' }];
    dirty = true;
  }
  for (const c of cfg.clients) {
    if (typeof c.tier !== 'string') { c.tier = 'standard'; dirty = true; }
  }

  // AutoTunnel default
  if (cfg.autoTunnel === undefined) { cfg.autoTunnel = true; dirty = true; }

  if (dirty) {
    writeFileSync(CFG_PATH, JSON.stringify(cfg, null, 2));
    ok('Config dibersihin + API key di-generate');
  } else {
    ok('loka.json OK');
  }
}

// 4. Info
log('');
log(`${BOLD}[4/4]${RESET} Ready!`);
log('');

const cfg = JSON.parse(readFileSync(CFG_PATH, 'utf8'));
const port = cfg.port || 1455;
const key = cfg.clients && cfg.clients[0] ? cfg.clients[0].key : '-';

log(`${DIM}${RESET}`);
log(`${BOLD} Loka AI Router${RESET}`);
log(`${DIM}${RESET}`);
log(`  Local     : ${CYAN}http://localhost:${port}${RESET}`);
const ips = getLANIPs();
for (const { iface, ip } of ips) {
  log(`  LAN       : ${CYAN}http://${ip}:${port}${RESET} ${DIM}(${iface})${RESET}`);
}
log(`  Endpoint  : ${CYAN}http://localhost:${port}/v1${RESET}`);
log(`  API Key   : ${YELLOW}${key}${RESET}`);
log(`  Config    : ${DIM}${CFG_PATH}${RESET}`);
log(`${DIM}${RESET}`);
log('');
log(`${DIM}Starting server...${RESET}`);
log('');

// 5. Start server
const indexPath = join(PKG_DIR, 'index.js');
if (!existsSync(indexPath)) {
  err(`index.js tidak ditemukan di ${indexPath}`);
  err('Coba reinstall: npm install -g loka-ai-router@beta');
  process.exit(1);
}

const child = spawn(process.execPath, [indexPath], {
  stdio: 'inherit',
  cwd: process.cwd()
});

child.on('exit', (code) => process.exit(code || 0));
process.on('SIGINT', () => {
  child.kill('SIGINT');
  process.exit(0);
});